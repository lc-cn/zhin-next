// ============================================================================
// 插件类型定义
// ============================================================================


import {MaybePromise} from '@zhin.js/types'
import { Message, BeforeSendHandler, SendOptions} from "./types";
import {Dependency, Logger,} from "@zhin.js/hmr";
import {App} from "./app";
import {MessageCommand} from "./command";
import {Component} from "./component";
import { PluginError, MessageError, errorManager } from './errors';

/** 消息中间件函数 */
export type MessageMiddleware = (message: Message, next: () => Promise<void>) => MaybePromise<void>;


// ============================================================================
// Plugin 类
// ============================================================================

/**
 * 插件类：继承自Dependency，提供机器人特定功能
 */
export class Plugin extends Dependency<Plugin> {
    middlewares: MessageMiddleware[] = [];
    components: Map<string, Component<any, any, any>> = new Map();
    commands:MessageCommand[]=[];
    #logger?:Logger
    constructor(parent: Dependency<Plugin>, name: string, filePath: string) {
        super(parent, name, filePath);
        this.on('message.receive',this.#handleMessage.bind(this))
        this.addMiddleware(async (message,next)=>{
            for(const command of this.commands){
                const result=await command.handle(message);
                if(result) message.reply(result);
            }
            return next()
        });
        this.beforeSend((options)=>Component.render(this.components,options))
    }
    async #handleMessage(message: Message) {
        try {
            await this.#runMiddlewares(message, 0)
        } catch (error) {
            const messageError = new MessageError(
                `消息处理失败: ${(error as Error).message}`,
                message.id,
                message.channel.id,
                { pluginName: this.name, originalError: error }
            )
            
            await errorManager.handle(messageError)
            
            // 可选：发送错误回复给用户
            try {
                await message.reply('抱歉，处理您的消息时出现了错误。')
            } catch (replyError) {
                // 静默处理回复错误，避免错误循环
                // console.error 已替换为注释
            }
        }
    }

    async #runMiddlewares(message: Message, index: number): Promise<void> {
        if (index >= this.middlewares.length) return
        
        const middleware = this.middlewares[index]
        
        try {
            await middleware(message, () => this.#runMiddlewares(message, index + 1))
        } catch (error) {
            throw new PluginError(
                `中间件执行失败: ${(error as Error).message}`,
                this.name,
                { middlewareIndex: index, originalError: error }
            )
        }
    }

    beforeSend(handler:BeforeSendHandler){
        this.before('message.send',handler)
    }
    before(event:string,listener:(...args:any[])=>any){
        this.on(`before-${event}`,listener)
    }
    /** 获取所属的App实例 */
    get app(): App {
        return this.parent as App;
    }
    get logger(): Logger {
        if(this.#logger) return this.#logger
        const names = [this.name];
        let temp=this as Dependency<Plugin>
        while(temp.parent){
            names.unshift(temp.parent.name)
            temp=temp.parent
        }
        return this.#logger=this.app.getLogger(...names)
    }
    /** 添加组件 */
    addComponent<T = {}, D = {}, P = Component.Props<T>>(component:Component<T,D,P>){
        this.components.set(component.name,component);
    }
    /** 添加中间件 */
    addCommand(command:MessageCommand){
        this.commands.push(command);
        this.dispatch('command.add',command);
    }
    /** 添加中间件 */
    addMiddleware(middleware: MessageMiddleware): void {
        this.middlewares.push(middleware);
        this.dispatch('middleware.add',middleware)
    }



    /** 发送消息 */
    async sendMessage(options: SendOptions): Promise<void> {
        try {
            await this.app.sendMessage(options);
        } catch (error) {
            const messageError = new MessageError(
                `发送消息失败: ${(error as Error).message}`,
                undefined,
                (options as any).channel_id,
                { pluginName: this.name, sendOptions: options, originalError: error }
            )
            
            await errorManager.handle(messageError)
            throw messageError
        }
    }

    /** 销毁插件 */
    dispose(): void {
        try {
            // 移除所有中间件
            for (const middleware of this.middlewares) {
                this.dispatch('middleware.remove', middleware)
            }
            this.middlewares = []
            
            // 调用父类的dispose方法
            super.dispose()
        } catch (error) {
            const pluginError = new PluginError(
                `插件销毁失败: ${(error as Error).message}`,
                this.name,
                { originalError: error }
            )
            
            errorManager.handle(pluginError).catch(console.error)
            throw pluginError
        }
    }
}
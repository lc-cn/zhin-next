// ============================================================================
// 插件类型定义
// ============================================================================


import {MaybePromise} from '@zhin.js/types'
import { Message, BeforeSendHandler, SendOptions} from "./types";
import {Dependency, Logger,} from "@zhin.js/hmr";
import {App} from "./app";
import {MessageCommand} from "./command";
import {Component} from "./component";

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
    #handleMessage(message:Message){
        const next=async (index:number)=>{
            if(!this.middlewares[index]) return
            const middleware=this.middlewares[index]
            middleware(message,()=>next(index+1))
        }
        next(0)
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
    async sendMessage(options:SendOptions): Promise<void> {
        await this.app.sendMessage(options);
    }

    /** 销毁插件 */
    dispose(): void {
        // 移除所有中间件
        for (const middleware of this.middlewares) {
            this.dispatch('middleware.remove', middleware)
        }
        this.middlewares = []
        // 调用父类的dispose方法
        super.dispose()
    }
}
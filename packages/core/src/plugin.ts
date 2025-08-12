
// ============================================================================
// 插件类型定义
// ============================================================================


import {MaybePromise, Message, SendContent} from "./types";
import {Dependency, Logger} from "./hmr";
import {App,MessageChannel} from "./app";

/** 消息中间件函数 */
export type MessageMiddleware = (message: Message, next: () => Promise<void>) => MaybePromise<void>;

/** 事件监听器函数 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/** 定时任务配置 */
export interface CronJob {
    name: string;
    schedule: string; // cron 表达式
    handler: () => void | Promise<void>;
    enabled?: boolean;
}


// ============================================================================
// Plugin 类
// ============================================================================

/**
 * 插件类：继承自Dependency，提供机器人特定功能
 */
export class Plugin extends Dependency<Plugin> {
    middlewares: MessageMiddleware[] = [];
    eventListeners = new Map<string, EventListener[]>();
    cronJobs = new Map<string, CronJob>();

    #logger?:Logger
    constructor(parent: Dependency<Plugin>, name: string, filePath: string) {
        super(parent, name, filePath);
        this.on('message',this.#handleMessage.bind(this))
    }
    #handleMessage(message:Message){
        const next=async (index:number)=>{
            if(!this.middlewares[index]) return
            const middleware=this.middlewares[index]
            middleware(message,()=>next(index+1))
        }
        next(0)
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

    /** 添加中间件 */
    addMiddleware(middleware: MessageMiddleware): void {
        this.middlewares.push(middleware);
        this.dispatch('middleware.add',middleware)
        this.on('dispose',()=>{
            this.dispatch('middleware.remove',middleware)
        })
    }

    /** 添加事件监听器 */
    addEventListener<T = any>(event: string, listener: EventListener<T>): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(listener);
        this.dispatch('listener.add',event,listener)
        this.on('dispose',()=>{
            this.dispatch('listener.remove',event,listener)
        })
    }

    /** 添加定时任务 */
    addCronJob(job: CronJob): void {
        this.cronJobs.set(job.name, job);
        this.dispatch('cron-job.add',job)
        this.dispatch('listener.add',job)
        this.on('dispose',()=>{
            this.dispatch('cron-job.remove',job)
        })
    }
    /** 发送消息 */
    async sendMessage(channelId:MessageChannel, content: SendContent): Promise<void> {
        await this.app.sendMessage(channelId, content);
    }
}

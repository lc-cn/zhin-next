import {Bot} from "../bot.js";
import {Plugin} from '../plugin.js'
import * as process from 'node:process'
import {BotConfig, Message, MessageSegment, SendContent, SendMessageOptions} from "../types";
import {register, useLogger} from "../app";
import {EventEmitter} from "events";

export interface ProcessConfig extends BotConfig {
    context: 'process';
}
const logger=useLogger()
export class ProcessBot extends EventEmitter implements Bot<ProcessConfig>{
    connected?:boolean
    #listenInput:(data:Buffer<ArrayBufferLike>)=>void=function (this:ProcessBot,data){
        const content=data.toString().trim()
        const ts=Date.now()
        const message: Message = {
            id: `${ts}`,
            sender:{
                id:`${process.pid}`,
                name:process.title,
            },
            channel:{
                id:`${process.pid}`,
                type:'private'
            },
            content:[{type:'text',data:{text:content}}],
            raw:content,
            timestamp: ts,
            reply:async (content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
                if(!Array.isArray(content)) content=[content]
                if(quote) content.unshift({type:'reply',data:{id:typeof quote==="boolean"?message.id:quote}})
                this.plugin.dispatch('message.send',{
                    ...message.channel,
                    context:'process',
                    bot:`${process.pid}`
                },content)
            }
        };
        logger.info(`recv ${message.channel.type}(${message.channel.id}):${ProcessBot.contentToString(message.raw)}`)
        this.plugin.dispatch('message.receive',message)
    }

    constructor(private plugin:Plugin,public config:ProcessConfig) {
        super();
        this.#listenInput=this.#listenInput.bind(this)
    }
    async connect(): Promise<void> {
        process.stdin.on('data',this.#listenInput);
        this.connected=true
    }
    async disconnect(){
        process.stdin.off('data',this.#listenInput)
        this.connected=false
    }
    async getUser(user_id: string) {
        return {
            user_id,
            nickname:''
        }
    }
    async getGroup(group_id:string){
        return {
            group_id,
            group_name:'',
            member_count:0
        }
    }
    async sendMessage(options: SendMessageOptions){
        if(!this.connected) return
        logger.info(`send ${options.channel.type}(${options.channel.id}):${ProcessBot.contentToString(options.content)}`)
    }
}
export namespace ProcessBot{
    export function contentToString(content:SendContent):string{
        if(!Array.isArray(content)) content=[content]
        return content.map(item=>{
            if(typeof item==="string") return item
            if(item.type==='text') return item.data.text
            const {type,data}=item
            return `[${type}]:${JSON.stringify(data)}`
        }).join('')
    }
}
register({ // 注册上下文
    name:'process',
    async mounted(p){ // 这是上下文自身的挂载时机
        const result=new Map<string,ProcessBot>
        const bot=new ProcessBot(p,{
            context:'process',
            name:process.title,
        })
        result.set(`${process.pid}`,bot)
        await bot.connect()
        return result
    },
    async dispose(bots){
        for(const [,bot] of bots){
            await bot.disconnect()
        }
    }
})
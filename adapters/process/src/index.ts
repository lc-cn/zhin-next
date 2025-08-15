import {EventEmitter} from "events";
import * as process from 'node:process'
import {Bot,Adapter,Plugin,BotConfig,registerAdapter, useLogger, Message, SendOptions, MessageSegment, SendContent} from "zhin.js";

declare module '@zhin.js/types'{
    interface GlobalContext{
        process:Adapter<ProcessBot>
    }
}
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
                    bot:`${process.pid}`,
                    content
                })
            }
        };
        logger.info(`recv ${message.channel.type}(${message.channel.id}):${ProcessBot.contentToString(message.content)}`)
        this.plugin.dispatch('message.receive',message)
        this.plugin.dispatch(`message.${message.channel.type}.receive`,message)
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
    async sendMessage(options: SendOptions){
        options=await this.plugin.app.handleBeforeSend(options)
        if(!this.connected) return
        logger.info(`send ${options.type}(${options.id}):${ProcessBot.contentToString(options.content)}`)
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

registerAdapter(new Adapter('process',ProcessBot))
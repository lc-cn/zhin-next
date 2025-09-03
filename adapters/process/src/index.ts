import {EventEmitter} from "events";
import * as process from 'node:process'
import {
    Bot,
    Adapter,
    Plugin,
    BotConfig,
    registerAdapter,
    useLogger,
    Message,
    SendOptions,
    MessageSegment,
    SendContent,
    segment
} from "zhin.js";

declare module 'zhin.js'{
    interface RegisteredAdapters{
        process:Adapter<ProcessBot>
    }
}
export interface ProcessConfig extends BotConfig {
    context: 'process';
}
const logger=useLogger()
export class ProcessBot extends EventEmitter implements Bot<{content:string,ts:number},ProcessConfig>{
    $connected?:boolean
    #listenInput:(data:Buffer<ArrayBufferLike>)=>void=function (this:ProcessBot,data){
        const content=data.toString().trim()
        const ts=Date.now()
        const message =this.$formatMessage({content,ts});
        logger.info(`recv ${message.$channel.type}(${message.$channel.id}):${segment.raw(message.$content)}`)
        this.plugin.dispatch('message.receive',message)
        this.plugin.dispatch(`message.${message.$channel.type}.receive`,message)
    }

    constructor(private plugin:Plugin,public $config:ProcessConfig) {
        super();
        this.#listenInput=this.#listenInput.bind(this)
    }
    async $connect(): Promise<void> {
        process.stdin.on('data',this.#listenInput);
        this.$connected=true
    }
    async $disconnect(){
        process.stdin.off('data',this.#listenInput)
        this.$connected=false
    }
    $formatMessage({content,ts}:{content:string,ts:number}) {
        const message=Message.from({content,ts},{
            $id: `${ts}`,
            $adapter:'process',
            $bot:`${this.$config.name}`,
            $sender:{
                id:`${process.pid}`,
                name:process.title,
            },
            $channel:{
                id:`${process.pid}`,
                type:'private'
            },
            $content:[{type:'text',data:{text:content}}],
            $raw:content,
            $timestamp: ts,
            $reply:async (content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
                if(quote) content.unshift({type:'reply',data:{id:typeof quote==="boolean"?message.$id:quote}})
                this.plugin.dispatch('message.send',{
                    ...message.$channel,
                    context:'process',
                    bot:`${process.pid}`,
                    content
                })
            }
        })
        return message
    }

    async $sendMessage(options: SendOptions){
        options=await this.plugin.app.handleBeforeSend(options)
        if(!this.$connected) return
        logger.info(`send ${options.type}(${options.id}):${segment.raw(options.content)}`)
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
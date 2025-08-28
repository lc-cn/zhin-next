import { Client, PrivateMessageEvent,MessageSegment as MessageElem,ChannelMessageEvent, Sendable} from "kook-client";
import path from "path";
import {Bot,BotConfig,Adapter,Plugin,registerAdapter, Message, SendOptions, MessageSegment, SendContent} from "zhin.js";
declare module '@zhin.js/types'{
    interface GlobalContext{
        kook:Adapter<KookBot>
    }
}
export interface KookBotConfig extends BotConfig,Client.Config{
    context:'kook'
    name:`${number}`
}
export interface KookBot{
    readonly config:Required<KookBotConfig>
}
export class KookBot extends Client implements Bot<Required<KookBotConfig>>{
    connected?:boolean
    constructor(private plugin:Plugin,config:KookBotConfig) {
        if(!config.data_dir) config.data_dir=path.join(process.cwd(),'data')
        super(config);
    }
    private handleKookMessage(msg: PrivateMessageEvent|ChannelMessageEvent): void {
        const message: Message = {
            id: msg.message_id.toString(),
            adapter:'kook',
            bot:`${this.config.name}`,
            sender:{
                id:msg.author_id.toString(),
                name:msg.author.info.nickname.toString(),
            },
            channel:{
                id:msg.message_type==='channel'?msg.channel_id.toString():msg.author_id.toString(),
                type:msg.message_type
            },
            content: KookBot.toSegments(msg.message),
            raw: msg.raw_message,
            timestamp: msg.timestamp,
            reply:async (content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
                if(quote) content.unshift({type:'reply',data:{id:typeof quote==="boolean"?message.id:quote}})
                this.plugin.dispatch('message.send',{
                    ...message.channel,
                    context:'kook',
                    bot:`${this.config.name}`,
                    content
                })
            }
        };
        this.plugin.dispatch('message.receive',message)
        this.plugin.logger.info(`recv ${message.channel.type}(${message.channel.id}):${msg.raw_message}`)
        this.plugin.dispatch(`message.${message.channel.type}.receive`,message)
    }
    async connect(): Promise<void> {
        await super.connect()
        this.on('message',(m)=>this.handleKookMessage(m))
        this.connected=true
    }

    async disconnect(): Promise<void> {
        await super.disconnect()
        this.connected=false;
    }

    async sendMessage(options: SendOptions): Promise<void> {
        options=await this.plugin.app.handleBeforeSend(options)
        switch (options.type){
            case 'private':{
                const result= await this.sendPrivateMsg(options.id,KookBot.toSendable(options.content))
                this.plugin.logger.info(`send ${options.type}(${options.id}):${result['msg_id' as 'message_id']}`)
                break;
            }
            case "channel":{
                const result=await this.sendChannelMsg(options.id,KookBot.toSendable(options.content))
                this.plugin.logger.info(`send ${options.type}(${options.id}):${result['msg_id' as 'message_id']}`)
                break;
            }
            default:
                throw new Error(`unsupported channel type ${options.type}`)
        }
    }

}
export namespace KookBot{
    export function toSegments(message:Sendable):MessageSegment[]{
        if(!Array.isArray(message)) message=[message]
        return message.map((item):MessageSegment=>{
            if(typeof item==="string") return {type:'text',data:{text:item}}
            const {type,...data}=item
            return {type:type==='markdown'?'text':type,data}
        })
    }
    export function toSendable(content:SendContent):Sendable{
        if(!Array.isArray(content)) content=[content]
        return content.map((segment):MessageElem=>{
            if(typeof segment==="string") return {type:'text',text:segment}
            const {type,data}=segment
            return {type,...data} as MessageElem
        })
    }
}
registerAdapter(new Adapter('kook',KookBot))
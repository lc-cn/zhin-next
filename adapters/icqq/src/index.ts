import { Config, Client, PrivateMessageEvent, GroupMessageEvent, Sendable, MessageElem} from "@lc-cn/icqq";
import path from "path";
import {Bot,BotConfig,Adapter,Plugin,registerAdapter, Message, SendOptions, MessageSegment, SendContent} from "zhin.js";
declare module '@zhin.js/types'{
    interface GlobalContext{
        icqq:Adapter<IcqqBot>
    }
}
export interface IcqqBotConfig extends BotConfig,Config{
    context:'icqq'
    name:`${number}`
    password?:string
    scope?:string
}
export interface IcqqBot{
    readonly config:Required<IcqqBotConfig>
}
export class IcqqBot extends Client implements Bot<Required<IcqqBotConfig>>{
    connected?:boolean
    constructor(private plugin:Plugin,config:IcqqBotConfig) {
        if(!config.scope) config.scope='lc-cn'
        if(!config.data_dir) config.data_dir=path.join(process.cwd(),'data')
        if(config.scope.startsWith('@')) config.scope=config.scope.slice(1)
        super(config);
    }
    private handleIcqqMessage(msg: PrivateMessageEvent|GroupMessageEvent): void {
        const message: Message = {
            id: msg.message_id.toString(),
            adapter:'icqq',
            bot:`${this.config.name}`,
            sender:{
                id:msg.sender.user_id.toString(),
                name:msg.sender.nickname.toString(),
            },
            channel:{
                id:msg.message_type==='group'?msg.group_id.toString():msg.from_id.toString(),
                type:msg.message_type
            },
            content: IcqqBot.toSegments(msg.message),
            raw: msg.raw_message,
            timestamp: msg.time,
            reply:async (content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
                if(!Array.isArray(content)) content=[content]
                if(quote) content.unshift({type:'reply',data:{id:typeof quote==="boolean"?message.id:quote}})
                this.plugin.dispatch('message.send',{
                    ...message.channel,
                    context:'icqq',
                    bot:`${this.uin}`,
                    content
                })
            }
        };
        this.plugin.dispatch('message.receive',message)
        this.plugin.logger.info(`recv ${message.channel.type}(${message.channel.id}):${IcqqBot.contentToString(message.content)}`)
        this.plugin.dispatch(`message.${message.channel.type}.receive`,message)
    }
    async connect(): Promise<void> {
        this.on('message',this.handleIcqqMessage.bind(this))
        this.on('system.login.device',(e:unknown)=>{
            this.sendSmsCode()
            process.stdin.once('data',(data)=>{
                this.submitSmsCode(data.toString().trim())
            })
        })
        this.on('system.login.qrcode',(e:unknown)=>{
            process.stdin.once('data',()=>{
                this.login()
            })
        })
        this.on('system.login.slider',()=>{
            process.stdin.once('data',(e)=>{
                this.submitSlider(e.toString().trim())
            })
        })
        return new Promise((resolve)=>{
            this.once('system.online',()=>{
                this.connected=true;
                resolve()
            })
            this.login(Number(this.config.name),this.config.password)
        })
    }

    async disconnect(): Promise<void> {
        await this.logout()
        this.connected=false;
    }

    async sendMessage(options: SendOptions): Promise<void> {
        options=await this.plugin.app.handleBeforeSend(options)
        this.plugin.logger.info(`send ${options.type}(${options.id}):`,options.content)
        switch (options.type){
            case 'private':
                await this.sendPrivateMsg(Number(options.id),IcqqBot.toSendable(options.content))
                break;
            case "group":
                await this.sendGroupMsg(Number(options.id),IcqqBot.toSendable(options.content))
                break;
            default:
                throw new Error(`unsupported channel type ${options.type}`)
        }
    }

}
export namespace IcqqBot{
    export function toSegments(message:Sendable):MessageSegment[]{
        if(!Array.isArray(message)) message=[message]
        return message.map((item):MessageSegment=>{
            if(typeof item==="string") return {type:'text',data:{text:item}}
            const {type,...data}=item
            return {type,data}
        })
    }
    export function toSendable(content:SendContent):Sendable{
        if(!Array.isArray(content)) content=[content]
        return content.map((segment):MessageElem=>{
            if(typeof segment==="string") return {type:'text',text:segment}
            const {type,data}=segment
            console.log(segment)
            return {type,...data} as MessageElem
        })
    }
    export function contentToString(content:MessageSegment[]){
        return content.map((item=>{
            if(item.type==='text') return item.data.text
            return `${item.type}`
        })).join('')
    }
}
registerAdapter(new Adapter('icqq',IcqqBot))
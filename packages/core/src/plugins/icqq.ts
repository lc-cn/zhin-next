import { Config, Client, PrivateMessageEvent, GroupMessageEvent, Sendable, MessageElem} from "@lc-cn/icqq";
import path from "path";
import {Bot} from "../bot.js";
import {BotConfig, Message, MessageSegment, SendContent, SendMessageOptions} from "../types.js";
import {register, useLogger} from '../app.js';
import {Plugin} from "../plugin.js";
import process from "node:process";

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
                this.plugin.dispatch('message.send','process',`${this.uin}`,message.channel,content)
            }
        };
        this.plugin.dispatch('message.receive',message)
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

    async sendMessage(options: SendMessageOptions): Promise<void> {
        switch (options.channel.type){
            case 'private':
                await this.sendPrivateMsg(Number(options.channel.id),IcqqBot.toSendable(options.content))
                break;
            case "group":
                await this.sendGroupMsg(Number(options.channel.id),IcqqBot.toSendable(options.content))
                break;
            default:
                throw new Error(`unsupported channel type ${options.channel.type}`)
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
            return {type,...data} as MessageElem
        })
    }
}
const logger=useLogger()
register({
    name:'icqq',
    async mounted(p){
        const bots=new Map<string,IcqqBot>()
        const configs=p.app.getConfig().bots?.filter(c=>c.context==='icqq')
        if(!configs?.length) return bots
        for(const config of configs){
            const bot=new IcqqBot(p,config as IcqqBotConfig)
            await bot.connect()
            logger.info(`bot ${config.name} for icqq connected`);
            bots.set(config.name,bot);
        }
        logger.info(`context icqq mounted`)
        return bots
    },
    async dispose(bots){
        for(const [name,bot] of bots){
            await bot.disconnect()
            logger.info(`bot ${name} for icqq disconnectd`)
        }
        logger.info(`context icqq disposed`)
    }
})
import {createClient, Config, Client, PrivateMessageEvent, GroupMessageEvent, Sendable, MessageElem} from "@lc-cn/icqq";
import path from "path";
import {Bot} from "../bot.js";
import {BotConfig, Group, Message, MessageSegment, SendContent, SendMessageOptions, User} from "../types.js";
import {register, useLogger} from '../app.js';

export interface IcqqBotConfig extends BotConfig,Config{
    adapter:'icqq'
    name:`${number}`
    password?:string
    scope?:string
}
export class IcqqBot extends Bot<IcqqBotConfig>{
    #internal?:Client
    constructor(config:IcqqBotConfig) {
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
            reply:(content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
                if(!Array.isArray(content)) content=[content]
                if(quote) content.unshift({type:'reply',data:{id:typeof quote==="boolean"?message.id:quote}})
                return this.sendMessage({
                    channel:message.channel,
                    content
                })
            }
        };
        this.handleMessage(message);
    }
    async connect(): Promise<void> {
        if(this.#internal) throw new Error(`${this.name} has connected`)
        const client=this.#internal=createClient(this.config)
        client.on('message',this.handleIcqqMessage.bind(this))
        client.on('system.login.device',(e:unknown)=>{
            client.sendSmsCode()
            process.stdin.once('data',(data)=>{
                client.submitSmsCode(data.toString().trim())
            })
        })
        client.on('system.login.qrcode',(e:unknown)=>{
            process.stdin.once('data',()=>{
                client.login()
            })
        })
        client.on('system.login.slider',()=>{
            process.stdin.once('data',(e)=>{
                client.submitSlider(e.toString().trim())
            })
        })
        return new Promise((resolve)=>{
            client.once('system.online',()=>{
                this.connected=true
                resolve()
            })
            client.login(Number(this.name),this.config.password)
        })
    }

    async disconnect(): Promise<void> {
        if(!this.#internal) throw new Error(`${this.name} has no connect`)
        return this.#internal.logout()
    }

    async getGroup(groupId: string): Promise<Group> {
        const groupInfo=await this.#internal?.getGroupInfo(Number(groupId));
        if(!groupInfo) throw new Error(`can't find group ${groupId}`)
        return {
            group_id:groupId,
            group_name:groupInfo.group_name,
            member_count:groupInfo.member_count

        }
    }

    async getUser(user_id: string): Promise<User> {
        const userInfo=await this.#internal?.getStrangerInfo(Number(user_id))
        if(!userInfo) throw new Error(`can't find user ${user_id}`)
        return {
            user_id,
            nickname:userInfo.nickname
        }
    }

    async sendMessage(options: SendMessageOptions): Promise<void> {
        switch (options.channel.type){
            case 'private':
                await this.#internal?.sendPrivateMsg(Number(options.channel.id),IcqqBot.toSendable(options.content))
                break;
            case "group":
                await this.#internal?.sendGroupMsg(Number(options.channel.id),IcqqBot.toSendable(options.content))
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
        const configs=p.app.getConfig().bots?.filter(c=>c.adapter==='icqq')
        if(!configs?.length) return bots
        for(const config of configs){
            const bot=new IcqqBot(config as IcqqBotConfig)
            await bot.connect()
            bot.on('message',(m)=>p.dispatch('message',m))
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
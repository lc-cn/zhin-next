import { Config, Client, PrivateMessageEvent, GroupMessageEvent, Sendable, MessageElem} from "@icqqjs/icqq";
import path from "path";
import {Bot,BotConfig,useContext,Adapter,Plugin,registerAdapter, Message, SendOptions, MessageSegment, SendContent} from "zhin.js";
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
        if(!config.scope) config.scope='icqqjs'
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
        this.plugin.logger.info(`recv ${message.channel.type}(${message.channel.id}):${msg.raw_message}`)
        this.plugin.dispatch(`message.${message.channel.type}.receive`,message)
    }
    async connect(): Promise<void> {
        this.on('message',this.handleIcqqMessage.bind(this))
        this.on('system.login.device',async (e:unknown)=>{
            await this.sendSmsCode()
            this.plugin.logger.info('请输入短信验证码:')
            process.stdin.once('data',(data)=>{
                this.submitSmsCode(data.toString().trim())
            })
        })
        this.on('system.login.qrcode',(e)=>{
            this.plugin.logger.info(`取码地址：${e.image}\n请扫码完成后回车继续:`)
            process.stdin.once('data',()=>{
                this.login()
            })
        })
        this.on('system.login.slider',(e)=>{
            this.plugin.logger.info(`取码地址：${e.url}\n请输入滑块验证ticket:`)
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
        switch (options.type){
            case 'private':{
                const result= await this.sendPrivateMsg(Number(options.id),IcqqBot.toSendable(options.content))
                this.plugin.logger.info(`send ${options.type}(${options.id}):${result.message_id}`)
                break;
            }
            case "group":{
                const result=await this.sendGroupMsg(Number(options.id),IcqqBot.toSendable(options.content))
                this.plugin.logger.info(`send ${options.type}(${options.id}):${result.message_id}`)
                break;
            }
            default:
                throw new Error(`unsupported channel type ${options.type}`)
        }
    }

}
export namespace IcqqBot{
    export function toSegments(message:Sendable):MessageSegment[]{
        if(!Array.isArray(message)) message=[message]
        return message.filter((item,index)=>{
            return typeof item==="string"||(item.type!=='long_msg'||index!==0)
        }).map((item):MessageSegment=>{
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
registerAdapter(new Adapter('icqq',IcqqBot))

useContext('web', (web) => {
    // 注册ICQQ适配器的客户端入口文件
    const clientEntryPath = path.resolve(import.meta.dirname, '../client/index.ts')
    web.addEntry(clientEntryPath)
});
useContext('router','icqq', (router,icqq) => {
    console.log('🚀 ICQQ路由正在注册...')
    console.log('📊 当前机器人数量:', icqq.bots.size)
    
    router.get('/api/icqq/bots', (ctx) => {
        console.log('📞 收到ICQQ机器人数据请求')
        
        try {
            const bots = Array.from(icqq.bots.values())
            console.log('🤖 找到机器人:', bots.length, '个')
            
            const result = bots.map(bot => {
                console.log('📋 处理机器人:', bot.config.name, '连接状态:', bot.connected)
                return {
                    name: bot.config.name,
                    connected: bot.connected,
                    groupCount: bot.gl?.size || 0,
                    friendCount: bot.fl?.size || 0,
                    receiveCount: bot.stat?.recv_msg_cnt || 0,
                    sendCount: bot.stat?.sent_msg_cnt || 0,
                    loginMode: bot.config.password ? 'password' : 'qrcode'
                }
            })
            
            console.log('✅ 返回机器人数据:', result)
            ctx.body = result
        } catch (error) {
            console.error('❌ 获取ICQQ机器人数据失败:', error)
            ctx.status = 500
            ctx.body = { error: '获取机器人数据失败', message: (error as Error).message }
        }
    })
    
    console.log('✅ ICQQ路由注册完成')
})
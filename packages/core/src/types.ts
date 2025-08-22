import {MaybePromise}from '@zhin.js/types'

export interface MessageSegment<T extends keyof Segment=keyof Segment> {
  type: T;
  data: Segment[T];
}
export interface Segment{
  [key:string]:Record<string, any>
  any:Record<string, any>
}
export type MaybeArray<T>=T|T[]
export type SendContent=MaybeArray<string|MessageSegment>
export interface MessageSender{
  id: string;
  name?: string;
}
export type MessageComponent<T extends object>=(props:T&{children:SendContent})=>MaybePromise<SendContent>
export interface MessageChannel{
  id: string;
  type: 'group' | 'private' | 'channel';
}
export interface Message {
  id: string;
  adapter:string
  bot:string
  content: MessageSegment[];
  sender: MessageSender;
  reply(content:SendContent,quote?:boolean|string):Promise<void>
  channel: MessageChannel;
  timestamp: number;
  raw: string;
}

export interface User {
  user_id: string;
  nickname: string;
  card?: string;
  role?: string;
}

export interface Group {
  group_id: string;
  group_name: string;
  member_count: number;
}

export interface BotConfig {
  name: string;
  context: string;
  [key: string]: any;
}



export interface AppConfig {
  /** 机器人配置列表 */
  bots?: BotConfig[];
  /** 插件目录列表，默认为 ['./plugins', 'node_modules'] */
  plugin_dirs?: string[];
  /** 需要加载的插件列表 */
  plugins?: string[];
  /** 禁用的依赖列表 */
  disable_dependencies?: string[];
  /** 是否启用调试模式 */
  debug?: boolean;
}
export type DefineConfig<T> = T | ((env:Record<string,string>)=>MaybePromise<T>);

export interface SendOptions extends MessageChannel{
  context:string
  bot:string
  content:SendContent
}
export type BeforeSendHandler=(options:SendOptions)=>MaybePromise<SendOptions|void>
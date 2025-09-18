import {MaybePromise}from '@zhin.js/types'
import {MessageChannel} from "./message.js";
import {Database} from "./database.js";
import {Adapter} from "./adapter.js";
import {Bot,BotConfig} from "./bot.js";
declare module '@zhin.js/types'{
  interface GlobalContext extends RegisteredAdapters{}
}
export interface RegisteredAdapters extends Record<string, Adapter>{

}
export type ObjectItem<T extends object>=T[keyof T]
export type RegisteredAdapter=keyof RegisteredAdapters
export type AdapterMessage<T extends keyof RegisteredAdapters=keyof RegisteredAdapters>=RegisteredAdapters[T] extends Adapter<infer R>?BotMessage<R>:{}
export type AdapterConfig<T extends keyof RegisteredAdapters=keyof RegisteredAdapters>=RegisteredAdapters[T] extends Adapter<infer R>?PlatformConfig<R>:BotConfig
export type PlatformConfig<T>=T extends Bot<infer L,infer R>?R:BotConfig
export type BotMessage<T extends Bot>=T extends Bot<infer R>?R:{}
export interface MessageSegment {
  type: string;
  data: Record<string, any>;
}
export type MaybeArray<T>=T|T[]
export type SendContent=MaybeArray<string|MessageSegment>
export interface MessageSender{
  id: string;
  name?: string;
}
export type Dict<V=any,K extends string|symbol=string>=Record<K, V>;
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



export interface AppConfig {
  /** 机器人配置列表 */
  bots?: BotConfig[];
  /** 数据库配置列表 */
  databases?: Database.Config;
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
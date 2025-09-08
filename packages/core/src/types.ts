import {MaybePromise}from '@zhin.js/types'
import {MessageChannel} from "./message.js";
import {Adapter} from "./adapter.js";
import {Bot} from "./bot.js";
declare module '@zhin.js/types'{
  interface GlobalContext extends RegisteredAdapters{}
}
/**
 * 注册的适配器接口
 * 每个适配器模块通过声明合并来注册：RegisteredAdapters[key] = Adapter<BotClass>
 */
export interface RegisteredAdapters {
  // 适配器会通过模块声明合并来扩展这个接口
  // 例如: 'icqq': Adapter<IcqqBot>
}

/**
 * 从注册的适配器中提取 Bot 的配置类型
 */
export type ExtractBotConfig<T> = T extends Adapter<infer B> 
  ? B extends Bot<infer L,infer R>
    ? R
    : BaseBotConfig
  : BaseBotConfig

/**
 * 根据 context 推导 BotConfig 类型的条件类型
 */
export type InferBotConfig<T extends string> = T extends keyof RegisteredAdapters 
  ? ExtractBotConfig<RegisteredAdapters[T]>
  : BaseBotConfig

export type ObjectItem<T extends object>=T[keyof T]
export type RegisteredAdapter=keyof RegisteredAdapters | string
export type AdapterMessage<T>=any // 简化为 any，避免复杂的类型推导
export type AdapterConfig<T>=any // 简化为 any，避免复杂的类型推导
export type InferBorMessage<T extends Bot>=T extends Bot<infer R>?R:{}
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

/**
 * 基础 Bot 配置接口
 */
export interface BaseBotConfig {
  /** 适配器上下文名称 */
  context: string
  /** Bot 实例名称，必须唯一 */
  name: string
}

/**
 * Bot 配置类型 - 根据 context 自动推导配置类型
 * 当适配器注册了类型时，会自动提供对应的配置类型
 */
export type BotConfig = keyof RegisteredAdapters extends never
  ? BaseBotConfig  // 如果没有注册任何适配器，使用基础类型
  : {
      [K in keyof RegisteredAdapters]: ExtractBotConfig<RegisteredAdapters[K]>
    }[keyof RegisteredAdapters] | BaseBotConfig  // 支持未注册的适配器

/**
 * 创建 Bot 配置的辅助类型
 * @template T 适配器名称
 */
export type CreateBotConfig<T extends string> = T extends keyof RegisteredAdapters
  ? ExtractBotConfig<RegisteredAdapters[T]>
  : BaseBotConfig & { context: T }

/**
 * 常用配置类型示例
 */
export interface CommonBotConfig extends BaseBotConfig {
  /** 是否自动重连 */
  autoReconnect?: boolean
  /** 重连间隔（毫秒） */
  reconnectInterval?: number
  /** 是否启用调试模式 */
  debug?: boolean
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
import {BotConfig} from "./types";
import {Bot} from "./bot";
import {Plugin} from "./plugin";
export class Adapter<R extends Bot=Bot>{
    public bots:Map<string,R>=new Map<string, R>()
    #botFactory:Adapter.BotFactory<R>
    constructor(public name:string,botFactory:Adapter.BotFactory<R>) {
        this.#botFactory=botFactory
    }
    async start(plugin:Plugin){
        const configs=plugin.app.getConfig().bots?.filter(c=>c.context===this.name)
        if(!configs?.length) return
        try {
            for(const config of configs){
                let bot: R
                if (Adapter.isBotConstructor(this.#botFactory)) {
                    bot = new this.#botFactory(plugin,config) as R
                } else {
                    bot = this.#botFactory(plugin,config) as R
                }
                try {
                    await bot.$connect()
                    plugin.logger.info(`bot ${config.name} of adapter ${this.name} connected`)
                    this.bots.set(config.name,bot)
                } catch (error) {
                    // 如果连接失败，确保错误正确传播
                    throw error
                }
            }

            plugin.logger.info(`adapter ${this.name} started`)
        } catch (error) {
            // 确保错误正确传播
            throw error
        }
    }
    async stop(plugin:Plugin){
        try {
            for(const [name,bot] of this.bots){
                try {
                    await bot.$disconnect()
                    plugin.logger.info(`bot ${name} of adapter ${this.name} disconnected`)
                    this.bots.delete(name)
                } catch (error) {
                    // 如果断开连接失败，确保错误正确传播
                    throw error
                }
            }
            plugin.logger.info(`adapter ${this.name} stopped`)
        } catch (error) {
            // 确保错误正确传播
            throw error
        }
    }
}
export namespace Adapter {
    export type BotBotConstructor<T extends Bot>=T extends Bot<infer F,infer S> ? {
        new(plugin:Plugin,config:S):T
    }: {
        new(plugin:Plugin,config:BotConfig):T
    }
    export function isBotConstructor<T extends Bot>(fn: BotFactory<T>): fn is BotBotConstructor<T> {
        return fn.prototype &&
            fn.prototype.constructor === fn
    }
    export type BotCreator<T extends Bot>=T extends Bot<infer F,infer S> ? (plugin:Plugin,config: S) => T : (plugin:Plugin,config: BotConfig) => T
    export type BotFactory<T extends Bot> = BotBotConstructor<T>|BotCreator<T>
}
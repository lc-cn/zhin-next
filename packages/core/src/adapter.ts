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
        for(const config of configs){
            let bot: R
            if (Adapter.isBotConstructor(this.#botFactory)) {
                bot = new this.#botFactory(plugin,config) as R
            } else {
                bot = this.#botFactory(plugin,config) as R
            }
            await bot.connect()
            plugin.logger.info(`bot ${config.name} of adapter ${this.name} connected`)
            this.bots.set(config.name,bot)
        }

        plugin.logger.info(`adapter ${this.name} started`)
    }
    async stop(plugin:Plugin){
        for(const [name,bot] of this.bots){
            await bot.disconnect()
            plugin.logger.info(`bot ${name} of adapter ${this.name} disconnected`)
            this.bots.delete(name)
        }
        plugin.logger.info(`adapter ${this.name} stopped`)
    }
}
export namespace Adapter {
    export type BotBotConstructor<T extends Bot>=T extends Bot<infer R> ? {
        new(plugin:Plugin,config:R):T
    }: {
        new(plugin:Plugin,config:BotConfig):T
    }
    export function isBotConstructor<T extends Bot>(fn: BotFactory<T>): fn is BotBotConstructor<T> {
        return fn.prototype &&
            fn.prototype.constructor === fn
    }
    export type BotCreator<T extends Bot>=T extends Bot<infer R> ? (plugin:Plugin,config: R) => T : (plugin:Plugin,config: BotConfig) => T
    export type BotFactory<T extends Bot> = BotBotConstructor<T>|BotCreator<T>
}
import type {BotConfig, SendOptions} from "./types";

export interface Bot<T extends BotConfig=BotConfig> {
    config: T;
    connected?: boolean;
    connect():Promise<void>
    disconnect():Promise<void>
    sendMessage(options: SendOptions): Promise<void>
}
import type {RegisteredAdapters, SendOptions,AdapterConfig} from "./types.js";
import {Message} from "./message.js";
export interface Bot<M extends object={},T extends BotConfig=BotConfig> {
    $config: T;
    $connected?: boolean;
    $formatMessage(message:M):Message<M>
    $connect():Promise<void>
    $disconnect():Promise<void>
    $sendMessage(options: SendOptions): Promise<void>
}
export interface BotConfig{
    context:string
    name:string
    [key:string]:any
}
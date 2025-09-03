import type {BotConfig, SendOptions} from "./types";
import {Message} from "./message.js";
export interface Bot<M extends object={},T extends BotConfig=BotConfig> {
    $config: T;
    $connected?: boolean;
    $formatMessage(message:M):Message<M>
    $connect():Promise<void>
    $disconnect():Promise<void>
    $sendMessage(options: SendOptions): Promise<void>
}
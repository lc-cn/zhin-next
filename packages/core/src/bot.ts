import type {BotConfig, SendMessageOptions} from "./types";

export interface Bot<T extends BotConfig=BotConfig> {
    config: T;
    connected?: boolean;
    sendMessage(options: SendMessageOptions): Promise<void>
}
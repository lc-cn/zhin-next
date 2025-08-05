import type {BotConfig, Group, Message, SendMessageOptions, User} from "./types";
import {EventEmitter} from "node:events";

/** 适配器工厂函数 */
export type BotConstructor<T extends BotConfig = BotConfig> = {
    new(config:T):Bot<T>
}
export abstract class Bot<T extends BotConfig=BotConfig> extends EventEmitter {
    public config: T;
    public connected: boolean = false;

    constructor(config: T) {
        super();
        this.config = config;
    }
    get name(){
        return this.config.name
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendMessage(options: SendMessageOptions): Promise<void>;
    abstract getUser(userId: string): Promise<User>;
    abstract getGroup(groupId: string): Promise<Group>;

    protected handleMessage(message: Message) {
        this.emit('message', message);
        this.emit(`message.${message.channel.type}`, message);
    }

    protected handleConnect() {
        this.connected = true;
        this.emit('connect');
    }

    protected handleDisconnect() {
        this.connected = false;
        this.emit('disconnect');
    }

    protected handleError(error: Error) {
        this.emit('adapter.error', error);
    }
}
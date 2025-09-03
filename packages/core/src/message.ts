import {MaybePromise} from "@zhin.js/types";
import {MessageSegment, MessageSender, RegisteredAdapter, SendContent} from "./types";

export type MessageComponent<T extends object>=(props:T&{children:SendContent})=>MaybePromise<SendContent>
export interface MessageChannel{
    id: string;
    type: MessageType;
}
export type MessageType = 'group' | 'private' | 'channel'
export interface MessageBase {
    $id: string;
    $adapter:string
    $bot:string
    $content: MessageSegment[];
    $sender: MessageSender;
    $reply(content:SendContent,quote?:boolean|string):Promise<void>
    $channel: MessageChannel;
    $timestamp: number;
    $raw: string;
}
export type Message<T extends object={}>=MessageBase&T;
export namespace Message{
    export function from<T extends object>(input:T,format:MessageBase):Message<T>{
        return Object.assign(input,format)
    }
}
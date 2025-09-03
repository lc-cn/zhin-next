import {MatchResult, SegmentMatcher} from "segment-matcher";
import {AdapterMessage, RegisteredAdapters, SendContent} from "./types.js";
import type {Message} from "./message.js";
import {MaybePromise} from "@zhin.js/types";

export class MessageCommand<T extends keyof RegisteredAdapters=keyof RegisteredAdapters> extends SegmentMatcher{
    #callbacks:MessageCommand.Callback<T>[]=[];
    #checkers:MessageCommand.Checker<T>[]=[]
    scope<R extends T>(...scopes:R[]):MessageCommand<R>{
        this.#checkers.push((m)=>(scopes as string[]).includes(m.$adapter))
        return this as MessageCommand<R>
    }
    action(callback:MessageCommand.Callback<T>){
        this.#callbacks.push(callback)
        return this as MessageCommand<T>;
    }
    async handle(message:Message<AdapterMessage<T>>):Promise<SendContent|undefined>{
        for(const check of this.#checkers){
            const result=await check(message)
            if(!result) return;
        }
        const matched=this.match(message.$content);
        if(!matched) return
        for(const handler of this.#callbacks){
            const result=await handler(message,matched)
            if(result) return result
        }
    }
}
export namespace MessageCommand{
    export type Callback<T extends keyof RegisteredAdapters>=(message:Message<AdapterMessage<T>>,result:MatchResult)=>MaybePromise<SendContent|void>;
    export type Checker<T extends keyof RegisteredAdapters>=(message:Message<AdapterMessage<T>>)=>MaybePromise<boolean>
}
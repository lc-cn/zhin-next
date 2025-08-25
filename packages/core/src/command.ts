import {MatchResult, SegmentMatcher} from "segment-matcher";
import {Message, SendContent} from "./types";
import {MaybePromise} from "@zhin.js/types";

export class MessageCommand extends SegmentMatcher{
    #callbacks:MessageCommand.Callback[]=[];
    action(callback:MessageCommand.Callback){
        this.#callbacks.push(callback)
        return this;
    }
    async handle(message:Message):Promise<SendContent|undefined>{
        const matched=this.match(message.content);
        if(!matched) return
        for(const handler of this.#callbacks){
            const result=await handler(message,matched)
            if(result) return result
        }
    }
}
export namespace MessageCommand{
    export type Callback=(message:Message,result:MatchResult)=>MaybePromise<SendContent|void>;

}
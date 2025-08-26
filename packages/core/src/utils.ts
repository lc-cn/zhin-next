import {Dict, MessageSegment, SendContent} from "./types";

export function getValueWithRuntime(template: string, ctx: Dict) {
    const result = evaluate(template, ctx);
    if (result === `return(${template})`) return template;
    return result;
}
export const evaluate = <S, T = any>(exp: string, context: S) => execute<S, T>(`return(${exp})`, context);
const evalCache: Record<string, Function> = Object.create(null);
export const execute = <S, T = any>(exp: string, context: S):T => {
    const fn = evalCache[exp] || (evalCache[exp] = toFunction(exp));
    try {
        return fn.apply(context, [context]);
    } catch {
        return exp as T;
    }
};

const toFunction = (exp: string): Function => {
    try {
        return new Function(`$data`, `with($data){${exp}}`);
    } catch {
        return () => {};
    }
};
export function compiler(template: string, ctx: Dict) {
    const matched = [...template.matchAll(/\${([^}]*?)}/g)];
    for (const item of matched) {
        const tpl = item[1];
        let value = getValueWithRuntime(tpl, ctx);
        if (value === tpl) continue;
        if (typeof value !== 'string') value = JSON.stringify(value, null, 2);
        template = template.replace(`\${${item[1]}}`, value);
    }
    return template;
}
export function segment<T extends object>(type:string,data:T){
    return {
        type,
        data
    }
}
export namespace segment{
    export function escape<T>(text: T): T {
        if (typeof text !== 'string') return text;
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;') as T;
    }
    export function unescape<T>(text: T): T {
        if (typeof text !== 'string') return text;
        return text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&') as T;
    }
    export function text(text:string){
        return segment('text',{text});
    }
    export function face(id:string,text?:string){
        return segment('face',{id,text});
    }
    export function from(content: SendContent): SendContent {
        if (!Array.isArray(content)) content=[content];
        const toString=(template:string|MessageSegment)=>{
            if(typeof template!=='string') return [template]
            template=unescape(template);
            const result: MessageSegment[] = [];
            const closingReg = /<(\S+)(\s[^>]+)?\/>/;
            const twinningReg = /<(\S+)(\s[^>]+)?>([\s\S]*?)<\/\1>/;
            while (template.length) {
                const [_, type, attrStr = '', child = ''] = template.match(twinningReg) || template.match(closingReg) || [];
                if (!type) break;
                const isClosing = closingReg.test(template);
                const matched = isClosing ? `<${type}${attrStr}/>` : `<${type}${attrStr}>${child}</${type}>`;
                const index = template.indexOf(matched);
                const prevText = template.slice(0, index);
                if (prevText)
                    result.push({
                        type: 'text',
                        data: {
                            text: unescape(prevText),
                        },
                    });
                template = template.slice(index + matched.length);
                const attrArr = [...attrStr.matchAll(/\s([^=]+)(?=(?=="([^"]+)")|(?=='([^']+)'))/g)];
                const data = Object.fromEntries(
                    attrArr.map(([source, key, v1, v2]) => {
                        const value = v1 || v2;
                        try {
                            return [key, JSON.parse(unescape(value))];
                        } catch {
                            return [key, unescape(value)];
                        }
                    }),
                );
                if (child) {
                    data.message = toString(child).map(({ type, data }) => ({ type, ...data }));
                }
                result.push({
                    type: type,
                    data,
                });
            }
            if (template.length) {
                result.push({
                    type: 'text',
                    data: {
                        text: unescape(template),
                    },
                });
            }
            return result;
        }
        return content.reduce((result,item)=>{
            result.push(...toString(item))
            return result;
        },[] as MessageSegment[])
    }
    export function toString(content:SendContent){
        if(!Array.isArray(content)) content=[content]
        return content.map(item=>{
            if(typeof item==='string') return item
            const {type,data}=item
            if(type==='text') return data.text
            return `<${type} ${Object.keys(data).map(key=>`${key}='${escape(JSON.stringify(data[key]))}'`).join(' ')}/>`
        }).join('')
    }
}


import {
    useContext,
    addCommand,
    usePrompt,
    Time,
    addComponent,
    defineComponent,
    MessageCommand, usePlugin,
} from 'zhin.js';
import path from "node:path";
function formatMemoSize(size:number){
    return `${(size/1024/1024).toFixed(2)}MB`
}
addCommand(new MessageCommand('send')
    .action((_,result)=>result.remaining))
addCommand(new MessageCommand('zt')
    .action(()=>{
        return [
            '-------状态-------',
            `运行时间：${Time.formatTime(process.uptime()*1000)}`,
            `内存使用：${formatMemoSize(process.memoryUsage.rss())}`,
        ].join('\n')
    }))
const testComponent=defineComponent({
    name:'test',
    props:{
        id:String
    },
    async render({id},context){
        return '这是父组件'+id+context.children||'';
    }
})
const testComponent2=defineComponent({
    name:'fetch',
    props:{
        url:{
            type:String,
            default:""
        }
    },
    async render({url}){
        const result:string=await fetch(url).then(r=>r.text())
        return result
    }
})
addComponent(testComponent)
addComponent(testComponent2)
useContext('web',(web)=>{
    web.addEntry(path.resolve(path.resolve(import.meta.dirname,'../../client/index.ts')))
})
// 依赖icqq上下文
useContext('icqq', (p) => { // 指定某个上下文就绪时，需要做的事
  const someUsers = new MessageCommand('赞[space][...atUsers:at]', { at: 'qq' })
    .scope('icqq')
    .action(async (m, { params }) => {
      if (!params.atUsers?.length) params.atUsers = [+m.$sender.id];
      const likeResult: string[] = []
      for (const user_id of params.atUsers) {
        const userResult = await Promise.all(new Array(3).fill(0).map(()=>{
            return p.bots.get(m.$bot)?.sendLike(user_id, 20)
        }));
        likeResult.push(`为用户(${user_id})赞${userResult.filter(Boolean).length ? '成功' : '失败'}`)
      }
      return likeResult.join('\n');
    })
  addCommand(someUsers);
})
const testCommand=new MessageCommand('test')
    .action(async (m)=>usePrompt(m).text('请输入文本'))
addCommand(testCommand)
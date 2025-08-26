import {useContext, addCommand,Time, addComponent, defineComponent, segment, MessageCommand, useLogger} from 'zhin.js';
const testComponent=defineComponent({
    name:'test',
    props:{
      id:String
    },
    async render({id},context){
        return '这是父组件'+id+context.children||'';
    }
})
function formatMemoSize(size:number){
    return `${(size/1024/1024).toFixed(2)}MB`
}
const testComponent2=defineComponent({
    name:'foo',
    props:{
        face:{
            type:Number,
            default:1
        }
    },
    async render({face}){
        return [
            segment.escape(`这是子组件<face id='${face}/>`),
            {
                type:'face',
                data:{
                    id:face
                }
            }
        ]
    }
})
addComponent(testComponent)
addComponent(testComponent2)
addCommand(new MessageCommand('echo').action((_,result)=>result.remaining))
addCommand(new MessageCommand('status')
    .action(()=>{
        return [
            `rss:${formatMemoSize(process.memoryUsage.rss())}`,
            `uptime:${Time.formatTimeShort(process.uptime()*1000)}`
        ].join('\n')
    }))
// 依赖icqq上下文
useContext('icqq', (p) => { // 指定某个上下文就绪时，需要做的事
  const someUsers = new MessageCommand('赞[space][...atUsers:at]', { at: 'qq' })
    .action(async (m, { params }) => {
      if (!params.atUsers?.length) params.atUsers = [+m.sender.id];
      const likeResult: string[] = []
      for (const user_id of params.atUsers) {
        const userResult = await p.bots.get(m.bot)?.sendLike(user_id, 10);
        likeResult.push(`为用户(${user_id})赞${userResult ? '成功' : '失败'}`)
      }
      return likeResult.join('\n');
    })
  addCommand(someUsers)
})
useLogger().info(`启动耗时:${Time.formatTimeShort(process.uptime()*1000)}`)
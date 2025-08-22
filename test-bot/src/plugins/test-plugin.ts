import * as process from "node:process";
import {onMessage,useLogger,onDispose,addMiddleware,sendMessage,beforeSend,useContext} from 'zhin.js';
const formatSize=(size:number)=>`${(size/1024/1024).toFixed(2)}MB`

onDispose(async ()=>{
  console.log('插件销毁时调用');
})
addMiddleware(async (message, next)=>{ // 添加中间件到插件
})
beforeSend((options)=>{ // 在消息即将发送之前触发，可以修改需要发送的目标、内容
  // options.content='bar'
  return options
})
onMessage((m)=>{ // 监听群消息
  if(m.content[0].data?.text==='占用'){
    m.reply(`rss:${formatSize(process.memoryUsage.rss())}\nheap:${formatSize(process.memoryUsage().heapUsed)}`)
  }
})
// 依赖process上下文
useContext('icqq',(p)=>{ // 指定某个上下文就绪时，需要做的事
  onMessage(async (m)=>{ // 监听群消息
    if(m.content[0].data?.text==='赞我'){
      const result=await Promise.allSettled(new Array(5).fill(
          p.bots.get(m.bot)?.sendLike(+m.sender.id,10)))
      m.reply(`${result.some(item=>item.status==='fulfilled' && item.value)?'已赞':'别太贪心'}`)
    }
  })
  // sendMessage({
  //   context:'icqq',
  //   bot:`1689919782`,
  //   id:'742600824',
  //   type:'group',
  //   content:'什么？viki有男朋友了？'
  // })
})
const logger=useLogger()
logger.info(`启动耗时：${process.uptime()}`);

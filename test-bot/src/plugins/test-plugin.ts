import {onMessage,useLogger,onDispose,addMiddleware,sendMessage,beforeSend,useContext} from '@zhin.js/core';
import * as process from "node:process";
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
useContext('process',()=>{ // 指定某个上下文就绪时，需要做的事
  sendMessage({
    context:'process',
    bot:`${process.pid}`,
    id:process.title,
    type:'private',
    content:'foo'
  })
})
const logger=useLogger()
logger.info(`启动耗时：${process.uptime()}`);

import {
  useLogger,
  onDispose,
  addMiddleware, useContext,
} from '@zhin.js/core';
import * as process from "node:process";
const logger = useLogger();
onDispose(async ()=>{
  console.log(11112112)
})
addMiddleware(async (message, next)=>{ // 添加中间件到插件
  console.log(message)
})
// 依赖process上下文
useContext('process',(botMap)=>{
  botMap.get(`${process.pid}`)?.sendMessage({
    channel:{
      type:'private',
      id:'1659488338'
    },
    content:`\t${new Date().toLocaleString()}\t${process.memoryUsage.rss()/1024/1024}MB`
  })
  return (a)=>{

  }
})
// 依赖process上下文
useContext('onebot11','icqq',(onebot,icqqBots)=>{
  const icqq=icqqBots.get('8696238')!;

  icqq.sendPrivateMsg(1659488338,`\t${new Date().toLocaleString()}\t${process.memoryUsage.rss()/1024/1024}MB`)
  return (a)=>{

  }
})
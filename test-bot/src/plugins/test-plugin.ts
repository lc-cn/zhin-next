import {
  addRender,
  onDispose,
  addMiddleware, useContext, sendMessage,
} from '@zhin.js/core';
import * as process from "node:process";
onDispose(async ()=>{
  console.log(11112112)
})
addMiddleware(async (message, next)=>{ // 添加中间件到插件
  console.log(message)
})
addRender(function (this,msg){
  console.log(`before`,msg)
  return
})
// 依赖process上下文
useContext('process',()=>{
  sendMessage({
    context:'process',
    bot:`${process.pid}`,
    id:process.title,
    type:'private'
  },'123')
})
// 依赖process上下文

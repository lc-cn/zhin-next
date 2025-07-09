import {useLogger,onDispose,Command, addCommand } from '@zhin/core';
import * as process from "node:process";
const logger = useLogger();
// 添加测试命令
addCommand('内存占用',new Command().action(()=>`${process.memoryUsage.rss()/1024/1024}MB`));
const timer=setInterval(()=>{
  console.log(`${process.memoryUsage.rss()/1024/1024}MB`)
},5000)
onDispose(() => {
  logger.info('测试插件真的销毁了');
  clearInterval(timer)
});

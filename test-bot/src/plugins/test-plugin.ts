import {
  useLogger,
  onDispose,
  required,
  onMounted,
    sendMessage,
} from '@zhin/core';
const logger = useLogger();
onDispose(() => {
  logger.info('测试插件真的销毁了的哈');
});
required('icqq')
onMounted((plugin)=>{
  const botMap=plugin.use('icqq')
  // console.log(botMap);
  sendMessage({
    adapter:'icqq',
    bot:'1689919782',
    type:'private',
    id:'1659488338'
  },`${new Date().toLocaleString()}`)
})

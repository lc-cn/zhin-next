import { useLogger, onDispose } from '@zhin.js/core';

const logger = useLogger();


// 添加内存监控定时器
const timer = setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info(`内存使用: RSS ${(memoryUsage.rss/1024/1024).toFixed(2)}MB | 堆总计 ${(memoryUsage.heapTotal/1024/1024).toFixed(2)}MB | 堆已用 ${(memoryUsage.heapUsed/1024/1024).toFixed(2)}MB`);
}, 30000); // 每30秒输出一次

// 插件销毁时清理资源
onDispose(() => {
  clearInterval(timer);
  logger.info('错误测试插件已销毁');
});

// 故意添加一个语法错误来测试错误处理
// const invalidSyntax = "这是一个语法错误"；  // 中文分号会导致语法错误 
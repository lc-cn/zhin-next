import { createApp,Message } from '@zhin/core';

// 启动机器人
async function main() {
    try {
        // 异步创建机器人实例 (自动从配置文件加载)
        const bot = await createApp();


        // 监听消息事件
        bot.on('message', (message:Message) => {
            bot.logger.info(`receive msg from ${message.channel.type}(${message.channel.id}):${message.raw}`);
        });
        
        await bot.start();
        
        // 优雅退出处理
        const shutdown = async (signal: string) => {
          await bot.stop();
          process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('机器人启动失败:', error);
        process.exit(1);
    }
}

// 启动应用
main().catch(console.error);

import { createApp } from '@zhin.js/core';

// 启动机器人
async function main() {
    try {
        // 异步创建机器人实例 (自动从配置文件加载)
        const app = await createApp();
        await app.start();
        
        // 优雅退出处理
        const shutdown = async (signal: string) => {
          await app.stop();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (error) {
        console.error('机器人启动失败:', error);
        process.exit(1);
    }
}

// 启动应用
main().catch(console.error);
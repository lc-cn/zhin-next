// Telegram Webhook 模式使用示例
import { createApp } from 'zhin.js';
import '@zhin.js/adapter-telegram';
import '@zhin.js/http';

const app = createApp();

// 加载 HTTP 插件（Webhook 模式需要）
app.plugin(require('@zhin.js/http'));

// 配置 Telegram Webhook 适配器
app.adapter('telegram-webhook', {
  context: 'telegram-webhook',
  name: 'webhook-bot',
  token: process.env.TELEGRAM_BOT_TOKEN!,
  mode: 'webhook',
  webhookPath: '/telegram/webhook',
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL!, // 如: https://yourdomain.com/telegram/webhook
  secretToken: process.env.TELEGRAM_SECRET_TOKEN, // 可选的安全令牌
  fileDownload: {
    enabled: true,
    downloadPath: './downloads/telegram'
  }
});

// 基础命令
app.command('start').action((session) => {
  session.send('🤖 欢迎使用 Telegram Bot (Webhook 模式)！\n\n' +
    '✅ 这是一个高性能的 Webhook 模式机器人\n' +
    '⚡ 消息处理速度更快\n' +
    '💾 资源占用更少\n\n' +
    '输入 /help 查看更多命令。');
});

app.command('help').action((session) => {
  session.send('📚 可用命令：\n\n' +
    '/start - 开始使用\n' +
    '/help - 显示帮助\n' +
    '/ping - 测试延迟\n' +
    '/echo <消息> - 回声测试\n' +
    '/file - 发送文件示例');
});

app.command('ping').action(async (session) => {
  const start = Date.now();
  const msg = await session.send('🏓 Pong!');
  const latency = Date.now() - start;
  
  // 编辑消息显示延迟（Webhook 模式下需要使用编辑消息 API）
  await session.send(`🏓 Pong! 延迟: ${latency}ms (Webhook 模式)`);
});

app.command('echo <message:text>').action((session) => {
  session.send(`📢 你说: ${session.argv.message}`);
});

app.command('file').action(async (session) => {
  await session.send([
    { type: 'text', data: { text: '📁 这是一个文件发送示例：' } },
    { 
      type: 'document', 
      data: { 
        file: './package.json',
        filename: 'package.json',
        caption: '这是项目的 package.json 文件'
      } 
    }
  ]);
});

// 处理图片消息
app.middleware((session, next) => {
  const images = session.content.filter(seg => seg.type === 'image');
  if (images.length > 0) {
    console.log('📸 收到图片消息:', images.length, '张图片');
    session.send(`📸 收到了 ${images.length} 张图片，正在处理中...`);
  }
  return next();
});

// 处理文件消息
app.middleware((session, next) => {
  const files = session.content.filter(seg => 
    ['document', 'audio', 'video', 'voice'].includes(seg.type)
  );
  if (files.length > 0) {
    console.log('📎 收到文件消息:', files.map(f => f.type));
    session.send(`📎 收到了文件: ${files.map(f => f.type).join(', ')}`);
  }
  return next();
});

// 错误处理
app.on('error', (error) => {
  console.error('❌ 应用错误:', error);
});

console.log('🚀 启动 Telegram Webhook Bot...');
console.log('📡 Webhook 端点:', process.env.TELEGRAM_WEBHOOK_URL);

app.start();

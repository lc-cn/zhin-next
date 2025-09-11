// Discord Interactions 端点模式使用示例
import { createApp } from 'zhin.js';
import '@zhin.js/adapter-discord';
import '@zhin.js/http';
import { SlashCommandBuilder } from 'discord.js';

const app = createApp();

// 加载 HTTP 插件（Interactions 端点需要）
app.plugin(require('@zhin.js/http'));

// 定义 Slash Commands
const slashCommands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('测试机器人响应速度')
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('echo')
    .setDescription('回声测试')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('要回声的消息')
        .setRequired(true)
    )
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('weather')
    .setDescription('获取天气信息')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('城市名称')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('detailed')
        .setDescription('是否显示详细信息')
        .setRequired(false)
    )
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('发送富文本嵌入消息')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('嵌入消息标题')
        .setRequired(true)
    )
    .toJSON()
];

// 配置 Discord Interactions 适配器
app.adapter('discord-interactions', {
  context: 'discord-interactions',
  name: 'interactions-bot',
  token: process.env.DISCORD_BOT_TOKEN!,
  applicationId: process.env.DISCORD_APPLICATION_ID!,
  publicKey: process.env.DISCORD_PUBLIC_KEY!,
  interactionsPath: '/discord/interactions',
  useGateway: false, // 纯 Interactions 模式，不使用 Gateway
  slashCommands,
  globalCommands: true // 使用全局命令以获得更快响应
});

// 处理 ping 命令
app.command('ping').action(async (session) => {
  const start = Date.now();
  await session.send('🏓 Pong!');
  const latency = Date.now() - start;
  
  await session.send(`⚡ 响应时间: ${latency}ms (Interactions 模式)`);
});

// 处理 echo 命令
app.command('echo <message:text>').action(async (session) => {
  await session.send([
    {
      type: 'embed',
      data: {
        title: '📢 回声测试',
        description: session.argv.message,
        color: 0x00ff00,
        footer: { text: '使用 Interactions 端点' },
        timestamp: new Date().toISOString()
      }
    }
  ]);
});

// 处理 weather 命令
app.command('weather <city:string> [detailed:boolean]').action(async (session) => {
  const { city, detailed } = session.argv;
  
  // 模拟天气数据
  const weatherData = {
    city,
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: ['晴朗', '多云', '小雨', '阴'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 20) + 5
  };
  
  if (detailed) {
    await session.send([
      {
        type: 'embed',
        data: {
          title: `🌤️ ${city} 详细天气信息`,
          description: `当前天气状况`,
          color: 0x87CEEB,
          fields: [
            { name: '🌡️ 温度', value: `${weatherData.temperature}°C`, inline: true },
            { name: '☁️ 天气', value: weatherData.condition, inline: true },
            { name: '💧 湿度', value: `${weatherData.humidity}%`, inline: true },
            { name: '💨 风速', value: `${weatherData.windSpeed} km/h`, inline: true }
          ],
          thumbnail: { url: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2600-fe0f.png' },
          footer: { text: '数据仅供演示' },
          timestamp: new Date().toISOString()
        }
      }
    ]);
  } else {
    await session.send(`🌤️ ${city}: ${weatherData.temperature}°C, ${weatherData.condition}`);
  }
});

// 处理 embed 命令
app.command('embed <title:text>').action(async (session) => {
  await session.send([
    {
      type: 'embed',
      data: {
        title: session.argv.title,
        description: '这是一个通过 Discord Interactions 端点生成的嵌入消息',
        color: 0x7289DA, // Discord 蓝色
        author: {
          name: 'zhin.js Discord 适配器',
          icon_url: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f916.png'
        },
        fields: [
          {
            name: '⚡ 模式',
            value: 'Interactions 端点',
            inline: true
          },
          {
            name: '🚀 性能',
            value: '极快响应',
            inline: true
          },
          {
            name: '🔧 特性',
            value: '原生斜杠命令支持',
            inline: true
          }
        ],
        image: {
          url: 'https://via.placeholder.com/400x200/7289DA/ffffff?text=zhin.js+Discord+Bot'
        },
        footer: {
          text: 'Powered by zhin.js',
          icon_url: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2699-fe0f.png'
        },
        timestamp: new Date().toISOString()
      }
    }
  ]);
});

// 全局中间件 - 记录所有交互
app.middleware((session, next) => {
  console.log(`🎯 收到交互: ${session.$sender.name} 在 ${session.$channel.type}`);
  return next();
});

// 错误处理
app.on('error', (error) => {
  console.error('❌ 应用错误:', error);
});

console.log('🚀 启动 Discord Interactions Bot...');
console.log('🔗 Interactions 端点:', process.env.DISCORD_INTERACTIONS_URL || 'https://yourdomain.com/discord/interactions');
console.log('📋 注册的命令:', slashCommands.map(cmd => cmd.name).join(', '));

app.start();

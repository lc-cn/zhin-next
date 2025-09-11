// 飞书/Lark 机器人完整使用示例
import { createApp } from 'zhin.js';
import '@zhin.js/adapter-lark';
import '@zhin.js/http';

const app = createApp();

// 加载 HTTP 插件（飞书适配器需要）
app.plugin(require('@zhin.js/http'));

// 配置飞书适配器
const bot = app.adapter('lark', {
  context: 'lark',
  name: 'feishu-bot',
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  webhookPath: '/lark/webhook',
  
  // 安全配置（强烈推荐）
  encryptKey: process.env.LARK_ENCRYPT_KEY,
  verificationToken: process.env.LARK_VERIFICATION_TOKEN,
  
  // 使用飞书中国版（如果是 Lark 国际版，设置为 false）
  isFeishu: true
});

// ================================================================================================
// 基础命令
// ================================================================================================

app.command('start').action(async (session) => {
  await session.send([
    { type: 'text', data: { content: '🎉 欢迎使用飞书机器人！\n\n' } },
    { type: 'text', data: { content: '我可以帮助您：\n' } },
    { type: 'text', data: { content: '📝 处理文本消息\n' } },
    { type: 'text', data: { content: '📷 处理图片和文件\n' } },
    { type: 'text', data: { content: '🎴 发送交互式卡片\n' } },
    { type: 'text', data: { content: '👥 管理群组和用户\n\n' } },
    { type: 'text', data: { content: '输入 /help 查看所有命令' } }
  ]);
});

app.command('help').action(async (session) => {
  await session.send([
    {
      type: 'card',
      data: {
        config: {
          wide_screen_mode: true
        },
        elements: [
          {
            tag: 'div',
            text: {
              content: '**🤖 机器人命令帮助**\n\n**基础命令：**\n/start - 欢迎信息\n/help - 显示此帮助\n/ping - 测试连接\n/me - 查看个人信息\n\n**功能命令：**\n/card - 发送交互卡片示例\n/weather <城市> - 查询天气(模拟)\n/upload - 文件上传示例\n/members - 查看群组信息(群聊)\n\n**管理命令：**\n/stats - 查看统计信息\n/echo <消息> - 回声测试',
              tag: 'lark_md'
            }
          }
        ],
        header: {
          title: {
            content: '📚 帮助文档',
            tag: 'plain_text'
          },
          template: 'blue'
        }
      }
    }
  ]);
});

app.command('ping').action(async (session) => {
  const start = Date.now();
  await session.send('🏓 Pong!');
  const latency = Date.now() - start;
  await session.send(`⚡ 响应时间: ${latency}ms`);
});

// ================================================================================================
// 用户信息相关
// ================================================================================================

app.command('me').action(async (session) => {
  try {
    const userInfo = await bot.getUserInfo(session.$sender.id);
    
    if (userInfo) {
      await session.send([
        {
          type: 'card',
          data: {
            config: {
              wide_screen_mode: true
            },
            elements: [
              {
                tag: 'div',
                fields: [
                  {
                    is_short: true,
                    text: {
                      content: `**👤 姓名**\n${userInfo.name || '未知'}`,
                      tag: 'lark_md'
                    }
                  },
                  {
                    is_short: true,
                    text: {
                      content: `**📧 邮箱**\n${userInfo.email || '未设置'}`,
                      tag: 'lark_md'
                    }
                  },
                  {
                    is_short: true,
                    text: {
                      content: `**🆔 用户ID**\n${session.$sender.id}`,
                      tag: 'lark_md'
                    }
                  },
                  {
                    is_short: true,
                    text: {
                      content: `**🏢 部门**\n${userInfo.department_ids?.join(', ') || '未知'}`,
                      tag: 'lark_md'
                    }
                  }
                ]
              }
            ],
            header: {
              title: {
                content: '👤 个人信息',
                tag: 'plain_text'
              },
              template: 'green'
            }
          }
        }
      ]);
    } else {
      await session.send('❌ 无法获取用户信息，请稍后重试');
    }
  } catch (error) {
    await session.send('❌ 获取用户信息时发生错误');
    console.error('Get user info error:', error);
  }
});

// ================================================================================================
// 群组管理
// ================================================================================================

app.command('members').action(async (session) => {
  if (session.$channel.type !== 'group') {
    await session.send('❌ 此命令只能在群聊中使用');
    return;
  }
  
  try {
    const chatInfo = await bot.getChatInfo(session.$channel.id);
    
    if (chatInfo) {
      await session.send([
        {
          type: 'card',
          data: {
            config: {
              wide_screen_mode: true
            },
            elements: [
              {
                tag: 'div',
                text: {
                  content: `**群组名称：** ${chatInfo.name || '未设置'}\n**成员数量：** ${chatInfo.member_count || 0}\n**群组类型：** ${chatInfo.chat_type || 'group'}\n**创建时间：** ${new Date(parseInt(chatInfo.create_time || '0')).toLocaleString()}`,
                  tag: 'lark_md'
                }
              }
            ],
            header: {
              title: {
                content: '👥 群组信息',
                tag: 'plain_text'
              },
              template: 'orange'
            }
          }
        }
      ]);
    } else {
      await session.send('❌ 无法获取群组信息');
    }
  } catch (error) {
    await session.send('❌ 获取群组信息时发生错误');
    console.error('Get chat info error:', error);
  }
});

// ================================================================================================
// 交互式卡片示例
// ================================================================================================

app.command('card').action(async (session) => {
  await session.send([
    {
      type: 'card',
      data: {
        config: {
          wide_screen_mode: true
        },
        elements: [
          // 欢迎文本
          {
            tag: 'div',
            text: {
              content: '🎉 **欢迎体验交互式卡片！**\n\n这是一个功能丰富的卡片示例，展示了飞书机器人的各种交互能力。',
              tag: 'lark_md'
            }
          },
          // 分割线
          {
            tag: 'hr'
          },
          // 功能展示区域
          {
            tag: 'div',
            fields: [
              {
                is_short: true,
                text: {
                  content: '**🚀 功能特性**\n• 富文本格式\n• 多媒体支持\n• 交互按钮',
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: '**📊 统计信息**\n• 在线用户: 168\n• 活跃群组: 42\n• 消息总数: 15.2K',
                  tag: 'lark_md'
                }
              },
              {
                is_short: false,
                text: {
                  content: '**💡 小贴士**\n点击下方按钮可以体验不同的交互功能，每个按钮都会触发相应的操作。',
                  tag: 'lark_md'
                }
              }
            ]
          },
          // 按钮操作区
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: {
                  content: '👍 点赞',
                  tag: 'plain_text'
                },
                type: 'primary',
                value: {
                  action: 'like',
                  user_id: session.$sender.id
                }
              },
              {
                tag: 'button',
                text: {
                  content: '📊 查看详情',
                  tag: 'plain_text'
                },
                type: 'default',
                value: {
                  action: 'detail'
                }
              },
              {
                tag: 'button',
                text: {
                  content: '🔄 刷新',
                  tag: 'plain_text'
                },
                type: 'default',
                value: {
                  action: 'refresh'
                }
              }
            ]
          }
        ],
        header: {
          title: {
            content: '🎴 交互式卡片演示',
            tag: 'plain_text'
          },
          template: 'purple'
        }
      }
    }
  ]);
});

// ================================================================================================
// 模拟功能命令
// ================================================================================================

app.command('weather <city:string>').action(async (session) => {
  const city = session.argv.city;
  
  // 模拟天气数据
  const weatherData = {
    city,
    temperature: Math.floor(Math.random() * 25) + 10,
    condition: ['晴朗', '多云', '小雨', '阴天', '雪'][Math.floor(Math.random() * 5)],
    humidity: Math.floor(Math.random() * 30) + 40,
    windSpeed: Math.floor(Math.random() * 15) + 5,
    aqi: Math.floor(Math.random() * 200) + 50
  };
  
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'green';
    if (aqi <= 100) return 'yellow';
    if (aqi <= 150) return 'orange';
    return 'red';
  };
  
  await session.send([
    {
      type: 'card',
      data: {
        config: {
          wide_screen_mode: true
        },
        elements: [
          {
            tag: 'div',
            text: {
              content: `📍 **${city}** 当前天气情况`,
              tag: 'lark_md'
            }
          },
          {
            tag: 'hr'
          },
          {
            tag: 'div',
            fields: [
              {
                is_short: true,
                text: {
                  content: `**🌡️ 温度**\n${weatherData.temperature}°C`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**☁️ 天气**\n${weatherData.condition}`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**💧 湿度**\n${weatherData.humidity}%`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**💨 风速**\n${weatherData.windSpeed} km/h`,
                  tag: 'lark_md'
                }
              }
            ]
          },
          {
            tag: 'div',
            text: {
              content: `**🌬️ 空气质量指数：** ${weatherData.aqi} (${weatherData.aqi <= 50 ? '优' : weatherData.aqi <= 100 ? '良' : weatherData.aqi <= 150 ? '轻度污染' : '中度污染'})`,
              tag: 'lark_md'
            }
          }
        ],
        header: {
          title: {
            content: '🌤️ 天气预报',
            tag: 'plain_text'
          },
          template: getAQIColor(weatherData.aqi)
        }
      }
    }
  ]);
});

// ================================================================================================
// 消息处理中间件
// ================================================================================================

// 处理 @提及
app.middleware((session, next) => {
  const mentions = session.content.filter(seg => seg.type === 'at');
  if (mentions.length > 0) {
    console.log(`📢 收到提及: ${mentions.map(m => m.data.name).join(', ')}`);
    
    // 如果提及了机器人，给出友好回应
    const hasBotMention = mentions.some(m => m.data.id === 'bot' || m.data.name?.includes('机器人'));
    if (hasBotMention) {
      setTimeout(() => {
        session.send('👋 你好！我是飞书机器人，有什么可以帮助你的吗？输入 /help 查看我能做什么！');
      }, 1000);
    }
  }
  return next();
});

// 处理图片消息
app.middleware((session, next) => {
  const images = session.content.filter(seg => seg.type === 'image');
  if (images.length > 0) {
    console.log(`📷 收到 ${images.length} 张图片`);
    session.send(`📷 哇！收到了 ${images.length} 张精美的图片，我已经保存到相册了！`);
  }
  return next();
});

// 处理文件消息
app.middleware((session, next) => {
  const files = session.content.filter(seg => seg.type === 'file');
  if (files.length > 0) {
    const fileNames = files.map(f => f.data.file_name).filter(Boolean);
    console.log(`📎 收到文件: ${fileNames.join(', ')}`);
    session.send(`📎 收到文件: ${fileNames.join(', ')}\n文件已安全接收，如需处理请告诉我！`);
  }
  return next();
});

// 处理音频/视频消息
app.middleware((session, next) => {
  const audioFiles = session.content.filter(seg => ['audio', 'video'].includes(seg.type));
  if (audioFiles.length > 0) {
    const types = audioFiles.map(f => f.type === 'audio' ? '🎵 音频' : '🎬 视频');
    session.send(`${types.join(', ')} 已收到！多媒体内容正在处理中...`);
  }
  return next();
});

// 处理卡片消息和富文本
app.middleware((session, next) => {
  const cards = session.content.filter(seg => seg.type === 'card');
  if (cards.length > 0) {
    console.log(`🎴 收到 ${cards.length} 个卡片消息`);
    session.send(`🎴 收到了 ${cards.length} 个精美卡片，内容很丰富呢！`);
  }
  return next();
});

// ================================================================================================
// 工具命令
// ================================================================================================

app.command('echo <message:text>').action((session) => {
  const message = session.argv.message;
  session.send(`🔊 回声: ${message}`);
});

app.command('stats').action(async (session) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now()
  };
  
  await session.send([
    {
      type: 'card',
      data: {
        config: {
          wide_screen_mode: true
        },
        elements: [
          {
            tag: 'div',
            fields: [
              {
                is_short: true,
                text: {
                  content: `**⏱️ 运行时间**\n${Math.floor(stats.uptime / 3600)}小时 ${Math.floor((stats.uptime % 3600) / 60)}分钟`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**💾 内存使用**\n${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**🚀 启动时间**\n${new Date(Date.now() - stats.uptime * 1000).toLocaleString()}`,
                  tag: 'lark_md'
                }
              },
              {
                is_short: true,
                text: {
                  content: `**📊 状态**\n🟢 运行正常`,
                  tag: 'lark_md'
                }
              }
            ]
          }
        ],
        header: {
          title: {
            content: '📈 机器人统计信息',
            tag: 'plain_text'
          },
          template: 'blue'
        }
      }
    }
  ]);
});

// 文件上传示例命令
app.command('upload').action(async (session) => {
  await session.send([
    { type: 'text', data: { content: '📁 文件上传功能演示：\n\n' } },
    { type: 'text', data: { content: '请发送一个文件给我，我会帮你处理！\n' } },
    { type: 'text', data: { content: '支持的文件类型：\n' } },
    { type: 'text', data: { content: '📷 图片: jpg, png, gif, webp\n' } },
    { type: 'text', data: { content: '📄 文档: pdf, doc, docx, txt\n' } },
    { type: 'text', data: { content: '🎵 音频: mp3, wav, aac\n' } },
    { type: 'text', data: { content: '🎬 视频: mp4, avi, mov\n\n' } },
    { type: 'text', data: { content: '上传后我会显示文件信息并进行相应处理！' } }
  ]);
});

// ================================================================================================
// 错误处理和日志
// ================================================================================================

// 全局错误处理中间件
app.middleware(async (session, next) => {
  try {
    await next();
  } catch (error) {
    console.error('❌ Command execution error:', error);
    await session.send('❌ 命令执行时发生错误，请稍后重试或联系管理员');
  }
});

// 请求日志中间件
app.middleware((session, next) => {
  const timestamp = new Date().toLocaleString();
  const user = session.$sender.name || session.$sender.id;
  const channel = session.$channel.type;
  const content = session.content.map(s => s.data?.content || s.data?.text || `[${s.type}]`).join('');
  
  console.log(`[${timestamp}] 📨 ${user}(${channel}): ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
  
  return next();
});

// 应用启动事件
app.on('connect', () => {
  console.log('🚀 飞书机器人已启动！');
  console.log('📡 Webhook 地址: http://localhost:3000/lark/webhook');
  console.log('💡 请在飞书开发者后台配置此 Webhook 地址');
});

app.on('disconnect', () => {
  console.log('👋 飞书机器人已断开连接');
});

app.on('error', (error) => {
  console.error('❌ 应用错误:', error);
});

console.log('🔄 正在启动飞书机器人...');
app.start();

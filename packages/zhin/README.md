# zhin.js

Zhin 机器人框架的主入口包，提供统一的 API 接口和完整的开发体验。

## 简介

`zhin.js` 是 Zhin 机器人框架的主要入口点，它重新导出了 `@zhin.js/core` 的所有功能，为开发者提供简洁一致的导入体验。这是推荐使用的包，无需直接依赖其他 `@zhin.js/*` 包。

## 核心特性

- 🎯 **统一入口**: 单一包提供所有核心功能
- 🔥 **热模块替换**: 基于 `@zhin.js/hmr` 的热更新系统  
- 🤖 **多平台支持**: 支持 QQ、KOOK、OneBot 等多个聊天平台
- 🧩 **插件化架构**: 完整的插件生命周期和依赖管理
- 📦 **TypeScript**: 完整的类型定义和智能提示
- ⚡ **高性能**: 优化的消息处理和组件渲染系统

## 安装

### 使用包管理器安装

```bash
# npm
npm install zhin.js

# yarn  
yarn add zhin.js

# pnpm (推荐)
pnpm add zhin.js

# bun
bun add zhin.js
```

### 使用脚手架创建项目

```bash
# 推荐方式：使用脚手架创建新项目
npm create zhin my-bot
cd my-bot
npm run dev
```

## 快速开始

### 1. 基础使用

```typescript
import { createApp } from 'zhin.js'

// 创建应用实例
const app = await createApp()

// 启动应用
await app.start()

console.log('🤖 机器人已启动!')
```

### 2. 配置机器人

```typescript
import { createApp } from 'zhin.js'

const app = await createApp({
  // 机器人配置
  bots: [
    {
      context: 'onebot11',
      name: 'my-bot',
      url: 'ws://localhost:8080',
      access_token: 'your-token'
    }
  ],
  
  // 插件配置
  plugin_dirs: ['./plugins'],
  plugins: ['my-plugin'],
  
  // 调试模式
  debug: process.env.NODE_ENV === 'development'
})

await app.start()
```

### 3. 插件开发

```typescript
// plugins/hello-plugin.ts
import { 
  usePlugin, 
  onMessage, 
  addCommand,
  addMiddleware
} from 'zhin.js'

const plugin = usePlugin()

// 添加命令
addCommand(new MessageCommand('hello')
  .action(async (message) => {
    return '你好！欢迎使用 Zhin 机器人框架！'
  })
)

// 添加中间件
addMiddleware(async (message, next) => {
  console.log(`收到消息: ${message.raw}`)
  await next()
})

// 监听消息事件
onMessage(async (message) => {
  if (message.raw.includes('帮助')) {
    await message.reply('这里是帮助信息！')
  }
})

plugin.logger.info('Hello Plugin 已加载')
```

## API 参考

### 应用管理

```typescript
import { 
  createApp,
  useApp, 
  getAppInstance 
} from 'zhin.js'

// 创建应用实例
const app = await createApp(config)

// 在插件中获取应用实例
const app = useApp()

// 获取应用实例（用于高级操作）
const app = getAppInstance()

// 启动/停止应用
await app.start()
await app.stop()
```

### 插件系统

```typescript
import { 
  usePlugin,
  onMounted,
  onDispose,
  register,
  useContext
} from 'zhin.js'

// 获取当前插件
const plugin = usePlugin()

// 生命周期钩子
onMounted(async (plugin) => {
  console.log('插件已挂载')
})

onDispose(() => {
  console.log('插件正在销毁')
})

// 注册上下文服务
register({
  name: 'myService',
  async mounted(plugin) {
    return new MyService()
  }
})

// 使用上下文依赖
useContext('database', 'config', async (db, config) => {
  // 使用数据库和配置
})
```

### 消息处理

```typescript
import {
  onMessage,
  onGroupMessage,
  onPrivateMessage,
  addMiddleware,
  addCommand,
  sendMessage
} from 'zhin.js'

// 消息监听
onMessage(async (message) => {
  console.log('收到消息:', message.raw)
})

onGroupMessage(async (message) => {
  console.log('群聊消息:', message.raw)
})

onPrivateMessage(async (message) => {
  console.log('私聊消息:', message.raw)
})

// 中间件
addMiddleware(async (message, next) => {
  // 前置处理
  await next()
  // 后置处理
})

// 命令处理
addCommand(new MessageCommand('echo <content:text>')
  .action(async (message, result) => {
    return `回声: ${result.args.content}`
  })
)

// 发送消息
await sendMessage({
  type: 'group',
  id: '123456',
  context: 'onebot11', 
  bot: 'my-bot',
  content: '你好世界!'
})
```

### 组件系统

```typescript
import {
  defineComponent,
  addComponent
} from 'zhin.js'

// 定义组件
const UserCard = defineComponent({
  name: 'user-card',
  props: {
    name: String,
    level: Number,
    avatar: String
  },
  render(props) {
    return `
      <div>
        <img src="${props.avatar}" alt="头像" />
        <h3>${props.name}</h3>
        <p>等级: ${props.level}</p>
      </div>
    `
  }
})

// 注册组件
addComponent(UserCard)

// 在消息中使用
// <user-card name="张三" :level="5" avatar="http://..." />
```

### 适配器注册

```typescript
import { 
  registerAdapter,
  Adapter,
  Bot 
} from 'zhin.js'

// 实现自定义机器人
class MyBot implements Bot {
  constructor(public plugin: Plugin, public config: BotConfig) {}
  
  async connect() {
    // 连接逻辑
  }
  
  async disconnect() {
    // 断开连接逻辑  
  }
  
  async sendMessage(options: SendOptions) {
    // 发送消息逻辑
  }
}

// 注册适配器
registerAdapter(new Adapter('my-platform', MyBot))
```

## 完整示例

### 简单的问答机器人

```typescript
// src/index.ts
import { createApp } from 'zhin.js'

const app = await createApp({
  bots: [{
    context: 'process', // 使用控制台测试
    name: 'test-bot'
  }],
  plugin_dirs: ['./plugins']
})

await app.start()
```

```typescript
// plugins/qa-bot.ts
import {
  onMessage,
  addCommand,
  MessageCommand,
  useLogger
} from 'zhin.js'

const logger = useLogger()

// 问答数据
const qa = new Map([
  ['你好', '你好！我是 Zhin 机器人'],
  ['时间', () => `当前时间：${new Date().toLocaleString()}`],
  ['天气', '今天天气不错呢！'],
])

// 简单问答
onMessage(async (message) => {
  const text = message.raw.trim()
  const answer = qa.get(text)
  
  if (answer) {
    const reply = typeof answer === 'function' ? answer() : answer
    await message.reply(reply)
  }
})

// 帮助命令
addCommand(new MessageCommand('help')
  .action(async () => {
    const commands = Array.from(qa.keys()).join('、')
    return `可用命令：${commands}`
  })
)

logger.info('问答机器人已加载')
```

### 高级功能示例

```typescript
// plugins/advanced-features.ts
import {
  useContext,
  register,
  addMiddleware,
  addCommand,
  beforeSend,
  defineComponent,
  addComponent,
  MessageCommand
} from 'zhin.js'

// 注册数据存储服务
register({
  name: 'storage',
  mounted() {
    const data = new Map()
    return {
      get: (key: string) => data.get(key),
      set: (key: string, value: any) => data.set(key, value),
      delete: (key: string) => data.delete(key)
    }
  }
})

// 使用存储服务
useContext('storage', (storage) => {
  // 记录消息统计
  addMiddleware(async (message, next) => {
    const count = storage.get('message-count') || 0
    storage.set('message-count', count + 1)
    await next()
  })
  
  // 统计命令
  addCommand(new MessageCommand('stats')
    .action(async () => {
      const count = storage.get('message-count') || 0
      return `已处理消息数量: ${count}`
    })
  )
})

// 消息预处理
beforeSend((options) => {
  // 为所有消息添加时间戳
  if (typeof options.content === 'string') {
    options.content = `[${new Date().toLocaleTimeString()}] ${options.content}`
  }
  return options
})

// 自定义组件
const StatusCard = defineComponent({
  name: 'status-card',
  props: {
    title: String,
    status: String,
    color: { type: String, default: 'green' }
  },
  render(props) {
    return `📊 ${props.title}: ${props.status}`
  }
})

addComponent(StatusCard)
```

## 配置文件

### JavaScript 配置

```javascript
// zhin.config.js  
import { defineConfig } from 'zhin.js'

export default defineConfig(async (env) => {
  return {
    // 机器人配置
    bots: [
      {
        context: 'onebot11',
        name: 'main-bot', 
        url: env.BOT_URL || 'ws://localhost:8080',
        access_token: env.ACCESS_TOKEN
      }
    ],
    
    // 插件目录
    plugin_dirs: [
      './src/plugins',
      'node_modules'
    ],
    
    // 启用的插件
    plugins: [
      'onebot11',
      'http',
      'console',
      'my-plugin'
    ],
    
    // 调试模式
    debug: env.NODE_ENV === 'development'
  }
})
```

### TypeScript 配置

```typescript
// zhin.config.ts
import { defineConfig } from 'zhin.js'
import type { AppConfig } from 'zhin.js'

export default defineConfig<AppConfig>(async (env) => {
  const isProduction = env.NODE_ENV === 'production'
  
  return {
    bots: [
      {
        context: 'icqq',
        name: env.QQ_NUMBER!,
        password: env.QQ_PASSWORD,
        log_level: isProduction ? 'warn' : 'info'
      }
    ],
    
    plugin_dirs: ['./src/plugins'],
    
    plugins: [
      'icqq',
      ...(isProduction ? [] : ['console'])
    ],
    
    debug: !isProduction
  }
})
```

## 开发工具

### 开发模式

```bash
# 开发模式启动（支持热重载）
npm run dev

# 详细日志模式
npm run dev -- --verbose

# 自定义端口
npm run dev -- --port 8080
```

### 生产部署

```bash
# 构建项目
npm run build

# 生产启动
npm run start

# 后台运行
npm run start -- --daemon

# 查看日志
npm run start -- --daemon --log-file ./logs/bot.log
```

## 类型定义

`zhin.js` 完全基于 TypeScript 构建，提供完整的类型支持：

```typescript
import type {
  // 核心类型
  App,
  Plugin, 
  Adapter,
  Bot,
  
  // 配置类型
  AppConfig,
  BotConfig,
  
  // 消息类型
  Message,
  MessageSegment,
  SendOptions,
  SendContent,
  
  // 组件类型
  Component,
  MessageCommand,
  
  // HMR类型  
  HMR,
  Dependency,
  
  // 工具类型
  MaybePromise,
  GlobalContext
} from 'zhin.js'
```

## 生态系统

### 官方适配器

- `@zhin.js/adapter-icqq` - QQ机器人适配器
- `@zhin.js/adapter-kook` - KOOK平台适配器
- `@zhin.js/adapter-onebot11` - OneBot v11协议适配器
- `@zhin.js/adapter-process` - 控制台测试适配器

### 官方插件

- `@zhin.js/http` - HTTP服务和WebSocket支持
- `@zhin.js/console` - Web管理控制台
- `@zhin.js/client` - 客户端界面组件

### 开发工具

- `@zhin.js/cli` - 命令行工具
- `@zhin.js/hmr` - 热模块替换系统
- `create-zhin` - 项目脚手架工具

## 最佳实践

1. **使用 TypeScript**: 获得更好的开发体验
2. **模块化插件**: 将功能拆分为独立的插件
3. **错误处理**: 为异步操作添加适当的错误处理
4. **性能监控**: 在生产环境启用性能监控
5. **日志记录**: 使用结构化日志记录
6. **测试**: 编写单元测试和集成测试

## 故障排查

### 常见问题

1. **模块导入错误**
   ```typescript
   // ❌ 错误
   import { App } from '@zhin.js/core'
   
   // ✅ 正确
   import { App } from 'zhin.js'
   ```

2. **配置文件路径**
   ```bash
   # 确保配置文件在项目根目录
   ls -la zhin.config.*
   ```

3. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   
   # 使用不同端口
   npm run dev -- --port 8080
   ```

## 社区资源

- 📖 [官方文档](https://zhinjs.github.io)
- 💬 [讨论社区](https://github.com/zhinjs/zhin/discussions)
- 🐛 [问题反馈](https://github.com/zhinjs/zhin/issues)
- 🔧 [插件开发指南](https://zhinjs.github.io/plugins)

## 许可证

MIT License
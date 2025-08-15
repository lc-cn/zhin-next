# API参考

Zhin Bot Framework的API文档。

## 核心API

### App

应用实例API，继承自HMR。

```typescript
import { createApp } from '@zhin.js/core'

const app = await createApp({
  plugin_dirs: ['./plugins'],
  plugins: ['plugin1'],
  bots: []
})

// 启动应用
await app.start()

// 停止应用
await app.stop()

// 等待所有插件就绪
await app.waitForReady()

// 发送消息
await app.sendMessage({
  context: 'adapter-name',
  bot: 'bot-name',
  type: 'group',
  target: 'group-id',
  content: 'hello'
})
```

### Plugin

插件API，继承自Dependency。

```typescript
import { 
  usePlugin,
  onMessage,
  addMiddleware,
  register,
  use,
  useLogger
} from '@zhin.js/core'

// 获取插件实例
const plugin = usePlugin()

// 添加中间件
addMiddleware(async (message, next) => {
  await next()
})

// 注册上下文
register({
  name: 'myContext',
  async mounted(plugin) {
    return { /* context data */ }
  }
})

// 使用上下文
const ctx = use('myContext')

// 获取日志记录器
const logger = useLogger()
```

### Adapter

适配器API。

```typescript
import { Adapter, Bot } from '@zhin.js/core'

class MyBot implements Bot {
  constructor(public config: any) {}
  
  async connect() {
    // 实现连接逻辑
  }
  
  async disconnect() {
    // 实现断开逻辑
  }
  
  async sendMessage(options: any) {
    // 实现消息发送
  }
}

class MyAdapter extends Adapter {
  constructor() {
    super('my-adapter', (plugin, config) => new MyBot(config))
  }
}
```

## 事件系统

### 消息事件

- `message.receive`: 收到消息
- `message.send`: 发送消息
- `message.group.receive`: 收到群消息
- `message.private.receive`: 收到私聊消息

```typescript
import { onMessage, onGroupMessage, onPrivateMessage } from '@zhin.js/core'

// 监听所有消息
onMessage(async (message) => {
  console.log('收到消息:', message)
})

// 监听群消息
onGroupMessage(async (message) => {
  console.log('收到群消息:', message)
})

// 监听私聊消息
onPrivateMessage(async (message) => {
  console.log('收到私聊消息:', message)
})
```

### 生命周期事件

- `mounted`: 插件挂载完成
- `dispose`: 插件即将销毁

```typescript
import { onMounted, onDispose } from '@zhin.js/core'

// 挂载完成
onMounted(async (plugin) => {
  console.log('插件已挂载')
})

// 即将销毁
onDispose(async () => {
  console.log('插件即将销毁')
})
```

## 中间件系统

```typescript
import { addMiddleware } from '@zhin.js/core'

// 添加中间件
addMiddleware(async (message, next) => {
  console.log('前置处理')
  await next()
  console.log('后置处理')
})
```

## 上下文系统

```typescript
import { register, use, useContext } from '@zhin.js/core'

// 注册上下文
register({
  name: 'database',
  async mounted(plugin) {
    return {
      query: async () => { /* ... */ }
    }
  },
  async dispose() {
    // 清理资源
  }
})

// 使用上下文
const db = use('database')

// 声明上下文依赖
useContext('database', async (db) => {
  await db.query()
})
```

## 配置系统

```typescript
import { defineConfig } from '@zhin.js/core'

export default defineConfig(async (env) => ({
  bots: [{
    name: 'my-bot',
    context: 'icqq',
    config: {
      account: 123456789,
      password: 'password'
    }
  }],
  plugin_dirs: ['./plugins'],
  plugins: ['plugin1'],
  debug: env.DEBUG === 'true'
}))
```

## 类型定义

### 消息类型

```typescript
interface Message {
  id: string
  type: 'private' | 'group'
  content: MessageContent[]
  sender: User
  reply(content: string): Promise<void>
}

interface MessageContent {
  type: string
  data: any
}

interface User {
  id: string
  name: string
}
```

### 配置类型

```typescript
interface AppConfig {
  plugin_dirs?: string[]
  plugins?: string[]
  bots?: BotConfig[]
  debug?: boolean
}

interface BotConfig {
  name: string
  context: string
  config: any
}
```

### 适配器类型

```typescript
interface Bot<T extends BotConfig = BotConfig> {
  config: T
  connected?: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendMessage(options: SendOptions): Promise<void>
}

interface SendOptions {
  context: string
  bot: string
  type: 'private' | 'group'
  target: string
  content: string | MessageContent[]
}
```

## 工具函数

```typescript
import { useLogger } from '@zhin.js/core'

// 获取日志记录器
const logger = useLogger()
logger.info('信息')
logger.warn('警告')
logger.error('错误')
```

## 更多资源

- [插件开发指南](../plugin/development.md)
- [适配器开发指南](../adapter/development.md)
- [示例代码](../examples/README.md)

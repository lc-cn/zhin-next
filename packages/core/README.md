# @zhin.js/core

Zhin Bot Framework的核心包，基于HMR系统构建的机器人框架核心实现。

## 主要组件

### App

继承自HMR的应用核心类，提供：
- 插件管理
- 配置管理
- 适配器管理
- 消息路由
- 热更新支持

```typescript
import { createApp } from '@zhin.js/core'

const app = await createApp({
  plugin_dirs: ['./plugins'],
  plugins: ['plugin1'],
  bots: [{
    context: 'adapter-name',
    name: 'bot-name',
    config: {}
  }]
})

await app.start()
```

### Plugin

继承自Dependency的插件基类，提供：
- 中间件系统
- 事件监听
- 定时任务
- 上下文管理
- 消息处理

```typescript
import { usePlugin, onMessage, addMiddleware } from '@zhin.js/core'

const plugin = usePlugin()

addMiddleware(async (message, next) => {
  console.log('收到消息:', message)
  await next()
})

onMessage(async (message) => {
  // 处理消息
})
```

### Adapter

适配器基类，用于实现不同平台的机器人适配：
```typescript
import { Adapter, Bot } from '@zhin.js/core'

class MyAdapter extends Adapter {
  constructor() {
    super('my-adapter', (plugin, config) => new MyBot(plugin, config))
  }
}
```

### Bot

机器人接口定义：
```typescript
export interface Bot<T extends BotConfig=BotConfig> {
  config: T
  connected?: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendMessage(options: SendOptions): Promise<void>
}
```

## Hooks API

### 插件相关
```typescript
// 获取插件实例
const plugin = usePlugin()

// 监听事件
onEvent('event.name', handler)

// 监听群消息
onGroupMessage(handler)

// 监听私聊消息
onPrivateMessage(handler)

// 监听所有消息
onMessage(handler)

// 添加中间件
addMiddleware(middleware)

// 添加定时任务
addCronJob(job)
```

### 上下文相关
```typescript
// 注册上下文
register({
  name: 'myContext',
  async mounted(plugin) {
    return { /* context data */ }
  }
})

// 使用上下文
const ctx = use('myContext')

// 声明上下文依赖
useContext('ctx1', 'ctx2', async (ctx1, ctx2) => {
  // 使用上下文
})
```

### 生命周期
```typescript
// 挂载时
onMounted(async (plugin) => {
  // 初始化
})

// 销毁时
onDispose(() => {
  // 清理
})
```

## 配置

```typescript
interface AppConfig {
  plugin_dirs?: string[]
  plugins?: string[]
  bots?: BotConfig[]
  debug?: boolean
}

interface BotConfig {
  context: string
  name: string
  config: any
}
```

## 许可证

MIT License
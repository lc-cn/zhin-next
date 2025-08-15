# 插件开发指南

本指南将帮助你开发Zhin Bot Framework的插件。

## 插件基础

插件是Zhin框架扩展功能的基本单位。每个插件都是一个独立的模块，可以：
- 处理消息
- 注册命令
- 提供服务
- 添加中间件
- 监听事件
- 管理状态

## 插件结构

一个基本的插件文件结构：

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

// 获取日志记录器
const logger = useLogger()

// 注册上下文（可选）
register({
  name: 'myService',
  async mounted(plugin) {
    return {
      // 服务实现
    }
  },
  async dispose() {
    // 清理资源
  }
})

// 添加中间件（可选）
addMiddleware(async (message, next) => {
  // 前置处理
  await next()
  // 后置处理
})

// 监听消息
onMessage(async (message) => {
  // 处理消息
})

// 监听生命周期（可选）
onMounted(async () => {
  logger.info('插件已加载')
})

onDispose(async () => {
  logger.info('插件即将卸载')
})
```

## 插件生命周期

1. 加载阶段
   - 插件文件被加载
   - 执行插件代码
   - 注册上下文
   - 添加中间件
   - 注册事件监听器

2. 挂载阶段
   - 触发`mounted`事件
   - 上下文准备就绪
   - 可以开始处理消息

3. 运行阶段
   - 处理消息
   - 响应事件
   - 提供服务

4. 卸载阶段
   - 触发`dispose`事件
   - 清理资源
   - 移除事件监听器

## 消息处理

### 中间件

```typescript
import { addMiddleware } from '@zhin.js/core'

addMiddleware(async (message, next) => {
  // 消息预处理
  if (message.content === 'hello') {
    message.content = 'world'
  }
  
  // 调用下一个中间件
  await next()
  
  // 消息后处理
  logger.info('消息处理完成')
})
```

### 消息监听

```typescript
import { onMessage, onGroupMessage, onPrivateMessage } from '@zhin.js/core'

// 监听所有消息
onMessage(async (message) => {
  if (message.content === 'ping') {
    await message.reply('pong')
  }
})

// 监听群消息
onGroupMessage(async (message) => {
  // 处理群消息
})

// 监听私聊消息
onPrivateMessage(async (message) => {
  // 处理私聊消息
})
```

## 上下文系统

### 注册上下文

```typescript
import { register } from '@zhin.js/core'

register({
  name: 'database',
  async mounted(plugin) {
    // 创建数据库连接
    const db = await createConnection()
    return {
      query: async (sql: string) => {
        return db.query(sql)
      }
    }
  },
  async dispose() {
    // 关闭数据库连接
    await db.close()
  }
})
```

### 使用上下文

```typescript
import { use, useContext } from '@zhin.js/core'

// 直接使用
const db = use('database')
await db.query('SELECT * FROM users')

// 声明依赖
useContext('database', async (db) => {
  await db.query('SELECT * FROM users')
})
```

## 定时任务

```typescript
import { addCronJob } from '@zhin.js/core'

addCronJob({
  name: 'daily-task',
  schedule: '0 0 * * *', // 每天0点执行
  async handler() {
    // 执行任务
  }
})
```

## 配置管理

```typescript
import { usePlugin } from '@zhin.js/core'

const plugin = usePlugin()
const config = plugin.app.getConfig()

// 读取配置
const botConfig = config.bots[0]

// 更新配置
plugin.app.updateConfig({
  debug: true
})
```

## 最佳实践

1. 错误处理
```typescript
import { useLogger } from '@zhin.js/core'

const logger = useLogger()

try {
  // 可能出错的代码
} catch (error) {
  logger.error('操作失败:', error)
}
```

2. 资源管理
```typescript
import { onMounted, onDispose } from '@zhin.js/core'

let resource: any

onMounted(async () => {
  resource = await createResource()
})

onDispose(async () => {
  await resource.close()
})
```

3. 模块化
```typescript
// services/database.ts
export function createDatabase() {
  return {
    name: 'database',
    async mounted(plugin) {
      // ...
    }
  }
}

// index.ts
import { register } from '@zhin.js/core'
import { createDatabase } from './services/database'

register(createDatabase())
```

## 调试技巧

1. 使用日志
```typescript
const logger = useLogger()
logger.debug('调试信息')
logger.info('普通信息')
logger.warn('警告信息')
logger.error('错误信息')
```

2. 开发模式
```typescript
// 触发热重载
process.exit(51)
```

3. 性能监控
```typescript
import { usePlugin } from '@zhin.js/core'

const plugin = usePlugin()
const stats = plugin.app.getPerformanceStats()
console.log('性能统计:', stats)
```

## 示例插件

1. 复读机插件
```typescript
import { onMessage } from '@zhin.js/core'

onMessage(async (message) => {
  await message.reply(message.content)
})
```

2. 天气查询插件
```typescript
import { onMessage, register, use } from '@zhin.js/core'

register({
  name: 'weather',
  async mounted() {
    return {
      query: async (city: string) => {
        // 调用天气API
      }
    }
  }
})

onMessage(async (message) => {
  if (message.content.startsWith('天气')) {
    const city = message.content.slice(2)
    const weather = use('weather')
    const result = await weather.query(city)
    await message.reply(result)
  }
})
```

## 更多资源

- [API参考](../api/README.md)
- [示例代码](../examples/README.md)
- [最佳实践](../guide/best-practices.md)

# 示例代码

本目录包含了Zhin Bot Framework的各种示例代码。

## 基础示例

### Hello World

最简单的机器人示例：

```typescript
// src/plugins/hello.ts
import { onMessage } from '@zhin.js/core'

onMessage(async (message) => {
  if (message.content === 'hello') {
    await message.reply('world!')
  }
})
```

### 命令处理

简单的命令处理系统：

```typescript
// src/plugins/command.ts
import { onMessage, useLogger } from '@zhin.js/core'

const logger = useLogger()

// 命令处理器映射
const commands = {
  help: () => '可用命令：help, echo, time',
  echo: (args: string[]) => args.join(' '),
  time: () => new Date().toLocaleString()
}

onMessage(async (message) => {
  // 检查是否是命令
  if (!message.content.startsWith('!')) return
  
  // 解析命令
  const [cmd, ...args] = message.content.slice(1).split(' ')
  
  // 获取处理器
  const handler = commands[cmd]
  if (!handler) return
  
  try {
    // 执行命令
    const result = handler(args)
    await message.reply(result)
  } catch (error) {
    logger.error('命令执行错误:', error)
    await message.reply('命令执行失败')
  }
})
```

## 功能示例

### 天气查询

调用API的示例：

```typescript
// src/plugins/weather.ts
import { onMessage, register, use } from '@zhin.js/core'
import fetch from 'node-fetch'

// 注册天气服务
register({
  name: 'weather',
  async mounted() {
    return {
      query: async (city: string) => {
        const response = await fetch(
          `https://api.weather.com?city=${encodeURIComponent(city)}`
        )
        return response.json()
      }
    }
  }
})

// 使用服务
onMessage(async (message) => {
  if (message.content.startsWith('天气')) {
    const city = message.content.slice(2).trim()
    const weather = use('weather')
    const result = await weather.query(city)
    await message.reply(
      `${city}天气：\n温度：${result.temperature}°C\n湿度：${result.humidity}%`
    )
  }
})
```

### 群管理

群管理功能示例：

```typescript
// src/plugins/group-admin.ts
import { 
  onGroupMessage, 
  register,
  useContext
} from '@zhin.js/core'

// 管理员配置
register({
  name: 'admin',
  async mounted() {
    const admins = new Set(['admin1', 'admin2'])
    return {
      isAdmin: (userId: string) => admins.has(userId),
      addAdmin: (userId: string) => admins.add(userId),
      removeAdmin: (userId: string) => admins.delete(userId)
    }
  }
})

// 使用管理员服务
onGroupMessage(async (message) => {
  const admin = use('admin')
  
  // 检查是否是管理员
  if (!admin.isAdmin(message.sender.id)) return
  
  // 处理管理命令
  if (message.content.startsWith('!kick')) {
    const userId = message.content.split(' ')[1]
    await message.kick(userId)
    await message.reply('已踢出用户')
  }
})
```

### 定时任务

定时发送消息示例：

```typescript
// src/plugins/scheduler.ts
import { addCronJob, sendMessage } from '@zhin.js/core'

// 每天早上9点发送天气
addCronJob({
  name: 'daily-weather',
  schedule: '0 9 * * *',
  async handler() {
    const weather = await getWeather('北京')
    await sendMessage({
      type: 'group',
      target: 'group1',
      content: `早上好！今日天气：\n${weather}`
    })
  }
})

// 每小时整点报时
addCronJob({
  name: 'hourly-clock',
  schedule: '0 * * * *',
  async handler() {
    const now = new Date()
    await sendMessage({
      type: 'group',
      target: 'group1',
      content: `现在是${now.getHours()}点整`
    })
  }
})
```

## 插件示例

### 数据库插件

```typescript
// src/plugins/database.ts
import { register } from '@zhin.js/core'
import { createClient } from 'redis'

register({
  name: 'database',
  async mounted(plugin) {
    // 创建Redis客户端
    const client = createClient()
    await client.connect()
    
    plugin.logger.info('数据库已连接')
    
    return {
      get: (key: string) => client.get(key),
      set: (key: string, value: string) => client.set(key, value),
      del: (key: string) => client.del(key)
    }
  },
  async dispose() {
    // 断开连接
    await client.disconnect()
  }
})
```

### 翻译插件

```typescript
// src/plugins/translator.ts
import { 
  onMessage, 
  register,
  use 
} from '@zhin.js/core'

// 注册翻译服务
register({
  name: 'translator',
  async mounted() {
    return {
      translate: async (text: string, from: string, to: string) => {
        // 调用翻译API
        const response = await fetch(
          'https://api.translate.com/translate',
          {
            method: 'POST',
            body: JSON.stringify({ text, from, to })
          }
        )
        return response.json()
      }
    }
  }
})

// 使用翻译服务
onMessage(async (message) => {
  if (message.content.startsWith('翻译')) {
    const text = message.content.slice(2).trim()
    const translator = use('translator')
    const result = await translator.translate(text, 'auto', 'en')
    await message.reply(result.translated_text)
  }
})
```

## 适配器示例

### WebSocket适配器

```typescript
// src/adapters/websocket.ts
import { Adapter, Bot, SendOptions } from '@zhin.js/core'
import WebSocket from 'ws'

interface WebSocketBotConfig {
  url: string
  token: string
}

class WebSocketBot implements Bot<WebSocketBotConfig> {
  private ws: WebSocket
  connected = false
  
  constructor(
    private plugin: Plugin,
    public config: WebSocketBotConfig
  ) {}
  
  async connect() {
    this.ws = new WebSocket(this.config.url, {
      headers: {
        Authorization: `Bearer ${this.config.token}`
      }
    })
    
    this.ws.on('open', () => {
      this.connected = true
      this.plugin.logger.info('WebSocket已连接')
    })
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      this.plugin.emit('message.receive', message)
    })
    
    this.ws.on('close', () => {
      this.connected = false
      this.plugin.logger.info('WebSocket已断开')
    })
    
    this.ws.on('error', (error) => {
      this.plugin.logger.error('WebSocket错误:', error)
    })
  }
  
  async disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
  
  async sendMessage(options: SendOptions) {
    if (!this.connected) {
      throw new Error('WebSocket未连接')
    }
    
    this.ws.send(JSON.stringify(options))
  }
}

export class WebSocketAdapter extends Adapter<WebSocketBot> {
  constructor() {
    super('websocket', (plugin, config) => new WebSocketBot(plugin, config))
  }
}
```

### HTTP适配器

```typescript
// src/adapters/http.ts
import { Adapter, Bot, SendOptions } from '@zhin.js/core'
import express from 'express'

interface HttpBotConfig {
  port: number
  token: string
}

class HttpBot implements Bot<HttpBotConfig> {
  private server: express.Application
  connected = false
  
  constructor(
    private plugin: Plugin,
    public config: HttpBotConfig
  ) {
    this.server = express()
    this.setupServer()
  }
  
  private setupServer() {
    // 验证token
    this.server.use((req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1]
      if (token !== this.config.token) {
        res.status(401).send('Unauthorized')
        return
      }
      next()
    })
    
    // 接收消息
    this.server.post('/message', (req, res) => {
      this.plugin.emit('message.receive', req.body)
      res.send('OK')
    })
  }
  
  async connect() {
    await new Promise<void>((resolve) => {
      this.server.listen(this.config.port, () => {
        this.connected = true
        this.plugin.logger.info(
          `HTTP服务器已启动: http://localhost:${this.config.port}`
        )
        resolve()
      })
    })
  }
  
  async disconnect() {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
    this.connected = false
  }
  
  async sendMessage(options: SendOptions) {
    // 实现消息发送逻辑
    await fetch('http://api.example.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`
      },
      body: JSON.stringify(options)
    })
  }
}

export class HttpAdapter extends Adapter<HttpBot> {
  constructor() {
    super('http', (plugin, config) => new HttpBot(plugin, config))
  }
}
```

## 完整项目示例

查看[test-bot](../../test-bot)目录，这是一个完整的示例项目，包含了：
- 基础项目结构
- 配置文件
- 插件示例
- 适配器使用
- 开发工具配置

## 更多资源

- [API参考](../api/README.md)
- [插件开发](../plugin/README.md)
- [适配器开发](../adapter/README.md)
- [最佳实践](../guide/best-practices.md)

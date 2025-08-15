# 适配器开发指南

本指南将帮助你为Zhin Bot Framework开发新的平台适配器。

## 适配器基础

适配器是连接不同平台的桥梁，负责：
- 平台连接管理
- 消息收发
- 事件处理
- 会话管理

## 适配器结构

一个基本的适配器实现：

```typescript
import { Adapter, Bot, BotConfig, SendOptions } from '@zhin.js/core'

// Bot配置类型
interface MyBotConfig extends BotConfig {
  token: string
  endpoint: string
}

// Bot实现
class MyBot implements Bot<MyBotConfig> {
  connected = false
  
  constructor(
    private plugin: Plugin,
    public config: MyBotConfig
  ) {}
  
  async connect() {
    // 实现平台连接逻辑
    this.connected = true
  }
  
  async disconnect() {
    // 实现断开连接逻辑
    this.connected = false
  }
  
  async sendMessage(options: SendOptions) {
    // 实现消息发送逻辑
  }
}

// 适配器实现
export class MyAdapter extends Adapter<MyBot> {
  constructor() {
    super('my-adapter', (plugin, config) => new MyBot(plugin, config))
  }
}
```

## 生命周期管理

### 连接管理

```typescript
class MyBot implements Bot {
  private client: any
  
  async connect() {
    try {
      this.client = await createClient(this.config)
      this.connected = true
      
      // 设置事件监听
      this.client.on('message', this.handleMessage.bind(this))
      this.client.on('error', this.handleError.bind(this))
      
    } catch (error) {
      this.plugin.logger.error('连接失败:', error)
      throw error
    }
  }
  
  async disconnect() {
    try {
      await this.client.disconnect()
      this.connected = false
      
    } catch (error) {
      this.plugin.logger.error('断开连接失败:', error)
      throw error
    }
  }
}
```

### 错误处理

```typescript
class MyBot implements Bot {
  private handleError(error: any) {
    this.plugin.logger.error('平台错误:', error)
    
    // 如果是连接错误，尝试重连
    if (error.code === 'CONNECTION_ERROR') {
      this.reconnect()
    }
  }
  
  private async reconnect() {
    try {
      await this.disconnect()
      await this.connect()
    } catch (error) {
      this.plugin.logger.error('重连失败:', error)
    }
  }
}
```

## 消息处理

### 接收消息

```typescript
class MyBot implements Bot {
  private handleMessage(rawMessage: any) {
    // 转换为标准消息格式
    const message = this.convertMessage(rawMessage)
    
    // 触发消息事件
    this.plugin.emit('message.receive', message)
    
    // 根据消息类型触发特定事件
    if (message.type === 'group') {
      this.plugin.emit('message.group.receive', message)
    } else {
      this.plugin.emit('message.private.receive', message)
    }
  }
  
  private convertMessage(raw: any) {
    return {
      id: raw.id,
      type: raw.type,
      content: this.convertContent(raw.content),
      sender: {
        id: raw.sender.id,
        name: raw.sender.name
      },
      reply: async (content: string) => {
        await this.sendMessage({
          type: raw.type,
          target: raw.type === 'group' ? raw.group.id : raw.sender.id,
          content
        })
      }
    }
  }
  
  private convertContent(raw: any) {
    // 转换消息内容为标准格式
    return [{
      type: 'text',
      data: { text: raw.text }
    }]
  }
}
```

### 发送消息

```typescript
class MyBot implements Bot {
  async sendMessage(options: SendOptions) {
    try {
      // 转换为平台格式
      const platformMessage = this.convertToPlatformFormat(options)
      
      // 发送消息
      await this.client.sendMessage(platformMessage)
      
    } catch (error) {
      this.plugin.logger.error('发送消息失败:', error)
      throw error
    }
  }
  
  private convertToPlatformFormat(options: SendOptions) {
    // 将标准格式转换为平台格式
    return {
      type: options.type,
      target: options.target,
      content: this.convertContent(options.content)
    }
  }
}
```

## 会话管理

```typescript
class MyBot implements Bot {
  private sessions = new Map<string, any>()
  
  private handleMessage(raw: any) {
    const sessionId = this.getSessionId(raw)
    let session = this.sessions.get(sessionId)
    
    if (!session) {
      session = this.createSession(raw)
      this.sessions.set(sessionId, session)
    }
    
    // 更新会话状态
    session.lastActivity = Date.now()
    
    // 处理消息
    this.handleSessionMessage(session, raw)
  }
  
  private getSessionId(raw: any) {
    return raw.type === 'group' 
      ? `group:${raw.group.id}`
      : `private:${raw.sender.id}`
  }
  
  private createSession(raw: any) {
    return {
      id: this.getSessionId(raw),
      type: raw.type,
      target: raw.type === 'group' ? raw.group.id : raw.sender.id,
      created: Date.now(),
      lastActivity: Date.now()
    }
  }
}
```

## 配置管理

```typescript
interface MyBotConfig extends BotConfig {
  token: string
  endpoint: string
  options?: {
    reconnect?: boolean
    timeout?: number
  }
}

class MyBot implements Bot<MyBotConfig> {
  private getOptions() {
    return {
      reconnect: true,
      timeout: 5000,
      ...this.config.options
    }
  }
  
  async connect() {
    const options = this.getOptions()
    this.client = await createClient(this.config.token, {
      endpoint: this.config.endpoint,
      timeout: options.timeout,
      reconnect: options.reconnect
    })
  }
}
```

## 最佳实践

1. 错误处理
```typescript
class MyBot implements Bot {
  private async safeCall<T>(
    action: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await action()
    } catch (error) {
      this.plugin.logger.error(errorMessage, error)
      throw error
    }
  }
  
  async sendMessage(options: SendOptions) {
    return this.safeCall(
      () => this.client.sendMessage(options),
      '发送消息失败'
    )
  }
}
```

2. 重试机制
```typescript
class MyBot implements Bot {
  private async withRetry<T>(
    action: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await action()
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(r => setTimeout(r, delay))
      }
    }
    throw new Error('Max retries reached')
  }
}
```

3. 资源清理
```typescript
class MyBot implements Bot {
  private cleanupHandlers: (() => Promise<void>)[] = []
  
  async disconnect() {
    // 执行所有清理处理器
    await Promise.all(
      this.cleanupHandlers.map(handler => handler())
    )
    this.cleanupHandlers = []
  }
  
  private addCleanup(handler: () => Promise<void>) {
    this.cleanupHandlers.push(handler)
  }
}
```

## 示例适配器

1. WebSocket适配器
```typescript
class WebSocketBot implements Bot {
  private ws: WebSocket
  
  async connect() {
    this.ws = new WebSocket(this.config.endpoint)
    
    this.ws.on('message', this.handleMessage.bind(this))
    this.ws.on('error', this.handleError.bind(this))
    this.ws.on('close', this.handleClose.bind(this))
    
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', () => resolve())
      this.ws.once('error', reject)
    })
  }
  
  async sendMessage(options: SendOptions) {
    await this.ws.send(JSON.stringify(options))
  }
}
```

2. HTTP适配器
```typescript
class HttpBot implements Bot {
  private token: string
  
  async connect() {
    // 验证token
    const response = await fetch(
      `${this.config.endpoint}/auth`,
      {
        headers: { 
          Authorization: `Bearer ${this.config.token}`
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Authentication failed')
    }
    
    this.token = await response.text()
  }
  
  async sendMessage(options: SendOptions) {
    const response = await fetch(
      `${this.config.endpoint}/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to send message')
    }
  }
}
```

## 更多资源

- [API参考](../api/README.md)
- [示例代码](../examples/README.md)
- [最佳实践](../guide/best-practices.md)

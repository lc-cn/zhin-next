# @zhin.js/logger

Zhin Bot Framework 的结构化日志系统。

## 特性

- 🎨 **多级别日志**: DEBUG, INFO, WARN, ERROR
- 🎯 **命名空间**: 支持分层次的 Logger 命名空间
- 🎪 **多种输出**: 控制台、文件等多种输出方式
- 🌈 **彩色输出**: 自动色彩编码的控制台输出
- 📊 **结构化元数据**: 支持结构化的上下文信息
- ⚡ **性能监控**: 内置性能计时功能
- 🛡️ **类型安全**: 完整的 TypeScript 类型支持

## 安装

```bash
pnpm add @zhin.js/logger
```

## 基础用法

### 创建 Logger

```typescript
import { createLogger, LogLevel } from '@zhin.js/logger'

// 创建命名空间 Logger
const logger = createLogger('MyModule')

// 基础日志记录
logger.debug('调试信息')
logger.info('一般信息')
logger.success('成功操作') // 带绿色 ✓ 标记
logger.warn('警告信息')
logger.error('错误信息')
```

### 带元数据的日志

```typescript
logger.info('用户登录', {
  userId: 123,
  username: 'john_doe',
  ip: '192.168.1.1'
})

// 输出结果：
// [2024-01-01T12:00:00.000Z] [INFO] [MyModule] 用户登录
// {
//   "userId": 123,
//   "username": "john_doe", 
//   "ip": "192.168.1.1"
// }
```

### 错误处理

```typescript
try {
  // 一些可能抛出错误的代码
} catch (error) {
  logger.error('操作失败', { context: 'user-action' }, error)
  // 或者
  logger.error('操作失败', error)
}
```

### 子 Logger

```typescript
const mainLogger = createLogger('App')
const dbLogger = mainLogger.child('Database')
const apiLogger = mainLogger.child('API')

dbLogger.info('数据库连接成功')    // [App:Database] ...
apiLogger.warn('API 调用缓慢')     // [App:API] ...
```

## 高级用法

### 设置日志级别

```typescript
import { setGlobalLogLevel, LogLevel } from '@zhin.js/logger'

// 全局设置
setGlobalLogLevel(LogLevel.WARN) // 只显示 WARN 和 ERROR

// 单个 Logger 设置
logger.setLevel(LogLevel.DEBUG)
```

### 自定义格式化器

```typescript
import { Logger, ConsoleFormatter } from '@zhin.js/logger'

const customFormatter = new ConsoleFormatter({
  showTimestamp: false,
  showNamespace: true,
  colorize: true
})

const logger = new Logger('Custom', {
  formatter: customFormatter
})
```

### 文件输出

```typescript
import { Logger, FileTransport, ConsoleTransport } from '@zhin.js/logger'

const logger = new Logger('FileLogger', {
  transports: [
    new ConsoleTransport(),
    new FileTransport('./logs/app.log')
  ]
})
```

### 性能监控

```typescript
const timer = logger.time('数据库查询')

// ... 执行数据库查询

timer.end() // 输出: 数据库查询 took 45.67ms
```

### 条件日志

```typescript
const isDebugMode = process.env.NODE_ENV === 'development'

logger.logIf(isDebugMode, LogLevel.DEBUG, '调试模式信息', {
  memoryUsage: process.memoryUsage()
})
```

## API 参考

### LogLevel

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1, 
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}
```

### Logger 类

```typescript
class Logger {
  // 构造函数
  constructor(namespace?: string, options?: LoggerOptions)
  
  // 日志方法
  debug(message: string, metadata?: Record<string, any>): void
  info(message: string, metadata?: Record<string, any>): void
  success(message: string, metadata?: Record<string, any>): void
  warn(message: string, metadata?: Record<string, any>): void
  error(message: string, metadataOrError?: Record<string, any> | Error, error?: Error): void
  
  // 工具方法
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  child(namespace: string): Logger
  time(label: string): { end(): void }
  logIf(condition: boolean, level: LogLevel, message: string, metadata?: Record<string, any>): void
}
```

### 便捷函数

```typescript
// 创建 Logger
function createLogger(namespace: string): Logger

// 获取默认 Logger  
function getDefaultLogger(): Logger

// 设置全局日志级别
function setGlobalLogLevel(level: LogLevel): void

// 添加全局输出器
function addGlobalTransport(transport: LogTransport): void
```

## 在 Zhin 插件中使用

```typescript
import { Plugin } from 'zhin.js'
import { createLogger } from '@zhin.js/logger'

export default class MyPlugin extends Plugin {
  private logger = createLogger(`Plugin:${this.name}`)

  async onMounted() {
    this.logger.success('插件加载成功')
    
    this.logger.info('初始化配置', {
      config: this.config
    })
  }

  async handleMessage(message: Message) {
    const timer = this.logger.time('消息处理')
    
    try {
      // 处理消息逻辑
      this.logger.debug('处理消息', {
        messageId: message.id,
        content: message.content
      })
      
    } catch (error) {
      this.logger.error('消息处理失败', {
        messageId: message.id,
        error: error.message
      }, error)
    } finally {
      timer.end()
    }
  }
}
```

## License

MIT

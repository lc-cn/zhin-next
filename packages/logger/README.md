# @zhin.js/logger

基于 [Pino](https://getpino.io) 的高性能日志库，为 Zhin Bot Framework 提供完整的日志记录功能。

## 特性

- 🚀 **极致性能**: 基于 Pino 构建，Node.js 生态中最快的 JSON 日志库
- 📊 **结构化日志**: 原生支持 JSON 格式的结构化日志
- 🎨 **美化输出**: 使用 pino-pretty 进行开发时的友好输出
- 🎯 **子 Logger**: 支持基于上下文的子 Logger
- ⚡ **性能监控**: 内置高精度性能计时功能
- 🛡️ **类型安全**: 完整的 TypeScript 类型支持
- 🔧 **灵活配置**: 丰富的配置选项，支持自定义输出目标

## 安装

```bash
pnpm add @zhin.js/logger
```

## 基础用法

### 创建 Logger

```typescript
import { createLogger, LogLevel } from '@zhin.js/logger'

// 创建基础 Logger
const logger = createLogger('MyApp')

// 基础日志记录
logger.trace('追踪信息')
logger.debug('调试信息')
logger.info('一般信息')
logger.success('成功操作') // 带绿色 ✓ 标记
logger.warn('警告信息')
logger.error('错误信息')
logger.fatal('致命错误')
```

### 结构化日志

```typescript
// 使用结构化数据
logger.info({ userId: 123, action: 'login' }, '用户登录')

// 输出结果 (JSON):
// {"level":30,"time":1640995200000,"pid":12345,"hostname":"localhost","userId":123,"action":"login","msg":"用户登录"}

// 开发环境下 (pretty 输出):
// [2024-01-01 12:00:00.000] INFO (MyApp): 用户登录
//     userId: 123
//     action: "login"
```

### 错误处理

```typescript
try {
  // 一些可能抛出错误的代码
} catch (error) {
  // Pino 自动处理 Error 对象
  logger.error({ error }, '操作失败')
  
  // 或者简单记录错误
  logger.error(error, '操作失败')
}
```

### 子 Logger

```typescript
const appLogger = createLogger('App')

// 使用字符串创建子 Logger
const dbLogger = appLogger.child('Database')
const apiLogger = appLogger.child('API')

// 使用对象创建带更多上下文的子 Logger
const requestLogger = appLogger.child({
  module: 'HTTP',
  requestId: 'req-123',
  userId: 456
})

dbLogger.info('数据库连接成功')     // [App] Database: 数据库连接成功
apiLogger.warn('API 调用缓慢')      // [App] API: API 调用缓慢
requestLogger.info('处理请求')      // [App] 处理请求 (requestId: req-123, userId: 456)
```

## 高级用法

### 自定义配置

```typescript
import { createLogger, LogLevel } from '@zhin.js/logger'

const logger = createLogger('CustomApp', {
  level: LogLevel.DEBUG,
  pretty: true,
  prettyOptions: {
    colorize: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    ignore: 'pid,hostname',
    singleLine: true
  }
})
```

### 文件输出

```typescript
import fs from 'node:fs'

// 输出到文件
const fileLogger = createLogger('FileApp', {
  pretty: false, // 文件输出使用 JSON 格式
  destination: fs.createWriteStream('./logs/app.log')
})

// 或者使用文件路径
const pathLogger = createLogger('PathApp', {
  pretty: false,
  destination: './logs/app.log'
})
```

### 全局配置

```typescript
import { setGlobalOptions, setGlobalLogLevel, LogLevel } from '@zhin.js/logger'

// 设置全局选项
setGlobalOptions({
  level: LogLevel.INFO,
  pretty: true,
  prettyOptions: {
    colorize: true,
    singleLine: false
  }
})

// 设置全局日志级别
setGlobalLogLevel(LogLevel.WARN) // 只显示 WARN 及以上级别
```

### 性能监控

```typescript
const logger = createLogger('Performance')

// 方式1: 使用返回的 Timer
const timer = logger.time('数据库查询')
// ... 执行数据库查询
timer.end() // 自动记录耗时

// 方式2: 使用 timeEnd
logger.time('API 请求')
// ... 执行 API 请求
logger.timeEnd('API 请求')
```

### 条件日志

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

logger.logIf(isDevelopment, LogLevel.DEBUG, { memoryUsage: process.memoryUsage() }, '内存使用情况')
logger.logIf(isProduction, LogLevel.INFO, '生产环境运行中')
```

## 便捷函数

```typescript
import { trace, debug, info, success, warn, error, fatal } from '@zhin.js/logger'

// 直接使用全局便捷函数 (使用默认 Logger)
info('应用启动')
success('初始化完成')
warn('配置文件未找到，使用默认配置')
error({ error: new Error('连接失败') }, '数据库连接失败')
```

## API 参考

### LogLevel

```typescript
enum LogLevel {
  TRACE = 10,
  DEBUG = 20, 
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
  SILENT = Infinity
}
```

### ZhinLoggerOptions

```typescript
interface ZhinLoggerOptions {
  level?: LogLevel                    // 日志级别
  name?: string                       // Logger 名称
  pretty?: boolean                    // 是否启用美化输出
  prettyOptions?: {                   // pino-pretty 选项
    colorize?: boolean
    translateTime?: string | boolean
    ignore?: string
    hideObject?: boolean
    singleLine?: boolean
  }
  destination?: string | NodeJS.WritableStream  // 输出目标
  pinoOptions?: LoggerOptions         // 原生 Pino 选项
}
```

### Logger 类

```typescript
class Logger {
  // 构造函数
  constructor(options?: ZhinLoggerOptions)
  
  // 日志方法 (支持多种重载)
  trace(obj: any, msg?: string, ...args: any[]): void
  trace(msg: string, ...args: any[]): void
  
  debug(obj: any, msg?: string, ...args: any[]): void
  debug(msg: string, ...args: any[]): void
  
  info(obj: any, msg?: string, ...args: any[]): void
  info(msg: string, ...args: any[]): void
  
  success(obj: any, msg?: string, ...args: any[]): void
  success(msg: string, ...args: any[]): void
  
  warn(obj: any, msg?: string, ...args: any[]): void
  warn(msg: string, ...args: any[]): void
  
  error(obj: any, msg?: string, ...args: any[]): void
  error(msg: string, ...args: any[]): void
  
  fatal(obj: any, msg?: string, ...args: any[]): void
  fatal(msg: string, ...args: any[]): void
  
  // 工具方法
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  isLevelEnabled(level: LogLevel): boolean
  child(bindings: Record<string, any> | string): Logger
  time(label: string): Timer
  timeEnd(label: string): void
  logIf(condition: boolean, level: LogLevel, ...args: any[]): void
  getInternalLogger(): PinoLogger
  fork(options?: ZhinLoggerOptions): Logger
  flush(): void
}
```

### 便捷函数

```typescript
// Logger 管理
function createLogger(name: string, options?: ZhinLoggerOptions): Logger
function getDefaultLogger(): Logger
function getLogger(name: string): Logger

// 全局配置
function setGlobalLogLevel(level: LogLevel): void
function setGlobalOptions(options: ZhinLoggerOptions): void
function getGlobalOptions(): ZhinLoggerOptions

// Logger 管理
function removeLogger(name: string): boolean
function getLoggerNames(): string[]
function clearLoggers(): void
function shutdown(): void
```

## 在 Zhin 插件中使用

```typescript
import { Plugin } from 'zhin.js'
import { createLogger } from '@zhin.js/logger'

export default class MyPlugin extends Plugin {
  private logger = createLogger(`Plugin:${this.name}`)

  async onMounted() {
    this.logger.success('插件加载成功')
    
    this.logger.info({ 
      config: this.config,
      version: this.version 
    }, '插件初始化')
  }

  async handleMessage(message: Message) {
    const requestLogger = this.logger.child({
      messageId: message.id,
      userId: message.author?.id,
      channelId: message.channel?.id
    })
    
    const timer = requestLogger.time('消息处理')
    
    try {
      requestLogger.debug('开始处理消息')
      
      // 处理消息逻辑
      await this.processMessage(message)
      
      requestLogger.success('消息处理完成')
      
    } catch (error) {
      requestLogger.error({ error }, '消息处理失败')
      throw error
      
    } finally {
      timer.end()
    }
  }
}
```

## 与 Pino 生态集成

由于底层使用 Pino，你可以利用 Pino 的丰富生态：

```typescript
import { createLogger } from '@zhin.js/logger'

// 获取底层 Pino 实例
const logger = createLogger('MyApp')
const pinoLogger = logger.getInternalLogger()

// 使用 Pino 的原生功能
pinoLogger.addHook('logMethod', function (inputArgs, method) {
  // 添加钩子
})
```

## 性能说明

基于 Pino 的实现提供了极致的性能：

- **生产环境**: 使用 JSON 格式，性能最优
- **开发环境**: 使用 pino-pretty 美化输出，便于阅读
- **异步输出**: 支持异步日志输出，不阻塞主线程
- **零拷贝**: Pino 的零拷贝 JSON 序列化

## License

MIT
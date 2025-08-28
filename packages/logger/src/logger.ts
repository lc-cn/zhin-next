import chalk from 'chalk'
import { performance } from 'node:perf_hooks'
import { format } from 'node:util'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * 日志级别名称映射
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT'
}

/**
 * 日志级别颜色映射
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, (text: string) => string> = {
  [LogLevel.DEBUG]: chalk.gray,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.SILENT]: chalk.gray
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  namespace?: string
  metadata?: Record<string, any>
  error?: Error
  stack?: string
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  format(entry: LogEntry): string
}

/**
 * 日志输出接口
 */
export interface LogTransport {
  write(entry: LogEntry, formatted: string): void
}

/**
 * 默认控制台格式化器
 */
export class ConsoleFormatter implements LogFormatter {
  constructor(
    private options: {
      showTimestamp?: boolean
      showNamespace?: boolean
      colorize?: boolean
    } = {}
  ) {
    this.options = {
      showTimestamp: true,
      showNamespace: true,
      colorize: true,
      ...options
    }
  }

  format(entry: LogEntry): string {
    const parts: string[] = []
    
    // 时间戳
    if (this.options.showTimestamp) {
      const timestamp = this.options.colorize 
        ? chalk.gray(entry.timestamp)
        : entry.timestamp
      parts.push(`[${timestamp}]`)
    }

    // 日志级别
    const levelName = LOG_LEVEL_NAMES[entry.level]
    const coloredLevel = this.options.colorize 
      ? LOG_LEVEL_COLORS[entry.level](levelName)
      : levelName
    parts.push(`[${coloredLevel}]`)

    // 命名空间
    if (entry.namespace && this.options.showNamespace) {
      const namespace = this.options.colorize 
        ? chalk.cyan(entry.namespace)
        : entry.namespace
      parts.push(`[${namespace}]`)
    }

    // 消息
    parts.push(entry.message)

    // 元数据
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      const metaStr = JSON.stringify(entry.metadata, null, 2)
      const coloredMeta = this.options.colorize 
        ? chalk.gray(metaStr)
        : metaStr
      parts.push(`\n${coloredMeta}`)
    }

    // 错误堆栈
    if (entry.error?.stack) {
      const stack = this.options.colorize 
        ? chalk.red(entry.error.stack)
        : entry.error.stack
      parts.push(`\n${stack}`)
    }

    return parts.join(' ')
  }
}

/**
 * 控制台输出器
 */
export class ConsoleTransport implements LogTransport {
  write(entry: LogEntry, formatted: string): void {
    const output = entry.level >= LogLevel.ERROR ? process.stderr : process.stdout
    output.write(formatted + '\n')
  }
}

/**
 * 文件输出器
 */
export class FileTransport implements LogTransport {
  constructor(private filePath: string) {}

  write(entry: LogEntry, formatted: string): void {
    // 简化实现，实际项目中可能需要使用 fs.appendFileSync 或异步写入
    const fs = require('node:fs')
    fs.appendFileSync(this.filePath, formatted + '\n', 'utf8')
  }
}

/**
 * Logger 类
 */
export class Logger {
  private transports: LogTransport[] = []
  private formatter: LogFormatter
  private minLevel: LogLevel = LogLevel.INFO

  constructor(
    private namespace?: string,
    options: {
      level?: LogLevel
      formatter?: LogFormatter
      transports?: LogTransport[]
    } = {}
  ) {
    this.minLevel = options.level ?? LogLevel.INFO
    this.formatter = options.formatter ?? new ConsoleFormatter()
    this.transports = options.transports ?? [new ConsoleTransport()]
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.minLevel
  }

  /**
   * 添加输出器
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * 移除输出器
   */
  removeTransport(transport: LogTransport): void {
    const index = this.transports.indexOf(transport)
    if (index > -1) {
      this.transports.splice(index, 1)
    }
  }

  /**
   * 创建子 Logger
   */
  child(namespace: string): Logger {
    const childNamespace = this.namespace 
      ? `${this.namespace}:${namespace}`
      : namespace
    
    return new Logger(childNamespace, {
      level: this.minLevel,
      formatter: this.formatter,
      transports: this.transports
    })
  }

  /**
   * 记录日志的通用方法
   */
  private log(
    level: LogLevel, 
    message: string, 
    metadata?: Record<string, any>, 
    error?: Error
  ): void {
    if (level < this.minLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message: format(message),
      timestamp: new Date().toISOString(),
      namespace: this.namespace,
      metadata,
      error,
      stack: error?.stack
    }

    const formatted = this.formatter.format(entry)
    
    for (const transport of this.transports) {
      try {
        transport.write(entry, formatted)
      } catch (err) {
        // 避免日志系统本身的错误导致应用崩溃
        process.stderr.write(`Logger transport error: ${err}\n`)
      }
    }
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  /**
   * Info 级别日志
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  /**
   * Success 日志 (Info 级别，但带有绿色标识)
   */
  success(message: string, metadata?: Record<string, any>): void {
    const successMessage = chalk.green('✓ ') + message
    this.log(LogLevel.INFO, successMessage, metadata)
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  /**
   * Error 级别日志
   */
  error(message: string, metadataOrError?: Record<string, any> | Error, error?: Error): void {
    let metadata: Record<string, any> | undefined
    let errorObj: Error | undefined

    if (metadataOrError instanceof Error) {
      errorObj = metadataOrError
    } else {
      metadata = metadataOrError
      errorObj = error
    }

    this.log(LogLevel.ERROR, message, metadata, errorObj)
  }

  /**
   * 性能测量
   */
  time(label: string): void {
    const startTime = performance.now()
    
    return {
      end: () => {
        const duration = performance.now() - startTime
        this.info(`${label} took ${duration.toFixed(2)}ms`)
      }
    } as any
  }

  /**
   * 条件日志
   */
  logIf(condition: boolean, level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (condition) {
      this.log(level, message, metadata)
    }
  }
}

/**
 * 全局 Logger 管理器
 */
export class LoggerManager {
  private static instance: LoggerManager
  private loggers = new Map<string, Logger>()
  private globalLevel: LogLevel = LogLevel.INFO
  private globalFormatter: LogFormatter = new ConsoleFormatter()
  private globalTransports: LogTransport[] = [new ConsoleTransport()]

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager()
    }
    return LoggerManager.instance
  }

  /**
   * 设置全局日志级别
   */
  setGlobalLevel(level: LogLevel): void {
    this.globalLevel = level
    for (const logger of this.loggers.values()) {
      logger.setLevel(level)
    }
  }

  /**
   * 设置全局格式化器
   */
  setGlobalFormatter(formatter: LogFormatter): void {
    this.globalFormatter = formatter
  }

  /**
   * 添加全局输出器
   */
  addGlobalTransport(transport: LogTransport): void {
    this.globalTransports.push(transport)
  }

  /**
   * 获取或创建 Logger
   */
  getLogger(namespace: string): Logger {
    if (!this.loggers.has(namespace)) {
      const logger = new Logger(namespace, {
        level: this.globalLevel,
        formatter: this.globalFormatter,
        transports: [...this.globalTransports]
      })
      this.loggers.set(namespace, logger)
    }
    return this.loggers.get(namespace)!
  }

  /**
   * 创建 Logger（别名）
   */
  createLogger(namespace: string): Logger {
    return this.getLogger(namespace)
  }
}

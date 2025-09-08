import pino, { Logger as PinoLogger, LoggerOptions } from 'pino'
import chalk from 'chalk'
import { performance } from 'node:perf_hooks'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
  SILENT = Infinity
}

/**
 * 日志级别映射到pino级别
 */
export const LOG_LEVEL_MAPPING: Record<LogLevel, pino.Level | 'silent'> = {
  [LogLevel.TRACE]: 'trace',
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.FATAL]: 'fatal',
  [LogLevel.SILENT]: 'silent'
}

/**
 * 日志级别名称映射
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT'
}

/**
 * 日志级别颜色映射
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, (text: string) => string> = {
  [LogLevel.TRACE]: chalk.gray,
  [LogLevel.DEBUG]: chalk.blue,
  [LogLevel.INFO]: chalk.cyan,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.FATAL]: chalk.magenta,
  [LogLevel.SILENT]: chalk.gray
}

/**
 * 性能计时器接口
 */
export interface Timer {
  end(): void
}

/**
 * Logger 配置选项
 */
export interface ZhinLoggerOptions {
  level?: LogLevel
  name?: string
  pretty?: boolean
  prettyOptions?: {
    colorize?: boolean
    translateTime?: string | boolean
    ignore?: string
    hideObject?: boolean
    singleLine?: boolean
  }
  destination?: string | NodeJS.WritableStream
  pinoOptions?: LoggerOptions
}

/**
 * 默认的 pretty 配置
 */
export const DEFAULT_PRETTY_OPTIONS = {
  colorize: true,
  translateTime: 'mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname',
  hideObject: false,
  singleLine: false
}

/**
 * Logger 类 - 基于 pino 的封装
 */
export class Logger {
  private pinoLogger: PinoLogger
  private timers = new Map<string, number>()
  private namespace:string
  constructor(options: ZhinLoggerOptions = {}) {
    this.namespace=options.name||'zhin'
    const {
      level = LogLevel.INFO,
      name = 'zhin',
      pretty = true,
      prettyOptions = DEFAULT_PRETTY_OPTIONS,
      destination,
      pinoOptions = {}
    } = options

    // 准备 pino 配置
    const pinoConfig: LoggerOptions = {
      name,
      level: LOG_LEVEL_MAPPING[level],
      ...pinoOptions
    }

    // 配置输出目标
    let transport: any = undefined
    
    if (pretty && !destination) {
      // 使用 pino-pretty 进行美化输出
      transport = {
        target: 'pino-pretty',
        options: {
          ...DEFAULT_PRETTY_OPTIONS,
          ...prettyOptions
        }
      }
    }

    if (transport) {
      pinoConfig.transport = transport
    }

    // 创建 pino logger
    if (destination) {
      if (typeof destination === 'string') {
        // 如果是字符串路径，需要创建写入流
        const fs = require('node:fs')
        const stream = fs.createWriteStream(destination, { flags: 'a' })
        this.pinoLogger = pino(pinoConfig, stream)
      } else {
        this.pinoLogger = pino(pinoConfig, destination)
      }
    } else {
      this.pinoLogger = pino(pinoConfig)
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    const pinoLevel = LOG_LEVEL_MAPPING[level]
    // pino 支持 silent 级别，直接设置字符串
    this.pinoLogger.level = pinoLevel as any
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    const levelStr = this.pinoLogger.level
    for (const [level, mapping] of Object.entries(LOG_LEVEL_MAPPING)) {
      if (mapping === levelStr) {
        return parseInt(level) as LogLevel
      }
    }
    return LogLevel.INFO
  }

  /**
   * 检查指定级别是否启用
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this.pinoLogger.isLevelEnabled(LOG_LEVEL_MAPPING[level])
  }

  /**
   * 创建子 Logger
   */
  child(bindings: Record<string, any> | string): Logger {
    let childBindings: Record<string, any>
    
    if (typeof bindings === 'string') {
      childBindings = { module: bindings }
    } else {
      childBindings = bindings
    }

    const childLogger = new Logger()
    childLogger.pinoLogger = this.pinoLogger.child(childBindings)
    return childLogger
  }

  /**
   * TRACE 级别日志
   */
  trace(obj: any, msg?: string, ...args: any[]): void
  trace(msg: string, ...args: any[]): void
  trace(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.trace(objOrMsg, ...args)
    } else {
      this.pinoLogger.trace(objOrMsg, msg, ...args)
    }
  }

  /**
   * DEBUG 级别日志
   */
  debug(obj: any, msg?: string, ...args: any[]): void
  debug(msg: string, ...args: any[]): void
  debug(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.debug(objOrMsg, ...args)
    } else {
      this.pinoLogger.debug(objOrMsg, msg, ...args)
    }
  }

  /**
   * INFO 级别日志
   */
  info(obj: any, msg?: string, ...args: any[]): void
  info(msg: string, ...args: any[]): void
  info(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.info(objOrMsg, ...args)
    } else {
      this.pinoLogger.info(objOrMsg, msg, ...args)
    }
  }

  /**
   * SUCCESS 日志 (INFO 级别，带绿色勾号)
   */
  success(obj: any, msg?: string, ...args: any[]): void
  success(msg: string, ...args: any[]): void
  success(objOrMsg: any, msg?: string, ...args: any[]): void {
    const successSymbol = chalk.green('✓')
    
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.info(`${successSymbol} ${objOrMsg}`, ...args)
    } else {
      this.pinoLogger.info(objOrMsg, `${successSymbol} ${msg}`, ...args)
    }
  }

  /**
   * WARN 级别日志
   */
  warn(obj: any, msg?: string, ...args: any[]): void
  warn(msg: string, ...args: any[]): void
  warn(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.warn(objOrMsg, ...args)
    } else {
      this.pinoLogger.warn(objOrMsg, msg, ...args)
    }
  }

  /**
   * ERROR 级别日志
   */
  error(obj: any, msg?: string, ...args: any[]): void
  error(msg: string, ...args: any[]): void
  error(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.error(objOrMsg, ...args)
    } else {
      this.pinoLogger.error(objOrMsg, msg, ...args)
    }
  }

  /**
   * FATAL 级别日志
   */
  fatal(obj: any, msg?: string, ...args: any[]): void
  fatal(msg: string, ...args: any[]): void
  fatal(objOrMsg: any, msg?: string, ...args: any[]): void {
    if (typeof objOrMsg === 'string') {
      this.pinoLogger.fatal(objOrMsg, ...args)
    } else {
      this.pinoLogger.fatal(objOrMsg, msg, ...args)
    }
  }

  /**
   * 开始性能计时
   */
  time(label: string): Timer {
    const startTime = performance.now()
    this.timers.set(label, startTime)

    return {
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        this.timers.delete(label)
        this.info({ duration: `${duration.toFixed(2)}ms` }, `Timer: ${label}`)
      }
    }
  }

  /**
   * 结束性能计时
   */
  timeEnd(label: string): void {
    const startTime = this.timers.get(label)
    if (startTime) {
      const duration = performance.now() - startTime
      this.timers.delete(label)
      this.info({ duration: `${duration.toFixed(2)}ms` }, `Timer: ${label}`)
    } else {
      this.warn(`Timer '${label}' does not exist`)
    }
  }

  /**
   * 条件日志
   */
  logIf(condition: boolean, level: LogLevel, obj: any, msg?: string, ...args: any[]): void
  logIf(condition: boolean, level: LogLevel, msg: string, ...args: any[]): void
  logIf(condition: boolean, level: LogLevel, objOrMsg: any, msg?: string, ...args: any[]): void {
    if (!condition) return

    switch (level) {
      case LogLevel.TRACE:
        this.trace(objOrMsg, msg, ...args)
        break
      case LogLevel.DEBUG:
        this.debug(objOrMsg, msg, ...args)
        break
      case LogLevel.INFO:
        this.info(objOrMsg, msg, ...args)
        break
      case LogLevel.WARN:
        this.warn(objOrMsg, msg, ...args)
        break
      case LogLevel.ERROR:
        this.error(objOrMsg, msg, ...args)
        break
      case LogLevel.FATAL:
        this.fatal(objOrMsg, msg, ...args)
        break
    }
  }

  /**
   * 获取底层 pino logger 实例
   */
  getInternalLogger(): PinoLogger {
    return this.pinoLogger
  }

  /**
   * 创建新的 Logger 实例，继承当前配置
   */
  fork(options: ZhinLoggerOptions = {}): Logger {
    const newLogger = new Logger(options)
    return newLogger
  }

  /**
   * 刷新日志缓冲区
   */
  flush(): void {
    if (this.pinoLogger.flush) {
      this.pinoLogger.flush()
    }
  }
}

/**
 * Logger 管理器
 */
export class LoggerManager {
  private static instance: LoggerManager
  private loggers = new Map<string, Logger>()
  private globalOptions: ZhinLoggerOptions = {
    level: LogLevel.INFO,
    pretty: true
  }

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager()
    }
    return LoggerManager.instance
  }

  /**
   * 设置全局配置
   */
  setGlobalOptions(options: ZhinLoggerOptions): void {
    this.globalOptions = { ...this.globalOptions, ...options }
    
    // 重新配置所有现有的 loggers
    for (const [name, logger] of this.loggers) {
      const newLogger = new Logger({ ...this.globalOptions, name })
      this.loggers.set(name, newLogger)
    }
  }

  /**
   * 获取全局配置
   */
  getGlobalOptions(): ZhinLoggerOptions {
    return { ...this.globalOptions }
  }

  /**
   * 设置全局日志级别
   */
  setGlobalLevel(level: LogLevel): void {
    this.globalOptions.level = level
    for (const logger of this.loggers.values()) {
      logger.setLevel(level)
    }
  }

  /**
   * 获取或创建 Logger
   */
  getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      const logger = new Logger({ ...this.globalOptions, name })
      this.loggers.set(name, logger)
    }
    return this.loggers.get(name)!
  }

  /**
   * 创建 Logger（别名）
   */
  createLogger(name: string): Logger {
    return this.getLogger(name)
  }

  /**
   * 移除 Logger
   */
  removeLogger(name: string): boolean {
    return this.loggers.delete(name)
  }

  /**
   * 获取所有 Logger 名称
   */
  getLoggerNames(): string[] {
    return Array.from(this.loggers.keys())
  }

  /**
   * 清理所有 Logger
   */
  clear(): void {
    // 刷新所有logger
    for (const logger of this.loggers.values()) {
      logger.flush()
    }
    this.loggers.clear()
  }

  /**
   * 关闭所有 Logger 并清理资源
   */
  shutdown(): void {
    this.clear()
  }
}
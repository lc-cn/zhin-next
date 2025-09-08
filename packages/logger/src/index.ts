import { Logger, LoggerManager, LogLevel, ZhinLoggerOptions } from './logger.js'

// 导出核心类和接口
export {
  Logger,
  LoggerManager,
  LogLevel,
  LOG_LEVEL_NAMES,
  LOG_LEVEL_COLORS,
  LOG_LEVEL_MAPPING,
  DEFAULT_PRETTY_OPTIONS
} from './logger.js'

export type {
  ZhinLoggerOptions,
  Timer
} from './logger.js'

// 全局管理器实例
const manager = LoggerManager.getInstance()

/**
 * 创建或获取指定名称的 Logger
 * @param name Logger 名称
 * @param options Logger 选项
 * @returns Logger 实例
 */
export function createLogger(name: string, options?: ZhinLoggerOptions): Logger {
  if (options) {
    // 如果提供了选项，创建新的 Logger 实例
    return new Logger({ ...options, name })
  }
  return manager.createLogger(name)
}

/**
 * 获取默认 Logger
 * @returns 默认的 Logger 实例
 */
export function getDefaultLogger(): Logger {
  return manager.createLogger('default')
}

/**
 * 获取指定名称的 Logger
 * @param name Logger 名称
 * @returns Logger 实例
 */
export function getLogger(name: string): Logger {
  return manager.getLogger(name)
}

/**
 * 设置全局日志级别
 * @param level 日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
  manager.setGlobalLevel(level)
}

/**
 * 设置全局 Logger 选项
 * @param options Logger 配置选项
 */
export function setGlobalOptions(options: ZhinLoggerOptions): void {
  manager.setGlobalOptions(options)
}

/**
 * 获取全局配置
 * @returns 全局 Logger 配置
 */
export function getGlobalOptions(): ZhinLoggerOptions {
  return manager.getGlobalOptions()
}

/**
 * 移除指定名称的 Logger
 * @param name Logger 名称
 * @returns 是否成功移除
 */
export function removeLogger(name: string): boolean {
  return manager.removeLogger(name)
}

/**
 * 获取所有 Logger 的名称列表
 * @returns 名称数组
 */
export function getLoggerNames(): string[] {
  return manager.getLoggerNames()
}

/**
 * 清理所有 Logger 实例
 */
export function clearLoggers(): void {
  manager.clear()
}

/**
 * 关闭日志系统并清理资源
 */
export function shutdown(): void {
  manager.shutdown()
}

// 创建一些常用的便捷 Logger 实例
export const logger = getDefaultLogger()
export const rootLogger = createLogger('root')

// 便捷方法 - 使用默认 logger
export const trace = (obj: any, msg?: string, ...args: any[]) => logger.trace(obj, msg, ...args)
export const debug = (obj: any, msg?: string, ...args: any[]) => logger.debug(obj, msg, ...args)
export const info = (obj: any, msg?: string, ...args: any[]) => logger.info(obj, msg, ...args)
export const success = (obj: any, msg?: string, ...args: any[]) => logger.success(obj, msg, ...args)
export const warn = (obj: any, msg?: string, ...args: any[]) => logger.warn(obj, msg, ...args)
export const error = (obj: any, msg?: string, ...args: any[]) => logger.error(obj, msg, ...args)
export const fatal = (obj: any, msg?: string, ...args: any[]) => logger.fatal(obj, msg, ...args)
export const time = (label: string) => logger.time(label)
export const timeEnd = (label: string) => logger.timeEnd(label)

// 默认导出
export default {
  createLogger,
  getDefaultLogger,
  getLogger,
  setGlobalLogLevel,
  setGlobalOptions,
  getGlobalOptions,
  removeLogger,
  getLoggerNames,
  clearLoggers,
  shutdown,
  Logger,
  LoggerManager,
  LogLevel,
  logger,
  rootLogger,
  trace,
  debug,
  info,
  success,
  warn,
  error,
  fatal,
  time,
  timeEnd
}
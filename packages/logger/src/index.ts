import { Logger, LoggerManager, LogLevel } from './logger.js'
import type { LogTransport } from './logger.js'

// 导出核心类和接口
export {
  Logger,
  LoggerManager,
  LogLevel,
  LOG_LEVEL_NAMES,
  LOG_LEVEL_COLORS
} from './logger.js'

export type {
  LogEntry,
  LogFormatter,
  LogTransport
} from './logger.js'

// 导出格式化器和输出器
export {
  ConsoleFormatter,
  ConsoleTransport,
  FileTransport
} from './logger.js'

// 便捷函数
const manager = LoggerManager.getInstance()

/**
 * 创建或获取指定命名空间的 Logger
 */
export function createLogger(namespace: string): Logger {
  return manager.createLogger(namespace)
}

/**
 * 获取默认 Logger
 */
export function getDefaultLogger(): Logger {
  return manager.createLogger('default')
}

/**
 * 设置全局日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
  manager.setGlobalLevel(level)
}

/**
 * 添加全局输出器
 */
export function addGlobalTransport(transport: LogTransport): void {
  manager.addGlobalTransport(transport)
}

// 导入格式化器和输出器用于默认导出
import { ConsoleFormatter, ConsoleTransport, FileTransport } from './logger.js'

// 默认导出
export default {
  createLogger,
  getDefaultLogger,
  setGlobalLogLevel,
  addGlobalTransport,
  Logger,
  LoggerManager,
  LogLevel,
  ConsoleFormatter,
  ConsoleTransport,
  FileTransport
}

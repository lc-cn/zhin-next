/**
 * @zhin.js/logger 适配器，用于兼容 HMR 模块现有的 Logger 接口
 */

import { createLogger, Logger as ZhinLogger } from '@zhin.js/logger'
import type { Logger } from './types.js'

/**
 * 将 @zhin.js/logger 的 Logger 适配为 HMR 模块期望的接口
 */
export class LoggerAdapter implements Logger {
  private zhinLogger: ZhinLogger

  constructor(namespace: string) {
    this.zhinLogger = createLogger(namespace)
  }

  debug(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.debug(args[0])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      this.zhinLogger.debug(message, { args: rest })
    } else {
      this.zhinLogger.debug('Debug log', { args })
    }
  }

  info(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.info(args[0])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      this.zhinLogger.info(message, { args: rest })
    } else {
      this.zhinLogger.info('Info log', { args })
    }
  }

  warn(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.warn(args[0])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      this.zhinLogger.warn(message, { args: rest })
    } else {
      this.zhinLogger.warn('Warning log', { args })
    }
  }

  error(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.error(args[0])
    } else if (args.length === 2 && typeof args[0] === 'string' && args[1] instanceof Error) {
      this.zhinLogger.error(args[0], args[1])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      this.zhinLogger.error(message, { args: rest })
    } else {
      this.zhinLogger.error('Error log', { args })
    }
  }

  /**
   * 获取底层的 ZhinLogger 实例
   */
  getZhinLogger(): ZhinLogger {
    return this.zhinLogger
  }

  /**
   * 创建子 Logger
   */
  child(namespace: string): LoggerAdapter {
    const childLogger = new LoggerAdapter(`${this.zhinLogger['namespace']}:${namespace}`)
    return childLogger
  }
}

/**
 * 创建 Logger 适配器的便捷函数
 */
export function createLoggerAdapter(namespace: string): LoggerAdapter {
  return new LoggerAdapter(namespace)
}

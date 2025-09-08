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
      const simpleArgs = rest.filter(arg => typeof arg === 'string' || typeof arg === 'number')
      const complexArgs = rest.filter(arg => typeof arg !== 'string' && typeof arg !== 'number')
      
      const fullMessage = simpleArgs.length > 0 
        ? message + ' ' + simpleArgs.join(' ')
        : message
      
      if (complexArgs.length > 0) {
        this.zhinLogger.debug(fullMessage, { data: complexArgs })
      } else {
        this.zhinLogger.debug(fullMessage)
      }
    } else {
      this.zhinLogger.debug('Debug log', { args })
    }
  }

  info(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.info(args[0])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      // 对于简单字符串参数，直接拼接到消息中
      const simpleArgs = rest.filter(arg => typeof arg === 'string' || typeof arg === 'number')
      const complexArgs = rest.filter(arg => typeof arg !== 'string' && typeof arg !== 'number')
      
      const fullMessage = simpleArgs.length > 0 
        ? message + ' ' + simpleArgs.join(' ')
        : message
      
      if (complexArgs.length > 0) {
        this.zhinLogger.info(fullMessage, { data: complexArgs })
      } else {
        this.zhinLogger.info(fullMessage)
      }
    } else {
      this.zhinLogger.info('Info log', { args })
    }
  }

  warn(...args: any[]): void {
    if (args.length === 1 && typeof args[0] === 'string') {
      this.zhinLogger.warn(args[0])
    } else if (args.length >= 2 && typeof args[0] === 'string') {
      const [message, ...rest] = args
      const simpleArgs = rest.filter(arg => typeof arg === 'string' || typeof arg === 'number')
      const complexArgs = rest.filter(arg => typeof arg !== 'string' && typeof arg !== 'number')
      
      const fullMessage = simpleArgs.length > 0 
        ? message + ' ' + simpleArgs.join(' ')
        : message
      
      if (complexArgs.length > 0) {
        this.zhinLogger.warn(fullMessage, { data: complexArgs })
      } else {
        this.zhinLogger.warn(fullMessage)
      }
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
      const errors: Error[] = []
      const simpleArgs: (string | number)[] = []
      const complexArgs: any[] = []
      
      // 分类参数
      for (const arg of rest) {
        if (arg instanceof Error) {
          errors.push(arg)
        } else if (typeof arg === 'string' || typeof arg === 'number') {
          simpleArgs.push(arg)
        } else {
          complexArgs.push(arg)
        }
      }
      
      const fullMessage = simpleArgs.length > 0 
        ? message + ' ' + simpleArgs.join(' ')
        : message
      
      // 如果有Error对象，优先使用第一个作为error参数
      if (errors.length > 0) {
        const metadata = complexArgs.length > 0 ? { data: complexArgs } : undefined
        this.zhinLogger.error(fullMessage, metadata, errors[0])
      } else if (complexArgs.length > 0) {
        this.zhinLogger.error(fullMessage, { data: complexArgs })
      } else {
        this.zhinLogger.error(fullMessage)
      }
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
    return  new LoggerAdapter(`${this.zhinLogger['namespace']}:${namespace}`)
  }
}

/**
 * 创建 Logger 适配器的便捷函数
 */
export function createLoggerAdapter(namespace: string): LoggerAdapter {
  return new LoggerAdapter(namespace)
}

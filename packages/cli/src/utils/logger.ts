import { createLogger, LogLevel } from '@zhin.js/logger'

// 创建CLI专用的logger
const cliLogger = createLogger('CLI')

// 根据环境变量设置日志级别
const logLevel = process.env.ZHIN_LOG_LEVEL || process.env.NODE_ENV === 'development' ? 'debug' : 'info'
switch (logLevel.toLowerCase()) {
  case 'debug':
    cliLogger.setLevel(LogLevel.DEBUG)
    break
  case 'warn':
    cliLogger.setLevel(LogLevel.WARN)
    break
  case 'error':
    cliLogger.setLevel(LogLevel.ERROR)
    break
  case 'silent':
    cliLogger.setLevel(LogLevel.SILENT)
    break
  default:
    cliLogger.setLevel(LogLevel.INFO)
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.info(message, { args })
    } else {
      cliLogger.info(message)
    }
  },
  
  success: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.success(message, { args })
    } else {
      cliLogger.success(message)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.warn(message, { args })
    } else {
      cliLogger.warn(message)
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.error(message, { args })
    } else {
      cliLogger.error(message)
    }
  },
  
  log: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.info(message, { args })
    } else {
      cliLogger.info(message)
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      cliLogger.debug(message, { args })
    } else {
      cliLogger.debug(message)
    }
  }
}; 
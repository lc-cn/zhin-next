import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ConsoleLogger } from '@zhin.js/hmr'

describe('日志记录器测试', () => {
  let logger: ConsoleLogger
  let consoleLogSpy: any
  let consoleInfoSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    // 保存原始的console方法
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // 恢复原始的console方法
    consoleLogSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    // 恢复原始的NODE_ENV
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('开发环境测试', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      logger = new ConsoleLogger('[测试]')
    })

    it('应该正确记录调试信息', () => {
      logger.debug('调试消息', { data: 'test' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[DEBUG] [测试]: 调试消息',
        { data: 'test' }
      )
    })

    it('应该正确记录普通信息', () => {
      logger.info('普通消息', { data: 'test' })
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [测试]: 普通消息',
        { data: 'test' }
      )
    })

    it('应该正确记录警告信息', () => {
      logger.warn('警告消息', { data: 'test' })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] [测试]: 警告消息',
        { data: 'test' }
      )
    })

    it('应该正确记录错误信息', () => {
      logger.error('错误消息', { data: 'test' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] [测试]: 错误消息',
        { data: 'test' }
      )
    })
  })

  describe('生产环境测试', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      logger = new ConsoleLogger('[测试]')
    })

    it('不应该记录调试信息', () => {
      logger.debug('调试消息', { data: 'test' })
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('应该正确记录普通信息', () => {
      logger.info('普通消息', { data: 'test' })
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [测试]: 普通消息',
        { data: 'test' }
      )
    })

    it('应该正确记录警告信息', () => {
      logger.warn('警告消息', { data: 'test' })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] [测试]: 警告消息',
        { data: 'test' }
      )
    })

    it('应该正确记录错误信息', () => {
      logger.error('错误消息', { data: 'test' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] [测试]: 错误消息',
        { data: 'test' }
      )
    })
  })

  describe('自定义调试模式测试', () => {
    it('启用调试模式时应该记录调试信息', () => {
      const debugLogger = new ConsoleLogger('[测试]', true)
      debugLogger.debug('调试消息', { data: 'test' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[DEBUG] [测试]: 调试消息',
        { data: 'test' }
      )
    })

    it('禁用调试模式时不应该记录调试信息', () => {
      const debugLogger = new ConsoleLogger('[测试]', false)
      debugLogger.debug('调试消息', { data: 'test' })
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('多参数测试', () => {
    beforeEach(() => {
      logger = new ConsoleLogger('[测试]', true)
    })

    it('应该正确处理多个参数', () => {
      logger.info('消息', 123, { a: 1 }, [1, 2, 3])
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [测试]: 消息',
        123,
        { a: 1 },
        [1, 2, 3]
      )
    })

    it('应该正确处理没有额外参数的情况', () => {
      logger.info('消息')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [测试]: 消息'
      )
    })
  })

  describe('前缀格式测试', () => {
    it('应该正确处理简单前缀', () => {
      const simpleLogger = new ConsoleLogger('测试')
      simpleLogger.info('消息')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] 测试: 消息'
      )
    })

    it('应该正确处理带方括号的前缀', () => {
      const bracketLogger = new ConsoleLogger('[测试]')
      bracketLogger.info('消息')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [测试]: 消息'
      )
    })

    it('应该正确处理多层级前缀', () => {
      const nestedLogger = new ConsoleLogger('[模块/子模块]')
      nestedLogger.info('消息')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] [模块/子模块]: 消息'
      )
    })
  })
})

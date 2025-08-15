import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Plugin } from '../src/plugin'
import { App } from '../src/app'
import { createTestMessage, createTestSender, createTestChannel, createTestMessageSegment, wait } from './test-utils'
import type { Message, SendOptions } from '../src/types'

describe('插件类测试', () => {
  let app: App
  let plugin: Plugin
  let testMessage: Message

  beforeEach(() => {
    app = new App({ debug: true })
    plugin = app.createDependency('test-plugin', 'test-plugin.ts')
    
    // 创建测试消息
    const sender = createTestSender('123', '测试用户')
    const channel = createTestChannel('456', 'group')
    const content = [createTestMessageSegment('text', { content: '测试消息' })]
    testMessage = createTestMessage('789', content, sender, channel)
  })

  describe('基本属性测试', () => {
    it('应该正确初始化插件', () => {
      expect(plugin.name).toBe('test-plugin')
      expect(plugin.filename).toBe('test-plugin.ts')
      expect(plugin.parent).toBe(app)
      expect(plugin.middlewares).toEqual([])
      expect(plugin.eventListeners.size).toBe(0)
      expect(plugin.cronJobs.size).toBe(0)
    })

    it('应该正确获取app实例', () => {
      expect(plugin.app).toBe(app)
    })

    it('应该正确获取日志记录器', () => {
      const logger = plugin.logger
      expect(logger).toBeDefined()
    })
  })

  describe('中间件测试', () => {
    it('应该正确添加和执行中间件', async () => {
      const middleware1 = vi.fn(async (message: Message, next: () => Promise<void>) => {
        message.content[0].data.content = '修改后的消息1'
        await next()
      })

      const middleware2 = vi.fn(async (message: Message, next: () => Promise<void>) => {
        message.content[0].data.content = '修改后的消息2'
        await next()
      })

      plugin.addMiddleware(middleware1)
      plugin.addMiddleware(middleware2)

      expect(plugin.middlewares).toHaveLength(2)

      // 触发消息处理
      plugin.emit('message.receive', testMessage)
      await wait(100) // 等待异步处理完成

      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
      expect(testMessage.content[0].data.content).toBe('修改后的消息2')
    })

    it('应该在插件销毁时移除中间件', async () => {
      const middleware = vi.fn()
      const dispatchSpy = vi.spyOn(plugin, 'dispatch')

      plugin.addMiddleware(middleware)
      await wait(100) // 等待添加完成

      plugin.dispose()
      await wait(100) // 等待销毁完成

      expect(plugin.middlewares).toHaveLength(0)
      expect(dispatchSpy).toHaveBeenCalledWith('middleware.remove', middleware)
    })
  })

  describe('事件监听器测试', () => {
    it('应该正确添加和触发事件监听器', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      plugin.on('test-event', listener1)
      plugin.on('test-event', listener2)

      expect(plugin.listenerCount('test-event')).toBe(2)

      // 触发事件
      plugin.emit('test-event', { data: 'test' })
      await wait(100) // 等待异步处理完成

      expect(listener1).toHaveBeenCalledWith({ data: 'test' })
      expect(listener2).toHaveBeenCalledWith({ data: 'test' })
    })

    it('应该在插件销毁时移除事件监听器', async () => {
      const listener = vi.fn()
      const dispatchSpy = vi.spyOn(plugin, 'dispatch')

      plugin.on('test-event', listener)
      plugin.on('dispose',()=>{
        expect(plugin.eventListeners.size).toBe(0)
        expect(dispatchSpy).toHaveBeenCalledWith('listener.remove', 'test-event', listener)
      })
      plugin.dispose()
    })
  })

  describe('定时任务测试', () => {
    it('应该正确添加定时任务', () => {
      const job = {
        name: 'test-job',
        schedule: '* * * * *',
        handler: vi.fn()
      }

      plugin.addCronJob(job)

      expect(plugin.cronJobs.get('test-job')).toBe(job)
    })

    it('应该在插件销毁时移除定时任务', async () => {
      const job = {
        name: 'test-job',
        schedule: '* * * * *',
        handler: vi.fn()
      }
      const dispatchSpy = vi.spyOn(plugin, 'dispatch')

      plugin.addCronJob(job)
      await wait(100) // 等待添加完成

      plugin.dispose()
      await wait(100) // 等待销毁完成

      expect(plugin.cronJobs.size).toBe(0)
      expect(dispatchSpy).toHaveBeenCalledWith('cron-job.remove', job)
    })
  })

  describe('消息发送测试', () => {
    it('应该正确发送消息', async () => {
      // 创建测试适配器
      const adapter = {
        name: 'test',
        bots: new Map([['test-bot', {
          sendMessage: vi.fn()
        }]])
      }

      // 注册适配器
      const context = {
        name: adapter.name,
        mounted: () => adapter,
        dispose: () => {}
      }
      plugin.register(context)

      // 等待插件挂载
      await plugin.mounted()
      await wait(100) // 等待上下文挂载

      const options: SendOptions = {
        id: '123',
        type: 'group',
        context: 'test',
        bot: 'test-bot',
        content: '测试消息'
      }
      plugin.useContext('test',async ()=>{
        await plugin.sendMessage(options)
        expect(adapter.bots.get('test-bot')?.sendMessage).toHaveBeenCalledWith(options)
      })

    })

    it('应该正确处理发送前钩子', async () => {
      const handler = vi.fn((options: SendOptions) => ({
        ...options,
        content: '修改后的消息'
      }))

      plugin.beforeSend(handler)

      const options: SendOptions = {
        id: '123',
        type: 'group',
        context: 'test',
        bot: 'test-bot',
        content: '测试消息'
      }

      // 触发发送消息事件
      plugin.emit('before-message.send', options)
      await wait(100) // 等待异步处理完成

      expect(handler).toHaveBeenCalledWith(options)
    })
  })

  describe('生命周期测试', () => {
    it('应该正确处理插件挂载', async () => {
      const mountedHandler = vi.fn()
      plugin.on('self.mounted', mountedHandler)

      await plugin.mounted()

      expect(mountedHandler).toHaveBeenCalled()
    })

    it('应该正确处理插件销毁', () => {
      const disposeHandler = vi.fn()
      plugin.on('self.dispose', disposeHandler)

      plugin.dispose()

      expect(disposeHandler).toHaveBeenCalled()
    })
  })
})
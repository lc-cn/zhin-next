import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Zhin Bot Framework',
  description: '现代化的TypeScript机器人框架',
  
  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '插件', link: '/plugin/' },
      { text: '适配器', link: '/adapter/' },
      { text: '示例', link: '/examples/' },
      {
        text: '链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/zhinjs/zhin' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/zhin.js' }
        ]
      }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
            { text: '配置说明', link: '/guide/configuration' },
            { text: '基本概念', link: '/guide/concepts' }
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '最佳实践', link: '/guide/best-practices' },
            { text: '部署指南', link: '/guide/deployment' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API参考',
          items: [
            { text: '概述', link: '/api/' },
            { text: '核心API', link: '/api/core' },
            { text: '插件API', link: '/api/plugin' },
            { text: '适配器API', link: '/api/adapter' },
            { text: '事件系统', link: '/api/events' },
            { text: '类型定义', link: '/api/types' }
          ]
        }
      ],
      
      '/plugin/': [
        {
          text: '插件开发',
          items: [
            { text: '概述', link: '/plugin/' },
            { text: '开发指南', link: '/plugin/development' },
            { text: '生命周期', link: '/plugin/lifecycle' },
            { text: '上下文系统', link: '/plugin/context' },
            { text: '中间件系统', link: '/plugin/middleware' },
            { text: '定时任务', link: '/plugin/cron' }
          ]
        }
      ],
      
      '/adapter/': [
        {
          text: '适配器开发',
          items: [
            { text: '概述', link: '/adapter/' },
            { text: '开发指南', link: '/adapter/development' },
            { text: 'Bot接口', link: '/adapter/bot-interface' },
            { text: '消息处理', link: '/adapter/message-handling' },
            { text: '事件处理', link: '/adapter/event-handling' }
          ]
        }
      ],
      
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '概述', link: '/examples/' },
            { text: '基础示例', link: '/examples/basic' },
            { text: '插件示例', link: '/examples/plugins' },
            { text: '适配器示例', link: '/examples/adapters' },
            { text: '完整项目', link: '/examples/full-project' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhinjs/zhin' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Zhin Team'
    },
    
    search: {
      provider: 'local'
    }
  }
})

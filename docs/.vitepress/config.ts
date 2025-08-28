import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Zhin',
  description: '现代化的 TypeScript 机器人框架',
  
  // 站点配置
  lang: 'zh-CN',
  base: '/',
  
  // 主题配置
  themeConfig: {
    // 网站标题和Logo
    siteTitle: 'Zhin',
    logo: '/logo.png',
    
    // 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '入门指南', link: '/guide/getting-started' },
      { text: 'API 参考', link: '/api/index' },
      { text: '插件开发', link: '/plugin/index' },
      { 
        text: '官方生态',
        items: [
          { text: '官方适配器', link: '/official/adapters' },
          { text: '官方插件', link: '/official/plugins' }
        ]
      },
      { 
        text: '开发指南',
        items: [
          { text: '适配器开发', link: '/adapter/index' },
          { text: '代码示例', link: '/examples/index' }
        ]
      },
      { text: 'GitHub', link: 'https://github.com/zhinjs/zhin' }
    ],
    
    // 侧边栏配置
    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '核心 API', link: '/api/index' }
          ]
        }
      ],
      
      '/plugin/': [
        {
          text: '插件开发',
          items: [
            { text: '开发指南', link: '/plugin/index' }
          ]
        }
      ],
      
      '/official/': [
        {
          text: '官方生态',
          items: [
            { text: '官方适配器', link: '/official/adapters' },
            { text: '官方插件', link: '/official/plugins' }
          ]
        }
      ],
      
      '/adapter/': [
        {
          text: '适配器开发',
          items: [
            { text: '开发指南', link: '/adapter/index' }
          ]
        }
      ],
      
      '/examples/': [
        {
          text: '代码示例',
          items: [
            { text: '实用示例', link: '/examples/index' }
          ]
        }
      ]
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhinjs/zhin' }
    ],
    
    // 页脚配置
    footer: {
      message: '基于 MIT 许可发布',
      copyright: `版权所有 © 2024-${new Date().getFullYear()} Zhin`
    },
    
    // 搜索配置
    search: {
      provider: 'local'
    },
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/zhinjs/zhin/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    
    // 文档页脚导航
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    
    // 大纲配置
    outline: {
      label: '页面导航'
    },
    
    // 返回顶部
    returnToTopLabel: '回到顶部',
    
    // 外部链接图标
    externalLinkIcon: true,
    
    // 深色模式切换
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },
  
  // Markdown 配置
  markdown: {
    // 代码行数显示
    lineNumbers: true,
    
    // 代码组配置
    config: (md) => {
      // 可以在这里添加 markdown-it 插件
    }
  },
  
  // Head 配置
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh' }],
    ['meta', { property: 'og:title', content: 'Zhin | 现代化的 TypeScript 机器人框架' }],
    ['meta', { property: 'og:site_name', content: 'Zhin' }],
    ['meta', { property: 'og:image', content: 'https://zhinjs.github.io/og.jpg' }],
    ['meta', { property: 'og:url', content: 'https://zhinjs.github.io/' }]
  ]
})
# 最佳实践指南

本指南总结了使用Zhin Bot Framework的最佳实践。

## 项目结构

推荐的项目结构：

```
my-bot/
├── src/
│   ├── plugins/          # 插件目录
│   │   ├── core/        # 核心插件
│   │   ├── features/    # 功能插件
│   │   └── utils/       # 工具插件
│   ├── services/        # 服务实现
│   ├── types/           # 类型定义
│   └── index.ts         # 入口文件
├── data/                # 数据目录
│   ├── config/         # 配置文件
│   └── storage/        # 数据存储
├── tests/              # 测试文件
├── scripts/            # 工具脚本
└── docs/              # 项目文档
```

## 插件开发

### 模块化

将插件功能拆分为小模块：

```typescript
// services/database.ts
export function createDatabase() {
  return {
    name: 'database',
    async mounted(plugin) {
      // ...
    }
  }
}

// services/cache.ts
export function createCache() {
  return {
    name: 'cache',
    async mounted(plugin) {
      // ...
    }
  }
}

// plugins/core/data.ts
import { register } from '@zhin.js/core'
import { createDatabase } from '../../services/database'
import { createCache } from '../../services/cache'

register(createDatabase())
register(createCache())
```

### 错误处理

使用统一的错误处理：

```typescript
// types/error.ts
export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public data?: any
  ) {
    super(message)
  }
}

// utils/error.ts
import { useLogger } from '@zhin.js/core'
import { BotError } from '../types/error'

const logger = useLogger()

export async function handleError<T>(
  action: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof BotError) {
      logger.error(`${errorMessage}: [${error.code}] ${error.message}`, error.data)
    } else {
      logger.error(`${errorMessage}: ${error}`)
    }
    throw error
  }
}

// plugins/features/weather.ts
import { handleError } from '../../utils/error'

onMessage(async (message) => {
  if (message.content.startsWith('天气')) {
    await handleError(
      async () => {
        const city = message.content.slice(2)
        const weather = await getWeather(city)
        await message.reply(weather)
      },
      '天气查询失败'
    )
  }
})
```

### 配置管理

使用环境变量和配置文件：

```typescript
// config/index.ts
import { defineConfig } from '@zhin.js/core'
import development from './development'
import production from './production'

export default defineConfig(async (env) => {
  // 根据环境加载配置
  const config = env.NODE_ENV === 'production' 
    ? production 
    : development
    
  return {
    ...config,
    debug: env.DEBUG === 'true',
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules'
    ]
  }
})
```

### 性能优化

1. 缓存管理
```typescript
import { register } from '@zhin.js/core'
import LRU from 'lru-cache'

register({
  name: 'cache',
  async mounted() {
    const cache = new LRU({
      max: 500,
      maxAge: 1000 * 60 * 60 // 1小时
    })
    
    return {
      get: (key: string) => cache.get(key),
      set: (key: string, value: any) => cache.set(key, value)
    }
  }
})
```

2. 消息队列
```typescript
import { register } from '@zhin.js/core'

register({
  name: 'queue',
  async mounted() {
    const queue: any[] = []
    let processing = false
    
    async function process() {
      if (processing || queue.length === 0) return
      processing = true
      
      try {
        const item = queue.shift()
        await item.action()
      } finally {
        processing = false
        process()
      }
    }
    
    return {
      add: (action: () => Promise<void>) => {
        queue.push({ action })
        process()
      }
    }
  }
})
```

### 测试

1. 单元测试
```typescript
// tests/utils/message.test.ts
import { expect } from 'chai'
import { parseCommand } from '../../src/utils/message'

describe('Message Utils', () => {
  describe('parseCommand', () => {
    it('should parse command correctly', () => {
      const result = parseCommand('!weather 北京')
      expect(result).to.deep.equal({
        command: 'weather',
        args: ['北京']
      })
    })
  })
})
```

2. 集成测试
```typescript
// tests/plugins/weather.test.ts
import { createApp } from '@zhin.js/core'
import { expect } from 'chai'

describe('Weather Plugin', () => {
  let app: any
  
  before(async () => {
    app = await createApp({
      plugins: ['weather']
    })
    await app.start()
  })
  
  after(async () => {
    await app.stop()
  })
  
  it('should handle weather command', async () => {
    const result = await app.handleMessage({
      content: '天气 北京',
      type: 'private'
    })
    
    expect(result).to.include('北京天气')
  })
})
```

### 日志记录

使用结构化日志：

```typescript
import { useLogger } from '@zhin.js/core'

const logger = useLogger()

// 记录操作
logger.info('用户操作', {
  user: 'user123',
  action: 'query',
  target: 'weather'
})

// 记录错误
logger.error('操作失败', {
  code: 'API_ERROR',
  message: '接口调用失败',
  details: error
})

// 记录性能
logger.info('性能统计', {
  action: 'database_query',
  duration: 100,
  records: 50
})
```

### 安全性

1. 输入验证
```typescript
import { z } from 'zod'

const CommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string())
})

function validateCommand(input: unknown) {
  return CommandSchema.parse(input)
}
```

2. 权限控制
```typescript
import { onMessage, useContext } from '@zhin.js/core'

const adminUsers = new Set(['admin1', 'admin2'])

function checkPermission(userId: string, permission: string) {
  if (permission === 'admin' && !adminUsers.has(userId)) {
    throw new Error('权限不足')
  }
}

onMessage(async (message) => {
  if (message.content.startsWith('!admin')) {
    checkPermission(message.sender.id, 'admin')
    // 处理管理命令
  }
})
```

### 部署

1. 使用PM2
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

2. 使用Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production

CMD ["pnpm", "start"]
```

### 监控

1. 健康检查
```typescript
import { register, useLogger } from '@zhin.js/core'

register({
  name: 'health',
  async mounted(plugin) {
    const logger = useLogger()
    const interval = setInterval(() => {
      const stats = process.memoryUsage()
      logger.info('健康状态', {
        memory: stats.heapUsed,
        uptime: process.uptime()
      })
    }, 60000)
    
    return {
      check: async () => {
        // 检查各个依赖服务
        const results = await Promise.all([
          checkDatabase(),
          checkCache(),
          checkAPI()
        ])
        return results.every(r => r)
      }
    }
  }
})
```

2. 性能监控
```typescript
import { register } from '@zhin.js/core'

register({
  name: 'metrics',
  async mounted() {
    const metrics = {
      messages: 0,
      commands: 0,
      errors: 0,
      responseTime: []
    }
    
    return {
      increment: (metric: keyof typeof metrics) => {
        metrics[metric]++
      },
      recordTime: (ms: number) => {
        metrics.responseTime.push(ms)
      },
      getStats: () => ({
        ...metrics,
        avgResponseTime: 
          metrics.responseTime.reduce((a, b) => a + b, 0) / 
          metrics.responseTime.length
      })
    }
  }
})
```

## 更多资源

- [API参考](../api/README.md)
- [示例代码](../examples/README.md)
- [常见问题](./faq.md)

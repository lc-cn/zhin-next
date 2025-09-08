# Zhin.js

一个基于 TypeScript 的机器人框架，支持多平台适配和插件系统。

## 特性

- **TypeScript 支持**：完全使用 TypeScript 编写，提供类型提示
- **多平台适配**：支持 QQ(ICQQ)、KOOK、OneBot v11、控制台等平台
- **插件系统**：支持热插拔的插件架构
- **热重载**：开发时支持代码热更新
- **Web 控制台**：基于 Vue 3 的管理界面
- **CLI 工具**：完整的命令行工具链
- **Monorepo**：使用 pnpm workspace 管理多个包

## 项目结构

```
zhin-next/
├── adapters/           # 平台适配器
│   ├── icqq/          # QQ 适配器 (基于 ICQQ)
│   ├── kook/          # KOOK 适配器
│   ├── onebot11/      # OneBot v11 协议适配器
│   └── process/       # 控制台适配器
├── packages/          # 核心包
│   ├── cli/          # 命令行工具
│   ├── core/         # 核心功能
│   ├── hmr/          # 热重载系统
│   ├── logger/       # 日志系统
│   ├── types/        # 类型定义
│   └── zhin/         # 主包
├── plugins/           # 插件
│   ├── client/       # Vue 客户端框架
│   ├── console/      # Web 控制台
│   └── http/         # HTTP 服务器
└── test-bot/         # 示例机器人
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 构建项目

```bash
pnpm build
```

### 运行示例

```bash
# 开发模式（热重载）
pnpm dev

# 或者进入 test-bot 目录
cd test-bot
pnpm dev
```

### 创建新项目

```bash
# 使用 CLI 创建项目
pnpm create zhin my-bot
cd my-bot
pnpm install
pnpm dev
```

## 核心概念

### 适配器 (Adapter)

适配器负责连接不同的聊天平台：

```typescript
// 配置示例
{
  bots: [
    {
      name: 'my-qq-bot',
      context: 'icqq',
      // QQ 相关配置...
    },
    {
      name: 'my-kook-bot', 
      context: 'kook',
      token: 'your-kook-token',
      // KOOK 相关配置...
    }
  ]
}
```

### 插件系统

编写插件处理消息和命令：

```typescript
import { addCommand, MessageCommand, onMessage } from 'zhin.js'

// 添加命令
addCommand(new MessageCommand('hello')
  .action(() => 'Hello, World!'))

// 处理所有消息
onMessage((message) => {
  if (message.content.includes('ping')) {
    message.reply('pong')
  }
})
```

### 上下文系统

使用上下文访问特定平台功能：

```typescript
import { useContext } from 'zhin.js'

// 使用特定适配器的功能
useContext('icqq', (icqqAdapter) => {
  // 访问 QQ 特定的 API
  const bot = icqqAdapter.bots.get('my-bot')
  // ...
})
```

## 可用命令

### 开发

```bash
pnpm dev          # 启动开发服务器（热重载）
pnpm build        # 构建所有包
pnpm test         # 运行测试
pnpm lint         # 代码检查
```

### 部署

```bash
pnpm start        # 启动生产环境
pnpm daemon       # 后台运行
pnpm stop         # 停止机器人
```

## Web 控制台

启动后访问 `http://localhost:3000/console` 查看 Web 管理界面，支持：

- 实时查看机器人状态
- 管理插件启用/禁用
- 查看日志和性能指标
- 配置管理

## 配置

支持多种配置文件格式：

```javascript
// zhin.config.ts
import { defineConfig } from 'zhin.js'

export default defineConfig({
  bots: [
    // 机器人配置...
  ],
  plugins: [
    'http',
    'console', 
    'adapter-process',
    // 其他插件...
  ],
  plugin_dirs: [
    './src/plugins',
    'node_modules'
  ]
})
```

## 热重载

开发时修改代码会自动重新加载，无需手动重启：

- 插件代码修改会热更新
- 配置文件修改会重新加载
- 保持机器人连接状态

## 核心包

- `@zhin.js/core` - 框架核心
- `@zhin.js/cli` - 命令行工具
- `@zhin.js/hmr` - 热重载系统
- `@zhin.js/logger` - 日志系统
- `@zhin.js/types` - 类型定义
- `zhin.js` - 主入口包

## 适配器包

- `@zhin.js/adapter-icqq` - QQ 适配器
- `@zhin.js/adapter-kook` - KOOK 适配器
- `@zhin.js/adapter-onebot11` - OneBot v11 适配器
- `@zhin.js/adapter-process` - 控制台适配器

## 插件包

- `@zhin.js/http` - HTTP 服务器
- `@zhin.js/console` - Web 控制台
- `@zhin.js/client` - Vue 客户端框架

## 开发要求

- Node.js 20.19.0+ 或 22.12.0+
- pnpm 9.0+

## 许可证

MIT License
---
layout: home

hero:
  name: "Zhin.js"
  text: "TypeScript 机器人框架"
  tagline: 多平台支持 • 插件系统 • 热重载 • Web 控制台
  image:
    src: /logo.png
    alt: Zhin
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/zhinjs/zhin

features:
  - icon: 🔥
    title: 热重载支持
    details: 开发时代码修改自动生效，无需重启机器人，保持连接状态。
  
  - icon: 🎯
    title: TypeScript 编写
    details: 完全使用 TypeScript 开发，提供完整的类型提示和错误检查。
  
  - icon: 🧩
    title: 插件系统
    details: 支持插件化开发，热插拔插件，扩展功能灵活便捷。
  
  - icon: 🌐
    title: 多平台适配
    details: 支持 QQ(ICQQ)、KOOK、OneBot v11、控制台等多个聊天平台。
  
  - icon: 📦
    title: 完整工具链
    details: 提供 CLI 工具、项目模板、开发服务器、构建系统。
  
  - icon: 🖥️
    title: Web 控制台
    details: 基于 Vue 3 的管理界面，实时查看状态，管理插件和配置。

---

## ⚡ 快速开始

```bash
# 创建新项目
pnpm create zhin my-bot

# 进入项目目录
cd my-bot

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 🌟 主要特性

### 🔥 热重载开发

开发时修改代码会自动重新加载：

- 插件代码修改会热更新
- 配置文件修改会重新加载  
- 保持机器人连接状态

### 🧩 插件化架构

```typescript
// 简单的插件示例
import { addCommand, MessageCommand } from 'zhin.js'

addCommand(new MessageCommand('hello')
  .action(() => 'Hello, World!'))
```

### 🌐 多平台支持

| 平台 | 适配器 | 状态 |
|------|--------|------|
| QQ | `@zhin.js/adapter-icqq` | ✅ 可用 |
| KOOK | `@zhin.js/adapter-kook` | ✅ 可用 |
| OneBot v11 | `@zhin.js/adapter-onebot11` | ✅ 可用 |
| 控制台 | `@zhin.js/adapter-process` | ✅ 可用 |

### 🖥️ Web 控制台

启动后访问 `http://localhost:3000/console` 使用 Web 管理界面：

- 查看机器人运行状态
- 管理插件启用/禁用
- 实时日志查看
- 系统配置管理

## 🛠️ 技术架构

### 核心组件

- **App**: 应用主类，继承 HMR 支持热重载
- **Plugin**: 插件基类，处理消息和命令
- **Adapter**: 适配器基类，连接不同平台
- **Context**: 上下文系统，依赖注入和状态管理

### 项目结构

```
zhin-next/
├── adapters/       # 平台适配器
├── packages/       # 核心包
│   ├── cli/       # 命令行工具
│   ├── core/      # 框架核心
│   ├── hmr/       # 热重载系统
│   └── ...
├── plugins/        # 功能插件
│   ├── http/      # HTTP 服务
│   ├── console/   # Web 控制台
│   └── client/    # Vue 客户端
└── test-bot/       # 示例机器人
```

## 📝 配置示例

```javascript
// zhin.config.ts
import { defineConfig } from 'zhin.js'

export default defineConfig({
  bots: [
    {
      name: 'my-bot',
      context: 'icqq',  // 使用 QQ 适配器
      // QQ 相关配置...
    }
  ],
  plugins: [
    'http',           // HTTP 服务器
    'console',        // Web 控制台
    'adapter-icqq',   // QQ 适配器
    'my-plugin'       // 自定义插件
  ]
})
```

## 🎯 使用场景

- **聊天机器人**: 多平台聊天机器人开发
- **自动化工具**: 基于聊天平台的自动化任务
- **API 服务**: 提供 HTTP API 接口
- **数据处理**: 实时消息处理和分析

## 📚 文档

- [快速开始](./guide/getting-started) - 了解基本使用
- [插件开发](./plugin/) - 学习插件开发
- [适配器开发](./adapter/) - 适配新平台
- [API 参考](./api/) - 详细 API 文档

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

- [GitHub Issues](https://github.com/zhinjs/zhin/issues) - 报告问题
- [GitHub Discussions](https://github.com/zhinjs/zhin/discussions) - 讨论交流

## 📄 许可证

MIT License
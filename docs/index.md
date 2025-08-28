---
layout: home

hero:
  name: "Zhin"
  text: "现代化的 TypeScript 机器人框架"
  tagline: 🔥 热重载 • 🎯 类型安全 • 🧩 插件化 • 🚀 高性能
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
    title: 企业级热重载
    details: 基于自研 HMR 系统，支持插件、配置、代码的实时热更新，开发体验极致流畅。
  
  - icon: 🎯
    title: 完整 TypeScript 支持
    details: 全链路类型安全，智能代码提示，完善的类型定义，让开发更高效更可靠。
  
  - icon: 🧩
    title: 强大的插件系统
    details: 依赖注入、上下文管理、中间件、组件化，构建复杂应用架构轻而易举。
  
  - icon: 🌐
    title: 多平台适配器
    details: 内置支持 QQ(ICQQ)、KOOK、OneBot v11、本地控制台，轻松扩展新平台。
  
  - icon: 📦
    title: 完整开发工具链
    details: CLI 脚手架、项目模板、开发服务器、构建工具，从开发到部署一站式解决。
  
  - icon: ⚡
    title: 高性能架构
    details: 支持 Node.js/Bun 双运行时，异步处理，智能缓存，低资源占用高并发处理。

---

## ⚡ 快速开始

```bash
# 🎯 一键创建项目
npm create zhin my-awesome-bot

# 📁 进入项目目录  
cd my-awesome-bot

# 📦 安装依赖
pnpm install

# 🚀 启动开发服务器（支持热重载）
pnpm dev
```

**几分钟内，你就有了一个功能完整的机器人！**

## 🌟 核心特性

### 🔥 开发体验至上

- **实时热重载** - 代码修改即时生效，无需重启
- **智能类型提示** - 完整 TypeScript 支持，开发效率倍增  
- **友好错误信息** - 详细堆栈跟踪和错误定位
- **可视化调试** - 内置 Web 控制台，实时查看运行状态

### 🧩 强大的插件架构

- **依赖注入系统** - 优雅的服务管理和资源共享
- **中间件机制** - 灵活的消息处理管道
- **组件化开发** - 可复用的 UI 组件和模板系统
- **上下文管理** - 智能的生命周期和资源管理

### 🌐 多平台生态

| 平台 | 适配器 | 状态 | 特性 |
|------|--------|------|------|
| QQ | `@zhin.js/adapter-icqq` | ✅ 稳定 | 群聊、私聊、媒体消息 |
| KOOK | `@zhin.js/adapter-kook` | ✅ 稳定 | 语音频道、文字频道 |
| OneBot v11 | `@zhin.js/adapter-onebot11` | ✅ 稳定 | 跨平台协议支持 |
| 控制台 | `@zhin.js/adapter-process` | ✅ 稳定 | 本地测试和调试 |

➡️ **[查看所有官方适配器详情](./official/adapters.md)**

### 🧩 官方插件生态

| 插件 | 功能 | 状态 | 描述 |
|------|------|------|------|
| HTTP | `@zhin.js/http` | ✅ 稳定 | Web服务器和API |
| Console | `@zhin.js/console` | ✅ 稳定 | 可视化管理界面 |
| Client | `@zhin.js/client` | ✅ 稳定 | Vue3客户端框架 |

➡️ **[查看所有官方插件详情](./official/plugins.md)**

### ⚡ 现代化技术栈

- **双运行时支持** - Node.js 和 Bun，性能与兼容性并重
- **ES Module** - 原生模块系统，更快的加载速度
- **异步优先** - 全异步架构，高并发处理能力
- **智能缓存** - 内置缓存机制，降低资源消耗

## 🎯 典型使用场景

```typescript
// 🤖 简单的问答机器人
import { onMessage, addCommand, MessageCommand } from 'zhin.js'

onMessage(async (message) => {
  if (message.raw === '你好') {
    await message.reply('你好！我是 Zhin 机器人 👋')
  }
})

// 📊 状态查询命令
addCommand(new MessageCommand('status')
  .action(() => {
    return `🤖 机器人运行状态：
    ⏱️ 运行时间: ${formatUptime(process.uptime())}
    📊 内存使用: ${formatMemory(process.memoryUsage().rss)}
    🔧 Node.js: ${process.version}`
  })
)
```

## 🏢 生产就绪特性

- **🔧 完整 CLI 工具** - 开发、构建、部署一条龙
- **📝 配置管理** - 支持 JS/TS/JSON/YAML/TOML 多种格式
- **📊 性能监控** - 内置性能指标和监控面板
- **🔒 类型安全** - 端到端类型检查，减少运行时错误
- **🐳 容器化支持** - 开箱即用的 Docker 部署方案

## 🚀 立即体验

<div class="demo-container">

**1. 创建项目**
```bash
npm create zhin my-bot && cd my-bot
```

**2. 体验热重载**
```bash
pnpm dev  # 启动开发服务器
```

**3. 在控制台输入消息测试**
```
> hello
< 你好！欢迎使用 Zhin 机器人框架！

> status  
< 🤖 机器人状态
  ⏱️ 运行时间: 5分钟32秒
  📊 内存使用: 45.23MB
```

</div>

## 🌟 加入社区

<div class="community-links">
  
- 💬 [GitHub Discussions](https://github.com/zhinjs/zhin/discussions) - 讨论和交流
- 🐛 [GitHub Issues](https://github.com/zhinjs/zhin/issues) - 问题反馈  
- 📖 [开发文档](./guide/getting-started) - 详细教程
- 🎯 [插件生态](https://github.com/zhinjs/awesome-zhin) - 优秀插件推荐

</div>

---

<div class="footer-note">
  <p>🎉 <strong>Zhin</strong> 让机器人开发变得简单而愉快！</p>
  <p>从快速原型到生产部署，我们为每个开发阶段提供最佳体验。</p>
</div>

# Zhin Bot Framework

Zhin是一个现代化的、支持热模块替换(HMR)的TypeScript机器人框架。它提供了一个灵活的插件系统和多平台适配器支持，让你可以轻松构建和管理聊天机器人。

## 特性

- 🔥 内置热模块替换(HMR)支持，开发时无需重启
- 🎯 完全TypeScript支持，提供优秀的类型提示
- 🔌 插件化架构，易于扩展
- 🌈 多平台适配器支持(ICQQ, OneBot11等)
- 📦 基于pnpm的monorepo工作区管理
- 🚀 现代化的开发体验
- 🛠️ 完善的CLI工具支持

## 项目结构

```
zhin-next/
├── adapters/           # 平台适配器
│   ├── icqq/          # ICQQ协议适配器
│   ├── onebot11/      # OneBot11协议适配器
│   └── process/       # 进程管理适配器
├── packages/          # 核心包
│   ├── cli/          # 命令行工具
│   ├── core/         # 核心功能模块
│   ├── create-zhin/  # 项目创建工具
│   ├── hmr/          # 热模块替换实现
│   ├── types/        # 类型定义
│   └── zhin/         # 主包
└── test-bot/         # 测试机器人示例
```

## 快速开始

1. 安装依赖
```bash
pnpm install
```

2. 创建新项目
```bash
pnpm create zhin my-bot
```

3. 开发模式启动
```bash
cd my-bot
pnpm dev
```

## 核心包说明

- `@zhin.js/core`: 框架核心功能实现
- `@zhin.js/cli`: 命令行工具，提供项目管理功能
- `@zhin.js/hmr`: 热模块替换实现
- `@zhin.js/types`: 类型定义
- `zhin.js`: 主包，整合所有功能

## 适配器

- `@zhin.js/adapter-icqq`: ICQQ协议适配器
- `@zhin.js/adapter-onebot11`: OneBot11协议适配器
- `@zhin.js/adapter-process`: 进程管理适配器

## 开发指南

- [插件开发](./packages/core/README.md)
- [适配器开发](./adapters/README.md)
- [CLI工具使用](./packages/cli/README.md)

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License
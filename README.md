# zhin-next

一个现代化的 TypeScript 机器人框架，支持热重载、插件系统和多种适配器。

## 快速开始

### 使用 create-zhin 创建项目

```bash
# 使用 npm
npm create zhin my-bot

# 使用 pnpm
pnpm create zhin my-bot

# 使用 yarn
yarn create zhin my-bot
```

### 手动创建项目

```bash
# 克隆项目
git clone <repository-url>
cd zhin-next

# 安装依赖
pnpm install

# 初始化测试机器人
pnpm init

# 启动开发环境
pnpm dev
```

## 项目结构

```
zhin-next/
├── apps/                    # 应用目录
│   └── bot/                # 机器人应用
├── packages/               # 核心包
│   ├── cli/               # 命令行工具
│   ├── core/              # 核心框架
│   └── create-zhin/       # 项目创建工具
├── test-bot/              # 测试机器人
└── docs/                  # 文档
```

## 开发

### 构建所有包

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
pnpm type-check
```

### 创建新项目

```bash
# 使用本地 create-zhin
pnpm run create my-new-bot
```

## 文档

- [插件开发指南](docs/plugin-development.md)
- [错误处理](docs/error-handling.md)
- [进程管理](docs/process-management.md)

## 许可证

MIT 
# create-zhin

一个用于快速创建 zhin 机器人项目的 CLI 工具。

## 安装

```bash
npm install -g create-zhin
```

## 使用方法

### 基本用法

```bash
# 交互式创建项目
npm create zhin

# 直接指定项目名称
npm create zhin my-bot

# 使用 pnpm
pnpm create zhin my-bot

# 使用 yarn
yarn create zhin my-bot
```

### 命令行选项

```bash
npm create zhin [project-name] [options]
```

#### 选项

- `-c, --config <format>` - 配置文件格式 (json|yaml|toml|ts|js) (默认: "yaml")
- `-p, --package-manager <manager>` - 包管理器 (npm|yarn|pnpm) (默认: "npm")
- `-r, --runtime <runtime>` - 运行时 (node|bun) (默认: "node")
- `-h, --help` - 显示帮助信息

#### 示例

```bash
# 使用 TypeScript 配置和 pnpm
npm create zhin my-bot --config ts --package-manager pnpm

# 使用 Bun 运行时
npm create zhin my-bot --runtime bun
```

## 项目结构

创建的项目将包含以下文件结构：

```
my-bot/
├── src/
│   └── index.ts          # 主入口文件
├── dist/                 # 构建输出目录
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── zhin.config.yaml      # zhin 配置文件
├── .gitignore           # Git 忽略文件
└── README.md            # 项目说明
```

## 开发

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd zhin-next

# 安装依赖
pnpm install

# 构建 create-zhin 包
cd packages/create-zhin
pnpm build

# 测试
node dist/index.js test-project
```

### 发布

```bash
cd packages/create-zhin
pnpm publish
```

## 许可证

MIT 
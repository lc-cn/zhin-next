# @zhin.js/cli

Zhin Bot Framework的命令行工具，提供项目管理和开发工具。

## 命令

### init

初始化新的Zhin Bot项目。

```bash
zhin init [project-name] [options]
```

选项：
- `-c, --config <format>`: 配置文件格式 (json|yaml|toml|ts|js)，默认js
- `-p, --package-manager <manager>`: 包管理器 (npm|yarn|pnpm)，默认pnpm
- `-r, --runtime <runtime>`: 运行时 (node|bun)，默认bun
- `-y, --yes`: 使用默认选项，跳过交互式配置

### dev

开发模式启动，支持热重载。

```bash
zhin dev [options]
```

选项：
- `-p, --port [port]`: HMR服务端口，默认3000
- `--verbose`: 显示详细日志
- `--bun`: 使用bun运行（默认使用node）

### start

生产模式启动。

```bash
zhin start [options]
```

选项：
- `-d, --daemon`: 后台运行
- `--log-file [file]`: 日志文件路径
- `--bun`: 使用bun运行（默认使用node）

### restart

重启生产模式的机器人进程。

```bash
zhin restart
```

### stop

停止运行中的机器人。

```bash
zhin stop
```

## 项目结构

初始化的项目结构：

```
my-bot/
├── src/
│   ├── index.ts          # 主入口文件
│   └── plugins/          # 插件目录
│       └── test-plugin.ts # 示例插件
├── dist/                 # 构建输出目录
├── data/                 # 数据目录
├── zhin.config.[js|ts]   # 配置文件
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript配置
```

## 开发流程

1. 初始化项目：
```bash
zhin init my-bot
```

2. 开发模式：
```bash
cd my-bot
zhin dev
```

3. 生产部署：
```bash
# 构建
zhin build

# 启动（前台）
zhin start

# 启动（后台）
zhin start --daemon

# 重启
zhin restart

# 停止
zhin stop
```

## 环境变量

- `NODE_ENV`: 运行环境 (development/production)
- `ZHIN_DEV_MODE`: 开发模式标识
- `ZHIN_HMR_PORT`: HMR服务端口
- `ZHIN_VERBOSE`: 详细日志开关

## 许可证

MIT License
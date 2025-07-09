# 插件开发指南

Zhin 框架提供了强大的插件系统，允许开发者通过插件扩展支持更多的协议适配器。

## 🎯 插件系统概述

### 核心概念

- **Plugin**: 插件接口，定义插件的基本信息和生命周期
- **AdapterFactory**: 适配器工厂函数，用于创建特定协议的适配器实例
- **PluginContext**: 插件上下文，提供注册/注销适配器的能力
- **AdapterRegistry**: 适配器注册表，管理所有已注册的适配器

### 插件生命周期

1. **安装 (install)**: 插件被加载时调用，用于注册适配器和初始化资源
2. **卸载 (uninstall)**: 插件被卸载时调用，用于清理资源

### 内存管理

Zhin 框架内置了智能的内存管理机制，包括：

- **热重载垃圾回收**: 在插件重载时自动触发垃圾回收，清理旧版本的内存占用
- **依赖销毁清理**: 在插件销毁时自动清理相关资源和内存
- **批量重载优化**: 批量重载多个文件时进行统一的垃圾回收

#### 垃圾回收配置

```typescript
// 在配置文件中设置垃圾回收选项
{
  hmr: {
    gc: {
      enabled: true,        // 是否启用手动垃圾回收
      delay: 0,            // 垃圾回收后的延迟（毫秒）
      onReload: true,      // 是否在重载时进行垃圾回收
      onDispose: true      // 是否在销毁时进行垃圾回收
    }
  }
}
```

#### 手动触发垃圾回收

```typescript
import { performGC } from '@zhin/core';

// 在插件中手动触发垃圾回收
performGC({ enabled: true }, 'custom cleanup');
```

## 🔌 创建自定义插件

### 1. 定义适配器配置接口

```typescript
import type { AdapterConfig } from '@zhin/core';

export interface MyProtocolConfig extends AdapterConfig {
  protocol: 'my-protocol';
  apiKey: string;
  endpoint: string;
}
```

### 2. 实现适配器类

```typescript
import { Adapter } from '@zhin/core';
import type { SendMessageOptions } from '@zhin/core';

class MyProtocolAdapter extends Adapter {
  private config: MyProtocolConfig;

  constructor(config: MyProtocolConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    // 实现连接逻辑
    console.log(`连接到 ${this.config.endpoint}`);
    this.emit('connect');
  }

  async disconnect(): Promise<void> {
    // 实现断开连接逻辑
    console.log('断开连接');
    this.emit('disconnect');
  }

  async sendMessage(options: SendMessageOptions): Promise<void> {
    // 实现消息发送逻辑
    console.log('发送消息:', options);
  }

  async getUser(userId: string) {
    // 实现获取用户信息
    return {
      user_id: userId,
      nickname: 'Unknown User'
    };
  }

  async getGroup(groupId: string) {
    // 实现获取群组信息
    return {
      group_id: groupId,
      group_name: 'Unknown Group',
      member_count: 0
    };
  }
}
```

### 3. 创建插件

```typescript
import type { Plugin, PluginContext } from '@zhin/core';

export const myProtocolPlugin: Plugin = {
  name: 'my-protocol',
  version: '1.0.0',
  description: '我的自定义协议适配器',
  
  install(ctx: PluginContext) {
    // 注册适配器
    ctx.registerAdapter('my-protocol', (config) => {
      return new MyProtocolAdapter(config as MyProtocolConfig);
    });
    
    console.log('✅ 我的协议插件已安装');
  },
  
  uninstall(ctx: PluginContext) {
    // 注销适配器
    ctx.unregisterAdapter('my-protocol');
    
    console.log('❌ 我的协议插件已卸载');
  }
};
```

## 📦 使用插件

### 1. 自动插件加载（推荐）

通过配置文件自动加载插件是最简单的方式：

```yaml
# zhin.config.yaml
adapters:
  - name: my-adapter
    protocol: my-protocol
    apiKey: ${MY_API_KEY}

# 插件配置
plugin_dirs:
  - ./plugins       # 本地插件目录
  - node_modules     # NPM 包插件

plugins:
  - my-protocol      # 将自动查找和加载插件
```

插件查找规则：
1. **本地插件目录** (`./plugins`):
   - `my-protocol.ts` 或 `my-protocol.js`
   - `my-protocol/index.ts` 或 `my-protocol/index.js`
   - `my-protocol/plugin.ts` 或 `my-protocol/plugin.js`

2. **NPM 包** (`node_modules`):
   - `my-protocol` (直接包名)
   - `zhin-plugin-my-protocol` (社区插件约定)
   - `@zhin/plugin-my-protocol` (官方插件)
   - `@scope/zhin-plugin-my-protocol` (作用域插件)

### 2. 手动安装插件

```typescript
import { Bot } from '@zhin/core';
import { myProtocolPlugin } from './my-protocol-plugin';

const bot = new Bot();

// 安装插件
await bot.installPlugin(myProtocolPlugin);

// 查看支持的协议
console.log('支持的协议:', bot.getSupportedProtocols());
```

### 3. 配置文件中使用

```yaml
# zhin.config.yaml
adapters:
  - name: my-adapter
    protocol: my-protocol
    apiKey: ${MY_API_KEY}
    endpoint: ${MY_ENDPOINT:-https://api.example.com}
```

### 4. 环境变量

```bash
# .env
MY_API_KEY=your_api_key_here
MY_ENDPOINT=https://custom.api.com
```

## 🛠️ 插件管理 API

### Bot 类方法

```typescript
// 安装插件
await bot.installPlugin(plugin);

// 卸载插件
await bot.uninstallPlugin('plugin-name');

// 获取已安装插件列表
const plugins = bot.getPlugins();

// 获取支持的协议列表
const protocols = bot.getSupportedProtocols();
```

### PluginContext 方法

```typescript
// 注册适配器
ctx.registerAdapter('protocol-name', factory);

// 注销适配器
ctx.unregisterAdapter('protocol-name');

// 获取已注册协议列表
const protocols = ctx.getRegisteredProtocols();
```

## 📚 内置插件示例

### OneBot 11 插件

```typescript
export const onebot11Plugin: Plugin = {
  name: 'onebot11',
  version: '1.0.0',
  description: 'OneBot 11 协议适配器插件',
  
  install(ctx: PluginContext) {
    ctx.registerAdapter('onebot11', (config) => {
      return new OneBot11Adapter(config as OneBot11Config);
    });
  },
  
  uninstall(ctx: PluginContext) {
    ctx.unregisterAdapter('onebot11');
  }
};
```

## 🔍 最佳实践

### 1. 错误处理

```typescript
install(ctx: PluginContext) {
  try {
    ctx.registerAdapter('my-protocol', factory);
    console.log('✅ 插件安装成功');
  } catch (error) {
    console.error('❌ 插件安装失败:', error);
    throw error;
  }
}
```

### 2. 资源清理

```typescript
uninstall(ctx: PluginContext) {
  // 清理连接
  this.cleanupConnections();
  
  // 注销适配器
  ctx.unregisterAdapter('my-protocol');
  
  console.log('插件已完全卸载');
}
```

### 3. 配置验证

```typescript
ctx.registerAdapter('my-protocol', (config) => {
  const myConfig = config as MyProtocolConfig;
  
  // 验证必要配置
  if (!myConfig.apiKey) {
    throw new Error('缺少 apiKey 配置');
  }
  
  return new MyProtocolAdapter(myConfig);
});
```

## 🚀 高级功能

### 插件依赖

```typescript
export const advancedPlugin: Plugin = {
  name: 'advanced-plugin',
  version: '1.0.0',
  
  install(ctx: PluginContext) {
    // 检查依赖的协议是否存在
    const protocols = ctx.getRegisteredProtocols();
    if (!protocols.includes('onebot11')) {
      throw new Error('此插件依赖 onebot11 协议');
    }
    
    // 注册新协议...
  }
};
```

### 动态加载

```typescript
// 从文件加载插件
async function loadPluginFromFile(filePath: string) {
  const module = await import(filePath);
  return module.default || module.plugin;
}

// 使用
const plugin = await loadPluginFromFile('./my-plugin.js');
await bot.installPlugin(plugin);
```

## 📖 常见问题

### Q: 如何处理适配器的依赖？

A: 在插件的 `install` 方法中检查依赖，如果不满足则抛出错误。

### Q: 插件可以注册多个协议吗？

A: 可以，在 `install` 方法中多次调用 `ctx.registerAdapter`。

### Q: 如何实现插件的热重载？

A: 先卸载旧插件，再安装新版本的插件。

### Q: 插件之间如何通信？

A: 可以通过 Bot 实例的事件系统进行通信，或者通过共享的服务注册机制。

## 🔗 相关资源

- [适配器开发指南](./adapter-development.md)
- [配置文件格式](./configuration.md)
- [API 参考文档](./api-reference.md)

## 环境变量配置

### 环境变量文件加载

Zhin CLI 支持根据 `NODE_ENV` 自动加载不同的环境变量文件：

#### 文件加载顺序

1. **`.env`** - 基础配置文件（所有环境通用）
2. **`.env.${NODE_ENV}`** - 环境特定配置文件（优先级更高）

#### 环境对应关系

| 命令 | NODE_ENV | 加载的文件 |
|------|----------|------------|
| `zhin dev` | `development` | `.env` → `.env.development` |
| `zhin start` | `production` | `.env` → `.env.production` |

#### 示例文件结构

```
project/
├── .env                    # 基础配置
├── .env.development        # 开发环境配置
├── .env.production         # 生产环境配置
├── src/
└── package.json
```

#### 环境变量文件示例

**`.env`** (基础配置)
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306

# 机器人配置
BOT_NAME=MyBot
BOT_VERSION=1.0.0
```

**`.env.development`** (开发环境)
```bash
# 开发环境特定配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zhin_dev
DEBUG=true
LOG_LEVEL=debug
```

**`.env.production`** (生产环境)
```bash
# 生产环境特定配置
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_NAME=zhin_prod
DEBUG=false
LOG_LEVEL=info
```

#### 调试模式

设置 `ZHIN_DEBUG=true` 环境变量可以查看详细的环境变量加载信息：

```bash
# 开发模式调试
ZHIN_DEBUG=true zhin dev

# 生产模式调试
ZHIN_DEBUG=true zhin start
```

调试模式下会显示：
- 加载的环境变量文件
- 每个文件中的变量数量
- 具体的变量值（敏感信息会被隐藏）

## 进程管理

### 重启机器人

Zhin CLI 支持热重启功能，可以通过以下方式重启机器人进程：

#### 1. 使用 CLI 命令

```bash
# 重启生产模式的机器人
zhin restart
```

> **注意**: 开发模式 (`zhin dev`) 仅支持前台运行，不提供CLI重启命令。请使用插件内重启。

#### 2. 在插件中触发重启

```typescript
// 在插件代码中触发重启（开发模式和生产模式通用）
export function activate(ctx: Context) {
  ctx.command('restart', '重启机器人')
    .action(async () => {
      await ctx.reply('正在重启机器人...');
      
      // 延迟一点时间让回复发送出去
      setTimeout(() => {
        // 使用退出码51触发重启
        process.exit(51);
      }, 1000);
    });
}
```

### 启动模式

#### 开发模式
```bash
# 前台启动，使用 TypeScript 源码
zhin dev

# 指定HMR端口和详细日志
zhin dev --port 3001 --verbose

# 使用 node + tsx 运行
zhin dev --node
```
- 使用 `NODE_ENV=development`
- 直接执行 TypeScript 源码
- 支持热重载和实时调试
- 仅前台运行，按 `Ctrl+C` 退出
- **运行时选择**：
  - 默认使用 `bun` 运行
  - 可使用 `--node` 选项使用 `node + tsx` 运行
- **重启方式**：
  - 支持在插件中调用 `process.exit(51)` 重启
  - 不支持CLI命令重启
  - 不支持信号重启
- PID文件：`.zhin-dev.pid`

#### 开发模式运行时选项示例
```bash
# 使用 bun 运行（默认）
zhin dev
zhin dev --port 3001 --verbose

# 使用 node + tsx 运行
zhin dev --node
zhin dev --node --port 3001 --verbose
```

#### 生产模式 - 前台启动
```bash
zhin start
```
- 使用 `NODE_ENV=production`
- 执行编译后的 JavaScript 代码
- 进程在前台运行
- 支持 `Ctrl+C` 退出
- **运行时选择**：
  - 默认使用 `node` 运行
  - 可使用 `--bun` 选项使用 `bun` 运行
- **重启方式**：
  - 支持 `zhin restart` CLI命令重启
  - 支持在插件中调用 `process.exit(51)` 重启
- PID文件：`.zhin.pid`

#### 生产模式 - 后台启动
```bash
zhin start --daemon
```
- 使用 `NODE_ENV=production`
- 进程在后台运行
- **运行时选择**：
  - 默认使用 `node` 运行
  - 可使用 `--bun` 选项使用 `bun` 运行
- **重启方式**：
  - 支持 `zhin restart` CLI命令重启
  - 支持在插件中调用 `process.exit(51)` 重启
  - 支持 `kill -TERM <PID>` 停止
- PID文件：`.zhin.pid`

#### 运行时选项示例
```bash
# 使用 node 运行（默认）
zhin start
zhin start --daemon

# 使用 bun 运行
zhin start --bun
zhin start --daemon --bun

# 后台运行并输出日志到文件
zhin start --daemon --log-file bot.log
zhin start --daemon --bun --log-file bot.log
```

### 环境变量对比

| 变量 | 开发模式 (`zhin dev`) | 生产模式 (`zhin start`) |
|------|---------------------|----------------------|
| `NODE_ENV` | `development` | `production` |
| `ZHIN_DEV_MODE` | `true` | `undefined` |
| `ZHIN_HMR_PORT` | `3000` (可配置) | `undefined` |
| `ZHIN_VERBOSE` | `false` (可配置) | `undefined` |

### PID文件对比

| 模式 | PID文件 | 用途 |
|------|---------|------|
| 开发模式 | `.zhin-dev.pid` | 存储开发服务器主进程PID，用于进程管理 |
| 生产模式 | `.zhin.pid` | 存储生产模式主进程PID，用于CLI重启 |

### 重启方式对比

| 模式 | CLI命令 | 插件内重启 | 说明 |
|------|---------|------------|------|
| 开发模式 | ❌ | ✅ `process.exit(51)` | 前台运行，无需CLI重启 |
| 生产模式 | ✅ `zhin restart` | ✅ `process.exit(51)` | 支持CLI和插件内重启 |

### 重启原理

当子进程以退出码51退出时，父进程会自动检测到这个特殊退出码，并重新启动子进程：

```typescript
// 子进程退出处理
childProcess.on('exit', (code) => {
  if (code === 51) {
    // 检测到重启信号，重新启动子进程
    return restartBot();
  }
  // 其他退出码按正常退出处理
});
```

## 🔗 相关资源

- [适配器开发指南](./adapter-development.md)
- [配置文件格式](./configuration.md)
- [API 参考文档](./api-reference.md) 
# 入门指南

本指南将帮助你快速上手Zhin Bot Framework，创建并运行你的第一个机器人。

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐）或 npm/yarn
- TypeScript >= 5.0.0（推荐）

## 创建项目

使用create-zhin命令创建新项目：

```bash
# 使用pnpm
pnpm create zhin my-bot

# 或使用npm
npm create zhin my-bot

# 或使用yarn
yarn create zhin my-bot
```

这个命令会引导你完成项目创建，包括：
- 选择配置文件格式（JS/TS/JSON/YAML/TOML）
- 选择包管理器（pnpm/npm/yarn）
- 选择运行时（node/bun）

## 项目结构

创建的项目结构如下：

```
my-bot/
├── src/
│   ├── index.ts        # 主入口文件
│   └── plugins/        # 插件目录
│       └── test-plugin.ts  # 示例插件
├── dist/              # 构建输出目录
├── data/              # 数据目录
├── zhin.config.js     # 配置文件
├── package.json
└── tsconfig.json
```

## 配置文件

`zhin.config.js`是项目的核心配置文件：

```javascript
import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env) => {
  return {
    // 机器人配置
    bots: [
      {
        name: 'my-bot',
        context: 'icqq',
        config: {
          account: 123456789,
          password: 'your-password'
        }
      }
    ],
    // 插件目录
    plugin_dirs: [
      './src/plugins',
      'node_modules'
    ],
    // 要加载的插件
    plugins: [
      'test-plugin'
    ],
    // 调试模式
    debug: env.DEBUG === 'true'
  }
});
```

## 开发模式

启动开发服务器：

```bash
pnpm dev
```

开发模式特性：
- 支持热重载
- 自动重启
- 详细日志
- 源码映射

## 编写插件

在`src/plugins`目录下创建插件文件：

```typescript
import { usePlugin, onMessage, addMiddleware } from '@zhin.js/core';

// 获取插件实例
const plugin = usePlugin();

// 添加消息处理中间件
addMiddleware(async (message, next) => {
  console.log('收到消息:', message);
  await next();
});

// 监听消息
onMessage(async (message) => {
  if (message.content === 'hello') {
    await message.reply('world!');
  }
});
```

## 生产部署

1. 构建项目：
```bash
pnpm build
```

2. 启动机器人：
```bash
# 前台运行
pnpm start

# 后台运行
pnpm start --daemon
```

3. 停止机器人：
```bash
pnpm stop
```

## 下一步

- 阅读[基本概念](./concepts.md)了解框架核心概念
- 查看[API参考](../api/README.md)了解详细API
- 学习[插件开发](../plugin/development.md)开发自己的插件
- 参考[最佳实践](./best-practices.md)优化你的代码
- 浏览[示例](../examples/README.md)获取灵感

## 常见问题

### Q: 如何更新框架版本？
A: 使用包管理器更新依赖：
```bash
pnpm update zhin.js @zhin.js/cli
```

### Q: 如何调试插件？
A: 开启调试模式并使用VSCode调试器：
1. 配置文件中设置`debug: true`
2. 使用`--inspect`参数启动：
```bash
node --inspect node_modules/.bin/zhin dev
```

### Q: 如何处理插件错误？
A: 使用try-catch捕获错误，并使用框架的日志系统记录：
```typescript
import { useLogger } from '@zhin.js/core';

const logger = useLogger();

try {
  // 你的代码
} catch (error) {
  logger.error('插件错误:', error);
}
```

## 获取帮助

- [GitHub Issues](https://github.com/zhinjs/zhin/issues)
- [GitHub Discussions](https://github.com/zhinjs/zhin/discussions)
- [文档](https://zhinjs.github.io)

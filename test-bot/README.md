# test-bot

使用 Zhin 框架创建的机器人项目。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
# 构建项目
npm run build

# 前台启动
npm run start

# 后台启动
npm run daemon
```

### 停止机器人

```bash
npm run stop
```

## 📁 项目结构

```
test-bot/
├── src/
│   ├── index.ts          # 主入口文件
│   └── plugins/          # 插件目录
│       └── test-plugin.ts # 示例插件
├── dist/                 # 构建输出目录
├── zhin.config.js     # 配置文件
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript配置
```

## ⚙️ 配置

### 环境变量

复制 `.env.example` 为 `.env` 并配置你的环境变量：

```bash
cp .env.example .env
```

### 机器人配置

编辑 `zhin.config.js` 来配置你的机器人：

```javascript
/**
 * Zhin Bot 配置文件
 * 支持环境变量替换，格式: ${VAR_NAME:-default_value}
 */
const config = {
  // 机器人配置
  bots: [
    {
      name: 'onebot11',
      context: 'onebot11',
      url: process.env.ONEBOT_URL || 'ws://localhost:8080',
      access_token: process.env.ONEBOT_ACCESS_TOKEN || ''
    }
  ],

  // 插件目录
  plugin_dirs: [
    process.env.PLUGIN_DIR || './src/plugins',
    'node_modules'
  ],

  // 要加载的插件列表
  plugins: [
    'onebot11',
    'test-plugin'
  ],
  // 调试模式
  debug: process.env.DEBUG === 'true'
};

export default config;
```


## 🔌 插件开发

在 `src/plugins/` 目录下创建你的插件文件。参考 `test-plugin.ts` 了解插件开发方式。

### 插件示例

```typescript
import { usePlugin, useLogger, addCommand } from '@zhin.js/core';

const plugin = usePlugin();
const logger = useLogger();

// 添加命令
addCommand('hello', (message, args) => {
  logger.info('Hello command called:', args);
});
```

## 📚 相关链接

- [Zhin 官方文档](https://zhinjs.github.io)
- [插件开发指南](https://zhinjs.github.io/plugins)
- [GitHub 仓库](https://github.com/zhinjs/zhin)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

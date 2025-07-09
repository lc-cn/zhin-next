# Zhin Bot 示例应用

这是一个使用 Zhin 框架的示例机器人应用，展示了如何使用核心功能。

## 快速开始

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置你的 OneBot 配置
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

## 配置系统

Bot支持多种配置文件格式，按以下优先级自动查找：

1. `zhin.config.yaml` / `zhin.config.yml`
2. `zhin.config.json`
3. `zhin.config.toml`
4. `zhin.config.js` (支持动态配置)
5. `zhin.config.ts` (支持类型安全)
6. `config.yaml` / `config.yml`
7. `config.json`
8. `config.toml`
9. `config.js`
10. `config.ts`

### 环境变量支持

所有配置文件都支持环境变量替换，格式：`${VAR_NAME:-default_value}`

常用环境变量：
- `ONEBOT_WS_URL`: OneBot WebSocket 地址 (默认: ws://localhost:8080)
- `ONEBOT_ACCESS_TOKEN`: OneBot 访问令牌
- `ONEBOT_RECONNECT_INTERVAL`: 重连间隔毫秒数 (默认: 5000)
- `ONEBOT_HEARTBEAT_INTERVAL`: 心跳间隔毫秒数 (默认: 30000)
- `NODE_ENV`: 运行环境 (development/production)
- `DEBUG`: 调试模式 (true/false)
- `ZHIN_HMR_PORT`: HMR 服务端口 (默认: 3000)
- `ZHIN_VERBOSE`: 详细日志模式 (true/false)

## 可用命令

### 开发模式
```bash
pnpm dev       # 启动开发服务器 (支持热更新)
```

### 生产模式
```bash
pnpm build     # 构建应用
pnpm start     # 启动生产服务器
pnpm stop      # 停止服务器
```

## 功能演示

### 私聊命令
- `ping` - 测试连通性，返回 Pong!
- `hello` - 问候，返回欢迎消息
- `help` - 显示帮助信息

### 群聊命令
- `!hello` - 群聊问候
- `!time` - 显示当前时间

## 项目结构

```
apps/bot/
├── src/
│   └── index.ts        # 应用入口
├── zhin.config.yaml    # 主配置文件 (YAML格式)
├── zhin.config.js      # 配置文件 (JavaScript格式)
├── zhin.config.ts      # 配置文件 (TypeScript格式)
├── .env.example        # 环境变量示例
├── package.json        # 项目配置
└── README.md          # 说明文档
```

## 配置文件示例

### YAML 格式 (zhin.config.yaml)
```yaml
# 适配器配置
adapters:
  - name: onebot11
    protocol: onebot11
    url: ${ONEBOT_WS_URL:-ws://localhost:8080}
    access_token: ${ONEBOT_ACCESS_TOKEN:-}

# 插件配置
plugin_dirs:
  - ./plugins
  - ./src/plugins
  - node_modules

plugins:
  - onebot11
  - example

debug: ${DEBUG:-false}
```

### JavaScript 格式 (zhin.config.js)
```javascript
export default {
  adapters: [
    {
      name: 'onebot11',
      protocol: 'onebot11',
      url: process.env.ONEBOT_WS_URL || 'ws://localhost:8080',
      access_token: process.env.ONEBOT_ACCESS_TOKEN
    }
  ],
  
  plugin_dirs: ['./plugins', './src/plugins', 'node_modules'],
  plugins: ['onebot11', 'example'],
  debug: process.env.DEBUG === 'true',
  
  // 动态配置
  ...(process.env.NODE_ENV === 'development' ? {
    debug: true,
    plugin_dirs: ['./plugins', './dev-plugins', 'node_modules']
  } : {})
};
```

### TypeScript 格式 (zhin.config.ts)
```typescript
import type { BotConfig } from '@zhin/core';

const config: BotConfig = {
  adapters: [
    {
      name: 'onebot11',
      protocol: 'onebot11',
      url: process.env.ONEBOT_WS_URL || 'ws://localhost:8080',
      access_token: process.env.ONEBOT_ACCESS_TOKEN
    }
  ],
  plugin_dirs: ['./plugins', './src/plugins', 'node_modules'],
  plugins: ['onebot11', 'example'],
  debug: process.env.DEBUG === 'true'
};

export default config;
```

## 开发指南

1. **修改机器人逻辑**: 编辑 `src/index.ts`
2. **添加新功能**: 在示例插件中添加新的消息处理逻辑
3. **热更新**: 开发模式下，修改代码会自动重载

## 故障排除

### 连接失败
- 检查 OneBot 服务是否正在运行
- 验证 WebSocket URL 是否正确
- 确认访问令牌是否正确

### 启动失败
- 确保 Node.js 版本 >= 18.0.0
- 检查是否已安装所有依赖
- 查看控制台错误信息

## 相关链接

- [Zhin 框架文档](../../README.md)
- [OneBot 规范](https://onebot.dev/)
- [插件开发指南](../../docs/plugin-development.md) 
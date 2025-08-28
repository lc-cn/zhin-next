# @zhin.js/client

基于 Vue 3 和 PrimeVue 的 Zhin 机器人 Web 客户端，提供现代化的 Web 管理界面。

## 功能特性

- 🎨 基于 Vue 3 和 PrimeVue 的现代界面
- 📊 机器人状态监控和管理
- 🔧 插件管理和配置
- 📝 日志查看和分析
- 🛠️ 开发工具和调试支持
- 📱 响应式设计，支持移动端

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件**: PrimeVue 4.x
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **主题**: PrimeUI 主题系统

## 安装

```bash
npm install @zhin.js/client
```

## 使用

这个包通常与 `@zhin.js/console` 插件一起使用：

```javascript
// 插件中
import '@zhin.js/console'  // 这会自动加载客户端
```

## 开发

### 项目结构

```
app/
├── src/
│   ├── App.vue          # 主应用组件
│   ├── main.ts          # 应用入口
│   └── pages/           # 页面组件
│       ├── $.vue        # 动态路由
│       ├── 404.vue      # 404页面
│       └── dashboard.vue # 仪表板
├── index.html           # HTML模板
└── components.d.ts      # 组件类型声明
```

### 开发命令

```bash
npm run build  # 构建
npm run clean  # 清理构建文件
```

## API 集成

客户端通过以下方式与后端通信：
- 📡 WebSocket 实时通信
- 🌐 REST API 调用
- 📊 状态同步机制

## 路由配置

- `/` - 仪表板首页
- `/plugins` - 插件管理
- `/logs` - 日志查看
- `/settings` - 系统设置
- `/404` - 错误页面

## 依赖项

- `pinia` - 状态管理
- `primevue` - UI组件库
- `@primeuix/themes` - 主题系统
- `vue-router` - 路由管理

## 自定义扩展

支持通过插件系统扩展：
- 自定义页面组件
- 自定义主题样式
- 自定义功能模块

## 浏览器支持

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## 许可证

MIT License

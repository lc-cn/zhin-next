# @zhin.js/hmr

一个轻量级的热模块替换(HMR)系统，专为Zhin框架设计，支持TypeScript。

## 核心组件

### Dependency

依赖管理的基础类，提供：
- 依赖树管理
- 生命周期钩子
- 上下文管理
- 事件系统

### HMR

继承自`Dependency`的热更新系统核心，提供：
- 文件监听
- 模块加载
- 性能监控
- 重载管理

### FileWatcher

文件监听器，负责：
- 监听文件变化
- 目录管理
- 文件过滤

### ModuleLoader

模块加载器，处理：
- 模块导入导出
- 缓存管理
- 依赖解析

### PerformanceMonitor

性能监控工具，提供：
- 重载时间统计
- 错误记录
- 性能报告

### ReloadManager

重载管理器，负责：
- 重载调度
- 防抖处理
- 错误恢复

## 使用示例

```typescript
import { HMR, Dependency } from '@zhin.js/hmr'

class MySystem extends HMR<MyDependency> {
  createDependency(name: string, filePath: string): MyDependency {
    return new MyDependency(this, name, filePath)
  }
}

const system = new MySystem('MySystem', {
  dirs: ['./plugins'],
  extensions: ['.js', '.ts'],
  debug: true
})

// 添加监听目录
system.addWatchDir('./src')

// 监听重载事件
system.on('reload', (filePath) => {
  console.log(`文件已重载: ${filePath}`)
})

// 等待所有依赖就绪
await system.waitForReady()
```

## API

### HMR选项

```typescript
interface HMROptions {
  dirs?: string[]              // 监听目录
  extensions?: Set<string>     // 监听的文件扩展名
  debug?: boolean             // 调试模式
  logger?: Logger             // 日志记录器
  priority?: number          // 优先级
  max_listeners?: number     // 最大监听器数量
  debounce?: number         // 重载防抖时间
  algorithm?: string        // 哈希算法
}
```

### 事件

- `add`: 添加新依赖
- `remove`: 移除依赖
- `reload`: 重载文件
- `error`: 发生错误
- `file-change`: 文件变化
- `ready`: 依赖就绪

### 工具函数

- `getCallerFile`: 获取调用者文件路径
- `createError`: 创建标准错误
- `performGC`: 执行垃圾回收

## 许可证

MIT License
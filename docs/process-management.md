# 进程管理功能

Zhin CLI 提供了强大的跨平台进程管理功能，支持 Linux、macOS 和 Windows 系统。

## 🎯 功能特性

### 跨平台支持
- **Linux/macOS**: 使用 `ps` 和 `kill` 命令
- **Windows**: 使用 `tasklist` 和 `taskkill` 命令
- **自动检测**: 根据操作系统自动选择合适的方法

### 进程检测
- 精确的进程存在性检查
- 进程详细信息获取（名称、内存使用、CPU 使用率）
- 相关进程列表查询

### 进程控制
- 优雅终止（SIGTERM）
- 强制终止（SIGKILL）
- 超时等待和重试机制

## 🔧 API 参考

### `getProcessStatus(cwd: string)`
检查指定目录下的进程状态。

```typescript
import { getProcessStatus } from '@zhin/cli';

const status = await getProcessStatus('/path/to/project');
console.log(status);
// 输出: { running: true, pid: 12345 }
```

### `getProcessStatusDetailed(cwd: string)`
获取进程的详细状态信息。

```typescript
import { getProcessStatusDetailed } from '@zhin/cli';

const status = await getProcessStatusDetailed('/path/to/project');
console.log(status);
// 输出: { 
//   running: true, 
//   pid: 12345, 
//   info: { 
//     name: 'node', 
//     memory: '45.2MB', 
//     cpu: '2.1%' 
//   } 
// }
```

### `getRelatedProcesses(processName: string)`
获取所有相关进程的列表。

```typescript
import { getRelatedProcesses } from '@zhin/cli';

const processes = await getRelatedProcesses('node');
console.log(processes);
// 输出: [
//   { pid: 12345, name: 'node', memory: '45.2MB', cpu: '2.1%' },
//   { pid: 12346, name: 'node', memory: '32.1MB', cpu: '1.8%' }
// ]
```

### `startProcess(command: string, args: string[], cwd: string)`
启动后台进程。

```typescript
import { startProcess } from '@zhin/cli';

await startProcess('node', ['app.js'], '/path/to/project');
```

### `stopProcess(cwd: string)`
停止指定目录下的进程。

```typescript
import { stopProcess } from '@zhin/cli';

await stopProcess('/path/to/project');
```

## 🖥️ 平台特定实现

### Linux/macOS
```bash
# 进程检测
ps -p 12345 -o pid=

# 进程详细信息
ps -p 12345 -o comm=,rss=,pcpu=

# 相关进程列表
ps -C "node" -o pid=,comm=,rss=,pcpu=

# 终止进程
kill -15 12345  # 优雅终止
kill -9 12345   # 强制终止
```

### Windows
```cmd
# 进程检测
tasklist /FI "PID eq 12345" /FO CSV /NH

# 进程详细信息
tasklist /FI "PID eq 12345" /FO CSV /NH

# 相关进程列表
tasklist /FI "IMAGENAME eq node*" /FO CSV /NH

# 终止进程
taskkill /PID 12345        # 优雅终止
taskkill /PID 12345 /F     # 强制终止
```

## 📊 性能优化

### 缓存机制
- 进程检测结果缓存
- 减少重复的系统调用
- 提高响应速度

### 错误处理
- 优雅降级
- 详细的错误信息
- 自动重试机制

### 资源清理
- 自动清理无效的 PID 文件
- 内存泄漏防护
- 进程僵尸检测

## 🔍 调试和监控

### 日志记录
```typescript
import { logger } from '@zhin/cli';

// 启用详细日志
logger.setLevel('debug');
```

### 性能监控
```typescript
// 监控进程启动时间
const startTime = Date.now();
await startProcess('node', ['app.js'], cwd);
const duration = Date.now() - startTime;
console.log(`进程启动耗时: ${duration}ms`);
```

### 健康检查
```typescript
// 定期检查进程状态
setInterval(async () => {
  const status = await getProcessStatus(cwd);
  if (!status.running) {
    console.log('进程已停止，尝试重启...');
    await startProcess('node', ['app.js'], cwd);
  }
}, 30000);
```

## 🚀 最佳实践

### 1. 错误处理
```typescript
try {
  await stopProcess(cwd);
} catch (error) {
  console.error('停止进程失败:', error);
  // 尝试强制终止
  await forceKillProcess(cwd);
}
```

### 2. 进程监控
```typescript
// 监控进程资源使用
const status = await getProcessStatusDetailed(cwd);
if (status.info && status.info.memory) {
  const memoryMB = parseFloat(status.info.memory);
  if (memoryMB > 1000) {
    console.warn('进程内存使用过高:', memoryMB, 'MB');
  }
}
```

### 3. 批量操作
```typescript
// 批量停止相关进程
const processes = await getRelatedProcesses('zhin');
for (const proc of processes) {
  await killProcess(proc.pid);
}
```

## 🔧 配置选项

### 超时设置
```typescript
// 自定义超时时间
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
```

### 日志级别
```typescript
// 设置日志级别
logger.setLevel('info'); // 'debug' | 'info' | 'warn' | 'error'
```

## 📝 注意事项

1. **权限要求**: 某些操作可能需要管理员权限
2. **进程隔离**: 不同用户的进程可能无法访问
3. **系统差异**: 不同系统的命令输出格式可能不同
4. **性能影响**: 频繁的进程检测可能影响系统性能

## 🔗 相关链接

- [进程管理 API 参考](../api/process-management.md)
- [CLI 命令参考](../cli/commands.md)
- [故障排除指南](../troubleshooting.md) 
# HMR 模块化重构

## 概述

我们对HMR系统进行了模块化重构，保持了原有的继承关系 `Dependency => HMR => App`，但将HMR内部的功能拆分为多个专门的模块，通过组合模式提供完整的热重载功能。

## 架构设计

### 继承关系
```
Dependency (基础依赖类)
    ↓
HMR (热重载类，组合各功能模块)
    ↓  
App (应用类，继承HMR功能)
```

### 模块组合
HMR类内部组合了以下功能模块：

## 功能模块

### 1. `file-watcher.ts` - 文件监听管理器
**职责：** 负责监听目录变化和文件变化检测
- 管理文件系统监听器
- 处理文件变化事件
- 支持动态添加/移除监听目录
- 文件路径解析和查找

**主要类：**
- `FileWatcher` - 文件监听管理器

### 2. `module-loader.ts` - 模块加载器
**职责：** 负责模块的导入、移除和哈希计算
- 动态导入ES模块
- 管理模块依赖关系
- 文件哈希计算和变化检测
- 循环依赖检测
- 模块生命周期管理

**主要类：**
- `ModuleLoader<P>` - 泛型模块加载器

### 3. `performance.ts` - 性能监控器
**职责：** 负责统计和管理性能数据
- 记录加载/重载时间
- 错误统计
- 性能报告生成
- 计时器工具

**主要类：**
- `PerformanceMonitor` - 性能监控器
- `Timer` - 计时器工具类

### 4. `reload-manager.ts` - 重载管理器
**职责：** 负责防抖和重载队列管理
- 重载防抖处理
- 重载队列管理
- 批量重载处理
- 重载状态监控

**主要类：**
- `ReloadManager` - 重载管理器

### 5. `hmr.ts` - HMR主类
**职责：** 继承自Dependency，组合各功能模块
- 继承Dependency的基础功能
- 组合文件监听、模块加载、性能监控、重载管理等模块
- 提供完整的HMR接口
- 保持向后兼容

**主要类：**
- `HMR<P>` - 主要的HMR类

## 重构优势

### 1. **保持继承关系**
维持了原有的 `Dependency => HMR => Bot` 继承关系，确保现有代码完全兼容。

### 2. **模块化组合**
通过组合模式将功能拆分到独立模块，提高了代码的可维护性和可测试性。

### 3. **单一职责原则**
每个模块都有明确的职责，便于理解和维护。

### 4. **向后兼容**
保持了所有原有的API接口，现有代码无需修改。

### 5. **可扩展性**
新功能可以通过添加新模块或扩展现有模块来实现。

## HMR类的组合结构

```typescript
export class HMR<P extends Dependency = Dependency> extends Dependency<P> {
    // 组合的功能模块
    protected readonly fileWatcher: FileWatcher;
    protected readonly moduleLoader: ModuleLoader<P>;
    protected readonly performanceMonitor: PerformanceMonitor;
    protected readonly reloadManager: ReloadManager;
    
    // 原有的静态方法和属性保持不变
    static get currentHMR(): HMR { ... }
    static get currentDependency(): Dependency { ... }
    static getCurrentFile(): string { ... }
    
    // 组合各模块功能的方法
    addWatchDir(dir: string): boolean {
        return this.fileWatcher.addWatchDir(dir);
    }
    
    getPerformanceStats() {
        return this.performanceMonitor.stats;
    }
    
    // ... 其他方法
}
```

## 使用示例

### 基本使用（与原来完全相同）
```typescript
// Bot类继承自HMR，使用方式不变
export class Bot extends HMR<Plugin> {
    constructor(config?: Partial<BotConfig>) {
        super('bot', fileURLToPath(import.meta.url), {
            dirs: config?.plugin_dirs || ['./plugins'],
            extensions: new Set(['.js', '.ts']),
            debug: config?.debug
        });
    }
    
    createDependency(name: string, filePath: string): Plugin {
        return new Plugin(this, name, filePath);
    }
}
```

### Hook函数（完全兼容）
```typescript
// 所有Hook函数保持原有用法
export function useBot(): Bot { ... }
export function usePlugin(): Plugin { ... }
export function addCommand(name: string, handler: CommandHandler): void { ... }
```

### 新增功能
```typescript
// 可以访问组合的功能模块
const bot = new Bot();

// 获取性能统计
const stats = bot.getPerformanceStats();
console.log(bot.getPerformanceReport());

// 获取重载状态
const reloadStatus = bot.getReloadStatus();

// 动态管理监听目录
bot.addWatchDir('./new-plugins');
bot.removeWatchDir('./old-plugins');

// 访问内部模块（用于测试或高级用法）
const testInterface = bot.getTestInterface();
```

## 配置选项

```typescript
// HMRConfig保持不变
interface HMRConfig {
    dirs?: string[];
    extensions?: Set<string>;
    max_listeners?: number;
    debounce?: number;
    algorithm?: string;
    debug?: boolean;
    logger?: Logger;
    // ... 其他配置
}
```

## 迁移指南

### 无需迁移
由于保持了完全的向后兼容性，现有代码无需任何修改即可使用新的模块化HMR系统。

### 新功能使用
如果要使用新的功能模块，可以通过HMR类的公共方法访问：

```typescript
// 性能监控
const performanceStats = hmr.getPerformanceStats();
const performanceReport = hmr.getPerformanceReport();

// 重载管理
const reloadStatus = hmr.getReloadStatus();

// 文件监听
hmr.addWatchDir('./additional-plugins');
```

## 性能优化

1. **智能文件监听** - 只监听需要的文件类型
2. **防抖重载** - 避免频繁的文件变化导致过多重载
3. **并行处理** - 支持并行加载多个模块
4. **内存管理** - 及时清理不需要的依赖
5. **模块化加载** - 按需加载功能模块

## 测试支持

通过`getTestInterface()`方法可以访问内部模块进行单元测试：

```typescript
const testInterface = hmr.getTestInterface();
const { fileWatcher, moduleLoader, performanceMonitor, reloadManager } = testInterface;

// 可以直接测试各个模块的功能
```

这种设计既保持了向后兼容性，又提供了良好的模块化架构，是一个理想的重构方案。 
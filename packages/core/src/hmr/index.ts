// ============================================================================
// HMR System - 热模块替换系统
// ============================================================================

// 导出类型定义
export type {
    Logger,
    Context,
    PluginVersion,
    DependencyOptions,
    HMROptions,
    HmrOptions,
    DependencyResolution,
    PluginEventMap
} from './types.js';

// 导出工具函数
export {
    mergeConfig,
    createError,
    resolvePath,
    ConsoleLogger,
    DEFAULT_WATCHABLE_EXTENSIONS,
    STACK_TRACE_REGEX,
    ERROR_MESSAGES,
    DEFAULT_CONFIG
} from './utils.js';

// 导出基础类
export { Dependency } from './dependency.js';

// 导出HMR系统
export { HMR } from './hmr.js';

// 导出新的模块化组件
export { FileWatcher } from './file-watcher.js';
export { ModuleLoader } from './module-loader.js';
export { PerformanceMonitor, Timer } from './performance.js';
export { ReloadManager } from './reload-manager.js'; 
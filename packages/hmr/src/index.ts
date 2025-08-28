// ============================================================================
// HMR System - 热模块替换系统
// ============================================================================

// 导出类型定义
export type * from './types';

// 导出工具函数
export * from './utils';

// 导出Logger适配器
export { LoggerAdapter, createLoggerAdapter } from './logger-adapter';

// 导出基础类
export { Dependency } from './dependency';

// 导出HMR系统
export { HMR } from './hmr';

// 导出新的模块化组件
export { FileWatcher } from './file-watcher';
export { ModuleLoader } from './module-loader';
export { PerformanceMonitor, Timer } from './performance';
export { ReloadManager } from './reload-manager';
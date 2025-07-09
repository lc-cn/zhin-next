import { EventEmitter } from 'events';
import { Context, DependencyConfig } from './types.js';
import { createError, ERROR_MESSAGES, DEFAULT_CONFIG, performGC } from './utils.js';

// ============================================================================
// 依赖基类
// ============================================================================

/**
 * 依赖基类：提供事件系统和依赖层次结构管理
 */
export class Dependency<P extends Dependency = any> extends EventEmitter {
    /** 文件哈希值 */
    hash?: string;
    /** 文件修改时间 */
    mtime?: Date;
    /** Context 映射 */
    contexts: Map<string, Context>;
    /** 必需的 Context 集合 */
    requiredContexts: Set<string>;
    /** 依赖映射 */
    dependencies: Map<string, P>;
    private readyPromise: Promise<void> | null = null;
    /** 依赖配置 */
    public config: DependencyConfig = {};
    /** 生命周期状态 */
    private lifecycleState: 'waiting' | 'ready' | 'disposed' = 'waiting';

    constructor(
        public parent: Dependency<P> | null,
        public name: string,
        public filename: string,
        config: DependencyConfig = {}
    ) {
        super();
        this.contexts = new Map();
        this.requiredContexts = new Set();
        this.dependencies = new Map();
        this.config = { ...config };
        this.setMaxListeners(DEFAULT_CONFIG.MAX_LISTENERS);
    }


    /** 获取依赖配置 */
    getConfig(): Readonly<DependencyConfig> {
        return { ...this.config };
    }

    /** 更新依赖配置 */
    updateConfig(config: Partial<DependencyConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('config-changed', config);
    }

    /** 获取生命周期状态 */
    getLifecycleState(): 'waiting' | 'ready' | 'disposed' {
        return this.lifecycleState;
    }

    /** 设置生命周期状态 */
    setLifecycleState(state: 'waiting' | 'ready' | 'disposed'): void {
        if (this.lifecycleState !== state) {
            const oldState = this.lifecycleState;
            this.lifecycleState = state;
            this.emit('lifecycle-changed', oldState, state);
        }
    }
    findParent(filename:string,callerFiles:string[]):Dependency<P>{
        const list=callerFiles.filter(item=>item!==filename)
        for(const file of list){
            const child=this.findChild(file)
            if(child) return child
        }
        return this
    }
    /** 查找子依赖 */
    findChild<T extends P>(filename: string): T | void {
        for (const [key, child] of this.dependencies) {
            if (child.filename === filename) return child as T
            const found = child.findChild<T>(filename);
            if (found) return found;
        }
    }

    /** 按名称查找插件 */
    findPluginByName<T extends P>(name: string): T | void {
        for (const [key, child] of this.dependencies) {
            if (child.name === name) {
                return child as T;
            }
            const found = child.findPluginByName<T>(name);
            if (found) {
                return found;
            }
        }
    }

    /** 获取启用的依赖 */
    getEnabledDependencies(): P[] {
        const result: P[] = [];
        for (const [key, dependency] of this.dependencies) {
            if (dependency.config.enabled !== false) {
                result.push(dependency);
            }
        }
        
        // 按优先级排序
        result.sort((a, b) => {
            const priorityA = a.config.priority || 0;
            const priorityB = b.config.priority || 0;
            return priorityB - priorityA;
        });
        
        return result;
    }

    /** 分发事件到当前依赖 */
    dispatch(eventName: string | symbol, ...args: unknown[]): void {
        this.emit(eventName, ...args);
    }

    /** 广播事件到所有子依赖 */
    broadcast(eventName: string | symbol, ...args: unknown[]): void {
        this.emit(eventName, ...args);
        for (const [key, child] of this.dependencies) {
            child.broadcast(eventName, ...args);
        }
    }

    /** 获取依赖列表 */
    get dependencyList(): P[] {
        return Array.from(this.dependencies.values());
    }

    /** 获取所有依赖（包括嵌套） */
    get allDependencies(): P[] {
        const result: P[] = [];
        for (const child of this.dependencyList) {
            result.push(child);
            result.push(...child.allDependencies);
        }
        return result;
    }

    /** 获取Context列表 */
    get contextList(): Context[] {
        return Array.from(this.contexts.values());
    }

    /** 创建Context */
    createContext<T>(context: Context<T>): Context<T> {
        this.contexts.set(context.name, context);
        return context;
    }

    /** 使用Context */
    useContext<T>(name: string): Context<T> {
        const context = this.contexts.get(name) as Context<T>;
        if (!context) {
            throw createError(ERROR_MESSAGES.CONTEXT_NOT_FOUND, { name });
        }
        return context;
    }

    /** 等待就绪 */
    async waitForReady(): Promise<void> {
        if (this.lifecycleState === 'ready') {
            return;
        }
        
        if (this.lifecycleState === 'disposed') {
            throw new Error('Dependency has been disposed');
        }
        if (!this.readyPromise) {
            this.readyPromise = new Promise<void>((resolve) => {
                const listener = (parent: Dependency<P>) => {
                    if (parent === this) {
                        this.off('mounted', listener);
                        resolve();
                    }
                };
                this.on('mounted', listener);
            });
        }
        return this.readyPromise;
    }

    /** 安装完成回调 */
    async mounted(): Promise<void> {
        // 先安装所有Context
        for (const context of this.contextList) {
            if (context.mounted && !context.value) {
                try {
                    context.value = await context.mounted(this);
                } catch (error) {
                    this.emit('error', error);
                }
            }
        }
        this.setLifecycleState('ready');
        this.emit('mounted', this);
    }

    /** 销毁依赖 */
    dispose(): void {
        if (this.lifecycleState === 'disposed') {
            return;
        }
        this.setLifecycleState('disposed');
        // 销毁所有子依赖
        for (const [key, child] of this.dependencies) {
            child.dispose();
        }
        this.dependencies.clear();
        // 销毁所有Context
        for (const context of this.contextList) {
            if (context.dispose && context.value) {
                try {
                    context.dispose(context.value);
                } catch (error) {
                    this.emit('error', error);
                }
            }
        }
        this.contexts.clear();
        this.emit('dispose');
        this.removeAllListeners();
        this.parent=null;
        // 手动垃圾回收
        performGC({ onDispose: true }, `dispose: ${this.name}`);
    }
} 
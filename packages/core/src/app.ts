import path from 'path';
import * as fs from 'fs'
import {SideEffect, GlobalContext} from '@zhin.js/types'
import { HMR, Context, Logger, ConsoleLogger,getCallerFile, getCallerFiles } from '@zhin.js/hmr';
import {
    AppConfig,
    Message, BeforeSendHandler,SendOptions,
} from './types.js';
import { loadConfig } from './config.js';
import { fileURLToPath } from 'url';
import { generateEnvTypes } from './types-generator.js';
import { logger } from './logger.js';
import {CronJob, EventListener, MessageMiddleware, Plugin} from "./plugin.js";
import {Adapter} from "./adapter";

// ============================================================================
// App 类
// ============================================================================
/**
 * App类：继承自HMR，提供热更新的机器人框架
 */
export class App extends HMR<Plugin> {
    static currentPlugin: Plugin;
    private config: AppConfig;

    constructor(config?: Partial<AppConfig>) {
        // 如果没有传入配置或配置为空对象，尝试自动加载配置文件
        let finalConfig: AppConfig;
        
        if (!config || Object.keys(config).length === 0) {
            try {
                // 异步加载配置，这里需要改为同步初始化
                logger.info('🔍 正在查找配置文件...');
                finalConfig = App.loadConfigSync();
                logger.info('✅ 配置文件加载成功');
            } catch (error) {
                logger.warn('⚠️  配置文件加载失败，使用默认配置:', error instanceof Error ? error.message : error);
                finalConfig = Object.assign({}, App.defaultConfig);
            }
        } else {
            // 合并默认配置和传入的配置
            finalConfig = Object.assign({}, App.defaultConfig, config);
        }
        
        // 调用父类构造函数
        super('Zhin',{
            logger: new ConsoleLogger('[Zhin]'),
            dirs: finalConfig.plugin_dirs || [],
            extensions: new Set(['.js', '.ts']),
            debug: finalConfig.debug
        });
        this.on('message.send',this.sendMessage.bind(this))
        this.config = finalConfig;
    }
    /** 默认配置 */
    static defaultConfig: AppConfig = {
        plugin_dirs: ['./plugins'],
        plugins: [],
        bots: [],
        debug: false,
    };
    async sendMessage(options:SendOptions){
        const adapter=this.getContext<Adapter>(options.context)
        if(!adapter) throw new Error(`can't find adapter for name ${options.context}`)
        const bot=adapter.bots.get(options.bot)
        if(!bot) throw new Error(`can't find bot ${options.bot} for adapter ${options.bot}`)
        return bot.sendMessage(options)
    }
    /** 同步加载配置文件 */
    static loadConfigSync(): AppConfig {
        // 由于loadConfig是异步的，我们需要创建一个同步版本
        // 或者在这里简化处理，让用户使用异步创建方法
        throw new Error('同步加载配置暂不支持，请使用 App.createAsync() 方法');
    }

    /** 创建插件依赖 */
    createDependency(name: string, filePath: string): Plugin {
        return new Plugin(this, name, filePath);
    }

    /** 获取App配置 */
    getConfig(): Readonly<AppConfig> {
        return { ...this.config };
    }

    /** 更新App配置 */
    updateConfig(config: Partial<AppConfig>): void {
        this.config = { ...this.config, ...config };
        
        // 更新HMR配置
        if (config.plugin_dirs) {
            // 动态更新监听目录
            const currentDirs = this.getWatchDirs();
            const newDirs = config.plugin_dirs;
            
            // 移除不再需要的目录
            for (const dir of currentDirs) {
                if (!newDirs.includes(dir)) {
                    this.removeWatchDir(dir);
                }
            }
            
            // 添加新的目录
            for (const dir of newDirs) {
                if (!currentDirs.includes(dir)) {
                    this.addWatchDir(dir);
                }
            }
        }
        
        this.logger.info('App configuration updated', this.config);
    }

    /** 使用插件 */
    use(filePath: string): void {
        this.emit('internal.add', filePath);
    }

    /** 启动App */
    async start(mode: 'dev' | 'prod' = 'prod'): Promise<void> {
        await generateEnvTypes(process.cwd());
        // 加载插件
        for (const pluginName of this.config.plugins || []) {
            this.use(pluginName);
        }
        // 等待所有插件就绪
        await this.waitForReady();
        this.logger.info('started successfully');
    }

    /** 停止App */
    async stop(): Promise<void> {
        this.logger.info('Stopping app...');
        // 销毁所有插件
        this.dispose();

        this.logger.info('App stopped');
    }

    getContext<T>(name:string):T{
        for(const dep of this.dependencyList){
            if(dep.contexts.has(name)) {
                const context = dep.contexts.get(name)!
                // 如果上下文还没有挂载，等待挂载完成
                if (!context.value) {
                    throw new Error(`Context ${name} is not mounted yet`)
                }
                return context.value
            }
        }
        throw new Error(`can't find Context of ${name}`)
    }

    async handleBeforeSend(options:SendOptions){
        const handlers=this.dependencyList.reduce((result,plugin)=>{
            result.push(...plugin.listeners('before-message.send'))
            return result
        },[] as Function[])
        for(const handler of handlers){
            const result=await handler(options)
            if(result) options=result
        }
        return options
    }
    getLogger(...names: string[]): Logger {
        return new ConsoleLogger(`[${[...names].join('/')}]`, process.env.NODE_ENV === 'development');
    }
}

// ============================================================================
// Hooks API
// ============================================================================

function getPlugin(hmr: HMR<Plugin>, filename: string): Plugin {
    const name = path.basename(filename).replace(path.extname(filename), '');
    
    // 尝试从当前依赖中查找插件
    const childPlugin = hmr.findChild(filename);
    if (childPlugin) {
        return childPlugin;
    }
    const parent=hmr.findParent(filename,getCallerFiles(fileURLToPath(import.meta.url)))
    // 创建新的插件实例
    const newPlugin = new Plugin(parent, name, filename);
    
    // 添加到当前依赖的子依赖中
    parent.dependencies.set(filename, newPlugin);
    
    return newPlugin;
}
export async function createApp(config?: Partial<AppConfig>): Promise<App> {
    let finalConfig: AppConfig,configPath:string='';
    const envFiles=['.env',`.env.${process.env.NODE_ENV}`]
        .filter(filename=>fs.existsSync(path.join(process.cwd(),filename)))
    if (!config || Object.keys(config).length === 0) {
        try {
            logger.info('🔍 正在查找配置文件...');
            [configPath,finalConfig] = await loadConfig();
            logger.info('✅ 配置文件加载成功');
        } catch (error) {
            logger.warn('⚠️  配置文件加载失败，使用默认配置:', error instanceof Error ? error.message : error);
            finalConfig = Object.assign({}, App.defaultConfig);
        }
    } else {
        finalConfig = Object.assign({}, App.defaultConfig, config);
    }
    const app= new App(finalConfig);
    app.watching(envFiles,()=>{
        process.exit(51)
    })
    if(configPath){
        app.watching(configPath,()=>{
            process.exit(51);
        })
    }
    return app
}
/** 获取App实例 */
export function useApp(): App {
    const hmr = HMR.currentHMR;
    if (!hmr) throw new Error('useApp must be called within a App Context');
    return hmr as unknown as App;
}

/** 获取当前插件实例 */
export function usePlugin(): Plugin {
    const hmr = HMR.currentHMR;
    if (!hmr) throw new Error('usePlugin must be called within a App Context');
    
    try {
        const currentFile = getCallerFile(import.meta.url);
        return getPlugin(hmr as unknown as HMR<Plugin>, currentFile);
    } catch (error) {
        // 如果无法获取当前文件，尝试从当前依赖获取
        if (HMR.currentDependency) {
            return HMR.currentDependency as unknown as Plugin;
        }
        throw error;
    }
}
export function beforeSend(handler:BeforeSendHandler){
    const plugin = usePlugin();
    return plugin.beforeSend(handler);
}
/** 创建Context */
export function register<T>(context: Context<T,Plugin>): Context<T,Plugin> {
    const plugin = usePlugin();
    return plugin.register(context);
}
export function registerAdapter<T extends Adapter>(adapter:T){
    const plugin = usePlugin();
    plugin.register({
        name:adapter.name,
        async mounted(plugin){
           await adapter.start(plugin)
            return adapter
        },
        dispose(){
            return adapter.stop(plugin)
        }
    })
}

export function use<T extends keyof GlobalContext>(name: T): GlobalContext[T]
export function use<T>(name: string): T
export function use(name: string){
    const plugin = usePlugin();
    return plugin.use(name);
}

/** 标记必需的Context */
export function useContext<T extends (keyof GlobalContext)[]>(...args:[...T,sideEffect:SideEffect<T>]): void {
    const plugin = usePlugin();
    plugin.useContext(...args as any);
}

/** 添加中间件 */
export function addMiddleware(middleware: MessageMiddleware): void {
    const plugin = usePlugin();
    plugin.addMiddleware(middleware);
}

/** 监听事件 */
export function onEvent<T = any>(event: string, listener: EventListener<T>): void {
    const plugin = usePlugin();
    plugin.on(event, listener);
}

/** 监听群组消息 */
export function onGroupMessage(handler: (message: Message) => void | Promise<void>): void {
    onEvent('message.group.receive', handler);
}

/** 监听私聊消息 */
export function onPrivateMessage(handler: (message: Message) => void | Promise<void>): void {
    onEvent('message.private.receive', handler);
}

/** 监听所有消息 */
export function onMessage(handler: (message: Message) => void | Promise<void>): void {
    onEvent('message.receive', handler);
}

/** 监听插件挂载事件 */
export function onMounted(hook: (plugin: Plugin) => Promise<void> | void): void {
    const plugin = usePlugin();
    if(plugin.isReady) hook(plugin)
    plugin.on('self.mounted', hook);
}

/** 监听插件销毁事件 */
export function onDispose(hook: () => void): void {
    const plugin = usePlugin();
    if(plugin.isDispose) hook()
    plugin.on('self.dispose', hook);
}

/** 添加定时任务 */
export function addCronJob(job: CronJob): void {
    const plugin = usePlugin();
    plugin.addCronJob(job);
}

/** 发送消息 */
export async function sendMessage(options:SendOptions): Promise<void> {
    const app = useApp();
    await app.sendMessage(options);
}

/** 获取App实例（用于高级操作） */
export function getAppInstance(): App {
    return useApp();
}

/** 获取插件日志记录器 */
export function useLogger(): Logger {
    const plugin = usePlugin();
    return plugin.logger;
}
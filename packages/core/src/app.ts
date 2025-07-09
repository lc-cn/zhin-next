import path from 'path';
import * as fs from 'fs'
import { HMR, Dependency, Context, Logger, ConsoleLogger } from './hmr';
import {AppConfig, BotConfig,  Message, MessageChannel, SendContent} from './types.js';
import { Bot } from './adapter.js';
import { loadConfig } from './config.js';
import { fileURLToPath } from 'url';
import { getCallerFile, getCallerFiles } from './hmr/utils.js';
import { logger } from './logger.js';
import {Command} from "./command";

// ============================================================================
// 插件类型定义
// ============================================================================


/** 消息中间件函数 */
export type MessageMiddleware = (message: Message, next: () => Promise<void>) => Promise<void>;

/** 事件监听器函数 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/** 定时任务配置 */
export interface CronJob {
    name: string;
    schedule: string; // cron 表达式
    handler: () => void | Promise<void>;
    enabled?: boolean;
}

/** 适配器工厂函数 */
export type BotFactory<T extends BotConfig = BotConfig> = (config: T) => Bot;

// ============================================================================
// Plugin 类
// ============================================================================

/**
 * 插件类：继承自Dependency，提供机器人特定功能
 */
export class Plugin extends Dependency<Plugin> {
    // 插件功能存储
    commands = new Map<string, Command>();
    middlewares: MessageMiddleware[] = [];
    eventListeners = new Map<string, EventListener[]>();
    cronJobs = new Map<string, CronJob>();
    adapters = new Map<string, BotFactory<any>>();


    constructor(parent: Dependency<Plugin>, name: string, filePath: string) {
        super(parent, name, filePath);
    }

    /** 获取所属的App实例 */
    get app(): App {
        return this.parent as App;
    }
    get logger(): Logger {
        const names = [this.name];
        let temp=this as Dependency<Plugin>
        while(temp.parent){
            names.unshift(temp.parent.name)
            temp=temp.parent
        }
        return this.app.getLogger(...names)
    }
    /** 添加命令 */
    addCommand<A extends string[] = [], O extends Record<string, string> = {}>(name: string, command: Command<A,O>): void
    addCommand(name: string, result: SendContent): void
    addCommand(name: string, input: Command|SendContent): void {
        const command=input instanceof Command?input:new Command(name).action(()=>input)
        this.commands.set(name, command);
        this.emit('command.add',name)
    }

    /** 添加中间件 */
    addMiddleware(middleware: MessageMiddleware): void {
        this.middlewares.push(middleware);
        this.emit('middleware.add',middleware)
    }

    /** 添加事件监听器 */
    addEventListener<T = any>(event: string, listener: EventListener<T>): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(listener);
        this.emit('event.add',event,listener)
    }

    /** 添加定时任务 */
    addCronJob(job: CronJob): void {
        this.cronJobs.set(job.name, job);
        this.emit('cron.add',job)
    }

    /** 注册适配器工厂 */
    registerAdapter<T extends BotConfig>(adapter: string, factory: BotFactory<T>): void {
        this.adapters.set(adapter, factory);
        this.emit('adapter.add',adapter,factory)
    }

    /** 发送消息 */
    async sendMessage(channelId:MessageChannel, content: SendContent): Promise<void> {
        await this.app.sendMessage(channelId, content);
    }
}

// ============================================================================
// App 类
// ============================================================================

/**
 * App类：继承自HMR，提供热更新的机器人框架
 */
export class App extends HMR<Plugin> {
    static currentPlugin: Plugin;
    private appConfig: AppConfig;
    private bots = new Map<string, Bot>();
    private cronTimers = new Map<string, NodeJS.Timeout>();

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
            dirs: [
                ...finalConfig.plugin_dirs || [],
                path.relative(process.cwd(),path.resolve(path.dirname(fileURLToPath(import.meta.url)),'plugins'))
            ],
            extensions: new Set(['.js', '.ts']),
            debug: finalConfig.debug
        });
        
        this.appConfig = finalConfig;
        // 设置事件处理
        this.setupEventHandlers();
    }

    /** 默认配置 */
    static defaultConfig: AppConfig = {
        plugin_dirs: ['./plugins'],
        plugins: [],
        disable_dependencies: [],
        bots: [],
        debug: false,
    };

    /** 同步加载配置文件 */
    static loadConfigSync(): AppConfig {
        // 由于loadConfig是异步的，我们需要创建一个同步版本
        // 或者在这里简化处理，让用户使用异步创建方法
        throw new Error('同步加载配置暂不支持，请使用 Bot.createAsync() 方法');
    }

    /** 创建插件依赖 */
    createDependency(name: string, filePath: string): Plugin {
        return new Plugin(this, name, filePath);
    }

    /** 获取App配置 */
    getAppConfig(): Readonly<AppConfig> {
        return { ...this.appConfig };
    }

    /** 更新App配置 */
    updateAppConfig(config: Partial<AppConfig>): void {
        this.appConfig = { ...this.appConfig, ...config };
        
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
        
        this.logger.info('App configuration updated', this.appConfig);
    }

    /** 使用插件 */
    use(filePath: string): void {
        this.emit('internal.add', filePath);
    }

    /** 启动App */
    async start(mode: 'dev' | 'prod' = 'prod'): Promise<void> {
        // 加载插件
        for (const pluginName of this.appConfig.plugins || []) {
            this.use(pluginName);
        }
        // 等待所有插件就绪
        await this.waitForReady();
        // 初始化适配器
        await this.initializeBots();
        // 启动定时任务
        this.startCronJobs();
        this.logger.info('started successfully');
    }

    /** 停止App */
    async stop(): Promise<void> {
        this.logger.info('Stopping app...');

        // 停止定时任务
        this.stopCronJobs();

        // 断开所有适配器
        for (const [name, bot] of this.bots) {
            await bot.disconnect();
        }
        this.bots.clear();

        // 销毁所有插件
        this.dispose();

        this.logger.info('App stopped');
    }

    /** 初始化适配器 */
    private async initializeBots(): Promise<void> {
        const botConfigs = this.appConfig.bots || [];
        
        for (const config of botConfigs) {
            const factory = this.getBotFactory(config.adapter);
            if (factory) {
                const bot = factory(config);
                this.bots.set(config.name, bot);
                
                // 设置消息处理
                bot.on('message', (message: Message) => {
                    this.handleMessage(message);
                });
                
                try{
                    // 连接适配器
                    await bot.connect();
                    this.logger.info(`Bot "${config.name}" (${config.adapter}) connected`);
                }catch (e){
                    this.logger.warn(`Bot "${config.name}" (${config.adapter}) connect failed`,e)
                }
            } else {
                this.logger.warn(`No factory found for bot adapter "${config.adapter}"`);
            }
        }
    }

    /** 获取适配器工厂 */
    private getBotFactory(adapter: string): BotFactory | undefined {
        // 从所有插件中查找适配器工厂
        for (const plugin of this.dependencyList) {
            const factory = plugin.adapters.get(adapter);
            if (factory) {
                return factory;
            }
        }
        return undefined;
    }

    /** 获取适配器实例 */
    getBot(name: string): Bot | undefined {
        return this.bots.get(name);
    }

    /** 获取所有适配器 */
    getBots(): Bot[] {
        return Array.from(this.bots.values());
    }

    /** 获取所有插件 */
    getPlugins(): Plugin[] {
        return this.dependencyList;
    }

    /** 处理消息 */
    private async handleMessage(message: Message): Promise<void> {
        try {
            // 执行中间件链
            await this.executeMiddlewareChain(message);
            
            // 处理命令
            await this.handleCommand(message);
            
            // 触发消息事件
            this.broadcast('message', message);
            this.broadcast(`message.${message.channel.type}`, message);
        } catch (error) {
            this.logger.error('Error handling message', { error, message });
        }
    }

    /** 执行中间件链 */
    private async executeMiddlewareChain(message: Message): Promise<void> {
        const middlewares = this.getAllMiddlewares();
        let index = 0;

        const next = async (): Promise<void> => {
            if (index < middlewares.length) {
                const middleware = middlewares[index++];
                await middleware(message, next);
            }
        };

        await next();
    }

    /** 处理命令 */
    private async handleCommand(message: Message): Promise<void> {
        const content = message.raw.trim();

        const parts = content.split(/\s+/);
        const commandName = parts[0];
        const command = this.getCommand(commandName);
        if (command) {
            const result=await command.match(message.content,message);
            console.log({result})
            if(result) return message.reply(result)
        }
    }

    /** 获取命令处理器 */
    private getCommand(commandName: string): Command | undefined {
        for (const plugin of this.dependencyList) {
            const command = plugin.commands.get(commandName);
            if (command) {
                command.command=commandName
                return command;
            }
        }
        return undefined;
    }

    /** 获取所有中间件 */
    private getAllMiddlewares(): MessageMiddleware[] {
        const middlewares: MessageMiddleware[] = [];
        for (const plugin of this.dependencyList) {
            middlewares.push(...plugin.middlewares);
        }
        return middlewares;
    }

    /** 启动定时任务 */
    private startCronJobs(): void {
        for (const plugin of this.dependencyList) {
            for (const [jobName, job] of plugin.cronJobs) {
                if (job.enabled !== false) {
                    this.startCronJob(job);
                }
            }
        }
    }

    /** 启动单个定时任务 */
    private startCronJob(job: CronJob): void {
        // 简单的定时器实现，实际项目中应该使用 node-cron 等库
        const interval = this.parseCronExpression(job.schedule);
        if (interval > 0) {
            const timer = setInterval(async () => {
                try {
                    await job.handler();
                } catch (error) {
                    this.logger.error(`Error in cron job "${job.name}"`, { error });
                }
            }, interval);
            
            this.cronTimers.set(job.name, timer);
            this.logger.info(`Cron job "${job.name}" started`);
        }
    }

    /** 停止定时任务 */
    private stopCronJobs(): void {
        for (const [jobName, timer] of this.cronTimers) {
            clearInterval(timer);
            this.logger.info(`Cron job "${jobName}" stopped`);
        }
        this.cronTimers.clear();
    }

    /** 解析cron表达式（简化版） */
    private parseCronExpression(schedule: string): number {
        // 简化实现，只支持 "*/n" 格式
        const match = schedule.match(/^\*\/(\d+)$/);
        if (match) {
            return parseInt(match[1]) * 1000; // 转换为毫秒
        }
        return 0;
    }

    /** 发送消息 */
    async sendMessage(channel:MessageChannel, content: SendContent): Promise<void> {
        // 找到合适的适配器发送消息
        for (const [name, bot] of this.bots) {
            try {
                await bot.sendMessage({
                    channel,
                    content
                });
                return;
            } catch (error) {
                this.logger.debug(`Failed to send message via ${name}`, { error });
            }
        }
        throw new Error('No available adapter to send message');
    }
    getLogger(...names: string[]): Logger {
        return new ConsoleLogger(`[${[...names].join('/')}]`, process.env.NODE_ENV === 'development');
    }

    /** 设置事件处理器 */
    private setupEventHandlers(): void {
        // 处理插件添加事件
        this.on('add', (plugin: Plugin) => {
            // this.getLogger().info(`Plugin "${plugin.name}" loaded`);
        });

        // 处理插件移除事件
        this.on('remove', (plugin: Plugin) => {
            // this.getLogger().info(`Plugin "${plugin.name}" unloaded`);
        });

        // 处理错误事件
        this.on('error', (error: Error) => {
            // this.getLogger().error('Bot error', { error });
        });
    }

    /** 获取支持的协议列表 */
    getSupportedProtocols(): string[] {
        const protocols = new Set<string>();
        for (const plugin of this.dependencyList) {
            for (const protocol of plugin.adapters.keys()) {
                protocols.add(protocol);
            }
        }
        return Array.from(protocols);
    }

    /** 查找插件 */
    findPlugin(name: string): Plugin | undefined {
        return this.findPluginByName(name) || undefined;
    }
}

// ============================================================================
// Hooks API
// ============================================================================

function getPlugin(hmr: HMR<Plugin>, filename: string, hookName: string): Plugin {
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
    if (!hmr) throw new Error('useApp must be called within a App context');
    return hmr as unknown as App;
}

/** 获取当前插件实例 */
export function usePlugin(): Plugin {
    const hmr = HMR.currentHMR;
    if (!hmr) throw new Error('usePlugin must be called within a App context');
    
    try {
        const currentFile = getCallerFile(import.meta.url);
        return getPlugin(hmr as HMR<Plugin>, currentFile, 'usePlugin');
    } catch (error) {
        // 如果无法获取当前文件，尝试从当前依赖获取
        if (HMR.currentDependency) {
            return HMR.currentDependency as unknown as Plugin;
        }
        throw error;
    }
}

/** 创建Context */
export function createContext<T>(context: Context<T>): Context<T> {
    const plugin = usePlugin();
    return plugin.createContext(context);
}

/** 使用Context */
export function useContext<T>(name: string): Context<T> {
    const plugin = usePlugin();
    return plugin.useContext<T>(name);
}

/** 标记必需的Context */
export function requireContext(name: string): void {
    const plugin = usePlugin();
    plugin.requiredContexts.add(name);
}

/** 添加命令 */
export function addCommand<A extends string[] = [], O extends Record<string, string> = {}>(name: string, command: Command<A,O>): void
export function addCommand(input: string, output: SendContent): void
export function addCommand(name: string, input: Command|SendContent): void {
    const plugin = usePlugin();
    plugin.addCommand(name, input as Command);
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
    onEvent('message.group', handler);
}

/** 监听私聊消息 */
export function onPrivateMessage(handler: (message: Message) => void | Promise<void>): void {
    onEvent('message.private', handler);
}

/** 监听所有消息 */
export function onMessage(handler: (message: Message) => void | Promise<void>): void {
    onEvent('message', handler);
}

/** 监听插件挂载事件 */
export function onMounted(hook: (plugin: Plugin) => Promise<void> | void): void {
    const plugin = usePlugin();
    plugin.on('mounted', hook);
}

/** 监听插件销毁事件 */
export function onDispose(hook: () => void): void {
    const plugin = usePlugin();
    plugin.on('dispose', hook);
}

/** 添加定时任务 */
export function addCronJob(job: CronJob): void {
    const plugin = usePlugin();
    plugin.addCronJob(job);
}

/** 注册适配器 */
export function registerAdapter<T extends BotConfig>(adapter: string, factory: BotFactory<T>): void {
    const plugin = usePlugin();
    plugin.registerAdapter(adapter, factory);
}

/** 发送消息 */
export async function sendMessage(channel:MessageChannel, content: SendContent): Promise<void> {
    const app = useApp();
    await app.sendMessage(channel, content);
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
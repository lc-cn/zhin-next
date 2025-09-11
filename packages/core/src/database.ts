import { Plugin } from "./plugin.js";

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
    name: string;        // 数据库连接名称
    type: string;        // 数据库类型 (sqlite, mysql, postgresql 等)
    [key: string]: any;  // 其他数据库特定配置
}

/**
 * 数据库接口
 */
export interface Database {
    /** 数据库名称 */
    name: string;
    /** 数据库类型 */
    type: string;
    
    /** 连接状态 */
    connected: boolean;

    /**
     * 连接数据库
     */
    connect(): Promise<void>;
    
    /**
     * 断开数据库连接
     */
    disconnect(): Promise<void>;
    
    /**
     * 检查连接状态
     */
    isConnected(): boolean;
    
    /**
     * 执行查询
     */
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    
    /**
     * 健康检查
     */
    healthCheck(): Promise<boolean>;
    
    /**
     * 获取所有表名
     */
    getTables(): Promise<string[]>;
    
    /**
     * 获取表结构信息
     */
    getTableInfo(tableName: string): Promise<any[]>;
    
    /**
     * 清理资源
     */
    dispose(): Promise<void>;
}

/**
 * 数据库驱动基类
 */
export class DatabaseDriver<T extends Database = Database> {
    public database: Map<string, T> = new Map();
    #databaseFactory: DatabaseDriver.DatabaseFactory<T>;
    get(name: string): T | undefined {
        return this.database.get(name);
    }
    constructor(public name: string, driverFactory: DatabaseDriver.DatabaseFactory<T>) {
        this.#databaseFactory = driverFactory;
    }
    
    /**
     * 启动数据库驱动
     */
    async start(plugin: Plugin): Promise<void> {
        const configs = plugin.app.getConfig().databases?.filter(c => c.type === this.name);
        if (!configs?.length) return;
        
        try {
            for (const config of configs) {
                let database: T;
                if (DatabaseDriver.isDatabaseConstructor(this.#databaseFactory)) {
                    database = new this.#databaseFactory(plugin, config) as T;
                } else {
                    database = this.#databaseFactory(plugin, config);
                }
                
                try {
                    await database.connect();
                    plugin.logger.info(`database ${config.name} of type ${this.name} connected`);
                    this.database.set(config.name, database);
                } catch (error) {
                    throw error;
                }
            }
            
            plugin.logger.info(`database driver ${this.name} started`);
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * 停止数据库连接
     */
    async stop(plugin: Plugin): Promise<void> {
        try {
            for (const [name, db] of this.database) {
                try {
                    await db.disconnect();
                    plugin.logger.info(`database ${name} of type ${this.name} disconnected`);
                    this.database.delete(name);
                } catch (error) {
                    throw error;
                }
            }
            plugin.logger.info(`database driver ${this.name} stopped`);
        } catch (error) {
            throw error;
        }
    }
}

export namespace DatabaseDriver {
    export type DatabaseConstructor<T extends Database = Database> = {
        new(plugin: Plugin, config: DatabaseConfig): T;
    };
    
    export function isDatabaseConstructor(fn: DatabaseFactory): fn is DatabaseConstructor {
        return fn.prototype && fn.prototype.constructor === fn;
    }
    
    export type DatabaseCreator<T extends Database = Database> = (plugin: Plugin, config: DatabaseConfig) => T;
    
    export type DatabaseFactory<T extends Database = Database> = DatabaseConstructor<T> | DatabaseCreator<T>;
}
// ================================================================================================
// SQLite 数据库驱动包入口
// ================================================================================================

import { DatabaseDriver, registerDriver } from 'zhin.js'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import type { Database, DatabaseConfig, Plugin } from 'zhin.js'

export interface SQLiteConfig extends DatabaseConfig {
    type: 'sqlite'
    database: string              // 数据库文件路径
    mode?: number                 // 打开模式
    busyTimeout?: number          // 忙碌超时时间
    enableWal?: boolean           // 启用 WAL 模式
    enableForeignKeys?: boolean   // 启用外键约束
    cacheSize?: number           // 缓存大小
}
declare module 'zhin.js'{
  interface RegisteredDrivers{
    sqlite: DatabaseDriver<SQLite>
  }
}
/**
 * SQLite 数据库驱动
 */
export class SQLite implements Database {
    public readonly name: string
    public readonly type: string = 'sqlite'
    public connected = false
    
    private db?: sqlite3.Database
    private plugin: Plugin
    private config: SQLiteConfig

    constructor(plugin: Plugin, config: DatabaseConfig) {
        this.plugin = plugin
        this.config = config as SQLiteConfig
        this.name = config.name
        this.validateConfig()
    }

    /**
     * 连接数据库
     */
    async connect(): Promise<void> {
        if (this.connected) {
            return
        }

        const dbPath = path.resolve(this.config.database)
        const dbDir = path.dirname(dbPath)

        // 确保数据库目录存在
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }

        const mode = this.config.mode || (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, mode, (err) => {
                if (err) {
                    this.plugin.logger.error(`SQLite connection failed: ${err.message}`)
                    reject(err)
                } else {
                    this.connected = true
                    this.plugin.logger.info(`SQLite connected: ${path.relative(process.cwd(), dbPath)}`)
                    this.setupDatabase()
                        .then(resolve)
                        .catch(reject)
                }
            })
        })
    }

    /**
     * 断开数据库连接
     */
    async disconnect(): Promise<void> {
        if (!this.db || !this.connected) {
            return
        }

        return new Promise((resolve, reject) => {
            this.db!.close((err) => {
                if (err) {
                    this.plugin.logger.error(`SQLite disconnect failed: ${err.message}`)
                    reject(err)
                } else {
                    this.connected = false
                    this.db = undefined
                    this.plugin.logger.info('SQLite disconnected')
                    resolve()
                }
            })
        })
    }

    /**
     * 检查连接状态
     */
    isConnected(): boolean {
        return this.connected && !!this.db
    }

    /**
     * 执行查询
     */
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db || !this.connected) {
            throw new Error('SQLite database not connected')
        }

        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            
            // 判断查询类型
            const isSelect = sql.trim().toUpperCase().startsWith('SELECT')
            
            if (isSelect) {
                this.db!.all(sql, params, (err, rows) => {
                    const executionTime = Date.now() - startTime
                    
                    if (err) {
                        this.plugin.logger.error(`SQLite query failed: ${err.message}`, {
                            sql, params, executionTime
                        })
                        reject(err)
                    } else {
                        this.plugin.logger.debug(`SQLite query executed`, {
                            sql, params, rows: rows.length, executionTime
                        })
                        resolve(rows as T[])
                    }
                })
            } else {
                const driver = this
                this.db!.run(sql, params, function (err) {
                    const executionTime = Date.now() - startTime
                    
                    if (err) {
                        driver.plugin.logger.error(`SQLite query failed: ${err.message}`, {
                            sql, params, executionTime
                        })
                        reject(err)
                    } else {
                        driver.plugin.logger.debug(`SQLite query executed`, {
                            sql, params, changes: this.changes, lastID: this.lastID, executionTime
                        })
                        
                        // 对于非SELECT查询，返回受影响的行数和插入ID
                        const result = [{
                            changes: this.changes,
                            lastID: this.lastID,
                            id: this.lastID
                        }] as T[]
                        
                        resolve(result)
                    }
                })
            }
        })
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<boolean> {
        try {
            if (!this.isConnected()) {
                return false
            }
            
            // 执行简单查询来验证连接
            await this.query('SELECT 1 as health_check')
            return true
        } catch (error) {
            this.plugin.logger.error('SQLite health check failed', error)
            return false
        }
    }

    /**
     * 获取数据库信息
     */
    async getDatabaseInfo() {
        const result = await this.query('PRAGMA database_list')
        return result[0]
    }

    /**
     * 获取表列表
     */
    async getTables(): Promise<string[]> {
        const result = await this.query<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        return result.map(row => row.name)
    }

    /**
     * 清理资源
     */
    async dispose(): Promise<void> {
        if (this.connected) {
            await this.disconnect()
        }
    }

    /**
     * 获取表结构
     */
    async getTableInfo(tableName: string) {
        const result = await this.query(`PRAGMA table_info(${tableName})`)
        return result
    }

    /**
     * 设置数据库优化
     */
    private async setupDatabase(): Promise<void> {
        const optimizations: string[] = []

        // 设置忙碌超时
        if (this.config.busyTimeout) {
            optimizations.push(`PRAGMA busy_timeout = ${this.config.busyTimeout}`)
        }

        // 启用 WAL 模式
        if (this.config.enableWal) {
            optimizations.push('PRAGMA journal_mode = WAL')
        }

        // 启用外键约束
        if (this.config.enableForeignKeys) {
            optimizations.push('PRAGMA foreign_keys = ON')
        }

        // 设置缓存大小
        if (this.config.cacheSize) {
            optimizations.push(`PRAGMA cache_size = ${this.config.cacheSize}`)
        }

        // 其他优化设置
        optimizations.push(
            'PRAGMA synchronous = NORMAL',    // 平衡性能和安全性
            'PRAGMA temp_store = MEMORY',     // 临时表存储在内存中
            'PRAGMA mmap_size = 268435456'    // 启用内存映射 (256MB)
        )

        // 应用优化设置
        for (const pragma of optimizations) {
            try {
                await this.query(pragma)
                this.plugin.logger.debug(`Applied SQLite optimization: ${pragma}`)
            } catch (error) {
                this.plugin.logger.warn(`Failed to apply SQLite optimization: ${pragma}`, error)
            }
        }
    }

    /**
     * 验证配置
     */
    private validateConfig(): void {
        if (this.config.type !== 'sqlite') {
            throw new Error('Invalid database type for SQLiteDriver')
        }

        if (!this.config.database) {
            throw new Error('SQLite database file path is required')
        }

        // 设置默认值
        if (!this.config.busyTimeout) {
            this.config.busyTimeout = 10000  // 10秒
        }

        if (this.config.enableWal === undefined) {
            this.config.enableWal = true  // 默认启用WAL
        }

        if (this.config.enableForeignKeys === undefined) {
            this.config.enableForeignKeys = true  // 默认启用外键
        }

        if (!this.config.cacheSize) {
            this.config.cacheSize = -16000  // 16MB 缓存
        }
    }
}

// 自动注册 SQLite 驱动
const sqliteDriver = new DatabaseDriver('sqlite', SQLite)
registerDriver(sqliteDriver)
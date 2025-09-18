import { Database, registerDriver,Model, useLogger} from 'zhin.js'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs, { Mode } from 'fs'

export interface SQLiteConfig {
    data_path: string              // 数据库文件路径
    mode?: number                 // 打开模式
    busyTimeout?: number          // 忙碌超时时间
    enableWal?: boolean           // 启用 WAL 模式
    enableForeignKeys?: boolean   // 启用外键约束
    cacheSize?: number           // 缓存大小
}
declare module 'zhin.js'{
    namespace Database {
        interface DriverConfig{
            sqlite: SQLiteConfig
        }
    }
}
const logger=useLogger()
/**
 * SQLite 数据库驱动
 */
export class SQLite extends Database.Driver<SQLiteConfig> {
    public connected = false
    
    private db?: sqlite3.Database

    constructor(config: SQLiteConfig) {
        super('sqlite', config)
        this.validateConfig()
    }

    /**
     * 连接数据库
     */
    async connect(): Promise<void> {
        if (this.connected) {
            return
        }

        const dbPath = path.resolve(this.config.data_path)
        const dbDir = path.dirname(dbPath)

        // 确保数据库目录存在
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }

        const mode = this.config.mode || (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, mode, (err) => {
                if (err) {
                    logger.error(`SQLite connection failed: ${err.message}`)
                    reject(err)
                } else {
                    this.connected = true
                    logger.info(`SQLite connected: ${path.relative(process.cwd(), dbPath)}`)
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
                    logger.error(`SQLite disconnect failed: ${err.message}`)
                    reject(err)
                } else {
                    this.connected = false
                    this.db = undefined
                    logger.info('SQLite disconnected')
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
    async query<T = any>(sql: string, params: any[] = []): Promise<T> {
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
                        logger.error(`SQLite query failed: ${err.message}`, {
                            sql, params, executionTime
                        })
                        reject(err)
                    } else {
                        logger.debug(`SQLite query executed`, {
                            sql, params, rows: rows.length, executionTime
                        })
                        resolve(rows as T)
                    }
                })
            } else {
                const driver = this
                this.db!.run(sql, params, function (err) {
                    const executionTime = Date.now() - startTime
                    
                    if (err) {
                        logger.error(`SQLite query failed: ${err.message}`, {
                            sql, params, executionTime
                        })
                        reject(err)
                    } else {
                        logger.debug(`SQLite query executed`, {
                            sql, params, changes: this.changes, lastID: this.lastID, executionTime
                        })
                        
                        // 对于非SELECT查询，返回受影响的行数和插入ID
                        const result = [{
                            changes: this.changes,
                            lastID: this.lastID,
                            id: this.lastID
                        }] as T[]
                        
                        resolve(result as T)
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
            logger.error('SQLite health check failed', error)
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
        const result = await this.query<{ name: string }[]>(
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
    async getTableInfo(tableName: string):Promise<SQLite.TableInfo[]> {
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
                logger.debug(`Applied SQLite optimization: ${pragma}`)
            } catch (error) {
                logger.warn(`Failed to apply SQLite optimization: ${pragma}`, error)
            }
        }
    }

    /**
     * 验证配置
     */
    private validateConfig(): void {
        if (!this.config.data_path) {
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

    /**
     * 同步模型（创建表）
     */
    async syncModels(models: Model[]): Promise<void> {
        for (const model of models) {
            // 构建 CREATE TABLE 语句
            const columns = Object.entries(model.schema).map(([fieldName, field]) => {
                let col = `"${fieldName}" ${this.getSqlType(field)}`
                if (field.primary) col += ' PRIMARY KEY'
                if (field.autoIncrement) col += ' AUTOINCREMENT'
                if (field.unique) col += ' UNIQUE'
                if (field.notNull) col += ' NOT NULL'
                if (field.initial !== undefined) col += ` DEFAULT ${this.formatDefault(field.initial)}`
                return col
            }).join(', ')
            const sql = `CREATE TABLE IF NOT EXISTS "${model.name}" (${columns})`
            await this.query(sql)
        }
    }

    /**
     * 修改模型（表结构变更）
     */
    async alterModel<T extends Record<string, Model.Field>>(model:Model<T>,schema: Partial<T>): Promise<void> {
        // 1. 获取现有表结构
        const tableInfo = await this.getTableInfo(model.name)
        const existingFields = tableInfo.map((col: SQLite.TableInfo) => col.name)
        const newFields = Object.keys(schema);
        const updateFileds = Object.keys(schema).filter(f => existingFields.includes(f))
        // 删除已存在的字段
        for (const fieldName of updateFileds) {
            if (existingFields.includes(fieldName)) {
                const field = schema[fieldName] as Model.Field
                // 备份旧字段数据，重命名旧字段，添加新字段，复制数据，删除旧字段
                const tempFieldName = `_${fieldName}_old`
                const renameSql = `ALTER TABLE "${model.name}" RENAME COLUMN "${fieldName}" TO "${tempFieldName}"`
                await this.query(renameSql)
                const addSql = `ALTER TABLE "${model.name}" ADD COLUMN "${fieldName}" ${this.getSqlType(field)}`
                await this.query(addSql)
                const copySql = `UPDATE "${model.name}" SET "${fieldName}" = "${tempFieldName}"`
                await this.query(copySql)
                const dropSql = `ALTER TABLE "${model.name}" DROP COLUMN "${tempFieldName}"`
                await this.query(dropSql)
            }
        }
        // 2. 添加新字段
        for (const fieldName of newFields) {
            if (!existingFields.includes(fieldName)) {
                const field = schema[fieldName] as Model.Field
                const sql = `ALTER TABLE "${model.name}" ADD COLUMN "${fieldName}" ${this.getSqlType(field)}`
                await this.query(sql)
            }
        }
    }

    /**
     * 获取字段的 SQLite 类型
     */
    private getSqlType(field: Model.Field): string {
        switch (field.type) {
            case 'integer': return 'INTEGER'
            case 'float': return 'REAL'
            case 'boolean': return 'INTEGER'
            case 'string': return 'TEXT'
            case 'json': return 'TEXT'
            case 'date': return 'TEXT'
            default: return 'TEXT'
        }
    }

    /**
     * 格式化默认值
     */
    private formatDefault(value: any): string {
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'boolean') return value ? '1' : '0'
        if (value === null) return 'NULL'
        return String(value)
    }
}
export namespace SQLite {
    export interface TableInfo {
        cid: number
        name: string
        type: string
        notnull: number
        dflt_value: any
        pk: number
    }
}
registerDriver('sqlite',SQLite)
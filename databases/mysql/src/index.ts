// ================================================================================================
// MySQL 数据库驱动包入口
// ================================================================================================

import { Database, registerDriver, Model, logger } from "zhin.js";
// ================================================================================================
// MySQL 数据库驱动实现
// ================================================================================================

import mysql from "mysql2/promise";

export interface MySQLConfig {
  host: string; // 主机地址
  port?: number; // 端口号，默认3306
  username: string; // 用户名
  password: string; // 密码
  database: string; // 数据库名
  charset?: string; // 字符集，默认utf8mb4
  timezone?: string; // 时区，默认+00:00
  ssl?: any; // SSL配置
  connectTimeout?: number; // 连接超时时间
  acquireTimeout?: number; // 获取连接超时时间
  // 连接池配置
  pool?: {
    min?: number; // 最小连接数
    max?: number; // 最大连接数
    idle?: number; // 空闲超时时间
    acquireTimeout?: number; // 获取连接超时时间
    createTimeout?: number; // 创建连接超时时间
  };
}

declare module "zhin.js" {
  namespace Database {
    interface Drivers {
      mysql: MySQL;
    }
  }
}

/**
 * MySQL 数据库驱动
 */
export class MySQL extends Database.Driver<MySQLConfig> {
  public connected = false;

  private connection?: mysql.Connection;
  private pool?: mysql.Pool;

  constructor(config: MySQLConfig) {
    super("mysql", config);
    this.validateConfig();
  }

  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 创建连接配置
      const connectionConfig: mysql.ConnectionOptions = {
        host: this.config.host,
        port: this.config.port || 3306,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        charset: this.config.charset || "utf8mb4",
        timezone: this.config.timezone || "+00:00",
        ssl: this.config.ssl || false,
        connectTimeout: this.config.connectTimeout || 60000,
        // 删除不支持的属性
        multipleStatements: true,
        dateStrings: true,
      };

      // 如果配置了连接池，使用连接池；否则使用单连接
      if (this.config.pool) {
        const poolConfig: mysql.PoolOptions = {
          ...connectionConfig,
          connectionLimit: this.config.pool.max || 10,
        };

        this.pool = mysql.createPool(poolConfig);
        this.connected = true;
        logger.info(
          `MySQL pool connected: ${this.config.host}:${this.config.port}/${this.config.database}`
        );
      } else {
        this.connection = await mysql.createConnection(connectionConfig);
        this.connected = true;
        logger.info(
          `MySQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`
        );
      }
    } catch (error) {
      logger.error(
        `MySQL connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = undefined;
        logger.info("MySQL pool disconnected");
      } else if (this.connection) {
        await this.connection.end();
        this.connection = undefined;
        logger.info("MySQL connection disconnected");
      }

      this.connected = false;
    } catch (error) {
      logger.error(
        `MySQL disconnect failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected && (!!this.connection || !!this.pool);
  }

  /**
   * 执行查询
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected()) {
      throw new Error("MySQL database not connected");
    }

    const startTime = Date.now();

    try {
      let result: any;

      if (this.pool) {
        [result] = await this.pool.execute(sql, params);
      } else if (this.connection) {
        [result] = await this.connection.execute(sql, params);
      } else {
        throw new Error("No MySQL connection available");
      }

      const executionTime = Date.now() - startTime;
      logger.debug(`MySQL query executed`, {
        sql,
        params: params.length,
        rows: Array.isArray(result) ? result.length : 1,
        executionTime,
      });

      return Array.isArray(result) ? result : [result];
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(
        `MySQL query failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          sql,
          params,
          executionTime,
        }
      );
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }

      // 执行简单查询来验证连接
      await this.query("SELECT 1 as health_check");
      return true;
    } catch (error) {
      logger.error("MySQL health check failed", error);
      return false;
    }
  }

  /**
   * 获取数据库信息
   */
  async getDatabaseInfo() {
    const result = await this.query(
      "SELECT DATABASE() as current_database, VERSION() as version"
    );
    return result[0];
  }

  /**
   * 获取表列表
   */
  async getTables(): Promise<string[]> {
    const result = await this.query<{ TABLE_NAME: string }>(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = "BASE TABLE"'
    );
    return result.map((row) => row.TABLE_NAME);
  }

  /**
   * 获取表结构信息
   */
  async getTableInfo(tableName: string) {
    const result = await this.query(`DESCRIBE ${tableName}`);
    return result;
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    if (this.connected) {
      await this.disconnect();
    }
  }

  // 实现抽象方法
  async syncModels(models: Model[]): Promise<void> {
    for (const model of models) {
      // 构建 CREATE TABLE 语句
      const columns = Object.entries(model.schema)
        .map(([fieldName, field]) => {
          let col = `"${fieldName}" ${this.getSqlType(field)}`;
          if (field.primary) col += " PRIMARY KEY";
          if (field.autoIncrement) col += " AUTOINCREMENT";
          if (field.unique) col += " UNIQUE";
          if (field.notNull) col += " NOT NULL";
          if (field.initial !== undefined)
            col += ` DEFAULT ${this.formatDefault(field.initial)}`;
          return col;
        })
        .join(", ");
      const sql = `CREATE TABLE IF NOT EXISTS "${model.name}" (${columns})`;
      await this.query(sql);
    }
  }
  async alterModel<T extends Record<string, Model.Field>>(
    model: Model<T>,
    schema: Partial<T>
  ): Promise<void> {
    const addFields = Object.keys(schema).filter((key) => !model.schema[key]);
    const modifyFields = Object.keys(schema).filter((key) => model.schema[key]);
    for (const field of addFields) {
      const schemaItem = schema[field]!;
      let addSql = `ALTER TABLE "${model.name}" ADD COLUMN "${field}" ${this.getSqlType(schemaItem)}`;
    
      await this.query(addSql);
    }
    for (const field of modifyFields) {
      let modifySql = `ALTER TABLE "${model.name}" MODIFY COLUMN "${field}" ${this.getSqlType(model.schema[field])}`;
      await this.query(modifySql);
    }
  }
  /**
   * 获取字段的 SQLite 类型
   */
  private getSqlType(field: Model.Field): string {
    switch (field.type) {
      case "integer":
        return "INTEGER";
      case "float":
        return "REAL";
      case "boolean":
        return "INTEGER";
      case "string":
        return "TEXT";
      case "json":
        return "TEXT";
      case "date":
        return "TEXT";
      default:
        return "TEXT";
    }
  }
  /**
   * 格式化默认值
   */
  private formatDefault(value: any): string {
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === "boolean") return value ? "1" : "0";
    if (value === null) return "NULL";
    return String(value);
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const required = ["host", "username", "password", "database"];
    for (const field of required) {
      if (!this.config[field as keyof MySQLConfig]) {
        throw new Error(`MySQL configuration missing required field: ${field}`);
      }
    }

    // 设置默认值
    if (!this.config.port) {
      this.config.port = 3306;
    }

    if (!this.config.charset) {
      this.config.charset = "utf8mb4";
    }

    if (!this.config.timezone) {
      this.config.timezone = "+00:00";
    }

    if (!this.config.connectTimeout) {
      this.config.connectTimeout = 60000;
    }
  }
}

// 自动注册 MySQL 驱动
registerDriver("mysql", MySQL);

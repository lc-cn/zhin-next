// ================================================================================================
// PostgreSQL 数据库驱动包入口
// ================================================================================================

import { Database, Model, registerDriver, useLogger } from "zhin.js";
// ================================================================================================
// PostgreSQL 数据库驱动实现
// ================================================================================================

import { Client as PostgresClient, Pool as PostgresPool } from "pg";

declare module "zhin.js" {
  namespace Database {
    interface DriverConfig {
      postgresql: PostgreSQLConfig;
    }
  }
}
export interface PostgreSQLConfig {
  host: string; // 主机地址
  port?: number; // 端口号，默认5432
  username: string; // 用户名
  password: string; // 密码
  database: string; // 数据库名
  ssl?: boolean | any; // SSL配置
  connectionTimeoutMillis?: number; // 连接超时时间
  idleTimeoutMillis?: number; // 空闲超时时间
  query_timeout?: number; // 查询超时时间
  // 连接池配置
  pool?: {
    min?: number; // 最小连接数
    max?: number; // 最大连接数
    idle?: number; // 空闲超时时间
    acquireTimeout?: number; // 获取连接超时时间
    createTimeout?: number; // 创建连接超时时间
  };
}
const logger = useLogger();
/**
 * PostgreSQL 数据库驱动
 */
export class PostgreSQL extends Database.Driver<PostgreSQLConfig> {
  public connected = false;
  client?: PostgresClient;
  private pool?: PostgresPool;

  constructor(config: PostgreSQLConfig) {
    super("postgresql", config);
    this.config = config;
    this.validateConfig();
  }

  async syncModels(models: Model<any>[]): Promise<void> {}
  async alterModel<T extends Record<string, Model.Field>>(
    model: Model<T>,
    schema: Partial<T>
  ): Promise<void> {}
  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 创建连接配置
      const connectionConfig = {
        host: this.config.host,
        port: this.config.port || 5432,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl || false,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 30000,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        query_timeout: this.config.query_timeout || 60000,
      };

      // 如果配置了连接池，使用连接池；否则使用单连接
      if (this.config.pool) {
        const poolConfig = {
          ...connectionConfig,
          min: this.config.pool.min || 2,
          max: this.config.pool.max || 10,
          idleTimeoutMillis: this.config.pool.idle || 30000,
          connectionTimeoutMillis: this.config.pool.acquireTimeout || 30000,
          allowExitOnIdle: false,
        };

        this.pool = new PostgresPool(poolConfig);

        // 测试连接
        const testClient = await this.pool.connect();
        testClient.release();

        this.connected = true;
        logger.info(
          `PostgreSQL pool connected: ${this.config.host}:${this.config.port}/${this.config.database}`
        );
      } else {
        this.client = new PostgresClient(connectionConfig);
        await this.client.connect();
        this.connected = true;
        logger.info(
          `PostgreSQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`PostgreSQL connection failed: ${errorMsg}`);
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
        logger.info("PostgreSQL pool disconnected");
      } else if (this.client) {
        await this.client.end();
        this.client = undefined;
        logger.info("PostgreSQL client disconnected");
      }

      this.connected = false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`PostgreSQL disconnect failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected && (!!this.client || !!this.pool);
  }

  /**
   * 执行查询
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (!this.isConnected()) {
      throw new Error("PostgreSQL database not connected");
    }

    const startTime = Date.now();

    try {
      let result: any;

      if (this.pool) {
        result = await this.pool.query(sql, params);
      } else if (this.client) {
        result = await this.client.query(sql, params);
      } else {
        throw new Error("No PostgreSQL connection available");
      }

      const executionTime = Date.now() - startTime;
      logger.debug(`PostgreSQL query executed`, {
        sql,
        params: params.length,
        rows: result.rows.length,
        executionTime,
      });

      return result.rows as T;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`PostgreSQL query failed: ${errorMsg}`, {
        sql,
        params,
        executionTime,
      });
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
      logger.error("PostgreSQL health check failed", error);
      return false;
    }
  }

  /**
   * 获取数据库信息
   */
  async getDatabaseInfo() {
    const result = await this.query("SELECT current_database(), version()");
    return result[0];
  }

  /**
   * 获取表列表
   */
  async getTables(): Promise<string[]> {
    const result = await this.query<{ table_name: string }[]>(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
    return result.map((row) => row.table_name);
  }

  /**
   * 获取表结构信息
   */
  async getTableInfo(tableName: string) {
    const result = await this.query(
      `
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position
        `,
      [tableName]
    );

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

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const required = ["host", "username", "password", "database"];
    for (const field of required) {
      if (!this.config[field as keyof PostgreSQLConfig]) {
        throw new Error(
          `PostgreSQL configuration missing required field: ${field}`
        );
      }
    }

    // 设置默认值
    if (!this.config.port) {
      this.config.port = 5432;
    }

    if (!this.config.connectionTimeoutMillis) {
      this.config.connectionTimeoutMillis = 30000;
    }

    if (!this.config.idleTimeoutMillis) {
      this.config.idleTimeoutMillis = 30000;
    }

    if (!this.config.query_timeout) {
      this.config.query_timeout = 60000;
    }
  }
}

registerDriver("postgresql", PostgreSQL);

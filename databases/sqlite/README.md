# @zhin.js/database-sqlite

SQLite 数据库驱动，为 zhin.js 框架提供轻量级文件数据库支持。

## 特性

- 🗃️ **零配置**: 无需安装数据库服务器，直接使用文件存储
- ⚡ **高性能**: WAL 模式、内存映射、缓存优化
- 🔒 **ACID 支持**: 完整的事务处理和数据一致性
- 🛠️ **易调试**: 直接查看和编辑数据库文件
- 📦 **轻量级**: 适合开发环境和小型应用

## 安装

```bash
pnpm add @zhin.js/database-sqlite
```

## 使用

### 1. 引入驱动

```typescript
// 在项目入口文件中引入，会自动注册驱动
import '@zhin.js/database-sqlite'
```

### 2. 配置数据库

```yaml
# zhin.config.yml
databases:
  - name: main
    type: sqlite
    database: ./data/zhin.db
    enableWal: true
    enableForeignKeys: true
    busyTimeout: 10000
    cacheSize: -16000
```

### 3. 在插件中使用

```typescript
import { useContext } from 'zhin.js'

useContext('database', (dbService) => {
  const db = dbService.getConnection('main')
  
  // 执行查询
  const users = await db.query('SELECT * FROM users WHERE active = ?', [1])
  
  // 插入数据
  await db.query('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com'])
  
  // 更新数据
  await db.query('UPDATE users SET name = ? WHERE id = ?', ['Jane', 1])
})
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `name` | string | 必需 | 数据库连接名称 |
| `type` | string | `'sqlite'` | 数据库类型 |
| `database` | string | 必需 | 数据库文件路径 |
| `mode` | number | `READWRITE \| CREATE` | 数据库打开模式 |
| `busyTimeout` | number | `10000` | 忙碌超时时间 (ms) |
| `enableWal` | boolean | `true` | 启用 WAL 日志模式 |
| `enableForeignKeys` | boolean | `true` | 启用外键约束 |
| `cacheSize` | number | `-16000` | 缓存大小 (负数表示KB) |

## 优化配置

SQLite 驱动自动应用以下优化：

### WAL 模式
```sql
PRAGMA journal_mode = WAL;
```
- 提高并发性能
- 减少锁定时间
- 支持并发读写

### 外键约束
```sql
PRAGMA foreign_keys = ON;
```
- 确保数据完整性
- 级联删除和更新
- 关系一致性检查

### 性能优化
```sql
PRAGMA synchronous = NORMAL;    -- 平衡性能和安全
PRAGMA temp_store = MEMORY;     -- 临时表存内存
PRAGMA mmap_size = 268435456;   -- 256MB 内存映射
PRAGMA cache_size = -16000;     -- 16MB 缓存
```

## 最佳实践

### 1. 数据库文件位置
```yaml
databases:
  - name: main
    type: sqlite
    database: ./data/production.db  # 生产环境
    # database: ./data/dev.db      # 开发环境
    # database: :memory:           # 内存数据库 (测试用)
```

### 2. WAL 模式配置
```yaml
databases:
  - name: main
    type: sqlite
    database: ./data/app.db
    enableWal: true           # 高并发场景
    busyTimeout: 30000        # 增加超时时间
```

### 3. 开发vs生产配置
```yaml
# 开发环境
databases:
  - name: main
    type: sqlite
    database: ./data/dev.db
    enableWal: false          # 简化调试
    cacheSize: -8000         # 较小缓存

# 生产环境  
databases:
  - name: main
    type: sqlite
    database: ./data/prod.db
    enableWal: true          # 最佳性能
    cacheSize: -32000        # 更大缓存
    busyTimeout: 30000       # 更长超时
```

## API 参考

### SQLiteDriver 类

```typescript
class SQLiteDriver implements DatabaseDriver {
  constructor(plugin: Plugin, config: SQLiteConfig)
  
  // 连接管理
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  isConnected(): boolean
  
  // 查询执行
  async query<T>(sql: string, params?: any[]): Promise<T[]>
  async healthCheck(): Promise<boolean>
  
  // 元数据
  async getTables(): Promise<string[]>
  async getTableInfo(tableName: string): Promise<any[]>
  async getDatabaseInfo(): Promise<any>
}
```

### 配置接口

```typescript
interface SQLiteConfig extends DatabaseConfig {
  type: 'sqlite'
  database: string              // 数据库文件路径
  mode?: number                 // 打开模式
  busyTimeout?: number          // 忙碌超时
  enableWal?: boolean           // WAL 模式
  enableForeignKeys?: boolean   // 外键约束
  cacheSize?: number           // 缓存大小
}
```

## 故障排查

### 1. 数据库锁定
```
Error: database is locked
```
**解决方案:**
- 增加 `busyTimeout`
- 启用 WAL 模式
- 检查文件权限

### 2. 文件路径错误
```
Error: unable to open database file
```
**解决方案:**
- 检查文件路径是否正确
- 确保目录存在
- 检查文件权限

### 3. WAL 文件问题
```
Error: disk I/O error
```
**解决方案:**
- 检查磁盘空间
- 检查 WAL 文件权限
- 重启应用重建 WAL 文件

## 性能监控

SQLite 驱动自动记录以下信息：

```typescript
// 查询日志
{
  sql: 'SELECT * FROM users WHERE id = ?',
  params: [1],
  executionTime: 15,
  rows: 1
}

// 健康检查
{
  connected: true,
  databaseFile: '/path/to/database.db',
  walMode: true,
  foreignKeys: true
}
```

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

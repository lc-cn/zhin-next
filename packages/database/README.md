# 数据库方言库

一个基于方言架构的 TypeScript 数据库抽象库。该库提供了统一的接口来操作不同的数据库，同时保持类型安全并允许数据库特定的优化。

## 特性

- **方言架构**: 每个数据库都有自己的方言实现
- **类型安全**: 全面的 TypeScript 类型定义，严格类型检查
- **统一 API**: 所有支持的数据库使用相同的接口
- **SQL 生成**: 自动生成 SQL，支持数据库特定优化
- **查询构建**: 流畅的查询构建器，支持方法链式调用
- **模式管理**: 类型安全的模式定义和修改
- **模型管理**: 基于模式的模型系统，自动表创建

## 支持的数据库

- SQLite
- MySQL
- PostgreSQL

## 安装

```bash
npm install sqlite3 mysql2 pg
npm install @types/sqlite3 @types/pg
```

## 快速开始

```typescript
import { Database, SQLiteDialect } from './index.js';

// 定义数据模型
export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: Date;
}

// 创建方言和数据库
const dialect = new SQLiteDialect({ 
  filename: 'example.db',
  memory: false,
  timeout: 5000,
  retries: 3
});

const db = new Database<SQLiteDialect, { users: User }>(dialect, {
  users: {
    id: { type: 'integer', primary: true, default: NaN },
    name: { type: 'text', nullable: false, default: '' },
    email: { type: 'text', nullable: false, unique: true, default: '' },
    age: { type: 'integer', default: NaN },
    created_at: { type: 'date', default: new Date() }
  }
});

// 启动数据库（自动创建表）
await db.start();

// 获取模型
const model = db.model('users');

// 插入数据
const newUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  created_at: new Date()
};

await model.create(newUser);
console.log('用户已插入');

// 查询数据
const users = await model.select('id', 'name', 'email')
  .where({ name: { $gte: 'John' } })
  .orderBy('name', 'ASC')
  .limit(10);

console.log('找到的用户:', users);

// 更新数据
await model.update({ age: 31 })
  .where({ id: 1 });

console.log('用户已更新');

// 删除数据
await model.delete({ age: { $lt: 18 } });

console.log('用户已删除');

// 修改表结构
await model.alter({
  name: { action: 'add', type: 'text', nullable: true },
  age: { action: 'modify', type: 'integer', nullable: false }
});

console.log('表已修改');

// 停止数据库
await db.stop();
console.log('数据库已停止');
```

## 多数据库支持

```typescript
import { Database, SQLiteDialect, MySQLDialect, PostgreSQLDialect } from './index.js';

// 相同的代码适用于不同的数据库
async function createUserTable<T extends Dialect<any>>(db: Database<T>) {
  await db.start();
  const model = db.model('users');
  // 使用模型进行操作...
}

// SQLite
const sqliteDb = new Database(new SQLiteDialect({ filename: 'test.db' }), {
  users: { /* 模式定义 */ }
});
await createUserTable(sqliteDb);

// MySQL
const mysqlDb = new Database(new MySQLDialect({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'testdb'
}), {
  users: { /* 模式定义 */ }
});
await createUserTable(mysqlDb);

// PostgreSQL
const postgresqlDb = new Database(new PostgreSQLDialect({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'testdb'
}), {
  users: { /* 模式定义 */ }
});
await createUserTable(postgresqlDb);
```

## 模式定义

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: Date;
}

// 在数据库构造函数中定义模式
const db = new Database<SQLiteDialect, { users: User }>(dialect, {
  users: {
    id: { type: 'integer', primary: true, default: NaN },
    name: { type: 'text', nullable: false, default: '' },
    email: { type: 'text', nullable: false, unique: true, default: '' },
    age: { type: 'integer', default: NaN },
    created_at: { type: 'date', default: new Date() }
  }
});
```

## 查询条件

```typescript
// 简单条件
.where({ name: 'John' })
.where({ age: { $gte: 25 } })
.where({ email: { $like: '%@example.com' } })

// 复杂条件
.where({
  $and: [
    { age: { $gte: 25 } },
    { name: { $like: 'A%' } }
  ]
})

.where({
  $or: [
    { age: { $lt: 18 } },
    { age: { $gt: 65 } }
  ]
})
```

## 添加新数据库支持

要添加新数据库支持，创建一个新的方言类：

```typescript
import { Dialect } from './dialect.js';

export class OracleDialect extends Dialect<OracleConfig> {
  constructor(config: OracleConfig) {
    super('oracle', config);
  }
  
  // 实现所有必需的方法
  isConnected(): boolean { /* Oracle 连接逻辑 */ }
  async connect(): Promise<void> { /* Oracle 连接逻辑 */ }
  async disconnect(): Promise<void> { /* Oracle 断开连接逻辑 */ }
  async healthCheck(): Promise<boolean> { /* Oracle 健康检查逻辑 */ }
  async query<U = any>(sql: string, params?: any[]): Promise<U> { /* Oracle 查询逻辑 */ }
  async dispose(): Promise<void> { /* Oracle 清理逻辑 */ }
  
  // SQL 生成方法
  mapColumnType(type: string): string { /* Oracle 类型映射 */ }
  quoteIdentifier(identifier: string): string { /* Oracle 标识符引用 */ }
  getParameterPlaceholder(index: number): string { /* Oracle 参数占位符 */ }
  // ... 实现其他必需的方法
}
```

## API 参考

### Database 类

- `start(): Promise<void>` - 启动数据库（自动创建表）
- `stop(): Promise<void>` - 停止数据库
- `model<T>(name: T): Model<S[T], D>` - 获取模型实例
- `create<T>(name: string, schema: Schema<T>): Creation<T>` - 创建表
- `alter<T>(name: string, alterations: AlterSchema<T>): Alteration<T>` - 修改表
- `dropTable<T>(name: string): DroppingTable<T>` - 删除表
- `dropIndex(indexName: string, tableName: string): DroppingIndex` - 删除索引
- `select<T, K>(name: string, fields: NonEmptyArray<K>): Selection<Pick<T, K>, K>` - 查询
- `insert<T>(name: string, data: T): Insertion<T>` - 插入
- `update<T>(name: string, update: Partial<T>): Updation<T>` - 更新
- `delete<T>(name: string): Deletion<T>` - 删除

### Model 类

- `create(data: T): Promise<T>` - 创建记录
- `select<K>(...fields: NonEmptyArray<K>): Selection<Pick<T, K>, K>` - 查询记录
- `update(update: Partial<T>): Updation<T>` - 更新记录
- `delete(condition?: Condition<T>): Deletion<T>` - 删除记录
- `alter(alterations: AlterSchema<T>): Alteration<T>` - 修改表结构

### 查询方法

所有查询类都支持：
- `.where(condition: Condition<T>): this` - 添加条件
- `.orderBy(field: keyof T, direction: 'ASC' | 'DESC'): this` - 排序
- `.limit(count: number): this` - 限制数量
- `.offset(count: number): this` - 偏移量
- `.groupBy(...fields: (keyof T)[]): this` - 分组

### 模式类型

- `Schema<T>`: 字段名到列定义的对象映射
- `Column<T>`: 列定义，包含类型、约束和选项
- `AlterSchema<T>`: 模式修改操作（添加、修改、删除）

### 条件类型

- `Condition<T>`: 查询条件，支持操作符 ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $like, $nlike)
- `LogicOperators<T>`: 逻辑操作符 ($and, $or, $not)

## 许可证

MIT

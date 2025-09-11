# Zhin.js 数据库驱动

这个目录包含了 zhin.js 框架的官方数据库驱动实现。

## 架构设计

类似于适配器 (adapters) 的设计哲学，数据库驱动采用插件化架构：

- **插件化**: 每个数据库类型都是独立的包，用户可以按需安装
- **统一接口**: 所有驱动都实现相同的 `DatabaseDriver` 接口  
- **配置驱动**: 通过配置文件自动加载和连接数据库
- **热重载**: 支持开发时的热重载和生产环境的优雅重启

## 可用驱动

| 数据库类型 | 包名 | 状态 | 描述 |
|-----------|------|------|------|
| SQLite | `@zhin.js/database-sqlite` | ✅ | 轻量级文件数据库，零配置 |
| MySQL | `@zhin.js/database-mysql` | ✅ | 企业级关系数据库，支持连接池 |
| PostgreSQL | `@zhin.js/database-postgresql` | ✅ | 高级开源数据库，支持JSON和扩展 |

## 使用方式

### 1. 安装数据库驱动

```bash
# 安装 SQLite 驱动 (推荐用于开发)
pnpm add @zhin.js/database-sqlite

# 安装 MySQL 驱动 (企业生产环境)
pnpm add @zhin.js/database-mysql

# 安装 PostgreSQL 驱动 (高级功能需求)
pnpm add @zhin.js/database-postgresql
```

### 2. 在项目中引入驱动

```typescript
// 在你的插件或入口文件中
import '@zhin.js/database-sqlite'    // 自动注册SQLite驱动
import '@zhin.js/database-mysql'     // 自动注册MySQL驱动  
import '@zhin.js/database-postgresql' // 自动注册PostgreSQL驱动
```

### 3. 配置数据库

在你的配置文件中添加数据库配置：

```yaml
# zhin.config.yml
databases:
  - name: main
    type: sqlite
    database: ./data/zhin.db
    
  - name: cache  
    type: mysql
    host: localhost
    port: 3306
    username: root
    password: password
    database: zhin_cache
    
  - name: analytics
    type: postgresql  
    host: localhost
    port: 5432
    username: postgres
    password: password
    database: zhin_analytics
```

### 4. 使用数据库服务

```typescript
import { useContext } from 'zhin.js'

// 在插件中使用数据库
useContext('database', (dbService) => {
  // 获取特定数据库连接
  const mainDb = dbService.getConnection('main')
  const cacheDb = dbService.getConnection('cache')
  
  // 执行查询
  await mainDb.query('SELECT * FROM users')
  
  // 使用ORM风格API
  const users = mainDb.model('users')
  await users.create({ name: 'John', email: 'john@example.com' })
  await users.find({ active: true })
})
```

## 开发自定义驱动

如果需要支持其他数据库，可以创建自定义驱动：

```typescript
import { Database, DatabaseDriver } from 'zhin.js'

class CustomDatabaseDriver implements DatabaseDriver {
  async connect() { /* 实现连接逻辑 */ }
  async disconnect() { /* 实现断开逻辑 */ }
  isConnected() { /* 检查连接状态 */ }
  async query(sql, params) { /* 执行查询 */ }
  async healthCheck() { /* 健康检查 */ }
}

// 注册自定义驱动
registerDatabase(new Database('custom', CustomDatabaseDriver))
```

## 特性对比

| 特性 | SQLite | MySQL | PostgreSQL |
|------|--------|-------|------------|
| 部署复杂度 | ⭐ 极简 | ⭐⭐ 中等 | ⭐⭐⭐ 复杂 |
| 并发性能 | ⭐⭐ 中等 | ⭐⭐⭐ 优秀 | ⭐⭐⭐ 优秀 |
| 功能丰富度 | ⭐⭐ 基础 | ⭐⭐⭐ 丰富 | ⭐⭐⭐⭐ 极丰富 |
| 学习成本 | ⭐ 很低 | ⭐⭐ 中等 | ⭐⭐⭐ 较高 |
| 适用场景 | 开发、小型应用 | 企业级Web应用 | 数据分析、复杂查询 |

## 技术架构

数据库驱动系统采用以下架构：

```
zhin.js Core
├── registerDatabase()     # 注册驱动的核心函数
├── Database               # 驱动基类
└── DatabaseDriver         # 驱动接口

Database Packages (独立包)
├── @zhin.js/database-sqlite
├── @zhin.js/database-mysql  
└── @zhin.js/database-postgresql

Database Service (核心服务)
├── @zhin.js/database      # 统一的数据库服务
├── 连接管理器              # 管理多个数据库连接
├── ORM层                  # 对象关系映射
└── Web管理界面            # 数据库管理GUI
```

## 贡献指南

欢迎为 zhin.js 数据库生态系统贡献代码！

1. **新驱动开发**: 为其他数据库 (Redis, MongoDB 等) 开发驱动
2. **功能增强**: 改进现有驱动的性能和功能
3. **文档完善**: 补充使用示例和最佳实践
4. **测试用例**: 添加单元测试和集成测试

更多详情请查看各个驱动包的 README 文档。

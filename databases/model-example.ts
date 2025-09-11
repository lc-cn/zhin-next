// ================================================================================================
// Model 使用示例 - 展示完善的 Schema 定义和 Model 操作
// ================================================================================================

import { createApp, Model } from '../packages/core/lib/index.js'
import './sqlite/lib/index.js'

// ================================================================================================
// 1. 定义数据模型类型
// ================================================================================================

interface User {
    id: number
    username: string
    email: string
    password: string
    avatar?: string
    isActive: boolean
    role: 'admin' | 'user' | 'guest'
    loginCount: number
    lastLoginAt: string | null
    createdAt: string
    updatedAt: string
}

interface Post {
    id: number
    title: string
    content: string
    authorId: number
    published: boolean
    viewCount: number
    tags: string  // JSON 格式
    createdAt: string
    updatedAt: string
}

// ================================================================================================
// 2. 定义 Schema（类型安全的字段定义）
// ================================================================================================

const UserSchema: Model.Schema<User> = {
    id: Model.Field.id(),  // 自增主键
    username: Model.Field.requiredString({ 
        unique: true, 
        validator: (value) => value.length >= 3 && value.length <= 20,
        comment: '用户名，3-20字符'
    }),
    email: Model.Field.requiredString({ 
        unique: true,
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        comment: '邮箱地址'
    }),
    password: Model.Field.requiredString({
        validator: (value) => value.length >= 6,
        comment: '密码，至少6位'
    }),
    avatar: Model.Field.string({ comment: '头像URL' }),
    isActive: Model.Field.boolean({ default: true, comment: '是否激活' }),
    role: Model.Field.string({ 
        default: 'user',
        validator: (value) => ['admin', 'user', 'guest'].includes(value),
        comment: '用户角色'
    }),
    loginCount: Model.Field.integer({ default: 0, comment: '登录次数' }),
    lastLoginAt: Model.Field.datetime({ comment: '最后登录时间' }),
    createdAt: Model.Field.createdAt(),
    updatedAt: Model.Field.updatedAt()
}

const PostSchema: Model.Schema<Post> = {
    id: Model.Field.id(),
    title: Model.Field.requiredString({
        validator: (value) => value.length >= 1 && value.length <= 200,
        comment: '文章标题'
    }),
    content: Model.Field.requiredString({ comment: '文章内容' }),
    authorId: Model.Field.integer({ 
        notNull: true,
        index: true,
        comment: '作者ID'
    }),
    published: Model.Field.boolean({ default: false, comment: '是否发布' }),
    viewCount: Model.Field.integer({ default: 0, comment: '浏览次数' }),
    tags: Model.Field.json({ default: '[]', comment: '标签JSON' }),
    createdAt: Model.Field.createdAt(),
    updatedAt: Model.Field.updatedAt()
}

// ================================================================================================
// 3. 使用示例
// ================================================================================================

async function modelExample() {
    console.log('🚀 Model 系统使用示例')

    // 创建应用
    const app = await createApp({
        databases: [{
            name: 'main',
            type: 'sqlite',
            database: './data/model-example.db'
        }]
    })

    try {
        // 获取数据库实例
        const sqliteDB = app.getContext('sqlite')
        const db = sqliteDB.drivers.get('main')!

        console.log('📊 创建模型实例...')
        
        // 创建模型实例
        const User = db.model<User>('users', UserSchema)
        const Post = db.model<Post>('posts', PostSchema)

        console.log('🏗️  初始化表结构...')
        
        // 初始化表结构（创建表和索引）
        await User.init()
        await Post.init()

        console.log('👤 用户操作示例...')

        // ================================
        // 创建用户
        // ================================
        const newUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            avatar: 'https://example.com/avatar.png',
            role: 'user'
        })
        console.log('✅ 用户创建成功:', newUser.username)

        // ================================
        // 批量创建用户
        // ================================
        const batchUsers = await User.createMany([
            {
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            },
            {
                username: 'guest',
                email: 'guest@example.com', 
                password: 'guest123',
                role: 'guest',
                isActive: false
            }
        ])
        console.log(`✅ 批量创建 ${batchUsers.length} 个用户`)

        // ================================
        // 查询操作
        // ================================
        
        // 查找单个用户
        const foundUser = await User.findOne({ username: 'testuser' })
        console.log('🔍 查找用户:', foundUser?.email)

        // 根据ID查找
        const userById = await User.findById(1)
        console.log('🔍 ID查找用户:', userById?.username)

        // 条件查询
        const activeUsers = await User.find(
            { isActive: true },
            { orderBy: 'createdAt', order: 'DESC', limit: 10 }
        )
        console.log(`🔍 活跃用户数量: ${activeUsers.length}`)

        // 分页查询
        const userPage = await User.paginate({ role: 'user' }, 1, 2)
        console.log('📄 分页结果:', {
            总数: userPage.total,
            当前页: userPage.page,
            数据: userPage.data.length,
            总页数: userPage.totalPages
        })

        // ================================
        // 更新操作
        // ================================
        const updateCount = await User.update(
            { loginCount: 5, lastLoginAt: new Date().toISOString() },
            { username: 'testuser' }
        )
        console.log(`✅ 更新了 ${updateCount} 个用户的登录信息`)

        // ================================
        // 文章操作示例
        // ================================
        console.log('📝 文章操作示例...')

        const post = await Post.create({
            title: '我的第一篇文章',
            content: '这是文章内容...',
            authorId: 1,
            published: true,
            tags: JSON.stringify(['技术', '教程'])
        })
        console.log('✅ 文章创建成功:', post.title)

        // ================================
        // 统计和聚合
        // ================================
        const userCount = await User.count()
        const publishedPosts = await Post.count({ published: true })
        const adminExists = await User.exists({ role: 'admin' })

        console.log('📊 统计信息:')
        console.log(`  - 用户总数: ${userCount}`)
        console.log(`  - 已发布文章: ${publishedPosts}`)
        console.log(`  - 管理员存在: ${adminExists}`)

        // ================================
        // 数据验证示例
        // ================================
        console.log('✅ 数据验证示例...')
        
        try {
            // 这会触发验证错误
            await User.create({
                username: 'ab',  // 太短，不符合验证规则
                email: 'invalid-email',  // 格式错误
                password: '123'  // 太短
            })
        } catch (error) {
            console.log('❌ 预期的验证错误:', (error as Error).message)
        }

        console.log('🎉 Model 系统演示完成！')

    } catch (error) {
        console.error('❌ 演示过程中出错:', error)
    } finally {
        await app.stop()
    }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
    modelExample().catch(console.error)
}

export { modelExample, UserSchema, PostSchema }

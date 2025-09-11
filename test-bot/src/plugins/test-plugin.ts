import {
    useContext,
    addCommand,
    usePrompt,
    Time,
    addComponent,
    defineComponent,
    MessageCommand, useApp, Adapter,
} from 'zhin.js';
import path from "node:path";
import * as os from "node:os";
const app = useApp()
function formatMemoSize(size: number) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    while (size > 1024) {
        size = size / 1024
        sizes.shift()
    }
    return `${(size).toFixed(2)}${sizes[0]}`
}
addCommand(new MessageCommand('send')
    .action((_, result) => result.remaining))
addCommand(new MessageCommand('zt')
    .action(() => {
        const totalmem = os.totalmem();
        const freemem = os.freemem();
        const usedmemo = totalmem - freemem;
        return [
            '-------概览-------',
            `操作系统：${os.type()} ${os.release()} ${os.arch()}`,
            `内存占用：${formatMemoSize(usedmemo)}/${formatMemoSize(totalmem)} ${((usedmemo / totalmem) * 100).toFixed(2)}%`,
            `运行环境：NodeJS ${process.version}`,
            `运行时长：${Time.formatTime(process.uptime() * 1000)}`,
            `内存使用：${formatMemoSize(process.memoryUsage.rss())}`,
            '-------框架-------',
            `适配器：${app.adapters.length}个`,
            `插件：${app.dependencyList.length}个`,
            '-------机器人-------',
            ...app.adapters.map((name) => {
                return `  ${name}：${app.getContext<Adapter>(name).bots.size}个`
            })
        ].join('\n')
    }))

const testComponent = defineComponent({
    name: 'test',
    props: {
        id: String
    },
    async render({ id }, context) {
        return '这是父组件' + id + (context.children || '');
    }
})
const testComponent2 = defineComponent({
    name: 'fetch',
    props: {
        url: {
            type: String,
            default: ""
        }
    },
    async render({ url }) {
        const result: string = await fetch(url).then(r => r.text())
        return result
    }
})
addComponent(testComponent)
addComponent(testComponent2)
useContext('web', (web) => {
    web.addEntry(path.resolve(path.resolve(import.meta.dirname, '../../client/index.ts')))
})
// 依赖icqq上下文
useContext('icqq', (p) => { // 指定某个上下文就绪时，需要做的事
    const someUsers = new MessageCommand('赞[space][...atUsers:at]', { at: 'qq' })
        .scope('icqq')
        .action(async (m, { params }) => {
            if (!params.atUsers?.length) params.atUsers = [+m.$sender.id];
            const likeResult: string[] = []
            for (const user_id of params.atUsers) {
                const userResult = await Promise.all(new Array(3).fill(0).map(() => {
                    return p.bots.get(m.$bot)?.sendLike(user_id, 20)
                }));
                likeResult.push(`为用户(${user_id})赞${userResult.filter(Boolean).length ? '成功' : '失败'}`)
            }
            return likeResult.join('\n');
        })
    addCommand(someUsers);
})
const testCommand = new MessageCommand('test')
    .action(async (m) => usePrompt(m).text('请输入文本'))
addCommand(testCommand)

// 数据库测试 - 直接使用原生 SQL 查询
useContext('sqlite', (sqlite) => {
    // 简单的数据库查询测试命令
    addCommand(new MessageCommand('dbtest')
        .action(async (message) => {
            try {
                const db = sqlite.get('main')
                if (!db) {
                    return '❌ 数据库驱动未找到'
                }
                
                // 创建测试表
                await db.query(`
                    CREATE TABLE IF NOT EXISTS test_users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `)
                
                // 插入测试数据
                await db.query(
                    'INSERT OR IGNORE INTO test_users (name, email) VALUES (?, ?)',
                    ['测试用户', 'test@example.com']
                )
                
                // 查询数据
                const users = await db.query('SELECT * FROM test_users LIMIT 5')
                
                if (users.length === 0) {
                    return '📄 暂无用户数据'
                }
                
                return '👥 用户列表:\n' + users.map((user: any) =>
                    `ID: ${user.id} | 姓名: ${user.name} | 邮箱: ${user.email}`
                ).join('\n')
                
            } catch (error) {
                return `❌ 数据库操作失败: ${(error as Error).message}`
            }
        })
    )
    
    // 数据库表信息查询
    addCommand(new MessageCommand('dbtables')
        .action(async (message) => {
            try {
                const db = sqlite.get('main')
                if (!db) {
                    return '❌ 数据库驱动未找到'
                }
                
                const tables = await db.getTables()
                if (tables.length === 0) {
                    return '📄 数据库中暂无表'
                }
                
                return '📋 数据库表列表:\n' + tables.map((table: string, index: number) =>
                    `${index + 1}. ${table}`
                ).join('\n')
                
            } catch (error) {
                return `❌ 查询失败: ${(error as Error).message}`
            }
        })
    )
})
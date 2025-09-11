// 测试 zhin.js 核心API导出（不触发自动注册）
import { 
    createApp,
    useApp, 
    usePlugin,
    register,
    registerAdapter,
    registerDatabase,
    useContext,
    addCommand,
    addMiddleware,
    onMessage,
    Message,
    Bot,
    Adapter,
    Database,
    createZhinApp
} from './packages/zhin/lib/index.js'

console.log('🔍 检查 zhin.js 核心API导出:')

const coreAPIs = [
    { name: 'createApp', value: createApp },
    { name: 'useApp', value: useApp }, 
    { name: 'usePlugin', value: usePlugin },
    { name: 'register', value: register },
    { name: 'registerAdapter', value: registerAdapter },
    { name: 'registerDatabase', value: registerDatabase },
    { name: 'useContext', value: useContext },
    { name: 'addCommand', value: addCommand },
    { name: 'addMiddleware', value: addMiddleware },
    { name: 'onMessage', value: onMessage },
    { name: 'Message', value: Message },
    { name: 'Bot', value: Bot },
    { name: 'Adapter', value: Adapter },
    { name: 'Database', value: Database },
    { name: 'createZhinApp', value: createZhinApp }
]

console.log('\n✅ 核心API检查:')
coreAPIs.forEach(api => {
    const exists = typeof api.value !== 'undefined'
    const type = typeof api.value
    console.log(`  ${exists ? '✅' : '❌'} ${api.name}: ${exists ? type : '缺失'}`)
})

console.log('\n🎉 zhin.js 核心API验证完成！')
console.log('💡 使用 createZhinApp() 可以自动加载所有核心功能包')
console.log('📦 开箱即用的功能包：')
console.log('   - @zhin.js/adapter-process (进程适配器)')
console.log('   - @zhin.js/http (HTTP服务)')
console.log('   - @zhin.js/console (Web控制台)')
console.log('   - @zhin.js/database-sqlite (SQLite数据库)')

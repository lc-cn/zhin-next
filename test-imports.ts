// 测试 zhin.js 包的导入
import * as zhinJS from './packages/zhin/lib/index.js'

console.log('🔍 检查 zhin.js 包导出内容:')

// 检查核心导出
const exports = Object.keys(zhinJS)
console.log('📦 导出的函数和类:', exports.slice(0, 10), '...(共' + exports.length + '个)')

// 检查关键导出是否存在
const keyExports = [
    'createApp',
    'useApp', 
    'usePlugin',
    'register',
    'registerAdapter',
    'registerDatabase',
    'useContext',
    'addCommand',
    'addMiddleware',
    'onMessage',
    'Message',
    'Bot',
    'Adapter',
    'Database'
]

console.log('\n✅ 核心API检查:')
keyExports.forEach(exportName => {
    const exists = exportName in zhinJS
    console.log(`  ${exists ? '✅' : '❌'} ${exportName}: ${exists ? '存在' : '缺失'}`)
})

console.log('\n🎉 zhin.js 包结构验证完成！')

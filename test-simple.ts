// 简单的 zhin.js 包导出测试
import * as zhinJS from './packages/zhin/lib/index.js'

console.log('🔍 检查 zhin.js 包导出内容:')

// 检查所有导出
const exports = Object.keys(zhinJS)
console.log('📦 所有导出:', exports)

// 检查关键函数
const keyFunctions = ['createApp', 'createZhinApp', 'logger']
keyFunctions.forEach(funcName => {
    const exists = funcName in zhinJS
    const type = typeof zhinJS[funcName as keyof typeof zhinJS]
    console.log(`✅ ${funcName}: ${exists ? type : '缺失'}`)
})

console.log('\n🎉 zhin.js 基本导出验证完成！')

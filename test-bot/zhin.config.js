import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name:`${process.pid}`,
        context:'process'
      },
      {
        name:'1689919782',
        context:'icqq',
        log_level:'off',
        platform:4
      }
    ],
    // 插件目录
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules'
    ],
    // 要加载的插件列表
    plugins: [
      'icqq',
      'process',
      'test-plugin'
    ],

    // 调试模式
    debug: env.DEBUG === 'true'
  }
})


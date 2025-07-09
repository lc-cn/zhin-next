import { defineConfig } from '@zhin/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      // {
      //   name: 'onebot11',
      //   adapter: 'onebot11',
      //   url: env.ONEBOT_URL || 'ws://localhost:8080',
      //   access_token: env.ONEBOT_ACCESS_TOKEN || ''
      // },
      {
        name:'1689919782',
        adapter:'icqq',
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
      'test-plugin'
    ],

    // 禁用的依赖列表
    disable_dependencies: [],

    // 调试模式
    debug: env.DEBUG === 'true'
  }
})


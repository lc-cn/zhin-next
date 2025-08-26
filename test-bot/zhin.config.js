import { defineConfig } from 'zhin.js';
import path from "node:path";

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name:`${process.pid}`,
        context:'process'
      },
      {
        name: process.env.ICQQ_SCAN_UIN,
        context:'icqq',
        log_level:'off',
        platform:4
      },
      {
        name: process.env.ICQQ_LOGIN_UIN,
        context:'icqq',
        log_level:'off',
        password:"Lcl9623.",
        sign_api_addr: process.env.ICQQ_SIGN_ADDR,
        platform:1
      }
    ],
    // 插件目录
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules',
        path.join('node_modules','@zhin.js'),
    ],
    // 要加载的插件列表
    plugins: [
      'adapter-icqq',
        'http',
      'adapter-process',
      'test-plugin'
    ],

    // 调试模式
    debug: env.DEBUG === 'true'
  }
})


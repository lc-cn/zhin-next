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
        name: 'zhin',
        context:'kook',
        token: env.KOOK_TOKEN,
        mode: 'websocket',
        logLevel:'off',
        ignore: 'bot',
      },
      {
        name: env.ICQQ_SCAN_UIN,
        context:'icqq',
        log_level:'off',
        platform:4
      },
      {
        name: env.ONEBOT_QQ,
        context:'onebot11',
        url:'wss://napcat.liucl.cn/ws',
        access_token:env.ONEBOT_TOKEN
      },
      // {
      //   name: env.ICQQ_LOGIN_UIN,
      //   context:'icqq',
      //   log_level:'off',
      //   password:"Lcl9623.",
      //   sign_api_addr: env.ICQQ_SIGN_ADDR,
      //   platform:2
      // }
    ],
    // 插件目录
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules',
        path.join('node_modules','@zhin.js'),
    ],
    // 要加载的插件列表
    plugins: [
      'http',           // 🚀 HTTP先加载，注册基础API路由
      'adapter-icqq',   // 🤖 ICQQ适配器注册 /api/icqq/* 路由
      'adapter-onebot11',
      'console',        // 🖥️ 控制台最后加载，处理静态文件
      'adapter-kook',
      'adapter-process',
      'test-plugin'
    ],

    // 调试模式
    debug: env.DEBUG === 'true'
  }
})


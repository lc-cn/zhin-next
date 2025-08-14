import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

interface InitOptions {
  name?: string;
  config?: 'json' | 'yaml' | 'toml' | 'ts' | 'js';
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  runtime?: 'node' | 'bun';
  yes?: boolean;
}

export const initCommand = new Command('init')
  .description('初始化新的Zhin机器人项目')
  .argument('[project-name]', '项目名称')
  .option('-c, --config <format>', '配置文件格式 (json|yaml|toml|ts|js)', 'js')
  .option('-p, --package-manager <manager>', '包管理器 (npm|yarn|pnpm)', 'pnpm')
  .option('-r, --runtime <runtime>', '运行时 (node|bun)', 'bun')
  .option('-y, --yes', '自动回答所有问题')
  .action(async (projectName: string, options: InitOptions) => {
    if(options.yes) {
      options.config = 'js';
      options.packageManager = 'pnpm';
      options.runtime = 'bun';
    }
    try {
      let name = projectName;
      
      if (!name) {
        const {projectName:inputName} = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '请输入项目名称:',
            default: 'my-zhin-bot',
            validate: (input: string) => {
              if (!input.trim()) {
                return '项目名称不能为空';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return '项目名称只能包含字母、数字、横线和下划线';
              }
              return true;
            }
          }
        ]);
        name = inputName;
      }
      if(!options.runtime) {
        const {runtime:inputRuntime} = await inquirer.prompt([
          {
            type: 'list',
            name: 'runtime',
            message: '选择运行时:',
            choices: [
              { name: 'Bun (推荐)', value: 'bun' },
              { name: 'Node.js', value: 'node' }
            ],
            default: options.runtime || 'bun'
          },
        ])
        options.runtime=inputRuntime;
      }
      if(!options.packageManager) {
        const {packageManager:inputPackageManager} = await inquirer.prompt([
          {
            type: 'list',
            name: 'packageManager',
            message: '选择包管理器:',
            choices: [
              { name: 'pnpm (推荐)', value: 'pnpm' },
              { name: 'npm', value: 'npm' },
              { name: 'yarn', value: 'yarn' }
            ],
            default: options.packageManager || 'pnpm'
          }
        ])
        options.packageManager=inputPackageManager;
      }
      if(!options.config) {
        const {configFormat:inputConfigFormat} = await inquirer.prompt([
          {
            type: 'list',
            name: 'configFormat',
            message: '选择配置文件格式:',
            choices: [
              { name: 'JavaScript (推荐)', value: 'js' },
              { name: 'TypeScript', value: 'ts' },
              { name: 'YAML', value: 'yaml' },
              { name: 'JSON', value: 'json' },
              { name: 'TOML', value: 'toml' }
            ],
            default: options.config || 'js'
          }
        ]);
        options.config=inputConfigFormat;
      }

      const projectPath = path.resolve(process.cwd(), name);
      const realName=path.basename(projectPath)
      // 检查目录是否已存在
      if (fs.existsSync(projectPath)) {
        logger.error(`目录 ${realName} 已存在`);
        process.exit(1);
      }

      logger.info(`正在创建项目 ${realName}...`);
      
      // 创建项目目录结构
      await createProjectStructure(projectPath, realName, options);
      
      logger.success(`项目 ${realName} 创建成功！`);
      logger.log('');
      logger.log('🎉 下一步操作：');
      logger.log(`  cd ${realName}`);
      
      const installCommand = getInstallCommand(options.packageManager!);
      logger.log(`  ${installCommand} # 安装依赖`);
      
      logger.log(`  npm run dev # 开发环境启动`);
      logger.log(`  npm run build # 构建项目`);
      logger.log(`  npm run start # 生产环境前台启动`);
      logger.log(`  npm run daemon # 生产环境后台启动`);
      logger.log(`  npm run stop # 停止机器人`);
      
      logger.log('');
      logger.log('📚 相关文档：');
      logger.log('  https://github.com/zhinjs/zhin - 项目主页');
      logger.log('  https://zhinjs.github.io - 官方文档');
      
    } catch (error) {
      logger.error(`创建项目失败: ${error}`);
      process.exit(1);
    }
  });

function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case 'yarn': return 'yarn install';
    case 'pnpm': return 'pnpm install';
    default: return 'npm install';
  }
}

async function createProjectStructure(projectPath: string, projectName: string, options: InitOptions) {
  // 创建目录结构
  await fs.ensureDir(projectPath);
  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.ensureDir(path.join(projectPath, 'src', 'plugins'));
  await fs.ensureDir(path.join(projectPath, 'dist'));
  await fs.ensureDir(path.join(projectPath, 'data'));
  
  // 创建 package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    description: `${projectName} 机器人`,
    type: 'module',
    main: 'src/index.ts',
    scripts: {
      dev: options.runtime === 'bun' ? 'zhin dev --bun' : 'zhin dev',
      start: options.runtime === 'bun' ? 'zhin start --bun' : 'zhin start',
      daemon: options.runtime === 'bun' ? 'zhin start --bun --daemon' : 'zhin start --daemon',
      build: 'zhin build',
      stop: 'zhin stop'
    },
    dependencies: {
      '@zhin.js/core': 'workspace:*'
    },
    devDependencies: {
      '@zhin.js/cli': 'workspace:*',
      'typescript': '^5.0.0',
      ...(options.runtime === 'node' && { 'tsx': '^4.0.0' })
    },
    engines: {
      node: '>=18.0.0'
    }
  };
  
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  
  // 创建 tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      outDir: './dist',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
      allowSyntheticDefaultImports: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      declaration: false,
      sourceMap: true,
      baseUrl: './src',
      paths: {
        '@zhin.js/core': ['../../packages/core/src/index.ts'],
        '@zhin.js/core/*': ['../../packages/core/src/*']
      }
    },
    include: ['src/**/*'],
    exclude: ['dist', 'node_modules']
  };
  
  await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  
  // 创建配置文件
  await createConfigFile(projectPath, options.config!);
  
  // 创建主入口文件
  const indexContent = `import { createApp } from '@zhin.js/core';

// 启动机器人
async function main() {
    try {
        // 异步创建机器人实例 (自动从配置文件加载)
        const app = await createApp();
        await app.start();
        
        // 优雅退出处理
        const shutdown = async (signal: string) => {
          await app.stop();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (error) {
        console.error('机器人启动失败:', error);
        process.exit(1);
    }
}

// 启动应用
main().catch(console.error);
`;
  
  await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), indexContent);
  
  // 创建示例插件
  const pluginContent = `import {
  onDispose,
  addMiddleware, useContext, sendMessage, beforeSend, onGroupMessage,
} from '@zhin.js/core';
import * as process from "node:process";

onDispose(async ()=>{
  console.log('插件已销毁')
})

addMiddleware(async (message, next)=>{ // 添加中间件到插件
  // 在这里处理消息
  return next()
})

let hasChanged=false
beforeSend((options)=>{
  if(!hasChanged){
    options.content='bar'
    hasChanged=true
  }
  return options
})

onGroupMessage((m)=>{
  if(m.channel.id==='629336764'){
    m.reply('hello')
  }
})

// 依赖process上下文
useContext('process',()=>{
  sendMessage({
    context:'process',
    bot:\`\${process.pid}\`,
    id:process.title,
    type:'private',
    content:'foo'
  })
})
`;
  
  await fs.writeFile(path.join(projectPath, 'src', 'plugins', 'test-plugin.ts'), pluginContent);
  
  // 创建 .gitignore
  const gitignoreContent = `# Dependencies
node_modules/

# Production builds
dist/

# Environment variables
.env
.env.local
.env.development
.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# PID files
.zhin.pid
.zhin-dev.pid

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/
`;
  
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
  
  // 创建 README.md
  const readmeContent = `# ${projectName}

使用 Zhin 框架创建的机器人项目。

## 🚀 快速开始

### 安装依赖

\`\`\`bash
${getInstallCommand(options.packageManager!)}
\`\`\`

### 开发环境

\`\`\`bash
npm run dev
\`\`\`

### 生产环境

\`\`\`bash
# 构建项目
npm run build

# 前台启动
npm run start

# 后台启动
npm run daemon
\`\`\`

### 停止机器人

\`\`\`bash
npm run stop
\`\`\`

## 📁 项目结构

\`\`\`
${projectName}/
├── src/
│   ├── index.ts          # 主入口文件
│   └── plugins/          # 插件目录
│       └── test-plugin.ts # 示例插件
├── dist/                 # 构建输出目录
├── data/                 # 数据目录
├── zhin.config.${options.config}     # 配置文件
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript配置
\`\`\`

## ⚙️ 配置

### 机器人配置

编辑 \`zhin.config.${options.config}\` 来配置你的机器人：

${getConfigExample(options.config!)}

## 🔌 插件开发

在 \`src/plugins/\` 目录下创建你的插件文件。参考 \`test-plugin.ts\` 了解插件开发方式。

### 插件示例

\`\`\`typescript
import { usePlugin, useLogger, addCommand } from '@zhin.js/core';

const plugin = usePlugin();
const logger = useLogger();

// 添加命令
addCommand('hello', (message, args) => {
  logger.info('Hello command called:', args);
});
\`\`\`

## 📚 相关链接

- [Zhin 官方文档](https://zhinjs.github.io)
- [插件开发指南](https://zhinjs.github.io/plugins)
- [GitHub 仓库](https://github.com/zhinjs/zhin)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
`;
  
  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
  
  // 创建 pnpm-workspace.yaml (如果使用 pnpm)
  if (options.packageManager === 'pnpm') {
    const workspaceContent = `packages:
  - '.'
`;
    await fs.writeFile(path.join(projectPath, 'pnpm-workspace.yaml'), workspaceContent);
  }
}

async function createConfigFile(projectPath: string, format: string) {
  const configContent = getConfigContent(format);
  let fileName: string;
  
  switch (format) {
    case 'ts':
      fileName = 'zhin.config.ts';
      break;
    case 'js':
      fileName = 'zhin.config.js';
      break;
    default:
      fileName = `zhin.config.${format}`;
  }
  
  await fs.writeFile(path.join(projectPath, fileName), configContent);
}

function getConfigContent(format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify({
        bots: [
          {
            name: `${process.pid}`,
            context: 'process'
          },
          {
            name: '1689919782',
            context: 'icqq',
            log_level: 'off',
            platform: 4
          }
        ],
        plugin_dirs: [
          './src/plugins',
          'node_modules'
        ],
        plugins: [
          'icqq',
          'process',
          'test-plugin'
        ],
        debug: false
      }, null, 2);
      
    case 'yaml':
      return `# Zhin Bot 配置文件

# 机器人配置
bots:
  - name: \${process.pid}
    context: process
  - name: '1689919782'
    context: icqq
    log_level: off
    platform: 4

# 插件目录
plugin_dirs:
  - ./src/plugins
  - node_modules

# 要加载的插件列表
plugins:
  - icqq
  - process
  - test-plugin

# 调试模式
debug: false
`;
      
    case 'toml':
      return `# Zhin Bot 配置文件

# 机器人配置
[[bots]]
name = "\${process.pid}"
context = "process"

[[bots]]
name = "1689919782"
context = "icqq"
log_level = "off"
platform = 4

# 插件目录
plugin_dirs = ["./src/plugins", "node_modules"]

# 要加载的插件列表
plugins = ["icqq", "process", "test-plugin"]

# 调试模式
debug = false
`;
      
    case 'ts':
      return `import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: \`\${process.pid}\`,
        context: 'process'
      },
      {
        name: '1689919782',
        context: 'icqq',
        log_level: 'off',
        platform: 4
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
`;
      
    case 'js':
      return `import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: \`\${process.pid}\`,
        context: 'process'
      },
      {
        name: '1689919782',
        context: 'icqq',
        log_level: 'off',
        platform: 4
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
`;

    default:
      throw new Error(`不支持的配置格式: ${format}`);
  }
}

function getConfigExample(format: string): string {
  switch (format) {
    case 'json':
      return `\`\`\`json
{
  "bots": [
    {
      "name": "\${process.pid}",
      "context": "process"
    },
    {
      "name": "1689919782",
      "context": "icqq",
      "log_level": "off",
      "platform": 4
    }
  ],
  "plugin_dirs": [
    "./src/plugins",
    "node_modules"
  ],
  "plugins": [
    "icqq",
    "process",
    "test-plugin"
  ],
  "debug": false
}
\`\`\`
`;
    case 'yaml':
      return `\`\`\`yaml
# Zhin Bot 配置文件

# 机器人配置
bots:
  - name: \${process.pid}
    context: process
  - name: '1689919782'
    context: icqq
    log_level: off
    platform: 4

# 插件目录
plugin_dirs:
  - ./src/plugins
  - node_modules

# 要加载的插件列表
plugins:
  - icqq
  - process
  - test-plugin

# 调试模式
debug: false
\`\`\`
`;
    case 'toml':
      return `\`\`\`toml
# Zhin Bot 配置文件

# 机器人配置
[[bots]]
name = "\${process.pid}"
context = "process"

[[bots]]
name = "1689919782"
context = "icqq"
log_level = "off"
platform = 4

# 插件目录
plugin_dirs = ["./src/plugins", "node_modules"]

# 要加载的插件列表
plugins = ["icqq", "process", "test-plugin"]

# 调试模式
debug = false
\`\`\`
`;
    case 'ts':
      return `\`\`\`typescript
import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: \`\${process.pid}\`,
        context: 'process'
      },
      {
        name: '1689919782',
        context: 'icqq',
        log_level: 'off',
        platform: 4
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
\`\`\`
`;
    case 'js':
      return `\`\`\`javascript
import { defineConfig } from '@zhin.js/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: \`\${process.pid}\`,
        context: 'process'
      },
      {
        name: '1689919782',
        context: 'icqq',
        log_level: 'off',
        platform: 4
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
\`\`\`
`;
    default:
      throw new Error(`不支持的配置格式: ${format}`);
  }
} 
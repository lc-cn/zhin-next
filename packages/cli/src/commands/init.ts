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
  .option('-c, --config <format>', '配置文件格式 (json|yaml|toml|ts|js)', 'yaml')
  .option('-p, --package-manager <manager>', '包管理器 (npm|yarn|pnpm)', 'npm')
  .option('-r, --runtime <runtime>', '运行时 (node|bun)', 'node')
  .option('-y, --yes', '自动回答所有问题')
  .action(async (projectName: string, options: InitOptions) => {
    if(options.yes) {
      options.config = 'yaml';
      options.packageManager = 'npm';
      options.runtime = 'node';
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
              { name: 'Node.js', value: 'node' },
              { name: 'Bun', value: 'bun' }
            ],
            default: options.runtime || 'node'
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
              { name: 'npm', value: 'npm' },
              { name: 'yarn', value: 'yarn' },
              { name: 'pnpm', value: 'pnpm' }
            ],
            default: options.packageManager || 'npm'
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
              { name: 'YAML (推荐)', value: 'yaml' },
              { name: 'JSON', value: 'json' },
              { name: 'TOML', value: 'toml' },
              { name: 'TypeScript', value: 'ts' },
              { name: 'JavaScript', value: 'js' }
            ],
            default: options.config || 'yaml'
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
      daemon: options.runtime === 'bun' ? 'zhin start --daemon --bun' : 'zhin start --daemon',
      build: 'zhin build',
      stop: 'zhin stop'
    },
    dependencies: {
      '@zhin/core': 'workspace:*'
    },
    devDependencies: {
      '@zhin/cli': 'workspace:*',
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
        '@zhin/core': ['../../packages/core/src/index.ts'],
        '@zhin/core/*': ['../../packages/core/src/*']
      }
    },
    include: ['src/**/*'],
    exclude: ['dist', 'node_modules']
  };
  
  await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  
  // 创建配置文件
  await createConfigFile(projectPath, options.config!);
  
  // 创建环境变量文件
  await createEnvFile(projectPath);
  
  // 创建主入口文件
  const indexContent = `import { createApp } from '@zhin/core';

// 启动机器人
async function main() {
    try {
        // 异步创建机器人实例 (自动从配置文件加载)
        const bot = await createApp();
        
        // 监听消息事件
        bot.on('message', (message) => {
          bot.logger.info('收到消息:', message);
        });

        // 监听私聊消息
        bot.on('message.private', (message) => {
          bot.logger.info('收到私聊消息:', message.raw_message);
        });

        // 监听群聊消息
        bot.on('message.group', (message) => {
          bot.logger.info(\`群 \${message.group_id} 收到消息:\`, message.raw_message);
        });
        
        await bot.start();
        
        // 优雅退出处理
        const shutdown = async (signal: string) => {
          await bot.stop();
          process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
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
  const pluginContent = `import { usePlugin, useLogger, onDispose } from '@zhin/core';

const plugin = usePlugin();
const logger = useLogger();

// 添加测试命令
plugin.addCommand('test', (message, args) => {
  logger.info('测试命令被调用:', { message, args });
});

// 添加内存监控定时器
const timer = setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info(\`内存使用: RSS \${(memoryUsage.rss/1024/1024).toFixed(2)}MB | 堆总计 \${(memoryUsage.heapTotal/1024/1024).toFixed(2)}MB | 堆已用 \${(memoryUsage.heapUsed/1024/1024).toFixed(2)}MB\`);
}, 30000); // 每30秒输出一次

// 插件销毁时清理资源
onDispose(() => {
  clearInterval(timer);
  logger.info('测试插件已销毁');
});
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
├── zhin.config.${options.config}     # 配置文件
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript配置
\`\`\`

## ⚙️ 配置

### 环境变量

复制 \`.env.example\` 为 \`.env\` 并配置你的环境变量：

\`\`\`bash
cp .env.example .env
\`\`\`

### 机器人配置

编辑 \`zhin.config.${options.config}\` 来配置你的机器人：

${getConfigExample(options.config!)}

## 🔌 插件开发

在 \`src/plugins/\` 目录下创建你的插件文件。参考 \`test-plugin.ts\` 了解插件开发方式。

### 插件示例

\`\`\`typescript
import { usePlugin, useLogger, addCommand } from '@zhin/core';

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

async function createEnvFile(projectPath: string) {
  const envContent = `# OneBot 11 配置
ONEBOT_URL=ws://localhost:8080
ONEBOT_ACCESS_TOKEN=

# 日志配置
LOG_LEVEL=info
DEBUG=false

# 环境配置
NODE_ENV=development
`;
  
  // 创建 .env.example 文件供参考
  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);
  
  // 也创建一个空的 .env 文件（会被 .gitignore 忽略）
  await fs.writeFile(path.join(projectPath, '.env'), envContent);
}

function getConfigContent(format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify({
        bots: [
          {
            name: 'onebot11',
            adapter: 'onebot11',
            url: '${ONEBOT_URL:-ws://localhost:8080}',
            access_token: '${ONEBOT_ACCESS_TOKEN:-}'
          }
        ],
        plugin_dirs: [
          '${PLUGIN_DIR:-./src/plugins}',
          'node_modules'
        ],
        plugins: [
          'onebot11',
          'test-plugin'
        ],
        disable_dependencies: [],
        debug: '${DEBUG:-false}'
      }, null, 2);
      
    case 'yaml':
      return `# Zhin Bot 配置文件
# 支持环境变量替换，格式: \${VAR_NAME:-default_value}

# 机器人配置
bots:
  - name: onebot11
    adapter: onebot11
    url: \${ONEBOT_URL:-ws://localhost:8080}
    access_token: \${ONEBOT_ACCESS_TOKEN:-}

# 插件目录
plugin_dirs:
  - \${PLUGIN_DIR:-./src/plugins}
  - node_modules

# 要加载的插件列表
plugins:
  - onebot11
  - test-plugin

# 禁用的依赖列表
disable_dependencies: []

# 调试模式
debug: \${DEBUG:-false}
`;
      
    case 'toml':
      return `# Zhin Bot 配置文件
# 支持环境变量替换，格式: \${VAR_NAME:-default_value}

# 机器人配置
[[bots]]
name = "onebot11"
adapter = "onebot11"
url = "\${ONEBOT_URL:-ws://localhost:8080}"
access_token = "\${ONEBOT_ACCESS_TOKEN:-}"

# 插件目录
plugin_dirs = ["\${PLUGIN_DIR:-./src/plugins}", "node_modules"]

# 要加载的插件列表
plugins = ["onebot11", "test-plugin"]

# 禁用的依赖列表
disable_dependencies = []

# 调试模式
debug = "\${DEBUG:-false}"
`;
      
    case 'ts':
      return `import { defineConfig } from '@zhin/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: 'onebot11',
        adapter: 'onebot11',
        url: env.ONEBOT_URL || 'ws://localhost:8080',
        access_token: env.ONEBOT_ACCESS_TOKEN || ''
      }
    ],
    // 插件目录
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules'
    ],
    // 要加载的插件列表
    plugins: [
      'onebot11',
      'test-plugin'
    ],

    // 禁用的依赖列表
    disable_dependencies: [],

    // 调试模式
    debug: env.DEBUG === 'true'
  }
})

`;
      
    case 'js':
      return `import { defineConfig } from '@zhin/core';

export default defineConfig(async (env)=>{
  return {
    // 机器人配置
    bots: [
      {
        name: 'onebot11',
        adapter: 'onebot11',
        url: env.ONEBOT_URL || 'ws://localhost:8080',
        access_token: env.ONEBOT_ACCESS_TOKEN || ''
      }
    ],
    // 插件目录
    plugin_dirs: [
      env.PLUGIN_DIR || './src/plugins',
      'node_modules'
    ],
    // 要加载的插件列表
    plugins: [
      'onebot11',
      'test-plugin'
    ],

    // 禁用的依赖列表
    disable_dependencies: [],

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
      "name": "onebot11",
      "adapter": "onebot11",
      "url": "\${ONEBOT_URL:-ws://localhost:8080}",
      "access_token": "\${ONEBOT_ACCESS_TOKEN:-}"
    }
  ],
  "plugin_dirs": [
    "\${PLUGIN_DIR:-./src/plugins}",
    "node_modules"
  ],
  "plugins": [
    "onebot11",
    "test-plugin"
  ],
  "disable_dependencies": [],
  "debug": "\${DEBUG:-false}"
}
\`\`\`
`;
    case 'yaml':
      return `\`\`\`yaml
# Zhin Bot 配置文件
# 支持环境变量替换，格式: \${VAR_NAME:-default_value}

# 机器人配置
bots:
  - name: onebot11
    adapter: onebot11
    url: \${ONEBOT_URL:-ws://localhost:8080}
    access_token: \${ONEBOT_ACCESS_TOKEN:-}

# 插件目录
plugin_dirs:
  - \${PLUGIN_DIR:-./src/plugins}
  - node_modules

# 要加载的插件列表
plugins:
  - onebot11
  - test-plugin

# 禁用的依赖列表
disable_dependencies: []

# 调试模式
debug: \${DEBUG:-false}
\`\`\`
`;
    case 'toml':
      return `\`\`\`toml
# Zhin Bot 配置文件
# 支持环境变量替换，格式: \${VAR_NAME:-default_value}

# 机器人配置
[[bots]]
name = "onebot11"
adapter = "onebot11"
url = "\${ONEBOT_URL:-ws://localhost:8080}"
access_token = "\${ONEBOT_ACCESS_TOKEN:-}"

# 插件目录
plugin_dirs = ["\${PLUGIN_DIR:-./src/plugins}", "node_modules"]

# 要加载的插件列表
plugins = ["onebot11", "test-plugin"]

# 禁用的依赖列表
disable_dependencies = []

# 调试模式
debug = "\${DEBUG:-false}"
\`\`\`
`;
    case 'ts':
      return `\`\`\`typescript
import type { AppConfig } from '@zhin/core';

/**
 * Zhin Bot 配置文件
 * 支持环境变量替换，格式: \${VAR_NAME:-default_value}
 */
const config: AppConfig = {
  // 机器人配置
  bots: [
    {
      name: 'onebot11',
      adapter: 'onebot11',
      url: process.env.ONEBOT_URL || 'ws://localhost:8080',
      access_token: process.env.ONEBOT_ACCESS_TOKEN || ''
    }
  ],

  // 插件目录
  plugin_dirs: [
    process.env.PLUGIN_DIR || './src/plugins',
    'node_modules'
  ],

  // 要加载的插件列表
  plugins: [
    'onebot11',
    'test-plugin'
  ],

  // 禁用的依赖列表
  disable_dependencies: [],

  // 调试模式
  debug: process.env.DEBUG === 'true'
};

export default config;
\`\`\`
`;
    case 'js':
      return `\`\`\`javascript
/**
 * Zhin Bot 配置文件
 * 支持环境变量替换，格式: \${VAR_NAME:-default_value}
 */
const config = {
  // 机器人配置
  bots: [
    {
      name: 'onebot11',
      adapter: 'onebot11',
      url: process.env.ONEBOT_URL || 'ws://localhost:8080',
      access_token: process.env.ONEBOT_ACCESS_TOKEN || ''
    }
  ],

  // 插件目录
  plugin_dirs: [
    process.env.PLUGIN_DIR || './src/plugins',
    'node_modules'
  ],

  // 要加载的插件列表
  plugins: [
    'onebot11',
    'test-plugin'
  ],

  // 禁用的依赖列表
  disable_dependencies: [],

  // 调试模式
  debug: process.env.DEBUG === 'true'
};

export default config;
\`\`\`
`;
    default:
      throw new Error(`不支持的配置格式: ${format}`);
  }
} 
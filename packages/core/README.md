# Zhin Bot Framework - HMR Edition

> 🔥 A modern TypeScript bot framework with Hot Module Replacement and React-style Hooks

## ✨ Features

- **🔥 Hot Module Replacement** - Real-time plugin reloading without restart
- **🎣 React-style Hooks** - Intuitive plugin development with modern patterns
- **🧩 Context System** - Powerful dependency injection and resource management
- **🔌 Multi-Protocol** - Pluggable adapter system for various chat platforms
- **⏱️ Cron Jobs** - Built-in task scheduling
- **🚦 Middleware Chain** - Flexible message processing pipeline
- **📊 Performance Monitoring** - Built-in metrics and hot reload statistics
- **💯 TypeScript First** - Full type safety and excellent DX

## 🏗️ Architecture

```
packages/core/src/
├── hmr/                    # Hot Module Replacement System
│   ├── types.ts           # Type definitions
│   ├── utils.ts           # Utilities and constants
│   ├── dependency.ts      # Dependency base class
│   ├── hmr-base.ts        # HMR core implementation
│   └── index.ts           # Unified exports
├── plugins/               # HMR Plugins
│   ├── onebot11-hmr.ts    # OneBot11 adapter with HMR
│   └── example-hmr.ts     # Feature-rich example plugin
├── bot-hmr.ts             # Main Bot class with HMR support
├── adapter.ts             # Abstract adapter base class
├── config.ts              # Configuration management
├── types.ts               # Core type definitions
└── index.ts               # Main exports
```

## 🚀 Quick Start

### Basic Bot Setup

```typescript
import { Bot } from '@zhin/core';

const bot = new Bot({
    plugin_dirs: ['./plugins'],
    plugins: ['example-hmr'],
    adapters: {
        onebot11: {
            protocol: 'onebot11',
            url: 'ws://localhost:8080'
        }
    },
    debug: true
});

await bot.start('dev'); // Enable hot reloading
```

### Plugin Development with Hooks

```typescript
import { 
    createContext, 
    onMounted, 
    addCommand, 
    onGroupMessage, 
    useLogger 
} from '@zhin/core';

// Create shared context
createContext({
    name: 'database',
    async mounted() {
        const db = new Database();
        await db.connect();
        return db;
    },
    dispose(db) {
        db.disconnect();
    }
});

// Lifecycle hooks
onMounted(async (plugin) => {
    const logger = useLogger();
    const db = plugin.useContext('database').value;
    logger.info('Plugin loaded with database:', db);
});

// Command handlers
addCommand('hello', async (message, args) => {
    await sendMessage(message.channel?.id, `Hello ${args[0] || 'World'}!`);
});

// Event listeners
onGroupMessage(async (message) => {
    if (message.content.includes('bot')) {
        await sendMessage(message.channel.id, 'You called me?');
    }
});

// Cron jobs
addCronJob({
    name: 'cleanup',
    schedule: '*/60', // Every minute
    handler() {
        console.log('Running cleanup...');
    }
});
```

## 🎣 Available Hooks

| Hook | Description |
|------|-------------|
| `createContext<T>()` | Create shared context with lifecycle |
| `useContext<T>()` | Access context value |
| `onMounted()` | Plugin initialization hook |
| `onDispose()` | Plugin cleanup hook |
| `addCommand()` | Register command handler |
| `addMiddleware()` | Add message middleware |
| `onGroupMessage()` | Listen to group messages |
| `onPrivateMessage()` | Listen to private messages |
| `addCronJob()` | Schedule recurring tasks |
| `registerAdapter()` | Register protocol adapter |
| `useLogger()` | Get plugin logger |
| `sendMessage()` | Send message helper |

## 🔥 Hot Reloading

The HMR system automatically watches for file changes and reloads plugins without restarting the bot:

1. **File Watching** - Monitors plugin directories for changes
2. **Smart Reloading** - Only reloads affected plugins
3. **State Preservation** - Maintains context and connection state
4. **Error Recovery** - Graceful handling of reload failures
5. **Performance Metrics** - Tracks reload times and statistics

### Hot Reload Demo

```bash
# Start bot with HMR
node demo-hmr-bot.js

# In another terminal, edit a plugin file
echo "console.log('Hot reload test!');" >> packages/core/src/plugins/example-hmr.ts

# Watch the console for reload messages
# Test the updated functionality immediately
```

## 📊 Performance Monitoring

```typescript
// Get HMR statistics
const stats = bot.getPerformanceStats();
console.log(`
Total reloads: ${stats.totalReloads}
Average reload time: ${stats.averageReloadTime}ms
File changes detected: ${stats.fileChanges}
Errors: ${stats.errors}
`);
```

## 🔌 Adapter Development

```typescript
import { registerAdapter, createContext } from '@zhin/core';

// Register new protocol adapter
registerAdapter('my-protocol', (config) => {
    return new MyProtocolAdapter(config);
});

// With connection pooling
createContext({
    name: 'connection-pool',
    mounted() {
        return new ConnectionPool();
    },
    dispose(pool) {
        pool.closeAll();
    }
});
```

## 🧪 Testing

The framework supports live testing during development:

```bash
# Start development mode
npm run dev

# Edit plugins and see changes instantly
# Use /ping, /stats commands to test functionality
# Monitor performance with built-in metrics
```

## 📈 Migration from Legacy

The new HMR system is a complete rewrite. Key differences:

- **Hooks-based API** instead of class-based plugins
- **Built-in hot reloading** instead of manual restarts
- **Context system** instead of global state
- **Performance monitoring** built-in
- **Type-safe** plugin development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test with hot reloading enabled
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Happy coding with hot reloading! 🔥** 
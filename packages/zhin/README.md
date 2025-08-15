# zhin.js

Zhin Bot Framework的主包，重导出`@zhin.js/core`的所有功能。

## 安装

```bash
pnpm add zhin.js
```

## 使用

```typescript
import { createApp } from 'zhin.js'

const app = await createApp()
await app.start()
```

这个包是为了方便用户使用而设计的，它只是简单地重导出了`@zhin.js/core`包中的所有功能。建议直接使用这个包，而不是直接使用`@zhin.js/core`。

## 许可证

MIT License
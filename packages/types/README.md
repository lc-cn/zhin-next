# @zhin.js/types

Zhin框架的核心类型定义包。

## 类型定义

### GlobalContext

全局上下文接口，用于扩展全局可用的上下文类型：
```typescript
export interface GlobalContext extends Record<string, any> {
}
```

### MaybePromise

表示一个值可能是Promise或其解析值：
```typescript
export type MaybePromise<T> = T extends Promise<infer U> ? T|U : T|Promise<T>;
```

### 上下文相关类型

#### ArrayItem
从数组类型中提取元素类型：
```typescript
export type ArrayItem<T> = T extends Array<infer R> ? R : unknown
```

#### SideEffect
副作用函数类型，用于处理上下文依赖：
```typescript
export type SideEffect<A extends (keyof GlobalContext)[]> = 
  (...args: Contexts<A>) => MaybePromise<void|DisposeFn<Contexts<A>>>
```

#### DisposeFn
清理函数类型：
```typescript
export type DisposeFn<A> = (context: ArrayItem<A>) => MaybePromise<void>
```

#### Contexts
从上下文键数组构建上下文类型数组：
```typescript
export type Contexts<CS extends (keyof GlobalContext)[]> = 
  CS extends [infer L, ...infer R] 
    ? R extends (keyof GlobalContext)[] 
      ? [ContextItem<L>, ...Contexts<R>] 
      : never[] 
    : never[]
```

## 使用示例

```typescript
import { GlobalContext, MaybePromise, SideEffect } from '@zhin.js/types'

// 扩展全局上下文
interface MyContext extends GlobalContext {
  database: Database
  config: Config
}

// 使用MaybePromise
function maybeAsync(): MaybePromise<string> {
  return Math.random() > 0.5 
    ? Promise.resolve('async') 
    : 'sync'
}

// 使用SideEffect
const effect: SideEffect<['database', 'config']> = 
  async (database, config) => {
    await database.connect(config)
    return async () => {
      await database.disconnect()
    }
  }
```

## 许可证

MIT License
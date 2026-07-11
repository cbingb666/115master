# @115master/utils

## 目录结构

按功能域拆分子目录，每个子目录一个 `index.ts` 入口：

```sh
src/
├── array/      # 数组/集合工具（unique / groupBy / chunk ...）
├── object/     # 对象/字典工具
├── string/     # 字符串工具（slugify / truncate ...）
├── number/     # 数字/数学工具
├── function/   # 函数式工具（debounce / memoize / pipe ...）
├── promise/    # 异步工具（withTimeout / retry ...）
├── type/       # 类型守卫与辅助（isString / assertNever ...）
├── url/        # URL/查询参数工具
├── result/     # Result<T,E> 错误处理（替代 try/catch 的可链式类型）
└── index.ts    # 根入口
```

## Result 模块

替代 try/catch 的显式错误处理：

```ts
import { result } from '@115master/utils'

const r = await result.tryAsync(() => fetch('/api'))
if (r.ok) r.value    // T
else r.error         // Error

// 链式
const text = await result.tryAsync(() => fetch('/api'))
  .then(r => r.map(res => res.json()))
```

## 模块导出

子目录入口直接导出：

src/array/index.ts

```ts
export function unique<T>(list: T[]): T[]
```

根入口按命名空间聚合，禁止平铺导出

示例：
src/index.ts

```ts
export * as array from './array/index.ts'
export * as object from './object/index.ts'
export * as string from './string/index.ts'
```

调用方式：

```ts
import { string } from '@115master/utils'

string.slugify('Hello World')
array.unique([1, 2, 2, 3])
```

# @115master/utils

## 目录结构

按功能域拆分子目录，每个子目录一个 `index.ts` 入口：

```sh
src/
├── array/      # 数组/集合工具
├── object/     # 对象/字典工具
├── string/     # 字符串工具
├── number/     # 数字/数学工具
├── function/   # 函数式工具
├── promise/    # 异步工具
├── type/       # 类型守卫与辅助
├── url/        # URL/查询参数工具
├── result/     # Result/Either 错误处理
└── index.ts    # 根入口
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

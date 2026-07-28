# Story program 的 React JSX 污染

仅当 stories type-check 出现 JSX、`className`、`ReactNode` 或 CSS 模块相关错误时读取本文件。

## 按签名定位

| 报错签名 | 控制点 |
| --- | --- |
| `className` / `ReactNode` / `cannot be used as a JSX component` | `tsconfig.stories.json` 的 `paths["react"]` 指向 `.storybook/react-stub.d.ts` |
| `TS7026: no interface 'JSX.IntrinsicElements'` / `TS2307: Cannot find module '*.css'` | `tsconfig.stories.json` 的 `include` 包含 `src/**/*.d.ts` |
| Storybook 类型提示缺少 React 导出 | 在 `react-stub.d.ts` 增加同名的 `any` 类型占位 |

先恢复对应控制点，再运行：

```bash
pnpm -F @115master/monkey type-check
```

完成标准：stories program 通过 type-check，组件源码保持 Vue 的 props、attrs 和 JSX 契约。

## 机制

stories 从 `@storybook/vue3-vite` 导入类型后，Storybook 的声明链会导入 `react`。真实 `@types/react` 随之声明全局 `namespace JSX`，使同一 TypeScript program 中含 JSX 的 Vue TSX 组件按 React 规则检查。story import 的组件属于同一 program，因此错误通常落在组件文件，而不是 story 文件。

`paths["react"]` 把这条类型解析重定向到全 `any` 的 `.storybook/react-stub.d.ts`。Storybook 类型中的 React 引用由 stub 满足；`Meta<typeof X>` 仍负责 story 的组件类型安全；Vite 运行时不读取该 paths 映射。

stories program 还需要 `src/**/*.d.ts`：

- `vue/jsx` 提供 Vue 的全局 JSX。
- `vite/client` 提供 `*.css` 模块声明。

`types`、`typeRoots` 的控制范围是 `@types` 自动包含，`skipLibCheck` 的控制范围是声明文件内部检查；显式 import 链的控制边界因此位于 `react` 的模块解析。

只有含 JSX 语法的 TSX 组件会受污染；使用 `h()` 的组件不经过 JSX 检查。

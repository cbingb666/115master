# react 污染机制深挖

## 机制

1. stories `import type { Meta } from '@storybook/vue3-vite'`。
2. 类型链经 `storybook/dist/csf|types|router|theming/index.d.ts` 多处 `import 'react'`（实测 10.5.2；`vue-tsc -p tsconfig.stories.json --noEmit --explainFiles` 可复现引入路径）。
3. `@types/react` 进 stories program，其 `global.d.ts` 声明全局 `namespace JSX`。
4. 全局 JSX namespace 单一生效，React 版覆盖后，同 program 内含 JSX 的 TSX 文件按 React 规则检查。

program 以 import 链为单位拉文件：stories import 的组件文件同样进 program——所以报错落在组件文件上，不在 stories 文件本身。

## 为什么常见 workaround 无效

- `types` / `typeRoots` 限制：只挡 `node_modules/@types` 自动包含，挡不住 import 链。
- 卸 `@storybook/test` 等 addon：Storybook 10 核心包 `storybook` 自带 `import 'react'`，无可卸。
- `skipLibCheck`：跳过 .d.ts 内部检查，全局 JSX 声明合并照样发生。

## stub 方案

`paths: { "react": ["./.storybook/react-stub.d.ts"] }` 把 `react` 的类型解析重定向到全 any 占位：

- storybook 类型里的 react 引用变 any；stories 类型安全不受影响（由 `Meta<typeof X>` 的组件泛型承载）。
- 纯类型层：vite 不读这条 paths（`viteFinal` 只配 `@` alias），运行时照常使用真 react。
- stub 的泛型占位（`Ref<T>` 等）保留参数签名使 `Ref<Props>` 引用合法；storybook 升级若报缺失导出名，按名补 stub。

## include 的环境声明

stories program 默认只 include `*.stories.*`，会丢 `src/vite-env.d.ts` 的两样东西：`vue/jsx`（全局 JSX，缺则 TS7026）与 `vite/client`（`*.css` 模块声明，缺则 TS2307）。include 加 `src/**/*.d.ts` 与 app program 对齐。

## 上游与参考

- [storybook#12505](https://github.com/storybookjs/storybook/issues/12505)、[storybook#23819](https://github.com/storybookjs/storybook/issues/23819)——同一根源，10.x 仍存在。
- [官方 TS 写法](https://storybook.js.org/docs/writing-stories/typescript)、[vue3-vite framework](https://storybook.js.org/docs/get-started/frameworks/vue3-vite)

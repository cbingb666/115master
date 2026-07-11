# @115master/tsconfig

## 概述

monorepo 共享 TypeScript 配置，通过 `extends` 引用。

## 文件

| 文件           | 用途                                                      |
| -------------- | --------------------------------------------------------- |
| `base.json`    | 基础配置（ES2020 + bundler 解析 + strict）                |
| `node.json`    | 继承 base，面向 Node.js 环境（ES2022 + composite）        |
| `vue-app.json` | 继承 base，面向 Vue 应用（JSX + DOM lib + 路径别名 `@/`） |

## base.json 关键项

- `target: ES2020`，`module: ESNext`，`moduleResolution: bundler`
- `strict: true` + `noUnusedLocals` + `noUnusedParameters`
- `noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`
- `isolatedModules: false`、`skipLibCheck: true`

## 使用

```jsonc
// Node 包
{ "extends": "@115master/tsconfig/node.json" }

// Vue 应用
{ "extends": "@115master/tsconfig/vue-app.json" }
```

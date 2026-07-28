# AGENTS.md

## Quick Start

```bash
pnpm install              # Node >= 20.12, pnpm 9.x
pnpm dev                  # turbo 并行启动所有 packages 的 dev
pnpm dev:plus             # VITE_PLUS_VERSION=true — monkey plus 版
pnpm build                # turbo 并行 build
pnpm build:plus           # plus 版 build
pnpm type-check           # vue-tsc / tsc --noEmit (全包)
pnpm test                 # vitest run (全包)
pnpm lint                 # eslint
pnpm lint:fix             # eslint --fix
pnpm lint:inspector       # @eslint/config-inspector (调试规则冲突)
pnpm analyze              # bundle 分析 (rollup-plugin-visualizer)
pnpm storybook            # 并行启动 UI Foundation (6006) 与 Monkey 集成 Storybook (6007)
pnpm storybook:ui         # 仅启动 UI Foundation Storybook
pnpm storybook:monkey     # 仅启动 Monkey 集成 Storybook
pnpm build-storybook      # 构建两套静态 Storybook
pnpm changeset            # 新建 changeset (仅用户执行)
pnpm clean:cache          # 清理 Turbo / Vite / Rollup / TypeScript 构建缓存
pnpm clean                # 清理所有 dist、构建缓存及根目录 node_modules
```

> **Plus 版**：`dev:plus` / `build:plus` 设置 `VITE_PLUS_VERSION=true`，用于 monkey 的实验性 plus 分支（功能差异由 `@apps/monkey` 内 `import.meta.env.VITE_PLUS_VERSION` 决定）。
>
> **Pre-commit hook**：`simple-git-hooks` 在每次 `git commit` 前自动跑 `pnpm type-check && pnpm lint-staged`。lint-staged 仅对暂存文件跑 `eslint --fix`。

## Monorepo 拓扑

```sh
apps/
└── monkey                # Vue 3 + Vite + vite-plugin-monkey

packages/
├── shared                # 基础设施（被 drive115 / subtitle-source / monkey 消费）
├── drive115              # 115 API 门面（依赖 shared, utils）
├── subtitle-source       # 字幕来源（依赖 shared, utils）
├── ui                    # 应用无关 UI Foundation
├── utils                 # 通用工具函数
├── tsconfig              # 共享 tsconfig
└── eslint-config         # 共享 eslint 配置

依赖方向（仅向下游）：
monkey → ui, drive115, subtitle-source, shared, utils
drive115 / subtitle-source → shared, utils
```

## Code Style Guide

**编码时必须查看**
@.agents/STYLE_GUIDE.md

## Git

- 默认保持线性历史：合并走 fast-forward / rebase，不产生 merge commit，除非用户明确要求。

## Icons

- 任何 `apps/monkey` 图标工作都调用 `icons` skill。

## Packages

### @packages/shared

简介：跨应用共享基础设施层——错误类型（InfraError）、缓存系统（CacheCore、MetaStore、QuotaManager）、日志（Logger）、HTTP请求抽象（IRequest、FetchRequest）。
指令：@packages/shared/AGENTS.md

### @packages/ui

简介：应用无关 UI Foundation，拥有公共 Theme、Design Token、Glass、核心组件、Dialog 服务与基础 Storybook。
上下文：@packages/ui/CONTEXT.md

### @packages/drive115

简介：115网盘API客户端，封装所有115 API调用（文件、视频、离线、用户、图片等）及加密逻辑，通过Drive115门面类统一暴露。
指令：@packages/drive115/AGENTS.md

### @packages/utils

简介：提供跨应用共享的通用工具函数（数组、字符串、数字、Promise、格式化、时间、文件等）。
指令：@packages/utils/AGENTS.md

### @packages/subtitle-source

简介：字幕来源客户端，对接各字幕网站（thunder射手网、subtitlecat等），提供统一字幕搜索与下载接口。
指令：@packages/subtitle-source/AGENTS.md

### @packages/tsconfig

简介：共享TypeScript配置（base.json、node.json、vue-app.json），各包通过extends引用。
指令：@packages/tsconfig/AGENTS.md

### @packages/eslint-config

简介：共享ESLint配置，基于@antfu/eslint-config，集成tailwindcss与格式化插件。
指令：@packages/eslint-config/AGENTS.md

---

## Apps

### @apps/monkey

简介：115网盘用户脚本（Tampermonkey），基于 Vue 3 + Vite + vite-plugin-monkey 构建。

技术栈：Vue 3.5 + Vite 6 + Tailwind CSS v4 + daisyUI v5 + Pinia 3 + vue-router 4；视频播放 `@libmedia/avplayer` + `hls.js` + `m3u8-parser`；图标 `@iconify/vue`（见 Icons 章节）。
指令：@apps/monkey/AGENTS.md

## Agent skills

### Issue tracker

Issues 以 markdown 文件形式存放在 `.scratch/<feature>/` 下。详见 `docs/agents/issue-tracker.md`。

### Triage labels

默认五标签（needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix），以 `Status:` 行记录在 issue 文件中。详见 `docs/agents/triage-labels.md`。

### Domain docs

Multi-context —— 根目录 `CONTEXT-MAP.md` 指向各 package/app 的 `CONTEXT.md`。详见 `docs/agents/domain.md`。

### UI/UX

通用 UI/UX 设计、修改或审查调用 `ui-ux` skill。新增或重构 Button、Pill、Popup、播放器控制组、媒体浮层、侧栏或 Sheet 的 Glass 材质时，调用其子 skill `glass-ui`。

# 验证平台架构图解

三幅图看懂验证平台：整体架构、E2E 运行时、并行 agent 工作流。操作手册见 [verification.md](./verification.md)。

## 平台架构总览

```mermaid
flowchart LR
  subgraph SRC[源码]
    M[apps/monkey]
    P[packages/*]
  end

  subgraph BUILD[串行构建 · 不可并行]
    US["userscript<br/>apps/monkey/dist/115master.user.js"]
    SB["storybook-static × 2<br/>packages/ui + apps/monkey<br/>显式测试索引校验"]
  end

  subgraph PILLARS[验证支柱]
    T1["① 单元 + Storybook 浏览器测试<br/>vitest projects + inertness"]
    T2["② 业务 E2E harness<br/>纯路由拦截 · 零端口 · 离线"]
  end

  GATE["pnpm verify 总闸门<br/>type-check && test && test:e2e && build-storybook"]

  M -- "pnpm build" --> US
  M & P -- "pnpm build-storybook" --> SB
  M & P -- "pnpm test" --> T1
  US -- "注入页面" --> T2
  T1 & T2 & SB --> GATE
```

## E2E 运行时

单个 spec 的执行时序（`apps/monkey/e2e/`）。全部网络走 `page.route` 拦截，未 mock 的请求一律 abort（网络沙箱），因此零端口、零服务器、完全离线。

```mermaid
sequenceDiagram
  autonumber
  participant Spec as spec（Playwright）
  participant Sup as e2e/support/*
  participant Page as Chromium page
  participant Net as 路由拦截 page.route('**/*')

  Spec->>Sup: setupHarness(page, { gmValues, mocks })
  Sup->>Page: addInitScript：GM_* 桩 + CDN 全局<br/>（vue / hls.js / lodash… 取自 node_modules，对齐 @require）
  Sup->>Net: 注册 mock handler（defaults + spec 的 override 插队首）
  Spec->>Page: goto HOME_URL / MASTER_URL
  Net-->>Page: fulfill fixture HTML（homeHtml 官方 DOM / masterHtml 空壳）
  Sup->>Page: 注入 dist/115master.user.js
  Page->>Page: main.ts 按 URL 分发<br/>HOME Mod 增强 / MASTER SPA 挂载 #my-app
  loop 页面运行时
    Page->>Net: API 请求（webapi / proapi / my.115.com…）
    Net-->>Page: mock JSON（fixtures/*）<br/>未命中 → abort
  end
  Page->>Page: 渲染增强 DOM / SPA 视图
  Spec->>Page: 断言 DOM / 请求记录 / GM 存储 / 无 pageerror
```

## 并行 agent 工作流

```mermaid
flowchart TD
  PRE["串行准备 · 任一 agent 先做一次<br/>pnpm --filter @115master/monkey build<br/>pnpm build-storybook"]

  PRE --> GO{"并行执行 · 无共享可写状态"}

  subgraph E2E["业务 E2E · 零端口天然并行"]
    EA["Agent A：test:e2e:run --shard=1/3"]
    EB["Agent B：test:e2e:run --shard=2/3"]
    EC["Agent C：test:e2e:run --shard=3/3"]
  end

  UNIT["Agent D：单测 / Storybook 按包分工<br/>pnpm --filter &lt;pkg&gt; test"]

  GO --> E2E
  GO --> UNIT

  E2E & UNIT --> OUT["输出各自隔离<br/>test-results 等已 gitignore"]

  subgraph LOCK["独占操作 · 任何时刻只允许一个 agent"]
    L1["pnpm add / pnpm install（锁文件）"]
    L2["userscript / Storybook 构建"]
  end
```

要点：

- E2E 纯路由拦截，无端口无服务器，分片/分工直接并行；按目录分工用 `test:e2e:run specs/<子目录>`（位置参数前不能加 `--`）。
- 单测与 Storybook 浏览器测试按包分工，避免重复执行相同矩阵。
- 构建产物（userscript dist、storybook-static）是所有 agent 的共享输入，构建本身串行做完一次即可。

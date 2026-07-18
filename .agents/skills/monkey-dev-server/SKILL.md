---
name: monkey-dev-server
description: 启动并等待 monkey 的 vite dev server
allowed-tools: Bash(pnpm:*) Bash(curl:*) Bash(sleep:*)
---

# monkey dev server

monkey 脚本由 vite dev server 提供，页面调试前必须先让它就绪。

**端口不是固定的**：由 git 分支名哈希派生（`apps/monkey/plugins/dev.ts` 的 `derivePort`，范围 5180–5379），可用 `BRANCH_PORT` 环境变量覆盖。不要硬编码端口。

## 步骤

1. 探活（端口以 dev 日志或控制台报错中的为准）：

```bash
curl -sf -o /dev/null -k https://127.0.0.1:<port>/__vite-plugin-monkey.entry.js
```

通过（exit 0）→ 直接跳到第 4 步。

2. 后台启动并确认端口：

```bash
pnpm dev
```

从输出的 banner 读取实际端口：

```
[monkey-dev] branch : v2
[monkey-dev] port   : 5293
[monkey-dev] install: https://127.0.0.1:5293/115master.user.js
```

3. 轮询等待就绪，URL 同第 1 步，端口用 banner 值。

4. 若浏览器页面已在 dev server 启动前加载，reload 页面以注入脚本。完成判定：控制台不再出现 `ERR_CONNECTION_REFUSED @ https://127.0.0.1:<port>/`。

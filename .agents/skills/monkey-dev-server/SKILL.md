---
name: monkey-dev-server
description: 启动并等待 monkey 的 vite dev server
allowed-tools: Bash(pnpm:*) Bash(curl:*) Bash(node:*)
---

# monkey dev server

monkey 脚本由 vite dev server 提供，页面调试前必须先让它就绪。端口由分支名派生，**不要扫描端口**。

## 步骤

1. **自算端口并探活**：按 [derive-port.md](derive-port.md) 算出 `$port`，curl 探活。

2. 探活通过 → 完成，记录 `$port` 供调用方使用。失败 → 后台 `pnpm dev`，从其 banner（`[monkey-dev] port : N`）确认端口，轮询该端口至就绪。

3. 若浏览器页面在 dev server 启动前已加载，reload 页面注入脚本。完成判定：控制台不再出现 `ERR_CONNECTION_REFUSED @ https://127.0.0.1:<port>/`。

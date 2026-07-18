# 端口派生（直接调用源码）

端口由 `apps/monkey/plugins/dev.ts` 的 `derivePort(detectBranch())` 决定，**不要复制算法**。用 Node 22 的 `--experimental-strip-types` 直接 import 该文件：

```bash
cd apps/monkey
port=${BRANCH_PORT:-$(node --experimental-strip-types -e "
import('./plugins/dev.ts').then(m => console.log(m.derivePort(m.detectBranch() || 'default')))
" 2>/dev/null)}
curl -sf -o /dev/null -k "https://127.0.0.1:$port"
```

`BRANCH_PORT` 环境变量设置时优先，跳过派生。

探活通过（exit 0）→ 就绪，直接用 `$port`。失败 → 启动 `pnpm dev`，从其 banner 确认端口（以 banner 为准）。

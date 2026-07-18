---
name: playwright-115
description: 用 Playwright 调试 115/115Master 页面
allowed-tools: Skill(playwright-cli) Skill(monkey-dev-server) Bash(cat:*) Bash(playwright-cli:*)
---

# Playwright 调试 115 页面

本 skill 只管 115 专属的连接与环境；点击、填表、截图等操作命令一律调用 `playwright-cli` skill。

## 步骤

1. **连接浏览器**：检查 `.env.playwright.local` 存在且含 `PLAYWRIGHT_MCP_EXTENSION_TOKEN`；缺失则提示用户按下方格式创建。导出后 attach：

```bash
export PLAYWRIGHT_MCP_EXTENSION_TOKEN=$(cat .env.playwright.local | grep PLAYWRIGHT_MCP_EXTENSION_TOKEN | cut -d'=' -f2)
playwright-cli attach --extension=chrome
```

```bash
# .env.playwright.local 缺失时的模板
PLAYWRIGHT_MCP_EXTENSION_TOKEN=your_token_here
```

完成判定：会话 `chrome` 创建成功，后续命令带 `--s=chrome`。

2. **dev server 就绪**：调用 `monkey-dev-server` skill（动态端口、就绪轮询、页面 reload 由其负责）。完成判定：控制台无 `ERR_CONNECTION_REFUSED`。

3. **导航到目标页面**：

- 登录入口：`https://115.com/`（登录后跳转 `https://115.com/?cid=0&offset=0&mode=wangpan`）
- 115Master 主页：`https://115.com/web/lixian/master/#/drive`

## 115Master 交互要点

- **进入文件夹用 `dblclick`**：单击只是选中（勾选 checkbox）。
- **以 Page URL 变化判定导航成功**（如 `#/drive` → `#/drive/<cid>`），snapshot 不反映路由变化。

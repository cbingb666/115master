---
name: playwright-115
description: 用 Playwright 调试 115/115Master 页面
allowed-tools: Skill(playwright-cli) Skill(monkey-dev-server) Bash(playwright-cli:*) Bash(grep:*)
---

# Playwright 调试 115 页面

本 skill 只管 115 专属的连接与环境；点击、填表、截图等操作命令一律调用 `playwright-cli` skill。

## 步骤

1. **连接浏览器**：会话已存在则跳过 attach——`playwright-cli list` 显示 `chrome` 且 status open → 直接用 `--s=chrome`。否则 attach：

```bash
export PLAYWRIGHT_MCP_EXTENSION_TOKEN=$(grep PLAYWRIGHT_MCP_EXTENSION_TOKEN .env.playwright.local | cut -d'=' -f2)
playwright-cli attach --extension=chrome
```

`.env.playwright.local` 缺失时提示用户创建（内容为 `PLAYWRIGHT_MCP_EXTENSION_TOKEN=<token>`）。

完成判定：`--s=chrome` 命令可用（如 `eval "document.title"` 正常返回）。

2. **dev server 就绪**：调用 `monkey-dev-server` skill。完成判定：控制台无 `ERR_CONNECTION_REFUSED`。

3. **导航到目标页面**：

- 登录入口：`https://115.com/`（登录后跳转 `https://115.com/?cid=0&offset=0&mode=wangpan`）
- 115Master 主页：`https://115.com/web/lixian/master/#/drive`

## 115Master 交互要点

- **进入文件夹用 `dblclick`**：单击只是选中（勾选 checkbox）。
- **以 Page URL 变化判定导航成功**（如 `#/drive` → `#/drive/<cid>`），snapshot 不反映路由变化。

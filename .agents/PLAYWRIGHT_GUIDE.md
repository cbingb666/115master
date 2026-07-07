# Playwright 指南

## 连接浏览器

使用 `playwright-cli` 连接浏览器前，检查 `.env.playwright.local` 是否存在：

```bash
cat .env.playwright.local
```

该文件包含 `PLAYWRIGHT_MCP_EXTENSION_TOKEN`，用于通过 Playwright Extension 连接到用户指定的浏览器。

若文件不存在，提示用户创建：

```bash
# .env.playwright.local
PLAYWRIGHT_MCP_EXTENSION_TOKEN=your_token_here
```

使用时需先导出环境变量，再连接浏览器：

```bash
export PLAYWRIGHT_MCP_EXTENSION_TOKEN=$(cat .env.playwright.local | grep PLAYWRIGHT_MCP_EXTENSION_TOKEN | cut -d'=' -f2)
playwright-cli attach --extension=chrome
```

## 115 页面导航

- 登录入口：`https://115.com/`
- 登录成功后自动跳转至：`https://115.com/?cid=0&offset=0&mode=wangpan`
- 115master 主页：`https://115.com/web/lixian/master/#/drive`
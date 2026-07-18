---
name: reverse-api
description: 通过 Playwright 浏览器自动化逆向 Web 应用的 API 接口，生成类型化的客户端代码。
allowed-tools: Skill(playwright-115) Bash(playwright-cli:*)
---

# API Reverse Engineering

逆向 Web 应用的 REST API 接口，从零开始生成类型安全的客户端代码。

## 前置条件

调用 `playwright-115` skill 完成浏览器连接与环境准备（`.env.playwright.local` 检查、token 导出、`playwright-cli attach`、dev server 就绪、页面导航均由其负责）。

## 工作流

### Phase 1: 触发目标功能并捕获网络请求

1. 导航到目标页面
2. `playwright-cli snapshot` 获取页面元素 ref
3. 交互触发功能（click / dblclick / fill / press）
4. 捕获所有 XHR/Fetch 请求：
```bash
playwright-cli --raw requests | grep -v "static\|\.js\|\.css\|\.png\|\.jpg\|\.svg"
```
5. 用关键词过滤目标接口：
```bash
playwright-cli --raw requests | grep -i "关键词1\|关键词2"
```

### Phase 2: 检查请求/响应详情

查看单个请求的完整信息（headers、参数、响应体）：
```bash
playwright-cli request <请求编号>
playwright-cli --raw response-body <请求编号>
```

关注点：
- HTTP 方法（GET / POST）
- URL 路径与参数名
- 请求体（POST data）
- 响应 JSON 结构（关注 `state`、`code`、`data` 包裹层）

### Phase 3: 搜索页面源码定位 API 逻辑

从网络请求面板获取页面加载的 JS 文件列表：
```bash
playwright-cli --raw requests --static | grep "\.js" | grep -v "cdnassets\|iconify\|google\|baidu"
```

用 `playwright-cli eval` 在浏览器上下文中 fetch 这些 JS 文件并搜索关键字符串：
```bash
playwright-cli eval "
fetch('JS文件URL')
  .then(r => r.text())
  .then(t => {
    const idx = t.indexOf('目标函数名或关键词');
    if (idx < 0) return 'NOT FOUND';
    return t.substring(Math.max(0, idx - 300), Math.min(t.length, idx + 3000));
  })
"
```

搜索策略：
- 先搜已知 API 路径（如 `push_extract`、`extract_info`）
- 再搜 UI 层调用的函数名（如 `OpenRAR`、`YunUnzipDG`）
- 最后搜 Worker 文件名（如 `bg_unzip`）

### Phase 4: 追踪完整调用链

从 UI 事件出发，追踪到 API 调用：

```
用户双击文件
  → dblclick handler (main-wl-2014-min.js)
    → TOP.Core.FileAPI.OpenRAR(obj) (core-min.js)
      → Core.YunUnzipDG.Open(data) (core-min.js)
        → GET push_extract?pick_code=xxx
        → 创建 Worker(bg_unzip.js)
          → 轮询 GET push_extract
          → POST add_extract_file
```

关键点：
- **Worker 脚本**：检查 `new Worker("...")` 创建的 Web Worker
- **消息协议**：Worker 的 `postMessage` 与 `onmessage` 收发格式
- **错误处理**：HTTP 非 200 状态码的 handling 路径、error 回调是否丢弃了 status code

### Phase 5: 检查现有代码并生成实现

1. 搜索现有代码库是否已有相关接口：
```bash
grep -r "关键词" packages/ --include="*.ts" -l
```

2. 阅读现有 client 代码风格：
```bash
# 查看一个典型 client 的 req.ts / res.ts / client.ts / index.ts
```

3. 生成文件（遵循项目代码规范）：
   - `clients/<domain>/req.ts` — 请求接口，参数带 JSDoc
   - `clients/<domain>/res.ts` — 响应类型，使用 `ApiResponseBase<{ data: ... }>` 包裹
   - `clients/<domain>/client.ts` — 继承 `BaseApiClient`，方法 => handle => fetchRequest
   - `clients/<domain>/index.ts` — barrel 导出
   - 更新 `clients/index.ts` 和 `drive115.ts`

4. 编写测试：
   - Mock `IRequest` (get/post)，返回 `jsonResponse(data)`
   - 测试 state=true/false 场景、错误码映射、完整流程模拟
   - 运行 `pnpm --filter @115master/<package> test`

5. 编写 API 文档，放入 `packages/<package>/docs/`：
   - 每个端点：URL、方法、参数表（名/类型/必填/说明）、请求示例、响应示例
   - 状态码/错误码枚举表
   - 完整业务流程图（ASCII art 或 mermaid）
   - 若涉及 Worker 协议，记录其消息格式

### Phase 6: 验证

使用 Playwright 再次触发功能，对比实际请求/响应与生成的代码：
```bash
# 发起新的交互
playwright-cli dblclick <ref>
# 查看响应
playwright-cli --raw requests | grep "目标接口"
playwright-cli --raw response-body <id>
```

核对项：
- [ ] URL 路径正确
- [ ] HTTP 方法正确
- [ ] 参数名/类型与实际匹配
- [ ] 响应 `data` 包裹层位置与实际匹配
- [ ] GET vs POST 的响应形状差异是否已处理
- [ ] `tsc --noEmit` 编译通过
- [ ] `pnpm test` 全部通过

## 115 网盘特定说明

- **API 基址**：`https://webapi.115.com`
- **响应格式**：`{ state, code/errNo, error/error_msg, data }`，其中 `data` 包裹业务数据
- **JS 文件**：页面主逻辑在 `core-min.js`、`main.js`（`main_2014_wl`）、`main-wl-2014-min.js`
- **Worker 脚本**：在 `/static/plug/main_2014_wl/` 下
- **压缩包触发**：双击文件（type=11），`/\.(rar|zip|7z)$/i` 正则匹配后缀
- **文件状态字段**：`class: "RAR"` 未解压，`class: "RAR_EXTRACT"` 已解压

Status: ready-for-agent

# 标签管理页面（Tag Management）

## Problem Statement

115 网盘原生提供标签系统（给文件打标签分类）。115master 的 MASTER SPA 网盘 UI 目前**只在文件列表里只读展示**每个文件已有的标签徽章（消费 `FileItemBase.fl`，按 `tag.color` / `tag.name` 渲染色块，见 `FileItemContent.tsx`），但**没有任何管理标签实体本身的入口**。

结果是：用户无法在 115master MASTER SPA 里创建标签、整理已有标签（重命名/改色）、清理废弃标签，也无法在一个集中页面查看自己的标签库全貌——标签的「展示」是被动只读的，「管理」侧完全缺位。

用户希望：在 115master 的 MASTER SPA 里有一个独立的**标签管理页面**，集中管理标签实体本身（增删改查 + 颜色），作为后续「给文件打标签」功能的基础设施先行落地。

## Solution

在 MASTER SPA 新增标签管理页（侧边栏 Menu 常驻入口，与网盘并列），提供标签的创建、重命名、改色、删除、搜索，桌面列表 / 移动卡片双形态响应式。

页面建立在 `@packages/drive115` 已封装的 `tag` 客户端（从 115 官方逆向）之上。鉴于该客户端**从未联调**，采用两层对冲：(1) store 层 `normalizeTags` adapter 把不确定的原始响应转成稳定的内部 `Tag` 模型，联调时字段不符只改 adapter；(2) 垂直切片开发顺序，每加一个接口就联调一次，问题不堆积。

首版严格限定为「标签实体管理」，不含标签与文件的关联功能（按标签查文件 / 给文件打标签）——留待后续迭代。

## User Stories

1. 作为 115 网盘用户，我想从侧边栏进入标签管理页并一次看到全部标签列表，这样我能集中管理并了解标签全貌
2. 作为 115 网盘用户，我想按名称子串搜索标签、无结果时看到空状态，这样我能快速定位并区分「无匹配」与「加载失败」
3. 作为 115 网盘用户，我想创建标签时填名称并从 8 种预设色（含无色）中选择，这样我能扩展分类体系且不被迫选色
4. 作为 115 网盘用户，我想编辑标签的重命名与颜色，这样我能修正命名并调整分类视觉
5. 作为 115 网盘用户，我想删除单个标签时看到确认提示、且提示写明「会从关联文件移除」，这样我理解后果并避免误删
6. 作为 115 网盘用户，我想多选标签批量删除，删前确认数量与后果，部分失败时成功项仍生效、失败项被明确告知，这样我高效清理且不被个别失败拖累
7. 作为 115 网盘用户，我想选中后见到批量操作栏，支持全选 / 反选 / 清空，取消选中后栏消失，这样我的批量意图始终清晰
8. 作为 115 网盘用户，我想桌面用列表视图（色块 + 名称 + 操作横向排列）、移动用卡片视图，这样我各断点信息密度合适
9. 作为 115 网盘用户，我想创建 / 编辑时空值与重名被拦截，这样我避免无效或冲突的标签
10. 作为 115 网盘用户，我想接口失败时收到明确行动提示（重新登录 / 人机验证 / 重试），这样我知道下一步该做什么
11. 作为 115 网盘用户，我想刷新页面后搜索词保持，这样我能恢复上次查看状态
12. 作为 115 网盘用户，我想列表区分加载中 / 空 / 错误三态、错误时提供重试入口，这样我始终理解当前状态且能恢复
13. 作为 115 网盘用户，我想移动端编辑弹窗从底部滑入、操作按钮仅图标（桌面则图标 + 文字），这样我单手可达且各断点密度合适
14. 作为 115 网盘用户，我想标签管理页与网盘共享侧边栏与主题、移动端经抽屉导航，这样我体验一致
15. 作为 115 网盘用户，我想标签管理入口有专属图标，这样我导航时快速识别
16. 作为 115 网盘用户，我想创建 / 编辑 / 删除后列表即时更新，这样我确认操作生效
17. 作为 115 网盘用户，我想每次进入页刷新全量，这样我看到的数据与 115 后端一致
18. 作为 115 网盘用户，我想标签接近 200 上限时仍正常渲染，这样我标签多了也不卡

## Implementation Decisions

### 功能边界

- 首版范围：标签实体的创建 / 重命名 / 改色 / 删除 / 搜索。**不含**文件关联、**不做**排序 UI。
- 按标签查文件（`getFilesByLabel`）、给文件打标签（`setFileLabels`）留待后续迭代。
- 不展示「标签关联文件数」——`LabelInfo` 无 count 字段，需逐标签额外请求，与纯 CRUD 范围冲突。

### 数据加载策略

- 一次 `drive115.tag.getLabels({ limit: 200 })` 全量加载，搜索 / 筛选全在前端。
- **不引** `useDriveCache`（LRU）、**不引**后端分页状态机——标签量级小（典型几十到上百），前端处理足够。
- `searchLabels` 与 `getLabels` 同端点（`/label/list`），前端过滤即可，首版不调用 `searchLabels`。
- 列表页每次进入均重建并全量刷新，数据新鲜度优先（全量加载成本低）。

### 稳定内部模型（adapter 对冲未联调）

- store 层提供 `normalizeTags(raw)`，把不确定的 `Labels.data.list`（`LabelInfo` 字段全 optional）转成稳定的 `Tag` 模型。
- 联调时若 115 返回字段名 / 类型 / 存在性与封装不符，**只改 adapter 与 `@packages/drive115` 的 `res.ts`/`req.ts`**，组件与 store 外部行为不动。
- 稳定 `Tag` 形状（编码 adapter 决策；来源：设计共识，非 prototype）：
  > `id` / `name` 必填；`color` 归一为非空字符串（无色时取 `LabelColor.Blank`）；`sort` 归一为 number；`createTime` / `updateTime` 透传为可选 number。

### 状态架构

- 新建组合式 `useTagStore`（与 `driveList` 约定一致），组合三个职责：数据层（load / create / update / remove）、selection（选中集合 + 全选 / 反选 / 清空）、搜索（关键字 ref + 派生过滤列表）。
- store 内部**不直接依赖** `useRouteQuery`——URL ↔ 搜索词的桥接隔离在页面层，保证 store 可在 node 环境（无 router 上下文）独立测试。

### 列表呈现

- 桌面：list 视图（单列横向行：色块 + 名称 + 操作），与 drive 页 `FileList` 的 list 视图风格一致。
- `<sm` 断点：切为卡片堆叠（纵向）。
- 仿 `FileList` 的 list/card 切换（一套 DOM，断点 / CSS 切 flex 方向），沿用项目现有模式——list 相对 table 的取舍：标签字段少，无需 table 的列结构与表头，且与网盘视觉一致。
- 新建标签项展示组件（`FileList` 与文件语义耦合，无法直接复用）。

### 创建 / 编辑交互

- 统一用 `useDialog.create` 自定义弹窗：名称输入 + 8 色块选择 + 校验。创建与编辑复用同一弹窗。
- 8 色块复用 `LabelColor` 常量（Blank / Red / Orange / Yellow / Green / Blue / Purple / Gray）。
- 响应式沿用项目约定：`modal-bottom sm:modal-middle`（移动端底部滑入，桌面居中）。

### 批量操作

- list 行 / 卡片均带 checkbox（行首），选中后顶部出现批量删除栏（借鉴 `useDriveSelection` 模式）。
- 批量删除用 `Promise.allSettled` 聚合：成功项从列表移除，失败项保留并向用户上报。
- **与 ADR-0001（错误管道·异常范式）兼容声明**：单个 `deleteLabel` 调用仍遵循异常范式——失败时由 `handle()` 边界抛出 `Drive115Error`；批量聚合（allSettled）发生在 store 编排层，是对多个异常的收集，**不改变**单个调用的异常范式，也未引入 Result 范式。不与 ADR-0001 冲突。

### 删除确认

- 单条与批量统一用 `useDialog.confirm`。
- 批量文案强调「将删除 N 个标签并从关联文件移除，不可恢复」。

### URL 状态

- 搜索词进 URL（`useRouteQuery`，与 drive 页一致），刷新保持。
- selection 选中态为本地 ref，不进 URL。

### 名称校验

- 前端查重（全量已加载，O(n) 匹配）。
- 空值 / 超长拦截。
- 后端错误经 `drive115.onError` 兜底（见错误处理）。

### 错误处理（遵循 ADR-0001 + 领域词汇）

- 所有 `drive115.tag.*` 失败经 `handle()` 边界归一化为 `Drive115Error`（唯一对外失败类型），`onError` 回调收 `ErrorResult` 投影。
- UI 据 `action`（relogin / verify / retry / none）决定行为，不识别具体错误码——与项目错误管道约定一致。

### 入口与导航

- MASTER SPA 新增 `/tags` 路由，标签管理页复用 `Layout` / `Sider` / `Main` / `Header` 骨架（移动端侧栏随抽屉可达，响应式由骨架自带）。
- 侧边栏 `Menu` 加常驻项（与网盘并列）。
- 入口图标走 `@/icons` registry（`I.*` 表达式，强制）；有对应语义图标则复用，缺失则按 `icons-design` 规范新增。

### `@packages/drive115`

- 首版**只消费** `drive115.tag.{getLabels, addLabels, editLabel, deleteLabel}`，包源码原则上不改。
- 联调时若字段 / `\x07` 拼接格式 / 成功判定字段不符，就地修 `tag` client 的 `res.ts` / `req.ts` / `client.ts`（属联调修正，不属本 spec 范围的新功能）。

## Testing Decisions

### 好测试的标准

- 只测**外部行为**，不测实现细节：不测私有方法、不测 reactive 内部结构、不测调用次数等脆弱耦合。
- 通过 store 的公开读写面（state 快照 + action 调用后的派生值）断言。

### 唯一测试 seam

- **`useTagStore` 行为集成测试**：`vitest` + `setActivePinia(createPinia())` + mock `drive115.tag` 单例。
- 之所以是单一 seam：store 是标签页全部业务规则的汇聚点（normalize / 搜索 / CRUD 编排 / selection / 批量容错），mock `drive115.tag` 可隔离未联调的 API，覆盖面最广。
- 新基础设施代价：仅 `setActivePinia` 一行（pinia 已是项目依赖，vue reactivity 在 node 环境可跑）。

### 覆盖项

- `normalizeTags`：raw 响应（字段缺失 / 类型不符）→ 稳定 `Tag` 列表（数量、必填字段、默认值）。
- 搜索：关键字 → 过滤后列表（子串匹配、大小写、无结果）。
- CRUD 后外部状态：创建后新标签入列、编辑后字段更新、删除后从列表移除。
- 批量删除部分失败：`Promise.allSettled` 聚合——成功项移除、失败项保留、失败信息上报（验证 ADR-0001 兼容：单个 deleteLabel 仍抛 `Drive115Error`）。
- selection：全选 / 反选 / 清空的外部状态。

### Prior art

- `packages/drive115/src/__tests__/tag.test.ts`——mock `IRequest` + 断言行为（URL / 参数 / 响应解析）。
- `apps/monkey/src/__tests__/scheduler-error.test.ts`——纯逻辑 / 类型断言。

### 不测

- 组件渲染：项目无 `@vue/test-utils` / `happy-dom` 基础设施。
- E2E：无自动化测试基础设施，且 API 未联调。

## Out of Scope

- 标签排序 UI（不调用 `setLabelOrder`，按 115 默认顺序展示）。
- 文件关联功能：按标签查文件（`getFilesByLabel`）、给文件打标签（`setFileLabels` / `clearFileLabels`）。
- 标签关联文件数展示。
- `@packages/drive115` 的 `tag` client 改造（首版只消费；联调修正属独立动作）。
- 后端分页、`useDriveCache` LRU 缓存（全量加载策略下不需要）。
- 组件单元测试、E2E 自动化测试（基础设施缺失，非本 spec 引入）。
- drive 页消费 `FileItemBase.fl` 展示文件标签（属另一功能）。

## Further Notes

### API 未联调风险（最高风险）

`drive115.tag` 客户端从 115 官方逆向封装，**从未联调**。已知未知点：

- `getLabels` 返回字段名 / 类型 / 存在性（`Labels.data.list` 与 `LabelInfo` 字段全 optional）。
- `addLabels` 的 `\x07` 颜色分隔拼接（`name\x07color`，elevengo 协议特征）是否被当前 115 后端接受。
- 无色标签的 `color` 返回值（空串 / null / 字段缺失）——影响色块渲染。
- `editLabel` 不传 `color` 时：清空 vs 保持原色。
- 成功判定字段：`deleteLabel` / `editLabel` 响应为 `unknown`，`handle()` 靠 `state` 还是其他字段（`error` / `errno`）判定成败。

### 缓解

- adapter 层对冲字段不稳。
- 垂直切片开发顺序，逐接口联调。

### 开发顺序（垂直切片 · 逐接口联调点 ⚙）

1. 地基切片：`/tags` 路由 + Menu 入口 + `useTagStore.load` + `normalizeTags` + 最简列表渲染 ⚙ 联调 `getLabels`，对照真实响应修 adapter / `res.ts`
2. 搜索切片：前端过滤 + `SearchBar` + `useRouteQuery`
3. 创建切片：`useDialog.create` 弹窗 + `addLabels` ⚙ 联调 `\x07` 拼接格式
4. 编辑切片：复用弹窗 + `editLabel` ⚙ 联调 `color` 不传时行为
5. 删除切片：单条 `useDialog.confirm` + `deleteLabel` ⚙ 联调成功判定字段
6. 批量切片：checkbox + 批量栏 + `Promise.allSettled` 容错
7. 响应式打磨：list ↔ 卡片双形态、移动端、批量栏响应式
8. 收尾：`Empty` / `LoadingError` / `Progress` 三态、图标、`pnpm lint && pnpm type-check && pnpm build`

### 待定的执行细节

- 联调触点：`pnpm dev` 跑起后，**用户手动操作** vs **agent 用 Playwright 连用户浏览器操作**（需用户授权）——在第一个联调点（`getLabels`）前确定。
- 联调期若某接口实际不通，是当场修 `@packages/drive115` 封装，还是暂时屏蔽该功能——按现场判断，记录到本 spec 的 `## Comments`。

## Comments

- `getLabels` 返回字段 / 类型已确认：`{ state, code, message, data: { total, list, sort, order } }`；`list` 项为 `id/name/sort/color/update_time/create_time`，其中 `sort` 在列表响应为字符串。
- `addLabels` 确认使用 `name[index]=name\x07color`；后端无色值是空串，客户端的 `LabelColor.Blank` sentinel 必须在请求边界序列化为空串。
- `editLabel` 省略 `color` 会保持原色；显式传空串才会清空颜色。
- `addLabels` / `editLabel` / `deleteLabel` 均以 `state + code + message` 表示成功或失败。
- 标签名实际最大长度为 50；51 字符返回 `code=21002`。
- 联调测试标签已全部删除，并重新拉取列表确认无残留。

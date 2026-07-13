Status: ready-for-agent

# 文件列表打标签（File Tagging）

## Problem Statement

115master 的 MASTER SPA 文件列表已经**只读展示**每个文件已有的标签徽章（消费 `FileItemBase.fl`，按 `tag.color` / `tag.name` 渲染色块），标签实体的增删改查也已在「标签管理页」落地。但**文件与标签的关联写入侧完全缺位**——用户在文件列表里**无法给文件打标签、加标签、移除标签**。

结果是：用户想用标签分类文件时，只能离开 115master、回到 115 官方页面操作；标签管理页建好的标签库在文件列表里「看得见、用不上」，标签体系的价值停留在展示层。

用户希望：在 MASTER SPA 的文件列表里直接对文件（含批量、含文件夹）打标签，操作入口与现有置顶 / 星标 / 移动等一致，复用已建好的标签库，不破坏文件已有的其他标签。

## Solution

在文件列表的右键上下文菜单新增「打标签」操作（与现有文件操作同入口、同批量模型）。点击后弹 dialog 展示标签库（来自 `useTagStore`）供多选，确认后**增量**应用到选中文件——勾选的标签加到所有选中文件、取消的标签从所有选中文件移除、其他标签保留。批量用 `Promise.allSettled` 聚合 + 三态 Toast。

建立在已落地的 `@packages/drive115` `tag.setFileLabels`（全量替换语义）之上：增量靠客户端 diff 实现（用内存中的 `fl` 计算每文件目标标签集，再逐文件全量写回）。`useTagStore` 仅作为标签目录数据源被复用，**不承载文件关联职责**。

首版严格限定为「给已有标签打勾、增量应用到文件」；新建标签、按标签筛文件、清除全部等留待后续。

## User Stories

1. 作为 115 网盘用户，我想在文件列表右键单个文件看到「打标签」菜单项，这样我能就地给文件分类而不必跳走
2. 作为 115 网盘用户，我想多选若干文件后右键「打标签」一次性处理，这样我高效批量分类
3. 作为 115 网盘用户，我想给文件夹也打标签（与文件同一入口），这样我的分类体系对目录同样适用
4. 作为 115 网盘用户，我想打标签弹窗里看到标签库全部标签（色块 + 名称 + 勾选框），这样我快速挑要打的标签
5. 作为 115 网盘用户，我想弹窗里有搜索框按名称子串过滤标签，这样我标签很多时也能快速定位
6. 作为 115 网盘用户，我想单个文件打开弹窗时自动预勾选该文件已有的标签，这样我清楚它当前分类并在此基础上调整
7. 作为 115 网盘用户，我想批量打开弹窗时预勾选的是「所有选中文件都有的标签」（交集），这样我据此增删而不被某文件的特有标签误导
8. 作为 115 网盘用户，我想勾选一个新标签后确认，这个标签被加到所有选中文件、不动它们各自的其他标签，这样我「给这批文件都加上 X」的意图被精确执行
9. 作为 115 网盘用户，我想取消一个已勾选标签后确认，这个标签从所有选中文件移除，这样我能批量摘除分类
10. 作为 115 网盘用户，我想打标签操作不弹确认框（区别于删除），直接执行，这样高频操作不被打断
11. 作为 115 网盘用户，我想操作完成后文件列表里被影响文件的标签徽章立即更新，这样我确认操作生效
12. 作为 115 网盘用户，我想批量部分失败时成功的仍生效、失败的被明确列出（含数量），这样我不被个别失败拖累且知道哪些要重试
13. 作为 115 网盘用户，我想批量全部失败时收到明确失败提示，这样我知道整体没生效
14. 作为 115 网盘用户，我想操作失败时收到含行动指引的提示（重试 / 重新登录 / 人机验证），这样我知道下一步
15. 作为 115 网盘用户，我想弹窗打开时若标签库为空，看到去「标签管理页」创建的引导，这样我不会面对一个空弹窗不知所措
16. 作为 115 网盘用户，我想没有任何勾选变化时确认按钮禁用，这样我不会触发无效请求
17. 作为 115 网盘用户，我想弹窗用 Escape 关闭、移动端从底部滑入桌面居中，这样我各断点都能顺手关闭
18. 作为 115 网盘用户，我想「打标签」入口有与标签管理一致的图标（价签图标），这样我一眼认出
19. 作为 115 网盘用户，我想浏览器后退能关闭打标签弹窗（与项目其他自定义弹窗一致），这样我用习惯的后退手势关闭
20. 作为 115 网盘用户，我想操作期间按钮有 loading 防重复提交，这样我不会误点多次造成重复请求

## Implementation Decisions

### 功能边界

- 首版范围：对选中文件（单 / 批、文件 / 文件夹）**增量**增删已有标签。
- **不做**：dialog 内新建标签（去标签管理页）；「清除全部标签」快捷按钮；按标签筛文件（`getFilesByLabel`）的入口 / 页面；标签关联文件数展示。
- 关联逻辑只消费 `drive115.tag.setFileLabels`；`clearFileLabels` / `getFilesByLabel` 本次不接 UI。

### 入口与菜单

- 在 drive 页文件操作的 `actionAtom` 新增 `tag` 项，纳入 `actionConfig` 分组（与 move / improve / rename 同组或单独成组），由 `FileContextMenu` 统一渲染。
- `show` 默认对单选 / 多选 / 文件 / 文件夹均可见；不设 count 限制（批量天然支持）。
- 操作图标复用 `@/icons` 的 `I.TAG`（已注册，与标签管理页同源），不新增 registry 项。

### 确认语义：增量（核心）

底层 `setFileLabels(fileId, labelIds)` 是**全量替换**——传哪些 id，文件最终只剩哪些。为满足「加 / 减、保留其他」的用户语义，靠**客户端 diff**实现：

- dialog 初始勾选 = 所有选中文件 `fl` 的**交集**（单文件时即该文件全部标签）。
- 用户调整后的勾选集记为 final。
- 对每个文件：
  - `added = final − 交集`
  - `removed = 交集 − final`
  - 目标 `labelIds = (file.fl 的 id 集 − removed) ∪ added`
  - `file.fl` 为 `undefined` 时当空集参与计算。
- 把每个文件的目标 `labelIds` 全量写回（`setFileLabels`），语义上等价于「只动 added / removed，其余保留」。

决策规则编码为纯函数（来源：设计共识，非 prototype）：

```ts
type FileTagChange = { fileId: string; labelIds: string[] }
// files: 选中文件（含其标签 id 集）；final: dialog 最终勾选的标签 id 集
// 返回每个文件应传给 setFileLabels 的目标 labelIds；与初始相同者省略以省请求
resolveFileTagChanges(
  files: { id: string; tagIds: string[] }[],
  final: Set<string>,
): FileTagChange[]
```

> 纯函数刻意不依赖 pinia / drive115 / DOM，便于在 node 环境单测（见 Testing Decisions）。

### 批量与并发

- 对每个有变更的文件并发 `setFileLabels`，用 `Promise.allSettled` 聚合，三态 Toast（成功 / 部分失败含名称列表 / 全失败）。
- 范本：`useTagStore.removeBatch` + `pages/tags/tags.tsx` 的批量反馈。
- 失败项**保留选中态**，便于用户原地重试。
- `useBatch` hook 尚未落地，本功能**内联**该范式，不阻塞等待基础设施。

### 不 confirm

- 打标签属非删除操作，**不弹 confirm**，直接执行 + 失败 Toast。与移动 / 重命名 / 星标一致。
- 提交防重：dialog `confirmCallback` 内用 submitting 标志 + 返回 `false` 阻关闭（范本：`TagFormContent` 表单）。

### 刷新与徽章更新

- 操作完成后调 drive store 的 `afterAction()` → 列表 refresh，重新拉取文件（带新 `fl`）。
- **显示层零改动**：`FileItemContent` 的标签徽章渲染（消费 `fl`）保持不动，刷新后自动反映新标签。

### 状态架构

- 关联编排放 drive 操作 hook 聚合处新增的 `useTagAction`（与 `useMoveAction` / `useDeleteAction` 同层），导出「打开打标签弹窗 + 应用」动作。
- **`useTagStore` 不改**：仅作为标签目录数据源（`load` / `tags` / `keyword` / `filtered`）被复用，保持「标签实体 CRUD」单一职责。文件关联是文件侧职责，不进标签 store。

### dialog 与勾选态

- 用 `useDialog.create({ history: true })` 打开（浏览器后退可关，与项目其他自定义弹窗一致；移动端 `modal-bottom`、桌面 `modal-middle`）。
- content 传一个**标签多选选择器**（搜索框 + 色块 + 勾选列表）。
- **勾选态用 dialog 内部独立 `Set<string>`**，**不复用** `useTagStore.selected`（后者服务标签管理页批量删除，复用会跨页污染选中态）。
- 初始勾选集由求交集的纯逻辑从选中文件 `fl` 得出（与 `resolveFileTagChanges` 同源，可共享实现）。
- 搜索复用 `useTagStore.keyword` / `filtered`（已有，标签上限 200，搜索为刚需）；搜索词为 dialog 内临时态，**不进 URL**（区别于标签管理页的 URL 搜索词——此处是一次性选择，无需分享 / 刷新恢复）。

### dialog 内标签列表状态

- 打开时若 `useTagStore.tags` 为空，先 `load()`。
- 加载 / 错误 / 空三态用现有 `<LoadingError>` / `<Empty>` 编排；**不引入** `<StateView>`
- 空目录（标签库无标签）引导去「标签管理页」创建。

### 文件夹支持

- `setFileLabels` 的 `fid` 对文件夹传其 `cid`；取 id 统一用项目既有的 `getFilesItemId`（文件夹 → cid，文件 → fid）。
- 文档（`tag-api.md`）未明示文件夹支持，但 `FileItemBase.fl` 对文件夹同样存在、`getFilesByLabel` 用 `show_dir:1` 含目录，推断支持。**待真机联调验证**（见 Further Notes）。

### 错误处理（遵循 ADR-0001）

- 每个 `setFileLabels` 失败经 `handle()` 边界归一为 `Drive115Error`（唯一对外失败类型）。
- UI 据 `action`（relogin / verify / retry / none）决定行为，不识别具体错误码：`relogin` / `verify` 升级 dialog，其余 `toast.error`。
- 批量聚合在 hook 编排层（allSettled 收集），是对多个异常的收集，**不改变**单调用异常范式，与 ADR-0001 兼容（声明同 `removeBatch`）。

### `@packages/drive115`

- 首版**只消费** `drive115.tag.setFileLabels`，包源码原则上不改。
- 联调若 `setFileLabels` 对文件夹（fid = cid）不通或成功判定字段不符，就地修 client 的 `res.ts` / `req.ts`（属联调修正，不属本 spec 新功能）。

## Testing Decisions

### 好测试的标准

- 只测**外部行为**（纯函数的输入 → 输出），不测实现细节、私有方法、调用次数等脆弱耦合。
- 纯函数刻意与 pinia / drive115 / DOM 解耦，node 环境可直接跑，零 mock。

### 唯一测试 seam

- **`resolveFileTagChanges` 纯函数单测**（vitest）：断言「选中文件 + final 勾选」→「每文件目标 labelIds」。
- 之所以单一 seam：本功能的全部业务规则（交集初始态、增量 add / remove、`fl` undefined 当空集、无变化省略）都收敛于此函数；hook 编排（dialog / refresh / toast）属胶水，测它需大量 mock 且脆弱。

### 覆盖项

- 单文件：final = 该文件全部标签 → 无变更；增 / 减一个 → 目标集正确。
- 批量交集：多文件 `fl` 不同 → 交集正确；final 全新增 → 每文件在各自 `fl` 基础上并上新增；final 取消交集项 → 每文件移除该项、保留各自其他标签。
- `fl` undefined / 空：当空集参与，final 全为 added。
- 无变化：返回空变更集（驱动 UI 禁用确认）。
- 与初始相同的目标被省略（省请求）。

### Prior art

- `packages/drive115/src/__tests__/tag.test.ts`——mock `IRequest` + 断言行为（API 层 `setFileLabels` 已在此覆盖）。
- `apps/monkey/src/__tests__/scheduler-error.test.ts`——纯逻辑 / 类型断言（monkey 侧纯函数测试先例）。
- `useTagStore` 的 `removeBatch`（`store/tagList`）——批量 allSettled 聚合的行为范本。

### 不测

- hook 编排（dialog 触发 / refresh / toast）——属实现细节。
- 组件渲染——项目无 `@vue/test-utils` / `happy-dom` 基础设施。
- E2E——无自动化测试基础设施。

## Out of Scope

- dialog 内新建标签（去标签管理页）。
- 「清除全部标签」快捷按钮（增量取消已覆盖单文件清空；批量清除留待需求驱动）。
- 按标签筛文件（`getFilesByLabel`）的入口 / 专用页。
- 标签关联文件数展示。
- `useBatch` / `<StateView>` / `<Skeleton>` 基础设施落地。
- `@packages/drive115` 的 `tag` client 改造（首版只消费；联调修正属独立动作）。
- 组件单元测试、E2E 自动化测试（基础设施缺失，非本 spec 引入）。
- 文件列表项标签徽章的展示（`FileItemContent` 消费 `fl`，保持不动）。

## Further Notes

### 与 tag-management spec 的关系

本功能是 `.scratch/tag-management/spec.md` 明确列为 Out of Scope 的后续迭代（「给文件打标签 `setFileLabels` / `clearFileLabels`」）。复用其落地的 `useTagStore`（标签目录 + `load`）、`Tag` 模型、`LabelColor`、错误管道与批量范式。

### 主要风险：setFileLabels 对文件夹的支持

- `tag-api.md` 对 `setFileLabels` 的 `fid` 仅记为「文件 id」，未明示文件夹（cid）是否被接受。
- 推断依据：`FileItemBase.fl` 对文件夹同样存在；`getFilesByLabel` 用 `show_dir:1` 含目录；115 官方端支持文件夹标签。
- 缓解：垂直切片开发，先在单文件上联调通，再单独验证文件夹（fid = cid）；若不通，dialog 对文件夹禁用「打标签」并记录到 `## Comments`。

### 增量语义的实现注记

- `setFileLabels` 全量替换 + 客户端 diff 的方案，前提是 `fl` 在内存中可信。文件列表已加载 `fl`，selection 中的文件对象携带它，无需额外请求。
- 并发批量时不重读 `fl`（diff 基于打开 dialog 时的快照）；若担心并发期间 `fl` 被他处改动，refresh 后以服务端结果为准。

### 开发顺序（垂直切片 · 联调点 ⚙）

1. 纯函数切片：`resolveFileTagChanges` + 单测（无联调，先固化语义）
2. 单文件切片：右键菜单 `tag` atom + dialog 选择器 + 单文件 `setFileLabels` + refresh ⚙ 联调 `setFileLabels` 成功判定 / 徽章刷新
3. 增量切片：交集初始勾选 + diff 写回（加 / 减）
4. 批量切片：多选 + allSettled + 三态 Toast + 失败保留选中
5. 文件夹切片 ⚙ 联调 fid = cid 是否被接受
6. 收尾：搜索框、空目录引导、Escape / history 后退、aria、`pnpm lint && pnpm type-check && pnpm build`

### 待定的执行细节

- 联调触点：`pnpm dev` 跑起后，用户手动操作 vs agent 用 Playwright 连用户浏览器操作（需授权）——在第一个联调点前确定（同 tag-management spec 约定）。

## Comments

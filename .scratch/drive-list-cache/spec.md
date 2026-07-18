Status: ready-for-agent

# 文件列表缓存与增量更新重构（Drive List Cache & Incremental Update）

## Problem Statement

115master MASTER SPA 的文件列表（drive 页）在缓存与数据更新上存在四类互相纠缠的问题，用户日常高频操作全部踩中：

1. **数据陈旧/不一致**：目录缓存没有 TTL 也没有主动校验——一个目录只要被缓存过，之后浏览器后退恢复的就是旧快照；手机端或 115 官方网页版做的增删改，本地永远看不到，除非缓存被 LRU 挤掉。
2. **闪烁与错误恢复**：缓存键只有 `area:cid`，不含页码和排序参数。用户翻到第 3 页、进入子目录、再后退，恢复的是该目录"最后抓取的那一页"——分页器显示的页码和实际渲染的内容对不上。同目录任何 refetch 都会先把列表清空再 loading，整页闪烁。
3. **多余的网络请求**：没有任何命中缓存时的复用策略，翻页、前进、切换排序全部整页重拉；而增删改操作（`afterAction`）后的"更新"也是整页 refetch——大目录下每改一个文件名都要等一整页重新加载。
4. **架构混乱**：`useDriveExplorer` 用一个 watcher 分支处理 cid/area/page/size/keyword 五个状态源的所有组合；滚动位置有两套并存机制（缓存 entry 内 + router 钩子）且会互相打架；Pinia store 只是 hook 的转发层，不拥有状态；整个模块 0 测试覆盖，任何修改都没有安全网。

用户希望：文件列表的缓存行为可预测（命中即渲染、后台静默校验、永不过期撒谎）、本地操作即时精确反映（不等整页 refetch）、模块架构内聚可测。

## Solution

彻底重构 drive 文件列表模块，围绕一个**单一 Pinia store（唯一事实源）**重建数据流：

- **按完整查询参数缓存**：缓存键包含 `area + cid + page + size + order + asc + 筛选参数`，每个查询组合独立成槽，翻页/排序/后退恢复的都是精确对应的数据。
- **Stale-While-Revalidate**：任何缓存命中立即渲染（消除闪烁），同时后台静默拉取校验；新数据返回后若 generation 未过期则替换。数据永不陈旧超过一次后台往返。
- **本地精确增量**：删除/移动/重命名/星标/置顶等操作成功后，直接对**所有已缓存页做全量重排**（item 跨页顺延），用户立即看到正确结果，不再整页 refetch。新增类操作（新建文件夹/上传/离线下载）因服务端排序位置本地不可计算，降级为 invalidate 该目录全部页 + refetch 当前页。
- **滚动位置独立成 store**：从缓存 entry 剥离，per-cid 单 key 记录，删掉 router 钩子那套，只留一处机制。
- **并发收敛**：同 key 请求去重（in-flight Promise 复用）+ generation 计数丢弃过期响应。
- **顺手修复**：move 进度轮询加上限与超时。

缓存保持内存级（不持久化到 IndexedDB），刷新页面重拉，配合 SWR 体验已足够。

## User Stories

1. 作为 115 网盘用户，我想进入一个浏览过的目录时立即看到文件列表（来自缓存），这样我不必盯着 loading 等待
2. 作为 115 网盘用户，我想缓存渲染的同时后台自动校验最新数据，这样我既快又不会看到过期的列表
3. 作为 115 网盘用户，我想后台校验发现差异后列表自动更新为最新内容，这样其他客户端（手机/官方网页）的变更能及时反映
4. 作为 115 网盘用户，我想翻到第 3 页、进入子目录、再后退时看到的仍是第 3 页的正确内容，这样分页器和实际渲染不会错位
5. 作为 115 网盘用户，我想后退恢复时滚动位置也回到我当时浏览的位置，这样我能接着上次的地方继续看
6. 作为 115 网盘用户，我想修改排序方式后缓存不会把旧排序的数据当新排序的呈现，这样列表顺序永远和我选的排序一致
7. 作为 115 网盘用户，我想切回之前用过的排序方式时仍能命中缓存快速渲染，这样反复切换不浪费请求
8. 作为 115 网盘用户，我想删除文件后它立即从列表消失、后面的文件自动补上，这样我不必等整页重新加载
9. 作为 115 网盘用户，我想批量删除后列表总数（分页器）同步减少，这样页码导航始终正确
10. 作为 115 网盘用户，我想重命名文件后新名字立即显示，这样我操作有即时反馈；若新名字按当前排序应改变位置，稍候后台校验会自动把列表修正为正确顺序
11. 作为 115 网盘用户，我想移动文件到其他目录后，源目录列表立即移除该文件、目标目录（若已缓存）也同步失效，这样两边都不陈旧
12. 作为 115 网盘用户，我想星标/置顶操作后文件状态立即更新，这样我操作有即时反馈；置顶导致的位置变化和星标区的增删由后台校验自动修正
13. 作为 115 网盘用户，我想新建文件夹后当前页刷新显示新文件夹，这样我能马上进入它
14. 作为 115 网盘用户，我想翻页时如果该页已缓存则立即渲染、后台校验，这样翻页如本地切换般流畅
15. 作为 115 网盘用户，我想快速连续翻页/切换目录时不会出现旧请求覆盖新内容，这样列表永远显示我最后选择的视图
16. 作为 115 网盘用户，我想同一页面的重复请求（如 SWR 校验中用户又触发同样查询）被合并为一次网络请求，这样不浪费带宽
17. 作为 115 网盘用户，我想修改每页显示数量后列表正确重新分页，且切回原数量时仍可能命中缓存，这样操作不浪费
18. 作为 115 网盘用户，我想移动大文件时进度轮询不会无限进行下去（卡住时最终提示失败），这样我不会面对永远转圈的进度
19. 作为 115 网盘用户，我想搜索时行为与浏览一致（翻页/排序/后退正常），搜索不被缓存是刻意的（结果集易变），这样语义清晰
20. 作为 115 网盘用户，我想文件列表所有操作期间选中状态被正确清理（操作完成后），这样我不会对不可见文件误操作
21. 作为维护者，我想缓存键/LRU/失效/页重排是纯逻辑、可在 node 环境单测，这样核心规则有回归保护
22. 作为维护者，我想 store 的公开行为（导航/刷新/增量/并发）可用 mock API 层测试，这样重构后架构有安全网
23. 作为维护者，我想 drive 列表的状态唯一事实源是 Pinia store，组件只消费不拥有状态，这样数据流方向清晰可查
24. 作为维护者，我想滚动位置只有一套机制，这样不会再出现两套逻辑打架导致的恢复错误
25. 作为 115 网盘用户，我想移动文件对话框里的目录列表与主文件列表数据一致——刚在主列表移走的文件，打开对话框浏览时不应看到旧内容，这样我选目标目录时不会被误导
26. 作为 115 网盘用户，我想移动文件对话框里反复进退目录时能命中缓存快速渲染，这样选目录操作流畅
27. 作为 115 网盘用户，我想离线下载选保存目录时同样享受缓存与一致的数据，这样高频离线下载操作不卡顿
28. 作为维护者，我想 FileBroswer 与 drive 页共享缓存单例但查询参数隔离（size/fc/nf 进 key），这样一致性成立且两边互不干扰

## Implementation Decisions

### 模块重构：单一 Pinia store 为唯一事实源

- `store/driveList` 重写为 setup-style store，拥有 drive 页全部状态：列表数据、加载态、导航参数（area/cid/page/size/order/asc/keyword）、选中集。
- **缓存实例（PageCache）为模块级单例**，不属于任何一个 store 或组件实例——drive 页 store 与 FileBroswer 对话框（移动/选目录）共享同一份缓存。key 含全部查询参数（含 size/fc/nf 等），两边查询天然隔离、互不覆盖，但 `invalidateCid` / `reorder` 对两边同步生效，消除现状「对话框独立缓存与 drive 页缓存数据不一致」的问题。
- 现有 `useDriveExplorer` / `useDriveList` / `useDrivePage` / `useDriveCache` 四个 hook 的职责收编进 store 与纯逻辑模块；hook 层只保留真正与组件生命周期绑定的逻辑（导航解析 `useDriveNav` 族保留，滚动 DOM 操作保留为薄 hook）。
- **FileBroswer（移动/选目录对话框）重构为消费同一套 store 化的数据流**：现状是它每次打开新建一份独立的 `useDriveExplorer`（独立缓存/分页/滚动），导致与 drive 页缓存数据不一致、且 `afterAction` 的 invalidate 碰不到它。重构后 FileBroswer 拥有自己的列表状态实例（数据/loading/分页），但**读写同一个模块级 PageCache 单例**——drive 页里的增量重排、invalidate 立即对对话框可见，反之亦然。FileBroswer 特有的查询参数（`size=20`、`fc=1`、`nf='1'`、对话框内搜索 area='search'）全部进入缓存 key，与 drive 页查询互不覆盖。
- `drive.tsx` 只消费 store，不再通过 actionHandlers 绕回调用；`afterAction` 语义从「refetch + invalidate」改为「对缓存施加精确增量操作」。
- 状态流向：`route 变化 → useDriveNav 解析 → store.navigate(params) → 缓存命中? 立即渲染 + SWR : 拉取 → 渲染`。单一 watcher 改为 store 内的显式 action 调用，消除五源分支 watcher。

### 缓存层：纯逻辑模块（无 pinia/vue 依赖）

独立模块（放在 drive 列表 store 附近的纯 TS 文件），包含：

**1. 缓存键**

```ts
// 来自设计共识，非 prototype
type ListQuery = {
  area: string        // 'all' | 'star' | ...
  cid: string
  page: number
  size: number
  order: string
  asc: 0 | 1
  fc_mix: 0 | 1       // 排序参数之一（文件夹混排），必须进 key
  // 筛选参数（suffix/type/fc/nf 等）按现有 Req.GetFiles 实际使用的字段全部纳入
  // ——含 FileBroswer 的 fc/nf，保证 drive 页与对话框同 cid 查询生成不同 key
}
cacheKey(q: ListQuery): string  // 全字段序列化
cidPrefix(area: string, cid: string): string  // 用于按目录前缀失效
```

- 搜索结果**不缓存**（与现状一致，结果集易变且语义不同）。
- 滚动位置**不在**缓存键/缓存值中。

**2. PageCache（LRU + 失效 + 请求去重）**

- 内存 Map，LRU 淘汰；容量从 50 上调（key 含页码后单目录多页占多槽），建议 **150**，实现时以此为默认、留构造参数。
- `get(key)` LRU touch；`set(key, page)` 写单页数据 `{ items, total, order, asc }`；`invalidateCid(area, cid)` 前缀匹配删除该目录全部页（所有排序/size 组合）；`invalidateCidExceptCurrentSort(...)` 支撑排序变更场景；`clear()` 全清。
- **请求去重**：`fetch(key, loader)`——同 key 有 in-flight Promise 时直接返回该 Promise；loader 完成/失败后从 in-flight Map 移除。缓存模块内聚去重，store 不重复实现。

**3. 全缓存页重排 `reorder`**

```ts
// 来自设计共识，非 prototype
type Page = { items: FilesItem[]; total: number }
type ReorderOp =
  | { kind: 'remove'; ids: string[] }            // 删除/移出
  | { kind: 'update'; item: FilesItem }          // 就地更新（重命名/星标/置顶的状态字段）
// id 规则：ids 与 item 匹配一律用项目既有的 getFilesItemId —— 文件取 fid、文件夹取 cid
// 输入：该目录所有已缓存页（按 page 升序）+ 页大小 + 操作
// 输出：重排后的各页 + 新 total；未缓存的页不在输出中（翻到时会重新拉取）
reorder(pages: Map<number, Page>, size: number, op: ReorderOp): Map<number, Page>
```

- `remove`：把所有已缓存页 items 拍平→按 id（`getFilesItemId`）移除→按 size 重新切页→total 减去实际移除数。**最后一页不满时，从下一已缓存页顺延补齐**；存在未缓存的后续页时最后一页允许不满（翻到即拉新）。
- `update`：**只就地替换同 id item 的数据，不触碰排序位置**。适用重命名（名字立即变）与星标/置顶（状态徽标立即变）的即时反馈；这些操作可能引起的**排序位置变化本地不预测**，由 SWR 后台校验修正（见「重排算法的排序一致性注记」）。
- **星标的跨目录语义**：在 star area 下，星标/取消星标是对 star 区列表的**增/删**，不是 update——取消星标 → 对 star 区 `applyMutation({ kind: 'remove', ids })`；新星标的插入位置服务端决定 → 对 star 区 `invalidateCid`（若该 cid 在 star 区有缓存）。all area 下的星标状态变化仍是 `update`。
- **置顶**：`is_top` 参与服务端排序，置顶/取消置顶后该 cid 全部缓存页 `invalidateCid` + refetch 当前页（与新增类同级处理，不本地预测位置）。
- **新增类操作不走 reorder**：新建文件夹/上传/离线下载成功后 `invalidateCid` + refetch 当前页（服务端排序位置本地不可计算，这是 grilling 中确认的降级）。
- 排序变更：`invalidateCid` 清该目录全部旧缓存（服务器端排序已持久化，旧 key 永远不会再被命中），再拉新排序第 1 页。
- pageSize 变更：不做任何手动清理——key 含 size，旧缓存自然失配，LRU 淘汰；切回原 size 仍可命中。

### SWR 数据流与并发

- `store.navigate(query)` / `store.refresh()` 的统一流程：
  1. `key = cacheKey(query)`；`cache.get(key)` 命中 → 立即写入列表状态渲染（含 total），loading 用**非阻塞**指示（不整页闪烁）。
  2. 无论命中与否，发起 `cache.fetch(key, loader)` 后台拉取。
  3. 响应返回时比对 generation（store 内单调计数器，navigate 即递增）：过期响应直接丢弃，不写缓存不更新 UI。
  4. 有效响应：写缓存 + 替换列表状态。
- generation 计数器保留现有语义（沿用 `useDriveList` 的模式），但从 hook 移入 store。
- refetch 期间**保留旧数据渲染**（不再 `data.value = null` 清空），消除闪烁。

### 增量操作的应用点（afterAction 重构）

- `store.applyMutation(op)`：store 内部取出该 cid 全部已缓存页 → `reorder` → 写回缓存 + 若当前页受影响则更新列表状态 + 更新 total/分页。
- 各 action hook（`useDeleteAction` / `useMoveAction` / `useFileAction` 等）保持纯 API 调用 + toast 职责，成功后把操作语义传给 store：
  - 删除/移出 → `applyMutation({ kind: 'remove', ids })`；移动还需 `invalidateCid(目标目录)`。
  - 重命名 → `applyMutation({ kind: 'update', item })`（名字立即变，位置由 SWR 修正）。
  - 星标 → all area 下 `update`；star area 下按跨目录增删处理（取消 → `remove`、新增 → `invalidateCid(star 区)`）。
  - 置顶 → `invalidateCid(当前目录)` + refetch 当前页（`is_top` 影响排序，不本地预测）。
  - 新建文件夹/上传/离线下载 → `invalidateCid(当前)` + `refresh()`。
  - improve（跨目录）→ 源目录 remove + 目标目录 invalidateCid。
- 操作完成后 selection 清理逻辑不变。

### 滚动位置：独立单一机制

- 滚动位置收进 store（或 store 持有的独立 Map），key 为 `area:cid`（不含页码——目录内滚动位置唯一）。
- **作用范围限 drive 页**：FileBroswer 对话框的滚动由其自身局部状态管理（对话框是临时实例，滚动无需跨会话保留），不写入共享滚动 store，避免与 drive 页同 cid 滚动位置互相污染。
- 导航离开时保存、命中缓存恢复；删除 `useDriveExplorer` 中的 `router.beforeEach/afterEach` 钩子那套（跨路由滚动恢复由唯一的保存/恢复点承担）。
- 恢复时机保持 `nextTick + requestAnimationFrame`，但收敛为单处实现。

### 错误处理（遵循 ADR-0001）

- 拉取失败仍走 `handle()` 边界 → `Drive115Error`；SWR 后台校验失败时**保留缓存渲染**并 toast 提示（区别于首屏失败的 error 态），不因后台失败把已渲染内容打没。
- `relogin` / `verify` 行为与现状一致（升级 dialog），不变。

### move 进度轮询修复

- `moveGetProgress` 递归轮询加上限：最大重试次数（建议 100 次 ≈ 5 分钟）+ 超限 toast 失败提示；可中断（组件卸载/新操作时停止）。

### LRU 容量

- 默认 150 槽（key 含页码后，按平均每目录 3 页估算覆盖 ~50 个目录，与现状体验对齐）。构造参数可调。

## Testing Decisions

### 好测试的标准

- 只测**外部行为**（输入 → 输出 / 公开方法调用 → 状态变化），不测私有方法、内部调用次数等脆弱耦合。
- 纯逻辑模块刻意不依赖 pinia / vue / drive115 / DOM，node 环境直接跑，零 mock。

### Seam 1：缓存纯逻辑模块（vitest，零 mock）

- `cacheKey`：全字段参与 key；任一字段不同 → key 不同（**含 size/fc/nf**——drive 页与 FileBroswer 的同 cid 查询生成不同 key，互不覆盖）；`cidPrefix` 正确匹配同目录所有 key（前缀失效对两边查询同时生效）。
- `PageCache`：LRU 超容量淘汰最久未用；`get` 后顺序更新；`invalidateCid` 前缀删除全部该目录页（含不同排序/size）；`fetch` 同 key 并发只调一次 loader、失败清理 in-flight。
- `reorder`：
  - remove 单页内移除 → 后续 item 前移、total-1。
  - remove 跨页顺延 → 第 1 页移除后从已缓存第 2 页补满。
  - remove 存在未缓存后续页 → 最后一页允许不满，不凭空造数据。
  - remove 多个 id、id 不存在（幂等不报错）。
  - remove 按 `getFilesItemId` 匹配（文件夹 cid、文件 fid）。
  - update 就地替换、不影响顺序与 total（重命名/星标/置顶状态字段即时变，位置不动）。
  - 全部移除 → 空页被清理，total=0。

### Seam 2：store 编排层（vitest + mock drive115）

- 范本：`packages/drive115/src/__tests__/fallback.test.ts` 的 `IRequest` mock 方式；`apps/monkey/src/store/tagList/__tests__/tagStore.test.ts` 的 Pinia store 测试方式（`setActivePinia(createPinia())`）。
- 覆盖：
  - 缓存命中 → 列表状态立即为缓存数据（同步），loader 仍被调用（后台校验）。
  - SWR 新数据返回 → 状态替换为新数据。
  - generation：先发的慢请求后返回 → 状态与缓存不被旧响应覆盖。
  - `applyMutation(remove)` → 当前页 items 减少、total 减少、其他已缓存页同步重排。
  - 排序变更 → 该 cid 旧 key 全部失效、拉取新排序。
  - 请求去重：navigate 与 SWR 并发同 key → loader 只调一次。
  - **共享缓存一致性**：drive store 的 `applyMutation` / `invalidateCid` 后，以 FileBroswer 参数（不同 size/fc/nf）查询同 cid → 不命中旧缓存（已被前缀失效覆盖）或命中已重排的数据。
  - **FileBroswer 独立状态**：FileBroswer 数据流实例的列表状态与 drive store 隔离（对话框翻页不影响 drive 页分页），但读写同一 PageCache 单例。

### 不测

- Vue 组件渲染（`drive.tsx` / `FileList`）——项目无 `@vue/test-utils` / `happy-dom` 基础设施。
- 真实网络 / IndexedDB——缓存为内存实现。
- E2E——无自动化基础设施。
- hook 内部实现细节（watcher 数量、私有函数）。

### Prior art

- `packages/drive115/src/__tests__/fallback.test.ts`——API 层 mock `IRequest`。
- `apps/monkey/src/store/tagList/__tests__/tagStore.test.ts`——Pinia store 测试。
- `apps/monkey/src/__tests__/scheduler-error.test.ts`——monkey 侧纯逻辑测试。
- `packages/shared/src/cache/index.test.ts`——缓存层测试风格参考（注意：本 spec 不复用 CacheCore，仅参考测试写法）。

## Out of Scope

- **缓存持久化到 IndexedDB/CacheCore**：grilling 已决策保持内存缓存，刷新重拉 + SWR 兜底。`CacheCore`/`MetaStore`/`QuotaManager` 继续只服务封面/字幕等二进制资源，不接文件列表。
- **服务端推送/WebSocket 实时同步**：跨客户端变更靠 SWR 校验兜底，不引入官方未公开机制。
- **搜索缓存**：搜索结果保持不缓存（现状语义保留，含 FileBroswer 对话框内搜索）。
- **FileBroswer 的 UI/交互改造**：只动数据流（共享缓存 + store 化），组件的渲染、选中交互、`useQueryNav`/`useStackNav` 导航层保持现状。
- **新增类操作的本地排序位置预测**：新建/上传不插缓存页，统一 invalidate + refetch（已确认的降级）。
- **AbortController 取消请求**：采用请求去重 + generation 丢弃，drive115 层不透传 AbortSignal。
- **虚拟滚动/列表渲染性能优化**：本次只动数据层与缓存层，渲染层（FileItem 等）不动。
- **legacy home 页（FileListMod）**：官方 DOM 增强路径无缓存逻辑，不在本次范围。
- **`drive115Instance` 的 relogin/verify 一次性 latch**：已知的独立问题，不在本次范围。
- **组件测试与 E2E 基础设施引入**。

## Further Notes

### 与现有代码的对应关系（供实现时参考，非契约）

- 被重构收编：`hooks/useDriveExplorer/index.ts`（watcher 控制器 + restoreCache + scroll 双机制）、`hooks/useDriveList/index.ts`（generation 守卫）、`hooks/useDrivePage/index.ts`、`hooks/useDriveCache/index.ts`。
- **FileBroswer 链路**：`components/FileBroswer/FileBroswer.tsx`（自建 `useDriveExplorer` 处改为消费 store 化数据流 + 共享 PageCache 单例）、`useFileBrowserDialog.tsx`、`useMoveAction.tsx`（`moveDialog`）、`useCloudDownloadAction.tsx`（`picker`）。导航（`useQueryNav`/`useStackNav`）与 UI 不动。
- 保留：`hooks/useDriveNav/*`（路由解析，职责清晰）、`hooks/useDriveSelection`、`hooks/useDriveAction/*`（纯 API + toast，仅成功后改为向 store 传 mutation 语义）。
- `store/driveList/index.ts` 重写；`pages/drive/drive.tsx` 的 actionHandlers 改为直接调 store 方法。

### 重排算法的排序一致性注记

本地精确重排只对 **remove** 类操作保证跨页精确（删除不引入排序不确定性）。其余操作的取舍：

- **`update`（重命名、星标/置顶的状态字段）**：就地更新数据，不重排顺序——服务端 natsort / `is_top` 可能把 item 排到不同位置，本地预测必然不一致。策略是「就地更新 + SWR 后台校验修正」：用户立即看到新名字/新徽标，若位置应变化，后台校验返回后列表自动修正。
- **置顶、star 区星标增删、新增类操作**：位置/成员资格由服务端决定，本地不预测，统一 `invalidateCid` + refetch。

这是「即时反馈」与「排序正确」之间的刻意取舍，已在 grilling 中确认（全页重排仅对 remove 类操作保证跨页精确）。

### 开发顺序（垂直切片）

1. 纯逻辑切片：`cacheKey` + `PageCache` + `reorder` + Seam 1 单测（无联调，先固化规则）。
2. store 骨架切片：重写 `store/driveList`（navigate/refresh/SWR/generation/去重），接入 drive.tsx 渲染，跑通浏览 + 翻页 + 后退恢复。
3. 增量切片：`applyMutation` 接入删除/移动/重命名/星标/置顶，替换 `afterAction` 的 refetch 语义。
4. FileBroswer 切片：PageCache 提升为模块级单例，FileBroswer 改为消费 store 化数据流（独立列表状态 + 共享缓存），验证移动/离线下载对话框与 drive 页数据一致。
5. 滚动切片：滚动位置收编 + 删除 router 钩子那套。
6. 排序/size 切片：排序变更清同 cid 缓存、size 变更自然失配。
7. 轮询修复 + Seam 2 测试补齐。
8. 收尾：`pnpm lint && pnpm type-check && pnpm build && pnpm test` 全绿；旧 hook 文件删除。

### 联调方式

- `pnpm dev` 跑起后手动操作验证；涉及 115 真实账号的导航/操作联调点由用户手动执行或授权 Playwright 连浏览器（同 tag-management spec 约定）。

## Comments

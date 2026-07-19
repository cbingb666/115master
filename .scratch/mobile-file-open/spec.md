Status: ready-for-agent

# 移动端文件列表打开与多选交互（Mobile File Open & Selection）

## Problem Statement

115master 的 MASTER SPA 文件列表（drive 页）当前在**移动端基本不可用**：用户对着文件夹或文件，唯一的交互是「点一下 → 选中」，然后就卡死了——既进不去文件夹，也打不开视频 / 图片 / 文档，连重命名 / 删除都够不着。

根因是整套交互为桌面键鼠设计，在触屏上全部落空：

- **打开靠双击**（`FileItem` 的 `handleDblClick → open()`），而移动端没有双击手势，快速双击会被浏览器拦截或解释为缩放。
- **操作菜单靠右键**（`useContextmenu` 监听 `contextmenu` + `mouseup`），移动端没有右键，长按普通列表项也不可靠触发 `contextmenu`。
- **选中指示靠 hover**（`FileItemCheckbox` 的 `opacity-0 group-hover:opacity-100`），移动端没有 hover，复选框永远不可见。
- 选中后底部虽有操作配置（`actionConfig`），但**唯独没有「打开」**，且桌面端同样依赖双击——与现代 Web 文件管理器（单击打开）的习惯相悖。

用户希望：在移动端能像原生文件 App 一样**单击打开**文件夹 / 文件，**长按**进入多选并就地完成重命名 / 删除 / 移动等批量操作；桌面端也统一到单击打开，去除双击依赖。

## Solution

把文件项的指针交互统一重设计为「**默认态：单击打开**」+「**选择模式：承载多选与批量操作**」两态模型，并以显式 `selectMode` 状态收口：

- **默认态**：单击文件项 = 打开。打开语义统一走既有的 `useFileItem.open()`，它已覆盖全部类型——文件夹 → 进入目录（路由 push `/drive/:cid`）、视频 → 播放页、支持文档 → 新标签打开、图片 → folder preview / Fancybox、其余 → 「暂不支持」提示。
- **选择模式**：
  - **进入**：移动端**长按**任一项；桌面端**点复选框 / Ctrl(⌘) 点 / Shift 点 / 框选**（框选沿用既有 `useMarqueeSelect`，仅桌面）。
  - **模式内单击** = 切换该项选中（不清空其他）；所有项的复选框**常驻可见**；底部接入现成但尚未启用的 `FileActionBar`（复用 `actionConfig`）；移动端顶部出现「完成 · 已选 N 项」栏。
  - **退出**：点「完成」、按 ESC、或点列表外空白；**选中归零不自动退出**（需显式 mode flag，避免「取消最后一个」意外退出）。
- **双击废弃**；但保留「非信任点击（`!e.isTrusted`，自动化触发）→ 直接 open」的分支，供程序化点击使用。
- **`FileBroswer`（`pathSelect=true`，即「移动到 / 另存为」目录选择器）保持现状**：那里单击文件夹已能进入、文件本就不该打开（选路径场景），不在本次改造范围。

建立在已落地的 `useFileItem.open()`（统一打开入口）、`FileActionBar`（底部操作栏组件，当前仅导出未接入）、`actionConfig`（操作配置模型）、`useListSelection`（多选原语）之上：本次只重设计指针分流与选择模式状态，不新增任何数据层能力。

## User Stories

1. 作为移动端用户，我想单击一个文件夹直接进入它，这样我能像原生文件 App 一样浏览目录树
2. 作为移动端用户，我想单击一个视频文件直接进入播放页，这样我不必依赖双击（移动端根本没有）
3. 作为移动端用户，我想单击一个图片文件直接弹出图片预览，这样我能快速看图
4. 作为移动端用户，我想单击一个文档（pdf/doc 等）在新标签打开，这样我能阅读
5. 作为移动端用户，我想单击一个暂不支持的类型时收到「暂不支持打开」提示，这样我理解为什么没反应而不是以为卡了
6. 作为移动端用户，我想长按一个文件项进入多选模式并把该项选中，这样我用一个手势就能开始批量操作
7. 作为移动端用户，我想进入选择模式后单击其他项是切换选中（而非打开），这样我能高效勾选多个文件
8. 作为移动端用户，我想进入选择模式后所有项的复选框常驻可见，这样我清楚哪些被选中、还能点哪里
9. 作为移动端用户，我想选择模式底部出现操作栏（置顶 / 星标 / 移动 / 重命名 / 打标签 / 删除），这样我不必依赖右键菜单（移动端没有）
10. 作为移动端用户，我想选中恰好 1 项时底部出现「重命名」，这样我对单文件的重命名触手可及
11. 作为移动端用户，我想顶部有「完成」按钮退出选择模式，这样我有明确的退出入口
12. 作为移动端用户，我想点列表外的空白也能退出选择模式，这样我能凭直觉收手
13. 作为移动端用户，我想按 ESC 退出选择模式，这样接外接键盘时也能退出
14. 作为移动端用户，我想「取消最后一个选中项」不会自动退出选择模式，这样我想重新挑选项时不会被踢回默认态
15. 作为移动端用户，我想长按和滚动不冲突——手指滑动超过阈值就取消长按，这样我正常滚动列表时不会误进选择模式
16. 作为移动端用户，我想长按不会触发系统级长按菜单（放大镜 / 呼出选择），这样我的长按手势不被浏览器劫持
17. 作为桌面端用户，我想单击文件项直接打开（文件夹进入 / 文件预览或播放），这样我摆脱双击习惯、与现代 Web 文件管理器一致
18. 作为桌面端用户，我想 hover 文件项时复选框显出、点击它进入选择模式，这样我仍能做多选
19. 作为桌面端用户，我想 Ctrl(⌘) + 点击切换某项选中（不清空其他），这样我精确增减选中
20. 作为桌面端用户，我想 Shift + 点击做区间选中，这样我快速选中一段连续文件
21. 作为桌面端用户，我想用鼠标框选多个文件，这样我批量选中可视区域内的项（既有能力不退化）
22. 作为桌面端用户，我想选择模式下底部出现 `FileActionBar`，这样我的批量操作入口与移动端一致
23. 作为桌面端用户，我想按 ESC 或点空白退出选择模式，这样我不必找「完成」按钮（桌面顶部不强制显示完成栏）
24. 作为常用快捷键的用户，我想 Cmd/Ctrl + A 仍能全选、ESC 仍能清空，这样既有快捷键不退化
25. 作为键盘用户，我想复选框可聚焦、Enter 打开该项、空格切换选中，这样我不依赖鼠标也能操作
26. 作为依赖自动化的用户 / 脚本，我想程序化触发的点击（非信任点击）仍能直接打开文件，这样既有自动化行为不破坏
27. 作为「移动到 / 另存为」目录选择器的使用者，我想该场景（pathSelect）的交互不被本次改造影响（单击文件夹仍进入、文件仍不打开），这样路径选择场景保持稳定
28. 作为用户，我想进入选择模式后底部操作栏的按钮有 loading 态防重复提交，这样我不会误点多次
29. 作为用户，我想操作完成后选中态按各操作的既有契约处理（成功移除 / 保留失败项等），这样批量反馈与现有一致
30. 作为用户，我想选择模式的进入 / 退出在桌面与移动端语义一致（仅触发手势不同），这样我不必记两套心智模型
31. 作为用户，我想「暂不支持打开」的提示复用项目既有 Dialog，而不是浏览器原生 alert，这样视觉与其他提示一致
32. 作为用户，我想单击打开发生时若当前有搜索词，仍按既有行为清空搜索词，这样打开上下文不被搜索态干扰

## Implementation Decisions

### 功能边界

- 首版范围：drive 主文件列表（`pathSelect=false`）的指针交互重设计——默认态单击打开、选择模式多选 + 底部操作栏。
- **不做**：`FileBroswer`（`pathSelect=true`）场景改造；移动端框选（移动无框选，保持桌面 only）；iOS 式「长按弹快捷菜单」（已被「长按仅进选择模式」取代）；新建 `useBatch` / `<StateView>` 等基础设施。

### 打开语义：统一走 `useFileItem.open()`

- 默认态单击文件项 = 调用既有 `useFileItem.open()`。它已按文件类型分流：文件夹 → `router.push('/drive/:cid')`；视频 → `router.push('/video/:pc')`；支持文档 → `window.open` 打开文档 URL；图片（`data.u`）→ folder preview / Fancybox；其余 → `useDialog.alert`「暂不支持打开该文件类型」。
- **打开层零新增逻辑**：本次不为「打开」写任何新分支，完全复用 `open()`。文件夹与文件的单击都收敛到同一个 `open()` 调用。

### 指针分流：`useListSelection` 改造（核心）

- `useListSelection.handleClick` 的 plain click 分支语义改为由 `{ pathSelect, selectMode }` 二维决定：
  - `pathSelect=true`（FileBroswer 选路径） → **radio**（clear + 单选），现状不变；
  - `pathSelect=false` + 默认态 → **`onOpen(item)`**；
  - `pathSelect=false` + 选择模式 → **toggle(item, !has)**，不清空其他。
- Shift / Meta·Ctrl 分支**不变**（区间选中、切换选中）。
- `onOpen` 作为 `UseListSelectionOptions` 的**可选回调**注入（`onOpen?: (item) => void`），hook 仍不含副作用、可在 node 环境零 mock 测。
- `selectMode` 作为 `() => boolean` getter 注入（getter 形式以读取外部 ref，避免闭包陈旧值）。
- `pathSelect` 既有为 getter，保持。
- 现有 `itemProps` 的「落在 input/button/label 交由控件自身处理」逻辑保留；其 `onClick` 在非交互区触发 `handleClick` 的行为不变，只是 `handleClick` 内部分流变了。

### 选择模式状态

- 因「选中归零不自动退出」契约，**必须用显式 `selectMode` 标志**（`ShallowRef<boolean>`），不能靠 `selection.size > 0` 隐式判断。
- 状态归属：挂在文件列表交互层（`useFileList` 或 drive 交互编排），与既有 `containerRef` / `contextmenuShow` 同层；不进 drive store 的持久化层（选择模式是临时交互态，不跨路由保留）。
- 进入：移动长按（见下）、桌面点 checkbox / Ctrl 点 / Shift 点 / 框选——任一产生选中时置 `selectMode=true`。
- 退出：点「完成」、ESC、点列表外空白 → `selectMode=false` 且 `selection.clear()`。
- 进入时若由长按 / checkbox 触发，同步选中该项（toggle true）。

### 长按：新增 `useLongPress`

- 基于 pointer events（`pointerdown` / `pointermove` / `pointerup` / `pointercancel`），约 500ms 阈值触发。
- **滚动冲突消解**：`pointermove` 累计位移超过约 10px 即判定为滚动、取消长按计时。
- 触发动作 = 进入选择模式 + 选中该项。
- **抑制系统长按**：对文件项根元素施加 `-webkit-touch-callout: none` / `user-select: none` / `touch-action` 合理取值，避免移动浏览器放大镜或文本选择劫持手势。
- 仅在移动端（`breakpoints.smaller('sm')`）启用长按；桌面端不挂载（避免与框选 / 单击歧义）。桌面多选走 checkbox / 修饰键 / 框选。

### `FileItem` 改造

- `handleClick`：按 `pathSelect` / `selectMode` / 信任度分流——
  - `pathSelect=true` → 维持现状（交 `onClick` 给路径选择器）；
  - `!e.isTrusted`（自动化点击）→ 直接 `open()`；
  - 默认态 → `open()`；
  - 选择模式 → 走 `useListSelection` 的切换选中路径。
- `handleDblClick`：**移除**（双击废弃）。`onDblclick` 绑定删除。
- 长按事件接入新的 `useLongPress`（移动端）。
- `useContextmenu`（桌面右键菜单）**保留**——桌面右键仍是打开操作菜单的入口之一，与选择模式并行（右键单项时也选中该项，沿用既有 `handleContextmenu` 语义）。

### 复选框显隐：`FileItemCheckbox`

- `v-show` 规则改为：「`pathSelect` 隐藏」||「默认态且移动端隐藏」||「选择模式常驻」。
- 即桌面默认态仍 hover 显出（既有 `opacity-0 group-hover:opacity-100` 保留）；移动默认态完全隐藏；任一端进入选择模式则全部项常驻可见。
- 既有键盘行为（Enter 打开、空格切换）保留。

### 底部操作栏：接入 `FileActionBar`

- drive 页在选择模式（或 `selection.count > 0`）时挂载 `FileActionBar`，传入既有 `actionConfig`（`top` / `star` / `move` / `improve` / `rename` / `tag` / `delete`）。
- 复用 `FileActionBar` 既有的分组、loading、`max-sm:btn-md` 移动端尺寸适配，零改造。
- 各 action 的 `onClick` 沿用 drive 现有 `actionHandlers`（`batchTop` / `batchStar` / `batchMove` / `improve` / `rename` / `batchTag` / `batchDelete`），操作完成后的选中态处理沿用既有契约（如移除成功项、保留失败项）。
- **不新增「打开」action**：默认态单击即打开，选择模式内打开应先退出模式（与 iOS 文件 App 选择模式心智一致）。

### 顶部「完成」栏（移动端 only）

- 移动端在选择模式显示「完成 · 已选 N 项」顶栏（置于 `ListHeader` 区域或独立浮动条）。
- 「完成」= 退出选择模式（`selectMode=false` + `selection.clear()`）。
- **桌面端不显示**该栏：桌面靠 ESC + 点空白 + 底部 `FileActionBar` 收口，不占顶部空间。

### 点列表外空白退出

- 在列表滚动容器（或 Main 区域）监听点击，命中区域为列表项外空白时退出选择模式。
- 需排除：点击 `FileActionBar` / 顶部栏 / Dialog / 弹层等不触发退出（通过 `closest` 或事件冒泡判断，与 `useListSelection.itemProps` 既有的交互区排除范式一致）。

### `FileBroswer`（`pathSelect=true`）保持现状

- 该场景是目录选择器，单击文件夹进入（既有 `handleClickItem` 的 `fc===0 → push`）、单击文件无反应，符合选路径语义，不改。
- 其复选框本就 `v-show={!pathSelect}` 隐藏，本次 `v-show` 规则改动须保证 `pathSelect=true` 时仍隐藏（规则首项即「pathSelect 隐藏」）。

### 错误处理（遵循 ADR-0001）

- 打开操作本身（`open()` 内的 `router.push` / `window.open` / dialog）不产生需归一的 `Drive115Error`；批量操作的错误管道沿用各 `actionHandlers` 既有处理（`handle()` 边界归一、UI 据 `action` 分流）。
- 本次改造不改变错误范式，与 ADR-0001 兼容。

## Testing Decisions

### 好测试的标准

- 只测**外部行为**（纯逻辑输入 → 输出），不测实现细节、私有方法、调用次数、DOM 结构等脆弱耦合。
- 决策逻辑刻意与 pinia / drive115 / router / DOM 解耦，node 环境可直接跑、零 mock。

### 唯一测试 seam

- **`useListSelection` 的点击分流**（复用现有 `hooks/useListSelection/__tests__/useListSelection.test.ts`）。
- 之所以单一 seam：本功能的全部业务规则——plain click 在「选路径 / 默认打开 / 选择模式切换」三态间的分流、修饰键行为不退化——都收敛于 `handleClick`；长按 / selectMode 编排 / 底部栏 / 顶部栏属胶水与样式，测它们需 `@vue/test-utils` + `happy-dom`（项目无），且脆弱。

### 覆盖项

- `pathSelect=true` + plain click → radio（clear + 单选），保既有路径选择场景语义。
- `pathSelect=false` + 默认态 + plain click → `onOpen` 被调用一次、参数为该项；`toggle` / `clear` 不被调用。
- `pathSelect=false` + 选择模式 + plain click → `toggle(item, !has)`，`clear` 不被调用。
- Meta / Ctrl 点击 → toggle 不清空（既有，不退化）。
- Shift 点击 → 区间 toggle(true)（既有，不退化）。
- `resetAnchor` 后 Shift → 降级（既有，不退化）。
- `selectAll` 缺省迭代 / 直传（既有，不退化）。
- `itemProps` 落地 `data-selection-key`、非交互区触发 `handleClick`、落在 input/button/label 不触发（既有，不退化）。
- 越界项 → no-op（既有，不退化）。
- `onOpen` 缺省时默认态 plain click 不抛错（向后兼容 FileBroswer 等不注入 onOpen 的调用方——但 FileBroswer 走 pathSelect 分支，不触达 onOpen）。

### Prior art

- `apps/monkey/src/hooks/useListSelection/__tests__/useListSelection.test.ts`——直接复用的 seam，mock `useMagicKeys` + `useMarqueeSelect`，`effectScope` 跑 hook、断言 adapter 调用。
- `apps/monkey/src/__tests__/scheduler-error.test.ts`——monkey 侧纯逻辑测试先例。
- `.scratch/file-tagging/spec.md` 的 Testing Decisions——「唯一纯函数 seam + 不测胶水 / 组件 / E2E」同策略。

### 不测

- `useLongPress`（pointer / touch 交互，与既有 `useMarqueeSelect` 同级、不单测）。
- `selectMode` 进入 / 退出编排（长按触发、完成按钮、点空白、ESC）——属组件胶水。
- `FileActionBar` / 顶部完成栏 / checkbox 的显隐——类名与 CSS，非行为。
- 组件渲染——项目无 `@vue/test-utils` / `happy-dom` 基础设施。
- E2E——无自动化测试基础设施。

## Out of Scope

- `FileBroswer`（`pathSelect=true`，目录选择器）场景的交互改造。
- 移动端框选（移动无框选；保持桌面 only）。
- iOS 式「长按弹单项快捷菜单」（已被「长按仅进选择模式 + 底部操作栏」取代）。
- 选择模式下的「全选」按钮（Cmd/Ctrl+A 快捷键已覆盖，UI 按钮留待需求驱动）。
- `useBatch` / `<StateView>` / `<Skeleton>` 基础设施落地。
- 组件单元测试、E2E 自动化测试基础设施引入。
- 数据层（store / drive115）任何改动——打开完全复用既有 `open()`。
- `actionConfig` 操作集合的新增或调整（仅消费既有集合）。

## Further Notes

### 与既有 specs / 落地能力的关系

- 复用 `.scratch/file-tagging/spec.md` 落地的 `actionConfig.tag` 项与 `useTagAction` 编排——本次接入 `FileActionBar` 后，打标签操作在底部栏自然可达。
- 复用 `.scratch/tag-management/spec.md` 落地的标签体系。
- 复用 `.scratch/drive-list-cache/spec.md` 的列表刷新契约——操作完成后 `afterAction()` / 各 `apply*Mutation` 沿用。

### 主要风险

1. **长按与浏览器原生手势冲突**：移动浏览器长按可能触发系统级放大镜 / 文本选择 / 图片保存。缓解：文件项根元素加 `-webkit-touch-callout: none` / `user-select: none`，并在真机验证缩略图（`<img>`）上的长按不被劫持。
2. **长按与列表滚动冲突**：阈值（500ms / 10px）需真机校准，避免正常滚动误进选择模式或长按难以触发。
3. **`useListSelection` 双调用方语义**：该 hook 同时服务 drive（`pathSelect=false`）与 `FileBroswer`（`pathSelect=true`）。改造须保证 `pathSelect=true` 分支语义零变化，目录选择器行为不退化。
4. **`selectMode` 显式标志的生命周期**：跨 cid 切换 / 列表刷新时需正确重置（既有 `watch(nav.cid, () => { selection.clear(); resetAnchor() })` 处须同时清 `selectMode`）。

### 开发顺序（垂直切片 · 联调点 ⚙）

1. **分流切片**：`useListSelection` 改造（`onOpen` / `selectMode` 注入 + plain click 二维分流）+ 更新单测——无联调，先固化语义。
2. **桌面单击打开切片**：drive 默认态单击 → `open()`；移除 `handleDblClick`；保留 `!isTrusted` 分支 ⚙ 联调各类型打开（文件夹 / 视频 / 图片 / 文档 / 不支持）。
3. **选择模式状态切片**：`selectMode` ref + 进入 / 退出（完成按钮移动端、ESC、点空白）+ checkbox 常驻规则。
4. **长按切片** ♙ 联调 `useLongPress` 阈值 / 滚动取消 / 系统手势抑制（真机）。
5. **底部操作栏切片**：接入 `FileActionBar` + 复用 `actionConfig` / `actionHandlers` ⚙ 联调批量操作在移动端的可达性与反馈。
6. **收尾**：顶部完成栏（移动）、点空白退出边界、`-webkit-touch-callout`、aria / 键盘可达性、`pnpm lint && pnpm type-check && pnpm build`。

### 待定的执行细节

- 联调触点：`pnpm dev` 跑起后，用户手动真机 / 模拟器操作 vs agent 用 Playwright 连用户浏览器操作（移动端手势 Playwright 模拟受限，长按 / 触摸可能需真机）——在第一个联调点前确定（同 file-tagging spec 约定）。

## Comments

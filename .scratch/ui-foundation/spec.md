Status: ready-for-agent

# 应用无关的 UI 基础包

## Problem Statement

115Master 当前的 Button、Pill、Tooltip、Dialog、主题、Glass 材质和 Storybook 都归属于 Monkey 应用。组件通过应用内相对路径消费，Tooltip 假定存在 Monkey 的挂载节点，Dialog 服务直接依赖应用路由并保留模块级状态，主题和组件样式也由应用入口统一承担。这使本可复用的视觉语义、交互契约和运行时行为与单一应用耦合，无法被第二个应用、独立 Story 或测试环境可靠消费。

现有 UI 事实还分散在组件源码、应用 CSS 和 agent skills 中：公共与局部视觉值边界不清，Glass 类名属于应用命名空间，技能可能重复记载具体样式值。Monkey Storybook 同时承担基础组件与应用集成展示，但缺少真实浏览器中的自动交互和可访问性门禁。随着组件继续演进，这些问题会扩大主题漂移、DOM 假设、深层导入和迁移成本。

用户需要一个基于 Tailwind CSS 与 daisyUI 的应用无关 UI 基础包，以最小的完整迁移将 Button、Pill、Tooltip 和 Dialog 的所有权从 Monkey 切出；同时建立 Design Token、独立 Storybook、窄公共入口和清晰的技能规范，使后续应用复用与 UI 演进建立在同一套事实和测试接缝上。

## Solution

新增 workspace-private 的 `@115master/ui` UI 基础包。包统一拥有 Tailwind CSS、daisyUI、light/dark Theme、Design Token、Glass 材质、核心组件、Dialog 原语与工厂式命令服务，并以 ESM、类型声明和可编译公共样式入口提供稳定的公共 UI 契约。

首批公共组件仅包含 Button、Pill、Tooltip、Dialog、DialogHost 和 OverlayHost；公共服务仅包含 `createDialogService` 与 `useDialog`。Monkey 直接切换到包根命名导出，不保留应用内兼容壳。应用专属的路由历史、背景 mesh、图标注册、页面样式与未形成公共契约的 daisyUI overrides 继续留在 Monkey。

UI 包建立独立 Storybook，将基础 Story 作为唯一行为测试接缝，在真实 Chromium 中对 light/dark 两个 Theme 自动执行 smoke、play 交互与可访问性检查。Monkey Storybook 只保留集成 Story。同步重写 UI/UX、Glass 和 Storybook skills，并新增 Design Token skill，使 skills 只规定语义、边界和工作流，具体视觉值始终以 UI 源码为唯一事实来源。

## User Stories

1. 作为应用开发者，我想从一个应用无关的 UI 基础包消费核心组件，以便新应用无需复制 Monkey 实现
2. 作为应用开发者，我想只从包根使用命名导出，以便内部目录调整不会破坏消费代码
3. 作为应用开发者，我想通过单独的公共样式入口启用 Tailwind、daisyUI、Theme、Design Token 和 Glass，以便只配置一条共享样式管线
4. 作为应用开发者，我想继续使用未封装的 daisyUI 组件类，以便最小迁移不会迫使 Monkey 一次封装全部 UI
5. 作为应用开发者，我想在公共样式之后追加应用样式，以便页面布局、背景和业务视觉仍由应用控制
6. 作为组件维护者，我想让 UI 源码成为 Design Token 具体值的唯一事实来源，以便代码和技能不会维护相互漂移的数值
7. 作为组件维护者，我想优先复用 daisyUI 已有的语义变量，以便不制造同义 token 层
8. 作为组件维护者，我想只在 daisyUI 缺少公共概念时增加 `--ui-*` token，以便公共视觉语言保持精简
9. 作为组件维护者，我想让局部值在出现第二个真实消费者或跨组件语义后再提升，以便首版不会预设庞大的 token 表
10. 作为样式维护者，我想让所有非 daisyUI 的公共类、变量和 data attributes 使用 UI Namespace，以便用户脚本注入宿主页面时降低级联碰撞
11. 作为主题使用者，我想默认获得 light Theme 并在系统偏好暗色时获得 dark Theme，以便未显式配置也有合理呈现
12. 作为应用开发者，我想让显式 `data-theme` 覆盖系统偏好，以便应用能够稳定控制主题
13. 作为 UI 评审者，我想在独立 Storybook 中查看 token、Glass 与核心组件的基础 Story，以便不依赖 Monkey 业务环境
14. 作为 Monkey 维护者，我想让 Monkey Storybook 只验证应用集成，以便基础组件 stories 不在两个环境重复
15. 作为 CI 维护者，我想在真实 Chromium 中运行 UI stories，以便原生 Dialog、Teleport、定位和焦点行为由真实平台验证
16. 作为 CI 维护者，我想让同一套 UI 行为在 light 与 dark 两个 Theme 下自动执行，以便主题差异不会隐藏交互和可访问性问题
17. 作为键盘用户，我想通过焦点打开 Tooltip 并通过 blur 或 Escape 关闭，以便无需鼠标也能读取补充说明
18. 作为鼠标用户，我想 Tooltip 在短暂停留后打开并稍延迟关闭，以便避免指针偶然经过时闪烁
19. 作为窄视口用户，我想 Tooltip 在空间不足时自动翻转和偏移，以便内容不会溢出屏幕
20. 作为滚动容器用户，我想 Tooltip 在滚动、resize 和布局变化时跟随锚点，以便提示始终指向正确目标
21. 作为辅助技术用户，我想 Tooltip 使用真实内容、tooltip role 与锚点 ARIA 关联，以便说明能被正确识别
22. 作为组件开发者，我想空 Tooltip 内容不创建浮层或 ARIA 关联，以便不存在无意义的可访问性引用
23. 作为组件开发者，我想 Tooltip 只承载非交互补充说明，以便交互内容不会伪装成 Tooltip
24. 作为应用开发者，我想通过 Overlay Host 将浮层渲染到当前 Theme 作用域，以便 Teleport 后仍继承正确主题
25. 作为应用开发者，我想为单个 Tooltip 覆盖目标，并在无 Host 时回退到 body，以便嵌入场景仍可工作
26. 作为组件使用者，我想 Button 始终渲染原生按钮并默认 `type="button"`，以便动作语义明确且不会意外提交表单
27. 作为组件使用者，我想继续使用 Button 的 color、variant、size、shape、active、block、loading 与 disabled 状态，以便现有视觉与交互能力完整迁移
28. 作为组件使用者，我想 Button 支持普通、link 视觉和 Glass 视觉但不承担导航，以便动作与链接语义不混淆
29. 作为组件使用者，我想 Pill 作为 span、div 或链接容器呈现信息与组合内容，以便胶囊几何不被误用为按钮动作
30. 作为组件使用者，我想继续使用 Pill 的尺寸以及 plain 和 Glass 变体，以便现有信息展示保持一致
31. 作为应用开发者，我想直接使用受控 Dialog 原语，以便组件状态可以声明式管理
32. 作为应用开发者，我想优先通过配置对象调用 alert、confirm、prompt 和自定义 Dialog，以便常见流程无需手动维护状态
33. 作为应用开发者，我想通过工厂创建独立 Dialog 服务实例，以便不同应用、Story 和测试之间没有模块级全局状态
34. 作为 Vue 组件开发者，我想通过注入获得当前 Dialog 服务，以便组件调用与当前应用实例绑定
35. 作为非组件代码开发者，我想持有工厂返回的 Dialog 服务实例，以便无需依赖 Vue setup 上下文
36. 作为国际化应用开发者，我想在创建服务时注入 Dialog 文案集并允许单次覆盖，以便 UI 包不内置中文或英文
37. 作为应用开发者，我想以文本、Vue 节点或 render function 提供标题、内容与按钮文案，以便简单与复杂内容使用同一契约
38. 作为应用开发者，我想让复杂组件通过 Vue 组合能力传入 Dialog，以便服务不维护特殊的 Component 分支
39. 作为应用开发者，我想让异步确认自动显示 loading、阻止重复提交并等待结果，以便每个调用点不重复实现 pending 状态
40. 作为应用开发者，我想让确认回调返回 `false` 时保持 Dialog 打开，以便业务校验可以阻止关闭
41. 作为应用开发者，我想在异步确认失败时通过调用方 `onError` 处理反馈，以便 UI 包不猜测错误呈现方式
42. 作为用户，我想在异步确认 pending 时无法通过按钮、Escape 或蒙层意外关闭，以便操作结果不会丢失或重复
43. 作为系统维护者，我想在 pending 时仍能程序化关闭或销毁 Dialog，以便超时、取消请求和应用卸载可以完成收尾
44. 作为用户，我想嵌套 Dialog 只让栈顶可交互并在关闭后恢复下层焦点，以便反馈流程不会破坏上下文
45. 作为应用开发者，我想按后进先出关闭全部 Dialog，以便应用卸载或场景切换时状态清理可预测
46. 作为应用开发者，我想让 alert resolve `void`、confirm 返回布尔值、prompt 返回字符串或 `null`，以便取消属于正常结果而非异常
47. 作为应用开发者，我想让自定义 Dialog 返回一次性 handle 以及结构化关闭原因，以便能观察 confirm、cancel、Escape、蒙层、程序关闭、销毁与 close-all
48. 作为应用开发者，我想让 handle 的 `closed` 只结算一次且关闭后不能重新打开，以便生命周期没有复用歧义
49. 作为用户，我想在单字段 Prompt 中获得可识别的输入标签与必填错误，以便输入流程可访问且失败原因清晰
50. 作为键盘用户，我想单行 Prompt 用 Enter 提交、多行 Prompt 用 Enter 换行并用 Ctrl/Cmd+Enter 提交，以便输入习惯符合字段类型
51. 作为移动端用户，我想 Dialog 从底部呈现并让操作触手可及，以便在窄屏上易于使用
52. 作为桌面用户，我想 Dialog 在较宽视口居中并支持 md、lg、xl 与 full 尺寸，以便不同内容密度有明确容器
53. 作为减少动态效果的用户，我想 Dialog 打开与关闭立即完成，以便界面遵循系统偏好
54. 作为应用开发者，我想 Dialog 生命周期按真实 transition 完成而非固定延时结算，以便样式变化不会造成过早销毁或悬挂
55. 作为 Monkey 用户，我想迁移后核心控件的功能、主题和响应式表现保持一致，以便架构调整不改变既有任务流
56. 作为 Monkey 维护者，我想将浏览器历史关闭能力保留在 App Dialog Adapter，以便 UI 基础包不依赖 Vue Router
57. 作为 Monkey 维护者，我想保留 range、skeleton、input 与 textarea 的应用 overrides，以便未形成公共契约的样式不会被错误提升
58. 作为包维护者，我想让开发、测试、Storybook、类型检查和生产构建都消费真实 dist exports，以便源码 alias 不会掩盖分发问题
59. 作为包维护者，我想让 UI 的 watch build 提供开发增量更新，以便 dist-first 消费仍有可接受的反馈速度
60. 作为服务端渲染或 Node 工具使用者，我想安全 import UI 模块而不立即访问 DOM，以便类型、服务工厂和组件定义可以在非浏览器环境加载
61. 作为应用维护者，我想由应用选择旧浏览器 polyfill，以便 UI 包不注入隐式全局副作用
62. 作为图标系统维护者，我想 UI 组件通过 slots 接受图标内容且不依赖具体图标库，以便 Monkey 的图标 registry 保持应用所有权
63. 作为 agent，我想通过重写后的 UI/UX skill 判断公共组件、daisyUI 和自定义 CSS 的优先级，以便 UI 变更遵循一致决策顺序
64. 作为 agent，我想通过 Design Token skill 审核语义、复用和提升条件，以便不会把任意值机械地全部 token 化
65. 作为 agent，我想通过 Glass skill 按 surface、inset、floating、overlay 与 panel 场景选择材质，以便滤镜、边框、高光与阴影保持一致
66. 作为 story 作者，我想通过更新后的 Storybook skill 判断基础 Story 与集成 Story 的归属，以便两个 Storybook 不产生重复契约

## Implementation Decisions

### 包边界与所有权

- 新建 `@115master/ui`，首期作为 workspace-private 包使用，但具备完整 exports、构建产物和类型声明。
- UI 基础包必须应用无关，不能依赖 Monkey 挂载节点、Vue Router、GM API、业务状态、业务文案或图标 registry。
- 最小迁移指最小的完整组件集合，而不是最少改动文件数。迁移集合内的源码、测试、stories、样式和所有消费入口一起切换所有权。
- Monkey 直接消费 UI 包，不保留 Button、Pill、Tooltip 或 Dialog 的本地转发壳。
- Monkey 的应用背景 mesh、页面样式、router history 集成、图标系统和其他业务适配继续留在应用层。
- 删除已经确认无实际视觉作用的第三方液态玻璃依赖、失效的 SVG distortion filter 组件及应用根挂载。

### 公共 UI 契约

- 公共组件固定为 Button、Pill、Tooltip、Dialog、DialogHost 和 OverlayHost。
- 公共服务固定为 `createDialogService` 与 `useDialog`。
- 公共类型只覆盖组件 Props、组件枚举联合、Dialog 文案集、各类 Dialog options、Dialog outcome、Dialog close reason、Dialog service 和 Dialog handle。
- 所有 JavaScript API 与类型从包根命名导出；公共样式从独立的 styles export 导入。
- 不提供默认导出、组件深层导入、通配 subpath exports、内部 Dialog 子组件、公开 provide 方法或默认 Dialog 单例。
- 包仅输出 ESM，不输出 CommonJS、UMD 或浏览器全局格式。
- UI 组件使用 TSX，服务、状态与类型使用 TypeScript。

### 公共样式与 Design Token

- UI 包拥有唯一公共 Tailwind/daisyUI 样式入口，并显式登记 UI 产物为 Tailwind source。
- 样式职责拆分为入口、Theme、Design Token、Glass 和组件扩展五层；对外仍只暴露单一公共样式入口。
- 保留完整 daisyUI 组件 CSS，同时继续排除 daisyUI scrollbar，确保 Monkey 尚未封装的 daisyUI 用法继续生效。
- Theme 提供 light default 和 dark prefers-dark；消费方显式 `data-theme` 始终优先。
- daisyUI 语义颜色、圆角和基础控件尺寸作为公共基础，不建立同义 `--ui-*` 别名。
- 只有 daisyUI 缺失且确有跨组件或跨材质语义的视觉决策才建立公共 UI Token。
- 组件和材质内部适配值可以是内部 Token，不构成消费方契约。
- 局部视觉值在出现第二个真实消费者或形成跨组件语义时执行 Token 提升。
- 颜色、圆角、阴影、层级、动效和材质等共享视觉决策必须使用 token；只服务单一布局的局部几何值可以保留。
- 非 daisyUI 的类、CSS 自定义属性与 data attributes 分别使用 `ui-*`、`--ui-*` 与 `data-ui-*`。
- Button、Pill 与 Glass 的旧应用前缀直接更名，不保留 CSS 别名。
- 现有 daisyUI overrides 只迁移 Button 与 Pill 的公共几何；range、skeleton、input 与 textarea 仍作为 Monkey 应用 overrides，并重命名原应用样式文件以反映剩余职责。

### Glass 材质

- Glass 按 surface、inset、floating、overlay 与 panel 的承载场景表达材质，不以零散透明度工具类表达。
- 材质统一负责前景、背景、边框、高光、阴影和 backdrop-filter。
- 同一视觉区域仅最外层承载 Glass filter，内部元素不重复叠加背景模糊。
- Dialog 外壳使用 panel Glass；Button 与 Pill 保留对应 Glass 变体。
- Glass 视觉值只存在于 UI 源码，skills 不复制具体数值。

### Button

- Button 始终渲染原生 `<button>`，默认 `type="button"`，不支持 router-link 或 `<a>` 多态。
- 保留现有 color、variant、size、shape、active、block、loading 与 disabled 公共能力。
- Button 可以呈现 link 视觉和 Glass 视觉，但其语义始终是动作。
- 图标由 slots 组合，UI 包不引入图标依赖。

### Pill

- Pill 只作为信息、组合布局或导航容器，可渲染为 span、div 或 `<a>`。
- Pill 不承担按钮动作；需要动作时使用 Button。
- 保留现有尺寸以及 plain 和 Glass 变体。
- Pill 与 daisyUI Badge 保持不同领域含义，不将两者作为同义组件。

### Tooltip 与 Overlay Host

- Tooltip 使用 `@floating-ui/vue` 处理 offset、flip、shift 与 autoUpdate，daisyUI 只负责视觉。
- 公共 placement 只接受 top、right、bottom、left 四个首选方向，默认 bottom；实际位置允许自动翻转与偏移。
- 内容接受字符串 prop 和非交互 content slot。空内容不挂载浮层，也不建立 ARIA 关联。
- Tooltip 提供真实 tooltip role，并通过 ARIA 将锚点与浮层内容关联。
- Hover 默认延迟 400ms 打开、100ms 关闭；focus 立即打开，blur 与 Escape 立即关闭；单组件可以覆盖延迟。
- Tooltip 默认 Teleport 到当前主题作用域内最近的 Overlay Host，单组件可以覆盖 `to`，缺少 Host 时回退到 `document.body`。
- Overlay Host 不知道 Monkey 的 DOM id，Tooltip 不再依赖应用挂载节点。

### Dialog 原语

- Dialog 原语使用原生 `<dialog>`，以受控状态同步 `showModal()` 与 `close()`。
- Dialog 负责模态结构、焦点约束、Escape 语义、蒙层策略、可访问名称、事件以及关闭后的焦点恢复。
- 支持 md、lg、xl 与 full 尺寸；移动端底部呈现，sm 及以上居中。
- Dialog 外壳提供 panel Glass 和公共动作区域，业务内容自行管理内部布局和滚动。
- `closeOnEscape` 与 `closeOnBackdrop` 默认均为 true，并允许单次覆盖。
- CSS transition 状态驱动打开和关闭；opened 与 closed 在真实过渡结束后结算。
- transition 监听使用计算样式得到的时长作为安全兜底，不使用固定 300ms 延时。
- `prefers-reduced-motion: reduce` 时立即完成生命周期。
- 首批动画时长是内部 Token，不进入公共 Token。

### Dialog 服务

- UI 包同时拥有 Dialog 原语与应用无关命令式服务；应用代码优先使用配置对象调用。
- `createDialogService` 为每个应用、Story 或测试创建隔离实例，不存在模块级全局容器或 body fallback 单例。
- DialogHost 承载当前实例状态并渲染 Dialog Stack；`useDialog` 从当前 Vue 应用注入获得服务。
- 非组件代码直接持有工厂返回的服务实例。
- UI 包不内置任何语言。工厂必须接收 Dialog 文案集，单次调用允许覆盖相关文案。
- 标题、内容与按钮文案统一接受字符串、Vue VNodeChild 或无参 render function。
- 复杂组件由调用方使用 Vue 组合能力构建；服务不接受单独的 Component 特判。
- render function 故障交给调用方提供的 `onError`，UI 包不展示内置错误文案。
- 服务提供 alert、confirm、prompt、create 和 closeAll。
- alert 返回 `Promise<void>`；confirm 返回 `Promise<boolean>`；prompt 返回 `Promise<string | null>`。
- 取消、Escape、蒙层关闭和 close-all 是正常 Dialog Outcome，不因用户取消而 reject；仅配置错误、Host 缺失或内部故障 reject。
- create 立即显示 Dialog 并返回一次性 DialogHandle；handle 只提供 close、destroy 和只结算一次的 closed Promise，不支持 open 或复用。
- closed 返回结构化 Dialog Close Reason，覆盖 confirm、cancel、escape、backdrop、programmatic、destroy 与 close-all。
- confirm 的 `onConfirm` 支持同步或异步结果；返回 false 时 Dialog 保持打开。
- Promise pending 时确认按钮显示 loading、阻止重复提交，并禁用全部用户关闭路径。
- pending 期间仍保留程序化 close/destroy，用于超时、请求取消和卸载。
- 异步确认异常交给调用方 `onError`，服务不擅自打开 Toast 或错误 Dialog。
- Dialog Stack 按打开顺序管理；只有栈顶可交互，嵌套反馈关闭后恢复下层上下文与焦点。
- closeAll 按后进先出清理，并为每个 Dialog 结算 close-all 结果。

### Prompt Dialog

- Prompt 保留 defaultValue、placeholder、inputType、multiline、rows、required 和 maxLength。
- Prompt 必须具有可访问的 inputLabel，由单次配置或工厂 Dialog 文案集提供。
- required 失败时显示可访问错误，不再静默阻止关闭。
- 单行输入按 Enter 提交；多行输入按 Enter 换行，按 Ctrl/Cmd+Enter 提交。
- 首批只支持原生输入约束，不引入自定义校验器或表单引擎。
- 复杂校验、多字段输入或自定义布局通过 create 提供。
- Prompt 取消、Escape 或蒙层关闭返回 null。

### Monkey Dialog Adapter

- Monkey 提供 App Dialog Adapter，在 UI Dialog options 之上增加 `history?: boolean`。
- history 通过 Vue Router 和一次性 DialogHandle 生命周期实现；UI 包的 options 不包含 history。
- 浏览器后退关闭必须结算对应 Dialog Outcome，不能遗留未完成 Promise。
- 现有 Monkey 调用优先迁移到命令式配置对象；声明式 Dialog 只用于确有受控状态需求的场景。

### 构建与依赖

- 使用 Vite library mode 构建 ESM JavaScript，使用 vue-tsc 独立进行类型检查并生成声明。
- 公共 CSS 以保留 Tailwind、daisyUI、imports 和显式 source 注册的可编译样式复制到 dist；UI 包自身不生成最终 Tailwind bundle。
- Monkey 与 UI Storybook 在各自 Vite 构建中处理公共样式，使每个消费产物只有一条 Tailwind 管线。
- Vue、Tailwind CSS 与 daisyUI 是 peer dependencies；`@floating-ui/vue` 是 UI 包运行依赖；构建和 Storybook 工具是开发依赖。
- 开发、Storybook、测试、类型检查与生产构建全部消费真实 dist exports，不配置 UI 源码 alias。
- UI 包提供 watch build，根开发任务通过依赖图先构建并持续更新 UI 产物。
- UI 包模块求值阶段不得访问 window 或 document；DOM 能力仅在组件实际挂载后使用。
- 运行基线是支持原生 dialog、ResizeObserver、IntersectionObserver 和标准 Teleport DOM 的现代浏览器。
- UI 包不内置 polyfill；更旧浏览器由消费应用按兼容矩阵处理。

### Storybook 与工作区脚本

- UI 包拥有独立 Storybook，负责 token、Glass、Button、Pill、Tooltip、Dialog 与 Dialog 服务的基础 Story。
- Monkey Storybook 负责 UI 基础与应用状态、路由、业务组件和运行环境组合后的集成 Story，不重复基础矩阵。
- UI Storybook 启用官方 docs、a11y 与 Vitest addons，并使用 Playwright Chromium browser mode。
- UI browser tests 建立 light 和 dark 两个项目，对同一套 stories 执行 smoke、play 和 axe；可访问性违规视为错误。
- Monkey 集成 Storybook 首批不双主题自动执行。
- UI Storybook 使用 6006，Monkey Storybook使用 6007。
- 根 storybook 任务通过 Turbo 同时启动两套 Storybook，并保留两个包的定向启动命令。
- 根 build-storybook 任务构建两套静态 Storybook。
- UI 包 test 同时运行必要的单元检查和 Storybook browser tests。
- 首批不建立像素截图、云端视觉回归或跨平台截图基线；Glass、tokens 与组件矩阵保留双主题 Canvas 目检。

### Skills 与领域文档

- 重写 UI/UX parent skill，使其成为跨项目 UI 政策与子 skill 路由，包含语义、焦点、响应式、反馈与 transient UI 规则。
- UI 实现优先级固定为：已有公共 UI 契约、daisyUI 官方组件、Tailwind utilities、经 Token 审核的自定义 CSS。
- 新增 Design Token skill，负责识别公共/内部 token、复用 daisyUI 语义、审查任意值和执行 Token 提升；不复制源码数值。
- 更新 Glass skill，使其引用 Design Token 和 UI 源码，并维持场景材质、单层 filter 与主题验证规则。
- 更新 Storybook skill，使其能在 UI 基础 Story 与 Monkey 集成 Story 之间正确路由，并要求由 props、slots、emits 和服务行为形成契约覆盖。
- 涉及 Button、Pill 或 Dialog panel Glass 的后续改动必须同时遵循 Glass 与 Design Token skills。
- UI Foundation 加入 Context Map，并以领域词汇和 ADR 记录所有权、样式管线、Dialog、Tooltip、导出、构建、测试、命名空间和浏览器基线。

## Testing Decisions

### 好测试的标准

- 只断言用户和消费方可观察的外部行为，不测试私有响应式结构、内部组件拆分、CSS 实现细节、Floating UI 内部调用次数或定时器实现。
- 测试从公共 UI 契约进入，通过实际渲染、用户输入、键盘操作、焦点、ARIA、可见状态、Promise outcome 和公开事件观察结果。
- 基础 Story 必须 hermetic：不依赖 Monkey router、挂载节点、GM API、业务 store、外部网络或故事间共享状态。
- 同一契约通过 props、slots、emits、服务 options 和结果类型覆盖，避免为内部函数建立额外低层 seam。

### 唯一行为测试 seam

- 以 UI Storybook 的真实 Chromium browser tests 作为唯一行为测试 seam。
- 每个公共组件和 Dialog 服务都以基础 Story 表达公开状态与交互；关键流程通过 play function 驱动真实指针、键盘和焦点行为。
- 官方 a11y addon 在运行时执行 axe，违规按 error 处理。
- light 与 dark 两个 browser projects 执行同一套测试，确保 Theme 不改变交互契约或可访问性。
- 选择这一最高层 seam，可以同时覆盖 Vue 渲染、daisyUI 样式、可编译样式入口、Teleport、Floating UI、原生 dialog、Dialog Stack、焦点恢复和服务 Promise，而无需为每个内部模块重复建设测试。

### 行为覆盖

- Button：默认 button type、disabled、loading、防重复动作、各公共变体和 slot 内容。
- Pill：容器与链接语义、plain/Glass、尺寸，以及不产生按钮语义。
- Tooltip：hover 延迟、focus 立即打开、blur/Escape 关闭、空内容、ARIA 关联、四方向首选、边缘 flip/shift、滚动与 resize 跟随、Overlay Host 与 body fallback。
- Dialog 原语：受控打开关闭、原生 top layer、Escape/蒙层策略、标题与描述关联、初始焦点、焦点约束、关闭后恢复焦点、四种尺寸和响应式呈现。
- Dialog 服务：工厂隔离、Host 注入、非组件持有实例、文案集覆盖、alert/confirm/prompt outcome、create handle、结构化 close reason、closeAll LIFO。
- 异步 Dialog：false 阻止关闭、Promise loading、防重复提交、pending 锁定用户关闭路径、程序化收尾、onError。
- Dialog Stack：嵌套反馈、仅栈顶交互、关闭栈顶后恢复下层焦点。
- Prompt：inputLabel、必填错误、单行 Enter、多行 Enter、Ctrl/Cmd+Enter、取消结果和原生约束。
- Theme 与 Glass：两套 Theme 下公共 token 生效、材质内容可读、同一区域只有最外层 filter。
- 包导入：stories 必须通过正式包根 exports 和公共 styles export 消费，不走源码 alias。

### 编译与集成门禁

- 包构建验证 ESM、类型声明和可编译公共样式均进入 dist，exports 只包含约定入口。
- 类型检查验证公共 Props、服务 options、outcome 和 Monkey 迁移调用保持类型安全。
- 静态 Storybook 构建验证两套 Storybook 都能生成可部署产物。
- Monkey build、type-check 和现有测试验证应用通过真实 dist 成功消费，并确保 router adapter 与业务组件未因迁移破坏。
- lint 验证 TSX、TypeScript、CSS 命名空间和仓库风格。
- 这些属于编译与集成门禁，不新增第二个行为测试 seam。

### Prior art

- Monkey 已有 Button 与 Pill 的 jsdom/Vitest 行为测试，可用于识别现有外部契约并迁移测试意图。
- Monkey 已有 Dialog stories，可用于提取 alert、confirm、prompt 和自定义内容的基础场景，但基础 Story 的最终所有权转移到 UI Storybook。
- Monkey 已有 Storybook Theme toolbar 与应用集成 stories，可作为双 Storybook 分工和 Theme 控制的先例。
- 仓库现有 Turbo 包级 build、type-check、test 与 Storybook scripts 可作为新包接入工作区门禁的先例。

## Out of Scope

- 将 UI 包发布为公共 npm 包或提供稳定的跨仓库 semver 承诺。
- CommonJS、UMD、浏览器全局格式、默认导出、深层导入或通配 subpath exports。
- 一次迁移 Monkey 的全部共享组件或封装全部 daisyUI 组件。
- 将 range、skeleton、input、textarea、scrollbar、reset、应用背景 mesh 或页面布局样式提升到 UI 包。
- 将 Vue Router、GM API、Monkey store、业务文案或图标 registry 引入 UI 包。
- Button 的链接或 router-link 多态，以及 Pill 的按钮动作语义。
- 交互式 Tooltip、Popover、Menu 或其他浮层组件。
- Prompt 自定义校验器、异步字段验证、多字段表单或通用表单引擎。
- 默认全局 Dialog 单例、body 自动挂载的 Dialog Host、公开 provide API 或可重复打开的 DialogHandle。
- 为旧浏览器打包 dialog、ResizeObserver、IntersectionObserver 或 Teleport polyfill。
- 首批像素截图、云端视觉回归、跨平台截图基线或自动视觉差异门禁。
- 改造 Monkey 图标体系或为 UI 包引入图标依赖。
- 为未来消费者预建完整 Design Token 表或为单一局部几何值强制建 token。

## Further Notes

### 迁移风险

- Button 当前拥有大量 Monkey 消费点，直接切换包根命名导出会产生较大的机械 import diff；这是已接受的最小完整迁移成本。
- Dialog 当前把路由历史、模块级状态、固定延时和 Promise 结算混在一起。迁移必须先建立工厂服务与 Host，再实现 App Dialog Adapter，避免浏览器后退、Escape 或 closeAll 留下未结算 Promise。
- 原生 `<dialog>`、top layer 和 Teleport 对真实浏览器行为敏感，不能只依赖 jsdom。
- UI 样式以可编译入口分发，消费方必须具备约定的 Tailwind/daisyUI 构建链；构建顺序和显式 source 注册是关键集成点。
- dist-first 会引入跨包构建等待；UI watch build 和 Turbo 依赖图必须在本地开发与 Storybook 中工作。
- light/dark 双项目 browser tests 会增加 CI 时间和 Chromium 安装成本，但这是已确认的自动质量门。

### 建议实施顺序

1. 建立 UI 包清单、窄 exports、Vite/vue-tsc 构建、可编译样式入口和 dist-first 工作区依赖。
2. 建立 Theme、Design Token、UI Namespace 与 Glass 样式层，并迁移 Button/Pill 公共 overrides。
3. 迁移 Button 与 Pill，先让基础 Story 通过正式 exports 渲染。
4. 建立 Overlay Host 与 Floating UI Tooltip，迁移 Tooltip 消费点并移除应用挂载节点假设。
5. 建立原生 Dialog 原语、transition 生命周期、工厂服务、DialogHost、Prompt 与 Dialog Stack。
6. 建立 Monkey App Dialog Adapter，迁移所有命令式和声明式 Dialog 消费点。
7. 删除 Monkey 本地核心组件、失效 Glass distortion 依赖与旧样式所有权。
8. 建立 UI Storybook browser/a11y 门禁，整理 Monkey 集成 Storybook 与根工作区 scripts。
9. 重写 UI/UX、Glass、Storybook skills，新增 Design Token skill，并检查 skills 不复制源码具体值。
10. 运行 lint、类型检查、包构建、双 Storybook 静态构建、Chromium stories 和 Monkey 回归门禁。

### 完成标准

- Monkey 不再从应用内部导入 Button、Pill、Tooltip 或 Dialog 实现。
- UI 包根只公开已确认的组件、服务与类型，消费方无法依赖内部目录。
- Monkey 的开发、测试、Storybook、类型检查和生产构建都通过真实 UI dist。
- UI 公共样式成为 Tailwind/daisyUI、Theme、Design Token、Glass 与核心组件样式的唯一共享入口。
- Tooltip 不再依赖 Monkey DOM id，Dialog 不再依赖 Monkey Router 或模块级全局容器。
- 所有 Dialog 正常关闭路径都有明确 outcome，所有一次性 handle 的 closed 都只结算一次。
- UI Storybook 在 light/dark 的真实 Chromium 中通过交互与 a11y 门禁，两套静态 Storybook 均可构建。
- 更新后的领域文档、ADR 与 skills 与代码事实一致，且没有复制 Design Token 具体值。

## Comments

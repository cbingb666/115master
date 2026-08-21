# @115master/ui

面向 115Master 各应用的 UI 基础上下文。它定义可复用的视觉语义与交互契约，不承载任何应用专属集成。

## Language

**UI 基础包**：
应用无关的视觉基础与 UI 契约集合；不能依赖 Monkey 的挂载节点、路由、GM API 或业务文案。
_Avoid_: Monkey 组件仓库、共享组件堆

**Design Token**：
为视觉决策命名的语义值，是主题、组件与材质共享视觉语言的最小单位。
_Avoid_: 魔法数、样式常量

**Motion Token**：
由 `--ui-ease-*` 公共 Token 承载的动效意图；standard 处理轻量状态变化，enter / exit 处理进入与退出，move 处理结构性几何变化，settle 处理快速抵达终点的反馈，snap 处理轻微越界回弹的吸附落位，linear 处理匀速过程。调用方按交互语义选择，不依赖数学曲线族、硬编码 timing function 或局部别名。
_Avoid_: Sine / Quint / Expo 命名、裸 cubic-bezier、应用曲线表、Token 适配层

**公共 Token**：
供应用、组件与材质共同消费的稳定语义值；已有语义直接沿用 daisyUI，只为缺失概念扩展 UI 命名空间。
_Avoid_: Token 别名、重复语义变量

**内部 Token**：
组件或材质内部的适配值，不构成消费方可以依赖的公共契约。
_Avoid_: 公共变量、主题 Token

**Token 提升**：
当局部视觉值出现第二个真实消费者或形成跨组件语义时，将其提升为公共 Token。
_Avoid_: 预设 Token、完整 Token 表

**层叠尺度**：
由 `--ui-z-*` 公共 Token 与同名 `ui-z-*` 工具类承载的全局 z-index 语义序列，分组件内（under/raised/cover）、页面（elevated/dropdown/header/fab/scrim/sheet）、全局浮层（host/progress/menu/toast/tooltip/dnd/watermark）三段；progress 有意低于浮层，非交互 watermark 位于普通文档最高层，Modal Surface 走原生 top layer 不参与本尺度。
_Avoid_: 裸数值 z-index、组件私自定义层级

**Glass 材质**：
由承载场景选择的半透明表面语义，统一负责前景、背景、边框、高光、阴影与背景滤镜。
_Avoid_: 玻璃工具类、透明背景

**Glass 材质连续性**：
同一界面区域在状态切换中保留唯一、连续的 Glass 承载表面，仅让其内容与几何平滑变化，避免材质层数或滤镜所有权在过渡中改变。
_Avoid_: Glass 交叉淡化、双层 Glass、替换材质表面

**基础 Story**：
在 UI Storybook 中独立证明公共 token、材质或组件契约的 hermetic 场景。
_Avoid_: 应用 Story、集成演示

**父 Canvas**：
父 Story 在 Storybook 中供浏览和人工操作的初始场景；拥有唯一的 render、args 与 fixture，不自动执行会点击、输入、提交、移动焦点或改变可观察状态的交互。
_Avoid_: 测试后 Canvas、自动演示

**显式 Story 测试**：
以 `<Story>.test()` 附着到父 Story、只从 Manager 或包级浏览器测试入口运行的交互契约；与父 Canvas 共享场景，通过公开可观察结果证明行为。
_Avoid_: 状态改变型 play、平行测试 Story

**Storybook 测试矩阵**：
按所有权区分的真实浏览器门；UI CLI／CI 覆盖 light、dark、reduced-motion 与 mobile，UI Manager 的 light-only 是版本兼容入口，Monkey 只运行应用默认 Theme 项目。
_Avoid_: Manager 完整矩阵、Monkey 基础矩阵

**集成 Story**：
在应用 Storybook 中证明 UI 基础与应用组件、状态或运行环境正确组合的场景。
_Avoid_: 组件基础 Story、重复 Story

**Tooltip**：
在锚点获得悬停或键盘焦点时显示的非交互补充说明；内容不能承载完成任务所必需的信息或操作。
_Avoid_: Popover、菜单、可点击提示

**Context Menu**：
由坐标与受控 open 状态驱动的临时操作表面；统一负责 Overlay Host、视口避让、滚动锁定、焦点循环、关闭语义与材质选择，默认使用 floating，媒体场景可选择 overlay，菜单项内容由应用通过 slot 提供。
_Avoid_: 应用挂载节点、业务 Action 模型、页面内定位逻辑

**Headless DnD**：
应用无关的 Pointer Events 拖拽模块；DndRoot 拥有会话与跟随层，DndSource 负责激活阈值、payload 惰性求值和 click 抑制，DndTarget 负责命中、接收判断与投放，DndMonitor 只公开会话是否活跃。调用方通过 slot 保留真实 DOM，并拥有 payload、预览内容和领域投放规则。
_Avoid_: 文件拖拽适配、业务 payload 类型、应用挂载节点

**Responsive Menu**：
由锚点触发、按公共 sm 断点选择桌面浮动菜单或移动端 bottom Drawer 的临时操作表面；统一负责 Overlay Host、Modal Host、定位、焦点与关闭语义，标题和菜单项内容由应用提供。
_Avoid_: App Dialog Adapter、应用挂载节点、业务 Action 模型

**Overlay Host**：
位于当前主题作用域内、供临时浮层脱离裁切上下文渲染的共享宿主。
_Avoid_: `#my-app`、Tooltip 容器

**公共 UI 契约**：
由包根命名导出、允许消费方稳定依赖的组件、样式模块、交互模块、服务与类型集合；组件包括 Button、Pill、FloatingDock、Image、Empty、Progress、Pagination、SelectionHeader、StatusFeedback、Tooltip、ContextMenu、ResponsiveMenu、DndRoot、DndSource、DndTarget、DndMonitor、Watermark、Header、HeaderStart、HeaderEnd、Dialog、Drawer、ModalHost、DialogHost、NavigationStack 与 OverlayHost，样式模块包括 Scrollbar，交互模块包括 useCollectionSelection，服务固定为 createDialogService 与 useDialog，并公开与这些契约直接对应的 Props、尺寸、文案集、加载器、选项、结果、关闭原因、服务实例和句柄类型。内部 Modal Root、DnD provide/use、默认单例与内部文件路径不属于契约。
_Avoid_: 深层导入、默认导出

**UI Namespace**：
UI 包所有非 daisyUI 类、CSS 变量与 data attribute 共享的 `ui` 前缀，用于隔离宿主页面级联。
_Avoid_: 无前缀类、`app-*`

**公共样式入口**：
由 UI 基础包提供的完整视觉基础入口；应用在其上追加专属样式，不重新定义共享主题或组件基础。
_Avoid_: 应用主题入口、重复 Tailwind 配置

**可编译样式入口**：
保留 Tailwind 与 daisyUI 指令、由消费方构建链统一处理的公共样式产物。
_Avoid_: 预编译 Tailwind bundle、应用插件配置

**Theme**：
将同一组语义 token 映射为 light 或 dark 视觉取值的命名模式；应用显式选择优先于系统偏好。
_Avoid_: dark class、应用颜色表

**最小迁移**：
以最小的完整组件集合切换所有权；集合内实现、测试、stories 与消费入口一起迁移，不以减少改动文件数为目标。
_Avoid_: 转发壳迁移、少改文件

**Modal Surface**：
应用无关、由状态驱动并暂时阻断外部交互的界面表面；Dialog 与 Drawer 是两种表面语义，共享关闭、焦点和生命周期契约。
_Avoid_: 页面抽屉、浮层、Navigation Stack

**Dialog**：
带内容与操作结构的 Modal Surface，适合命令、确认、输入或聚焦任务；内容区的边界滚动被限制在当前 Dialog 内，不继续串联到模态外层。
_Avoid_: Dialog 服务、Drawer、路由弹窗

**Drawer**：
从视口边缘进入且不预设业务结构的 Modal Surface，适合临时覆盖页面并承载调用方自己的完整内容。
_Avoid_: 持久侧栏、页面 Sheet、Dialog

**Modal Host**：
单个 Vue 应用内所有 Modal Surface 的共享协调域；一个表面只属于一个 Host，一个 Host 对应一条 Modal Stack。
_Avoid_: 全局 Modal 管理器、Dialog Host、Overlay Host

**Modal Stack**：
同一 Modal Host 内按实际打开顺序形成的表面集合；栈顶独占交互与蒙层，关闭时焦点沿打开链返回。
_Avoid_: Navigation Stack、Dialog Service Stack、调用方层级

**Navigation Stack**：
应用无关、由状态驱动且不拥有 Modal Surface 的内容导航栈；统一标题栏、安全区、内容滚动、返回与关闭意图和方向感知转场。调用方选择 Dialog 或 Drawer，并拥有页面标识、层级、导航状态、业务内容与本地化文案。
_Avoid_: Modal Stack、设置面板、路由容器、模态外壳

**Dialog 服务**：
由 UI 基础包提供的应用无关命令式协调层，将配置对象形式的 alert、confirm、prompt 或自定义流程转换为 Dialog 状态。
_Avoid_: Dialog、Modal Host、路由弹窗服务

**Dialog Host**：
在单个 Vue 应用作用域内承载 Dialog 服务状态并渲染服务条目的宿主；它参与 Modal Host，但不协调其他 Modal Surface。
_Avoid_: Modal Host、全局 Dialog 单例、Dialog 容器

**Dialog 服务实例**：
由工厂为一个应用、Story 或测试创建的独立命令式 Dialog 状态与操作集合。
_Avoid_: 全局 Dialog、共享容器 fallback

**App Dialog Adapter**：
由应用包装 Dialog 服务实例的集成层，为配置对象增加路由历史等应用能力。
_Avoid_: UI Dialog 服务、router-aware Dialog

**Dialog 文案集**：
应用在创建 Dialog 服务实例时提供的默认操作与提示文案，可由单次调用覆盖。
_Avoid_: UI 内置中文、UI 内置英文

**Dialog Service Stack**：
同一 Dialog 服务实例内按创建顺序管理的条目集合；它保留服务级 LIFO 操作，同时所有已渲染条目仍属于应用的 Modal Stack。
_Avoid_: Modal Stack、Dialog 队列、并行弹窗

**Dialog Outcome**：
命令式 Dialog 结束时的正常结果；确认、提交或取消由返回值区分，取消不属于异常。
_Avoid_: 取消异常、关闭 reject

**Dialog Close Reason**：
描述自定义 Dialog 结束路径的结构化原因，用于应用适配和可观察生命周期；Escape 与蒙层关闭分别记录为 escape 与 backdrop，且在 pending 期间不响应。
_Avoid_: 关闭布尔值、DOM 事件猜测

**Dialog Enter Confirmation**：
命令式 Dialog 默认将弹窗内的 Enter 解释为确认，即使焦点位于取消按钮；单次调用可通过 `confirmOnEnter: false` 关闭。输入法组合输入不触发确认，多行文本与可编辑区域保留 Enter 编辑语义。
_Avoid_: 页面级 Enter 监听、取消按钮抢占默认确认

**Dialog Transition**：
由 CSS 状态驱动的打开与关闭过程；opened 和 closed 在真实过渡结束后结算，并以计算样式时长作安全兜底，减少动态效果偏好下立即完成。
_Avoid_: 固定延时销毁、动画猜时

**Dialog Renderable**：
命令式 Dialog 配置可接受的静态文本、Vue 节点或响应式渲染函数。
_Avoid_: Component 特判、任意 content

**Prompt Dialog**：
Dialog 服务提供的单字段文本输入流程；输入具备可见或辅助技术可读的标签与必填错误。启用 `confirmOnEnter` 时，单行 Enter 提交，多行 Enter 换行且 Ctrl/Cmd+Enter 提交；关闭后仅保留按钮确认。首批契约只支持原生输入约束，复杂校验与多字段表单使用自定义 Dialog。
_Avoid_: 静默校验、通用表单引擎

**Button**：
始终以原生按钮语义执行动作的控件；视觉可以呈现为 link 或 Glass，但不承担导航。
_Avoid_: 链接按钮、router button

**Progress**：
固定在视口顶缘、由 active 状态驱动的页面级 indeterminate 加载反馈；只承担不占布局的视觉提示，调用方仍负责为内容区域声明 busy 语义。
_Avoid_: 确定进度条、布局内进度、业务加载状态

**Empty**：
应用无关的居中空状态占位；展示调用方提供的字符串说明，支持标准尺寸、装饰图片、可隐藏的视觉区以及操作内容，图标通过 slot 注入。
_Avoid_: 应用图标 registry、内置业务文案、集合状态管理、错误与加载反馈

**Pagination**：
应用无关的受控分页导航；统一响应式页码布局、跳页输入、每页数量选择与 Glass 承载语义，调用方拥有当前状态、总数、本地化文案和状态变更。
_Avoid_: 数据请求、查询状态、内置业务文案、应用分页 store

**StatusFeedback**：
应用无关的居中语义状态反馈；展示调用方提供的字符串消息，支持 status、标准尺寸以及由 callback 与 label 成对配置的重试、关闭和详情操作，图标通过 slot 注入。
_Avoid_: Error 对象格式化、播放器错误码解释、剪贴板或弹窗副作用、应用图标注册表、内置业务文案、应用状态管理

**SelectionHeader**：
应用无关的选择模式页面头部；展示调用方提供的选中数量与退出文案，在左侧按回调提供带淡入淡出过渡的全选操作，并由调用方通过 allSelected 控制其隐藏；图标通过 slots 注入，不管理选择状态。
_Avoid_: 选择状态管理、应用图标 registry、内置本地化文案、业务操作集合

**Collection Selection**：
应用无关的集合选择交互模块；调用方通过一个 selection adapter 提供集合状态，并提供条目、稳定键、容器与默认激活行为。模块统一管理 Shift/Ctrl 多选、长按、框选、边缘自动滚动、右键选择与键盘快捷键，所有选择变更都写回同一个 adapter。
_Avoid_: 文件或标签业务状态、复选框 DOM 查询、调用方手写选择手势、应用级框选样式

**Pill**：
呈现胶囊几何的信息、组合布局或导航容器；不执行按钮动作。
_Avoid_: 胶囊按钮、Badge

**FloatingDock**：
由 `contentKey` 驱动显隐与内容身份的连续 Floating Glass 表面；统一负责表面进入退出、内容切换与 ResizeObserver 尺寸过渡，页面负责定位、对齐和背景羽化。
_Avoid_: 页面底栏定位器、业务操作栏、Glass 交叉淡化

**Header**：
应用无关的吸附式页面头部外壳；随根滚动渐显衬底，并通过 HeaderStart 与 HeaderEnd 组合可收缩主内容和不收缩尾部操作。应用拥有业务内容，并可通过 `--ui-header-offset` 与 `--ui-header-gutter` 调整页面集成几何。
_Avoid_: 业务导航栏、路由头部、应用间距变量

**Image**：
应用无关的图片状态容器；管理原生图片与注入式 loader 的加载、过期请求中止、资源释放、懒加载、骨架和错误回退。调用方拥有尺寸、替代文本、图片来源适配与自定义回退。
_Avoid_: GM 请求、Referer、缓存与压缩策略、业务图片来源、图片预览器、应用图标 registry

**Watermark**：
在内容区域上方重复铺陈文本身份标记的装饰性组件；不拦截内容交互或进入无障碍树，只用于降低随意传播意愿，不构成数据保护边界。
_Avoid_: 权限控制、数字版权管理、可交互遮罩

**Scrollbar**：
基于浏览器原生滚动行为的沉浸式滚动条样式模块；通过 `scrollbar(size)` 一次获得基础类与 `xs / sm / md / lg / xl` 尺寸类，可作用于单个滚动容器或整个子树；统一负责透明轨道、沿滚动轴的容器安全内缩、主题对比度与悬停／拖动状态，不改写原生滚动交互。默认轨道首尾各内缩 `1.5rem`，拥有悬浮头尾内容的容器可通过 `--ui-scrollbar-track-inset-start / end` 覆盖。
_Avoid_: 业务包装容器、全局无选择器滚动条、自定义拖拽滚动实现

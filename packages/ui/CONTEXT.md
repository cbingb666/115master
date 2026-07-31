# @115master/ui

面向 115Master 各应用的 UI 基础上下文。它定义可复用的视觉语义与交互契约，不承载任何应用专属集成。

## Language

**UI 基础包**：
应用无关的视觉基础与 UI 契约集合；不能依赖 Monkey 的挂载节点、路由、GM API 或业务文案。
_Avoid_: Monkey 组件仓库、共享组件堆

**Design Token**：
为视觉决策命名的语义值，是主题、组件与材质共享视觉语言的最小单位。
_Avoid_: 魔法数、样式常量

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
由 `--ui-z-*` 公共 Token 与同名 `ui-z-*` 工具类承载的全局 z-index 语义序列，分组件内（under/raised/cover）、页面（elevated/dropdown/header/fab/scrim/sheet）、全局浮层（host/progress/menu/toast/tooltip/dnd）三段；progress 有意低于浮层，Dialog 走原生 top layer 不参与本尺度。
_Avoid_: 裸数值 z-index、组件私自定义层级

**Glass 材质**：
由承载场景选择的半透明表面语义，统一负责前景、背景、边框、高光、阴影与背景滤镜。
_Avoid_: 玻璃工具类、透明背景

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

**Overlay Host**：
位于当前主题作用域内、供临时浮层脱离裁切上下文渲染的共享宿主。
_Avoid_: `#my-app`、Tooltip 容器

**公共 UI 契约**：
由包根命名导出、允许消费方稳定依赖的组件、服务与类型集合；首批组件固定为 Button、Pill、Tooltip、Dialog、DialogHost 与 OverlayHost，服务固定为 createDialogService 与 useDialog，并公开与这些契约直接对应的 Props、选项、结果、关闭原因、服务实例和句柄类型。内部 Dialog 子组件、provide 方法、默认单例与内部文件路径不属于契约。
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

**Dialog 原语**：
应用无关、由状态驱动的临时界面契约，负责模态交互、结构、可访问性与视觉呈现。
_Avoid_: 弹窗服务、路由弹窗

**Dialog 服务**：
由 UI 基础包提供的应用无关命令式协调层，将配置对象形式的 alert、confirm、prompt 或自定义流程转换为 Dialog 原语状态。
_Avoid_: Dialog 原语、路由弹窗服务

**Dialog Host**：
在单个 Vue 应用作用域内承载 Dialog 服务状态并渲染 Dialog 原语的宿主。
_Avoid_: 全局 Dialog 单例、Dialog 容器

**Dialog 服务实例**：
由工厂为一个应用、Story 或测试创建的独立命令式 Dialog 状态与操作集合。
_Avoid_: 全局 Dialog、共享容器 fallback

**App Dialog Adapter**：
由应用包装 Dialog 服务实例的集成层，为配置对象增加路由历史等应用能力。
_Avoid_: UI Dialog 服务、router-aware Dialog

**Dialog 文案集**：
应用在创建 Dialog 服务实例时提供的默认操作与提示文案，可由单次调用覆盖。
_Avoid_: UI 内置中文、UI 内置英文

**Dialog Stack**：
同一服务实例内按打开顺序管理的 Dialog 集合；只有栈顶可交互，关闭栈顶后恢复下层上下文。
_Avoid_: Dialog 队列、并行弹窗

**Dialog Outcome**：
命令式 Dialog 结束时的正常结果；确认、提交或取消由返回值区分，取消不属于异常。
_Avoid_: 取消异常、关闭 reject

**Dialog Close Reason**：
描述自定义 Dialog 结束路径的结构化原因，用于应用适配和可观察生命周期；Escape 与蒙层关闭分别记录为 escape 与 backdrop，且在 pending 期间不响应。
_Avoid_: 关闭布尔值、DOM 事件猜测

**Dialog Transition**：
由 CSS 状态驱动的打开与关闭过程；opened 和 closed 在真实过渡结束后结算，并以计算样式时长作安全兜底，减少动态效果偏好下立即完成。
_Avoid_: 固定延时销毁、动画猜时

**Dialog Renderable**：
命令式 Dialog 配置可接受的静态文本、Vue 节点或响应式渲染函数。
_Avoid_: Component 特判、任意 content

**Prompt Dialog**：
Dialog 服务提供的单字段文本输入流程；输入具备可见或辅助技术可读的标签与必填错误，单行 Enter 提交，多行 Enter 换行且 Ctrl/Cmd+Enter 提交。首批契约只支持原生输入约束，复杂校验与多字段表单使用自定义 Dialog。
_Avoid_: 静默校验、通用表单引擎

**Button**：
始终以原生按钮语义执行动作的控件；视觉可以呈现为 link 或 Glass，但不承担导航。
_Avoid_: 链接按钮、router button

**Pill**：
呈现胶囊几何的信息、组合布局或导航容器；不执行按钮动作。
_Avoid_: 胶囊按钮、Badge

# Tooltip 使用 Floating UI

`@115master/ui` 的 Tooltip 使用 `@floating-ui/vue` 管理锚点定位，以 `offset`、`flip`、`shift` 和 `autoUpdate` 覆盖间距、边缘碰撞、滚动、resize 与布局位移，并渲染具有 tooltip role 和锚点 ARIA 关联的真实内容。公共 `placement` 只开放 top、right、bottom、left 四个首选方向，空间不足时允许定位引擎自动翻转和偏移。内容支持字符串 prop 与非交互 content slot；空内容不挂载浮层或建立 ARIA 关联，交互内容必须使用其他浮层类型。鼠标悬停默认延迟 400ms 打开、100ms 关闭，键盘 focus 立即打开，blur 与 Escape 立即关闭，并允许单组件覆盖延迟。Tooltip 默认 Teleport 到主题作用域内最近的 Overlay Host，允许单组件覆盖，缺少 Host 时回退到 `document.body`，不依赖应用挂载节点。相比继续扩展现有手写坐标与定时器，这增加了一个 UI 运行时依赖和共享浮层宿主，但避免 UI 基础包自行维护通用定位引擎或泄漏应用 DOM；daisyUI 仍只负责视觉。

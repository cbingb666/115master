# 08 — 交付完整 Dialog 服务并完成 Monkey 迁移

**What to build:** 在原生 Dialog 之上提供完整、应用无关、工厂创建的命令式服务，并一次迁移 Monkey 的标准、自定义、嵌套和浏览器历史流程。应用代码优先通过配置对象调用，所有正常关闭路径都有明确结果，迁移结束后 Monkey 不再拥有第二套 Dialog 实现。

**Blocked by:** 07 — 发布原生受控 Dialog.

**Status:** ready-for-agent

- [ ] 包根命名导出 createDialogService、useDialog、DialogHost，以及文案集、options、outcome、close reason、service 与 handle 类型
- [ ] 工厂为每个应用、Story 或测试创建隔离实例，不存在模块级全局 Dialog 状态、默认单例或 body 自动挂载 Host
- [ ] DialogHost 承载当前服务实例并渲染 Dialog Stack，useDialog 从当前 Vue 应用注入获得实例
- [ ] 非组件代码能够直接持有工厂返回的服务实例
- [ ] 工厂要求应用提供 Dialog 文案集，单次调用允许覆盖；UI 包不内置中文、英文或渲染错误文案
- [ ] 标题、内容与按钮文案统一接受字符串、VNodeChild 或无参 render function，复杂组件通过 Vue 组合能力传入
- [ ] render function 与确认处理故障交给调用方 onError，不由 UI 包擅自展示反馈
- [ ] alert 返回 Promise<void>，confirm 返回 Promise<boolean>，prompt 返回 Promise<string 或 null>
- [ ] create 立即打开并返回一次性 handle；handle 只提供 close、destroy 与只结算一次的 closed，不支持 open 或复用
- [ ] 自定义 closed 能区分 confirm、cancel、escape、backdrop、programmatic、destroy 与 close-all
- [ ] 用户取消、Escape、蒙层与 close-all 属于正常 outcome；仅配置、Host 或内部故障 reject
- [ ] `closeOnEscape` 与 `closeOnBackdrop` 默认 true 并可单次覆盖；alert、confirm、prompt 和 create 各自按契约结算
- [ ] onConfirm 支持同步、异步与返回 false；false 保持打开，Promise pending 显示 loading 并阻止重复提交
- [ ] pending 期间所有用户关闭路径失效，但程序化 close/destroy 仍可用于超时、请求取消和卸载
- [ ] Dialog Stack 只允许栈顶交互，嵌套反馈关闭后恢复下层上下文和焦点
- [ ] closeAll 按后进先出清理，并为每个 Dialog 结算 close-all outcome
- [ ] Prompt 保留 defaultValue、placeholder、inputType、multiline、rows、required 与 maxLength
- [ ] Prompt 从单次配置或工厂文案集获得可访问 inputLabel，required 失败显示可访问错误
- [ ] 单行 Prompt 按 Enter 提交；多行 Enter 换行，Ctrl/Cmd+Enter 提交；首批不引入自定义校验器
- [ ] UI 基础 Stories 在 light/dark Chromium 中覆盖工厂隔离、Host、全部 API outcome、异步状态、Stack、Prompt、关闭原因和焦点恢复
- [ ] Monkey 创建应用级 Dialog 服务并挂载 DialogHost，组件和非组件调用都使用同一应用实例
- [ ] Monkey App Dialog Adapter 在 UI options 之外提供 `history?: boolean`，UI 公共契约不依赖 Vue Router
- [ ] 浏览器后退能够关闭对应 Dialog 并结算 outcome，不遗留未完成 Promise 或路由清理器
- [ ] Monkey 的 alert、confirm、prompt、普通 create、自定义内容、嵌套反馈、TagPicker、CloudDownload、设置和 history 流程全部完成迁移
- [ ] 现有调用优先使用配置对象；只有确需外部受控状态的场景直接使用 Dialog 原语
- [ ] Monkey 本地 Dialog 原语、容器、provide、命令式服务、Prompt 内部组件、类型与基础 Story 被删除
- [ ] 不保留本地 Dialog 转发壳、模块级 fallback container、旧 show/hide handle 或 deep import
- [ ] Monkey 的类型检查、现有测试、集成 Storybook 和生产构建在删除旧实现后保持通过

# Storybook 父 Canvas 与显式测试进入真实浏览器门

## 决策

`@115master/ui` 的 Storybook 同时启用官方 a11y 与 Vitest addons，并以 Playwright Chromium browser mode 执行 Story smoke、显式交互测试和 axe 检查；默认可访问性违规视为错误。Monkey Storybook 以相同机制验证应用集成，但不复制 UI Foundation 的浏览器项目矩阵。

可浏览的父 Story 只呈现 hermetic 初始场景，不通过状态改变型 `play` 自动点击、输入、提交、移动焦点、打开 Dialog 或改变路由。需要执行的交互契约附着到该父 Story 的 `<Story>.test()` 子项，只从 Storybook Manager 的 Run tests 或包级 Vitest 等显式测试入口运行。父项和测试子项共享唯一的 render、args、fixture、服务实例与可观察 outcome；不得建立平行的展示 Story、测试 Story 或测试目录。

CSF Next 按 Story 文件增量采用，不要求一次迁移所有静态 CSF 3 Story。同一文件不能混用 CSF 3 与 CSF Next；文件一旦迁移，其中原有的纯断言型 `play` 也转入对应父 Story 的 `.test()`，避免同一模块同时保留自动与显式两种测试语义。需要展示预先打开、加载或错误状态时，直接用 args、render 或 hermetic fixture 构造父 Story，而不是在渲染后编排 Canvas。

## 测试矩阵

| 入口 | 项目 | 职责 |
| --- | --- | --- |
| UI 普通 CLI、包级测试与 CI | `storybook-light`、`storybook-dark`、`storybook-reduced-motion`、`storybook-mobile` | 四个 Chromium projects 执行同一公共 UI Story suite；reduced-motion 与 mobile 使用 light Theme |
| UI Storybook Manager | light 项目 | Storybook addon-vitest 10.5.5 对共享 config directory 重写项目名时的兼容 workaround；它不是完整 UI 矩阵 |
| Monkey 包级测试与 CI | Node unit 项目与单一默认 Theme（dark）Chromium project | 验证应用自有 Story 集成，不复制 UI 的双 Theme、reduced-motion 或 mobile 项目 |

包级 `test` 同时覆盖各自的 Node 与 Storybook projects；`build-storybook` 验证静态产物和索引。UI 与 Monkey Storybook 分别使用 6006 与 6007，根 `storybook` 通过 Turbo 同时启动，并保留定向启动脚本；根静态构建同时构建两套产物。

## 运行时与回归边界

两套 Storybook 都使用 preview factory，并在主配置与 preview annotations 中注册各自 addons：UI 注册 Docs、a11y 与 Vitest，Monkey 注册 Docs 与 Vitest。主配置负责 Manager 注册，preview annotations 负责预览运行时、类型与测试集成，两处不能互相替代。UI 保留 Theme toolbar、Theme-scoped root、Autodocs、Controls 和 a11y error policy；Monkey 保留 Theme toolbar、应用样式、Overlay／Dialog hosts、Teleport 与本地图标 fixtures。

父 Canvas inertness 由真实 Storybook host 回归：初次进入、刷新和离开后重新进入时，稳定渲染后至少观察三秒，不得出现 click、pointer、keydown、input、change、scroll、submit 或交互元素 focusin，且各 Story 的初始可观察 outcome 不变。静态索引必须同时包含父 Story 与不同 ID 的 `.test()` 子项，并证明子项仍附着在父项所在模块。UI 的 20 个原自动交互父 Story、随 Pill 文件迁移的 3 个纯断言父 Story，以及 2 个 Monkey 集成父 Story都进入该回归清单。

首版不建立像素截图或云端视觉回归基线，Glass、tokens 与组件矩阵保留双主题 Canvas 目检。真实浏览器门用于验证原生 Dialog、Tooltip 浮层、Theme 变量、Glass 对比度、键盘交互、焦点恢复和应用路由等平台行为，不以组件级 jsdom 或私有调用断言替代。

## Storybook 版本约束

当前实现锁定 Storybook 10.5.5。该版本不暴露 `experimentalTestSyntax` 配置，因此不得添加该 feature flag；也不采用内部 embed 模式、全局隐藏 Story、禁用全部 `play` 的私有 patch 或其他未公开开关来抑制 Canvas 自动执行。

每次升级 Storybook、addon-vitest 或 Vue framework 集成时，必须重新验证：

1. 当前版本是否公开且需要显式测试 feature flag；
2. Manager 对共享 config directory 的项目名处理，及 light-only workaround 是否仍有必要；
3. 两套静态索引的父项、不同 ID 的 `.test()` 子项和模块归属；
4. 一个最小父 Story 在浏览时保持 inert，且其最小 `.test()` 能从 Manager 与 CLI 显式执行；
5. preview factory／addon annotations、Docs、Controls、a11y error policy、Theme hosts 和 Monkey fixtures 仍完整工作。

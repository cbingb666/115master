Status: ready-for-agent

# Storybook Canvas 与显式交互测试分离

## Problem Statement

115Master 的 UI 基础 Story 与 Monkey 集成 Story 目前使用 Storybook `play` 承载真实浏览器交互契约。Storybook 10.5 会在父 Story 的 Canvas 完成渲染后自动执行 `play`，因此维护者只要打开或切换 Canvas，就会看到按钮被点击、输入框被填写、表单被提交、Dialog 被打开、路由被改变或焦点被移动。Canvas 不再是可供人工检查和自由操作的初始场景，而会在无人操作时自行进入测试后的状态。

这些交互同时承担了重要的浏览器测试职责。UI Storybook 已通过 Vitest addon 在真实 Chromium 中运行 light、dark、reduced-motion 和 mobile 四个项目，并把公共 UI 契约和可访问性检查纳入包级测试；Monkey 的两个交互 Story 则覆盖应用样式组合和 App Dialog Adapter 的路由历史集成。直接删除 `play`、关闭 Vitest addon、复制“展示 Story”和“测试 Story”，都会丢失覆盖或造成 render、args、fixture 与契约的双份维护。

已完成的 Button 原型证明，锁定的 Storybook 10.5.5 可以增量采用 CSF Next，并通过附着在父 Story 上的 `.test()` 把浏览态与测试态分开：父 Canvas 保持初始状态，Storybook Manager 的显式测试操作和包级 Vitest 仍能执行交互契约。但原型也发现 preview factory、addon annotations、Manager 项目选择和依赖预优化存在版本相关约束。用户需要把这些结论正式化为一套窄、可分批落地、可回归验证的迁移政策，而不是把一次性原型直接扩散到全部 Story。

## Solution

接受 Button 原型的可行性结论，在 UI Foundation 与 Monkey Storybook 中建立“父 Story 只负责 hermetic 初始场景，附着的 `.test()` 子项只在显式测试入口运行”的统一政策。迁移以 Story 文件为原子单位：文件一旦需要迁移，就整体采用 CSF Next，保留唯一的 render、args、fixture、Autodocs 和 Controls 定义，并把该文件内的测试断言从 `play` 移入各父 Story 的 `.test()`。

UI Foundation 先完成 preview factory 与 addon annotations 的正式配置，再分批迁移现有 20 个会产生自动交互的基础 Story。普通包级测试和 CI 继续运行 light、dark、reduced-motion、mobile 四个 Chromium 项目；Storybook Manager 因 10.5.5 的项目名重写限制，只在 Manager 触发的运行中暴露 light 项目。两条路径必须被明确区分并分别验证。

Monkey Storybook 采用同一父 Story／`.test()` 契约，但只新增一个默认 Theme 的 Chromium browser project，用于显式执行应用样式组合和 Dialog history adapter 两个集成交互测试。它不复制 UI Foundation 的双 Theme、reduced-motion 或 mobile 基础矩阵。两套 Storybook 都保留现有 Docs、Controls、公共／集成 Story 所有权边界和静态构建能力。

迁移后用真实 Storybook host 作为最高行为测试接缝：直接打开父 Canvas 时，在观察窗口内不得产生自动用户输入事件或改变初始可观察状态；通过 Manager 或包级测试运行 `.test()` 子项时，原有指针、键盘、焦点、Dialog outcome、路由和可访问性契约必须通过。静态索引同时证明父 Story 与测试子项是两个可识别条目，且没有复制展示 fixture。

## User Stories

1. 作为 Storybook 浏览者，我想打开任意已迁移父 Story 时只看到初始状态，以便我可以从可预测的起点人工检查组件
2. 作为 Storybook 浏览者，我想在切换到另一个 Story 后不发生自动点击，以便浏览行为不会意外触发动作
3. 作为 Storybook 浏览者，我想在刷新 Canvas 后得到相同的初始状态，以便场景保持 hermetic
4. 作为 Storybook 浏览者，我想 Dialog 在打开 Story 时保持关闭，以便我自行选择要检查的流程
5. 作为 Storybook 浏览者，我想表单计数、保存计数和 outcome 输出保持初始值，以便测试不会污染展示状态
6. 作为 Storybook 浏览者，我想输入框和 textarea 不被自动填写或清空，以便手工输入不与测试竞争
7. 作为 Storybook 浏览者，我想路由和 Dialog history 在打开 Story 时不自动前进或后退，以便集成场景不会自行导航
8. 作为键盘检查者，我想 Story 打开时不把焦点自动移到组件上，以便我能从浏览器的自然焦点起点检查 Tab 顺序
9. 作为组件维护者，我想父 Story 与交互测试共享同一份 render、args 和 fixture，以便展示与测试不会漂移
10. 作为组件维护者，我想把交互契约附着在对应父 Story 上，以便测试的所有权和覆盖对象清晰
11. 作为组件维护者，我想只在显式测试运行时执行 pointer、keyboard、focus 和 submit 路径，以便 Canvas 与测试职责分离
12. 作为组件维护者，我想在一个 Story 文件内只使用一种 CSF 语法，以便不依赖 Storybook 不支持的混用行为
13. 作为组件维护者，我想按文件增量采用 CSF Next，以便不需要一次迁移全部静态 Story
14. 作为组件维护者，我想迁移交互 Story 时保留其原有可观察断言，以便语法调整不削弱公共契约
15. 作为组件维护者，我想同一已迁移文件里的纯断言型 `play` 也改为 `.test()`，以便文件中不会同时存在自动测试和显式测试两种心智
16. 作为组件维护者，我想新增交互契约默认使用 `.test()`，以便不会重新引入自动操作 Canvas 的 `play`
17. 作为 Story 作者，我想用 args 或 render 直接表达需要展示的非初始状态，以便不把演示编排伪装成交互测试
18. 作为 UI Foundation 维护者，我想 Button 的父 Canvas 保持动作与 submit 计数为零，以便原型结论成为正式回归契约
19. 作为 UI Foundation 维护者，我想 Overlay Host 与 Tooltip 的父 Canvas 不自动打开浮层，以便 Theme-scoped overlay 可以被人工检查
20. 作为 UI Foundation 维护者，我想 Pill 的导航链接不自动获得焦点，以便 Canvas 保持自然初始状态
21. 作为 UI Foundation 维护者，我想 Dialog 原语的六个场景不自动打开、关闭或卸载 Dialog，以便每个生命周期场景可手工探索
22. 作为 UI Foundation 维护者，我想 Dialog 服务的五个场景不自动触发 alert、confirm、prompt、异步确认或 Stack 流程，以便服务 Story 不自行推进
23. 作为 UI Foundation 维护者，我想 Theme 与 Glass tracer 不自动触发嵌套动作，以便材质检查保持初始视觉
24. 作为 Monkey 维护者，我想应用样式组合 Story 不自动保存，以便应用级样式和公共 Glass 可以静态检查
25. 作为 Monkey 维护者，我想 Dialog history adapter Story 不自动改变内存路由，以便 App Dialog Adapter 的初始集成状态稳定
26. 作为 UI 测试维护者，我想普通包级测试继续运行 light 与 dark 两个 Theme 项目，以便 Theme 不改变公共行为或可访问性契约
27. 作为 UI 测试维护者，我想普通包级测试继续运行 reduced-motion 项目，以便动态效果偏好相关契约不退化
28. 作为 UI 测试维护者，我想普通包级测试继续运行 mobile 项目，以便响应式 Dialog 和浮层行为不退化
29. 作为 CI 维护者，我想 UI 的四个 browser projects 在 CLI 和 CI 中全部执行，以便 Manager 的兼容限制不会缩窄自动质量门
30. 作为 Storybook Manager 使用者，我想点击 Run tests 时能稳定运行 light 项目，以便本地可以显式获得快速反馈
31. 作为 Storybook Manager 使用者，我想 Manager 运行不因重复项目名失败，以便四项目共享配置目录的限制被正确隔离
32. 作为 Monkey 测试维护者，我想 Monkey 拥有一个默认 Theme 的 Storybook browser project，以便两个应用集成交互契约可以显式运行
33. 作为 Monkey 测试维护者，我想不自动复制 UI Foundation 的四项目矩阵，以便集成测试只覆盖应用自己拥有的边界
34. 作为 Monkey 测试维护者，我想新增 browser project 与现有 Node 单元测试共同由包级测试运行，以便 CI 不需要隐藏的额外命令
35. 作为可访问性维护者，我想 UI `.test()` 运行继续把 a11y violations 视为错误，以便语法迁移不移除现有门禁
36. 作为文档读者，我想迁移后 Autodocs 正常生成，以便组件契约文档不因 preview factory 配置丢失
37. 作为 Storybook 使用者，我想 Controls 继续操作父 Story 的真实 args，以便 CSF Next 不降低交互式文档能力
38. 作为 Storybook 使用者，我想 Docs 渲染不会自动执行测试子项，以便文档示例保持稳定
39. 作为构建维护者，我想两套静态 Storybook 继续成功生成，以便部署和离线检查能力不退化
40. 作为构建维护者，我想静态索引同时包含父 Story 和对应 `.test()` 子项，以便显式测试可以被 Storybook 正确发现
41. 作为构建维护者，我想 addon annotations 在 preview factory 中完整注册，以便 Docs、a11y 和 Vitest 行为保持一致
42. 作为本地开发者，我想首次启动测试时不因依赖重新优化中断 suite 注册，以便显式测试反馈稳定
43. 作为依赖升级维护者，我想知道 `.test()` 与 feature flag 的行为是 Storybook 版本相关事实，以便升级时重新核验而不是沿用过时假设
44. 作为依赖升级维护者，我想只在当前锁定版本实际支持时配置 feature flag，以便不向 10.5.5 添加不存在的配置
45. 作为架构维护者，我想 ADR 记录父 Canvas、测试子项和两种项目矩阵的职责，以便后续改动有稳定决策依据
46. 作为 agent，我想 Storybook skill 明确要求交互契约使用 `.test()` 且父 Canvas 保持 inert，以便自动实现不会重新产生状态改变型 `play`
47. 作为评审者，我想每个迁移批次都证明父 Canvas 无自动输入且显式测试仍通过，以便问题不会到全量迁移后才被发现
48. 作为评审者，我想自动回归检查覆盖 click、pointer、keyboard、input、change、submit 和焦点变化，以便“Canvas inert”不是仅靠肉眼判断
49. 作为评审者，我想验证可观察状态而不是 Storybook 内部函数调用，以便测试不与 CSF Next 的实现细节耦合
50. 作为维护者，我想保留当前原型为可丢弃证据而不是直接提交，以便正式实现可以按已接受规格重新整理

## Implementation Decisions

### 迁移政策与 Story 所有权

- 正式采用 CSF Next `<Story>.test()` 作为需要显式运行的 Storybook 浏览器交互契约；父 Story 只定义 hermetic 初始场景。
- 迁移是窄增量政策，不要求仓库全部 Story 立即转换为 CSF Next。迁移原子是单个 Story 文件，因为同一文件不能混用 CSF 3 与 CSF Next。
- 任何会通过指针、键盘、焦点、输入、提交、路由、计时器或服务调用改变 Canvas 可观察状态的 `play` 都属于迁移对象。
- 文件转换为 CSF Next 后，该文件内原有的纯断言型 `play` 也移动到对应父 Story 的 `.test()`，避免一个文件保留自动与显式两套测试语义。Pill 文件因此除导航链接外，也会迁移容器、尺寸和材质变体的断言。
- 新增交互契约不得使用状态改变型 `play`。若维护者需要展示预先打开、加载、错误或其他非初始状态，应通过 args、render 或 hermetic fixture 直接构造该 Story，而不是渲染后自动编排。
- 父 Story 与 `.test()` 子项共享唯一 render、args、fixture、服务实例和可观察 outcome；不得复制成“展示 Story”和“测试 Story”。
- 公共 UI 契约继续归 UI Foundation 的基础 Story 所有；路由、应用样式、store、GM API 或其他应用环境组合继续归 Monkey 集成 Story 所有。

### UI Foundation 迁移范围

- UI Foundation 的既有 20 个自动交互父 Story 全部进入分批迁移清单：
  - Overlay Host 的 Theme-scoped target 场景；
  - Tooltip 的 interaction、content／empty content、placements、edge／scroll 和 overlay targets 五个场景；
  - Button 的公共契约场景；
  - Pill 的导航链接场景；
  - Dialog 原语的 controlled、label-only、unmounting、close policies、sizes／responsive presentation 和 reduced-motion 六个场景；
  - Dialog 服务的 factory isolation／injection、outcomes／close reasons、errors／async confirmation、prompt keyboard／validation 和 Stack／close-all 五个场景；
  - Theme／Glass tracer 场景。
- 建议按风险和依赖顺序实施：先把 Button 原型整理为正式基础设施与首个迁移；再迁移 Overlay Host 与 Tooltip；随后迁移 Pill 与 Theme／Glass；再迁移 Dialog 原语；最后迁移 Dialog 服务。
- 每个批次独立满足类型检查、lint、完整 UI 包测试、静态 Storybook 构建、父 Canvas inertness 和显式测试执行验收，不能等到最后一批再验证。

### UI preview factory 与 addons

- CSF Next 需要 UI Storybook preview factory；正式配置保留现有 Theme toolbar、Theme-scoped root、fullscreen layout、背景策略和 a11y error policy。
- preview factory 必须显式注册 Docs、a11y 与 Vitest addon annotations。只建立空 addon 列表虽然能运行部分测试，但会破坏 Docs，因此不接受。
- Storybook 主配置继续声明同一组 addons；preview factory annotations 与主配置各自承担运行时类型／测试集成和 Manager 注册职责，不能把其中一处视为另一处的替代。
- 保留真实公共组件作为 Story meta 的 component，使 Autodocs 与 Controls 继续描述公共 Props；纯 Foundation Story 不为迁移语法虚构组件包装。
- 将原型已验证的 Storybook addon 与 Vue framework 模块纳入 Vitest 依赖预优化，避免首次运行发生重新优化并中断 suite 注册。只加入已证明需要的模块，不建立宽泛依赖白名单。

### UI Manager 与 CLI 项目矩阵

- 普通 CLI、包级测试和 CI 继续公开并运行四个 UI browser projects：light、dark、light reduced-motion 和 light mobile。该矩阵是 ADR 既有公共 UI 质量门，不因 Manager 兼容处理而缩窄。
- Storybook addon-vitest 10.5.5 在 Manager 触发时会设置其专用环境标记，并根据 Storybook config directory 重写项目名。四个项目共享同一配置目录时会被视为重名。
- 仅在 Manager 触发的运行中选择 light 项目，作为锁定版本的窄兼容 workaround。该分支不改变普通 CLI／CI 的四项目集合。
- Manager 的 light-only 行为必须对维护者可见，并在 ADR 与 Storybook skill 中记录；不得把 Manager 的单项目结果描述为完整矩阵结果。
- Storybook 升级时必须重新验证项目名行为。若上游修复允许 Manager 区分四个项目，应删除 workaround，而不是永久保留版本判断。

### Monkey 显式交互测试承载

- Monkey Storybook 同样采用 preview factory，并在保留现有 Theme toolbar、应用背景、Overlay Host、Dialog Host、图标本地 registry 和应用 Teleport 集成的基础上注册 Docs 与 Vitest annotations。
- Monkey 增加 Vitest addon 与真实 Chromium browser project，并把它纳入 Monkey 包级测试；现有 Node 单元测试继续作为独立项目运行。
- Monkey browser project只使用一个默认 Theme，默认值沿用应用 Storybook 当前默认 Theme。它证明应用集成边界，不复制 UI Foundation 的 light／dark、reduced-motion 或 mobile 矩阵。
- Monkey 首批只迁移 Application Styles 的 Theme composition 与 App Dialog Adapter 的 nested／forward navigation 两个交互 Story。其他静态集成 Story 不因本规格被转换为 CSF Next。
- 两个 Monkey Story 的父 Canvas 分别保持保存次数初始值与初始内存路由；其 `.test()` 保留现有点击、键盘、Dialog Stack、route marker、listener cleanup 和 outcome 断言。
- Monkey browser project执行全部 Monkey Story 的基本渲染发现是新增基础设施的自然结果，但本规格不要求为其他 Story 增加新的交互断言或复制 UI 基础覆盖。

### Storybook 10.5.5 版本事实

- 当前锁定的 Storybook 10.5.5 类型和运行时支持 CSF Next `.test()`，完整 Button 原型在未配置 `experimentalTestSyntax` 时通过。
- 当前版本不暴露官方文档仍提到的 `experimentalTestSyntax` 配置，因此正式实现不得为 10.5.5 添加该 flag。
- 文档与安装版本的不一致被视为版本敏感事实。任何 Storybook 升级都必须同时检查官方 CSF Next 文档、安装类型、运行时和最小 Story 测试，再决定是否新增、改名或移除 feature flag。
- 不使用内部 `embed=true` 抑制 autoplay。它不是项目级公开 Canvas 开关，并会引入嵌入模式语义。

### 索引、文档与治理

- 静态 Storybook 索引必须为每个已迁移契约保留父 Story 条目和独立 `.test()` 子项；测试子项不是一份新的 render 或 fixture。
- 父 Story 继续出现在现有层级、Docs 和 Controls 中；迁移不得建立平行的“Tests”组件目录或重复公共组件矩阵。
- 修订现有真实浏览器 Story 测试 ADR，或发布后继 ADR，记录 `.test()` 显式执行政策、父 Canvas inertness、UI 四项目矩阵、Manager light-only workaround 和 Monkey 单项目边界。
- 更新 Storybook skill：把公共交互“写在 play function”改为“附着在父 Story 的 `.test()`”；增加状态改变型 `play` 禁止规则、preview factory／annotations 要求、Manager 与 CLI 矩阵差异、父 Canvas 回归检查和 Storybook 升级复核项。
- UI Foundation glossary 中既有“基础 Story”“集成 Story”“公共 UI 契约”等语言保持不变；本规格只细化测试承载方式，不引入新的组件领域概念。

## Testing Decisions

### 好测试的标准与最高接缝

- 好测试只验证 Storybook host 对使用者可见的外部行为：父 Canvas 是否保持初始状态、显式运行是否执行契约、可观察 outcome 是否正确、Docs／Controls／索引是否可用，以及浏览器项目矩阵是否完整。不要断言 preview factory 内部调用次数、环境变量读取函数、Storybook 私有 channel 消息或 addon 内部实现。
- 最高且主要的行为接缝是两套真实 Storybook host 在 Chromium 中呈现的父 Story／`.test()` 关系。render、交互、可访问性、Theme、Dialog、路由与索引都从这个边界验证，不为语法迁移新增组件级 jsdom 测试。
- 现有组件与服务的 `.test()` 断言继续覆盖公共或应用集成契约；迁移只改变何时执行，不重写为针对私有 reactive state、DOM 文件结构或 mock 调用次数的断言。

### 父 Canvas inertness 回归

- 建立一个 host-level Playwright 回归检查，覆盖迁移清单中的所有父 Story。检查直接打开父 Canvas，而不是打开 `.test()` 子项。
- 在父 Canvas 稳定渲染后观察至少三秒，捕获交互元素上的 click、pointer、keydown、input、change、submit 与 focusin 等用户输入信号；没有人工操作时计数必须保持为零。
- 同时断言代表初始状态的可观察 outcome：Button action／submit 计数、Application Styles 保存计数、Dialog 是否关闭、Dialog service outcome、Tooltip／Overlay 是否未打开、Monkey route marker 与 listener 状态等。不能只依赖“未捕获事件”推断初始状态。
- 回归检查从静态索引或显式迁移清单定位父 Story，避免误把 `.test()` 子项当作浏览目标。新增已迁移 Story 时必须进入该检查。

### 显式测试执行与矩阵

- UI 包级测试必须让 Button 以及随后迁移的所有 `.test()` 在 light、dark、reduced-motion 和 mobile 四个 browser projects 中被发现并执行；测试计数随迁移增加，但四个项目不得消失。
- Storybook Manager 的 Run tests 必须在真实 Manager UI 中成功执行 light 项目，并让 `.test()` 的可观察断言通过；父 Canvas 在运行前保持初始状态。Manager 验证不代替 CLI 四项目验证。
- Monkey 包级测试必须同时运行既有 Node 单元测试和新的默认 Theme Storybook browser project，并显式执行两个 Monkey `.test()`。
- UI a11y addon继续在 browser projects 中把 violation 作为错误；`.test()` 迁移不能通过关闭 a11y、移除 tags 或排除 Story 来获得通过。
- 测试配置的 Manager 专用分支通过上述 Manager 与 CLI 两条外部路径验证，不新增只断言配置对象数组长度的低层单元测试。

### Docs、Controls 与静态产物

- UI 与 Monkey 的静态 Storybook 构建都必须通过。
- 静态索引必须包含父 Story 和不同 ID 的 `.test()` 子项；父项继续携带原有 title、name、tags 和文档归属。
- 对每个迁移批次至少检查一个受影响公共组件的 Docs 与 Controls；Button 首批必须验证 Autodocs、真实 Props controls 和父 Story render。
- Preview factory 变更必须验证 UI 的 Docs、a11y 与 Vitest annotations 全部生效；Monkey preview factory 变更必须验证 Theme toolbar、Overlay／Dialog hosts、应用样式和本地图标 fixture 未退化。

### 验证命令与先例

- UI 批次运行 UI Foundation 的 Turbo type-check、目标 lint、完整包级 test 和静态 Storybook build。
- Monkey 批次运行 Monkey 的 Turbo type-check、lint、完整包级 test 和静态 Storybook build。
- 跨 host 收尾运行工作区级 type-check、test 和双 Storybook 静态构建，证明新增 browser project 已纳入正常门禁。
- 直接先例是已完成的 Button CSF Next 原型：父 Canvas 三秒无交互事件，Manager light 项目通过，CLI 四项目通过，29 files／97 tests 通过，Docs、Controls、a11y、类型检查、lint、静态构建和索引均正常。
- UI Foundation 现有真实 Chromium browser projects 与真实浏览器测试 ADR 是 UI 矩阵先例；Monkey 现有 hermetic preview、内存 Router、应用样式 fixture 和静态 Storybook build 是新增单项目集成测试的先例。

## Out of Scope

- 不改变 Button、Pill、Tooltip、Overlay Host、Dialog、Dialog 服务、Theme、Glass、App Dialog Adapter 或应用样式的产品行为与视觉设计。
- 不把所有静态 CSF 3 Story 全量转换为 CSF Next；只迁移包含现有自动交互或随同一文件需要统一测试语义的 Story。
- 不复制展示 Story 与测试 Story，不建立第二套 render、args、fixture 或公共组件矩阵。
- 不移除或缩窄 UI 的 light、dark、reduced-motion、mobile、a11y、Docs、Controls 或静态构建门禁。
- 不为 Monkey 复制 UI Foundation 的四 browser-project 矩阵，也不在首批为其他 Monkey Story 新增交互契约。
- 不引入像素快照、云端视觉回归、跨平台截图基线或除 Chromium 外的新浏览器矩阵。
- 不升级 Storybook、Vitest、Playwright 或其他依赖；版本升级只作为后续重新验证触发条件。
- 不为当前 Storybook 10.5.5 添加 `experimentalTestSyntax`。
- 不采用内部 embed 模式、全局隐藏 Story、禁用全部 `play` 执行的私有 patch 或其他未公开 Storybook 开关。
- 不调查或替换 Manager 项目名 workaround 的上游根因；若单独开展该工作，应作为聚焦的诊断任务。
- 不提交当前未提交原型，不扩展原型到其他 Story；正式实现由后续 tickets 按规格重新整理。

## Further Notes

### 原型证据

- Button 原型已证明 CSF Next 可在现有 CSF 3 Story 旁按文件增量采用；同一文件不混用两种格式。
- Preview factory 是最小迁移的一部分；缺少 Docs、a11y 与 Vitest annotations 会造成不完整运行时，其中空 addon 列表已被证明会破坏 Docs。
- Manager 的 light-only 选择是 Storybook addon-vitest 10.5.5 与共享 config directory 的兼容 workaround，不是新的完整测试政策。
- 依赖预优化是稳定首次测试注册所需的基础设施细节，不应被误解为业务依赖。
- 当前工作树中的 Button、preview 和 Vitest 配置改动仍是故意未提交的原型。发布本规格不表示授权提交、暂存或继续扩写这些改动。

### 风险与缓解

1. **实验 API 的升级风险**：`.test()` 在官方文档中仍标为实验性。通过锁定版本实施、记录 ADR、保留最小升级复现和升级时重新核验 flag／索引／Manager 行为缓解。
2. **Manager 与 CI 结果被混淆**：Manager 只跑 light，而 CLI 跑四项目。通过显式命名、文档、skill 规则和两条独立验收路径缓解。
3. **Preview annotations 漂移**：主配置与 preview factory 都涉及 addons。通过 Docs、a11y、Manager、CLI 和静态 build 的组合外部验证缓解，不依赖配置形状断言。
4. **Monkey browser project 扩大运行面**：新增项目会渲染全部 Monkey Stories，可能暴露非 hermetic fixture。先保证现有 preview fixture 隔离，遇到具体失败时修复对应应用集成边界，不把公共 UI mock 复制进 Monkey。
5. **仅检查事件而漏掉状态副作用**：Canvas 可能通过定时器或直接状态写入变化而不产生捕获事件。回归测试同时检查事件流与各 Story 的初始可观察 outcome。

### 参考

- Storybook `play` 的渲染后执行语义：https://storybook.js.org/docs/10.5/writing-stories/play-function
- CSF Next 与 `<Story>.test()`：https://storybook.js.org/docs/api/csf/csf-next#storytest
- Storybook features 配置：https://storybook.js.org/docs/api/main-config/main-config-features

## Comments

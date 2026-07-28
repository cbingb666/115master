# 10 — 集成双 Storybook 并完成全仓门禁

**What to build:** 让维护者能够从工作区根目录同时运行和构建 UI 基础 Storybook 与 Monkey 集成 Storybook，并用一套可重复的最终门禁证明公共契约、dist-first 消费、真实浏览器交互和应用迁移完整可用。

**Blocked by:** 09 — 收缩应用样式与失效 Glass 基础设施.

**Status:** ready-for-agent

- [ ] UI Storybook 固定使用 6006，Monkey Storybook 固定使用 6007，两个包均保留定向启动命令
- [ ] 根 storybook 任务通过工作区编排同时启动两套 Storybook
- [ ] 根 build-storybook 任务构建两套静态 Storybook，并能分别定位失败来源
- [ ] UI 包 test 执行必要单元检查以及 Playwright Chromium Storybook browser tests
- [ ] UI browser tests 在 light 与 dark 两个项目执行同一套 smoke、play 与 axe 检查，可访问性违规视为错误
- [ ] Button、Pill、Tooltip、Dialog、Dialog 服务、Theme、Token 与 Glass 的基础契约只存在于 UI Storybook
- [ ] Monkey Storybook 只保留应用状态、router、业务组件和运行环境组合的集成 Story，不复制 UI 基础矩阵
- [ ] Monkey 集成 Storybook 首批不增加双主题自动项目，但工具栏切换和主题作用域继续工作
- [ ] UI 与 Monkey 的 Storybook 都通过正式 UI dist 和公共 styles export 消费，不使用源码 alias
- [ ] 工作区依赖图确保开发、测试、类型检查、Storybook 与生产构建在消费前获得最新 UI dist
- [ ] pnpm lockfile 与工作区依赖声明反映最终 peer、runtime 和 Storybook/browser test 工具关系
- [ ] 全仓 lint、type-check、test 与 build 通过
- [ ] UI 与 Monkey 的静态 Storybook 构建通过
- [ ] UI 的 light/dark Chromium interaction 与 a11y 门禁通过
- [ ] Monkey 的现有测试和生产构建证明核心 UI 迁移未破坏应用行为
- [ ] 首批没有引入像素截图、云端视觉回归、跨平台截图基线或 UI polyfill
- [ ] Context Map、UI Foundation glossary、ADRs 与四个 UI skills 和最终代码事实一致

# UI Story 进入真实浏览器测试门

`@115master/ui` 的 Storybook 同时启用官方 a11y 与 Vitest addons，并以 Playwright Chromium browser mode 自动执行 story smoke、play 交互和 axe 检查；默认可访问性违规视为错误。UI tests 建立 light 与 dark 两个 browser projects，两个主题都执行同一自动门；Monkey 集成 Storybook 暂不双跑。包级 `test` 同时覆盖单元测试与 Storybook browser tests，`build-storybook` 继续验证静态产物。UI 与 Monkey Storybook 分别使用 6006 与 6007，根 `storybook` 通过 Turbo 同时启动，并保留定向启动脚本；根静态构建同时构建两套产物。首版不建立像素截图或云端视觉回归基线，Glass、tokens 与组件矩阵保留双主题 Canvas 目检。相比仅用 jsdom 和人工 Canvas，这增加了浏览器安装、双主题执行、并行进程与 CI 时间，但能可靠验证原生 Dialog、Tooltip 浮层、主题变量、Glass 对比度、键盘交互和焦点恢复等真实平台行为，同时避免在 Glass 渲染尚未稳定时积累跨环境截图噪声。

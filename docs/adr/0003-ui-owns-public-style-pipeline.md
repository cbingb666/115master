# UI 包拥有公共样式管线

`@115master/ui` 提供统一的公共样式入口，集中配置 Tailwind CSS、daisyUI、共享主题、Design Token、材质与组件扩展，并显式注册 UI 源码；应用只导入该入口并追加应用专属样式。入口按职责拆为 `index.css`、`themes.css`、`tokens.css`、`glass.css` 与 `components.css`，应用背景、reset、scrollbar 和页面样式不进入 UI 包。首版保持完整 daisyUI 组件 CSS 并继续排除 scrollbar，因为 Monkey 仍直接消费尚未封装的 daisyUI 类；公共 Vue 组件范围不因此扩大。现有 daisyUI overrides 只迁移 Button 与 Pill 的公共几何，range、skeleton、input 与 textarea 覆写仍是 Monkey 应用样式，待出现公共契约后再提升。Theme fallback 使用 light default 与 dark prefers-dark，显式 `data-theme` 始终优先。相比各应用分别配置，这会提高 UI 包对样式工具链的约束，但能保证独立 Storybook 与应用消费相同的视觉基础，避免主题、插件和源码扫描配置漂移。

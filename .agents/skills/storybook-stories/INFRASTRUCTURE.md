# Storybook 基础设施

修改 `.storybook/main.ts`、`.storybook/preview.ts`、主题、Teleport 或 TSX docgen 时读取本文件。

## Preview 运行时约束

`.storybook/preview.ts` 提供三个项目级约束：

1. 在模块求值阶段把 `#my-app` 追加到 `document.body`，确保 Vue mount 前 Teleport target 已存在。
2. 主题 decorator 通过 `computed` 读取 `context.globals.theme`，使工具栏切换保持响应式。
3. `data-theme` 同步写入 story wrapper 与 `#my-app`，使 Teleport 内容和普通内容使用同一主题。

新增全局 decorator 或 mock 前先复用现有设施。修改 preview 后，在普通组件和 Teleport 组件中各切换一次浅色与深色主题。

完成标准：Teleport 挂载无警告，工具栏主题切换同时更新 Canvas 与 `#my-app` 内的内容。

## TSX props 与 controls

`meta.component` 暴露可配置 props 时，Docs 页面必须产生有效的 props / controls；组件族还要在 component description 中说明成员及组合关系。SFC 先使用默认 `vue-docgen-api`；TSX 提取不完整时，在 `.storybook/main.ts` 切换为 `vue-component-meta`：

```ts
framework: {
  name: '@storybook/vue3-vite',
  options: {
    builder: {
      viteConfigPath: '.storybook/vite.config.ts',
    },
    docgen: {
      plugin: 'vue-component-meta',
      tsconfig: 'tsconfig.app.json',
    },
  },
},
```

本仓库使用 tsconfig references 和 `@/` alias，因此 `tsconfig.app.json` 必须显式传给 docgen。保留现有 `builder.viteConfigPath`。

完成标准：目标 TSX 组件的 Docs 页面展示预期 props / controls，`@/` 导入可解析，`build-storybook` 退出 0。

## 当前验证边界

当前 addons 只包含 `@storybook/addon-docs`。自动门是 type-check、lint 和 `build-storybook`；交互与可访问性检查在 Canvas 执行。

引入 `play`、a11y 或视觉回归时，同一变更必须补齐依赖、配置、执行脚本和 `SKILL.md` 的验证命令。

完成标准：skill 声明的自动检查均由仓库脚本实际执行，其余检查明确落在 Canvas 完成标准内。

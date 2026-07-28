# 自定义 UI CSS 使用 ui 命名空间

`@115master/ui` 的所有非 daisyUI 类、CSS 自定义属性和 data attributes 分别使用 `ui-*`、`--ui-*` 与 `data-ui-*`；daisyUI 官方标识保持原名。现有 Pill、Glass 与 Button 材质适配类在迁移时直接更名，不保留旧别名。相比保留较短的通用名称，这会产生额外迁移改动，但能降低用户脚本样式注入宿主页面时的级联碰撞，并使公共样式所有权可见。

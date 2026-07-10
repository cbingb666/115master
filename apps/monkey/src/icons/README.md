# Icons 模块文件地图

何时改哪个文件：

| 文件 | 何时改 |
| --- | --- |
| `registry.ts` | **新增 / 删除 / 修改** 图标常量（包括映射到 ionicons 的值） |
| `types.ts` | 通常无需手动改，由 `registry.ts` 自动推导 |
| `icon.vue` | 修改组件行为（props、size 档、渲染逻辑） |
| `legacy.ts` | 迁移完成前保留兼容层；全部迁移后**删除** |
| `index.ts` | 仅在添加新的对外导出时改 |
| `custom/<name>.vue` | 新增 / 修改自定义 SVG 变体 |

修改前先看 [`.agents/rules/icons-usage.md`](../../../.agents/rules/icons-usage.md)（强制约束）和 [`.agents/skills/icons-usage-detail/`](../../../.agents/skills/icons-usage-detail/SKILL.md)（详细用法）；设计自定义 SVG 时再看 [`.agents/skills/icons-design/`](../../../.agents/skills/icons-design/SKILL.md)。
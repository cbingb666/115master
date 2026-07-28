---
name: icons
description: apps/monkey 图标的统一工作流。选择、使用、注册或迁移图标，设计自定义 SVG，以及审查和验证图标时使用。
---

# Icons

`apps/monkey` 图标规范的唯一入口。按任务渐进加载：

| 任务 | 必读资料 |
| --- | --- |
| 选型、使用、注册、迁移或审查 | [`usage.md`](references/usage.md) |
| 新增或修改自定义 SVG | `usage.md` + [`design.md`](references/design.md) |
| 实施改动或执行验收 | [`validation.md`](references/validation.md) + 改动涉及的上述资料 |

组件 API、尺寸映射和图标目录以 `apps/monkey/src/icons/` 源码为准。修改
`Icon.stories.ts` 时同时调用 `storybook-stories` skill。

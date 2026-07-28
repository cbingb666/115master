# Icons 模块

所有 Vue/TSX 图标直接使用 `@/icons` 的 `Icon` 与 `I.*`。`Icon` 的 `name`
接收 registry 值 `IconValue`，不再兼容 `"PLAY"` 等 registry 键名。

```tsx
import { I, Icon } from '@/icons'

<Icon name={I.PLAY} />
```

## 信息来源

| 文件                           | 职责                                |
| ------------------------------ | ----------------------------------- |
| `.agents/rules/icons-usage.md` | 必须遵守的项目政策                  |
| `registry.ts`                  | 图标语义常量与 `IconValue` 类型来源 |
| `types.ts`                     | `IconSize` 等公开类型               |
| `icon.tsx`                     | props、尺寸和渲染行为               |
| `Icon.stories.ts`              | 可执行示例、尺寸展示和图标库        |
| `custom/<name>.svg`            | 自定义 SVG                          |

HOME Mod 向 115 官方 DOM 注入图标时使用 `<iconify-icon>`，`icon` 属性仍取自
`I.*`。现有实现见 `pages/home/TopHeaderMod/index.ts` 和
`pages/home/TopFilePathMod/index.ts`。

修改前阅读 [Icons 使用规范](../../../.agents/rules/icons-usage.md)；只有设计或
调整自定义 SVG 时才调用
[`icons-design`](../../../.agents/skills/icons-design/SKILL.md)。

# 图标使用与注册

## 选型

按产品语义而非外形决策：

1. 检查 `registry.ts` 和 `custom/`，复用已有等价语义。
2. 检索 ionicons 全部变体，优先 Filled；只有状态或既有视觉语言需要时才选
   Outline。
3. 均无等价语义时才新增自定义 SVG。

不要因造型偏好复制语义。registry key 表达产品语义，底层 glyph 可独立替换或被多个
语义复用。

## Registry

- key 使用语义化 `SCREAMING_SNAKE_CASE`，不包含供应商或造型细节。
- 值使用 `ion:<name>` 或 `custom:<kebab-case>`。
- 成对状态使用清晰后缀，如 `PREVIEW_ON` / `PREVIEW_OFF`。
- 先登记 registry，再修改调用层；业务代码不持有图标字面量。

## 渲染

Vue/TSX 只从 `@/icons` 使用 `Icon` 和 `I.*`：

```tsx
import { I, Icon } from '@/icons'

<Icon name={I.PLAY} />
```

- 动态字段使用 `IconValue`，不得退化为 `string`。
- 业务代码不得直接使用 `@iconify/vue` 或导入 `custom/*.svg`。
- 颜色继承 `currentColor`，由 daisyUI/Tailwind 语义文本色控制。
- 标准尺寸使用 `size` prop；非标准尺寸使用 `size="custom"` 和完整 Tailwind class。
- 禁止用内联颜色、`font-size`、`width`、`height` 或 `fill-*` 改写图标。
- 不用 emoji 代替产品图标。

## HOME 原生 DOM 例外

HOME Mod 不在 Vue 渲染树内，可用 `<iconify-icon>`，但值仍来自 `I.*`。该路径仅支持
`ion:*`；`custom:*` 由 Vue `Icon` 组件加载。

参考实现：
`apps/monkey/src/pages/home/TopHeaderMod/index.ts`、
`apps/monkey/src/pages/home/TopFilePathMod/index.ts`。

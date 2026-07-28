# Icons 使用规范

本文件只记录项目决策。组件 API 以 `apps/monkey/src/icons/icon.tsx` 与
`types.ts` 为准；可执行示例和尺寸展示以 `Icon.stories.ts` 为准。自定义
SVG 的设计与视觉验收调用 `icons-design` skill。

## 强制约束

- 唯一组件入口是 `@/icons`，业务代码不得直接渲染 `@iconify/vue` 的 `Icon`。
- `name` 必须传 registry 导出的 `I.*` 值；动态配置字段使用 `IconValue`，禁止
  `"PLAY"`、`"ion:play"` 等字面量绕过 registry。
- 优先使用 ionicons Filled；仅确认 ionicons 无对应语义后才新增 `custom:*`。
- 新图标先登记到 `registry.ts`，再由 `I.*` 使用。
- 图标颜色继承 `currentColor`，通过 daisyUI 语义文本色控制；尺寸通过 `size`
  prop 或 Tailwind class 控制。禁止内联 `color`、`font-size`。
- 不用 emoji 代替产品界面图标。

```tsx
import { I, Icon } from '@/icons'

<Icon name={I.PLAY} />
```

## HOME 原生 DOM 注入

HOME Mod 通过字符串或 DOM API 修改 115 官方页面，不在现有 Vue 应用的渲染树
内。此场景允许使用 `<iconify-icon>` Web Component，但图标值仍必须来自 `I.*`：

```ts
import { I } from '@/icons'

const icon = document.createElement('iconify-icon')
icon.setAttribute('icon', I.PREVIEW_OFF)
icon.setAttribute('noobserver', '')
```

现有参考：`pages/home/TopHeaderMod/index.ts`、
`pages/home/TopFilePathMod/index.ts`。

## 新增图标

1. 检索 ionicons 全套变体，优先选择 Filled。
2. 在 `registry.ts` 以 `SCREAMING_SNAKE_CASE` 登记语义常量。
3. ionicons 无合适语义时调用 `icons-design` skill 新增自定义 SVG。
4. 在 `Icon.stories.ts` 图标库中展示，并完成视觉验收。

## 验证

```bash
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey test
pnpm -F @115master/monkey build
```

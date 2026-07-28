---
name: icons-design
description: 设计、修改或验收 apps/monkey 的自定义 SVG，使其在小尺寸下与 ionicons Filled 保持一致的轮廓、视觉重量和负空间。仅在 ionicons 无等价语义时使用。
---

# 自定义图标设计

图标选型、注册和组件用法遵循
`.agents/rules/icons-usage.md`。本 skill 只规定自定义 SVG 的设计方法与输出约束。

## 前置判定

- 检索 ionicons 全部变体与 `apps/monkey/src/icons/custom/`；已有等价语义时直接复用。
- 自绘前选取 2–3 个结构相近的 ionicons Filled 图标作为参照，不凭印象拟态。

## 设计方法

1. **轮廓优先（silhouette first）**：先建立单色外轮廓，再加入必要细节；图标在
   14–24 px 下应能仅凭轮廓辨识。
2. **关键线网格（keyline grid）**：在 24×24 坐标系中组织主体、轴线和边界；
   数学对齐是起点，最终以光学校正（optical correction）为准。
3. **视觉重量（visual weight）**：与参照统一光学尺寸、面密度、圆角、端点和构件
   粗细，避免局部过黑或过轻。
4. **正负形（figure–ground）**：负空间是造型的一部分；孔隙、间隔和内轮廓在
   最小尺寸下不得粘连或塌陷。
5. **减法原则（reduction）**：只保留支撑语义的几何；优先简单轮廓、少量路径和
   最少锚点。

## SVG 约束

- 使用 `viewBox="0 0 24 24"`，不得写死 `width`、`height`、`class` 或内联样式。
- 默认以闭合填充路径建形，不混用 `stroke`；颜色仅使用 `currentColor`。
- 仅当层级表达不可缺少时使用 `fill-opacity`；不得使用硬编码颜色、渐变、滤镜或
  装饰性效果。
- 文件保存为 `apps/monkey/src/icons/custom/<kebab-case>.svg`，根节点保持：

```svg
<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="..." />
</svg>
```

## 验收

- 在 14、16、20、24 px 下与参照图标并排检查：语义清晰，无模糊、粘连、裁切。
- 光学尺寸、视觉重心和面密度与参照一致；不能只依赖几何居中。
- 亮暗主题及语义文本色下均正确继承 `currentColor`。
- 注册、Storybook 展示和工程验证按 `.agents/rules/icons-usage.md` 执行。

---
name: icons-design
description: 设计基于 ionicons 风格的自定义图标 —— 网格系统、几何构成、笔画语言、SVG 落地。维护者新增自定义 SVG、调整 SVG 路径、绘制新图标、设计图标、评估视觉一致性、与 ionicons Filled 风格对齐时使用本 skill。触发词：自定义图标、新增图标、SVG 路径、图标样式、图标设计、视觉一致性、ionicons Filled、自绘 SVG。
---

# Icons 设计方法（基于 ionicons Filled 风格）

> 调用方式、组件 API 见 `icons-usage` skill。
>
> 本 skill 只讲**如何设计一个视觉上看起来像 ionicons 的图标**。当 ionicons 直接覆盖语义时，永远优先使用 ionicons。

---

## 1. 何时需要自绘

仅当以下任一条件满足时，才考虑自定义 SVG：

1. **语义缺失**：在 [icon-sets.iconify.design/ion](https://icon-sets.iconify.design/ion/) 全量检索（含 Filled、Outline、Sharp 三套）无对应语义。
2. **风格冲突**：ionicons 中存在但视觉语言不符（如带描边 / 极细笔画 / 装饰元素），与项目整体观感割裂。

如不确定，先在仓库 grep `apps/monkey/src/icons/custom/` 看是否已有变体可复用。

---

## 2. 设计参考

设计前必须先看 ionicons 的真实样本，建立视觉直觉：

- 浏览 [icon-sets.iconify.design/ion](https://icon-sets.iconify.design/ion/)，观察 Filled 套件的基础图形（`refresh`、`play`、`close`、`home`、`chatbubbles`）。
- 注意以下共性：**实心填充、几何化构图、统一的笔画粗细、圆角优先、负空间均衡**。
- 自定义 SVG 必须能"混在一组 ionicons Filled 图标里看不出来谁是后加的"。

---

## 3. 网格与几何

### 3.1 视口

- 所有图标使用 `viewBox="0 0 24 24"`，与 ionicons 完全一致。
- 关键图形外边距 ≥ 1px，避免视觉贴边。

### 3.2 单位与对齐

- 所有坐标使用整数或半整数（`.5` 增量），便于像素对齐。
- 主要几何元素对齐到 2px 子网格（24/12/6/4/3/2 整除点）。
- 对称图形严格中心对称（如 `flip-x` 的双向箭头）。

### 3.3 关键比例

- 主体图形占视口约 70%~85%，过大显拥挤，过小显瘦弱。
- 复合图标（多元素）按"主-辅-背景"三层关系排布，主元素居中且面积最大。

---

## 4. 笔画语言

ionicons Filled 的视觉特征由以下规则定义，逐一对照：

| 规则                | 数值 / 做法                                              |
| ------------------- | -------------------------------------------------------- |
| 笔画粗细            | 实心填充统一，不使用 stroke-width                       |
| 端点处理            | `stroke-linecap="round"`（若使用 stroke）                |
| 转角处理            | `stroke-linejoin="round"`（若使用 stroke）               |
| 圆角半径            | Filled 实心元素的圆角约 1.5~2px                          |
| 锐角                | 禁止使用，所有角优先圆角或曲线                           |
| 内负空间            | 至少 1px 间距，避免实心粘连                              |

### 4.1 Filled vs Outline 选择

| 风格     | 适用场景                          | 笔触实现              |
| -------- | --------------------------------- | --------------------- |
| Filled   | 主要交互按钮、强调元素（默认）    | `fill="currentColor"` |
| Outline  | 次要、装饰、轻量展示              | `fill="none"` + `stroke="currentColor" stroke-width="1.5~2"` |

> 项目默认走 Filled 风格。Outline 仅在特殊语义需要时使用（如 toggle、disabled 状态）。

---

## 5. 颜色与可访问性

### 5.1 单色原则

- 所有 SVG 仅使用 `currentColor`，禁止内嵌 `fill="red"` 等硬编码颜色。
- 复合图标通过 `opacity` 区分层级（如 toast success 的对勾 vs 圆环）。
- 对比度由外部文本类（`text-base-content` / `text-error` / `text-primary`）保证，SVG 本身不参与。

### 5.2 交互态

如果图标需要表达激活 / 禁用 / 加载中：

- **同一图标 + 不同颜色类**：通过外部 `class` 控制，不在 SVG 内部切换。
- **状态专用图标**：用独立常量（如 `PLAY` / `PAUSE`）而非在同一 SVG 内画两个状态。

---

## 6. 落地流程

设计完成后，按以下步骤落地：

### 6.1 文件位置

`apps/monkey/src/icons/custom/<kebab-case>.svg`，与 `registry.ts` 中的 `custom:<name>` 一一对应。

### 6.2 文件结构

直接保存纯 SVG 文件，由 `icon.vue` 通过 `defineAsyncComponent` 动态导入并透传 `class`：

```svg
<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="..." />
</svg>
```

要点：

- 顶层 `<svg>` 设 `fill="currentColor"`，子 `<path>` 不重复设置。
- 不写 `:class` 绑定 —— `class` 由 `icon.vue` 通过 `<component :is="customComp" :class="cls" />` 透传到 `<svg>` 根元素。
- 仅当图标是 Outline 风格时，才在 path 上覆盖 `fill="none"` + `stroke` 属性。
- 文件以换行符结尾。

### 6.3 注册

在 `apps/monkey/src/icons/registry.ts` 登记：

```ts
// === 自定义图标 ===
FILE_IMAGE: 'custom:image-file',
```

- 命名遵循 `SCREAMING_SNAKE_CASE`，文件命名 `kebab-case`。
- 命名习惯贴近 ionicons（如 `flip-x` 而非 `flipX` 或 `flip_horizontal`）。

### 6.4 自检

落地后对照 §3 §4 逐条校验：

- [ ] `viewBox="0 0 24 24"` ✓
- [ ] 仅 `currentColor`，无硬编码颜色 ✓
- [ ] 主体居中且外边距 ≥ 1px ✓
- [ ] 无锐角，转角圆滑 ✓
- [ ] 与邻近 ionicons 图标并排无突兀感 ✓

---

## 7. 视觉验收方法

视觉验收的目标是确认新接入或修改的图标在不同尺寸、颜色上下文与交互态下均无回退。流程：

1. **多尺寸截图**：用 Playwright 在目标 size 档（`xs/sm/md/lg/xl`）分别渲染并截图，确认线条不糊、不溢出 viewBox。
2. **颜色上下文**：在亮 / 暗主题、`text-base-content` / `text-error` / `text-primary` 等不同类下各取一张截图，确认 `currentColor` 正确继承。
3. **交互态**：对存在激活 / 禁用态的图标（如音量、播放、收藏），分别在启用 / 禁用 / 激活三种状态截图，确认视觉语义清晰。
4. **对比基准**：与改动前的截图作像素 diff，差异区域须肉眼复核是否合理。
5. **回归快照**：将通过验收的截图归档为视觉回归基线，作为后续改动对照依据。

---

## 8. 演进策略

- ionicons 集合升级（如 Filled 风格新增）：在 `registry.ts` 中按需替换值，不改组件 API。
- 自定义 SVG 的视觉一致性审计：每季度回顾一次，确保新增 SVG 与 ionicons Filled 风格保持一致。
- 当 ionicons 新增了已有自定义图标的等价物时，优先切换为 ionicons，删除自定义文件以减少维护成本。
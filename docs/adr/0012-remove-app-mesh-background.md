# 应用背景移除 mesh 渐变

Monkey 应用背景不再使用 `app-bg-mesh` 多层径向渐变，改为由 `#my-app` 根容器按主题写入的纯色背景（见 `src/utils/theme.ts`）；app.css 中的 `app-bg-mesh` utility、亮色变体，以及 Layout、Monkey Storybook 装饰器和集成 Story 中的引用一并删除，不保留别名或开关。相比保留渐变背景，这使视觉重心完全落在 Glass 面板与内容层，背景色来源收敛为单一主题契约，并消除 `background-attachment: fixed` 大面积渐变在滚动时的重绘开销；代价是应用失去一层装饰性氛围，后续如需装饰性背景应重新评审并以新的 ADR 记录。

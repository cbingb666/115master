# Story 场景检查

Coverage unit 涉及交互、异步状态、响应式布局、overflow、浮层、Teleport 或拖拽时读取本文件，并应用所有匹配章节。

## 交互与可访问性

- 每个公开操作都有可观察结果：组件状态、文本结果或 ARIA 状态发生变化。
- 语义控件覆盖指针与键盘路径，并展示 focus-visible、disabled、loading、selected、expanded 等适用状态。
- 图标按钮提供可访问名称；选择类控件暴露准确的 role 与 `aria-checked`、`aria-current` 或 `aria-selected`。
- Dialog、Menu、Popover 等临时界面覆盖打开、主操作、Escape、点击外部和关闭后的焦点去向。
- Pointer-only 拖拽在 Docs 中声明输入约束，并覆盖 accepted、rejected、ghost 和多目标等真实分支。

完成标准：组件支持的每种输入路径都能在 Canvas 中完成，视觉状态与语义状态同步，关闭临时界面后焦点位置可预测。

## 异步与有状态场景

- loading、success、empty 和 error 由 fixture 直接到达；只有时间过程本身属于契约时才用受控 timer 展示转换。
- 网络成功与失败使用本地数据、data URL 或受控 fake；随机值和当前时间使用固定输入。
- 每个 story 实例初始化自己的响应式状态；timer、全局 listener、store、单例和 document 改动都有对称清理。

完成标准：story 直接打开、连续刷新及从其他 story 切回时得到相同初始状态，所有依赖均为本地 fixture 或受控 fake。

## 响应式与容器边界

- 容器响应式组件在 `render` 中编码固定宽度、overflow、sticky 或滚动上下文。
- 依赖 viewport breakpoint 的组件在 Canvas 中检查断点两侧的明确宽度。
- 文本或内容尺寸影响布局时，覆盖最短、最长和空内容中的真实边界。

完成标准：每个相关断点两侧和每个相关容器约束都有可复现的场景，内容保持可读且主要操作可达。

## 浮层、Teleport 与拖拽

- Tooltip、Menu、Dialog 和拖拽 ghost 覆盖默认位置、裁切容器、viewport 边缘、滚动或 sticky 上下文中的适用项。
- Teleport 内容在浅色与深色主题下与触发区域一致。
- 浮层打开和关闭后，document 级节点、scroll lock、listener 与 z-index 状态恢复到初始值。

完成标准：浮层在所有声明场景中保持可见、定位稳定、层级正确，关闭后页面环境恢复。

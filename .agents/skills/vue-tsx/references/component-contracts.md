# Vue TSX 组件契约

当任务涉及 props、emits、slots、attrs、fallthrough 或组件公开类型时读取本文件。

## 总则

- 组件公开契约以 `defineComponent()` 的运行时选项为准。
- 依赖选项推导 setup context 和调用方类型，不重复声明 `interface Props`，也不手工重写 `{ emit, slots }` 的类型。
- setup props 不可整体 destructure；读取用 `props.x`，watch 源用 `() => props.x`，需要单个 ref 时用 `toRef(props, 'x')`。

## Props

运行时构造器必须匹配实际值：

```tsx
import type { PropType, VNodeChild } from 'vue'

props: {
  item: {
    type: Object as PropType<Item>,
    required: true,
  },
  items: {
    type: Array as PropType<Item[]>,
    default: () => [],
  },
  renderItem: {
    type: Function as PropType<(item: Item) => VNodeChild>,
    required: true,
  },
}
```

- 字符串联合：`String as PropType<'a' | 'b'>`。
- 对象：`Object as PropType<T>`。
- 数组：`Array as PropType<T[]>`，不要写成 `Object as PropType<T[]>`。
- 函数：`Function as PropType<Fn>`，不要用 `Object` 伪装。
- 必填 prop 用 `required: true`，不写 default。
- 可选 prop 只有在确有语义默认值时才写 default，不为消除 `undefined` 填伪默认值。
- Boolean 可选 prop 显式写 `default: false` 或业务需要的默认值，使 API 文档清楚。
- 对象、数组等可变默认值使用工厂：`default: () => ({})`、`default: () => []`。
- `defineComponent<Props>()` 不能代替运行时 props；后者承载默认值、运行时校验和 docgen。

## Emits

无 payload 的简单事件可以使用数组：

```tsx
emits: ['close', 'retry'] as const
```

有 payload 时使用对象式 emits，让组件内部 `emit()` 和调用方 `onXxx` 同时获得类型：

```tsx
emits: {
  select: (item: Item) => item.id.length > 0,
  change: (_value: string) => true,
  'update:modelValue': (_value: string) => true,
}
```

- validator 有真实约束时返回校验结果。
- 只用于类型声明时，参数加 `_` 前缀并返回 `true`。
- 禁止数组式 emits 再手工标注 setup context；它不会把 payload 类型完整传播给调用方。

## Slots

slot 使用 `SlotsType` 声明；可选 slot 写 `?`，slot props 写在函数参数中：

```tsx
import type { SlotsType, VNodeChild } from 'vue'

slots: Object as SlotsType<{
  default?: () => VNodeChild
  item: (props: { item: Item, selected: boolean }) => VNodeChild
}>
```

调用和传递：

```tsx
// child：调用
slots.item({ item, selected: true })

// parent：默认 slot
<Panel>{() => <span>内容</span>}</Panel>

// parent：具名 / 作用域 slots
<List>
  {{
    default: () => <Empty />,
    item: ({ item, selected }) => <Row item={item} selected={selected} />,
  }}
</List>

// 转发时保留函数
<Wrapper>
  {{
    default: slots.default,
  }}
</Wrapper>
```

- slot 是惰性函数；转发时传函数本身，不要提前调用成 `slots.default?.()`。
- slot 返回类型通常用 `VNodeChild`；确实要求单个 VNode 时才收窄为 `VNode`。

## Attrs、class 与 fallthrough

- 单元素根节点默认接收未声明 attrs，包括 `class`、`style`、`aria-*`、`data-*` 和监听器。
- Fragment、多个根节点或以 `Teleport` 为主要根结构时，必须明确 attrs 的落点。
- attrs 要落到内部特定节点时，设置 `inheritAttrs: false`，从 setup context 取得 `attrs`，用 `mergeProps()` 合并 class、style 和事件后传给目标节点。
- 只声明 `class` prop 不能替代完整 attrs 转发。只有组件 API 明确允许“外部 class 定向作用于某个节点”时才声明 `class`。
- 多区域样式逃生口使用目标明确的名字，如 `classNameRoot`、`classNameContent`；泛用根节点 class 不命名为 React 风格的 `className`。

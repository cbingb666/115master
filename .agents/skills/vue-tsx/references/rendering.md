# Vue TSX 渲染

当任务涉及模板迁移、JSX 语法、事件、v-model、动态/内置组件、ref、class、`h()` 或组件导入时读取本文件。

## 模板与 TSX 对照

| 模板 | TSX |
| --- | --- |
| `v-if` / `v-else` | `{cond && <X />}` 或三元；加载、错误等多分支在渲染函数内 early return |
| `v-for` | `arr.map(item => <Row key={item.id} />)` |
| `@click.self.stop` | `onClick={withModifiers(fn, ['self', 'stop'])}` |
| `.capture` / `.once` / `.passive` | 事件名后缀，如 `onClickCapture`、`onKeyupOnce`、`onScrollPassive` |
| 组件 `v-model="x"` | `modelValue={x.value}` + `onUpdate:modelValue={value => (x.value = value)}` |
| `v-show` | `v-show={expr}` |
| `<component :is>` | 已有组件变量用 `<Comp />`；动态值或动态 props 用 `h(Comp, props)` |
| `<Teleport>` / `<Transition>` / `<KeepAlive>` | 从 `vue` 显式 import 后作为作用域变量使用 |
| 模板 ref | `shallowRef<HTMLElement>()` + `ref={element}`，通过 `element.value` 读取 |
| 无对应 | Fragment `<>...</>` |

- 禁止 `<component is={Comp} />`；小写 `component` 会编译成字面标签，不具备模板 `<component :is>` 的动态语义。
- 项目统一显式展开组件 `v-model`，不使用插件的 `v-model={x}` 简写。
- JSX 使用 `class`、`for`，不使用 DOM 的 React 别名 `className`、`htmlFor`。

## Tailwind class 与变体

枚举 prop 对应的类名使用完整字面量查找表，让 Tailwind 能静态扫描：

```tsx
const paddingClasses: Record<Size, string> = {
  sm: 'p-3',
  md: 'p-4',
}
```

短 class 使用数组：

```tsx
class={['rounded-full', paddingClasses[props.size], props.class]}
```

较长且依赖响应式值时可以集中计算，但每个 Tailwind 类名仍须以完整字面量出现在源码：

```tsx
const cls = computed(() => `
  rounded-lg shadow-lg
  ${typeClassMap[props.type]}
  ${props.compact ? 'p-2' : 'p-4'}
`.replace(/\s+/g, ' ').trim())
```

- 禁止 `` `text-${type}` ``、`` `p-${size}` `` 等动态拼接；Tailwind 不理解运行时代码，可能静默漏产物。
- 类名排序交给 `eslint-plugin-tailwindcss` 和 `pnpm lint:fix`。插件未必识别脱离 `class` 属性的任意字符串，查找表和 computed 字符串仍要人工确认。
- daisyUI 组件、语义颜色和样式规则只由 `daisyui` skill 维护，本文件不重复。

## 何时使用 h()

组件只是“一个动态标签 + props/class 合并 + slot 透传”时，`h()` 往往比 JSX 更短：

```tsx
setup: (props, { slots }) => {
  return () => h(
    props.as,
    { class: ['rounded-full', props.class] },
    slots.default?.(),
  )
}
```

不要为了绕过正常 TSX 类型错误而机械改写为 `h()`；Storybook JSX 类型污染的诊断只由 `storybook-stories` skill 维护。

## 组件导入

- `components/` 内部互引使用相对深路径，如 `../Empty/Empty`。
- 禁止组件内部经 `@/components` barrel 互引；barrel 会加载整张导出图，容易制造或放大循环依赖，且运行时错误可能绕过 type-check、lint 和 build。
- 页面、hooks 等组件目录外的消费者可以使用 `@/components` barrel。
- 修改文件时只修正本次触及的违规导入，不扩大全仓重构范围。

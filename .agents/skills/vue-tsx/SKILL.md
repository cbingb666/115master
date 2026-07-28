---
name: vue-tsx
description: 编写 / 重构 / 审查 apps/monkey 的 Vue TSX 组件时使用 —— defineComponent + setup 渲染函数的骨架、props / emits / slots 类型化、JSX 与模板的语法差异（事件、v-model、条件渲染）、Tailwind 变体查找表、反模式与验证。.vue 迁 .tsx 或 TSX 写法存疑（插槽 / 事件 / 内置组件）时同样触发。
---

# Vue TSX 组件规范（apps/monkey）

> 通用风格（命名、early return、导出规则）见 `.agents/STYLE_GUIDE.md`，不在此重复。
> 图标规则由 `icons` skill 维护。
> 组件 stories 写法与 react 类型污染防护见 `storybook-stories` skill。

## 选型：一律 TSX

组件只用 TSX，不新增 .vue 文件。存量 SFC（XPlayer 等）是待淘汰资产，随迭代迁移为 TSX，不在其上叠加新功能。

## 骨架

照抄此形。类型全部从运行时声明推导，不写 `interface Props`。

```tsx
import type { PropType, SlotsType } from 'vue'
import { defineComponent } from 'vue'

const Xxx = defineComponent({
  name: 'Xxx',

  props: {
    size: {
      type: String as PropType<'sm' | 'md'>,
      default: 'md',
    },
  },

  emits: ['close'] as const,

  slots: Object as SlotsType<{
    default: () => void
  }>,

  setup(props, { emit, slots }) {
    return () => (
      <div onClick={() => emit('close')}>
        {slots.default?.()}
      </div>
    )
  },
})

export default Xxx
```

- `name` 必填：devtools 显示、`KeepAlive` include 都靠它。
- `emits: [...] as const` 后 emit 事件名自动推导；有 payload 时在 setup 上下文补标注：`{ emit }: { emit: (event: 'close', id: string) => void }`。
- slots 用 `slots: Object as SlotsType<{...}>` 声明，setup 上下文里直接获得类型，无需再标注。

## Props

- 运行时声明为准：联合类型 `String as PropType<'a' | 'b'>`，对象 / 数组 `Object as PropType<T>`。
- 可选 prop 一律写 `default`（Boolean 也显式 `default: false`）；对象 / 数组的 default 用工厂 `default: () => ({ x: 0, y: 0 })`。
- props 整体禁止 destructure（`const { size } = props` 丢响应性）；watch 源写 `() => props.size`。
- 需要把外部 class 合并到内部特定节点时，显式声明 `class` prop（Header / Pill 模式）；否则依赖 fallthrough 自动落根节点，不声明。

## 渲染语法（与模板的差异点）

| 模板 | TSX |
| --- | --- |
| `v-if` / `v-else` | `{cond && <X />}` / 三元；加载、错误等多分支直接在渲染函数里 early return（UserInfo 模式） |
| `v-for` | `arr.map(item => <Row key={item.id} />)` |
| `@click.self.stop` | `onClick={withModifiers(fn, ['self', 'stop'])}`；`capture` / `once` / `passive` 用后缀：`onClickCapture`、`onKeyupOnce` |
| `v-model="x"` | 显式展开：`modelValue={x.value}` + `onUpdate:modelValue={v => (x.value = v)}` |
| `v-show` | `v-show={expr}`（插件支持，照写） |
| `<component :is>` | `h(Comp, props)`；禁止 `<component is={Comp} />`，JSX 会把它解析为名为 `component` 的组件 |
| `<Teleport>` `<Transition>` `<KeepAlive>` | `import { Teleport, Transition, KeepAlive } from 'vue'` 后直接当标签用（JSX 按作用域变量解析，不 import 运行时才爆） |
| 模板 ref | `shallowRef` + `ref={menuRef}`，读到的是元素本身 |
| 无对应 | Fragment `<>...</>` 可用 |

## class 与变体：查找表

变体样式（size / type 等枚举 prop）用 `Record<Variant, string>` **查找表**，类名以完整字面量落进源码（Empty 模式）：

```tsx
const paddingClasses: Record<Size, string> = {
  sm: 'p-3',
  md: 'p-4',
}
```

多行 class 两式，按长度选：

```tsx
// 短：数组
class={['pill', props.class]}

// 长：模板串压平（可内联条件）
const cls = computed(() => `
  alert shadow-lg
  ${typeClassMap[props.type]}
  ${props.className}
`.replace(/\s+/g, ' ').trim())
```

类名排序交给 `eslint-plugin-tailwindcss`（`pnpm lint:fix`），不手工排。

## h() 的场景

组件只是"一个标签 + class 合并 + 透传 slot"（Pill）时用 `h()` 不写 JSX——更短，且不含 JSX 语法的组件免疫 storybook 的 react 类型污染：

```tsx
setup: (props, { slots }) => {
  return () => h(props.as, { class: ['pill', props.class] }, slots.default?.())
}
```

## 导入

- `components/` 内部互引：相对深路径（`../Empty/Empty`）。经 `@/components` barrel 互引会形成循环——dev 运行时抛 `X is not defined`，而 type-check / lint / build 全绿拦不住。
- 页面 / hooks 消费组件：可经 `@/components` barrel。

## 反模式

| 反模式 | 代价 | 正确写法 |
| --- | --- | --- |
| destructure props | 丢响应性，prop 更新视图不刷新 | `props.x` / `() => props.x` / `toRef` |
| `` `text-${type}` `` 拼接 Tailwind 类名 | Tailwind 按源码扫描，拼出的类名不进产物，样式静默丢失 | 查找表（完整字面量） |
| JSX 里写 `v-if` / `v-for` | babel-plugin-jsx 不支持，编译报错 | `&&` / 三元 / `map` |
| `v-model={x}` 插件语法 | 修饰符写法冷门，与 emits 类型推导脱节 | 显式 `modelValue` + `onUpdate:modelValue` |
| `defineComponent<Props>()` 泛型替代运行时声明 | 丢默认值与运行时校验，storybook docgen 也依赖运行时声明 | 运行时 props + `PropType` |
| setup 返回响应式数据对象 | TSX 组件的契约是返回渲染函数 | `return () => (...)` |
| 组件互引走 `@/components` barrel | 循环引用，dev 抛 `X is not defined` | 相对深路径 |

## Stories

纯 UI 组件（props / slots 驱动、不依赖 store / router / GM API）必须编写 stories：组件完成后调用 `storybook-stories` skill 按其规范编写，stories 缺失视为未完成。

## 验证

```bash
pnpm -F @115master/monkey lint && pnpm -F @115master/monkey type-check && pnpm -F @115master/monkey build
```

完成标准：命令三绿；纯 UI 组件另有 stories 且 `pnpm -F @115master/monkey build-storybook` 通过。stories 报错先查 `storybook-stories` skill 的报错速查表。

# UI 样式以可编译入口分发

`@115master/ui` 使用 Vite library mode 生成 ESM JavaScript，并以 `vue-tsc` 独立检查类型和生成声明；公共 CSS 作为保留 Tailwind、daisyUI、imports 与显式 UI source 注册的可编译样式入口复制到 `dist`，不在 UI 包构建时生成最终 Tailwind bundle。Monkey 和 UI Storybook 各自在自己的 Vite 构建中处理该入口，使应用源码与 UI 产物只经过一条 Tailwind 管线。Vue、Tailwind 与 daisyUI 是消费环境必须显式提供的 peer dependencies，`@floating-ui/vue` 是 UI 包拥有的 Tooltip 运行依赖。相比预编译 UI CSS，这要求消费方具备约定的 Tailwind/daisyUI 构建链，但避免重复 preflight、主题、框架实例与工具类，并保持公共样式配置的单一事实来源。

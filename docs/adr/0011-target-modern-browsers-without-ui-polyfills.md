# UI 包不内置浏览器 polyfill

`@115master/ui` 以支持原生 `<dialog>`、ResizeObserver、IntersectionObserver 和标准 Teleport DOM 能力的现代浏览器为运行基线，不打包 polyfill；需要更旧目标时由应用按自身兼容矩阵注入。UI 模块在求值阶段不得直接访问 `window` 或 `document`，使服务工厂、类型和组件定义可以在 SSR 与 Node 测试中安全 import，浏览器能力只在实际挂载时使用。相比包内兜底，这缩小了运行时体积与隐式全局副作用，但把旧环境兼容责任明确交给消费应用。

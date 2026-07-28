# Dialog 原语使用原生 dialog

`@115master/ui` 的 Dialog 原语使用原生 `<dialog>`，由受控状态同步 `showModal()` 与 `close()`，并在其上实现蒙层策略和组件事件。打开与关闭生命周期由 CSS transition 状态驱动，opened 和 closed 在真实过渡结束后结算，并以计算样式得到的过渡时长作安全兜底；`prefers-reduced-motion: reduce` 下立即完成。动画时长先作为内部 token，不进入首批公共 token。相比延续 `div.modal + modal-open` 与固定 `setTimeout(300)`，原生元素需要处理 Vue 状态、DOM 状态和延迟卸载的同步，但能直接获得 top layer、模态焦点约束、Escape 关闭语义和关闭后的焦点恢复，并避免生命周期依赖猜测时长；Monkey 的 Promise 与路由历史行为仍留在 Dialog 服务中。

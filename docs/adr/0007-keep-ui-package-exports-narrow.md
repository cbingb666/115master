# UI 包只开放窄入口

`@115master/ui` 的组件、服务与类型只从包根命名导出，公共样式单独从 `@115master/ui/styles.css` 导入；不提供默认导出、组件深层路径或通配 subpath exports。首批公共组件固定为 Button、Pill、Tooltip、Dialog、DialogHost 与 OverlayHost，公共服务固定为 createDialogService 与 useDialog；公开类型仅覆盖这些组件的 Props、选项、结果、关闭原因、服务实例和句柄。内部 Dialog 子组件、provide 方法和默认单例保持私有。包只输出 ESM JavaScript、类型声明与公共样式，不生成 CommonJS、UMD 或浏览器全局格式。Monkey 在开发、Storybook、测试、类型检查与生产构建中都消费真实 `dist` exports，不设置源码 alias；UI 包以 watch build 提供开发增量更新。相比继续支持 Monkey 现有的默认导入和多层相对路径，本次会产生较多机械 import 变更与一次跨包构建等待，但能让内部目录保持可重构，使公共 UI 契约在一个入口上可见，并避免源码开发路径与实际分发路径不一致。

# 每个 Vue 应用由 Modal Host 协调原生模态表面

`@115master/ui` 的 Dialog、Drawer 与 Dialog Service 条目统一进入最近的单个 Modal Host，并按真实打开顺序共享 top-only 交互、单层蒙层与焦点返回链；Dialog Host 只保留命令式 Dialog 服务条目的所有权，Navigation Stack 只保留表面内部的内容导航。相比全局 modal manager、调用方传层级或各表面独立管理焦点，这要求每个 Vue 挂载显式提供一个 Host，但能让独立挂载保持隔离、混合表面正确嵌套，并避免把协调细节扩散到公共接口。

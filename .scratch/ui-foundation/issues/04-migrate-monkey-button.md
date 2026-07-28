# 04 — 迁移 Monkey Button 并收缩旧所有权

**What to build:** 将 Monkey 的通用页面、布局、业务组件、播放器与媒体界面一次性切换到公共 Button，使用户在全部既有流程中继续获得相同的动作语义和视觉状态；迁移完成后删除旧实现，避免双重所有权。

**Blocked by:** 03 — 发布 Button 公共契约.

**Status:** ready-for-agent

- [ ] Monkey 的所有 Button 消费点都从 `@115master/ui` 包根导入，不再引用应用内 Button
- [ ] 通用页面、布局、表单、选择工具、播放器控制和媒体组件的 Button props、slots 与事件完成类型安全迁移
- [ ] 现有图标仍由 Monkey icon registry 或调用方 slots 提供，UI 包不感知具体图标系统
- [ ] 所有动作 Button 保持原生按钮语义，原有 link 视觉不会被转换为导航语义
- [ ] 表单中的 Button 不因默认 type 变化产生意外提交，确需 submit 的调用点显式声明
- [ ] disabled、loading、active、block、shape、size 与 Glass 使用在迁移后保持外部行为
- [ ] Monkey 的组件和应用集成 stories 继续通过正式 UI dist 渲染 Button，不复制 UI 基础矩阵
- [ ] Monkey 本地 Button 实现、对应基础 Story、旧行为测试和只服务旧实现的样式被删除
- [ ] 不保留应用内 Button 转发壳、默认导出别名、深层兼容路径或旧 CSS 类别名
- [ ] 全仓搜索不再发现对 Monkey 本地 Button 模块的生产或 Storybook 引用
- [ ] Monkey 类型检查、现有测试、Storybook 构建和生产构建在收缩旧实现后保持通过

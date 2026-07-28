# 图标验证

规范判定以 [`usage.md`](usage.md) 和 [`design.md`](design.md) 为准，验证要求见下文。

## 源码一致性

- 逐条核对与改动相关的使用或 SVG 合约。
- 确认 registry、调用点、`Icon.stories.ts` Gallery 和 `custom/` 无孤儿或残留引用。
- 人工判断中央 `Icon` 实现与 HOME 原生 DOM 例外，不能仅凭搜索结果下结论。

可用以下命令定位可疑项：

```bash
rg -n "@iconify/vue|<iconify-icon|<IconifyIcon" apps/monkey/src
rg -n "ion:|custom:" apps/monkey/src --glob '!**/icons/registry.ts'
```

## 验证层级

工程命令均以 `pnpm -F @115master/monkey` 为前缀。

| 改动 | 工程验证 | 视觉验证 |
| --- | --- | --- |
| 使用现有 `I.*` | `lint`、`type-check` | 受影响界面 |
| 修改 registry | 上述验证加 `test`、`build` | Gallery 和受影响界面 |
| 修改自定义 SVG | 上述验证加 `build-storybook` | 下方完整检查 |
| 只审查不改代码 | 按发现范围执行 | 提供证据或明确未验证 |

触及其他组件或交互时，叠加对应模块的测试。

## 自定义 SVG 视觉检查

- 在 14、16、20、24 px 下检查清晰度和裁切。
- 与设计阶段选择的参照并排，按 `design.md` 的造型原则检查。
- 检查亮暗主题、语义文本色、成对状态和实际业务上下文。

# Context Map

## Contexts

- [Drive115](./packages/drive115/CONTEXT.md) — 封装并统一暴露 115 网盘领域能力
- [UI Foundation](./packages/ui/CONTEXT.md) — 提供应用无关的视觉语义与 UI 契约

## Relationships

- **UI Foundation → Monkey**：Monkey 消费应用无关的 UI 契约；应用集成留在 Monkey 内部
- **Drive115 → Monkey**：Monkey 消费 115 网盘能力，并负责将结果呈现为用户界面

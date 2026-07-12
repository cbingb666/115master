# Domain Docs

工程类 skill 在探索本仓库代码时，应如何消费领域文档。

## Before exploring, read these

- **`CONTEXT-MAP.md`**（仓库根）—— 它指向每个 context 各自的 `CONTEXT.md`。阅读与当前主题相关的那些。
- **`docs/adr/`**（仓库根）—— 系统级决策，阅读与你要改动的区域相关的 ADR。
- **各 context 的 `CONTEXT.md` 与 `docs/adr/`** —— 见下方文件结构，按 topic 取用。

若上述文件尚不存在，**静默继续**。不要标记其缺失，也不要预先建议创建。`/domain-modeling` skill（经 `/grill-with-docs` 与 `/improve-codebase-architecture` 触达）会在术语或决策真正落定时按需创建它们。

## File structure

Multi-context（本仓库）：根 `CONTEXT-MAP.md` + 各 package/app 自带 `CONTEXT.md`。

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
├── apps/
│   └── monkey/
│       ├── CONTEXT.md
│       └── docs/adr/                  ← app 级决策
└── packages/
    ├── drive115/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← package 级决策
    ├── shared/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── ...                            ← 其余 package 同构
```

## Use the glossary's vocabulary

当你的输出（issue 标题、重构提案、假设、测试名）命名某个领域概念时，使用 `CONTEXT.md` 中定义的术语，不要漂移到 glossary 明确规避的同义词。

若你需要的概念尚未收入 glossary，这是一个信号——要么你在发明项目并不使用的语言（重新考虑），要么存在真实缺口（记下来交给 `/domain-modeling`）。

## Flag ADR conflicts

若你的输出与某个既有 ADR 冲突，显式指出，而不是默默覆盖：

> _与 ADR-0007（event-sourced orders）冲突——但值得重开，因为……_

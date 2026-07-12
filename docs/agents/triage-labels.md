# Triage Labels

triage 等技能用五个标准 triage 角色说话。本文件把这些角色映射到本仓库 issue tracker 实际使用的字符串。

本仓库用 local markdown tracker（见 `issue-tracker.md`），triage 状态以 `Status:` 行的形式记录在每个 issue 文件顶部附近，而非 GitHub label。

| mattpocock/skills 中的角色 | 我们的 Status 值   | 含义                        |
| -------------------------- | ------------------ | --------------------------- |
| `needs-triage`             | `needs-triage`     | 维护者需要评估此 issue       |
| `needs-info`               | `needs-info`       | 等待提交者补充更多信息       |
| `ready-for-agent`          | `ready-for-agent`  | 已完整规约，可交给 AFK agent |
| `ready-for-human`          | `ready-for-human`  | 需要人工实现                 |
| `wontfix`                  | `wontfix`          | 不会处理                     |

当某 skill 提到一个角色（如"apply the AFK-ready triage label"），用上表对应的字符串写到 issue 文件的 `Status:` 行。

需要改用自定词汇时，编辑右栏即可。

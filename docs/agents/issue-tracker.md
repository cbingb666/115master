# Issue tracker: Local Markdown

Issues 与 specs（即 PRD）以 markdown 文件形式存放在 `.scratch/`。

## Conventions

- 一个 feature 一个目录：`.scratch/<feature-slug>/`
- spec 文件：`.scratch/<feature-slug>/spec.md`
- 实现类 issue 一票一文件：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 起编号——绝不合并成单个 tickets 文件
- Triage 状态记录在 issue 文件顶部附近的 `Status:` 行（角色字符串见 `triage-labels.md`）
- 评论与对话历史追加到文件底部 `## Comments` 标题下

## When a skill says "publish to the issue tracker"

在 `.scratch/<feature-slug>/` 下新建文件（必要时创建目录）。

## When a skill says "fetch the relevant ticket"

读取被引用路径的文件。用户通常会直接给出路径或 issue 编号。

## Wayfinding operations

供 `/wayfinder` 使用。**map** 是一个文件，每个 ticket 对应一个 **child** 文件。

- **Map**：`.scratch/<effort>/map.md` —— Notes / Decisions-so-far / Fog 正文。
- **Child ticket**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 起编号，正文写问题。`Type:` 行记录 ticket 类型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed`/`resolved`。
- **Blocking**：文件顶部附近的 `Blocked by: NN, NN` 行。当其列出的每个文件都 `resolved` 时，该 ticket 解阻塞。
- **Frontier**：扫描 `.scratch/<effort>/issues/`，找出 open、未阻塞、未 claimed 的文件，按编号最小的胜出。
- **Claim**：在任何工作开始前，设置 `Status: claimed` 并保存。
- **Resolve**：在 `## Answer` 标题下追加答案，设置 `Status: resolved`，再把上下文指针（gist + 链接）追加到 `map.md` 的 Decisions-so-far。

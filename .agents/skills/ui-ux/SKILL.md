---
name: ui-ux
description: General UI/UX policy and parent skill for specialized UI systems. Apply when designing, modifying, or reviewing UI across web, mobile, or desktop; use its child skills for domain-specific systems such as Glass.
---

# UI/UX Policy

Each section is one rule. Add a new rule by appending a new section in the same shape: **Rule → Why (classic terms) → Decision → Anti-patterns**.

---

## 专项 skills

- Glass 材质、Button/Pill Glass 变体、Popup、悬浮控制、媒体浮层、侧栏或 Sheet：调用子 skill [`glass-ui`](./glass-ui/SKILL.md)。

## Rule 1 — Feedback: visible change is its own notification

**Visible in-band change → no explicit notification. Invisible result → notify.**

### Why (classic terms)
- **Redundant feedback** — same info encoded in two channels lowers signal-to-noise ratio.
- **Direct manipulation** (Shneiderman) — the user sees the effect; narration is noise.
- **Visibility of system status** (Nielsen) — make status visible; don't restate it.

### Decision

After any UI event, ask: **"Will the user see the result within ~200ms without me saying anything?"**

| Event | Visibility | Notify? |
|-------|------------|---------|
| User action with visible effect (row disappears, badge flips, optimistic apply, inline progress) | In-band | No |
| System change with visible cue (sync indicator, save badge, progress bar) | In-band | No |
| Off-screen side effect (async job on another view, server-only write, clipboard with no cue) | Out-of-band | Yes (success) |
| Any failure | — | Yes |

### Anti-patterns
- `toast.success('Deleted')` when the row already disappeared → silent
- `console.error(err)` only → always surface errors
- Toast on every state change → reserve for invisible results and errors
- Silent failure on a critical path → always notify errors, even when UI didn't change

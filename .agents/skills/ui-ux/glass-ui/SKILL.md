---
name: glass-ui
description: Apply the shared UI Foundation Glass material to Button, Pill, popups, overlays, Sheets, and Dialog panels. Use when choosing or changing a Glass surface, filter owner, highlight, border, shadow, or transparency fallback.
---

# Glass UI

Glass is a material selected by the carrying surface, not a collection of caller-owned decoration utilities. The material owns foreground, background, edge treatment, highlight, shadow, transparency fallback, and any backdrop filter.

Before editing, read [the UI Foundation language](../../../../packages/ui/CONTEXT.md), [the Design Tokens skill](../../design-tokens/SKILL.md), and [the material source](../../../../packages/ui/src/styles/glass.css). Import the shared public style entry; do not copy material rules into an application stylesheet or a component caller.

## Choose exactly one carrying-surface scenario

| Scenario | Use it for | Filter ownership |
| --- | --- | --- |
| `surface` | Weak hierarchy inside an existing panel | No backdrop filter |
| `inset` | Selected or contained information within a floating surface | No backdrop filter |
| `floating` | Control groups, menus, and compact floating surfaces | The outer floating surface owns the filter |
| `overlay` | Actions or information over media that need stable contrast | The outer overlay owns the filter |
| `panel` | Sidebars, Sheets, and Dialog panels | The outer structural panel owns the filter |

The UI Foundation source maps these scenario names to its public material selectors. Read that source rather than restating or guessing color, blur, border, highlight, shadow, or fallback values here.

## Apply the material at its boundary

1. Identify the surface that carries the material and classify it with one scenario.
2. Use the corresponding existing public component variant or public material selector. Do not assemble a substitute from background, border, shadow, opacity, and backdrop utilities.
3. Let only that outer surface own a backdrop filter. Descendants, nested surfaces, hover states, and transitions must not add another filter or change its strength.
4. Let the material source handle reduced-transparency and unsupported-filter fallbacks. Callers must not fork their own fallback styling.

Use `surface` and `inset` to preserve hierarchy without creating a second compositing layer. Use `floating`, `overlay`, and `panel` only where the carrying surface itself needs to separate from its backdrop.

## Button, Pill, and Dialog boundaries

- A Glass Button is still an action. Use the public Button contract and one of its supported Glass variants only when the action belongs on the classified material surface; do not make a link look like an action by styling it as a Button.
- A Glass Pill remains information, grouping, or navigation containment. It does not acquire button behavior because it uses a Glass material.
- A Dialog panel uses the `panel` scenario. Dialog modality, focus, close behavior, stack behavior, and outcomes remain the Dialog contract's responsibility; the material only owns the panel surface.

Do not depend on an application-specific Glass class, manually compose backdrop filters, or add any visual filter outside the material source. If the desired appearance needs a new material capability, stop and perform the Design Tokens review before adding CSS.

## Token and Theme review

Glass changes are shared visual decisions. Confirm that the existing daisyUI semantic variable or UI token already owns the decision; otherwise follow the Token promotion process before implementing it. Never record concrete material values in this skill, a component story, or application CSS as a parallel source of truth.

Check every affected scenario in both light and dark Theme modes. Verify readable content, a continuous outer surface, and exactly one filter owner per visual region. Use the UI Storybook Theme and Glass tracer as the baseline for material inspection, then add or update a hermetic public Story when the public material contract changes.

## Completion checks

- Each affected surface has one scenario and one outer material owner.
- Nested `surface` and `inset` content remains filter-free.
- Button, Pill, and Dialog retain their own public semantic contracts.
- The material works in both Themes without caller-specific fallback CSS.
- Design Tokens and Storybook checks have been applied before the change is handed off.

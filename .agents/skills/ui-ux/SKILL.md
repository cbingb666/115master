---
name: ui-ux
description: Cross-project UI policy and routing for 115Master. Apply when designing, implementing, or reviewing UI in any application; route token, Glass, Storybook, icon, and TSX work to the specialized skills below.
---

# UI/UX Policy

This is the cross-project policy layer. It decides ownership, semantics, and the next specialized skill; it does not maintain a second table of visual values.

Before changing shared UI, read [the UI Foundation language](../../../packages/ui/CONTEXT.md) and [the token source-of-truth ADR](../../../docs/adr/0002-ui-token-source-of-truth.md). Read the relevant source under `packages/ui/src/styles/` when a decision depends on an actual visual value.

## Route the work

| Need | Required skill or source |
| --- | --- |
| Public versus internal visual ownership, Theme semantics, a new CSS value, or a possible shared token | [Design Tokens](../design-tokens/SKILL.md) |
| Glass material; a Glass Button, Pill, popup, overlay, Sheet, or Dialog panel | [Glass UI](./glass-ui/SKILL.md), then Design Tokens |
| Public component, material, token, or service story | [Storybook Stories](../storybook-stories/SKILL.md) and the UI Storybook configuration |
| Application composition, router/store/GM integration story | Storybook Stories and the application Storybook configuration |
| daisyUI component or Tailwind UI implementation | [daisyUI](../daisyui/SKILL.md) |
| Monkey icon selection or registration | [Icons](../icons/SKILL.md) |
| Vue TSX implementation | [Vue TSX](../vue-tsx/SKILL.md) |

When a change touches Button, Pill, Tooltip, or Dialog, use their public UI contract if it exists. Do not create a local compatibility layer or import an internal UI module to bypass that contract.

## Rule 1 — Descend the implementation ladder deliberately

Choose the first option that satisfies the public need. Do not skip a rung because a lower-level implementation looks quicker.

1. An existing public UI contract, imported from the `@115master/ui` package root.
2. An official daisyUI component.
3. Tailwind utilities for layout, local geometry, and responsive composition.
4. Custom CSS only after Design Token review.

The public contract owns stable component semantics, interaction, and its supported variants. daisyUI supplies an existing generic component when no public contract exists. Tailwind utilities compose an existing component or layout; they do not replace its semantics. Custom CSS is for a capability that the preceding levels cannot express, and must use the UI namespace when it becomes shared UI.

## Rule 2 — Keep semantics ahead of appearance

- Use a native button or the public Button contract for an action; a link remains navigation even if it resembles a button.
- Use Pill for information, grouping, or a navigation container, never to disguise a button action.
- Keep Tooltip as non-interactive supplemental explanation. Move required actions or interactive content to the appropriate transient UI instead.
- Use Dialog for modal, stateful task interruption; keep application-specific routing and business behavior outside the UI Foundation contract.

Do not turn a semantic control into a generic clickable container just to obtain a desired visual treatment.

## Rule 3 — Preserve keyboard focus and reachable state

Every interactive path must be usable with keyboard focus in the same order and meaning as pointer interaction. Preserve a visible focus indication, avoid hiding necessary information behind hover alone, and restore focus when a transient interaction returns the user to its trigger.

Use the public contract's focus and close behavior for Tooltip, Overlay Host, and Dialog rather than recreating it in the caller. A component that needs a different focus model is a different public contract, not a caller-side override.

## Rule 4 — Make responsive changes preserve the task

Use responsive utilities and semantic layout changes to adapt density, placement, and reachability. A narrow layout may reorder or stack controls, but it must not remove an action, keyboard path, label, focus target, or necessary feedback. Prefer a layout change over a separate mobile-only copy of the same control.

Local layout geometry can stay local when it meets the Design Tokens skill's exemption; a repeated or cross-component visual decision must be reviewed for promotion.

## Rule 5 — Give feedback once, where the result is observable

When an action produces an obvious in-context change, that change is the success feedback. Do not add a redundant success notification. Notify successful effects the user cannot otherwise observe, and always make failures discoverable through the appropriate feedback path.

Loading, disabled, pending, validation, and error states belong to the public component or service outcome when they affect its contract; callers should not invent parallel state cues for the same transition.

## Rule 6 — Treat transient UI as a lifecycle, not decoration

Tooltip, popup, menu, overlay, and Dialog are temporary interactions with an owner, a trigger or cause, a close path, and a focus outcome. Render detached overlays through the current Theme scope and the public Overlay Host when the contract provides one. Render Dialogs through their host and service instance rather than a global or application DOM assumption.

Choose the transient primitive by behavior, not by its visual shell: Tooltip explains, a menu chooses, a popover enables an interactive secondary task, and Dialog interrupts for a modal task.

## Final UI review

- Is the selected level the highest available item on the implementation ladder?
- Do semantic element, keyboard focus, responsive behavior, and feedback agree?
- Are all shared visual decisions owned by the UI Foundation source rather than duplicated in callers or skills?
- Has the relevant specialized skill supplied the material, token, or Storybook checks?

---
name: design-tokens
description: Govern Design Token ownership for 115Master UI. Use when adding, changing, reviewing, or questioning a visual value, Theme semantic, custom CSS variable, shared geometry, motion, elevation, or Glass material.
---

# Design Tokens

This skill governs value ownership, not a catalog of values. The concrete values live only in the UI Foundation source.

## Read the source of truth first

Use [the UI Foundation language](../../../packages/ui/CONTEXT.md) for the domain terms and [the source-of-truth ADR](../../../docs/adr/0002-ui-token-source-of-truth.md) for the governing decision. Read the relevant source under [`packages/ui/src/styles/`](../../../packages/ui/src/styles/): the public style entry, Theme definitions, token declarations, Glass material, and component styles.

Never copy concrete colors, radii, shadows, elevations, motion values, or material values into this skill, another skill, a Storybook description, or an application stylesheet. When a reviewer needs a value, point to its source file and inspect it there. Distributed CSS is an output, not a second authoring source.

## Decide who owns the visual decision

| Kind | Owner and rule |
| --- | --- |
| Existing daisyUI semantic | Use the semantic color, radius, size, border, or component behavior directly. Do not add a synonymous `--ui-*` alias. |
| Public UI Token | Use only for a stable concept shared by applications, components, or materials that daisyUI does not already express. Define it in the UI Foundation style source with the UI namespace. |
| Internal Token | Keep a component or material adaptation private to its source. Consumers must not depend on its name or override it as if it were public. |
| Local geometry exception | Keep a value local when it serves one layout or one component instance only and has no cross-component visual meaning. It is not a token merely because it is a value. |

Colors, radii, shadows, elevation, motion, and material decisions are shared visual decisions when they express a reusable semantic role. Local placement, one-off sizing, and layout geometry remain local until they acquire that role.

## Reuse before creating

For each proposed value, answer in order:

1. Does an existing public UI contract already own the visual behavior?
2. Does daisyUI already provide the semantic needed across Themes?
3. Is the concept shared by a second real consumer or does it express one cross-component semantic?
4. Is it instead an internal adaptation or a local geometry exception?

Only the third answer can justify a new public UI Token. A second similar number is not enough by itself; the consumers must share the same visual meaning. A value that is merely convenient for one caller stays local.

## Promote a Token deliberately

When a local decision gains a second real consumer or becomes a cross-component semantic:

1. Confirm that a daisyUI semantic cannot express it without a duplicate alias.
2. Name the semantic role, choose the UI Foundation source file that owns it, and make Theme behavior explicit where the role is Theme-dependent.
3. Move both real consumers to the new owner and remove the duplicated local decisions.
4. Update the relevant Foundation Story and public contract documentation to prove the semantic behavior, without restating source values.
5. Check light and dark Theme modes and run the Storybook validation required by the changed contract.

Do not prebuild a complete token scale for hypothetical future consumers. A token becomes public because it has a real shared contract, not because a number looks reusable.

## Review custom CSS

Custom CSS comes after the public UI contract, daisyUI, and Tailwind utilities. Before approving it, verify:

- its semantic owner is clear and it does not duplicate a daisyUI variable or existing UI Token;
- shared classes, variables, and data attributes use the UI namespace;
- internal variables stay inside their component or material source;
- local geometry is documented by its immediate layout purpose, not promoted mechanically;
- affected Themes and transient surfaces still use the same semantic role;
- no documentation, story, or application override becomes a second table of concrete visual values.

For Glass material, continue with [Glass UI](../ui-ux/glass-ui/SKILL.md). For behavior and public-contract coverage, continue with [Storybook Stories](../storybook-stories/SKILL.md).

---
name: storybook-stories
description: Route and write hermetic Storybook contract coverage for the UI Foundation and Monkey integrations. Use when changing public UI components, tokens, Glass, Dialog services, application UI compositions, or their stories.
---

# Storybook Stories

Storybook coverage follows ownership. Start with [the UI Foundation language](../../../packages/ui/CONTEXT.md), then read the relevant public contract and its existing stories before choosing a host.

## Route each story before writing it

| Subject under test | Home | What it proves |
| --- | --- | --- |
| Public UI Token, Theme, Glass material, public component, Overlay Host, Dialog primitive, or Dialog service | UI Storybook in `packages/ui` | A hermetic base Story for the public UI contract |
| Application component composed with UI, router/history behavior, store state, GM API, business fixture, or application-only styles | Monkey Storybook in `apps/monkey` | The application integration boundary |
| Both a public contract and an application composition | One Story in each, with different assertions | The UI Story proves the contract; the Monkey Story proves only the composition-specific behavior |

Do not duplicate a public component matrix in Monkey. Do not pull a router, application store, mounted application DOM assumption, or business API into a UI base Story. Use the UI Storybook's Foundation and UI hierarchy for public coverage, following existing titles and configuration rather than inventing a parallel organization.

## Define a coverage unit from the public contract

Inventory the contract before creating scenarios:

- Props and their observable branches, including defaults, loading, disabled, responsive, and error states where public.
- Slots and rendered content boundaries.
- Emits and callbacks, with the user-visible result or emitted outcome shown by the Story.
- Dialog service options, service-instance isolation, and normal outcomes or structured close reasons.

Cover these through the public interface. Do not test private reactive state, implementation file layout, CSS implementation details, Floating UI call counts, or timer internals. A base Story uses the package root and public styles export, never a deep import or source alias.

Use `args` for prop-only branches. Use `render` when slots, composition, interactions, or a visible service outcome require it. A Dialog service Story creates its own service instance and shows the option-to-outcome path without relying on a global singleton.

Follow the nearby host's Storybook conventions for `Meta`, titles, tags, Docs, controls, and file placement. A public component Story should expose its real component contract; a pure Foundation Story may use `Meta` without inventing a component wrapper.

## Keep every Story hermetic

Opening, refreshing, or changing the order of Stories must produce the same initial state. Use local fixtures and controlled fakes; never require network access, a pre-existing app mount point, prior Story state, or a shared service instance.

When an integration Story needs a router, store, DOM host, timer, listener, or singleton, isolate it in a stable decorator or local setup and clean it up with the Story instance. A dependency that cannot be isolated belongs in the application Storybook and must be named explicitly as the integration under test.

## Read the applicable checklist

For interactions, async state, responsive layout, overflow, floating UI, Teleport, or dragging, read [SCENARIOS.md](SCENARIOS.md) and apply every matching check. For Monkey Story type failures involving JSX, `className`, `ReactNode`, or CSS modules, read [TYPING.md](TYPING.md). For a Storybook configuration, Theme, Teleport-host, or docgen change, read [INFRASTRUCTURE.md](INFRASTRUCTURE.md) and use the section for the selected Storybook host.

## UI Storybook test requirements

The UI Storybook configuration is the behavior seam for public UI contracts. Follow [`packages/ui/.storybook/preview.ts`](../../../packages/ui/.storybook/preview.ts) and [`packages/ui/vitest.config.ts`](../../../packages/ui/vitest.config.ts):

- run public Stories in real Chromium rather than treating jsdom as the behavior authority;
- use play functions for meaningful pointer, keyboard, focus, and service-outcome paths;
- treat a11y violations as errors;
- run the same public Story suite in both light and dark Theme projects;
- inspect Theme- or material-sensitive changes in the Foundation Theme and Glass tracer.

The Monkey Storybook proves integration and may offer a theme toolbar, but it does not duplicate the UI Storybook's base matrix or automatically inherit its dual-Theme browser-test requirement. Check affected application theme integration using its own configuration.

The first delivery does not require pixel snapshots, cloud visual regression, or a cross-platform screenshot baseline. Do not add those as a substitute for public behavior, play, or accessibility coverage.

## Validate the changed owner

For a UI Foundation Story or contract change, run the targeted package checks, including:

```bash
pnpm -F @115master/ui type-check
pnpm -F @115master/ui test
pnpm -F @115master/ui build-storybook
```

For a Monkey integration Story, run the affected application checks, including:

```bash
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey build-storybook
```

Use [Design Tokens](../design-tokens/SKILL.md) for visual-value ownership and [Glass UI](../ui-ux/glass-ui/SKILL.md) for a material scenario. Use the icon and Vue TSX skills whenever those implementation concerns apply.

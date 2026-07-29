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

## Separate the parent Canvas from explicit tests

The parent Story is the browsable Canvas. It owns the only `render`, `args`, fixture, service instance, and observable outcome, and it must remain at its hermetic initial state until a person interacts with it. Attach pointer, keyboard, focus, input, submit, Dialog, service-outcome, and router contracts to that parent with `<Story>.test()`. The `.test()` child runs only through an explicit test entry such as Manager Run tests or package Vitest.

Do not add a state-changing `play` that clicks, types, submits, moves focus, opens transient UI, advances a timer-driven flow, calls a service, or changes application history when someone opens the Canvas. Express a deliberately pre-opened, loading, success, or error example directly with `args`, `render`, or a hermetic fixture.

Adopt CSF Next incrementally by whole Story file. Do not mix CSF 3 and CSF Next in one file. When migrating a file, move its assertion-only `play` functions into the corresponding parent `.test()` children too; one module must not carry both autoplay and explicit-test semantics. Do not copy the parent into a display Story and a test Story or create a parallel test-Story directory.

## Keep every Story hermetic

Opening, refreshing, or changing the order of Stories must produce the same initial state. Use local fixtures and controlled fakes; never require network access, a pre-existing app mount point, prior Story state, or a shared service instance.

When an integration Story needs a router, store, DOM host, timer, listener, or singleton, isolate it in a stable decorator or local setup and clean it up with the Story instance. A dependency that cannot be isolated belongs in the application Storybook and must be named explicitly as the integration under test.

## Read the applicable checklist

For interactions, async state, responsive layout, overflow, floating UI, Teleport, or dragging, read [SCENARIOS.md](SCENARIOS.md) and apply every matching check. For Monkey Story type failures involving JSX, `className`, `ReactNode`, or CSS modules, read [TYPING.md](TYPING.md). For a Storybook configuration, Theme, Teleport-host, or docgen change, read [INFRASTRUCTURE.md](INFRASTRUCTURE.md) and use the section for the selected Storybook host.

## UI Storybook test requirements

The UI Storybook configuration is the behavior seam for public UI contracts. Follow [`packages/ui/.storybook/preview.ts`](../../../packages/ui/.storybook/preview.ts) and [`packages/ui/vitest.config.ts`](../../../packages/ui/vitest.config.ts):

- run public Stories in real Chromium rather than treating jsdom as the behavior authority;
- attach meaningful pointer, keyboard, focus, and service-outcome paths to the parent Story with `.test()`;
- treat a11y violations as errors;
- run the same public Story suite in light, dark, light reduced-motion, and light mobile projects from normal CLI, package-test, and CI entry points;
- treat Manager's light-only run as a Storybook 10.5.5 compatibility entry, never as the complete UI matrix;
- inspect Theme- or material-sensitive changes in the Foundation Theme and Glass tracer.

The Monkey Storybook proves integration and may offer a Theme toolbar, but its package test uses one application-default Theme browser project alongside its Node project. It does not duplicate the UI Storybook's light, dark, reduced-motion, or mobile matrix. Check affected application Theme integration using its own configuration.

Both hosts use a preview factory. Keep addon declarations in the Storybook main config and the matching addon annotations in the preview factory: UI registers Docs, a11y, and Vitest; Monkey registers Docs and Vitest. These registrations have different Manager and preview-runtime responsibilities and do not replace each other.

The first delivery does not require pixel snapshots, cloud visual regression, or a cross-platform screenshot baseline. Do not add those as a substitute for public behavior, explicit `.test()` contracts, or accessibility coverage.

## Preserve inertness and review version constraints

Every parent migrated from `play` must be listed in its host's `.storybook/inertness.json`. The host-level regression observes the initial entry, reload, and re-entry for at least three seconds, rejects automatic click, pointer, keydown, input, change, scroll, submit, and interactive focus events, and checks the declared initial outcomes. The static Storybook index must expose the parent and its differently identified `.test()` children from the same Story module.

The repository is pinned to Storybook 10.5.5. Do not add `experimentalTestSyntax`, which this version does not expose, and do not use internal embed mode or private autoplay-suppression switches. On every Storybook upgrade, recheck the public feature flag, Manager project names and the light-only workaround, both static indexes, preview addon annotations, and a minimal parent-inertness plus `.test()` execution path in Manager and CLI.

## Validate the changed owner

Run targeted checks through Turbo so the package and its upstream workspace dependencies build before the check consumes dist.

For a UI Foundation Story or contract change, run:

```bash
pnpm turbo run type-check --filter=@115master/ui
pnpm turbo run lint --filter=@115master/ui
pnpm turbo run test --filter=@115master/ui
pnpm turbo run build-storybook --filter=@115master/ui
```

For a Monkey integration Story, run:

```bash
pnpm turbo run type-check --filter=@115master/monkey
pnpm turbo run lint --filter=@115master/monkey
pnpm turbo run test --filter=@115master/monkey
pnpm turbo run build-storybook --filter=@115master/monkey
```

When closing a migration that spans both hosts, run the workspace gates too:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm build-storybook
```

Use [Design Tokens](../design-tokens/SKILL.md) for visual-value ownership and [Glass UI](../ui-ux/glass-ui/SKILL.md) for a material scenario. Use the icon and Vue TSX skills whenever those implementation concerns apply.

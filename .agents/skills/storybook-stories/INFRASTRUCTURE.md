# Storybook infrastructure

Read this before changing a Storybook `main`, `preview`, Vite configuration, Theme decorator, Teleport host, or docgen setting. Choose the host first; UI Foundation and Monkey intentionally have different responsibilities.

## UI Foundation Storybook

`packages/ui/.storybook/` owns public UI Storybook runtime configuration. Its preview establishes the Theme toolbar and a Theme-scoped Story root. Its Vitest configuration runs the public Story suite in real Chromium for both light and dark Theme projects, supplements them with light-mode reduced-motion and mobile projects, and treats a11y violations as errors.

When changing UI preview or Theme behavior:

1. Keep public Stories independent of Monkey's mount node, router, store, GM APIs, and application styles.
2. Preserve the two Theme projects and test the same contract in each.
3. Verify public overlays use the UI contract's Theme-scoped host rather than an application DOM assumption.
4. Run UI type-check, Chromium Story tests, and the static Storybook build.

## Monkey integration Storybook

`apps/monkey/.storybook/` owns application integration fixtures. Its preview may provide the application mount node and synchronize the application Theme scope for components that integrate with Monkey. Reuse that setup rather than creating competing document-level hosts.

When changing Monkey preview or an integration decorator, inspect a normal component and the affected integration path in both Theme toolbar modes. Keep the router, store, GM mock, and DOM host scoped to the Story that needs them, and clean up document-level effects.

## Docs and TSX controls

Public component Stories expose the real component to `Meta` so Docs and controls can describe the public props. Component-family documentation names the public members and their composition boundary. A pure Foundation material Story may omit a component wrapper when it is the material contract under test.

If Monkey TSX docgen or Story typing fails, use [TYPING.md](TYPING.md) before changing component code or TypeScript configuration. Do not transfer a Monkey-specific docgen or React-stub workaround to the UI Foundation without proving it is needed there.

## Validation boundary

UI Foundation changes require real Chromium, play, a11y-error, and light/dark project coverage through the UI package scripts. Monkey integration changes require the application's own type-check, lint, and static Storybook build, plus the relevant Canvas inspection. Neither host requires a first-wave pixel-snapshot or cloud visual-regression baseline.

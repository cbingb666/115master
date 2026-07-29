# Storybook infrastructure

Read this before changing a Storybook `main`, `preview`, Vite configuration, Theme decorator, Teleport host, or docgen setting. Choose the host first; UI Foundation and Monkey intentionally have different responsibilities.

## UI Foundation Storybook

`packages/ui/.storybook/` owns public UI Storybook runtime configuration. Its preview factory establishes the Theme toolbar and a Theme-scoped Story root. The main configuration registers Docs, a11y, and Vitest with the Manager; the preview factory registers the matching addon annotations for preview types, runtime behavior, and tests. Neither registration replaces the other.

Normal CLI, package-test, and CI runs execute the public Story suite in real Chromium in light, dark, light reduced-motion, and light mobile projects, and treat a11y violations as errors. Manager Run tests exposes only light because addon-vitest 10.5.5 rewrites projects that share a Storybook config directory to the same name. This is a narrow compatibility workaround, not the complete UI quality gate.

When changing UI preview or Theme behavior:

1. Keep public Stories independent of Monkey's mount node, router, store, GM APIs, and application styles.
2. Preserve all four CLI／CI projects and verify Manager's light project independently.
3. Verify public overlays use the UI contract's Theme-scoped host rather than an application DOM assumption.
4. Preserve Autodocs, Controls, the Theme toolbar, and the a11y error policy.
5. Run UI type-check, Chromium Story tests, inertness regression, and the static Storybook build and index check.

## Monkey integration Storybook

`apps/monkey/.storybook/` owns application integration fixtures. Its preview factory and main configuration both register Docs and Vitest in their respective runtime boundaries. The preview may provide the application mount node and synchronize the application Theme scope for components that integrate with Monkey. Reuse that setup rather than creating competing document-level hosts.

When changing Monkey preview or an integration decorator, inspect a normal component and the affected integration path in both Theme toolbar modes. Keep the router, store, GM mock, and DOM host scoped to the Story that needs them, and clean up document-level effects.

Monkey package tests run the existing Node project and one real-Chromium Storybook project using the application's default dark Theme. This project proves application composition and does not copy UI Foundation's light, dark, reduced-motion, or mobile matrix. Preserve the Theme toolbar, application styles, Overlay and Dialog hosts, Teleport target, and local icon fixture.

## Docs and TSX controls

Public component Stories expose the real component to `Meta` so Docs and controls can describe the public props. Component-family documentation names the public members and their composition boundary. A pure Foundation material Story may omit a component wrapper when it is the material contract under test.

If Monkey TSX docgen or Story typing fails, use [TYPING.md](TYPING.md) before changing component code or TypeScript configuration. Do not transfer a Monkey-specific docgen or React-stub workaround to the UI Foundation without proving it is needed there.

## Validation boundary

UI Foundation changes require real Chromium, explicit `.test()` contracts, a11y-error, and four-project CLI／CI coverage through the UI package scripts, plus an independent Manager light run. Monkey integration changes require the application's own type-check, lint, Node and default-Theme Chromium projects, inertness regression, and static Storybook build. Both static indexes must contain each migrated parent and differently identified `.test()` child from the same module. Neither host requires a first-wave pixel-snapshot or cloud visual-regression baseline.

## Storybook upgrade review

The current implementation is pinned to Storybook 10.5.5. It does not expose `experimentalTestSyntax`; do not add that feature flag, internal embed mode, or private autoplay-suppression switches.

For every Storybook, addon-vitest, or Vue framework upgrade, revalidate:

1. whether the new version exposes or requires an explicit-test feature flag;
2. Manager project names and whether the light-only workaround can be removed;
3. parent and `.test()` child entries in both static indexes;
4. one minimal parent Canvas remaining inert and its `.test()` running from Manager and CLI;
5. preview factory annotations, Docs, Controls, a11y policy, Theme-scoped hosts, and Monkey application fixtures.

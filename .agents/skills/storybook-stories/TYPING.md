# Monkey Story program React JSX contamination

Read this only for `apps/monkey` Story type-check failures involving JSX, `className`, `ReactNode`, or CSS modules. It is not a UI Foundation workaround: do not copy Monkey's React stub or its TypeScript paths into `packages/ui`.

## Locate the control point from the error

| Error signature | Control point |
| --- | --- |
| `className`, `ReactNode`, or a component cannot be used as JSX | `apps/monkey/tsconfig.stories.json` maps `react` to `.storybook/react-stub.d.ts` |
| Missing JSX intrinsic elements or a CSS module declaration | The Monkey stories TypeScript program includes the relevant source declaration files |
| A Storybook type requires an unprovided React export | Add only the matching type placeholder to the Monkey React stub |

Restore the corresponding Monkey control point, then run:

```bash
pnpm -F @115master/monkey type-check
```

Keep the component's Vue props, attrs, and JSX contract intact. The Storybook type dependency must adapt to the Vue program; the application component must not be rewritten to accommodate React types.

## Why this happens

Storybook's Vue type declarations can traverse a `react` declaration chain. If the real React type package contributes global JSX declarations to the same TypeScript program as Vue TSX components, the components can be checked with React's JSX expectations.

The Monkey `react` path mapping redirects that type dependency to a narrow local stub. The Story still receives component type checking through its Vue `Meta` contract, while Vite runtime resolution remains unchanged. Explicit source declarations keep Vue JSX and CSS module typing available to the Story program.

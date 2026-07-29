# Story scenario checks

Apply this checklist after routing the Story with [SKILL.md](SKILL.md). A UI Foundation base Story runs in real Chromium under both Theme projects; a Monkey Story checks only the application-specific composition it owns.

## Interaction and accessibility

- Every public action has an observable result: component state, visible text, ARIA state, emitted value, or service outcome.
- Semantic controls cover relevant pointer and keyboard paths, including visible focus, disabled, loading, selected, and expanded states where supported.
- Icon-only actions have an accessible name; choice controls expose the appropriate role and state.
- Dialog, menu, popover, Tooltip, and other transient UI cover their supported open, primary action, close, and focus-return paths.

For public UI contracts, attach the path to the parent Story with `.test()` and let the UI Storybook a11y check report violations as errors. The parent Canvas must keep the same observable initial state until a person interacts with it. Do not replace these checks with a visual snapshot.

## Async and stateful scenarios

- Reach loading, success, empty, and error branches directly through fixtures; use a controlled timer only when passage of time is itself public behavior.
- Use local data or controlled fakes for all network-like outcomes. Fix random and time-dependent inputs.
- Give each Story instance its own reactive state and service instance. Clean up timers, listeners, stores, singletons, and document changes.

The same Story must start identically after opening, refreshing, or returning from another Story.

## Responsive and container boundaries

- Encode the relevant container width, overflow, sticky, or scroll context in `render` when the component responds to it.
- Check the meaningful sides of each viewport breakpoint when viewport behavior is public.
- Cover short, long, and empty content when content size affects layout.

The task and primary action must remain reachable, readable, and keyboard-operable at every declared boundary.

## Floating UI, Theme, and Teleport

- Cover applicable default placement, clipping container, viewport edge, scroll, and sticky contexts.
- Verify detached content remains inside the current Theme scope through the public Overlay Host or the selected application's integration host.
- On close, restore document-level nodes, scroll locks, listeners, focus, and layering to the initial state.

For a UI Foundation Story, run every applicable case under both light and dark Theme projects. For a Monkey integration Story, test the affected application Theme behavior without duplicating the Foundation matrix.

# Storybook for the primitives, and the visual-DNA pass

**Date:** 2026-09-01 · **Status:** approved by Josef ("lets do it", keep it lightweight)

## Goal

Give the prototype a place to look at each primitive in isolation, in every variant and state, so the
visual DNA can be moved toward "Stripe + Linear" one component at a time with Josef validating each
step. The app is a prototype; the visual style is the point. Nothing here adds process for its own sake.

## Direction (decided)

A deliberate blend, not either kit sheet wholesale:

- **Keep Ledger's surface.** White canvas, Inter + JetBrains Mono, one blue at hue 258. Filled buttons are a flat fill with a soft 1px drop — no ring, no inner
  highlight, no press-down (Josef, 2026-09-01, first Storybook pass). Every current light token keeps its value until a primitive
  step deliberately changes it.
- **Adopt Linear's metrics and discipline** as each primitive is visited: measured control heights
  (24 / 28 / 32, inputs 30), weight-400 labels on secondary controls, inset hairlines instead of borders
  where it costs nothing, flat secondary/ghost buttons, 4px menu padding, table rows 44 cozy / 36 compact,
  and a strict blue budget (primary action, selection, focus ring, link).
- **Defer Nightwatch dark mode** until the light primitives are signed off. Token names do not change, so
  the handoff sheet stays drop-in.

Rejected: switching to Geist (Linear's own file is Inter).

## Storybook setup

- Storybook 10.5, `@storybook/react-vite`, addons: docs, a11y. Installed with bun (`npx -y bun@latest add -D`,
  bun is not on PATH). Scripts: `storybook`, `build-storybook`. `storybook-static/` gitignored.
- `.storybook/vite.config.ts` — a dedicated config (React, Tailwind 4, tsconfig paths). The app's Vite
  config is the Lovable TanStack Start bundle (Nitro, SSR) and must not be inherited.
- `.storybook/preview.tsx` imports `src/styles.css`; `.storybook/preview-head.html` carries the same
  Google Fonts link as `__root.tsx`. A global decorator wraps stories in a memory router (same pattern as
  `.design-sync/preview-support/router-shim.tsx`) so Tabs, TabStrip, RecordHeader and Shell render.
- **Theme toolbar** (optional, preview-only): Ledger (default) · Nightwatch · Linear-refined. The two
  overlays are copied from the kit into `.storybook/themes/` and applied by the decorator; they never
  enter `src/styles.css`.
- Stories live in `src/stories/<Group>/<Name>.stories.tsx`, grouped by the RFC-001 filing system:
  Foundations, Actions, Status, Data Input, Layout, Data, Navigation, Feedback, Shapes.
- Each component story is a **variant matrix**: every variant × size, with hover / focus / disabled /
  loading as static rows (forced via `parameters.pseudo` is out — keep it lightweight; use explicit
  className states where the component exposes them, otherwise just the natural states), plus one
  Controls playground story.
- `src/components/ui/` (unused shadcn scaffolding, zero imports) is excluded.

## Sequence (one commit each, Josef validates in Storybook before the next)

1. Foundations — token display only: colors, type scale, control/row heights, radii, elevation.
2. Button, IconButton
3. Badge, Dot, Meter, StackedBar
4. Input, Select, Textarea, Field
5. Card, CardHeader, Section, KeyValue
6. Table, Th, Td, Tr, IdCell
7. Tabs, TabStrip, FilterChip, SegmentedControl
8. Menu, Modal, Drawer, EmptyState, Kbd, Avatar
9. Shapes — WorkPane, ActionBar, Inspector, Disclosure, Block
10. Shell

This spec covers the scaffold and step 1. Steps 2–10 each get a story first (current look), then a
proposed change, then Josef's sign-off.

## Out of scope

Vitest / interaction tests, visual regression, Chromatic, dark mode, deleting the shadcn folder,
touching the design-sync pipeline, any change to app routes.

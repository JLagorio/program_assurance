# @ledger/design-system

Ledger, the product design system: tokens, primitives, components, patterns, shapes, the shell and the colour mode, shipped as one package for React 19 and Tailwind 4. The layer rules and what goes where are in `docs/guides/component-library.md`. The version policy is in `CHANGELOG.md`. The token architecture is `docs/superpowers/specs/2026-09-02-token-architecture.md`.

## Map

| Path | What is there |
| --- | --- |
| `tokens/` | The source of truth: DTCG JSON, one file per group (`palette`, `color`, `elevation`, `font`, `space`, `shape`, `dimension`, `motion`, `opacity`). A token's `$value` is its light value, `$extensions.ledger.dark` is its dark value, `.introduced` and `.deprecated` are metadata. Every token has a `$description`. |
| `build/tokens.mjs` | The Style Dictionary build. Reads `tokens/` and writes `src/generated/`. |
| `build/dist.mjs` | The publishable build: `tsc` to `dist/`, then the stylesheets and token data copied beside it. |
| `src/generated/` | Committed build output, so a token change reviews as a diff: `tokens.css` (the variables, both modes), `theme.css` (the Tailwind namespace mapping), `reset.css` (Tailwind's default namespaces removed), `utilities.css` (one utility per token on its own property), `tokens.ts` (the name union, `token()`, `tokenValue()`, the utility allowlist), `merge-config.ts` (tailwind-merge groups), `classes.ts` and `space.ts` (token to class, for primitive props), `docs.json` (for the Storybook sheets), `tokens.figma.json` (the merged source, for Figma). |
| `src/styles/` | The stylesheets a consumer imports: `reset.css`, `ledger.css` (the theme, the variables, the utilities, `motion.css`, `layout.css`, and the `@source` that lets Tailwind scan the package), `base.css` (document defaults: colour scheme, border colour, the body's type). `storybook.css` is the package's own entry. |
| `src/primitives/` | Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading. Token-typed props, no margins. |
| `src/components/` | The parts: Button, Badge, the controls, Table, Tabs, the overlays, Chart and the rest. |
| `src/patterns/` | Page-level compositions: IndexPage, ShowPage, PageHeader, Card, Section, Panel, the pickers and the previews. |
| `src/shapes/` | The layer between the parts and a screen: WorkPane, Inspector, ActionBar, Block. |
| `src/shell/` | The navigation system: Shell with Banner, TopNav, SideNav, Main and Panel, and what it remembers. |
| `src/mode/` | The colour mode: ModeProvider, ModeSwitch, the script that applies the stored choice before first paint. |
| `src/lib/` | `cn`, the class merger, and the panel context. |
| `src/stories/` | The Storybook: the token sheets and their pages (`tokens/`), the primitives, the components, the patterns, and the guidance under `docs/` (Introduction, Getting started, Token grammar, Lint rules). Every component page attaches to its stories file. Not in the tarball. |
| `eslint-plugin/` | The `ledger/*` rules and the flat configs, exported as `@ledger/design-system/eslint`. |
| `test/` | `contrast.test.mjs`: every text-on-background pairing the mapping declares meets WCAG AA in both modes. |

`dist/` and `storybook-static/` are build output and are ignored.

## Exports

| Specifier | Resolves to |
| --- | --- |
| `@ledger/design-system` | `src/index.ts` under the `development` condition, `dist/index.js` otherwise |
| `@ledger/design-system/cn` | The class merger on its own |
| `@ledger/design-system/reset.css` | `src/styles/reset.css`. Import before `ledger.css`. |
| `@ledger/design-system/ledger.css` | `src/styles/ledger.css` |
| `@ledger/design-system/base.css` | `src/styles/base.css` |
| `@ledger/design-system/tokens.css` | `src/generated/tokens.css`, the variables alone |
| `@ledger/design-system/tokens.json` | `src/generated/tokens.figma.json` |
| `@ledger/design-system/eslint` | `eslint-plugin/index.js` |

The install steps and the CSS order are in the Storybook under Guidance/Getting started.

## Scripts

Run inside the package, or from the repo root with `-w @ledger/design-system`.

| Script | Does |
| --- | --- |
| `npm run storybook` | Storybook on port 6007. The root app's Storybook is 6006. |
| `npm run build:tokens` | Rebuilds `src/generated/` from `tokens/`. |
| `npm run build` | Builds `dist/`. Runs on `prepack`. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint over the package, on its own preset. |
| `npm test` | The contrast test. `npm run test:report` prints every pairing. |

Never edit `src/generated/` by hand; run `npm run build:tokens -w @ledger/design-system`.

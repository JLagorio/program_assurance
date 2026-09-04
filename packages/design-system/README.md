# @ledger/design-system

The product design system. Spec: `docs/superpowers/specs/2026-09-02-token-architecture.md`; the map of the layers and families: `docs/guides/component-library.md`; the docs pages: `npm run storybook -w @ledger/design-system`.

- `tokens/` — the source of truth, DTCG JSON. One file per group. A token's `$value` is its light value; `$extensions.ledger.dark` is its dark value; `$extensions.ledger.introduced` and `.deprecated` are metadata.
- `build/tokens.mjs` — Style Dictionary build. Emits everything under `src/generated/`, which is committed so a token change reviews as a diff.
- `src/styles/` — the CSS entries: `reset.css` (Tailwind's default namespaces removed), `ledger.css` (variables in both modes, the theme mapping, the per-token utilities, motion, density and layout) and `base.css` (document defaults). Import them in that order.
- `src/primitives/`, `src/components/`, `src/patterns/`, `src/shapes/`, `src/shell/`, `src/mode/` — the layers, each with an `index.ts`; `src/index.ts` re-exports all of them.
- `src/stories/` — the token sheets, one story file and one `.mdx` per family, and the guidance pages.
- `eslint-plugin/` — the token rules; `@ledger/design-system/eslint` exports the `package` and `recommended` presets.
- `build/kit.mjs` — the publishable build: `npm run build -w @ledger/design-system` emits ESM JavaScript and `.d.ts` declarations for `src/` (stories excluded) plus the stylesheets into `dist/`, via `tsconfig.build.json`. `dist/` is gitignored. The workspace app resolves the package from `src/` (the `default` condition in `exports`); `types` points at `dist/` and falls back to the source while `dist/` is absent, so nothing needs the build to type-check.

Never edit `src/generated/` by hand; run `npm run build:tokens -w @ledger/design-system`.

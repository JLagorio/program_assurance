# @ledger/design-system

The product design system. Spec: `docs/superpowers/specs/2026-09-02-token-architecture.md`.

- `tokens/` — the source of truth, DTCG JSON. One file per group. A token's `$value` is its light value; `$extensions.ledger.dark` is its dark value; `$extensions.ledger.introduced` and `.deprecated` are metadata.
- `build/tokens.mjs` — Style Dictionary build. Emits everything under `src/generated/`, which is committed so a token change reviews as a diff.
- `src/styles.css` — Tailwind entry: resets Tailwind's default namespaces, then the generated theme, variables and per-token utilities.
- `src/stories/` — token sheets and, later, primitive and component stories. `npm run storybook -w @ledger/design-system`.

Never edit `src/generated/` by hand; run `npm run build:tokens -w @ledger/design-system`.

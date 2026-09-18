---
name: ledger-add-part
description: Add or change a part of the Ledger design system (packages/design-system) following the kit contribution checklist, with the checks in CI order. Use when asked to add a component, pattern, primitive, layout part, prop or token to the kit, or to rename or deprecate one.
---

# Add or change a Ledger part

Read `packages/design-system/AGENTS.md` first. It points at the rules; this skill is the order of work. Do not restate rules from the guides in your notes; link to them.

## Before writing code

1. With the Storybook running (`npm run storybook`, port 6007) call `get-storybook-story-instructions`, then `docs-list` and `docs-show` for the family you are touching. A prop the docs do not show does not exist.
2. Decide the layer from the Layers table in `docs/guides/component-library.md`. Components and primitives never import patterns or layout. A composition of several parts that owns a workflow is a pattern; a part that only describes something is a component.
3. For a new API, answer the "Before adding an API" table on the Storybook's Guidance/Testing and review page: who owns the state, what reaches the DOM, what can fail, what composes.
4. A rename keeps the old name as an `@deprecated` alias for one version and adds a `ledger/no-deprecated-name` fixer entry.

## The four steps

Follow "Adding to the kit" in `docs/guides/component-library.md`, in order:

1. Implement the part and update every consumer, including the app under `src/`. Tokens only, relative imports inside the package, package `cn`, optional props spelled `?: T | undefined`, parts exported by name.
2. Exercise every named part in `<Family>.stories.tsx` with representative states and `play` assertions. One playground for the controls; keep distinct regression cases. Render once; the toolbar switches the mode.
3. Keep one accurate `<Family>.mdx` page with an example, `<ArgTypes of={Part} />` and the guidance that helps. No required heading set, no filler.
4. Add a `CHANGELOG.md` entry that names the story showing the change.

## Checks, in CI order

```sh
npm run build:tokens -w packages/design-system && git diff --exit-code -- packages/design-system/src/generated
npm run ds:check
npm run typecheck -w packages/design-system && npm run lint -w packages/design-system && npm test -w packages/design-system
npm run ds:api:check            # ds:api:update only when declarations changed on purpose
npm run test:a11y -w packages/design-system
npm run build -w packages/design-system   # refreshes eslint-plugin/components.json and llms.txt
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test:app
npm run test:consumer -w packages/design-system
```

Then `stories-preview` for the changed stories and `test-run` for the family, and report the preview URLs. Do not report completion with a failing check.

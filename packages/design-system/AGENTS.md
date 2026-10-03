# Ledger for agents

`@ledger/design-system` (Ledger) is the product design system: tokens, primitives, components, layout, patterns and colour mode, shipped as one package for React 19 and Tailwind 4. This file is the entry point when you work inside this folder. It points at where each rule lives and names the few rules nothing else states. The rules themselves live in one place each; do not copy them here or anywhere else.

## Read first

- [`docs/guides/component-library.md`](../../docs/guides/component-library.md): layers, importing, component contracts, naming, what the lint enforces, the rules that stay in the head, adding to the kit, versioning.
- [`README.md`](README.md): the folder map, the exports and the scripts.
- The Storybook (`npm run storybook`, port 6007) is the contract. Every exported part has a page under Components, Patterns, Layout or Primitives with generated props. Under Guidance: **Agents** (the MCP workflow), **Choosing a part** (the need-to-part table; read it before picking), **Coming from shadcn** (`render` not `asChild`, tokens not the shadcn theme, name by name), **Recipes** (how parts compose into a register, a record, a preview, a form), **Which token** (the short token answer by job), **Writing stories** (this package's story conventions) and **Upgrading** (what a family page's status, Stable, Experimental or Deprecated, promises; each version's breaking changes and deprecations; and what an earlier API's spelling is written as now, where a family page documents the current API). When Storybook is not running, [`llms.txt`](llms.txt) is the same content as one generated file.
- [`CHANGELOG.md`](CHANGELOG.md): the version policy. Every change gets an entry that names the story showing it.
- The application's own composition rules are in [`docs/guides/product-patterns.md`](../../docs/guides/product-patterns.md). They decide which part the app uses for each screen shape; they are not the package's concern and never enter its stories.

## Layers and direction

`tokens/` → `src/generated/` → `src/primitives/` → `src/components/` → `src/layout/` → `src/patterns/` → `src/mode/`. Components and primitives never import patterns or layout. The package never imports application source, a router or a data layer; links come in through `render`. Product code imports the package root, `@ledger/design-system`, and never a file inside it.

## Before using a prop

Look it up. A prop exists when the family's `.mdx` page or its `ArgTypes` shows it, or the `.d.ts` declares it. Do not infer props from shadcn, Radix, Base UI or another design system; the families share names, not APIs. With the Storybook running, use the MCP `docs-show` tool; otherwise read the family's source and `llms.txt`.

## Rules nothing else states

- `src/generated/` is build output. Never edit it; run `npm run build:tokens` and commit the diff.
- Optional props are spelled `?: T | undefined` (`exactOptionalPropertyTypes` is on).
- Export parts by name, not only as members of a namespace object, or docgen loses them.
- Base UI: spread `data-slot` inside `mergeProps`, pass refs through `useRender`, and wait for a menu to mount before asserting `aria-expanded` in a play function.
- `scripts/ds-check.allow` at the repo root may only shrink.
- A rename ships with an `@deprecated` alias for one version and a `ledger/no-deprecated-name` fixer.
- After changing exports, a part's props or the classes a part sets, `npm run build:lint` refreshes `eslint-plugin/components.json`, which holds each part's styling props for `ledger/readable-classes`, and `eslint-plugin/parts.json`, which holds what each part sets itself for `ledger/no-restyle`; after changing a story or page, `npm run build:llms` refreshes `llms.txt`. Package tests fail on drift in any of them.
- A `ledger/<rule>` finding names what to write instead; apply it or its editor suggestion. The rule's page is its `meta.docs.url`, `eslint-plugin/docs/<rule>.md` (in the Storybook, Guidance/Lint rules reference). Fix the code rather than silencing the rule: an allowance or an `eslint-disable` only ever shrinks.
- To ask the lint about one class, tag or value without running ESLint (which rule reports a class and what to write instead, which kit part a tag is, which token is 16px), call the named exports of `@ledger/design-system/eslint`: `classify`, `suggestClass`, `kitPartOf`, `tokensOfValue` and the rest, on the Guidance/Lint rules page under Asking the lint without ESLint.

## Adding or changing a part

Follow the four steps under "Adding to the kit" in the component library guide, in order: implement and update consumers, exercise every part in `<Family>.stories.tsx` with `play` assertions, keep one accurate `<Family>.mdx` with `<ArgTypes>`, then the changelog and the checks. From the repo root the `/ledger-add-part` skill walks the same steps.

## Checks, in CI order

```sh
npm run build:tokens -w packages/design-system && git diff --exit-code -- packages/design-system/src/generated && ! git ls-files --others --exclude-standard -- packages/design-system/src/generated | grep .
npm run ds:check                                  # repo root: every exported part has a story and a page
npm run typecheck -w packages/design-system
npm run lint -w packages/design-system
npm test -w packages/design-system                # contrast, DTCG, locale, lint inventory, llms.txt, view state
npm run ds:api:check                              # public API baseline; ds:api:update when declarations change
npm run test:a11y -w packages/design-system       # every story, play and axe, light and dark
npm run test:layout -w packages/design-system     # every story at a 390px phone and in a 320px frame
npm run build -w packages/design-system           # dist/, then the app typecheck sees new exports
npm run test:consumer -w packages/design-system
```

Inside the package, `npx vitest run --project storybook-light -t "Button"` runs one family in one mode, and `npx vitest run --project storybook-narrow --project storybook-contained src/stories/<dir>/<Family>.stories.tsx` runs one file through both layout checks. What the layout checks measure and when a story may be exempt is on the Storybook's Guidance/Testing and review page.

## Verifying visually

With the Storybook running and the `storybook-mcp` server connected (`.mcp.json` at the repo root), call `get-storybook-story-instructions` before writing a story, `stories-preview` after any change that alters how something looks, and `test-run` instead of a package.json script to run the affected stories. Report the preview URLs. Josef flips the colour mode in the Storybook toolbar; do not render both modes in one story.

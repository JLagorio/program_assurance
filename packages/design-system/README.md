# @ledger/design-system

Ledger, the product design system: tokens, primitives, components, layout, patterns and colour mode, shipped as one package for React 19 and Tailwind 4. The layer rules and what goes where are in `docs/guides/component-library.md`. The version policy is in `CHANGELOG.md`. The token grammar is the Storybook's Guidance/Token grammar page.

Avatar, InputGroup and Combobox use flat shadcn Base UI composition. Input and Textarea render
Base UI's Field.Control, so a Field binds them. A fixed list is Select and a list the reader types into is Combobox; there is no native select part. See the
[component contracts](../../docs/guides/component-library.md#component-contracts) for migration direction.

## Map

| Path               | What is there                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens/`          | The source of truth: ledger-css-v1 JSON, one file per group (`palette`, `color`, `elevation`, `font`, `space`, `shape`, `dimension`, `motion`, `opacity`). A token's `$value` is its light value, `$extensions.ledger.dark` is its dark value, `.introduced` and `.deprecated` are metadata. Every token has a `$description`.                                                                                                                                                                                                                                                                                                                                                                                   |
| `build/tokens.mjs` | The Style Dictionary build. Reads `tokens/` and writes `src/generated/`. `build/lint-data.mjs` then asks Tailwind once what the lint needs and writes it there too: `lint.json` and `lint-values.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `build/dist.mjs`   | The publishable build: TypeScript emit with Node-compatible specifiers to `dist/`, then the stylesheets and token data copied beside it. `build/llms.mjs` writes `llms.txt`, `build/lint-inventory.mjs` the lint's export inventory, `build/dtcg.mjs` the DTCG documents, and `build/consumer-smoke.mjs` installs the packed tarball in a throwaway consumer.                                                                                                                                                                                                                                                                                                                                                    |
| `src/generated/`   | Committed build output, so a token change reviews as a diff: `tokens.css` (the variables, both modes), `theme.css` (the Tailwind namespace mapping), `reset.css` (Tailwind's default namespaces removed), `utilities.css` (one utility per token on its own property), `tokens.ts` (the name union, `token()`, `tokenValue()`, the utility allowlist), `merge-config.ts` (tailwind-merge groups), `classes.ts` and `space.ts` (token to class, for primitive props), `docs.json` (for the Storybook sheets), `tokens.figma.json` (legacy merged source) and mode-specific `tokens.dtcg.*.json` interchange documents.                                                                                            |
| `src/styles/`      | The stylesheets a consumer imports: `reset.css`, `ledger.css` (the theme, the variables, the utilities, the `@source` that lets Tailwind scan the package, and the part stylesheets it imports: motion, tabs, scroller, chart, density, layout, touch, stat, shell, drawer, toast, banner and forced colours), `base.css` (document defaults: colour scheme, border colour, the body's type) and `fonts.css` (the self-hosted Geist faces). `storybook.css` is the package's own entry.                                                                                                                                                                                                                          |
| `src/primitives/`  | Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading and VisuallyHidden, and HeadingLevelProvider for the outline's levels. Token-typed props, no margins.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/components/`  | The parts: Button, Badge, the controls, Table, Tabs, the overlays and the rest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/patterns/`    | Repeated interactions: pickers, DataTable, Composer, Editable, Inspector, charts and workspaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/layout/`      | Persistent Shell regions, composable PageHeader, optional Section, PageSkeleton and StickyRail.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/mode/`        | The colour mode (ModeProvider, ModeSwitch, the script that applies the stored choice before first paint) and the LedgerProvider exports.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/lib/`         | `cn`, the class merger; LedgerProvider, `useLedgerLocale` and the locale formatters and messages (`locale.tsx`, `locale-format.ts`); `announce`; the download helpers; the status tones; `useFillWindow`; the Base UI helpers the parts share.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/stories/`     | The Storybook: the token sheets and their pages (`tokens/`), the primitives, the components, the patterns, and the guidance under `docs/` (Introduction, Getting started, Agents, Choosing a part, Coming from shadcn, Recipes, Which token, Writing stories, Token grammar, Lint rules, Testing and review, Upgrading). Every component page attaches to its stories file. Not in the tarball; `llms.txt` at the package root is the same content as one generated file (`npm run build:llms`).                                                                                                                                                                                                                 |
| `eslint-plugin/`   | The `ledger/*` rules and the flat configs, exported as `@ledger/design-system/eslint`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `test/`            | The `node --test` suites (`npm test`): contrast in both modes and at increased contrast, DTCG interchange, locale, the lint rules, their table on the Lint rules page and the export inventory, `llms.txt` drift, the tailwind-merge groups, responsive columns, persisted view and shell state, the exact pins of Base UI and recharts with the recharts classes the kit names. `*.types.tsx` are type fixtures the typecheck compiles; `storybook.setup.ts` fails a story on a console error or a Base UI or React warning, and `story-gates.ts` holds the gate checks; `layout-allow.json`, `gates-allow.json` and `lint-allow.json` list what predates a check, with reasons or counts, and may only shrink. |

`dist/` and `storybook-static/` are build output and are ignored.

## Exports

| Specifier                                                                                 | Resolves to                                                                |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `@ledger/design-system`                                                                   | `dist/index.js`; `src/index.ts` under the named `@ledger/source` condition |
| `@ledger/design-system/cn`                                                                | The class merger on its own, resolved the same way                         |
| `@ledger/design-system/reset.css`                                                         | `src/styles/reset.css`. Import before `ledger.css`.                        |
| `@ledger/design-system/ledger.css`                                                        | `src/styles/ledger.css`                                                    |
| `@ledger/design-system/base.css`                                                          | `src/styles/base.css`                                                      |
| `@ledger/design-system/fonts.css`                                                         | `src/styles/fonts.css`, the self-hosted Geist faces. Optional.             |
| `@ledger/design-system/tokens.css`                                                        | `src/generated/tokens.css`, the variables alone                            |
| `@ledger/design-system/tokens.json`                                                       | `src/generated/tokens.figma.json`, the legacy merged source                |
| `@ledger/design-system/tokens.dtcg.light.json`, `tokens.dtcg.dark.json`                   | The DTCG 2025.10 documents, one per mode                                   |
| `@ledger/design-system/tokens.dtcg.light-contrast.json`, `tokens.dtcg.dark-contrast.json` | The same at increased contrast                                             |
| `@ledger/design-system/eslint`                                                            | `eslint-plugin/index.js`, with the read-only API as named exports          |

The install steps and the CSS order are in the Storybook under Guidance/Getting started.

## Scripts

Run inside the package, or from the repo root with `-w @ledger/design-system`.

| Script                  | Does                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run storybook`     | Storybook on port 6007, the only Storybook in the repository.                                                                          |
| `npm run build:tokens`  | Rebuilds `src/generated/` from `tokens/`, then the lint data from Tailwind (`build/lint-data.mjs`).                                    |
| `npm run build:llms`    | Rebuilds `llms.txt` from the Storybook pages and their props tables, the token sheet and the public API baseline. Runs inside `build`. |
| `npm run build`         | Builds `dist/`. Runs on `prepack`.                                                                                                     |
| `npm run typecheck`     | `tsc --noEmit`.                                                                                                                        |
| `npm run lint`          | ESLint over the package, on its own preset.                                                                                            |
| `npm test`              | The `test/` suites above. `npm run test:report` prints every contrast pairing.                                                         |
| `npm run test:a11y`     | Every story rendered with its play function and axe, light, dark and in forced colours.                                                |
| `npm run test:layout`   | Every story at a 390px phone and in a 320px frame: no sideways scroll, no word broken mid-word.                                        |
| `npm run test:gates`    | Every story on a touch phone, the overlays in a short window, and the text-bearing families with long content.                         |
| `npm run test:consumer` | Packs the package, installs the tarball in a throwaway consumer, and checks resolution, SSR, types and CSS.                            |
| `npm run build:lint`    | Refreshes `eslint-plugin/components.json` (exports, styling props) and `eslint-plugin/parts.json` (what each part sets).               |

Never edit `src/generated/` by hand; run `npm run build:tokens -w @ledger/design-system`.

The package build also regenerates `eslint-plugin/components.json` from the public barrel, and `eslint-plugin/parts.json`, what each part sets itself, from the kit's source. After changing exports, a part's props or the classes a part sets, run `npm run build:lint -w @ledger/design-system` to refresh both without a full build. Package tests check both for drift. The installed ESLint plugin reads the generated data without loading TypeScript or scanning component source.

## Install in a separate application

This package is private. Install an approved internal artifact or a tarball produced by `npm pack`; a public registry publication is not assumed.

```sh
npm install ./ledger-design-system-<version>.tgz react@^19 react-dom@^19 tailwindcss@^4
npm install -D vite @vitejs/plugin-react @tailwindcss/vite typescript @types/react @types/react-dom
```

Configure Vite with the React and Tailwind plugins. Import this stylesheet from your application entry, in exactly this order:

```css
@import "tailwindcss";
@import "@ledger/design-system/reset.css";
@import "@ledger/design-system/ledger.css";
@import "@ledger/design-system/base.css";
@import "@ledger/design-system/fonts.css";
```

`base.css` supplies optional document defaults, and `fonts.css` the Geist faces the type tokens name. The package's `@source` directive includes its components in Tailwind's scan. Components do not inject CSS during server rendering.

```tsx
import type { ReactNode } from "react";
import { LedgerProvider, ModeProvider, Toaster } from "@ledger/design-system";

export function Providers({ timeZone, children }: { timeZone: string; children: ReactNode }) {
  return (
    <ModeProvider>
      <LedgerProvider locale="en-US" timeZone={timeZone}>
        {children}
        <Toaster />
      </LedgerProvider>
    </ModeProvider>
  );
}
```

`timeZone` is the reader's, such as `"America/New_York"`; without one, dates format in UTC. Use the same locale, time zone and initial color mode on server and client: Storybook's Components/Locale page shows how to hand the reader's zone over after hydration. Node loads emitted ESM with explicit relative extensions. Every bundler resolves dist, in development mode too; only the named `@ledger/source` condition hands out the TypeScript source, for a workspace that compiles it (this repository's app sets it in its Vite dev server and its `customConditions`). TypeScript supports NodeNext and Bundler resolution. No workspace alias is needed. Run `npm run test:consumer` after building to install a real tarball in a temporary directory, check that the `development` condition resolves dist, import it in Node, render React on the server, check declarations, and build Vite/Tailwind CSS.

## Token interchange

The authoring source and legacy `tokens.json` export use the versioned **ledger-css-v1** CSS-oriented dialect. They are not DTCG interchange documents. Use `@ledger/design-system/tokens.dtcg.light.json` or `@ledger/design-system/tokens.dtcg.dark.json` for the validated DTCG 2025.10 boundary, and `tokens.dtcg.light-contrast.json` or `tokens.dtcg.dark-contrast.json` for the increased-contrast values. Each mode is independent. CSS-specific tracking information is retained in a namespaced extension where DTCG has no equivalent. Regenerate with `build:tokens`; never hand-edit generated files.

## API ownership and compatibility

Use the checked-in shadcn Base UI components in `src/components/ui/` as the foundation, then adapt those same components to the product. Keep their useful names, native props/refs, composition and accessibility behavior; extend the API where needed. One component should own one job, including its product options. Multi-component assemblies belong in `src/patterns/`; a status badge remains `Badge`. Editable owns inline-save recovery, Gates presents readiness and corrective actions, Toolbar assembles search/filter/actions, and Chart assembles Recharts plots with table, export and expanded views. Their source and Storybook pages live under patterns; package-root imports are unchanged.

Port source into the package with relative imports and package `cn`; application source is never a package dependency. Ledger tokens supply styling. Document defaults, how options combine, and intentional differences from the reference, and test the resulting contract.

Semantic axes keep clear meanings: `tone` communicates status, `variant` chooses treatment and `size` chooses density. Native DOM names retain their meanings. Extend components deliberately instead of creating parallel standard and product versions of the same control.

DOM attributes and refs belong on the element that consumers must label, submit, focus, measure or integrate. Standard parts preserve their native targets and composition affordances; patterns document any narrower contract. Stepper refs target its ordered list and list items; Stat, Tile and Grid expose their divs, KeyValue its definition list, and Banner its message div. These display families accept native attributes/events and caller style overrides. Field composes native label/message parts; custom controls forward IDs, ARIA and refs. A `BreadcrumbLink render={<Link to="/records" />}` child must accept its merged props and ref. Button and IconButton share Base UI action behavior; navigation is a LinkButton, an anchor or a router Link through `render`. See the [Button page](src/stories/components/Button.mdx) for loading, render composition and migration examples.

Family pages in Storybook own the current API, defaults, composition examples and migration notes. The [handoff](../../docs/guides/design-system-migration-handoff.md) tracks completed work and remaining integration risks; the [changelog](CHANGELOG.md) records changes.

Base UI and layout helpers are implementation dependencies. Consumers use the package's public parts and their documented native and dependency-derived contracts. **Explicit public adapters** also include Base UI's toast manager API, TanStack table definitions, and chart configuration types exposed by the package. Upgrades that affect public contracts require checking consumer types and migration notes. React and Tailwind remain peers. `MODE_STORAGE_KEY` and `SHELL_STORAGE_KEY` are public storage integration constants; persisted data must be validated and fall back safely.

## Lifecycle and contribution

Document a component's intended use, relevant behavior and known limitations alongside representative stories and generated props. Page sections follow the component's needs, and the first line under the page's title is the part's status: Stable, Experimental or Deprecated, which the Storybook's Guidance/Upgrading page defines. New components start experimental; promotion to stable requires a product screen that uses the part, a public export, accurate documentation, play functions for stateful behavior, accessibility checks in both modes, and packed consumer validation. Deprecations name a replacement and migration, remain available for one version, and appear in the changelog and on Guidance/Upgrading under the version that deprecates them. Within 0.x, a minor release may break a documented contract; patches preserve it. No release is implied by local edits.

The [contribution workflow](../../docs/guides/component-library.md#adding-to-the-kit) covers checks and API baseline updates. The large prop matrix is generated only when an audit needs it; it is not committed or checked for freshness in CI.

Tokens and layout implement the design; keyboard operation, understandable copy, visible focus, validation, recovery and honest persistence implement the user contract. The application still owns business permissions and server durability. See Storybook Guidance/Testing and review for the review checklist and workflow specimens.

## Package and product boundary

Shared patterns describe reusable presentation and interaction. `Composer` owns drafting, keyboard suggestions and recoverable submission; its adapter supplies option identities, filtering and exact insertion text. `TaskRow` owns a completion row with caller-rendered owner, date and status content. `Timeline.Item` already supplies the reusable feed item, so no second shared wrapper is needed.

The application keeps event taxonomies, waiting and blocked states, overdue decisions, people lookups and mention serialization; none of them are package exports. Patterns/Composer, Patterns/TaskRow and Components/Timeline demonstrate the reusable behaviors; product workflows stay in the application and are verified in the running app.

## Application layout

Mount the product's AppLayout once around the root router outlet. Child routes compose PageHeader, primitives and components in Main, and contribute supporting properties with Shell.Aside or dismissible work with Shell.Panel. These client-mounted slots preserve route context and clean up when the route unmounts. Shell owns responsive placement, panel scrolling, resizing and focus return. See [page composition](src/stories/layout/Pages.mdx).

PageHeader is composable; Section is optional, accepts native props/refs and has an opt-in border. Use Sheet for modal work. Layout and patterns have separate Storybook categories.

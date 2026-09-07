# @ledger/design-system

Ledger, the product design system: tokens, primitives, components, patterns, shapes, the shell and the colour mode, shipped as one package for React 19 and Tailwind 4. The layer rules and what goes where are in `docs/guides/component-library.md`. The version policy is in `CHANGELOG.md`. The token architecture is `docs/superpowers/specs/2026-09-02-token-architecture.md`.

## Map

| Path | What is there |
| --- | --- |
| `tokens/` | The source of truth: ledger-css-v1 JSON, one file per group (`palette`, `color`, `elevation`, `font`, `space`, `shape`, `dimension`, `motion`, `opacity`). A token's `$value` is its light value, `$extensions.ledger.dark` is its dark value, `.introduced` and `.deprecated` are metadata. Every token has a `$description`. |
| `build/tokens.mjs` | The Style Dictionary build. Reads `tokens/` and writes `src/generated/`. |
| `build/dist.mjs` | The publishable build: TypeScript emit with Node-compatible specifiers to `dist/`, then the stylesheets and token data copied beside it. |
| `src/generated/` | Committed build output, so a token change reviews as a diff: `tokens.css` (the variables, both modes), `theme.css` (the Tailwind namespace mapping), `reset.css` (Tailwind's default namespaces removed), `utilities.css` (one utility per token on its own property), `tokens.ts` (the name union, `token()`, `tokenValue()`, the utility allowlist), `merge-config.ts` (tailwind-merge groups), `classes.ts` and `space.ts` (token to class, for primitive props), `docs.json` (for the Storybook sheets), `tokens.figma.json` (legacy merged source) and mode-specific `tokens.dtcg.*.json` interchange documents. |
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
| `npm test` | Contrast, token interchange, locale and persisted-view tests. `npm run test:report` prints every contrast pairing. |

Never edit `src/generated/` by hand; run `npm run build:tokens -w @ledger/design-system`.

## Install in a separate application

This package is private. Install an approved internal artifact or a tarball produced by `npm pack`; a public registry publication is not assumed.

```sh
npm install ./ledger-design-system-0.6.0.tgz react@^19 react-dom@^19 tailwindcss@^4
npm install -D vite @vitejs/plugin-react @tailwindcss/vite typescript @types/react @types/react-dom
```

Configure Vite with the React and Tailwind plugins. Import this stylesheet from your application entry, in exactly this order:

```css
@import "tailwindcss";
@import "@ledger/design-system/reset.css";
@import "@ledger/design-system/ledger.css";
@import "@ledger/design-system/base.css";
```

`base.css` supplies optional document defaults. The package's `@source` directive includes its components in Tailwind's scan. Components do not inject CSS during server rendering.

```tsx
import { Button, LedgerProvider, Toaster } from "@ledger/design-system";

export function App() {
  return <LedgerProvider locale="en-US" timeZone="UTC">
    <Button onClick={() => console.log("Save requested")}>Save</Button>
    <Toaster />
  </LedgerProvider>;
}
```

Use the same locale, time zone and initial color mode on server and client. Node loads emitted ESM with explicit relative extensions; bundlers may use source under the `development` condition. TypeScript supports NodeNext and Bundler resolution. No workspace alias is needed. Run `npm run test:consumer` after building to install a real tarball in a temporary directory, import it in Node, render React on the server, check declarations, and build Vite/Tailwind CSS.

## Token interchange

The authoring source and legacy `tokens.json` export use the versioned **ledger-css-v1** CSS-oriented dialect. They are not DTCG interchange documents. Use `@ledger/design-system/tokens.dtcg.light.json` or `@ledger/design-system/tokens.dtcg.dark.json` for the validated DTCG 2025.10 boundary. Each mode is independent. CSS-specific tracking information is retained in a namespaced extension where DTCG has no equivalent. Regenerate with `build:tokens`; never hand-edit generated files.

## API ownership and compatibility

Standard reusable components adopt the anatomy and public API of the local shadcn Base UI reference in `src/components/ui/`: flat named exports, explicit composable parts, native props and refs, and the reference's rendering and state contracts. Port source into the package with relative imports and the package `cn`; application source is never a package dependency. Ledger tokens replace styling values while the component contract stays intact. Use Base UI where the reference does; native semantic elements do not need a dedicated primitive. Convenience APIs and opinionated assemblies belong in `src/patterns/`.

Breadcrumb is the first family migrated to this policy, with seven exports: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis`. `BreadcrumbLink` composes a router link through Base UI's `render` contract. Other existing families retain their documented APIs, including compound names and `asChild`, until explicitly migrated with consumers, stories and API metadata. See Components/Breadcrumb and the unreleased changelog for migration details.

Existing Ledger semantic axes retain their meanings: `tone` communicates meaning, `variant` chooses treatment and `size` chooses a documented scale. Standard components preserve the reference's prop names; native DOM properties keep native names (`disabled`, `name`, `form`, `aria-*`, `data-*`). Controlled state retains the reference's value and callback contracts. Custom patterns can name parts by role. Do not rename native or domain terms just to make spelling uniform.

DOM attributes and refs belong on the element that consumers must label, submit, focus, measure or integrate. Standard parts preserve their native targets and composition affordances; patterns document any narrower contract. Custom Field controls call `useFieldControl`. A `BreadcrumbLink render={<Link to="/records" />}` child must accept its merged props and ref. Existing Button navigation uses `Button asChild` around one anchor; its child must also accept injected props and ref.

Base UI, Radix, Vaul and layout helpers are implementation dependencies. Consumers use the package's public parts and their documented native and dependency-derived contracts. **Explicit public adapters** also include Sonner's toast options/promise API, TanStack table definitions, and chart configuration types exposed by the package. Upgrades that affect public contracts require checking consumer types and migration notes. React and Tailwind remain peers. `MODE_STORAGE_KEY` and `SHELL_STORAGE_KEY` are public storage integration constants; persisted data must be validated and fall back safely.

## Lifecycle and contribution

New components start experimental and name an owner, intended use, keyboard behavior, responsive behavior, supported states, and known limitations in their documentation. Promotion to stable requires a public export, complete family documentation, representative stories with play functions for stateful behavior, accessibility checks in both modes, and packed consumer validation. Deprecations name a replacement and migration, remain available for a documented transition, and appear in the changelog. Within 0.x, a minor release may break a documented contract; patches preserve it. No release is implied by local edits.

Tokens and layout implement the design; keyboard operation, understandable copy, visible focus, validation, recovery and honest persistence implement the user contract. The application still owns business permissions and server durability. See Storybook Guidance/Testing and review for the review checklist and workflow specimens.


## Package and product boundary

Shared patterns describe reusable presentation and interaction. `Composer` owns drafting, keyboard suggestions and recoverable submission; its adapter supplies option identities, filtering and exact insertion text. `TaskRow` owns a completion row with caller-rendered owner, date and status content. `Timeline.Item` already supplies the reusable feed item, so no second shared wrapper is needed.

The application keeps `Activity` and `Task` wrappers, event taxonomies, waiting/blocked states, overdue decisions, people lookups and mention serialization (`src/lib/mentions.ts`). Those wrappers and `parseMentions` are not package exports. Patterns/Composer, Patterns/TaskRow and Components/Timeline demonstrate the reusable behaviors; product workflows stay in the application. These new patterns are experimental; no release is implied.

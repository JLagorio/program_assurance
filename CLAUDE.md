# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Program Assurance: a TanStack Start / React 19 app over a local Supabase stack (Postgres, Auth, private Storage). It is an npm workspace with two halves:

- **The app** (`src/`): the Equinox prototype at `/` for daily work, plus a schema inspector at `/schema` and `/records/:collection` over the same rows. The prototype is the design system's first consumer and its test vehicle: when a screen breaks, the kit is what gets fixed.
- **The design system** (`packages/design-system`, published name `@ledger/design-system`, "Ledger"): tokens, primitives, components, layout, patterns and colour mode. Its Storybook is the contract. Read `packages/design-system/AGENTS.md` before touching it: it points at `README.md`, `docs/guides/component-library.md`, the Storybook's Guidance/Agents page and the checks. `packages/design-system/llms.txt` is the Storybook as one generated file for when it is not running.

The project is connected to Lovable. Never force-push, rebase, amend or squash commits that are already pushed; keep the connected branch in a working state.

## Screens

Every screen follows the product pattern contract in `docs/guides/product-patterns.md`: which Ledger part this application uses for each shape (register, preview, record, form, states, titles), the closed exceptions, the file to copy and what checks it. Read it before creating or changing a screen; do not infer a shape from a neighbouring screen. It is imported below so it is always in context.

@docs/guides/product-patterns.md

## Commands

Local stack (Colima profile `program-assurance`, Supabase CLI 2.107.0, ports 54320–54324):

```sh
npm run local:start          # start VM + Supabase, apply migrations, import reference data, seed dev account, write .env.local
npm run local:status
npm run local:stop
npm run local:reset -- --yes # drop local users/workspaces and rebuild from migrations
npm run dev                  # Vite on http://127.0.0.1:3000 (restart after .env.local changes)
```

Dev sign-in: `developer@program-assurance.local` / `local-program-assurance` (a "Sign in as seeded user" shortcut appears in dev when pointed at the local stack). Supabase Studio is on 54323.

App checks:

```sh
npx tsc --noEmit -p tsconfig.json       # app typecheck (build the package first if src/ imports a new export; see below)
npm run lint                            # eslint . (root config; the package lints itself)
npm run test:app                        # vitest src/lib/**/*.test.ts + runtime-data-boundary check
npx vitest run --config vitest.app.config.ts src/lib/system-tree.test.ts   # one app test file
npm run build                           # ds-check → package build → vite build
npm run models:generate                 # regenerate src/lib/database.types.ts from the local schema (after any migration)
```

Integration suites need the stack running; the `test:*` browser suites also need `npm run dev` running (override the app URL with `APP_TEST_URL`). They create a disposable `@example.test` account and clean up after themselves:

```sh
npm run test:local              # Auth + PostgREST checks
npm run test:browser            # CRUD and evidence file recovery
npm run test:program-wizard
npm run test:product-flows
npm run test:requirements
npm run test:system-assurance
npm run test:products
npm run test:patterns           # headers, row openers, date sorting, element draft guard (app on 8080, or APP_TEST_URL)
npm run test:demo               # demo seed mapping and rollback
npm run test:reference          # pinned reference sources, normalization, provenance
npm run test:poc                # archived legacy POC domain tests (tests/fixtures/legacy-poc)
```

Schema tests are plain SQL in rollback-only transactions:

```sh
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/assurance.sql
```

Design-system package (run from the root with `-w packages/design-system`, or inside the folder):

```sh
npm run storybook                              # port 6007 (root script delegates here; there is no app Storybook)
npm run typecheck -w packages/design-system
npm run lint -w packages/design-system
npm test -w packages/design-system             # node --test test/**/*.test.mjs (contrast, DTCG, locale, lint inventory, view state)
npm run test:a11y -w packages/design-system    # every story rendered + play + axe, light and dark, via vitest browser mode
npx vitest run --project storybook-light -t "Button"   # (inside the package) one family in one mode
npm run build:tokens -w packages/design-system # tokens/ → src/generated/ (never hand-edit src/generated)
npm run build:lint -w packages/design-system   # refresh eslint-plugin/components.json after changing exports
npm run build -w packages/design-system        # dist/
npm run test:consumer -w packages/design-system # pack a tarball and import it from a throwaway consumer
npm run ds:check                               # every exported catalog part has a story and an MDX page
npm run ds:api:check / ds:api:update           # public API baseline in packages/design-system/api/public-api.json
```

CI (`.github/workflows/ci.yml`) runs, in order: tokens regenerate cleanly, `ds-check`, package typecheck/lint/test, API baseline, `test:a11y`, app typecheck + lint, `test:app`, `npm run build`, `test:consumer`, `npm pack`. Run the same set before calling a batch done.

Storybook MCP (`.mcp.json`, `http://localhost:6007/mcp`) is available when the package Storybook is running; prefer its `stories-preview` / `test-run` tools for verifying kit changes.

## Architecture

### App layer (`src/`)

- **Routing**: TanStack Router file routes in `src/routes/` (`routeTree.gen.ts` is generated; do not edit). `__root.tsx` composes `QueryClientProvider → ModeProvider → WorkspaceProvider → AppLayout`. Vite config comes from `@lovable.dev/vite-tanstack-config`, which already includes the TanStack, React, Tailwind, tsconfig-paths and nitro plugins; do not add them again. `src/server.ts` wraps the Start server entry to turn swallowed h3 500s into an HTML error page.
- **Dependency direction**: domain code never imports the UI. `src/lib` holds data access, commands, rules and query hooks; `src/components` and `src/routes` render them. The kit never imports the app, and `src/lib` never imports the kit, `src/components` or `src/routes` (lint: `no-restricted-imports` on `src/lib`; the workspace context is the one named exception until it moves). A domain concept that has one visual representation (a status, a record link, an identifier) gets one component that binds the domain vocabulary to a kit part, and every screen uses it.
- **Data**: `src/lib/database.ts` holds the single browser-side Supabase client (throws on the server) and `loadWorkspace`, which calls the `ensure_personal_tenant` RPC and loads the schema catalog for the inspector. `src/lib/models.ts` wraps TanStack Query hooks (`useRows`, mutations) over the generated `Database` types, with a few hand-typed projections for views. Domain commands (program wizard, task/evidence create, requirement edits, library reuse, SSP assembly, system tree) are plain modules in `src/lib/*.ts`, each with a sibling `*.test.ts` that mocks the client. Most multi-table writes go through Postgres functions in the migrations (`create_program_wizard`, `create_program_system`, `author_tailored_profile`, `apply_library_source`, …), not through client-side sequences.
- **Tenancy and concurrency**: every tenant-owned table carries `tenant_id`; RLS keys off membership. Updates send `revision + 1` filtered by the previous revision, so stale writes fail instead of overwriting. Published reference/evidence/assessment revisions are immutable.
- **Runtime data boundary**: `scripts/tests/runtime-data-boundary.test.mjs` fails if anything under `src/` references the legacy POC, snapshot tables, demo fallbacks or `Math.random`. The app never invents example records; empty workspaces stay empty. Demo data is an explicit, provenance-tracked seed (`npm run seed:demo -- --tenant … --account … --apply`); reference publications (NIST OSCAL catalog/baselines, DISA CCI) come from pinned files under `supabase/reference/` via `seed:reference`.
- **Screens**: `src/components/prototype/README.md` maps every feature composition and names the reference file for each shape. `src/components/app/` holds the product shell (`shell.tsx` composes the kit's Shell parts), workspace/sign-in, the program wizard, pickers and the record browser. `src/components/prototype/` holds the feature compositions (program record, requirements, system assurance, evidence, findings, work table, libraries, products). `src/components/ui`, `src/components/reui` and `src/components/examples` are look-only shadcn/reui reference installs, lint-ignored and excluded from product imports.

### Design system (`packages/design-system`)

- Layers, bottom up: `tokens/` (source of truth, ledger-css-v1 JSON) → `src/generated/` (committed Style Dictionary output: `tokens.css`, `theme.css`, `utilities.css`, `tokens.ts`, `utilities.json`) → `src/primitives/` (Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading; token-typed props, no margins) → `src/components/` (Base UI–backed controls and display parts) → `src/layout/` (Shell regions, PageHeader, Section, PageSkeleton) → `src/patterns/` (DataTable, pickers, Composer, Editable, Inspector, Chart, Forms) → `src/mode/`. Components and primitives never import patterns or layout. The package never imports application source.
- Product code imports only the package root (`@ledger/design-system`) and never a file inside it; the `development` export condition maps to `src/index.ts`, otherwise `dist/`. The app's `tsconfig.json` sets `customConditions: ["development"]`, but `dist/` still needs a fresh package build before the app typecheck sees a newly added export.
- Styling is tokens only. The package ships an ESLint plugin (`@ledger/design-system/eslint`) with a `package` preset for itself and a `recommended` preset that the root config applies to product files (`src/routes`, `src/components/app`, `src/components/prototype`, `src/lib`, `src/router.tsx`). Its rules reject arbitrary values, non-token classes, margins, `dark:` variants, deprecated tokens/names, `<colgroup>`, local copies of kit parts (`ledger/no-kit-shadow`, allowed only in `src/components/app/shell.tsx`) and a few more; see the table in `docs/guides/component-library.md`. A product config adds nothing about the kit.
- Every exported catalog part needs a story that renders it in `<Family>.stories.tsx` and one `<Family>.mdx` page; `scripts/ds-check.mjs` enforces it and `scripts/ds-check.allow` may only shrink. Renames ship with an `@deprecated` alias for one version and a `ledger/no-deprecated-name` fixer. Optional props are spelled `?: T | undefined` (`exactOptionalPropertyTypes` is on in both tsconfigs).
- Contribution checklist and versioning rules: "Adding to the kit" in `docs/guides/component-library.md`; changes go in `packages/design-system/CHANGELOG.md`.

### Database (`supabase/`)

Migrations in `supabase/migrations/` (Postgres 17, `public` schema only, Realtime/Edge/pooler disabled). Layers: tenancy → reference schema (shared, read-only publications) → assurance schema (programs, systems, requirements, implementation, assessments, findings, risks, POA&M) → workflow schema (tasks, reviews, activity, packages) → later feature migrations (program wizard, canonical systems, library reuse, program setup v2, products). ERD and constraints: `docs/schema-erd.md`, `docs/assurance-schema.md`, `docs/workflow-schema.md`. After adding a migration: `npm run local:start` applies it, then `npm run models:generate`.

Direct CLI use must target the project's VM:

```sh
export DOCKER_HOST="unix://$HOME/.colima/program-assurance/docker.sock"; unset DOCKER_CONTEXT
supabase migration new describe_your_change
supabase migration up --local --network-id program-assurance-local
```

## Conventions worth knowing

- TypeScript is strict with `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature` (so `import.meta.env["VITE_X"]`), `exactOptionalPropertyTypes`, `noImplicitReturns`.
- Prettier: 100 columns, double quotes, trailing commas. ESLint runs Prettier as a rule.
- Do not use the Next.js `server-only` package; name server modules `*.server.ts`.
- Procedures are skills, rules are here: `/ledger-add-part` walks the kit contribution checklist and `/verify-screen` the screen verification checklist; both point at the guides rather than restating them.
- Feature docs live in `docs/` (`program-wizard.md`, `products.md`, `system-assurance-workflow.md`, `requirement-workspace.md`, `reference-seeding.md`, `demo-seed-mapping.md`). `docs/next.md` is the living list of what landed and which decisions are still open; update it when a batch lands. Design audits and plans are under `docs/guides/`.
- The design-system package's Storybook (port 6007) is the only Storybook; app compositions are verified in the running app, not in stories.

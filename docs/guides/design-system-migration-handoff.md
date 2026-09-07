# Design-system migration handoff

Continue migrating `@ledger/design-system` using the local shadcn Base UI components as the foundation,
one complete component family at a time. **Breadcrumb, Badge and Separator are complete.
Skeleton is the next recommended selection; it has not been migrated.**

## Accepted direction

Start with the checked-in shadcn Base UI components, use their underlying primitives and
composition, and adapt the same components to the product. **One component per job.** Shadcn
is a starting point, and useful product extensions belong on that component. A status badge
is Badge; do not create separate standard and product versions of the same control.

Retain useful names, anatomy, native attributes/refs, keyboard behavior, focus, ARIA and
render composition. Add or adapt options where needed, documenting defaults and how they
combine. Use existing tokens for colors, typography, spacing, dimensions, borders and motion
in both modes. New token decisions belong in source and must be generated through the build.

Patterns assemble several components into workflows or larger regions. Single-component
options such as Badge's tone, density and icon stay on Badge. Existing layer boundaries still
apply, and the package must not import application source. Migrate one family completely at a
time, preserving unrelated component APIs and user changes.

This user clarification supersedes the previous exact-API-only interpretation. The policy is
[Component contracts](component-library.md#component-contracts); older specifications and
historical notes may conflict with the current direction.

## Read these sources first

- [Repository instructions](../../AGENTS.md), especially the Lovable history rule.
- [Component-library guide](component-library.md) and [package README](../../packages/design-system/README.md).
- [Reference Skeleton](../../src/components/ui/skeleton.tsx),
  [Ledger Skeleton](../../packages/design-system/src/components/skeleton.tsx),
  [stories](../../packages/design-system/src/stories/components/Skeleton.stories.tsx), and
  [documentation](../../packages/design-system/src/stories/components/Skeleton.mdx).
- Completed [Separator](../../packages/design-system/src/components/separator.tsx) and its
  [usage and migration guidance](../../packages/design-system/src/stories/components/Separator.mdx).
- Completed [Badge](../../packages/design-system/src/components/badge.tsx),
  [stories](../../packages/design-system/src/stories/components/Badge.stories.tsx),
  [documentation and migration mapping](../../packages/design-system/src/stories/components/Badge.mdx).
- [Package exports](../../packages/design-system/src/components/index.ts),
  [changelog](../../packages/design-system/CHANGELOG.md), and
  [packed-consumer check](../../packages/design-system/build/consumer-smoke.mjs).

Files under `src/components/ui/` are the source baseline. Port into the package using relative
imports and package `cn`; never import application source. Application consumers import the
package root. Do not run a broad shadcn installation or upgrade the reference catalog in one slice.

## What the completed slices established

Breadcrumb exports seven flat parts: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`,
`BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis`. Lists and
separators are explicit; the list wraps and the current page uses regular text. Link composition
uses Base UI `useRender`/`mergeProps`. Router destinations, params and search remain on the
rendered router element. In-place drill-down actions remain native buttons. RecordHeader builds
its parent trail at the pattern layer; preserve its tested `first:hidden` separator behavior for
empty fragments/arrays, which avoids a leading chevron.

Badge is one component for generic labels, semantic statuses and rendered links. The
[Badge page](../../packages/design-system/src/stories/components/Badge.mdx) owns its defaults,
option interactions and migration examples. Existing status consumers use
`variant="secondary"`; the unconfigured default is brand/bold. Preserve the shared Tone type
and the separate Count, Dot, Indicator and Avatar-part contracts when adapting other families.

The packed-consumer fixture covers native attributes, render composition, types, SSR and CSS.
Start `npm run storybook` and review [Components / Badge](http://localhost:6007/?path=/docs/components-badge--docs).

Separator uses the Base UI primitive with native props/refs, render composition and state
callbacks. Its existing `isDecorative` option supplies hidden semantics that explicit native
ARIA props can override. Styling keeps the one-pixel Ledger border and ordinary className
overrides; the primitive exposes `data-orientation`. The [Separator page](../../packages/design-system/src/stories/components/Separator.mdx)
owns migration details. Existing consumers need no edits.

## Next selection: Skeleton

Start with `src/components/ui/skeleton.tsx`. Shadcn's Skeleton is a native div; this family
does not need an invented Base UI primitive. The Ledger version has useful shape, multiline
and dimension options but a narrow native-prop surface. Preserve those options on the same
component while adopting native attributes and refs.

Inventory actual consumers before editing: Skeleton stories, DataTable, Chart.Frame and
PageSkeleton currently use it. Resolve which element receives native props/ref when `lines`
renders several rows, and document that contract. Keep token styling, hidden loading visuals
and reduced-motion behavior. Use one family page and representative examples with assertions.

The reference catalogs stay in their installer locations. Do not move or delete them while
cleaning up the package. Button, Dialog, Avatar and Combobox remain separate family migrations.

## Completion workflow

Follow [Adding to the kit](component-library.md#adding-to-the-kit): implement the change and
affected consumers, exercise it in representative stories, update one accurate family page
and the changelog, then run relevant checks. Inspect git status and inventory imports first.
Extend packed-consumer coverage when exports or consumer integration change. Update this
handoff's completed family and next selection when a migration finishes.

Only intentional public contract changes need `npm run ds:api:update`. Review that diff before
accepting it. Audit policy notes are optional; `npm run ds:api:matrix` produces ignored reports
when an audit needs them. Neither matrix generation nor exhaustive prop-review prose is part
of the normal component workflow.

Run from the repository root. The story paths below are the completed Separator slice;
select the affected stories for the next family:

```sh
npm run typecheck -w packages/design-system
npx tsc --noEmit -p tsconfig.json
npm run lint -w packages/design-system
npm run lint
npm test -w packages/design-system
npm run test:api
npm run test:app
npm run ds:api:check
npm run ds:check
npm run test:a11y -w packages/design-system -- src/stories/components/Separator.stories.tsx src/stories/components/Toggle.stories.tsx src/stories/components/Resizable.stories.tsx
npm run build
npm run build-storybook -w packages/design-system
npm run test:consumer -w packages/design-system
git diff --check
```

The Storybook command runs light and dark projects. Add other affected stories; broaden when a
shared change warrants it. Rebuild tokens first if token sources or their generator change.
Do not repeat successful checks unless later edits or unresolved concerns require it.

## Validation at the Separator handoff

Package/application typechecks, package lint, 15 package tests, 3 API tests, 7 application tests,
28 affected Storybook checks in light/dark modes, API and coverage checks, production/Storybook
builds, and packed ESM/SSR/TypeScript/Vite/Tailwind validation passed. The built Separator page
and composition story render without console errors; width overrides and vertical `hr` geometry
are covered. Repository-wide lint retains 12 existing formatting errors in `src/hooks/use-mobile.ts`
and `src/lib/utils.ts`.

## Validation at the Badge handoff

Passed for the unified Badge: application/package TypeScript, package lint, scoped consumer
lint, 15 package tests, 2 API tests, 7 application tests, and 476 affected Storybook checks
across 38 story files in both modes. Visual review inspected eight screenshots covering the
standard matrix, semantic matrix, tone/variant combinations and dense rows: 154 badges had
correct 16px/20px heights, 12px icons, a shared pill radius and no clipped labels or browser
errors. Captures are in `/private/tmp/badge-unified-qa`.

At that handoff, also passed: declaration/matrix generation and freshness under the former
audit workflow, all 115 exports with story coverage and 107 documentation pages, production and Storybook builds,
and packed ESM/SSR/NodeNext/Vite/Tailwind validation outside the workspace. The final focused
Badge rerun passed 34 checks after render-owned label composition was verified. The packed
fixture covers icon plus render-owned text, false/omitted icon content, accepted semantic
options and rejected invalid tones, appearances and null/unsupported sizes. Working-tree
whitespace checks pass.

Known baseline: full-repository lint still reports 12 formatting errors in unchanged
`src/hooks/use-mobile.ts` and `src/lib/utils.ts`, plus 45 existing warnings. Package lint passes.
These baseline errors are outside the Badge slice; avoid unrelated formatting churn.

Environment: the browser plugin initialized but returned no available browser; documented
discovery also returned an empty list. Use automated Chromium checks and local screenshot QA
when that remains the case. Npm registry access and local browser/server checks can require
sandbox network permission. A task-specific writable cache (`/private/tmp/badge-npm-cache`)
avoids changing the user's npm folder ownership. Report restricted checks honestly.

## Delivery and version control

Report component/API changes, visual/behavior differences, actual tests and remaining baseline
failures, and the local Storybook review links. Package version remains `0.6.0` with unreleased
notes; no release is implied.

The repository is connected to Lovable. Preserve published history: no force pushes or rewriting
pushed commits. The Badge request and subsequent single-component correction authorize local implementation
and this updated handoff;
no commit, push, publication or release was requested. Preserve unrelated edits in overlays,
scroll containment, shell/composer and base styles. Inspect the working tree afresh rather than
assuming the prior session's unrelated changes are still present. The user staged changes
during this correction; final working-tree updates may differ from that staged snapshot.
Review both before committing. Stage only intended work if later authorized to commit.

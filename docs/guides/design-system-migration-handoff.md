# Design-system migration handoff

Continue migrating `@ledger/design-system` using the local shadcn Base UI components as the foundation,
one complete component family at a time. **Breadcrumb and Badge are complete. Separator is
recommended for the next selection; it has not been migrated.** Review the completed Badge
slice before starting another family.

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
- [Reference Separator](../../src/components/ui/separator.tsx),
  [Ledger Separator](../../packages/design-system/src/components/separator.tsx),
  [stories](../../packages/design-system/src/stories/components/Separator.stories.tsx), and
  [documentation](../../packages/design-system/src/stories/components/Separator.mdx).
- Completed [Badge](../../packages/design-system/src/components/badge.tsx),
  [stories](../../packages/design-system/src/stories/components/Badge.stories.tsx),
  [documentation](../../packages/design-system/src/stories/components/Badge.mdx), and
  [migration mapping](badge-migration.md).
- [Package exports](../../packages/design-system/src/components/index.ts),
  [API policy](../../packages/design-system/api/axis-policy.json),
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

Badge is one component for generic labels, semantic statuses and rendered links. `Badge`,
`BadgeProps` and `badgeVariants` combine the six shadcn variants with product options:

- `variant` chooses treatment: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
- `tone` chooses the palette: `brand`, `neutral`, `information`, `success`, `warning`, `danger`.
- `appearance` overrides subtle/bold emphasis for filled variants; it has no effect on outline,
  ghost or link treatments.
- `size` chooses 20px small or 16px xsmall density; every palette uses the same pill anatomy.
- `icon` is an optional leading icon shorthand; icons can also be composed as children.
- `render` composes a real anchor or custom element while preserving merged native props,
  styles, classes, handlers and refs.

Default Badge is the shadcn brand/bold treatment. Secondary defaults neutral/subtle and
destructive defaults danger/subtle. Tone changes palette without changing treatment or
geometry. Existing status consumers use `variant="secondary"` and retain their tone/appearance;
formerly implicit neutral labels explicitly set `tone="neutral"`. There is one Badge story and
documentation family. All badge roots emit `data-slot="badge"` with their resolved axes.

`Count`, `Dot`, `Indicator`, `Tone`, `tones` and `toneClasses` retain their contracts. Their
shared palette is in `src/lib/status-tone.ts` and is re-exported through `components/badge.tsx`.
Avatar's independent Badge/Count parts remain unchanged. Badge adds brand support locally
without widening the shared Tone type used by other families.

CVA is a declared package dependency. Ledger's focused/danger outlines replace the reference's
translucent rings with solid 2px outlines and 2px offsets; `outline-danger` is generated from
existing tokens. The lint parser checks CVA classes and important modifiers. Packed-consumer
coverage exercises the same unified Badge for standard and semantic variants, rendered links,
native attributes, types, SSR and generated CSS. API evidence is generated with the scripts.

Review [Components / Badge](http://localhost:6008/?path=/docs/components-badge--docs).
The review server uses port 6008 because the pre-existing port-6007 server had a stale preview
module. Start it with `npm run storybook -w packages/design-system -- --port 6008 --no-open`
if needed. Normal `npm run storybook` uses port 6007. The [Badge migration guide](badge-migration.md)
records the API and token mapping.

## Next selection: Separator

Separator is recommended because its standalone use is small and isolated. Inventory imports
again before editing. At this handoff, only its own stories, Toggle stories and Resizable
stories consume the Ledger export; application routes and patterns do not. Exclude the
`react-resizable-panels` Separator, compound menu/select/combobox separators,
`BreadcrumbSeparator`, and the reference/reui catalogs.

```sh
rg -n '\b(Separator|SeparatorProps|isDecorative)\b' packages/design-system/src src --glob '!**/generated/**' --glob '!src/components/ui/**'
```

Start with the local reference's single `Separator` export and `SeparatorPrimitive.Props`
from `@base-ui/react/separator`. Preserve `orientation="horizontal"`, `data-slot="separator"`,
Base UI state, native props/refs and `render` composition. The current Ledger implementation
is a handmade div despite outdated comments/MDX claiming Radix. Its narrow API has
`orientation`, `isDecorative` and `className` only.

Resolve these details in the slice:

1. **Adapt decoration on Separator itself.** Installed Base UI 1.7.0 has neither
   `isDecorative` nor `decorative`. The existing `isDecorative` convenience may be retained on
   Separator and translated to `role="none"`/`"presentation"`, `aria-hidden="true"` and omitted
   `aria-orientation`, with explicit native overrides respected. Preserve this useful option
   directly instead of creating a second separator component.
2. **Match actual state attributes.** Base UI emits `data-orientation="horizontal"` or
   `"vertical"`. The reference's `data-horizontal:`/`data-vertical:` depend on aliases in
   shadcn's stylesheet, which Ledger does not import. Translate to
   `data-[orientation=horizontal]:` and `data-[orientation=vertical]:` or deliberately define
   supported aliases. Retain full horizontal width and vertical self-stretch/hairline geometry.
3. **Preserve callback props.** Base UI allows `className(state)` and `style(state)`. The local
   reference passes className directly to its helper; Ledger's `cn` does not accept a callback.
   Resolve a function against `Separator.State` before merging the token classes, and forward
   the style callback. Do not silently narrow the primitive's public prop type.
4. **Document the border mapping.** Ledger currently draws `color.border` with `border-default`;
   the reference draws a background-filled hairline. Explicitly map that paint to the existing
   border token, retaining one-pixel geometry and parent-owned spacing.
5. **Verify semantics and composition.** The primitive defaults to a div, role separator,
   aria-orientation horizontal, and no tab stop; vertical updates orientation. Add executable
   checks for native/ref targets, rendered elements, merged handlers/styles/refs, callback
   classes/styles, decorative output and ordinary tab order in both modes.

Keep Button, Dialog, Avatar, Combobox and other families outside the slice even when they already
use Base UI internally. Their full standard-contract migrations remain separate work.

## Completion workflow

1. Inspect git status and preserve unrelated edits. Inventory imports before replacing names.
2. Record the API/token mapping, adapt the component and migrate every family consumer.
3. Update stories and the complete MDX template, exports, affected patterns, migration docs and changelog.
4. Review axis policy against actual native targets, state ownership, defaults and tracked axes.
   Preserve unrelated policy entries. Generate declarations/matrix using scripts; never hand-edit evidence.
5. Extend the packed consumer fixture for exports, SSR/render composition and TypeScript contracts.
6. Run checks, resolve regressions, leave the slice ready for visual review, and update this handoff
   with the completed family and next suggested selection. Do not start that next family automatically.

Run from the repository root:

```sh
npm run typecheck -w packages/design-system
npx tsc --noEmit -p tsconfig.json
npm run lint -w packages/design-system
npm run lint
npm test -w packages/design-system
npm run test:api
npm run test:app
npm run ds:api:update
npm run ds:api:matrix
npm run ds:api:check
npm run ds:api:matrix:check
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

## Validation at the Badge handoff

Passed for the unified Badge: application/package TypeScript, package lint, scoped consumer
lint, 15 package tests, 2 API tests, 7 application tests, and 476 affected Storybook checks
across 38 story files in both modes. Visual review inspected eight screenshots covering the
standard matrix, semantic matrix, tone/variant combinations and dense rows: 154 badges had
correct 16px/20px heights, 12px icons, a shared pill radius and no clipped labels or browser
errors. Captures are in `/private/tmp/badge-unified-qa`.

Also passed: final declaration/matrix generation and freshness, all 115 exports with story
coverage and all 107 documentation pages on the template, production and Storybook builds,
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

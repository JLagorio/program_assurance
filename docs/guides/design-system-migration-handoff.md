# Design-system migration handoff

Continue migrating `@ledger/design-system` to the local shadcn Base UI component contracts,
one complete component family at a time. Breadcrumb is complete. **Badge is the recommended
next slice; it has not been migrated.** Finish that slice and leave it ready for visual review
before moving to another family.

## Accepted direction

The user approved using the shadcn components 1:1 in structure and applying Ledger's stylized
token system. Preserve component names, named exports, anatomy, prop names and types, native
attributes and refs, composition, and interaction behavior. Use the underlying primitives and
helpers used by the reference. Base UI is the foundation where applicable; a native HTML part
does not need an invented primitive.

Adapt styling to Ledger's colors, typography, spacing, dimensions, borders, focus, and motion
tokens. The component contract stays familiar to a shadcn consumer. Preserve state selectors
and interaction affordances when translating classes, including focus, invalid, disabled,
hover, and rendered-link states where present.

The package, tokens, themes, layout primitives, Storybook, and higher-level patterns remain.
Convenience compositions belong above the standard components. Avoid restoring the former
compound-name requirement or adding custom props to a migrated base component just to keep
old call sites compiling. Other families retain their current APIs until their own migration.

The current policy is [Component contracts](component-library.md#component-contracts).
Older specs describe the custom kit and may conflict with this newly approved direction.

## Read these sources first

- [Repository instructions](../../AGENTS.md), especially the Lovable history rule.
- [Component-library guide](component-library.md) and [package README](../../packages/design-system/README.md).
- [Reference Badge](../../src/components/ui/badge.tsx) and [current Ledger Badge](../../packages/design-system/src/components/badge.tsx).
- [Completed Breadcrumb implementation](../../packages/design-system/src/components/breadcrumb.tsx),
  [stories](../../packages/design-system/src/stories/components/Breadcrumb.stories.tsx),
  and [documentation](../../packages/design-system/src/stories/components/Breadcrumb.mdx).
- [Package exports](../../packages/design-system/src/components/index.ts),
  [API policy](../../packages/design-system/api/axis-policy.json),
  [changelog](../../packages/design-system/CHANGELOG.md), and
  [packed-consumer check](../../packages/design-system/build/consumer-smoke.mjs).

The checked-in files under `src/components/ui/` are the source baseline for this migration.
Copy into the package and adapt imports to package-local utilities. The package must never
import application source, and application consumers continue importing `@ledger/design-system`.
Do not run a broad shadcn installation or upgrade the reference catalog as part of one slice.

## What Breadcrumb established

- Seven flat exports: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`,
  `BreadcrumbPage`, `BreadcrumbSeparator`, and `BreadcrumbEllipsis`.
- Base UI `useRender` and `mergeProps` on the link; native DOM props and refs on every part.
- Explicit lists and separators, regular-weight current-page text, and wrapping by default.
  `Breadcrumb.Item`, `isCurrent`, `asChild`, and root `label` were replaced in all consumers.
- Router destinations, params, and search remain on the router element passed through `render`.
  Local drill-down actions remain actual buttons; current-page text has no navigation action.
- `RecordHeader` assembles the parent trail and current ID at the pattern layer. Its generated
  separator uses `first:hidden`, so empty fragments or arrays do not leave a visible leading
  chevron. Preserve that tested edge case.
- Stories cover the standard trail, custom separators, collapsed parents, custom rendered links,
  native refs and attributes, keyboard behavior, wrapping, and local actions. Keep interaction
  assertions in representative stories; use callback spies instead of visible test counters.
- Public exports, reviewed API metadata, generated baselines, migration docs, and packed-consumer
  validation were updated together. The large JSON API-evidence diff is generated output.

Review the completed slice at
[Components / Breadcrumb](http://localhost:6007/?path=/docs/components-breadcrumb--docs).
The local server may need starting with `npm run storybook` from the repository root.

## Next slice: Badge

Start from the local reference's exact `Badge` and `badgeVariants` exports. Preserve its
`useRender.ComponentProps<"span">` composition and `VariantProps<typeof badgeVariants>` API,
the default `variant="default"`, the variants `default`, `secondary`, `destructive`, `outline`,
`ghost`, and `link`, and the `data-slot`/`data-variant` output. It has no Ledger-specific `tone`,
`appearance`, `size`, or `icon` props. Express icon content through children and preserve the
reference's icon-position data attributes and selectors.

Before editing, inventory both root-package and relative imports, usages in components,
patterns, shapes, shell, application routes, and stories. For example, run from the repo root:

```sh
rg -n '\b(Badge|BadgeProps|badgeVariants|toneClasses|tones|Tone|Count|Dot|Indicator)\b' packages/design-system/src src --glob '!**/generated/**' --glob '!src/components/ui/**'
```

Identify consumers by their imports before replacing names. Exclude the unrelated reui Badge
in `src/components/examples/c-timeline-6.tsx`, the reference catalog, and `Avatar.Badge` /
`Avatar.Count`. Badge has substantially more consumers than Breadcrumb, so keep the migration
bounded to this family even when it changes many call sites.

Resolve these integration details as part of the slice:

1. **Preserve semantic status meaning.** Existing `tone="success"` or `tone="warning"` badges
   cannot all become the reference's default brand badge. Map the old status treatments to
   explicit token styling or a reusable `StatusBadge` pattern composed from the base Badge. Preserve the
   actual neutral, informational, success, warning, and danger meanings, subtle/bold treatments,
   and dense placements when migrating consumers. Document the mapping and show it in stories.
   Existing neutral badges also need review because the new base default represents branding.
   A `StatusBadge` pattern can retain the old `tone`, `appearance`, `size`, and `icon` conveniences;
   keep status guidance in its documentation and the standard six variants in Badge's documentation.
2. **Respect layer boundaries.** Components may not import patterns. If lower layers need shared
   status styling, keep the recipe or token utilities in an appropriate lower layer and compose
   the base Badge there. A higher-level status pattern can serve application/pattern consumers.
   Avoid copying a separate status class map into every call site.
3. **Preserve neighboring APIs.** The current `badge.tsx` also exports `Count`, `Dot`, `Indicator`,
   `Tone`, `tones`, and `toneClasses`. They serve other families such as Avatar, Alert, charts,
   Progress, Tabs, and Table. Do not delete or redesign them during the Badge migration. They
   may be relocated with imports/barrels updated if needed, preserving their public contracts
   and avoiding dependency cycles.
4. **Declare runtime dependencies in the package.** The reference uses `class-variance-authority`.
   At this handoff it is declared only in the root application package, so copying its import
   without adding the design-system dependency would be masked by workspace hoisting. Update
   the package manifest and lockfile deliberately, then verify a packed external consumer.
5. **Retain render and native behavior.** A Badge is a span by default and can render a real
   anchor through `render`. Preserve merged attributes, styles, handlers, and refs; demonstrate
   keyboard focus for the link form. Use the package `cn`, not the reference's application import.
6. **Translate the visual recipe deliberately.** Keep every reference variant available. Replace
   raw values, arbitrary rings, opacity-based colors, and explicit dark classes with appropriate
   Ledger tokens for both modes. A gap in tokens needs an explicit token decision and documented
   mapping, not the silent removal of a variant or interaction state. Edit token sources and
   run the token build if needed; never edit `src/generated/` by hand.

Keep the scope to Badge and the consumers/supporting files required for it. Button, Dialog,
Avatar, Combobox, and other families have not yet adopted the new policy in full, even when
they already use Base UI internally. Do not migrate them incidentally.

## Completion workflow

1. Inspect `git status`, current reference/component code, dependencies, and existing checks.
   Preserve unrelated user changes. Record the old-to-new API and token mapping before applying
   the mechanical consumer edits.
2. Implement the reference contract with Ledger tokens and migrate the full family, including
   conditional content, icons, links, styles, and all application/package consumers.
3. Update the family stories and MDX, changelog, package exports, and any affected patterns.
   Exercise all variants, both modes, representative dense/long content, native refs/attributes,
   and rendered-link composition. Every public named part must have executable story coverage.
4. Update `packages/design-system/api/axis-policy.json` to describe the actual final native
   targets, state ownership, defaults, and tracked semantic axes. Keep unrelated policies intact.
5. Regenerate the declaration snapshot and API matrix using their scripts. Review the generated
   changes; do not hand-edit the generated evidence to make a check pass.
6. Extend the existing packed-consumer fixture for the new exports, SSR/render composition, and
   TypeScript contract. Run relevant checks, resolve regressions, and leave a reviewable slice.

Run commands from the repository root unless a command supplies a workspace:

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
npm run test:a11y -w packages/design-system -- src/stories/components/Badge.stories.tsx
npm run build
npm run build-storybook -w packages/design-system
npm run test:consumer -w packages/design-system
git diff --check
```

Add affected consumer stories to the Storybook command; it already runs both light and dark
projects. Broaden to the full suite when a shared change warrants it. If token sources change,
run `npm run build:tokens -w packages/design-system` before the checks. Do not rerun successful
checks repeatedly unless code changes or unresolved concerns justify it.

## Validation at the Breadcrumb handoff

Passed: application/package TypeScript, package and scoped changed-file lint, 13 package tests,
2 API-check tests, 7 application tests, API declaration/matrix freshness and story coverage,
affected Storybook render/interaction/accessibility checks in both modes, production and
Storybook builds, and packed ESM/SSR/NodeNext/Vite/Tailwind consumer validation. The initial
affected Storybook run passed 94 checks; the final Breadcrumb/RecordHeader rerun passed 30
checks after story cleanup and the new empty-parent example.

Known baseline: full-repository lint reports 12 formatting errors in unchanged
`src/hooks/use-mobile.ts` and `src/lib/utils.ts`, plus existing warnings. These were not introduced
by Breadcrumb. Recheck the current state rather than assuming they remain; distinguish baseline
issues from regressions and avoid unrelated formatting churn in a component slice.

During commit preparation, unrelated unstaged deletions appeared under `docs/superpowers`,
including the working copy of the generated API matrix JSON. Those deletions were kept outside
the Breadcrumb commit. Inspect the next session's working tree before regenerating evidence or
restoring historical files; generation can recreate a file the user deliberately removed. The
passing validation above describes the completed Breadcrumb content before those deletions.

Environment notes: the interactive browser runtime was unavailable, so manual visual review
was not claimed. Automated Chromium tests passed after sandbox access to a local loopback
server was allowed. The packed-consumer test needed a writable npm cache; it passed using
`npm_config_cache=/private/tmp/breadcrumb-npm-cache` with the necessary package-download access.
Use a task-specific temporary cache if needed; do not change ownership of the user's npm folder.
Permission restrictions are environment-specific, and test failures must not be silently skipped.

## Delivery and version control

Report the component/API changes, visual or behavioral differences, tests actually run, any
remaining baseline failures, and the local Storybook review link. Update this handoff with the
next completed family and suggested following slice. Package version remains `0.6.0` with
unreleased notes; no release is implied by local migration work.

The repository is connected to Lovable. Preserve published history: no force pushes or rewriting
pushed commits. The user requested a local commit for the completed Breadcrumb slice and this
handoff; pushing or releasing was not requested. Follow the next session's authorization for
commits or publishing, and stage only the intended work.

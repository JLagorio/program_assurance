# design-sync notes — Program Assurance UI Kit

- Repo was git-initialized on 2026-08-28 (was a bare ~/Downloads folder before); durable set commits normally now.
- **Package manager**: bun (bun.lock), but bun isn't on PATH — use `npx -y bun@latest install --frozen-lockfile`.
- **No library build**: this is a TanStack Start app. The DS entry is hand-authored at `.design-sync/preview-support/entry.ts` (wired via `cfg.entry`) exporting the bespoke kit from `src/components/app/ui.tsx` + `Shell` + the `PreviewRouter` shim.
- **`src/components/ui/` (46 shadcn files) is unused Lovable scaffolding** — zero imports anywhere in the app. Excluded from the DS except the curated primitives subset below (user confirmed 2026-08-28).
- **`cfg.pkg` is an alias**: "program-assurance" (repo package.json name is the meaningless template name `tanstack_start_ts`). Previews import from `"program-assurance"`; TS "Cannot find module" diagnostics on that import are expected — esbuild's story-import shim resolves it.
- **CSS**: Tailwind v4, compiled by `cfg.buildCmd` (`npx @tailwindcss/cli` over `.design-sync/preview-support/tailwind-entry.css`) into `.design-sync/.cache/tailwind.css` (= `cfg.cssEntry`). Re-run buildCmd before any converter build when sources or previews changed — **designs only get utilities that were compiled in**; previews are a `@source`, so new glue classes need a recompile.
- **Fonts**: Inter + JetBrains Mono load via a remote Google Fonts `@import` prepended in tailwind-entry.css (the app loads them via `<link>` in `__root.tsx`, invisible to the bundle). `[FONT_REMOTE]` is the expected outcome, not a warn to chase.
- **Render check browser**: no playwright chromium cache on this machine; validate AND capture both honor `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` — always set it or they die asking for `npx playwright install`.
- **Provider**: `PreviewRouter` (`.design-sync/preview-support/router-shim.tsx`) — a TanStack `RouterContextProvider` with a catch-all route. Needed because Tabs and Shell render `<Link>`/`useRouterState`.
- **Grouping**: from JSDoc `@category` tags added to `src/components/app/ui.tsx` / `shell.tsx` exports (actions/status/layout/data/navigation/forms/overlay).

- **Preview glue**: utilities not already compiled (e.g. `max-w-sm`) silently don't apply until buildCmd re-runs — previews use inline `style={{maxWidth}}` for wrapper widths instead. Custom DS utilities are safelisted via `@source inline(...)` in tailwind-entry.css.
- Input/Select/Textarea ship no `disabled:` styling of their own (native browser dimming only) — true component behavior, not a preview defect.

- **componentSrcMap pins all 24 components deliberately** — with `srcDir` at `src/components/app` the fuzzy-find has nothing to mis-match, but without pins the discovery would try the unused shadcn files (`button.tsx` etc.) for names like Button. Keep the map complete when adding components.

- **Second sync pass (2026-08-28) added 12 components**: 9 curated shadcn primitives (Checkbox, Switch, RadioGroup, Tooltip, DropdownMenu, Popover, Skeleton, Avatar, Separator — non-colliding names only; the rest of `src/components/ui` stays excluded) + 3 domain composites from `inheritance.tsx`. Shadcn groups come from `.design-sync/docs-stubs/*.md` frontmatter stubs (path-derived grouping yields `general` for files outside `srcDir`); composites use JSDoc `@category`. Composite previews import real fixtures from `@/lib/reusable-components` — if that module's shape changes, those previews break first.
- **Guideline pages** are authored in `docs/guides/*.md` (wired via `guidelinesGlob`) — factual claims validated against `styles.css`/app usage on 2026-08-28; re-validate if the theme changes.

- **Polish pass (2026-08-28, "Stripe parity")**: Select draws its own chevron (`appearance-none` + absolute ChevronDown in a relative span); Modal close and FilterChip use lucide X/Plus, not text glyphs; shadcn tier harmonized to 13px/DS shadows (dark Tooltip, tighter DropdownMenu items, hairline separators, neutral checkbox border); new `EmptyState` (ui.tsx) and `Toaster` (`toast.tsx`, sonner wrapper with `expand` prop — the preview uses `expand` + `duration: Infinity`); styles.css base layer adds `::selection` tint, `accent-color`, thin scrollbars, and a global `svg.lucide { stroke-width: 1.75 }` (that CSS beats strokeWidth attributes — use inline `style` for heavier icons, as checkbox.tsx does).

## Known render warns

- `[TOKENS_MISSING]` — `--radix-*`, `--sidebar-width`, `--skeleton-width` etc.: runtime-set vars referenced by the *unused* shadcn files, which the Tailwind scan still reads. Expected-absent; harmless.

## Re-sync risks

- `.design-sync/.cache/tailwind.css` is generated: a fresh clone must run `cfg.buildCmd` before building or `cssEntry` is missing.
- The Google Fonts URL is pinned in `tailwind-entry.css`; if the app's `__root.tsx` font link changes families/weights, update it by hand.
- `entry.ts` enumerates exports by hand: a component added to `app/ui.tsx` must be added there AND to `cfg.componentSrcMap` or it silently won't sync.
- JSDoc `@category` tags live in app source; if the team rewrites `ui.tsx`, groups may drift back to `general`.

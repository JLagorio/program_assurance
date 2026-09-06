# Verification record

Audit date: 2026-09-05. Local Node: v26.3.1. Repository CI specifies Node 22; these are local results, not a claim that a fresh remote CI run was observed. Tests were repeated after concurrent changes moved the workspace package to 0.6.0. The initial run had fewer stories; the current results below supersede those initial counts.

| Check                                                                | Current result                                                                                   | Practical limit                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck -w packages/design-system`                        | Passed                                                                                           | No declaration emission.                                                                                                                                 |
| `npx tsc --noEmit -p tsconfig.json`                                  | Passed                                                                                           | Prototype/workspace resolution; not an installed consumer.                                                                                               |
| `npm run lint -w packages/design-system`                             | Passed, no reported findings                                                                     | Existing rules only.                                                                                                                                     |
| `npm run lint`                                                       | Passed with **41 warnings, 0 errors**                                                            | Includes primitive-usage and hook warnings; not clean-warning status.                                                                                    |
| `node scripts/ds-check.mjs`                                          | Passed: **137 exports, 88 families, 105 pages, 546 stories/112 files, 21 grandfathered entries** | Heuristic export/page/matrix recognition. 103 of 105 pages on the template.                                                                              |
| `npm test -w packages/design-system`                                 | Passed: one test evaluates **168 contrast pairings across both modes**                           | Explicit configured pairs and thresholds only.                                                                                                           |
| `npm run test:a11y -w packages/design-system`                        | Passed: **103 tests; 443 skipped; 103 files passed, 9 skipped**                                  | Initial light-mode Chromium states selected by display-name regex. Logs include invalid DOM nesting and chart-size warnings.                             |
| `npm run build`                                                      | **Failed**, twice including current 0.6.0 workspace                                              | Declaration emission: TS4023 on `src/components/toaster.tsx:74`, unnameable `PromiseIExtendedResult` from Sonner. Vite app production build not reached. |
| Direct Node import of emitted `packages/design-system/dist/index.js` | **Failed**, `ERR_MODULE_NOT_FOUND`                                                               | Extensionless `dist/generated/tokens` reference. Emitted files are not a successfully packed release; bundler-based consumers may resolve them.          |
| Read-only local HTTP crawl                                           | **514 final HTTP 200 responses; all 42 route definitions sampled**                               | SSR only, redirects followed; source fixture IDs plus discovered local anchors. No mutations or browser-storage access.                                  |
| Browser connection                                                   | **Unavailable**: runtime returned no browser; browser list empty                                 | No manual visual/responsive/screen-reader/interaction result claimed.                                                                                    |
| Public reference crawl                                               | **1,165 URL attempts; 1,113 retrieved; discovered queue exhausted**                              | URL aliases and imperfect link candidates included; retrieval does not equal manual review or successful rendering. See normalized counts in JSON.       |

## Exact failure signatures

```text
src/components/toaster.tsx(74,14): error TS4023:
Exported variable 'toast' has or is using name 'PromiseIExtendedResult'
from external module '.../node_modules/sonner/dist/index' but cannot be named.
```

```text
ERR_MODULE_NOT_FOUND Cannot find module
'.../packages/design-system/dist/generated/tokens'
imported from .../packages/design-system/dist/index.js
```

The accessibility run logs the following while still passing:

```text
In HTML, <div> cannot be a descendant of <p>.
This will cause a hydration error.
Text as="p" > Inline as="span" > Chip > Box > div
```

It also logs Recharts width/height `-1` warnings. Those warrant review of initial measurement and fixtures; they are not enough to assert the final chart is invisible.

## Reproduction and environment notes

The first local server/test attempts were denied socket binding by the filesystem/process sandbox (`EPERM`). The same authorized read-only server/test commands were rerun with the permitted sandbox escalation and succeeded. These environment failures are not counted as design-system defects.

The app was served at `http://127.0.0.1:8083/`; existing services occupied 8080–8082. Only the server started for this audit is stopped afterward. The crawl used four concurrent read-only requests, parsed titles/landmarks/local anchors/nested interactive markup, stripped query strings, and seeded hidden routes with IDs already found in source. A lexical route match can also match a literal route such as `/programs/new`; the coverage table documents that limitation.

The token generator was not rerun solely for this audit, to avoid changing generated sources during concurrent work. Fresh token-output parity, a standalone pack/install consumer, a complete Storybook production build, and manual visual sign-off are not claimed. Build failure DS-01 must be addressed before a successful package artifact can be verified.

## Remaining validation for implementation

- Native FormData behavior, disabled/reset semantics, and custom Field compositions.
- Deferred-promise edit races and state persistence after reported success.
- Overlay return focus, removal fallback, nested overlays, slotted busy/disabled event ordering.
- Open/error/busy accessibility stories selected explicitly; unexpected console errors fail.
- Light/dark rendered states, reduced-motion computed styles, RTL, long strings, zoom/reflow, forced colors, and real assistive technology.
- Installed consumer build/SSR and design-token import into the intended design tool.

The absence of these checks is recorded as coverage debt. Source-backed findings provide a concrete implementation/test plan, not a substitute for those checks.

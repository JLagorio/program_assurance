# Design-system audit — 2026-09-18

Audited Ledger at commit `81cb65f`, starting from a clean working tree. The
findings below preserve the original audit evidence; the subsequent fixes are
recorded here and in the package changelog.

The subsequent [deep audit](design-system-deep-audit-2026-09-18.md) records ten
additional reproduced issues involving state, accessibility, and viewport changes.

**Resolution:** all six findings from this pass are fixed. No P0 or P1 issue was
confirmed. The ten findings from the deep audit are also fixed.

| Finding                     | Resolution and regression coverage                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tree-grid keyboard entry    | React maintains one tab stop among rendered rows; DataTable / Tree enters through Tab and exercises row navigation.                                 |
| Invalid and composing Enter | Editable consumes rejected commits; DataTable advances only accepted editor commits and excludes IME confirmation. DataTable / Editing covers both. |
| RTL splitters               | Physical pointer and arrow deltas account for computed direction. Shell / Right To Left Splitters and Shell Icon Rail exercise both edges.          |
| Banner focus contrast       | Focus rings inherit the foreground that contrasts with each banner fill; Banners and token contrast checks cover the result.                        |
| Resting-border guidance     | Testing and Review now distinguishes the intentional 1.5:1 resting border from the 3:1 focus/state contract.                                        |
| Broken documentation links  | Density, Pagination, Editable and Progress point to the existing DataTable and chart overview pages.                                                |

## Findings

### P2 — Tree-grid row navigation has no keyboard entry point

Location: `packages/design-system/src/patterns/data-table/data-table.tsx:724–729`,
with `claimTabStop` at line 940.

Every tree row initially receives `tabIndex: -1`. The focus handler only assigns
`0` after a row has already received focus, and the arrow-key handler ignores
events from child controls. In the initial Tree story, all five visible rows have
`-1`; Tab reaches header menus and disclosure buttons but never a row. The
documented row arrow-key navigation is therefore unavailable through normal
keyboard entry.

The existing Tree play function directly calls `mainBoard.focus()` at
`DataTable.stories.tsx:578`, bypassing the missing entry point.

Recommendation: give one visible row the initial tab stop, maintain it when rows
are filtered/collapsed/replaced, and test entry with Tab before exercising the
arrow keys.

Reproduction: [Tree, without the play function](http://localhost:6007/iframe.html?id=patterns-data-table--tree-story&viewMode=story&embed=true).

### P2 — Editable-table Enter handling bypasses validation and composition

Location: `packages/design-system/src/patterns/data-table/data-table.tsx:583–591`.

`enterMovesDown` schedules focus on the next row for every input Enter. It does
not know whether the editor accepted the value and does not check IME composition.
Two cases reproduced in the Editing story:

- Clear the first Finding and press Enter. Its invalid editor stays open while
  focus moves to the second row.
- Dispatch an Enter keyboard event with `isComposing: true` while editing. Focus
  moves to the next row, and the resulting blur commits the draft and increments
  the saved count. This defeats the composition guard inside `Editable.Text`.

Recommendation: advance only when the editor explicitly accepts the commit, and
ignore composing Enter events. Cover invalid Enter and composing Enter in the
table integration story. The composition reproduction used a synthetic browser
event; a native OS input-method session was not exercised.

Reproduction: [Editing, without the play function](http://localhost:6007/iframe.html?id=patterns-data-table--editing-story&viewMode=story&embed=true).

### P2 — Shell splitters resize in the wrong direction in RTL

Location: `packages/design-system/src/layout/shell/splitter.tsx:83`, with the same
fixed direction calculation at lines 96–99.

The Shell places its regions on logical edges, but its shared splitter multiplies
physical pointer/arrow movement by a fixed sign. At 1440px in the RTL story,
dragging the right-hand navigation's splitter left by 64px reduced its width from
704px to 640px and moved the edge right. ArrowRight then increased the width to
656px and moved the edge left. Both side-navigation and panel splitters use this
calculation. The current RTL story tests Home, which does not exercise direction.

Recommendation: derive the physical resize direction from the rendered text
direction and edge, and test pointer movement and both arrow keys in LTR and RTL.

Reproduction: [Shell RTL](http://localhost:6007/?path=/story/layout-shell-icon-rail--right-to-left).

### P2 — Banner action focus outlines lack contrast on bold backgrounds

Location: `packages/design-system/src/components/banner.tsx:63`.

Banner actions use `outline-focused` against their bold tone background. Using
the package's contrast calculation, the outline/background pairings are:

| Banner tone |  Light |   Dark |
| ----------- | -----: | -----: |
| Information | 1.47:1 | 1.45:1 |
| Warning     | 2.22:1 | 1.06:1 |
| Danger      | 1.68:1 | 1.55:1 |

All are below the package's 3:1 non-text threshold. The declared contrast suite
checks the focus token against ordinary surfaces but omits these bold backgrounds.
This finding is based on the component recipe and resolved token values.

Recommendation: give actions on bold surfaces a contrasting focus treatment and
add these actual background pairings to the contrast tests. This does not call for
changing the intentional resting input-border treatment.

### P3 — Accessibility guidance contradicts the resting-border contract

Location: `packages/design-system/src/stories/docs/TestingAndReview.mdx:51`.

The guidance says resting input borders meet 3:1. The contrast suite explicitly
uses a 1.5:1 visibility floor for those borders, recording the lighter border as
Josef's design decision (`test/contrast.test.mjs:150–157`). Correct the claim and
regenerate `llms.txt`; retain the intentional token values.

### P3 — Five Storybook documentation links target nonexistent pages

The following routes do not match the current Storybook index:

| Source                                     | Current target       | Correct target            |
| ------------------------------------------ | -------------------- | ------------------------- |
| `src/stories/components/Density.mdx:38`    | `patterns-datatable` | `patterns-data-table`     |
| `src/stories/components/Pagination.mdx:70` | `patterns-datatable` | `patterns-data-table`     |
| `src/stories/patterns/Editable.mdx:30`     | `patterns-datatable` | `patterns-data-table`     |
| `src/stories/patterns/Editable.mdx:139`    | `patterns-datatable` | `patterns-data-table`     |
| `src/stories/components/Progress.mdx:41`   | `patterns-chart`     | `patterns-chart-overview` |

Paths in this table are relative to `packages/design-system`. Correct the links
and regenerate `llms.txt`.

## Baseline validation before fixes

| Check                                                           | Result                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Token generation and committed-output diff                      | Passed; no generated drift                                                 |
| `ds:check`                                                      | Passed; 279/279 catalog exports covered, 102/102 family pages, 554 stories |
| Package typecheck and lint                                      | Passed                                                                     |
| Package unit tests                                              | 34 passed, including 376 declared contrast pairings across both modes      |
| API checker tests and baseline                                  | 3 passed; zero baseline changes                                            |
| Storybook interaction/accessibility suite                       | 1,108 passed in 218 files: all 554 stories in light and dark               |
| Package build                                                   | Passed                                                                     |
| Application typecheck                                           | Passed                                                                     |
| Repository lint                                                 | Zero errors; 46 existing warnings                                          |
| Application tests                                               | 52 passed, plus 8 boundary checks                                          |
| Storybook production build                                      | Passed                                                                     |
| Application production build                                    | Passed                                                                     |
| Packed external-consumer installation, SSR, types, Vite and CSS | Passed                                                                     |

Node was `26.3.1`; CI specifies Node 22. The Storybook MCP `test-run` failed to
start Vitest, so the full documented `test:a11y` command was used successfully.
Local server binding and npm cache access initially hit sandbox restrictions;
authorized reruns completed. Build output includes non-failing chunk-size warnings.

## Resolution validation

All 16 findings across both audits are resolved in the working tree. Regression
review also corrected focus visibility in Scroller, contained the motion example,
and covered unnamed treemaps and focus retention when drilling into a later branch.
Concurrent responsive changes were preserved and included in integration checks.

| Check                                     | Final result                                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token generation                          | Deterministic rebuild; all 13 generated outputs unchanged on regeneration.                                                                                            |
| Catalog coverage                          | 279/279 exports, 102/102 family pages, 568 stories.                                                                                                                   |
| Package types and lint                    | Passed.                                                                                                                                                               |
| Package unit tests                        | 34 passed, including 384 contrast pairings and generated-documentation drift checks.                                                                                  |
| Public API                                | Reviewed compatible additions; baseline reports zero drift. Three API-checker tests passed.                                                                           |
| Storybook interactions and accessibility  | **1,154 passed in 222 files**: 568 stories in light and dark, plus 18 forced-colors cases. Final run completed in 65.86 seconds.                                      |
| Package and application production builds | Passed.                                                                                                                                                               |
| Packed consumer                           | Installation, SSR, declarations, Vite and Tailwind CSS passed.                                                                                                        |
| Application types, lint and tests         | Types passed; lint has zero errors and 46 existing warnings; 52 application tests and 8 boundary checks passed.                                                       |
| Storybook production build                | Passed.                                                                                                                                                               |
| Documentation links                       | All 21 links across the four corrected family pages resolve.                                                                                                          |
| Visual checks                             | Desktop and 390px light/dark charts; Calendar and Shell desktop/phone/RTL; short-landscape CommandDialog; forced-color controls in both palettes; Banner focus rings. |

The Storybook MCP runner could not start Vitest; the documented CLI suite ran
successfully against the final stable source. Build output retains non-failing
chunk-size warnings. No deployment or commit was made.

Final logs and chart screenshots are in the ignored
`artifacts/design-system-audit-2026-09-18/fixes/` directory. The browser coverage is
Chromium; this work does not claim a Firefox/WebKit, screen-reader, or native-IME
certification. The IME regression exercises composing keyboard events.

## Scope and visual evidence

The source review covered tokens/modes, public exports and packaging, core controls,
forms, overlays, representative primitives, Shell, DataTable, inline editing,
pickers, and Storybook contract consistency. Focused browser reproductions verified
tree entry, inline editing, and RTL resizing. PickerSheet choose/details flows were
checked at 390px, with a desktop comparison; suspected footer clipping did not
reproduce. Desktop RTL and desktop/phone picker screenshots were inspected.

Local logs and screenshots are retained in the ignored
`artifacts/design-system-audit-2026-09-18/` directory. This pass did not exercise
every product workflow, Firefox/WebKit, a screen reader, or every story visually.
The light/dark suite is automated coverage, not an exhaustive visual sign-off.

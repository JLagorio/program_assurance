# Design-system deep audit — 2026-09-18

Follow-up to the [first audit](design-system-audit-2026-09-18.md), against the same
Ledger implementation at `81cb65f`. This pass found **10 additional P2 issues**.
Combined with the first pass, the audit records 14 P2 issues and two P3
documentation issues. The original evidence below predates the fixes.

**Resolution:** all ten findings in this pass are fixed, with regression coverage
in the maintained Storybook stories and refreshed component documentation.

| Finding                  | Resolution and regression coverage                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline identity          | Separator fragments retain child keys; Inline / Separator And Spread preserves drafts across reorder/removal.                                            |
| Stale confirmation       | Pending dismissal is blocked and unmounted sessions ignore completion; RecordBrowser / Pending Confirmation covers reopening and completion order.       |
| Stale facets             | Memoization follows the current faceted map; DataTable / Live Filters covers loaded/replaced rows and search.                                            |
| Forced colors            | System-color boundaries and states remain visible; Switch, RadioGroup, Tabs and Progress run in a dedicated forced-colors browser project.               |
| Chart expansion state    | Original and expanded views share series/table state; Chart / Overview / Framed tests both directions.                                                   |
| Treemap keyboard actions | Actionable leaves are named, tabbable buttons with Enter/Space and detail-focus restoration; Drilldown and Details cover keyboard and pointer use.       |
| Saved widths             | Preferences remain separate from CSS viewport constraints; Shell / Persisted Widths covers 390px reload, expansion and recovery.                         |
| Short command palette    | Maximum height accounts for the top offset and bottom gap; Command / Short Viewport exercises footer hit testing and selection.                          |
| Calendar navigation      | Around buttons align with the caption and native RTL orientation is respected; Calendar / Navigation Layouts covers both directions and multiple months. |
| Switch optional CSS      | New `color.background.input.thumb` and `.checked` tokens remove the color-scheme dependency; Switch / Switch Matrix covers mismatched scheme and theme.  |

This pass concentrated on state preservation, asynchronous completion, changed
datasets, forced colors, optional CSS integration, keyboard alternatives, native
component options, and viewport transitions. Each finding below has a focused
Chromium reproduction. The previous 1,108 passing Storybook checks do not cover
these scenarios.

Paths below are relative to `packages/design-system`.

## 1. P2 — Inline separators erase keyed descendant state after reordering

**Location:** `src/primitives/inline.tsx:92`.

When `separator` is supplied, Inline wraps children in fragments keyed by their
array index. That changes React's identity boundary even when callers supply
stable child keys.

**Reproduction:** render keyed inputs A and B inside Inline, edit A to `typed
draft`, then reorder them to B/A. With a separator, A resets to its initial `A`
value; the identical case without a separator preserves `typed draft`. Removing
an earlier child presents the same identity problem. Descendant drafts and focus
can be lost.

**Recommendation:** retain the child identity from `Children.toArray` on each
wrapper. Add a stateful-child reorder/removal regression case.

## 2. P2 — An old RecordBrowser confirmation can close a new session

**Locations:** `src/patterns/record-browser.tsx:63–69` and `177–187`.

Confirming sets a local saving state and disables Cancel, but the outer Dialog
still accepts Escape. Closing unmounts the session while its confirmation promise
remains active. After reopening, the old promise can call the shared `onClose`
and dismiss the new session.

**Reproduction:** provide an `onConfirm` promise controlled by the test, select a
record, confirm, press Escape, reopen, then resolve the old promise. Cancel was
disabled during the request; dialog counts were `0` after Escape, `1` after
reopening, and `0` after the old promise resolved. The old operation still
committed.

**Recommendation:** apply pending-dismissal protection to every dismissal path
and guard completion callbacks by the owning session's lifetime. Test Escape and
close/reopen while a request is unresolved, including failure recovery.

## 3. P2 — DataTable filter options and counts become stale

**Location:** `src/patterns/data-table/filter.tsx:144–159`.

Facet values are memoized by column identity, kind, and locale. The column object
stays stable when rows or other filters change, so the memo keeps an old facet
result even when the table itself updates.

**Reproduction:** replace a sole row with status `Old status` by one with `New
status`. The table shows the replacement, but the Status picker still offers
only `Old status 1`; the new status cannot be selected. In the existing Register
story, searching `FND-2200` leaves one row while the Status filter continues to
show four old counts of six.

**Recommendation:** derive facets from the current faceted row-model result,
including its changing identity in memoization if needed. Cover data replacement,
initial asynchronous loading, and cross-filter count updates.

**Existing story:** [DataTable Register](http://localhost:6007/iframe.html?id=patterns-data-table--register-story&viewMode=story&embed=true).

## 4. P2 — Forced colors removes basic controls and selected-state indicators

**Representative locations:** `src/components/switch.tsx:19`,
`src/components/radio-group.tsx:44`, `src/styles/tabs.css:13`, and
`src/components/progress.tsx:69`.

The affected visuals depend on background fills or shadows, without a treatment
that survives forced colors.

**Reproduction:** run the existing Switch matrix, RadioGroup matrix, Tabs variants,
and Progress values/ranges stories with Chromium `forcedColors: "active"`.
Switch tracks and thumbs disappear; selected radios look unselected; both tab
variants lose their selected marker; progress bars disappear. Computed backgrounds
flatten to white and shadows become `none`. Screenshots confirm the visible loss.

**Recommendation:** preserve control geometry and state with system-color borders
or foreground marks. Add a forced-colors test configuration with visual/state
assertions; the existing light/dark projects do not exercise this environment.

This was browser emulation, not a native Windows high-contrast session.

## 5. P2 — Expanding a chart resets its visible-series selection

**Locations:** `src/patterns/chart/frame.tsx:235–237` and `513–519`.

Expand creates a second ChartFrame with fresh local state. It receives the same
data props but loses the reader's hidden-series selection and table-view state.

**Reproduction:** in Downloads, hide `Satisfied`, then Expand. The original
legend has `Satisfied` pressed false; the expanded legend has it pressed true,
and the green series reappears. The original plot's scale topped out around 16;
the expanded plot includes the restored series and reaches 60. The expanded
view therefore changes the information shown as well as the available space.

**Recommendation:** share the relevant view state with the expanded frame and
test expansion after changing legend visibility and table mode.

**Existing story:** [Chart Downloads](http://localhost:6007/iframe.html?id=patterns-chart-overview--downloads&viewMode=story&embed=true).

## 6. P2 — Treemap drill-down has no keyboard equivalent

**Locations:** `src/patterns/chart/treemap.tsx:222–244` and the optional Enter
handler in `src/patterns/chart/_shared.tsx:1122–1128`.

The treemap wires drill-down through pointer `onClick`, supplies no keyboard
selection handler, and its SVG is not a tab stop. The supplied Drilldown example
has four legend buttons, which change series visibility, but no control that
performs the drill-down and no table alternative.

**Reproduction:** inspect and tab through the Treemap Drilldown story. Its SVG has
neither `tabindex` nor an interactive role. Tab/ArrowRight/Enter leaves the
description at `Click a tile for its system`; clicking an Identity tile changes
it to `Components of Identity` and adds the breadcrumb. The meaningful action is
available only through the pointer in the shipped example.

The family documentation intentionally says tiles are not walked by the keyboard;
that design still needs an equivalent keyboard action. A static data table alone
would not invoke drill-down or expose the detail actions.

**Recommendation:** provide a keyboard-accessible drill/detail action in the
chart interaction or its equivalent table/control composition, and test that it
produces the same result as clicking a tile. Runtime confirmation here is scoped
to Treemap.

**Existing story:** [Treemap Drilldown](http://localhost:6007/iframe.html?id=patterns-chart-treemap--drilldown&viewMode=story&embed=true).

## 7. P2 — A phone-width reload overwrites remembered desktop widths

**Locations:** `src/layout/shell/root.tsx:92–104` and
`src/layout/shell/splitter.tsx:13–14`.

Restoring remembered widths clamps them to half the current viewport and then
writes the clamped values back to storage. At phone widths that upper bound can
be below the documented minimum. The state is not restored when the viewport
widens again.

**Reproduction:** seed the isolated Remembered story key with navigation width
320 and panel width 480. Load at 390px. Both saved widths become 195. Widen to
1440px: navigation remains 195px, and storage still records 195 for both regions.
The reader's desktop preferences have been overwritten; the stored panel width
is now below its 240px minimum.

**Recommendation:** separate remembered desktop preferences from temporary
viewport-constrained dimensions. Apply valid bounds when the corresponding
desktop region becomes active; do not persist a phone layout as a desktop resize.

**Existing story:** [Shell Remembered](http://localhost:6007/iframe.html?id=layout-shell--remembered&viewMode=story&embed=true).

## 8. P2 — CommandDialog clips its footer on short viewports

**Location:** `src/components/command.tsx:203`.

CommandDialog positions itself 80px below the viewport top but retains the
generic Dialog maximum height of viewport minus 32px. The resulting lower edge
can fall below the visible viewport.

**Reproduction:** render 30 ordinary commands and the documented Close footer at
844×390. The dialog begins at y80, has height 358, and ends at y438. The Close
control occupies y416–430. Body/dialog overflow is hidden, so touch users cannot
reach the footer dismissal control.

**Recommendation:** constrain height using the actual top and bottom insets, or
adapt placement at short heights. Test both portrait and landscape geometry with
enough items to fill the list.

## 9. P2 — Calendar breaks the native navigation-around layout

**Locations:** `src/components/calendar.tsx:76` and `130`.

For `navLayout="around"`, DayPicker renders the previous button, caption, and
next button as siblings. Ledger forces their month container into a vertical
column, so those elements stack rather than flank the caption. In RTL, DayPicker
also supplies reversed chevron orientation for this layout, and Ledger rotates
the resulting icon a second time.

**Reproduction:** render the default RTL calendar beside `around` RTL and
`around` LTR calendars. Both `around` examples stack the buttons above and below
the caption; the RTL example's icons point in the wrong directions. The default
RTL layout remains correct.

**Recommendation:** style the supported native layout explicitly and avoid
reversing an orientation already resolved by DayPicker. Cover both directions.

## 10. P2 — Switch's dark thumb depends on an optional stylesheet

**Location:** `src/components/switch.tsx:30`.

The unchecked thumb uses CSS `light-dark()`. Ledger's tokens change with
`data-color-mode`, while the document's `color-scheme` comes from `base.css`,
which Getting started documents as optional. These two mode signals can disagree
in a supported consumer setup.

**Reproduction:** pin dark Ledger tokens with the browser's default light color
scheme, matching a consumer that omits `base.css`. The unchecked thumb takes the
dark surface token and has 1.20:1 contrast against the track. With the intended
dark color scheme, its light thumb has 13.00:1 contrast. Paired screenshots confirm
the difference. This finding is conditional on that CSS integration.

**Recommendation:** use a mode-aware thumb token so component styling follows
Ledger's token mode independently of optional document defaults.

## Original audit evidence

Focused browser tests used the running local Storybook, suppressing story play
functions where necessary to inspect the real initial state. Scenarios missing
from the catalog used temporary browser-only fixtures importing the same package.
No production files or committed stories were edited during that audit-only pass.
The resolution table above describes the subsequent implementation work.

Screenshots and reproduction scripts are retained locally in the ignored
`artifacts/design-system-audit-2026-09-18/deep/` directory. The first audit records
the passing package/application checks and their limits. This pass adds browser
evidence for the failures above; it does not claim exhaustive screen-reader,
cross-browser, or native input-method coverage.

The maintained stories now cover the failing sequences, including actual Tab
entry, rejected edits, pending-session replacement, keyboard chart actions and
viewport transitions. Final integration results are recorded in the
[first audit's resolution validation](design-system-audit-2026-09-18.md#resolution-validation).

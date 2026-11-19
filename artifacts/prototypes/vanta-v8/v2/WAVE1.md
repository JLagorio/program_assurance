# Wave 1 reports (the lead adds each as it arrives)

## L1 (finished): Home, work and program pages
Build: `out/v2-L1.html`. 46 notes in `L1/notes.json`; v1/v2 screenshot pairs in `L1/pairs/`.
- home: Create program is the primary beside View my work; one grey callout; one card a program (%, green bar, N of M); Other programs a plain list.
- overview: one completion card (the control-status strip is its one bar and the page's one chart), Open work, three link rows (SSP with Version history, Assessments, Setup); one Details rail with the facts and the Team; one status in the title. Cut: mini tiles, description, Lifecycle label, facts row, lanes, activity.
- my-work: the squeezed row fixed; rows as hairline lists, Jira keys grey meta, one state word a row. Each row keeps its link.
- review-queue: one table with a Kind column and a Kind filter; nothing ticked on open.
- Settings: new module `mod-zzzz-v2-5work.js`/`.css` adds a left list of sections (Workspace / My account) and hides the area tab strip with `:has()`; all six pages are setting cards, lists and rules; On/Off the only pills; switches and radios ink; deadline counts cut from Settings.
- portfolio: no subtitle, no rings; Next gate one date, a red mark only once passed.
- baseline: one strip for the page; counts and switches ink; the banner and the what-if are lines under the title (V's layer would drop a register banner, which held the what-if's only Back to saved).
- program-new: third column cut; step references now step 3 and step 4; the wizard's bar title pinned at 16px.
- Checks: L1's sweep 34 routes at 1440 and 390, no page errors, no sideways scroll, 43 interaction checks; probe-v9 passes; flows7 step 4 needed the Compliance group opened first (V folds groups, intended; the lead updated flows7); flows8 "STIG checklists" fails only with V's layer (V is looking).
- Found in V's layer: the constant-column rule cut View from the permissions matrix (V told).

## L2 (finished): tests, controls, documents and editors
Build: `out/v2-L2.html`. 45 notes in `L2/notes.json`; screenshot pairs in `L2/v1/` and `L2/v2/`. Edited in place: mod-after-tests, mod-after-docs, mod-after-risk, mod-v8-boundary, mod-v8-dod, mod-ssp-editor (.js and .css).
- campaign: Team column cut; one status a request (Ready / Flagged / Accepted), determination plain text; due dates toned only when overdue; the tracker and the chips both count 368; a request's page has one status pill and six facts. The campaign's quick views are now All / Ready / Flagged / Accepted.
- controls: donut and mini tiles cut; one card plus five quick views, one of them No owner 560; Next step without glyphs.
- control-si2: Where it stands and Next step moved into a Details rail on the first tab; one primary; the red CVE callout gone; seven tabs (History and Comments merged into Activity).
- checks: overdue said once (the pill); the row's eye moved into its ⋯ menu.
- policies: control status a glyph and a word; one toolbar line; the banner became the No approver quick view, its action in ⋯.
- ppsm: Not required and Not applicable grey words; the table fits at 1440.
- STIG records: one chip row; CAT a filter; the Status column drops when the list is filtered to one status; banners became lines under the title.
- ssp editor: each live table's bar one grey line; Contents marks only sections that need action; counts and header meta grey; neutral avatars; control statuses words, not pills.
- suppliers: the page's own tabs gone; Found in SBOMs a quick view.
- Rows start unticked on campaign, controls and checks (in the page itself).
- Not done: A15's menu move and A16's per-section guidance (outside the brief); the check-* record pages untouched.
- Checks: 149 routes at 1440 and 390, no page errors, no sideways scroll; 26 interaction checks; flows7 15/15; probe-v9 39/39; flows8 24/25 ("STIG checklists": V's layer removes that register's banner, which held its only "CAT I" text).
- Found in V's layer: row ⋯ menus cut as constant columns (Checks marked `v2-keepcols`); the quick-view fold counts hidden `.ak-co` markers; folded tabs wrap onto several lines at 390.

## V (finished): the visual layer
Build: `out/v2-V.html`. 226 notes in `V/notes.json`; status map in `V/status-map.json` (241 words, 74 change tone).
- New `mod-zzzz-v2-9clean.js`/`.css`: wraps every S, P and M function, and again at PA.start so later modules are covered; `PA.v2clean(html, route)`, `.stats`, `.off`, `.snap(on)`, `.typeOf`. A table with `.v2-keepcols` or `data-v2-keep` keeps all its columns; matrices, heatmaps, number grids and columns of menus, buttons, icons or checkboxes are never cut.
- core.js: `pill()` takes its tone from the word; `who(null)` prints "—". core.css: grey glyphs for neutral pills, grey EXAMPLE tag, rail and switcher ink on grey, no menu icons, no section label; tables inherit 14px. mod-v9-navlab.js: every menu group folded but the current page's.
- A register drops a banner only when a quick view or tab carries the same count; otherwise one grey line under the title. Tabs stay on one line (they scroll below 1100px). Page titles 22px.
- v1 → v2: tinted banners 95→0, blue avatars 1,142→0, routes with rows of more than 2 coloured cells 73→12, tables overflowing at 1440 56→1, type pairs 62→26; ≤5 ms a screen.
- Left: 12 routes still colour more than 2 cells in some rows (glyphs and coloured text the class rule cannot see); Inventory's category list shows 9 chips at 390; the SSP editor's tabs wrap at 1440 with or without the layer.
- Checks: 0 page errors; flows7 15/15, flows8 25/25, probe-v9 39/39.

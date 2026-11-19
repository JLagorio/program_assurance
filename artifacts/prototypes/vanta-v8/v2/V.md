# Agent V: the visual layer (cleanup pass, step 1)

Read `SP/vanta/v2/COMMON.md` first. You are V; your folder is `SP/vanta/v2/V/`, your build `out/v2-V.html`.

## Your files (only these)
- New: `SP/vanta/proto/mod-zzzz-v2-9clean.js` and `.css`. It loads last of all modules: wrap every existing `S`, `P` and `M` function so its output passes through one cleanup function, and expose that function as `PA.v2clean(html, route)` for screens other agents create later (they call it at draw time).
- Existing, edit in place with Edit: `core.js` (the helpers only: `pill`, `who`, `tag`, `header`, `table`, `completion`, `attention`, `views`, `tools`), `core.css`, `mod-v9-navlab.js`, `mod-v9-navlab.css`.
- Not yours: every other module. Agent L is rebuilding the heaviest pages in place (campaign, overview, controls, policies, checks, portfolio, baseline, ppsm, the STIG record, the SSP editor, home, my-work, review-queue, settings, control-si2, suppliers, integrations); agent C1 is wiring the workflow in new modules. Your layer runs over all of their output, so make every rule generic, idempotent and safe on markup you have not seen.

## How
Parse the HTML in a `<template>`, apply DOM rules, serialize. Keep it under about 30 ms a screen. Never change links, `href`, `data-*` attributes, ids, `aria-*` or button text other than what a rule targets. Leave out the meta pages (`before-after*`, `nav-options`, `study`) entirely; leave the SSP editor's own markers (`ssp*` routes) to L except for the global rules (status map, EXAMPLE, avatars, empty values). Count what each rule changed per route (`PA.v2clean.stats[route]`) so the notes can say it.

## Rules (finding ids in brackets; the findings files give the screens and examples)
1. One status map [N02, N06]. Inventory every pill word in v1 (all routes, previews, dialogs) and give each word one tone everywhere: green for done or satisfied, red for failed, late or critical/high, amber for partial, moderate or due soon, grey for every neutral or waiting state (Not assessed, No evidence, Draft, In progress, In review, Pending review, Planned, Ready, Active as a progress state, Not required, Not applicable, Not set up, Proposed…). Blue is never a status. The pill's glyph follows its tone. Save the map as `SP/vanta/v2/V/status-map.json` and apply it in `pill()` and in the wrapper (pills drawn by hand in modules).
2. Empty values print a subtle "—" [N03, A5]: a dashed-ring glyph plus None, Not recorded, No owner, Unassigned, Not set, Not requested (and the like) in a table cell or a facts value. Keep the dashed ring only as a "not started" status. `who(null)` prints "—".
3. Banners [N01, A4]: restyle every tinted banner as a grey callout whose glyph alone carries the tone; on a register (see the noise metrics' page types) remove it; elsewhere keep at most one a page.
4. EXAMPLE tags [N06]: a grey outlined tag, never amber; inside a column header, a small grey mark.
5. No pre-ticked rows [A2, B8]: every register opens with nothing selected and its filter row showing; the selection bar appears only after the reader ticks a row (make sure ticking still shows it).
6. No count line under a register's title [A3]: drop the facts line on registers; counts stay on tabs, chips and quick views. Records keep their facts.
7. Columns that read the same in every row are cut [A5, N04] (tables of 4 or more rows; never the first column, a checkbox or an actions column). Tables must fit their frame at 1440 (A5 lists the ones that overflow).
8. At most two toned cells a row [N05]: the status and one date or severity keep their tone; other coloured text, dates and pills in that row go ink.
9. No gadgets in rows [N08]: a progress bar, ring or stacked bar in a table row or list row where the number sits beside it is removed (the number stays).
10. Toolbars [N13]: at most 5 quick views and 4 filters plus "+ Add filter" on one line; the rest fold into a More chip.
11. Tabs [N12, N18]: at most 7 tabs in a strip (the rest under More), never two stacked strips on a record (drop the section's strip there), and no section label at the start of a section's tab strip.
12. Avatars neutral [N17]: initials on grey, so blue is left for links and selection.
13. Changes in ink [N07]: added/removed counts, switches and plain sentences are ink; red only for late and failed, green only for satisfied and done.
14. Panel [A18, first half]: the preview's action is a secondary button, never an ink primary; at most one primary per preview [N15].
15. Navigation chrome [A8, A9] in mod-v9-navlab: the rail's current item ink on grey like the menu's; the program switcher a neutral bordered button; the program menu's children text without icons; every group folded but the current one (a reader can still open any).
16. Type scale [N10]: one body size (14px), one secondary size (12px), no half-pixel sizes; a page title, a section title and a card title, each one size and weight. Override inline font sizes where modules set them.
17. Integrations [A21]: drop the repeated "IN THE APP" tag on connector cards.

## Done means
- Rules applied over the whole v2-V build; check visually at 1440 and 390 on: controls, policies, checks, risks, poam, traceability, suppliers, requirements, inventory, evidence, findings, people, schedule, overview, portfolio, threats, stigs, ppsm, itcsc, home, my-work, and a risk and a control preview.
- `notes.json` per COMMON.md, one entry per rule per route it changed, with counts where useful ("Empty values print —: 34 dashed rings gone").
- Checks per COMMON.md. Expect some flows steps to depend on pre-ticked rows or exact counts; say which.

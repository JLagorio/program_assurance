# Pass 3: five changes from Josef (21 Nov, after he saw version 21)

His words:

> The Evidence page reads as two strips of tabs. - those tabs to show different kinds of evidence should just be filters
> applied and we should have a "saved view" drop down select for saved views, ability to manage saved views, delete and
> create saved views. all datatables should have one consistent single row toolbar. no extra tabs or nonsense for filters of
> saved views or actions. make that bitchin please.
>
> v3 isnt using the full page theres a lot of space on the right side. also table cells should rarely have multiple rows of
> text/data within a cell. I prefer compact rows for most things
>
> also all previews should show their related / associated data you see on the details page in just a different format.

(The SSP editor and the workbook taking the whole window is what he wants. The Controls list remembering its filters is fine.)

The lead has changed the shared layer. Your pages already draw with it. Your job: make your lane right on top of it, make
the pass 3 check print 0 problems for your lane, and make your walk pass on the whole build.

## What the shared layer does now (`mod-zzzz-v3-1kit.js/.css`, do not edit)

**1. Full width.** A V3 page takes the window's width (no 1280px cap).

**2. One row over a table.** `K.toolbar` draws: search · the view · every filter · Clear · then, at the row's end, what you
pass as `right` followed by the page's actions.
- `K.toolbar({ id, noun, search, filters, right, views })`. `id` names the list: its saved views are kept under it, so every
  address of one list gives the same id ("findings" for all nine kinds). `noun` is what it lists, plural ("requirements").
  With no `id`, the first toolbar with a search on a page that is not a record takes its route as id; a small table that
  should have no views passes `views: false`.
- `K.rail(...)` no longer draws tabs: it is one filter in that row (a select, first item = "all"). Give it `label` ("Kind",
  "Source", "Family": one or two words; the default is "Kind") and, if you like, `key`.
- `K.chips(list, act, label)` no longer draws a strip: it is one filter in that row too, and its items are the list's
  built-in views (with their counts). `label` is the filter's name: make it one or two words ("State", "Lacks", "Review").
  `K.chips(..., { preset: false })` keeps its items out of the views; `{ strip: true }` draws the old strip (only for what
  is not a filter).
- Rail and chips fold into the `K.toolbar` drawn after them on the page, in the order rail, chips, your `filters`. One with
  no toolbar after it stands alone as a row (the check reports it): give that table a toolbar.
- On a list page `K.page` moves the header's actions (`K.head({ actions })`) to the end of the first toolbar. Record pages
  (`--` in the address) keep theirs in the header. A switch between ways to see one list (List / Boundary) goes in `right`.
- A classic filter still is `{ label, key, value, act, options: [[value, label, count]] }`; it shows "Label: Value" when set.
- **Saved views** come from the kit: a menu button beside the search (`details.k3-vmenu > summary.k3-vbtn`) lists "All
  <noun>", the built-in views, the reader's saved views, then Save as new view…, Save changes to “X”, Back to “X”, Manage
  views… (rename, who sees it, delete). A view is the row's whole question: `{ q, <filter key>: value }`. The kit applies
  one by calling your own actions: every filter's `act` with the value ("" or your "all" id to clear) and the search's
  `act` with the text, as `fn(value, null, null)`. So each of those actions must work with no element and no event, and
  every part of a list's question must be a control in its toolbar.
  `views: { total, all: "All requirements", presets: [{ label, state, count }], seed: [{ name, state, by }], count(state) }`
  is optional: `presets` replace the chips as built-in views; `seed` are saved views the list starts with (give each real
  list one that a system security engineer would keep, so the menu shows the feature); `count(state)` counts a saved view.

**3. Compact rows.** Every `K.table` cell is one line, 40px, cut with an ellipsis. The first column (or the one with
`cls: "main"`) takes the room the others leave. `K.name(title, desc, code)` is one line: code, title, then the description
in grey, cut. `cls: "tight"`, `"end"`, `"nw"` as before. Only where the text is the content (an implementation statement)
may a column say `cls: "wrap"` or a table `cls: "k3-wrap"`; "rarely" is Josef's word.

**4. Previews list what the page lists.** While a preview is drawn, `K.table` and `K.related` draw themselves as a short
list: the first five rows, the name plus the columns marked `peek: true` in `cols` (else the first column holding a status
pill), no header, then "View all N" to `all: { go }` (default: the record's page). `keep: true` draws the whole table.

## What you do in your lane (your module, its CSS, your walk, your notes; nothing else)

1. **Toolbars.** Every list: one row at 1728 and at 1440. Give `id` and `noun`. Name each folded filter in a word or two
   and put the filters in the order a person narrows by. Drop a filter nobody needs rather than wrap the row. Anything of
   yours that still filters, picks a kind or holds an action outside the row (own tabs, pills, a second row, buttons in a
   section head above a register) moves into it. Seed one saved view per real list.
2. **Rows.** Go through every table you draw, on lists, record pages and previews. The kit already cuts each cell to a
   line; make sure nothing a person needs was cut away: give a second line its own column or drop it, write a list of things
   as the first and "+N", keep a status to its pill, no `<br>`, no stacked spans, no CSS of yours that sets a row's height
   or wraps a cell. Numbers over prose. Fewer, better columns beat a cut-off sentence.
3. **Previews.** Every row that goes to a record's page has an eye (documents and assessments too: a `K.panel` kind for
   each, `peek: { panel, id }` on the row). Every preview shows what its page lists: for each tab or section of the page, a
   `K.related` with the same rows (mark the one or two `peek` columns; `all: { go: <the tab's address> }`), after the facts.
   No table wider than the panel.
4. **Look.** After your changes, take screenshots with `node SP/vanta/v3r/p3/shots.mjs <build> <outdir> <route> …`
   (`route!views` opens the views menu, `route!eye` the first preview; `W=1440` or `W=390 H=844` in the environment) and
   look at no more than eight of them. Fix what reads badly. This is the pass where it has to look finished.
5. **Walk.** Your `walk.mjs` fails on the new row (it clicked tabs and chips that are now selects, and header buttons that
   moved). Adapt it: a folded filter is `select[data-k3-fkey="<key>"]` (choose by option text, then dispatch `input`), a
   classic one `select[data-k3-input="<act>"]`, the list's actions are in `.k3-tb .k3-tools-r`. Add steps for: one row; a
   view saved, left and picked again gives the same rows; an eye whose preview lists the page's sections.

## Rules that still hold

MODEL.md's ten rules and PASS2.md (a row goes to the record's page, the eye opens its preview; no vertical tabs; one
sidebar). V3 off must stay equal to v2. Do not edit the kit, the shell, the core, another lane's files or anything of v2:
ask the lead in your hand-back, one line each. Other lanes are editing their own modules while you work: if the build
breaks on a file that is not yours, wait a minute and build again. No network. Never read or copy from a Vanta screenshot.

## Build, check, hand back

- Build everything: `cd SP/vanta/proto && python3 -I build.py v3r3-<L>` → `out/v3r3-<L>.html` (SP is in CONTEXT.md).
- `node SP/vanta/v3r/p3/check.mjs out/v3r3-<L>.html <L>` → problems 0 for your lane (it prints the rule each problem breaks).
- `node SP/vanta/v3r/p3/views.mjs out/v3r3-<L>.html <route>` → 0 failed on each of your lists.
- `node SP/vanta/v3/offcheck.mjs out/v3r3-<L>.html` → differences 0.
- `node SP/vanta/v3r/<L>/walk.mjs out/v3r3-<L>.html` passes at 1440 and at 390 (see your walk's head for how it takes 390).
  Confirm the first line it prints names the build you gave it.
- Append to `v3r/<L>/notes.json` → `open`: what you could not do. Hand back in under 200 words: what changed for each of
  toolbars, rows and previews; the checks' numbers; asks to the lead.

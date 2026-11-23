# Lane K: the Drata kit and the components gallery

Read `COMMON.md` and `RECS.md` in this folder first. You write `SP/vanta/proto/mod-zzzz-v4-0drk.js` and `.css` (prefix `drk-`) and your folder `v4dr/K/`.

## Order of work

1. **Stubs first (within 10 minutes).** Every function in COMMON's "The Drata kit" section, returning plain but valid markup, exported as `window.PA.drk`. Lanes A and B are building on top of you right now: their builds call these functions. Build once, then run `node --check`. Never rename a function or change an argument: the API is fixed. You may add optional arguments, and you document them in the file's header comment.
2. **Routes.** `D.route` and `D.routeLike` must work like V3's own pages.
   - Study `mod-zzzz-v3-0core.js`: `lazyRoute`, `redirect`, `set`, `screen`.
   - Study `mod-zzzz-v3-1kit.js`: `K.page`, `K.recRoute`, `K.panel`, how a page registers.
   - A `dr-` route opened with V3 off switches V3 on with WS-X90 (`PA.v2hubs.setCur("PRG-1090")` if needed, as `mod-zzzz-v3-9ba.js`'s `see()` does), then draws.
   - The `nav` key highlights the program menu entry.
   - Every after page should sit in the V3 shell with the program sidebar, like a V3 page.
3. **Styling.** Make every component finished, in the V3 kit's look ("Ledger, pushed toward Vanta"), calmer than Drata. Use the V3 kit's CSS variables and type scale. Read `mod-zzzz-v3-1kit.css` for its tokens and reuse them.
   - **Tones:**
     - ok is the satisfied green;
     - bad is the problem red (pale fill, dark text);
     - warn is amber;
     - none is neutral grey;
     - inh is inherited, the hue V3 already uses for inherited (find it).
   - **The pieces worth care:**
     - **`D.idChip`:** monospace, round, about 22px.
     - **`D.stages`:** a slim bar with the tooltip, then four equal cards in one row (two columns at 390), each with a title, a state word after a tinted glyph, and a legend of swatch, label and right-aligned count, or an empty line with an outlined small action.
     - **`D.selbar`:** floating at the foot of the viewport, centred, with a shadow; reads "N selected · Select all M", with verbs as text buttons and Clear.
     - **`D.facets`:** a card about 280px wide, groups that collapse, each group's applied count; `D.withFacets` lays it beside the table, and the toolbar toggle opens and closes it.
     - **`D.drawer`:** a header row with "2 of 10", Previous ↑ and Next ↓, ✕; then the status, title, Open, facts and body. It must sit inside the V3 preview panel (`K.panel` and `#panel`); decide how and document it. Lanes need a way to give the order of the list the drawer walks, so add `D.walkable(kind, ids)` or similar and document it.
     - **`D.dock`:** a 40px rail of icon buttons at the right edge of the page, the chosen one marked. Its pane docks at about 380px and the main column narrows, with no overlay. Keep the open pane in `K.set`.
     - **`D.card`:** Edit swaps facts for inputs, then Save (small, solid) and Cancel; save calls `save(values)` and redraws.
     - **`D.sunken`:** a grey well behind white bordered cards with radius about 10px.
     - **`D.steps`:** a back link, the title, a vertical stepper on the left (done is a filled circle with a check, current a ring, later grey), a form column about 880px wide, and a footer with Back on the left and the primary on the right.
     - **`D.moving`:** a short table of rows with counts, locked rows ticked and disabled, then "Moving N · Not moving M", and one consequence line.
     - **`D.sheet`:** a compact grid where red cells are errors with their message on hover and amber cells are warnings, plus a segmented "All N | Valid N | Invalid N" control.
     - **`D.openCompare`:** opens a `K.dialog` with three columns (Current, Template, Selections). Differences are tinted (current pale red, template pale green). Each changed field has a select, Apply or Reject, plus "Apply all", then Cancel and Confirm selections.
     - **`D.suggest`:** a card with a confidence chip (High, Medium, Low in words), title, one rationale line, "From <source>" in grey, and actions.
     - **`D.proposal`:** a bordered card with one bold line naming the change, a collapsed "Why" line, then Approve (solid) and Decline (outlined).
     - **`D.numbers`:** three equal tiles, each with a label, a metric name, a big figure in the tone, a "since" line, and links.
     - **`D.worth`:** a row of count links ("46 objectives · 12 controls · 3 components").
     - **`D.stats`:** four equal tiles, each a label over a 32px ink figure. A problem tile leads its figure with a warning glyph; nothing else is coloured.
     - **`D.head`:** the trail, the id chip before a 26px title, actions at the right in the order ⋯, secondary, primary; the facts strip of label-over-value pairs, with a pencil where editable; then the tabs.
     - **`D.review`:** one slim neutral line above the header: "After · <title>", then "See current" and "Back to the Drata tab", both as links. It sits outside the page's primary hierarchy, and it is not a banner.
4. **The gallery, route `dr-components`** (with `nav` on About's Before & after).
   - One section per component: its name, the recommendation numbers, what it is (one line), where the after screens use it (from your knowledge of the lanes: the controls register, the control record, the evidence register, the source record, the check record, the finding record, the import), the Ledger part it would become (from `docs/products/drata/style.md` section 3; one line in Ledger's terms), and a live demo from `D.demo(id)` on WS-X90-like data (real control codes such as AC-2 and SI-2).
   - Fill `D.COMPONENTS` with `{ id, name, rec, what, ledger, where }`.
   - The lead's Drata tab will embed `D.demo(id)` too, so each demo must stand alone inside any container about 560px wide.
5. **Your notes.** `v4dr/K/notes.json` takes one pair, `{ "id": "k-components", "title": "New components", "group": "ui", "new": true, "after": { "route": "dr-components" }, "changes": [ one per component, rec as in RECS ] }`, and `components` as in COMMON. Cover recommendations 2, 3, 19–28 there, and 5, 10, 11, 12 as components.

## Checks

- COMMON's checks, with your walk opening `dr-components`.
- In each demo: the selection bar's Clear, the drawer's Previous and Next, a dock pane opening and closing, a card's Edit, Save and Cancel, the facet toggle, the compare dialog's Confirm, and the sheet's All, Valid and Invalid each do something.
- At 390 nothing overflows: the stepper stacks above the form, the facets collapse, and the dock becomes a bottom row of icons.

Hand back as COMMON says. Add the API changes you made (optional arguments) in one line each, so the lead can pass them to the other lanes.

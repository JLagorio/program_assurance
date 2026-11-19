# Agents L1 and L2: the budget on the heaviest pages (step 2)

Read `SP/vanta/v2/COMMON.md` first. You are L1 or L2 (your prompt says which); your folder is `SP/vanta/v2/L1/` or `SP/vanta/v2/L2/`, your build `out/v2-L1.html` or `out/v2-L2.html`.

Agent V is writing a visual layer (`mod-zzzz-v2-9clean.js`) that runs over every screen after yours: one tone per status word, "—" for empty values, grey banners and EXAMPLE tags, no pre-ticked rows, no count line under register titles, constant columns cut, at most two toned cells a row, no gadgets in rows, at most 5 quick views and 4 filters, at most 7 tabs, neutral avatars, panel actions as secondaries, the type scale. Do not duplicate those rules; your job is structure: what a page holds, in what order, and how many blocks. Where a page needs one of V's rules done differently, do it in the page itself and say so in your notes. The workflow behaviour (dialogs that change state, filtered links, ↗) is the next wave's: keep every existing link target, `data-go`, `data-modal`, `data-panel` and id so that work can build on them.

For each page: apply its budget type (COMMON.md), the findings named, and the noise ranking's "cut" list (`ranking_top10` in `SP/vanta/gap/noise/findings.json`). Compare with Vanta's shape where the distance findings name it (`vanta_does`, and the image paths in `vanta`). Look at the v1 screenshot first, then yours at 1440 and 390.

## L1: Home, work and program pages
Your files (Edit in place): `mod-after-work.js`/`.css` (home, my-work, review-queue, notifications), `mod-v7-org.js`/`.css` (portfolio, deadlines, event-log, enclaves, common-controls), `mod-v8-platform.js`/`.css` (permissions only), `mod-v7-program.js`/`.css` (overview, baseline), `mod-program-new.js`/`.css` (the wizard); new `mod-zzzz-v2-5work.js`/`.css` if you need a module of your own.
- **overview** [A1, N11; ranking 2]: one completion card (one green bar, N of M) and Open work above the fold; the title with one status (drop the Lifecycle label and the description sentence); Team and Details to a Details rail; the SSP, setup and assessments cards become links; no mini tiles (Controls owns them); keep the control-status strip as the one chart.
- **home** [home budget, B16]: one card a program (%, green bar, N of M); at most one grey callout; no pills; Create program in the header beside View my work.
- **my-work** [A12, A13, N16; inbox budget]: fix the squeezed second Urgent row (the sentence takes the row's width at 1440); restyle every row as one hairline list: icon, title, grey meta, avatar; Jira keys plain grey text; one state word; keep each row's link.
- **review-queue** [A11]: one table with a Kind column and a Kind filter (or sentence rows grouped by kind), instead of seven stacked tables; nothing pre-ticked.
- **Settings** [A7; settings budget]: today Settings opens on Deadlines drawn as a register under an area tab strip. Rebuild the Settings area (deadlines, notifications, event-log, enclaves, common-controls, permissions) as a left list of sections with plain setting cards, lists and rules, the way Vanta's settings read; On/Off are the only pills; no charts; deadline counts stay on Findings. The area tab strip is inserted by the core router; hide it on these pages from your own CSS (mark your page root, use `:has()`), do not edit `core.js`. Mission Computer's 12 tabs in two strips [N12] is not yours.
- **portfolio** (Programs) [A14, N08; ranking 6]: no subtitle; no ring in each row (the % is beside it); Next gate one plain date with a glyph only when late; no flag icons.
- **baseline** [N07, N08; ranking 7]: one strip for the page instead of a four-colour stack on each of 18 family cards; added/removed counts and Apply switches in ink; the banner becomes one line in the header.
- **program-new** [A17, B15]: cut the third column ("What you're creating"); the Review step carries the summary; fix the two step references (categorization is step 3, the baseline step 4).

## L2: Tests, controls, documents and editors
Your files (Edit in place): `mod-after-tests.js`/`.css` (controls, checks, control-si2, campaign; frameworks and assessments only if a change there follows from yours), `mod-after-docs.js`/`.css` (policies), `mod-v8-boundary.js`/`.css` (ppsm), `mod-v8-dod.js`/`.css` (the STIG checklist record), `mod-ssp-editor.js`/`.css` (the SSP editor), `mod-after-risk.js`/`.css` (suppliers only); new `mod-zzzz-v2-6tests.js`/`.css` if you need a module of your own.
- **campaign** [ranking 1, A15 second half]: cut the Team column (every row "Ready"); one status a row instead of Assessor and Determination as two pills; due dates amber only when overdue; the request tracker and the table's chips count the same set (today 368 against All 14). Moving the campaign's pages into the menu (A15 first half) is not yours.
- **controls** [N09, N04; ranking 3]: no Assignment donut while one segment holds everything (say No owner 560 as a quick view or a Needs attention row); no mini tiles; no glyphs in Next step (the pill says it); at most two summary cards.
- **control-si2** [A6, N15, N04]: nothing between the facts and the tabs: Where it stands and Next step move under the tabs (the first tab or a Details rail); one primary on the page; Next step's button is a secondary; drop the red callout's copy inside the card.
- **checks** [N04, N05; ranking 5]: one mark for overdue (the pill or the date, not pill + date + flag + red count); no eye icon in every row; the category rail's red counts stay.
- **policies** [ranking 4, N13]: Control status as a glyph and an ink word, not a pill; one toolbar line (at most 5 quick views and 4 filters).
- **ppsm** [ranking 8] and the **STIG record** (`stigs-mission-computer-rhel9`) [ranking 9]: one quick-view row (CAT becomes a filter); no Open pill in a list already filtered to Open; the blue banner becomes a line in the header.
- **ssp** editor [A16, N14; editor budget; ranking 10]: one line in each section header instead of the Live · synced · Open record · History · Detach bar on every record table; Contents marks only the sections that need action (no ring and sync icon on every section); counts grey; collaborator avatars without coloured rings; one primary.
- **suppliers** [A20]: drop the page's own tabs where the Library area strip already splits it, so there are at most three rows above the table.

## Done means
- Every page in your list meets its budget at 1440 and at 390, checked by screenshot against v1 (save pairs in your folder).
- `notes.json` per COMMON.md, one entry per change per screen.
- Checks per COMMON.md.

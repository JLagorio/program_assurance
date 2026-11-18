# New screens for the prototype: shared rules

Program Assurance is an RMF/GRC app for assessing and authorizing weapon systems. Josef, its founder, reviews a clickable prototype: one HTML page built from modules, in "Ledger, pushed toward Vanta". He has seen the "after" screens on its Before & after page (each screen redrawn closer to Vanta) and says it looks much better. Now he wants two things the prototype lacks:

1. **The SSP as a live document**: a Google Docs-like editor for the System Security Plan, with sections backed by WS-X90's records (implementation narratives, inventory, roles, boundary and architecture diagrams) and custom sections beside them. Many people edit at once and see each other. Versions are kept gracefully, with every edit preserved. Comments. AI helps where it is invaluable: drafting narratives, checking the SSP against the records, summarizing changes.
2. **Program creation**: a flow he can walk through, step by step, to create a program.

These are **new screens**, drawn in the after style. Three builders work in parallel, each on its own module.

PROTO = `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto`
VANTA = `/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/examples/products/vanta/images`

## Read first (in this order, and nothing else at length)

1. `PROTO/BRIEF.md`: the prototype's API (`window.PA`: S, P, M, ROUTE_NAV, h helpers, data) and its look.
2. `PROTO/mod-after-0kit.js` and `.css`: **the after kit**, `window.PA.AK`. Use its pieces and never redraw your own versions: record header, chips, tabs with counts, owner chip, due date, comments and composer, activity, approval steps, pending version, review comment, reminder, bulk bar, task row, banner, request states, empty state, wizard steps (`AK.steps`) and toast.
3. `PROTO/mod-a-ssp-data.js`, **header comment only**. It is about 450 KB, so never print the whole file. It defines `window.PA.SSP`, WS-X90's real SSP, and shared helpers. Look inside with `cd PROTO && node ssp-peek.js` (one line per key) or `node ssp-peek.js AC-2 SA-24` (whole controls). It also defines:
   - `PA.fullWindow(prefix)`;
   - `PA.SSP.ui` (avatar in a person's colour, moments, word redline, toast);
   - `PA.SSP.now()`, `PA.SSP.session` and `PA.SSP.log(...)`, the session's own edits.
4. `PROTO/mod-a-ssp-data.css`: the full-window rules and the **shared document classes** `sd-*`. Use them for any document page: desk, page, title, h1–h3, numbers, paragraphs, placeholder text, tables, live-data block, insert and delete marks, AI marks, comment anchors, remote cursor and selection, avatar, figure, caption, toasts. The editor and the version history must look like the same document.
5. Two finished after screens for the look. Look at the images; skip their source:
   - `PROTO/out/ba/policy-record-after.png`
   - `PROTO/out/ba/getting-started-after.png`

Never read `mod-system.js`, `mod-risk.js`, `mod-compliance.js`, `mod-platform.js` or `mod-zz-compare-data.js` whole; they are huge. Grep them if you must.

## Write

- Only your own files, named in your brief.
- Prefix your CSS classes with your module's short prefix, and keep the shared `sd-` classes as they are. Never edit core, the kit, the data module or another builder's files.
- Routes use ASCII letters, digits and hyphens. The hash may only be a plain `#name`.

## Data: real first, examples marked

- `PA.SSP` is WS-X90's real document: 560 controls with their narratives, implementation and control statuses, revisions and the six controls changed since the published revision 2, the system tree, roles, requirements and evidence.
- Its people, presence, comments, suggestions, versions inside revision 3, interconnections and PPSM rows are examples (`ex: 1`).
- `PA.data` (core) holds WS-X90's register data.
- The local database is open for more real facts, with SELECT only, never a write: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -At -F'|' -c "select …"`.
  - WS-X90's program id is `5b834025-4245-5e6b-81a0-98538930a36c`, in tenant `80ad4373-c1c2-4f1a-b9f1-cbb63980459d`.
  - The schema and views are described in `/Users/joseflagorio/Development/program_assurance-ux-proposal/CLAUDE.md`. It is already in your context as the repo's CLAUDE.md; it describes the real app, and you are drawing a prototype of it.
- Mark everything invented with `<span class="ex">Example</span>`, and put one `AK.note("…")` line on each screen saying what is invented. Never present an invented number as WS-X90's.
- Today in the prototype is **Tuesday, Nov 17, 2026** (`PA.data.TODAY`). The current user is **Ingrid Solberg**, security engineer.

## Look

- Ledger's tokens from `core.css` only, with no new colours. A person's colour is the token in `PA.SSP.people` (`PA.SSP.ui.c(name)` gives the style attribute).
- Statuses are round pills with glyphs (`h.pill`). Write in sentence case, with RMF's words, numbers over prose, and one line per table cell.
- Vanta's calm: white surfaces, thin lines, generous spacing, one ink primary per screen, quiet secondary buttons, counted tabs, chips.

## It must work

Josef walks through these screens, so every control does something:

- navigates;
- opens a dialog (`M[...]`) or a side panel (`P[...]`);
- changes what is on screen; or
- shows a toast saying what it would do (`PA.SSP.ui.toast`).

Never a dead button. Keep state in module variables, so it survives route changes within the session.

Use real `<button>` elements, visible focus and aria-labels on icon buttons. Escape closes your popovers. Honour `prefers-reduced-motion`: any animation or simulated typing jumps to its end state.

## Check

- `node --check PROTO/mod-<yours>.js`.
- Build with the kit and the data, in this order: `cd PROTO && python3 -I build.py <yours> mod-after-0kit.js mod-a-ssp-data.js mod-<yours>.js`.
- `cd PROTO && node look.mjs <yours> <route> …` saves `out/<yours>-<route>.png` at 1440×900 and reports script errors, placeholders and overflow at 390px. **View the PNGs** and fix what reads wrong.
- For taller shots and other widths: `node /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/ba/tools/shoot.mjs PROTO/out/<yours>.html <route> /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/shots/<name>.png <width> <height>`. It prints `overflowX`, which must be false. Shoot at 1440 and at 390.
- For an interaction, write a small Playwright script (copy `look.mjs`'s first lines for the require) that clicks through it and screenshots. Check that the main flows work, not just that they render.
- No script errors, and no horizontal overflow at 1440 or 390.

## Budget

Josef's usage credits have run out before, on large agent runs. Work efficiently:

- don't print big files;
- look at no more than about 10 Vanta images;
- don't re-read what you've already read.

Depth on the main flows beats breadth of half-working extras. If you must cut, cut the least important item in your brief's list and say so.

## Final reply

Under 200 words:

- the routes built;
- what is real and what is marked Example;
- anything from your brief you could not do;
- anything you added beyond the kit.

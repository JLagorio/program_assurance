# Agent S: the SCTM workbook

Read `SP/vanta/v2/COMMON.md` (paths, rules, budgets) first; its file-ownership lines are replaced by the ones below. Your folder is `SP/vanta/v2/S/`, your build `out/v2-S.html`.

## Josef's words (19 November)
"Build a security controls traceability matrix (SCTM) workbook. Kind of like a full screen editor you did for the SSP, but this is a spreadsheet editor that's a projection of controls + implementation + requirements + evidence + findings + risk in one matrixed spreadsheet, with tabs etc. I think docs/examples/macro-main has a RICH spreadsheet editor you can copy for this prototype. But then you can interact with the rows to see the pop ups and previews etc. Then I'll give feedback on the rest."

## What to build
A full-window workbook at route `sctm`, in the program (WS-X90), leaving the shell the way the SSP editor (`ssp`, `mod-ssp-editor.js`) does, with a header (title, the snapshot it reads, save state, Review changes, close back to the program). Agent N adds "SCTM workbook" to the program menu (Compliance, after Requirements); you may also link it from the Requirements and Controls page headers by wrapping those screens in your module.
- **The matrix sheet (SCTM):** one row a control of WS-X90's baseline, its columns the chain: control (code, title, family), implementation (status, narrative, responsible element), the requirements that map it, the elements they are allocated to, evidence (count and latest state), the assessment determination and the findings on it, the POA&M items and the risks that follow. Read the prototype's own data (`PA.data`, the SSP data in `mod-a-ssp-data.js` that the SSP editor reads, and the v2 workflow state in `PA.v2.state`, so a control walked in the prototype reads the same here). Never invent rows; say in the sheet's footer what is synthetic, plainly, without a badge.
- **More sheets as tabs:** Controls, Requirements, Evidence, Findings, Risks (one row a record each, with the fields that link them), and an Analysis sheet with live formulas over the others (coverage by family, controls with no evidence, and so on).
- **Spreadsheet behaviour, as rich as you can make it work:** a formula/name bar; sheet tabs; cell, range, row and column selection; keyboard navigation; typed editing of the fields a reader may change (an implementation's status and narrative, a requirement's text), staged as changes until Review changes applies them through `PA.v2.state` so the prototype's other screens follow; read-only derived fields; column resize; frozen header row and first column; sort and filter from a column's header menu; find; cell, row and column context menus; formulas in the Analysis sheet.
- **Rows that open the prototype:** a record in a cell (a control, a requirement, an evidence artifact, a finding, a POA&M item, a risk) opens that record's existing preview in the side panel beside the grid (the prototype's `P[kind]` previews, through the same panel the screens use), and a row's context menu opens its control's preview or page.
- **Look:** the v2 budget for an editor: colour only for status words, save state and what needs action; one primary.
- **Phone (390):** the grid scrolls inside its frame, the tabs scroll, and a preview opens as a sheet; the page itself never scrolls sideways.

## The spreadsheet to build on
- Use Josef's own spreadsheet: `packages/spreadsheet-core` (framework-free workbook operations, IronCalc 0.8.4 for formulas, MIT/Apache) and the kit's Spreadsheet pattern in `packages/design-system/src/patterns/spreadsheet/` (React: grid, formula bar, sheet bar, toolbar, text editor). `docs/guides/product-patterns.md` ("Workbooks") describes how the app's program workbook behaves, and `src/routes/programs.$programId_.workbook.tsx`, `src/lib/workbook-projection.ts` and `src/lib/assurance-workbook.ts` show how the app projects records into sheets: read them for the projection.
- Do not copy source from `docs/examples/macro-main`: it is AGPL-3.0, and spreadsheet-core's README says no Macro source is included. Read macro's spreadsheet for behaviour ideas only.
- Bringing the kit's React Spreadsheet into this vanilla-JS prototype is your call: for instance an esbuild bundle (`node_modules/.bin/esbuild` exists in the repo) mounted in your route, with the kit's CSS kept apart from the prototype's (a Shadow DOM, or scoping) so neither restyles the other, and IronCalc's WASM (about 2 MB) inlined. If that fails or costs too much, a vanilla grid in the prototype's own style is the fallback; decide within the first 45 minutes and say why. The whole page must stay under 16 MB (it is 4.7 MB now).
- Never edit anything under the repo (`/Users/joseflagorio/Development/program_assurance-design-system`); read it and bundle from it into your own files in the prototype folder.

## Your files
New: `SP/vanta/proto/mod-zzzz-v2-7sctm.js` and `.css` (and any data or bundle files you generate beside them, named `mod-zzzz-v2-7sctm-*`), plus build scripts in your folder. Do not edit other modules (agent N is changing the navigation, core.js and the visual layer at the same time); wrap what you need from your own module.

## Done means
- The workbook opens from the program, every sheet loads, a reader can select, sort, filter, find, edit and review a change that then shows elsewhere in the prototype, and every record in a cell opens its preview; checked by a walk script (`SP/vanta/v2/S/walk.mjs`) at 1440 and 390.
- Checks per COMMON.md; the page size.
- `newscreens.json` with the workbook (`{"id": "sctm", "title": "SCTM workbook", "route": "sctm", "v1": "No SCTM; the Traceability page was a register"}`) and any sheet worth its own screenshot; `notes.json`.
- Final message, at most 250 words, including whether you built on the kit's Spreadsheet or the fallback, and the page size.

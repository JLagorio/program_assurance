# V3 lane X: what earlier rounds left open

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-7more.js` and `.css`
- `SP/vanta/v3/X/`

Lane F (`mod-zzzz-v3-4facts`, one source per fact) has landed: read `SP/vanta/v3/F/notes.json`. Lanes P (`-2program`) and G (`-3gates`) are still working. **Build with whatever wave 1 modules are in the folder**, leaving out lanes R and W:
```sh
python3 -I build.py v3-X $(ls mod-*.js | grep -v '^mod-zzzz-v3-[5-9]') mod-zzzz-v3-7more.js
```

At the end the lead puts every lane together.

These were noticed in earlier rounds and left open. Josef asked for "anything else that was uncovered" too. Each gets a notes entry under `extra`, with `see`.

1. **The SCTM workbook** (`sctm`, `mod-zzzz-v2-7sctm.js`; lane F already makes its counts honest)
   - Josef asked for a workbook whose rows open the record previews: a control's, a requirement's, an evidence artifact's, a finding's, a risk's. Today its cells draw text only. A row, or a record's id in a cell, opens that record's preview beside the workbook, as registers do.
   - Lane F left C06 partly fixed. The sheets come from a frozen snapshot (117 requirements, 89 evidence, 112 findings mixed), so F renamed the tabs to the subsets they hold. Build them from the full registers instead: 640 requirements, 368 evidence artifacts, 44 operational issues and 313 assessment findings, with Assessment findings a sheet of its own. Wrap what `PA.sctm` exposes; you cannot edit `mod-zzzz-v2-7sctm.js`. If the grid cannot hold that many rows responsively, keep F's names and say why. Record the result under `findings` as C06.
   - The menu proposal makes the workbook Controls' spreadsheet view: Controls offers Open as spreadsheet, and the workbook's Close returns to Controls. Today it lands on Overview.
2. **Posture by technique.** Posture's Columns toggle reads by control family only. Make Resiliency techniques work: the techniques of NIST SP 800-160 Vol. 2 as columns, with the same counts (the app's contract describes the reading).
3. **"Shown in SSP section N"** links open the SSP editor at its top. Open it at that section.
4. **New plan** on Plans only toasts. Create the plan: a draft record listed on Plans, opening its editor.
5. **Records that live in a preview.** v2 folded the requirement's page into its preview. Josef has not decided on the others: a review queue item, a gate, an ATT&CK technique, an asset, an interconnection, an agent run, an authorization decision. Do not fold them. List, in `notes.json` under `extra`, which of them have a page and a preview that show the same thing twice, with a `see` for one example.

## Routes you own
- `sctm*`, compose on F's.
- `controls`: only the Open as spreadsheet link, composing on F's.
- `posture` (compose on F's).
- `ssps*` (G owns the Plans register's SSP revisions: compose, change only New plan).
- `ssp`: only the section link landing.

## Walk and screenshots
- **Walk:** "The workbook opens records", from Controls to the spreadsheet, a row's preview and back to Controls.
- **Scenes:**
  - the workbook with a preview open;
  - Posture by technique.

## From lane F (landed)
- Read control status counts from `PA.v3.fact("controls", prog)` or `fact("status", code)`, never `PA.v2.chain.counts()`. chain.counts() over-counts increment 2 by 2 (39/68 against 37/70).
- F publishes `controls`, `status`, `objectives`, `finding`, `issues`, `risks`, `poam`, `evidence`, `requirements`, `setup`, `people`, `snapshots`, `techniques` and `customer`. Their shapes are in `SP/vanta/v3/F/notes.json` and the header of `mod-zzzz-v3-4facts.js`.
- WS-X90's customer is now "F-16 SPO" (C22): use F's `customer()`.

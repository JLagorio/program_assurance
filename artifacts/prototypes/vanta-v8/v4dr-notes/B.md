# Lane B: evidence, after Drata

Read `COMMON.md` and `RECS.md` in this folder first. You write `SP/vanta/proto/mod-zzzz-v4-2evi.js` and `.css` (prefix `drb-`) and your folder `v4dr/B/`.

Recommendations you own: 7, 8, 9, 10. You also use the kit's 19, 23, 26 and 27 on your screens. Lane K is writing the kit (`PA.drk`) at the same time. Its function names are fixed in COMMON, so call them from the start.

## Start by reading the current screens (V3 on)

- `mod-zzzz-v3-8d-docs.js` draws Evidence (route `evidence`, its records and preview) together with documents and requirements. Read its header comment and reuse its data, so your after screens show WS-X90's real evidence.
- Find how an assessment campaign links evidence to an objective today: `mod-zzzz-v3-8e-assure.js` and `-5assess`.
- Find what imports exist today: the SCTM workbook (`sctm`), and the ITCSC import (`itcsc-import`).

## The after screens (new routes, your module)

1. **`dr-evidence`: the evidence register after.**
   - `D.stats` across the top: Needs artifact, Needs renewal, Upcoming renewal, Ready. Only the problem tiles carry the glyph, and each tile is a filter (rec 26, 7).
   - Then `K.toolbar` with saved views and filters (Status, Source, Owner, Control family).
   - The table: Name, Status (the lifecycle word), Renewal date (past due in warning words), Source (File, Link, Scan import, Ticket), Controls (`k of n ready`, using the kit's tones in one compact mark), Owner (the evidence owner, separate from the control owner) (rec 7, 8).
   - The renewal date comes from the collected date plus the assessment frequency of its controls ("at least annually" and so on; read the program's parameters). Derive it and list it in `derived`.
   - The eye opens `D.drawer` with "n of N", Previous and Next walking the filtered list (rec 23).
2. **`dr-evidence--<id>`: the evidence record after.**
   - `D.head`, then, when it lacks an artifact or is past renewal, `K.next` with "Add new artifact" or "Renew" (loud, but not a tinted banner) (rec 8).
   - Linked controls: each as a `D.idChip` with its status and what this evidence covers, with Link controls (rec 8).
   - Versions: an automated version (a scan import, a STIG checklist run) shows as fixed, with no delete, and reads "Fix or disable the source" instead (rec 9).
   - Renewal: the schedule and why ("AC-2's assessment frequency: at least annually").
   - Use `D.sunken` for the body.
   - Pick a record that shows each case: one evidence item that needs renewal and serves several controls, and one automated item.
3. **`dr-evidence-pick`: the assessment's evidence picker after.**
   - It opens from one assessment objective of a WS-X90 campaign.
   - It offers only evidence current in the campaign's assessment period. It says how many are hidden as out of period, with "Show them".
   - It maps the picked evidence to the objective's control (rec 9).
   - Draw it as a page with the dialog open (`click`), or as a page that is the picker; choose the one that reads best.
4. **`dr-import`: importing an SCTM or a POA&M spreadsheet, a new screen.** `D.steps` with Upload → Map columns → Map values → Review → Confirm (rec 10).
   - Upload: the WS-X90 SCTM as a ready sample file ("Use the sample: WS-X90 SCTM.xlsx").
   - Map columns: the sheet's headers to fields, with a data preview.
   - Map values: for example, the sheet's "Implemented / Partial / Planned" to our implementation statuses.
   - Review: `D.sheet` with real WS-X90 rows, where some are red (an unknown control code, a missing owner) and some amber (this row will update an existing implementation). Submit stays disabled while red remains, and fixing a cell clears it.
   - Confirm: `D.moving` with creates, updates and skipped (rec 27).
   - It saves nothing real: say so in the last step's line.
5. **The pairs in your notes.**
   - Evidence register: current `evidence`, after `dr-evidence`.
   - Evidence record: current is V3's evidence record, after `dr-evidence--<id>`.
   - Evidence picker: current is V3's link-evidence dialog on an objective, after `dr-evidence-pick`.
   - Import: `new: true`. Point `current` at the workbook, where an SCTM lives today.
   - Each pair has numbered changes, citing Drata images (`images/ux/evidence/`, and audits for the picker: search `screen` for "Evidence", "Import", "request").

## Checks

COMMON's checks. Your walk also:
- clicks each stat tile and sees the list filter;
- walks the drawer with Next three times and sees the records change;
- on the import, clears every red cell and submits;
- in the picker, sees only current evidence until "Show them".

Hand back as COMMON says.

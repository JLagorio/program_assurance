# What to borrow from Drata: the 28 recommendations

Josef asked, 2026-11-22: "I dont care about fedramp but whats worth borrowing from Drata? they do a lot of control, evidence, automated compliance plus their UI." The lead answered with the 28 items below. He then asked, in his words: "use agents and add a new DRATA tab in the about section with a current and after recommendation. if there are new screens and components show those there too. so I can visualize what you are recommending."

Drata's strength is the line from control to evidence to automated check, where every number can be traced to something you open. The sources are our own notes on Drata's public help center, at `/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/drata/` (start with `README.md`, then `help-center/notes/platform-grc-core.md` and `integrations-and-tests.md`, and `style.md`). The numbers below are cited as `rec` in every lane's notes. The lane letter says who draws it: K is the kit, A controls, B evidence, C sources (automated compliance: what feeds it), F checks and findings (automated compliance: what it finds).

## Controls

1. **[A] A control's status as a sum you can read.** Drata's control page shows a bar ("6 of 11") whose tooltip breaks the total down (Evidence 4/4, Monitoring 1/2 passing, Policies 1/4 published, Approvals 0/1). Under it sit four cards, each with a state, a legend of counts, and a first action when empty. "Not factored" counts what is left out, such as disabled or erroring tests.
   - For us: keep the status ladder as the word beside the control's title. Add four stage cards under it: Requirements (objectives mapped n/m), Evidence (objectives evidenced), Assessment (objectives judged), Remediation (open POA&M). Add a "not counted" line for objectives judged by inheritance, sources in error, and systems that don't select the control.
2. **[A, kit K] The control code is the status.** A monospace code inside a tinted pill: green with a check when ready, pink with a crossed circle when not. In a register that is one mark instead of two columns. Use it only where the status varies on the page.
3. **[A, kit K] Tab badges count problems.** "Monitoring 1" and "Policies 3" show as pale red counts on a record's tabs. A tab with no problem shows no badge.
4. **[A] Out of scope instead of delete, always with a reason.** "Mark out of scope" sits in the selection bar and needs a rationale. For us this is tailoring: a tailored-out control stays visible with its rationale.
5. **[A, kit K] Drift from a template, then compare back.** "Compare with template" is a dialog of three columns (Current, Template, Selections) with Apply or Reject on each field; "Compare to defaults" does the same for mappings. For us: a component's implementation statement against the library implementation it started from (V3 already knows "Changed here"), and a component version against the one before.
6. **[A] Approvals whose stages reset.** The stages are Prepare for approvers → Needs approval → Changes requested → Approved. An approval resets when a new policy is mapped, and again 14 days before its deadline. Adding evidence to an approved control asks "Send to approvers" or "Still working". For us: the ISSO/ISSM review of an implementation statement before the SSP goes out.

## Evidence

7. **[B] Evidence as something owed, with a lifecycle.** The states are Needs artifact, Needs renewal (past its date), Upcoming renewal (due within two months, still counts), Ready, and Error (its source failed, so it counts neither way). A renewal date and schedule drive the state, and the state drives the control's status. For us, the date comes from the control's assessment frequency ("at least annually").
8. **[B] One item serves many controls, and says how they're doing.** An evidence row shows how many of its controls are Ready and how many are not, and the evidence owner is separate from the control owner. The record says "needs an artifact", with Add new artifact, and lists its controls with status chips. Evidence may also live on one control only.
9. **[B] Automatic evidence that can't be faked.** Every automated run writes an event that is itself evidence. Test evidence can't be deleted; you fix or disable the test instead. A request's evidence picker offers only evidence current in the audit period. For us: scan imports become fixed evidence versions, and an assessment campaign's evidence picker offers only what is current in the assessment period.
10. **[B, kit K] Bulk import done properly.** The steps are upload → map columns to fields → map values → a sheet with All / Valid / Invalid. Red cells block Submit; yellow cells warn that a row will update an existing item. A confirmation counts what will be created and what updated. This is the shape for importing an SCTM or a POA&M spreadsheet.

## Automated compliance

11. **[C, kit K] Every source says what it's worth.** "AWS: 4 impact areas, 46 controls, 83 tests" before connecting, and a "Benefits" rail after. Each number opens its list. For us: a scanner feed, a STIG checklist import or an inventory export says how many of this program's objectives it can evidence.
12. **[F, kit K] The test record opens on three numbers.** Track ("Days failed 52, since Jan 13"), Fix ("Failing resources 250 → View findings") and Manage ("Tickets in progress 0 → Create ticket"), each opening its place. For us: the head of finding, operational issue and POA&M records (days open, items affected, milestones in progress).
13. **[C] Matching tables that name the consequence.** Accounts are matched to people and devices to people. An unmatched row has a red edge, "Not linked", and a picker in the cell. A banner names the test that will fail ("19 devices … not linked", Test 64), and a deleted account stays with its "Access revoked" date. For us: scanner assets ↔ the component inventory (CM-8), and accounts ↔ people (AC-2). Each unmatched row says which objective it holds back.
14. **[C] Scope as rules per source.** Regions or projects, then tag and name rules in or out. For us: the authorization boundary written as rules, so resources outside it never count.
15. **[F] Drafts run but don't count.** A custom test saved as a draft runs, but doesn't move status and isn't shown to auditors. Publishing starts it counting, and editing a published test opens a new draft.
16. **[F] A library of templates with copies you can trace.** The Test Library has 1,227 templates (In use 233, Not in use 994; rated Essential or Recommended). "Add to program" adds tests as Draft or Published, and a template's page lists "Tests using template", with Manage on each copy. For us: checks or procedures, and implementation libraries.
17. **[F] Derived states instead of empty rows.** "Unused" means the control needs this test but its source isn't connected. "New" means added recently.
18. **[F] Ticket routing without duplicates.** One ticket per account or tag, a fallback for the rest, and no new ticket while one is open. For us: POA&M items routed by system owner, with the POA&M as the source of truth.

## The UI

19. **[K] A sunken page with raised cards.** White chrome, and the page in a grey well. Records and dashboards hold white bordered cards; registers stay one surface.
20. **[K] One header shape everywhere.** The trail; an identifier chip before the title; ⋯, then a secondary, then the primary; a facts strip of label-over-value pairs, some with a pencil; line tabs with problem badges.
21. **[K, used by A] A filter panel beside long registers.** A card about 300px wide, with collapsible groups, each showing an applied count, plus a "Filters applied:" row of chips and Clear all. It collapses into the toolbar's Filter button when narrow. It must keep Josef's one-row toolbar with saved views.
22. **[K, used by A] A floating selection bar.** "10 Selected · Select all 363", with the verbs.
23. **[K, used by B] A preview drawer you can walk through.** "2 of 10", Previous ↑ / Next ↓, the status, the title, Open (the full page), the facts.
24. **[K, used by F] Side panes that dock instead of cover.** A thin rail at the record's right edge (notes, tickets, tasks) opens a pane beside the page, and the page narrows.
25. **[K, used by A] Each card owns its Edit.** Edit swaps that card's facts for inputs, with Save and Cancel under them.
26. **[K, used by B] Plain stat tiles.** Four equal tiles: a label over a big ink number. Only a problem tile leads with a warning glyph.
27. **[K, used by C] Show what will change before a command over many records.** Counts first, required groups locked, "Moving 147 / Not moving 12", all or nothing, a reference ID on failure.
28. **[K, used by A] AI that proposes and shows its reasons.** A confidence chip and a one-line rationale, with Map / Dismiss / Undo. An agent's proposal ends in a card with Approve and Decline. How much the AI may do alone is chosen up front.

## Leave behind

- **Binary Ready / Not ready.** Our ladder already says what to do next.
- **A free "Exclude".** For us, an exclusion is a signed POA&M deviation or risk acceptance.
- **Edit dropdowns in register rows.**
- **An automatic task per control.**
- **A red "Fix Now" button on every failing row.**
- **Blue-outlined secondaries everywhere, seven pill tints, gradients, zero tiles, walls of donut charts.**
- **Two visual generations side by side.**

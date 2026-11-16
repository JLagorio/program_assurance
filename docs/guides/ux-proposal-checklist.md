# UX proposal: implementation checklist

What to build from the November 2026 UX proposal, in order. The artifacts are the spec; this file only tracks the work. Tick a line when it is merged and checked in the running app.

## The spec

| Artifact | Use it for |
| --- | --- |
| [A Path, Not a Page](https://claude.ai/artifact/GYxwfYJuHpsptsaQyJV24u) | All 40 decisions (the last 19 answered 2026-11-16, pass six), the reasoning, every board with its job |
| [Program Assurance prototype](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM) | How each screen behaves: 81 screens in 18 flows. A screen's address is its key (`#component--overview`) |
| [Program Assurance mocks](https://claude.ai/artifact/3MbdfEKz2n7AfNCXvLkAjz) | Every screen side by side, and the eight component sheets |
| [Ledger](https://claude.ai/artifact/2iju1qSiUEtVKtTi3SeCy3) | The tokens in four themes, the brand book, and a card for every part the screens use (static renditions; `nx-` parts are proposed) |

A snapshot of all four is in `docs/ux-proposal-2026-11/` on `design-system`. Board sources: `artifacts/prototypes/ux-proposal-2026-11-pass2/` (a gitignored local copy).

## 0. Before anything is built

- [x] Go-ahead to start building: 2026-11-16, on the branch `ux-proposal-build`
- [x] All 40 decisions made (2026-11-16): the control work at the centre, Phase 0 first, a short contract and a lab lane; the standing as one header fact; a role-true slot; the Authorization view in two lanes; signing held to roles; on shared components an inherited determination stands, sourced, a version that lists nothing is shown and confirmed, an inherited control leads to the component, and a CVE stays open until every consumer moves
- [x] The shared-component work (seven migrations, the seed, typed modules) is committed on `design-system`

Phase 0 first (D8): Ledger, then the contract and words, then data, then screens.

## 1. Ledger first (`packages/design-system`)

Twelve parts, each built on one that ships, through `/ledger-add-part`; the sheet on the mocks canvas is the spec. Building them accepts the sheets as Ledger's next scope. Each new part starts Experimental.

- [x] Foundations: the seven tokens (sheet: Type, colour and surfaces)
- [x] Standing headline, Action slot, Sign button, on `PageHeader` and `Button` (sheet: Record header and buttons)
- [x] Path, a variant of `Stepper`, and Due rail, in `Chart` (sheet: Time: rail, path cell, clocks)
- [x] Empty seat, its own part beside `Avatar` and `Absent` (sheet: Readiness, seats and signatures)
- [x] Meter and Climb, on `Tally` and `Progress` (sheet: Counting: bars, rungs, marks)
- [x] Objective cells, on Tally's paint with a table twin (sheet: Counting: bars, rungs, marks)
- [x] Chain rail, `Trace.Rail` (sheet: The chain)
- [x] Work row, `WorkRow` (sheet: Rows)
- [x] Decision keys and the foot bar, `DecisionKeys` and `FootBar` (sheet: Review workspace)
- [ ] Align two wave-1 parts with the decisions: `PageHeader.Standing` becomes one header fact beside the categorization (not the display-size headline); `PageHeader.Slot` is role-true (offered by the roles a program records)

## 2. Contract and words

- [ ] `docs/guides/product-patterns.md`: seven page types (Overview, Register, Record, Workspace, Flow, Home, Library); a screen that fits none gets a written exception first
- [ ] Navigation, two scopes in one side nav. Organization: Home, Portfolio, Programs, Library (Frameworks, Overlays, Guidance, Components). Work, under a product or a program's system: Overview, System, Baseline, Controls, Requirements, Evidence, Findings, POA&M, Risks, Assessments, Authorization
- [ ] Words in `src/lib/status.ts` and `product-records.ts`: Component (one) and Component set; Offer to owner, Withdraw offer, Accept, Return; Verified for reviewed evidence, Satisfied stays the assessor's; To review
- [ ] `docs/guides/screen-inventory.json`: every new route

## 3. Data (`supabase/`, `src/lib`)

- [x] Shared components: the schema (migrations `20261115070043` to `20261115172957`) and its seven schema tests are committed
- [ ] Fix, before a screen reads it: the plan-cache slowdown in `program_objective_placement_answer`; the seed's Mission Computer 2 published, with AC-17(2) and SC-23 to review; Open CVEs counted per version in use
- [ ] Per flow, what the schema still lacks (checked as each flow starts)

## 4. Screens, a flow at a time

Built over real records, then `/verify-screen`. Each link opens the flow's first screen in the prototype.

- [ ] 1 · [The organization](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#portfolio): 8 screens. Portfolio, product Structure, Components register, the component record's five tabs
- [ ] 2 · [Assess once, use everywhere](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#component-assess): 7. Component assessment, Assessments, the System page's Library tab, Take version, a control decided by inheritance
- [ ] 3 · [Found below, reviewed above](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#finding-cve--offer): 4. Offer to owner, Home, the offer on the component's Findings tab, after Accept
- [ ] 4 · [The libraries](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#lib-frameworks): 3
- [ ] 5 · [Know the system](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#sys-overview): 3
- [ ] 6 · [Select the baseline](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#baseline): 2
- [ ] 7 · [Implement and map](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#impl): 4
- [ ] 8 · [Prove with evidence](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#evidence): 3
- [ ] 9 · [Find and fix](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#findings): 5
- [ ] 10 · [Assess, remediate, authorize](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#assess): 18

Not built as drawn: flows A to P, the earlier explorations on the old navigation. The authorizing official's desk and the phone frames are set aside.

## 5. Gaps in the spec

- [ ] Return's note dialog is not drawn
- [ ] The Audit Log Collector has no record of its own
- [ ] Three buttons lead nowhere: Assess component (Structure), Plan assessment, Create overlay
- [ ] "POA&M items · after" has no way on but the guide bar
- [ ] Some figures on the boards are illustrative and not in the seed: Behind counts, Home's waits, Customer A's and B's finding counts

## 6. Done, for any line

- The built screen beside its prototype screen, at 1440px and 390px, in the running app
- The same checks CI runs, read on the runner: `gh run list --branch design-system`

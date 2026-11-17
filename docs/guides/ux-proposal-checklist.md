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

Phase 0 first (D8): one week of ten quick fixes visible on every screen, then Phase 1 (the kit and the contract), then the spine and the workspaces. The Ledger parts below are Phase 1 work, built first on this branch at Josef's choice (2026-11-16).

## Phase 0: ten quick fixes (week 1)

- [x] Inspect record leaves record menus, so Edit can be the primary (24 record pages)
- [x] The 15 program views move into a visible row, each with its own title
- [x] Status beside every record h1; a program's standing is one header fact beside its categorization (WS-X90: ATO with conditions · CDR 46d late)
- [x] Zero lines and trends under 7 points are hidden
- [x] One Tally in place of the 560-mark strip
- [x] Due dates flagged on bands, gates and remediation (a program's remediation list still has no Due column: it needs a read)
- [x] Names take the flexible width; constant columns fold (a column folds only when every row holds one value)
- [x] A Program column and filter on 11 registers; assessment findings, Unrolled findings, system assets and Objectives wait on a program name in their views
- [x] Controls titled by code and name ("AC-2 Account Management"); names, never ids
- [x] Stat figures at 20px (`font.figure`); card titles below sections
- [ ] The demo loses its test programs, the "kk" gate and the 8 test overlays (writes to the local database: asked first)

## 1. Ledger (`packages/design-system`), Phase 1

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
- [x] `PageHeader.Standing` is one fact on `PageHeader.Facts`, the line under the name (the program: categorization, then ATO with conditions · CDR 46d late)
- [x] `ViewSwitcher`: the views row as a kit part, used by the program's tabs
- [ ] `PageHeader.Slot` role-true: offered by the roles a program records (needs each program's roles recorded)

## 2. Contract and words

- [x] The contract under 4,000 words (D7): `product-patterns-core.md` (loaded in every session, under 1,500) and `product-patterns.md`, held by `check:contract-budget` in CI; per-screen rules moved into their files' header comments
- [x] The lab lane: `src/components/prototype/lab/`, 30 days a form, held by a test
- [x] The decisions log, `docs/decisions.md`, which a raise of the contract's cap must cite
- [x] Budgets B1 to B16: ceilings per route and tab in `screen-inventory.json` (with each route's archetype, purpose and primary), measured by `test:budgets`, which only fall
- [x] Navigation, two scopes in one side nav (`scope-navigation.tsx`, `navigation-scope.ts`; each route's scope and entry in the inventory's `nav`). Organization: Home, Portfolio, Programs, Library (Frameworks, Overlays, Guidance, Components), and a Registers group holding the other destinations until they have a place. Work, under a product or a program: the switcher, Overview, System, Baseline, Controls, Requirements, Evidence, Findings, POA&M, Risks, Assessments, Authorization
- [x] The program's tab strip goes, now the work scope repeats it: each entry is a part at its old address, named by its h1 (`src/lib/program-parts.ts`)
- [x] A program's records open in its work scope (risk, remediation item, POA&M plan, issue, finding, asset, evidence, campaign, package), their entry current; a task and a workstream mark none
- [x] Library names match their pages: Frameworks (the catalog), Guidance (`/guidance`, the four SP 800-160 frameworks; the board's counts, In use column and family matrix are not built)
- [x] Words in `src/lib/status.ts` and `product-records.ts`: Component (one) and Component set; Offer to owner, Withdraw offer, Accept, Return; Verified for reviewed evidence, Satisfied stays the assessor's; RMF's short decision words (IATT and ATU wait for D5's data). To review comes with the component screens, the first to show it
- [x] Page budgets, first pass: catalog Sources a register (401 words to 12), empty facts and zero tiles drawn as nothing, empty-state lines under 10 words; the buttons left on SSP, Controls and the catalog are the table's own pager and column menus
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
- [ ] 10 · [Assess, remediate, authorize](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM#assess): 18. Built: the Authorization view (Schedule in two lanes with the climb, Decisions, Package). Not in the data: an ATO's conditions as dated items (`authorization_conditions`), the annual review and its checks, who signs and package routing (program roles), whether a gate's criteria are met

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

# Agent G: the program lifecycle, its stages, gates and deliverables

Read `SP/vanta/v2/GH.md` first (it points at COMMON.md and holds the story and the interfaces you share with agent H). Your folder is `SP/vanta/v2/G/`, your build `out/v2-G.html`.

## Josef's words (19 November)
"Where do program lifecycle gates / stages live with deliverables for each stage?" The answer was: only on Schedule, folded under Monitor; two gates (PDR and CDR, the CDR due before the PDR), no deliverables. Josef: "Yeah it's kind of hard to follow cause they're tucked away so far lol. Ideas? Thoughts? We need more stages too." The lead proposed what follows, and Josef said: "Yeah build it into the v2 and the prototype."

## The proposal you build
1. **The stage on every program page.** Under the program switcher (`programHead()` in `core.js`): one grey line, e.g. "Increment 2 · TMRR · next PDR Nov 24 · 3 of 5 ready", which opens Lifecycle.
2. **A Lifecycle page** (route `lifecycle`, already in the menu after Overview): a phase strip across the top (the five phases as segments; milestones A, B and C as markers; reviews and RMF steps as ticks; today; the current step marked), then the steps grouped by phase, the current phase open and the others folded with "N of M done". Each row: the step, its kind, its due or decided day, its status, its deliverables (each a link), and its criteria met ("2 of 4"). A switch between Increment 1 · Block 1 (fielded) and Increment 2 · Block 1.1 (current).
3. **Deliverables are records the program already has**, never uploads: each links to its page or record and takes its state from it (the SSP revision, the SCTM workbook, the categorization on ITCSC, the baseline, requirements, interconnections, ports & protocols, STIG checklists, threats, security engineering, a Cyber T&E event, an assessment campaign and its results (the SAR), the POA&M, the authorization decision, the package room, continuous monitoring, the Boundary page `boundary` that H builds). An engineering review's own package (SRR, PDR, CDR package) is a document: give it a preview. Keep each state's derivation simple and honest; where a state is synthetic, the page's one grey footnote says so.
4. **One page per gate** (every step): its deliverables, its criteria (the NIST SP 800-160 Vol. 1 security outcomes PDR and CDR already carry in `mod-after-work.js` `GATES`; for other steps the archive's cyber criterion below, plus outcomes where they fit), its approvals (who decides: chief engineer for reviews, the milestone decision authority for milestones, the ISSM, SCA and AO for RMF steps; use the names the prototype already has, `ROLE` in the program modules) and its decision. Primary: Request decision, then Record decision (Approve / Approve with conditions / Not approved, with conditions text) in a dialog that writes `PA.v2` state, so Lifecycle, the header line, the Overview strip, the Review queue and My work follow. The prototype already has a lifecycle gate preview (`P["a-work-gate"]` in `mod-after-work.js`) and v2 gives records pages (`rec--<kind>--<id>`, `mod-zzzz-v2-1records.js`; find how a gate is reached today): build on them rather than adding a second gate record; give the preview ↗ to the gate page.
5. **The Overview** opens with the strip, compact, under its header: the phases, where the program is, and "Next: PDR in 7 days · 2 deliverables not ready" linking to the gate; drop the Overview's existing Lifecycle fact (said once). **Programs and Home cards** get one grey line with the stage and next gate. **Review queue**: "Gate to decide" rows open that gate, with its deliverables. **My work**: deliverables due for the next gate that are not ready, grouped under the gate ("Due for PDR · Nov 24"), each opening its record, gone when ready or decided. **Schedule** goes back to tasks only (its gate section goes; one grey line may point to Lifecycle).

The mock-up Josef approved:
```
WS-X90 · EMD · next CDR Dec 12 · 4 of 6 ready
 MSA ──▲A── TMRR ─────────▲B── EMD ─────── Test ──────▲C── Ops
 ✓ASR ✓Cat  ✓SRR ✓SFR ✓Sel ✓PDR  ✓SSP ●CDR  TRR IATT SVR PRR  SAR ATO IOC

 EMD: Engineering & manufacturing development     2 of 3 done
  ✓ Milestone B          Sep 25  RMF strategy memo ↗
  ✓ Develop the SSP      Nov 6   SSP revision 3 ↗
  ● Critical Design Rev  Dec 12  CDR package · SCTM ↗   2 of 4 criteria
```
(Its dates are illustrative; the real ones follow the story in GH.md: Increment 2's PDR is in review now.)

## The stages: the archive's 19-step template
The app's demo archive (`/Users/joseflagorio/Development/program_assurance-design-system/supabase/demo/original-poc.json.gz`, read-only: `gunzip -c … | python3 -I -c …`, key `programMilestones`, 19 a program for five archived programs) holds this lifecycle, each step with an owner, a deliverable and a cyber criterion. PRG-1041 Atlas payments platform's, in order:

| Phase | Kind | Step | Deliverable | Cyber criterion |
|---|---|---|---|---|
| 1 Materiel solution analysis | Engineering review | ASR | ASR package | Preliminary boundary and data types identified |
| 1 | Milestone decision | Milestone A | MS-A package | System categorization brief accepted |
| 1 | RMF action | Categorize | RMF-1 package | FIPS-199 categorization signed by the AO |
| 2 Technology maturation & risk reduction | Engineering review | SRR | SRR package | Security requirements traced into the spec |
| 2 | Engineering review | SFR | SFR package | Functional decomposition of the security boundary |
| 2 | RMF action | Select controls | RMF-2 package | Tailored baseline approved by the SCA |
| 2 | Engineering review | PDR | PDR package | SCA review of the conceptual boundary |
| 2 | RMF action | AO approval of RMF strategy | RMF-3 package | Signed RMF security strategy memo |
| 3 Engineering & manufacturing development | Milestone decision | Milestone B | MS-B package | AO-approved RMF strategy on file |
| 3 | RMF action | Develop SSP | RMF-4 package | SSP baselined in the authorization package |
| 3 | Engineering review | CDR | CDR package | SCA assessment of the SSP: design must support selected controls |
| 4 Integration, test & production approval | Engineering review | TRR | TRR package | IATT prerequisites: scans and safety checks complete |
| 4 | RMF action | IATT | IATT memo | Signed IATT memo with expiry |
| 4 | Engineering review | SVR | SVR package | Control verification results recorded |
| 4 | Engineering review | PRR | PRR package | Supply-chain risk controls (SR family) assessed |
| 5 Production, deployment & operations | Milestone decision | Milestone C | — | SAR risk posture accepted |
| 5 | RMF action | Final assessment & SAR | SAR | SAR delivered with risk recommendation to the AO |
| 5 | RMF action | ATO | ATO memo | ATO memo with POA&M and expiry date |
| 5 | Operational | IOC | — | ConMon plan and cATO pipeline controls active |

Use these steps, kinds and phases for WS-X90 (deliverables become WS-X90's own records, as above), dated for its two increments under the story's constraints: nothing done after today, nothing in the future marked done, dates rising along each track, Increment 1 ending with the ATO on Sep 18, 2026 and IOC after it, Increment 2 at its PDR now, CDR after PDR. An increment that is a block upgrade may skip steps that do not apply (say which in the step's row, e.g. "Not required for Increment 2"). Statuses: use the app's lifecycle gate statuses (read the enum in `/Users/joseflagorio/Development/program_assurance-design-system/supabase/migrations`, grep `lifecycle_gate`), plus the decision's outcome. The five archived programs (`PA.data.OTHER`) show their own real stage and next step from the archive on the Programs page; the three X800/G25 customer programs get a plausible stage (synthetic, footnoted); a created program (`PA.v2hubs.cur()` not PRG-1090) gets the template for Increment 1, not started, dated from today, MSA current.

## Your files
New: `SP/vanta/proto/mod-zzzz-v2-8life.js` and `.css` (and `mod-zzzz-v2-8life-*` data files). Edit: `mod-after-work.js` (its gates, Schedule, the gate preview) and, in `core.js`, `programHead()` only (agent H may edit the `PROGRAMS` numbers in `core.js`; use the Edit tool and re-read before each edit). Wrap from your module: `overview`, `home`, `portfolio`, `review-queue`, `my-work` and any record layer you need. Nothing else (see GH.md).

## Order, if time runs short
1. Data and `PA.v2life`; the Lifecycle page; the gate page and preview with Record decision; the header line; the Overview strip.
2. Schedule, the Home and Programs cards (on Programs, also "Host: F-16 Block 70" from `PA.v2host.hostOf(code)` when it answers), the Review queue, My work.
3. The archived programs' real stages; created programs.

## Done means
Lifecycle shows all 19 steps of each increment in five phases; every step has a page with deliverables, criteria, approvals and a decision; recording PDR's decision moves Lifecycle, the header line, the Overview strip, the Review queue and My work; Schedule holds tasks only; checks per GH.md; `notes.json`, `newscreens.json` (Lifecycle, a gate page such as PDR, the Overview strip, and any other screen worth its own pair); final message per GH.md.

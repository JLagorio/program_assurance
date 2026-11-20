# Lane O: the program's Overview and its lifecycle

Read `SP/vanta/v3r/CONTEXT.md`, then `SP/vanta/v3r/MODEL.md`, and follow both. Your files: `SP/vanta/proto/mod-zzzz-v3-8o-overview.js` and `.css` (CSS prefix `k3o-`), and `SP/vanta/v3r/O/`. Build name `v3r-O`.

## What Josef said
> there are too many tabs doing simliar things instead of starting with higher level records and then diving into record details to do things with those. a good example is the lifecycle stages. why do we have a tab? if the stages show on the overview and clikcing them takes you to the lifecycle tab thats stupid and pointless.

And earlier: "ideally a program is just a record you do a lot of things in." And: "there's still no continuity."

The Overview **is the program's record.** Its stage strip is the lifecycle, opened in place; a gate is a record that opens in a panel; a deliverable that is not ready takes the reader to exactly the records that hold it back, and brings them back.

## Build
**1. `overview`: the program's record.**
- Header: the program's name and code; its authorization as the status chip, which opens Authorization; More (Program settings, Export). No "Open package" primary.
- Tabs: Overview · Team (count) · Activity.
- **The lifecycle, in place.** An increment select (Increment 2 · Block 1.1, current; Increment 1 · Block 1, fielded), then the strip of phases (MSA, TMRR, EMD, Test, Ops) with their steps as marks. Choosing a phase lists its steps under the strip, on this page: Step, Kind (milestone, engineering review, RMF action), Due or decided, Status, Ready (n of m deliverables). The current phase is open when the page opens.
- **The next gate, opened up.** Under the strip, the next step that is not decided (PDR, due in 7 days) as a checklist of its deliverables, Vanta's profile checklist: state, the deliverable by name, **why it is not ready as a number** ("2 connections without an agreement", "1 requirement mapping to review"), and one button that opens exactly those records with the return bar (`K.task.start({ from: { label: "PDR", route: "overview" }, steps: […] })`). Ready ones are quiet. The earlier lane G's rule holds: a deliverable is ready because its records are, never because someone said so (`SP/vanta/v3/G/notes.json`, `fact("gate")`, `fact("outcome")`).
- **A gate's panel** (`k3o-gate`), from any step: what it is, due, its criteria (n of m, each with what meets it), its deliverables with their state, who decides, and Record decision (Pass, Pass with actions, Not passed, with a rationale), refused while a deliverable is not ready, naming it. The authorization steps (IATT, ATO) open Authorization instead: the package is their page.
- **Where the program stands:** one completion card (Controls satisfied, opening Controls) and one needs-attention card whose rows open their list filtered to exactly those records (operational issues, risks without an owner, evidence waiting on review, your tasks). Nothing that only repeats the menu ("Plans, assessments and setup" goes).
- Details at the side: system, host system (a link to its component page), categorization (opens the ITCSC), baseline (opens Controls), next date. Team: the roles' holders, with Manage opening the Team tab.

**2. `overview-team`** (People & roles): the program's roles in RMF's order with who holds each, and its people; Assign a role and Add a person in place; a person opens their existing panel.

**3. `overview-activity`**: the program's activity, newest first.

**4. Fold.** `lifecycle…`, `sse…` (security outcomes are a gate's criteria: show them in the gate's panel), `getting-started`, `people…`, `activity` open their new home. The stage line under the program switcher and anything else that linked to Lifecycle opens the Overview with that phase open. A gate's old page (`rec--a-work-gate--…`) opens the Overview with that gate's panel open. Publish `nextGate()`.

## It works when (your walk asserts each)
1. Overview → choose a phase on the strip: its steps list under it, the address unchanged; choose another; the current phase is open on arrival.
2. Increment 1 shows its own steps and decisions (fielded under the Sep 18, 2026 ATO); Increment 2 returns.
3. The next gate's checklist names what is not ready with a number; its button lands on those records (the count equals the rows) with the return bar; Back returns to the Overview with the checklist as it was.
4. Fix what holds a deliverable back (through the page it lives on) and return: the deliverable reads ready and Ready counts one more, without anyone ticking it.
5. A gate's panel: Record decision is refused, naming the deliverable; once all are ready it is recorded, the step reads decided, the strip moves on and the next gate's checklist takes its place.
6. A needs-attention row opens its list on exactly those records.
7. Team: assign a role; the Overview's Team and the gate's "who decides" follow.
8. `lifecycle`, `lifecycle-outcomes`, `sse`, `people`, `activity`, `getting-started` and a gate's old page land where this brief says.
9. A created program (lane P's; `SP/vanta/v3/P/walk.mjs` shows how to make one): its own Overview from its own data (lane P's setup guide is its next step), never WS-X90's. If that is more than you can carry, draw the earlier page for a created program (`PA.v3.S("overview", (orig) => …)` gives you it as `orig`) and say so in `open`.

## Not yours
The System and its components (lane S), Controls (lane C), Authorization's own page and the registers (second wave). A deliverable's button goes to whichever page holds its records today: the new one where its lane has landed, else the old.

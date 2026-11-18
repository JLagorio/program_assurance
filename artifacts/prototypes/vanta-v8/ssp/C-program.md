# Builder C: program creation, walked end to end

Read `COMMON.md` (same folder) first. Your files are `PROTO/mod-program-new.js` and `PROTO/mod-program-new.css`, with the CSS prefix `pn-`. You never need the SSP data module beyond `PA.fullWindow` and `PA.SSP.ui.toast`, and never print it.

## Routes

- The wizard, full window. Call `PA.fullWindow("program-new")`, which covers every `program-new-…` route:
  - `program-new` (how to start);
  - `program-new-details`;
  - `program-new-systems`;
  - `program-new-baseline`;
  - `program-new-team`;
  - `program-new-review`.
- `program-start`: the new program's Getting started page, in the app shell, after creation. Set `ROUTE_NAV["program-start"] = "overview"`.

Each step is its own route, so Back and Forward work. The draft lives in one module object, so values survive moving between steps.

## What Josef asked for

"We don't account for the program creation flow. I need to be able to walk through that and see that as well." He wants a real walkthrough: every step clickable, the choices carried forward, a review, a create, and the place you land afterwards.

## What the real app does (follow it; improve the flow)

`/Users/joseflagorio/Development/program_assurance-design-system/docs/program-wizard.md` (7 KB) describes the app's wizard. Read it once. Its four steps:

1. **Program**: name, code and mission, plus an optional sponsor, people and dates.
2. **Catalog and profiles**: one catalog edition; base baselines with overlays stacked in order (Add overlay) and/or "Tailor for this program"; the stack shows what each layer changes and the baseline that results; every decision has a rationale.
3. **Systems and components**: one tree. A system carries its identity, owner, its categorization (C, I and A with a rationale; the categorization suggests a baseline but never chooses it) and the program profile it adopts. "Add from library" pulls in a published component, with its claimed controls shown as "will seed" or "not in baseline". "From a product…" creates the system as a variant of a published product configuration: its elements arrive with their library pins, and inherited elements can be pruned and customer ones added.
4. **Review and create**: a checkout summary, one card per step with two or three lines and Edit; save everything atomically; a rejected save keeps the draft.

Creation also writes the program's roles and **a draft SSP per system with a planned implementation for every selected control**. That links to the SSP editor (`#ssp`), which builder A is drawing now.

**Your improvement, to propose:**

- Follow RMF's order: categorize before select. Systems and categorization come before the baseline, so the baseline step opens with the suggestion the categorization makes.
- Add a Team step for RMF roles (authorizing official, ISSM, ISSO, system owner, lead assessor, assessors). The real app records them: only today's holder of the AO role signs, and only the lead assessor publishes results.
- Add a first "How do you want to start?" step.

Say in one `AK.note` on the start step that the order and the Team step differ from today's app.

## Vanta references (view at most these)

- `VANTA/ux/audits/adding-and-managing-auditors--05.png` and `VANTA/ux/audits/creating-an-audit--04.png`: Add a new audit, step 1 of 3, and define scope.
- `VANTA/ux/audits/adaptive-framework-scoping--09.png`: select a framework.
- `VANTA/ux/frameworks/bringing-your-current-compliance-program-into-vanta--14.png` and `--15.png`: review and finalize, then the imported framework's page with completion.
- `VANTA/ux/home/getting-started-resources-in-vanta--02.png`: the Starter Guide checklist with progress, which is the model for `program-start`.
- `VANTA/ux/insurance/vanta-vouch-cyber-insurance--03.png` and `--04.png`: a steps rail and reviewing answers before you finish.
- `VANTA/ux/access/access-reviews--02.png`: a wizard with a live preview beside it.
- Also look at `PROTO/out/ba/getting-started-after.png`.

## The walkthrough (prefilled, so it can be clicked straight through; every field editable)

The example program is **"Customer D · X800 Eject Launch Integration"**, code **PRG-2301**, mark it Example. It is built from the real **X800 Missile version 2** (published Nov 13), configuration **B "Eject Launch"**. No program uses that configuration yet: Customer A uses A (Lug & Rail Launch, PRG-2101) and Customer B uses C (Palletized Launch, PRG-2102).

Query the database (SELECT only) for real values:

- X800 version 2's elements, with the subsystems GS, CS, PS, SE, LA, LB and LC (`product_elements` with `product_revisions`, `products` and `product_configurations`; configuration elements in `product_configuration_elements`);
- the library components pinned to them (`defined_component_id` → `defined_components`);
- business lines: Air Defense (AD) and Mission Systems (MS);
- overlays (`control_overlays`, state published, ignoring the "Parameter values check" ones): CNSSI 1253 National Security System Allocation, Deployed Platform Overlay, Mission Assurance Overlay, Customer A Tailoring;
- the catalog: NIST SP 800-53 Rev 5, edition 5.2.0;
- the reference baselines and their control counts.

The other customer programs total 374, 370 and 287 controls. Use real counts where you can derive them. Where a count needs a resolution you can't compute, show a plausible number marked Example.

### Layout of every wizard step (full window)

- **Header**: a close ✕ that asks "Save the draft and leave?" (Save draft, Discard, Keep editing), the title "Create program", and "Step 2 of 5" on the right.
- **Left rail**: `AK.steps` with Start, Program, Systems, Baseline, Team and Review. Done steps are clickable.
- **Centre**: the form, about 640px wide.
- **Right**: a sticky **"What you're creating"** card that updates live as you go: the program name and code, 1 system · 19 elements, 370 controls (after the baseline step), 6 roles filled, "1 draft SSP with 370 planned implementations".
- **Footer**: Back, and Continue as the ink primary.
- **Validation on Continue**: a missing required field gets a red message under it, and a short error summary at the top that links to each field; focus moves there. With one error, focus goes straight to the field. Clear the name field to try it.

### Step 0, `program-new`: How do you want to start?

Four large choice cards:

- **From a product** (recommended, selected): pick a product and configuration from X800 Missile, G25, R210 and G40, with their real configurations.
- **Blank program**.
- **Import an SSP**: an OSCAL SSP JSON or eMASS export. On choice it shows a file drop zone, marked Example.
- **Copy a program's setup**: for example, from WS-X90.

Only "From a product" needs to run the whole path. The others fill the later steps more simply and say what they'd do.

### Step 1, `program-new-details`: Program

- Name (required);
- Code (required): suggested from the next free code (PRG-2301), with a uniqueness check against the real codes in the database;
- Mission (required, a textarea; prefilled, Example);
- Business line (Air Defense, preselected);
- Sponsor (party picker, Example);
- Start date and target authorization date, with date fields that read well.

### Step 2, `program-new-systems`: Systems and categorization

- **The authorization boundary system**: Name ("Customer D X800 variant"), Code ("SYS-2301-B"), Type ("Platform"), Owner.
- **Categorization**: Confidentiality, Integrity and Availability, each as a segmented Low, Moderate or High.
  - Above them, an "Information types" picker of SP 800-60 types (mark the list Example). Picking types suggests the impact levels, "Suggested from 3 information types: High / High / Moderate". The suggestion doesn't set them until you press "Use suggestion".
  - A Rationale textarea (required by eMASS), with "Draft with Assist", which fills a draft marked "AI draft · review before you continue".
- **The elements tree** from the product configuration: the core subsystems and the configuration's own launch interface (LB, Eject Launch Interface).
  - Each element shows its code, name and type, and a "Product" badge.
  - An element pinned to a library component shows a "Library" badge, its version, and "will seed N controls".
  - Row actions: Remove from this variant (pruning, with a reason), and for an element, "Mark as modified".
  - "Add element" and "Add from library" (a dialog listing published components with their claimed controls).
  - Counts update live in the side card.
- "Add another system" (optional), which adds a second, collapsed system card.

### Step 3, `program-new-baseline`: Control baseline

- **Catalog edition**: NIST SP 800-53 Rev 5 · 5.2.0.
- **Suggested baseline** from the categorization: "High, because Confidentiality and Integrity are High", with Use suggestion and Choose another (Low, Moderate, High, plus "Combine with" a second baseline, Privacy).
- **Overlays**: Add overlay, a menu of the real published overlays. The added ones stack in order, with Move up, Move down and Remove.
- **"Tailor for this program"**: a dialog to add or remove controls, each with a required rationale. Prefill one removal and one addition, marked Example.
- **The stack table**: one line per layer (reference baseline, each overlay, tailoring) with +added, −removed and the running count, then the resulting total.
- **Resulting baseline**: Grid (one small square per control, grouped by family, coloured by "from the baseline", "added" and "removed", with a key) and List (a compact table of family, count, added and removed).

### Step 4, `program-new-team`: Team

- **The RMF roles**, each with a person picker: Authorizing official, ISSM, ISSO, System owner, Lead assessor (SCA), Assessors (several).
- Use real people from the workspace: R. Calloway, Joel Barrantes, Priya Raghavan, Ray Colston, D. Okafor, Nadia Fournier, Marcus Ryde and Ingrid Solberg. Query `parties` for more.
- Prefill sensibly, but leave one role empty to show the "Unassigned" state.
- One line under the AO: "Only the AO signs authorization decisions."
- "Invite by email" for someone not yet in the workspace (Example).

### Step 5, `program-new-review`: Review and create

- **One card per step**, two or three lines each, with Edit back to that step.
- **"What creating writes"**: the program and its roles; the program profile; the system and its N elements, with their library pins; a draft SSP with N planned implementations; the library claims seeded where the control is in the baseline.
- **"Create program"** (ink) shows a progress state:
  - writing the program, the profile, the system and 19 elements, and the draft SSP with 370 planned implementations;
  - each line ticks, about 2s in all, or instantly under reduced motion;
  - then it lands on `#program-start`.
- **A "Simulate a failed save" link**, small and marked as a walkthrough aid, shows the real app's behaviour: the save fails, the draft is kept, and an alert says nothing was created, with Retry.

### `program-start`: Getting started (in the shell)

- **Header** (after kit): the program name, chips (PRG-2301, Air Defense, "Variant of X800 Missile v2 · Eject Launch"), facts (1 system, N elements, N controls, 6 roles) and "Program created just now".
- **The Starter Guide** (Vanta-like): a progress ring "2 of 9", then tasks with an owner, a due date and a link:
  - Choose the control baseline (done);
  - Assign roles (done);
  - Import the customer's requirements document;
  - Map requirements to controls;
  - Connect evidence sources (→ `#sources`);
  - Draft the SSP (→ `#ssp`, "370 planned implementations to describe", "Assist can draft from the product's narratives");
  - Upload the architecture diagram;
  - Plan an assessment (→ `#assessments`);
  - Submit for authorization (→ `#authorization`).

  Ticking a task updates the ring.
- **A side card**: "What the program inherits from X800 Missile version 2" (controls inherited, shared and to assess, from the real product delta where it can be read, else marked Example).
- **A toast** on arrival: "Program created".

## Priorities if you must cut (cut from the bottom)

1. All six steps working, with carried state, validation, review and create, then `program-start`.
2. The tree from the real product, the categorization suggestion, the baseline stack table, the team pickers.
3. The resulting baseline grid, the failed-save path, "Add another system".

## At 390px

- The steps rail becomes a "Step 2 of 5 · Systems" bar with a progress line.
- The side card folds under the form as a "What you're creating" disclosure.
- The footer buttons stay reachable.
- Nothing overflows.

# Control baseline: catalog, baseline, overlays, tailoring

How a program's control baseline is formed, and where each step shows in the product.

## The stack

A program's control baseline is a stack, read bottom up:

1. **Catalog.** One published catalog edition (NIST SP 800-53 Rev 5).
2. **Reference baseline.** A published profile on that catalog (Low, Moderate, High, Privacy).
3. **Overlays, in order.** Each overlay is a library record: a named set of control decisions, each with a rationale. A decision adds a control or removes one. An overlay is not tied to a baseline, so the same overlay can be stacked by any program on the same catalog edition.
4. **Program tailoring.** The program's own last layer: controls out, controls in and parameter overrides.

A system adopts one program profile and may tailor once more on top of it.

Applying a layer never guesses. An add of a control the baseline beneath already selects is recorded as **already selected** (a reaffirmation); a removal of a control it does not select is recorded as **not in the baseline**. An overlay that changes nothing where it sits is refused, in setup and by the database. A later layer can undo an earlier one (an overlay removes a control and a later one adds it back); the control's origin is then the last layer that added it.

## What is stored

Every layer is a real OSCAL profile layered on the one beneath it, authored by `author_tailored_profile`: the base imported with `include-all`, one exclusion per control removed, the catalog imported with one inclusion per control added. A stack is therefore an import chain of `profile_resolutions` joined by `base_profile_resolution_id`, at most eight layers on the reference profile.

- `control_overlays` and `control_overlay_decisions` hold the overlay and its decisions. They are written only through `save_control_overlay`, `set_control_overlay_decisions` and `publish_control_overlay`; a published overlay is immutable.
- `apply_control_overlay` authors the layer one overlay makes of a base, and `profile_overlay_applications` names the overlay behind each layer with the decisions that were already true.
- `create_program_wizard` takes `overlayIds` on each program profile, in order, and records the top of the stack in `program_reference_choices`.
- `control_overlay_rows` is the register's view. `program_control_requirement_counts` counts, per program and control, the requirements whose latest revision maps the control.

Overlays carry control decisions only. Parameter values are set in the program's tailoring. A rationale taken from Table E-1 is the decision's `rationale` text like any other: `resiliencyRationale` in `src/lib/control-overlays.ts` writes it from the framework's control links, and nothing ties the decision to those rows afterwards.

## Where it shows

- **Libraries, Overlays** (`/overlays`): the register, Create overlay, and the overlay record where a draft's decisions are added and the overlay is published. A row's eye opens Overlay preview: its state, code, what it adds and removes, how many baselines apply it, when it changed and its description. The preview is read only; the edit, the decisions and Publish are the record's.
- **Add decisions, from Table E-1.** Where the catalog edition has NIST SP 800-160 Vol. 2 Rev. 1's Table E-1 loaded (`docs/reference-seeding.md`, Transcribed frameworks), the picker filters the edition's controls by Resiliency technique, one technique at a time, each with the count of controls the table names for it (Segmentation 41, Substantiated Integrity 58). A decision that adds controls takes one rationale written for all or each control's own from the table: `Supports Realignment [Purposing, Restriction] and Segmentation [Predefined Segmentation] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).`, the techniques strongest first as the table orders them, each with its approaches. A chosen control the table does not name stops the save until it is cleared or the rationale is written. A removal's rationale is always written. Without the reference data the picker offers neither.
- **Create program, step 2.** Under each chosen baseline: the stack table (layer, type, added, removed, running count; one line a row), Add overlay, move and remove for each overlay, and Tailor for this program on top of the stacked baseline.
- **Program Overview, Control baseline.** The saved stack, with a link to the focused view.
- **Program, Control baseline** (Actions, Views; `/programs/:id/control-baseline`): one list-and-detail pane. The list is the stack: the reference baseline, then each layer with what it added and removed and the running count. Choosing a row shows the baseline after that layer, and Replay walks the rows. Beside it, the catalog at that step as a Grid or a Skyline (Ledger's `TileMap`: a mark a control, filled for one in the baseline, the brand colour for one a layer added, hollow for one a layer removed, faint for one not selected, with a key that counts each), or as a List with each control's family, status, the layer that changed it and its requirement count. A mark opens its family in the List.
- **Program, Control baseline, by resiliency technique.** A Select beside Show as reads the same view by one cyber resiliency technique of NIST SP 800-160 Vol. 2 Rev. 1 (`?technique=segmentation`, the technique's code after `technique.`). Each option and the heading count the baseline's controls at the layer shown that support the technique, of the catalog's active controls that support it in Table E-1 ("16 of 41"). The map colours only those controls (one the baseline leaves out is hollow, every other control keeps its place as a faint mark), the key counts them, and the List holds them with an Approaches column; Replay shows the count rise layer by layer. Over all controls the List has a Techniques column. The techniques a program chose for SA-24 lead the Select.
- **Program, Cyber resiliency** (Actions, Views; `/programs/:id/resiliency`): the same stack read by NIST SP 800-160 Vol. 2's ladder. Two numbers lead: the controls the baseline holds of the 265 Table E-1 names, and the approaches with nothing behind them, which narrows the view to those approaches. The layers are a stepper with Replay, and the address keeps the layer. Show as chooses Ladder (goals, objectives, techniques and approaches joined by every relation the publication prints, each with what the baseline holds of the controls behind it) or Layers (a technique a row and a layer a column, with the approaches under each technique one switch away). The ladder keeps its wires while its levels have room, down to a 1280px window with the preview open beside it, and stacks its levels in order in less, as on a phone. An approach opens its preview: what Table D-4 says of it (its definition, NIST's examples and its discussion), then the controls that support it, those in the baseline first with their requirement counts.
- **Control records.** The catalog's and the program's control record list the techniques a control supports under Cyber resiliency, strongest first, each with its approaches and how many examples NIST gives for them. A row opens in place onto the technique's definition and discussion and each approach's definition, examples and discussion (Table D-4). In a program a technique opens the Control baseline read by it. Under it, ATT&CK techniques lists the techniques Appendix F prints the control against, with the tactics, mitigations, approaches and effects, and, in a program, how many of its risks name each. The control preview carries Cyber resiliency, closed.
- **Program Controls tab.** An Origin column and filter, for a program with a recorded baseline.

`src/lib/baseline-stack.ts` is the one walker: `deriveStack` applies layers to a selection, `deriveSavedBaseline` reads a saved chain as layers, `stackAt` reads a derivation after its first few layers, and `controlStanding` says where a control stands at that step. Program setup builds its draft stack with `stackDraftOverlays` in the shape the database will author, so the tailoring editor and every count read a draft stack the same way as a saved one.

`src/lib/control-resiliency.ts` regroups the reads of `src/lib/frameworks.ts` for these screens: `techniqueControls` gives each technique the controls behind it among those a screen counts, `selectedOf` how many of them a step selects, `supportedOnce` one row a technique for a control, and `techniqueSlug` and `techniqueParam` the name a technique takes in the address. The view reads Table E-1 for the program's catalog edition once and the techniques in the framework's order; a control record reads its own links alone.

`supportedGuidance` joins a control's techniques and approaches with what `itemGuidance` in `src/lib/frameworks.ts` reads of each: the definition, the one-line description, the discussion and the examples Table D-4 prints. `src/lib/control-threats.ts` regroups Appendix F's rows for a control into one line a technique (`controlThreats`) and counts a program's risks by technique identifier (`risksByTechnique`). A control record reads the techniques and approaches once for every control.

## SA-24: the program's resiliency choice

No reference baseline selects SA-24, Design for Cyber Resiliency: a program tailors it in and sets its five parameters (`sa-24_odp.01` to `.05`: goals, objectives, techniques, implementation approaches, design principles) in the same tailoring. Setup offers their values from the cyber resiliency framework (`nist-sp800-160v2r1-cref`): 4 goals, 8 objectives, 14 techniques, 50 approaches under their techniques, and 5 strategic and 14 structural design principles. A value is stored as the item's title, since an OSCAL parameter value is text, so the authored profile reads `"values": ["Anticipate", "Withstand"]`.

`program_resiliency_choice(p_program_id)` reads the choice back: `selected` when a control baseline of the program selects SA-24, and for each of the five lists the codes of the items its effective values name, in the publication's order, with `unmatched` for the values that name none. A value is effective as `author_tailored_profile` resolves it: the nearest layer of the stack that sets the parameter, else the catalog's own. A value names an item when it is the item's title, whatever its case and the space around it, and the item is of the parameter's kind. A program with several program profiles answers as one: every item any of them names. The function runs as the caller and refuses a program the caller cannot read. `src/lib/resiliency-choice.ts` holds the read (`useProgramResiliencyChoice`) and what each parameter may name (`resiliencyVocabulary`).

The chosen values show on the profile record's Tailoring tab, under Parameters and Inspect parameters. The program's control record prints the control with its assignment placeholders and the catalog's values, not the program's.

## Demo

`npm run seed:demo-baseline -- --tenant <id> --account <email> --apply` gives WS-X90 (PRG-1090) its stack from the archived fixture: High (370), CNSSI 1253 allocation (554), Mission Assurance (549), Deployed Platform (550), Customer A (546). The CNSSI allocation is a third-party extraction the fixture marks as not authoritative. WS-X90's systems keep the archived selections their SSPs were imported with; the stack is recorded as the program's reference choice.

Read by technique, every count on WS-X90 rises at the CNSSI 1253 allocation and holds after it: Segmentation 7 of 41 in High and 16 of 41 from there on, Substantiated Integrity 20 then 35 of 58, Unpredictability 1 then 2 of 7, Dynamic Positioning 0 then 1 of 8. WS-X90 does not select SA-24, so its Select is one list.

The Cyber resiliency view says the same of the whole ladder: High alone holds 64 of the 265 controls Table E-1 names, the CNSSI 1253 allocation adds 70 and removes 3, and the count stays at 131 through the three layers after it. 11 of the 50 approaches have no control behind them in WS-X90's baseline (21 at High alone).

On a control: SC-7 supports Segmentation through Predefined Segmentation (13 examples) and counters 14 ATT&CK techniques. AC-2(8) supports Adaptive Response through three approaches (14 examples) and Privilege Restriction through one (6). Table E-1 names 265 controls and Appendix F 186; 181 are named by both. No risk of WS-X90 names an ATT&CK technique yet, so the Risks column reads 0.

## Checks

`src/lib/baseline-stack.test.ts`, `src/lib/control-overlays.test.ts` and the draft-stack cases in `src/lib/program-wizard-reference.test.ts` run in `npm run test:app`. `scripts/test-program-wizard-backend.mjs` and `scripts/test-system-baselines-backend.mjs` (the eight-layer limit) run against the local stack. `src/lib/control-resiliency.test.ts` and `src/lib/resiliency-choice.test.ts` run in `npm run test:app` too, and `src/lib/control-overlays.test.ts` also covers the wording of a rationale taken from Table E-1. `src/lib/control-threats.test.ts` runs in `npm run test:app` as well. `src/lib/resiliency-ladder.test.ts` derives the Cyber resiliency view's numbers from the pinned transcription, the pinned High profile and WS-X90's four layers. `supabase/tests/program_resiliency_choice.sql` is the choice's schema test, and `node scripts/test-resiliency-choice-backend.mjs` runs against the local stack.

## Not built yet

- Combining two baselines (High and Privacy) into one stack.
- Changing a program's overlay stack after creation.
- Parameter values in an overlay; deleting a draft overlay; a new version of a published overlay.
- A backend suite for the overlay commands and for program creation with `overlayIds`, and the screen checks (`test:patterns`, `test:app-a11y`) over the new screens.
- The resiliency choice of one system or one program profile; a system's own tailoring of SA-24.
- A program's parameter values in the control's printed statement.
- The technique's count on each row of the layers list; the step and Show as in the address beside the technique.
- Every control of Table E-1 in one choice, or several techniques at once, in Add decisions: a technique's controls reach the server as a list of ids, and the table's 265 pass what one request holds.
- Screen checks (`test:patterns`, `test:app-a11y`) over the view read by a technique, the Cyber resiliency Section and the Add decisions filter.
- ATT&CK techniques in the control preview; a way from a control's Risks count to the risks it counts; the discussions NIST prints for the goals and objectives, and Table D-5's architectural layers for each approach.
- Screen checks of their own for a control's two NIST SP 800-160 Sections and the Cyber resiliency view: `test:patterns` and `test:app-a11y` reach them through the inventory sweep on a program with no baseline, and no case opens a guidance row, steps the approach preview or reads the ladder with data.
- On the Cyber resiliency view: the view read against the techniques a program chose for SA-24 alone (it marks them, and counts every technique); the layer in the address is its place in the stack, so a shared link holds only while the stack keeps its order.

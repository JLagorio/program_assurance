# System view: one element, one shape

Design proposal · September 15, 2026 · All three phases landed the same day; this document is the record of what was built and why.

## The story this serves

> As a systems security engineer, I want to select validated policies, procedures, controls, requirements, implementation narratives and evidence from a versioned master library and apply them to a host system, subsystems, LRUs/components, or individual controls and requirements, so that common security work is reused consistently while program-specific differences remain explicit and traceable.

Four nouns and one verb. The **library** (versioned, validated), the **targets** (system, subsystem, LRU, control, requirement), the **verb** (apply), and the two outcomes (reuse that is consistent; differences that are explicit and traceable). Every screen that touches the system tree should answer one of those, in that vocabulary, or it should not be there.

## What is on screen today

Two pages, three surfaces, three different shapes for the same element. Verified on the running app against PRG-1041 on September 15.

| Question the reader has               | Tree row on `?tab=System`                                | Preview panel (eye or a cell)                                                                                   | Record `/systems/:id`                                                                           |
| ------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| What is this                          | name link, code, type icon                               | code in the header, name as a heading, Type / Owner / Boundary / Parent facts                                   | name as the title; rail shows Code and System type as raw enums (`information_system`, `other`) |
| How is it categorized                 | three badge columns (Conf. / Integ. / Avail.)            | a "CIA impact" section with a provenance sentence per row, then a "Contained systems" roll-up of the same three | rail shows `high` / `moderate` as plain text, boundary only; nothing for a nested element       |
| Which controls apply                  | a "Controls" count column and a "Baseline source" column | a "Controls" tab: four counts, then the full Control baseline block                                             | a "Baseline" tab: the same Control baseline block                                               |
| Which assessment scopes               | a "Scopes" column with "N below" and "Separate baseline" | a "Scopes" tab grouped by owning element                                                                        | a "Scopes" tab, flat table, boundary only, counted by a different rule                          |
| What is inside                        | the tree rows                                            | "Contained systems" (an impact roll-up, not the children)                                                       | a "Composition" tab: the same tree, rooted here                                                 |
| Which requirements are allocated here | nothing                                                  | nothing                                                                                                         | nothing                                                                                         |
| What was applied from the library     | nothing                                                  | nothing                                                                                                         | a "Components" tab (boundary only): raw `system_components` references                          |
| What proves it                        | nothing                                                  | nothing                                                                                                         | nothing                                                                                         |

The specific confusions, each with its cause:

1. **The preview opens on a different tab depending on which cell you clicked.** Code and the three impact cells open Overview, the Scopes cell opens Scopes, the Controls and Baseline source cells open Controls. One row has five different click results plus the name link. `program-systems-tree.tsx:152-260`.
2. **The record's tab list changes with a flag.** A boundary shows eight tabs (Overview, Composition, Components, Inventory, Scopes, Baseline, Security plans, SSP); everything else shows three (Overview, Composition, Baseline). The same kind of thing has two anatomies. `program-record.tsx:166-185`.
3. **Three names for one thing.** "Controls" (tree column and preview tab), "Baseline source" (tree column), "Baseline" (record tab), "Control baseline" (the block's heading). `SystemBaseline` renders identically in the preview's Controls tab and in the record's Baseline tab.
4. **Scopes leak into composition.** A scope is "a categorized subset of a system used for implementation or assessment scoping" (schema comment). It is an assessment-time idea, yet it is a tree column, a preview tab and a record tab. The tree attributes a scope to `composition_node_id ?? system_id`; the record filters by `system_id` alone, so the two surfaces can disagree about which element owns a scope.
5. **The rail shows the model, not the fact.** `information_system`, `high`, `other`. Everywhere else the same values are badges. `program-record.tsx:110-122`.
6. **The record's Overview is filler.** A description, two "Open parent / Open boundary" links, and a boilerplate sentence. The facts a reader wants (owner, categorization with provenance, parent, boundary) are in the preview instead.
7. **Nothing on any surface answers the story.** No surface shows what was applied from the library, at which version, whether it is applied here or inherited, or what differs here. The program's "Library" tab is a read-only list of `system_components` references and cannot apply anything. The one library-to-program link in the schema, `system_components.defined_component_id`, is never written by the UI.
8. **The tree is mounted at three URLs** (program System tab, `/programs/:id/composition`, the record's Composition tab) and the tab state on the record is `useState`, so a link cannot land on a tab.
9. **Two rows called "Atlas payments platform"** (the boundary `atlas-prod` and the root element `CN-0001`) with nothing but the code to tell them apart. That is a data artifact of the September 13 migration, but the tree should still make the boundary read as the boundary.

Underneath all nine: the surfaces were assembled from tables (`systems`, `scopes`, `scope_baselines`, `system_components`, `ssp_revisions`, `configuration_baselines`) rather than from the reader's questions. That is the rule from September 2 ("the data must not shape the UI") being broken by the data layer that replaced the browser stores.

## The principle

At any element of the tree, at any level, the reader asks the same six questions in the same order:

1. **What is this?** identity, where it sits, how it is categorized.
2. **What applies here?** the baseline profile and every library item, each with its version, and whether it was applied here or inherited from above.
3. **What must it do?** the controls in effect and the requirements allocated to it.
4. **What is different here?** controls added or excluded with a rationale, local narratives that diverge from the library's, a newer library version available.
5. **What proves it?** evidence and implementation narratives at this element.
6. **What is inside?** the children.

So: **one element anatomy at every level, and the preview is the record's first screen, not a different view.** A host system, a subsystem and an LRU are the same kind of record with the same sections; the type is a fact, not a different page. Boundary-only material is limited to what genuinely exists only at a boundary (the SSP).

## Vocabulary

| Say                                                                                                                | Not                                                      | Why                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| **Element** for a row; **System**, **Subsystem**, **Component** as its type                                        | "system element", "node", "scope"                        | the story's words; the type column carries the level                |
| **Baseline** for the control set adopted from a profile; **Controls** for the effective set                        | "Baseline source", "Control baseline"                    | one word per idea                                                   |
| **Applied here** / **Inherited from CN-0100**                                                                      | "Explicit system adoption" / "Inherited system adoption" | the reader's words, with the source named                           |
| **Confidentiality · Integrity · Availability** as three badge columns, on every surface                            | a merged "H · H · M" cell                                | Josef, September 15: the CIA categorization must read per dimension |
| **Library** for the three libraries in the nav (Catalog, Profiles, Components) and what has been applied from them | a "Library" tab that lists component references          | the tab should mean what the nav means                              |
| **Add from library** for the verb                                                                                  | "Adopt", "Change baseline", "Add scope"                  | one verb for the whole story; the dialog asks what and where        |
| **Product** for a library system definition, **Configuration** for one way it is built, **Variant** for the program system created from a configuration | "template", "instance", "product line"                   | Josef, September 16: product → configuration → variant; the variant is where the customer's requirements live |

Scopes keep their name, but they move to the Assessments area of the program, where scoping is decided.

## The tree (program › System)

Columns, in order. Each one answers a question above; nothing else earns a column.

```
Element                           Code        Type        Conf.  Integ.  Avail.  Baseline                     Controls  Requirements   ⋯
▾ ⛨ Atlas payments platform       atlas-prod  System      High   High    Mod     NIST High · applied here     618       6
  ▾   Atlas payments platform     CN-0001     Other       —      —       —       Inherited from atlas-prod    618       —
    ▾ Ground control segment      CN-0100     Subsystem   High   High    High    Inherited from atlas-prod    618       2
      ▾ gcs-app-01                CN-0110     Hardware    —      —       —       Inherited from atlas-prod    618       —
```

- **Element**: type icon, the name as a `TextLink` to the record, the boundary shield. Unchanged.
- **Code**: `Id` with the hover eye. The eye is the only way into the preview besides the row itself.
- **Type**: the `system_type` label. Visible by default; it is how the reader tells a subsystem from an LRU.
- **Conf. / Integ. / Avail.**: three badge columns, as today (`ImpactBadge`, tone by level), with the provenance in the tooltip ("from assessment scope"). `—` when unrecorded, `Mixed` when scopes conflict. Josef's call on September 15: the CIA categorization reads per dimension, so this row carries three tone badges and the one-status rule yields to it. The cells are plain cells, not buttons into the preview.
- **Baseline**: profile name plus `applied here` or `inherited from <code>`; `Not set` otherwise. Replaces the "Baseline source" column and the "Scopes" column.
- **Controls**: the count of the effective set. Unchanged.
- **Requirements**: the count of `requirement_allocations` whose `system_id` is this element. New; it is the first time the tree shows the story's second target.
- **Actions**: Add child, Edit, Add from library (phase 2), Allocate requirement (phase 2).

Row behavior, exactly two: clicking the row (or the eye) opens the preview at its top; clicking the name opens the record. The per-cell buttons that opened the preview on a chosen tab go away.

The Scopes column goes. The "Scope" and "Scope differs" sub-labels under the impact badges that are staged in the working tree today already point this way.

## The preview (the panel)

No tabs. The sections are the record's, in the record's order, each one line where a line is enough.

```
┌ CN-0100 · Subsystem                               [+ Add child] [Edit] [×] ┐
│ Ground control segment                                                     │
│ Atlas payments platform / Ground control segment                           │
│                                                                            │
│ Owner             Unassigned                                               │
│ Confidentiality   [High]   from assessment scope                           │
│ Integrity         [High]   from assessment scope                           │
│ Availability      [High]   from assessment scope                           │
│ Boundary          Atlas payments platform                                  │
│                                                                            │
│ Baseline          NIST SP 800-53 High · inherited from atlas-prod          │
│                   618 controls · 0 changed here             [Change…]      │
│ Requirements      2 allocated here · 5 in everything inside  [Open]        │
│ From the library  Company A Profile v1 · applied here       (phase 2)      │
│ Contains          gcs-app-01 · gcs-app-02 · 12 more         (drill in)     │
│                                                                            │
│ Open record →                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

Each `Contains` child is a link that swaps the panel to that child, the way the September 2 sheet did. The full control table does not render in the preview; it lives on the record's Controls tab. The "Contained systems" impact roll-up folds into each dimension's tooltip ("highest below: High").

## The record (`/programs/:id/systems/:id`)

One anatomy at every level. The tab is in the URL.

```
Programs › PRG-1041 › Atlas payments platform › Ground control segment
Ground control segment                                  [Add from library] [Edit] [⋯]
──────────────────────────────────────────────────────────────────────────────────────
Overview · Controls · Requirements · Library · Evidence · Inventory · SSP
                                                                     ┌ Properties ───────────┐
 (tab body)                                                          │ Code       CN-0100    │
                                                                     │ Type       Subsystem  │
                                                                     │ Confidentiality [High]│
                                                                     │ Integrity       [High]│
                                                                     │ Availability    [High]│
                                                                     │   from assessment scope│
                                                                     │ Owner      Unassigned │
                                                                     │ Boundary   → link     │
                                                                     │ Parent     → link     │
                                                                     │ Lifecycle  Planned    │ (boundary only, as facts)
                                                                     │ Authorization In prog.│
                                                                     └───────────────────────┘
```

- **Trail** names every ancestor as a link, so the reader knows where they are without a Parent link in the body.
- **Rail** carries the facts, as badges and links, not enums. Lifecycle and authorization appear when the element has them; a fact that does not exist is simply absent, which is not the same as a different anatomy.
- **Overview**: the description, then the tree rooted here with the same columns as the program tree. This replaces the Composition tab; the tree is the spine and it is what a reader landing on a subsystem wants to see.
- **Controls**: replaces Baseline. A header block with the baseline (profile, applied here or inherited from, count, Change…), then the effective set as a `DataTable`: Control, Title, Source (`From profile` / `Added here` / `Excluded here`, with the rationale on hover), Implementation (the boundary SSP's status when one exists), Requirements (count mapped). A `Changed here` preset answers question 4. A row opens the catalog control in the existing `ControlInspector` panel; where the boundary SSP has an implementation, the row links to it.
- **Requirements**: allocated to this element, with a `Include everything inside` toggle. Columns: Requirement, Statement, Controls, Allocated (rationale on hover). A row opens the requirement record. `Allocate…` is phase 2.
- **Library**: what was applied here from the library and what is inherited from above. Phase 1 seeds it with the `system_components` rows that carry a `defined_component_id` (definition, version, applied at); the old Components tab retires into it. Phase 2 makes it the story's screen.
- **Evidence**: evidence linked to implementations or requirements at this element. Phase 2.
- **Inventory**: the existing collection, at every level. An LRU has serial numbers; this was never boundary-only material.
- **SSP**: boundary only, the one legitimately boundary-only tab. The Security plans list (revisions) folds into it; `SspAssembly` already carries the revision select.

Dropped: Composition (into Overview), Components (into Library), Scopes (to Assessments), Baseline (into Controls), Security plans (into SSP). `/programs/:id/composition` redirects to `?tab=System`.

## Add from library, the verb

One action, one dialog, reachable from three places: the element (record header, preview header, row kebab), the program's System tab toolbar (targets chosen in the dialog), and a control row on the Controls tab (target = this control at this element). It is the kit's `PickerSheet`: frame one chooses, frame two confirms.

```
Add from library
1  Source      ● Profile (control baseline)   ○ Component definition   ○ Policy or procedure (later)   ○ Requirement (later)
2  Item        [ Search the library… ]        Company A Profile          v1 · published · 12 controls
3  Apply to    ● This element   ○ This element and everything inside   ○ Specific controls…
4  Rationale   [                                                                                  ]
                                                                                   [Cancel]  [Apply]
```

What it writes on today's schema:

- **Profile → element**: the existing `adopt_system_baseline` RPC. Already atomic, idempotent, rationale-gated, authors a real profile with `profile_rules`. Nothing new.
- **Component definition → element**: a `system_components` row with `defined_component_id`, and `component_contributions` seeded from the revision's `defined_component_implementations`. One new RPC, `apply_component_definition`, so the seed is atomic and revision-pinned. The version is traceable through `defined_components.component_definition_revision_id` without a new column.
- **Policies, procedures, requirement definitions, evidence uses, update review**: `docs/guides/inheritance-model.md`, phase 3. Its records table is the gap list.

Traceability, on the Library tab and the control row, always the same four facts: version, applied at, applied by, rationale. Differences, always the same three flags: `Changed here` (a tailoring rule or a local narrative that diverges from the definition's), `Update available` (a newer published revision of the same definition), `Inherited` (applied on an ancestor, resolved here).

## Kit or bespoke

Nothing in phase 1 needs a new kit part: `DataTable` (tree mode, presets, `onRowClick`), `Shell.Panel`, `Inspector.Group`, `KeyValue`, `Badge`, `Tabs`, `Section`, `Tooltip`, `TextLink`, `Breadcrumb` all exist. `ImpactBadge` stays what it is, a `Badge` with a tone, in the prototype. Phase 2's dialog is `PickerSheet` as its story shows.

## Phasing

**Phase 1, the shape, no schema. Landed September 15.** Vocabulary, the tree's nine columns and its two click results, the preview without tabs, the record's one anatomy with the tab in the URL, the rail as facts, Scopes off these surfaces and onto the program's Assessments tab, the composition route redirecting. Every read comes from tables that exist; the new derivations are the requirement count per element and the baseline's name.

**Phase 2, the verb. Landed September 15.** One migration (`20260915010000_library_reuse.sql`), four commands, the surfaces.

- **The Library tab** (`system-library.tsx` over `src/lib/library-use.ts`): the element's effective baseline and every component definition applied here, with version, applied at and by, rationale, and the three flags: Inherited (the baseline resolved from above), Update available (a newer published revision of the same definition), Changed here (a narrative whose text no longer matches the library's). Include everything inside lists the elements inside too. A row opens a panel with the facts, the narratives and their Changed here marks, links to the definition and the instance, and the update review.
- **Add from library** (`add-from-library.tsx` on `PickerSheet`): frame one chooses a source (Component definition · Profile · Requirement definition) and an item at its latest published version; frame two chooses the targets (this element · this element and everything inside), shows the matrix of claims by target with Will seed, Not in baseline, No draft SSP and Already applied per cell and an exclusion checkbox on every seedable cell, takes the rationale, and applies. Opened from the element's header, the preview's header, the row kebab, a control row on the Controls tab (pinned to that control) and the Requirements tab (opened on requirement definitions).
  - Profile → the existing `adopt_system_baseline`; "everything inside" lists elements with their own adoption and offers to clear each.
  - Component definition → `apply_library_source`: per target, one `system_components` row pinned to the defined component, with `applied_rationale`, `applied_at`, `applied_by` and `assignment_id`; one `component_contributions` row per claim whose control is in the boundary's draft SSP selection (creating the `implemented_requirements` row as planned), each stamped with `library_implementation_id`; library evidence proposed as `evidence_uses`; one `library_assignments` row with a `library_assignment_targets` row per element and claim saying what was written or why not (accepted, excluded, not_in_baseline, no_ssp, already_applied). Same request id reconciles; element CAS refuses stale revisions.
  - Requirement definition → `adopt_requirement_definition`: one program requirement pinned to the exact revision (reused when the program already adopted it), allocated to the targets.
- **The Requirements tab** gains Allocate… (a picker over the program's requirements not yet allocated here, one explicit allocation each) and Add from library, and lists one row per requirement and element (the latest allocated revision), not one per historical revision.
- **The Evidence tab** (`system-evidence.tsx`): evidence uses proposed by applied library items, decided through `decide_evidence_use` (accepting links the exact version as `implementation_evidence` or `requirement_evidence`; not applicable needs a reason), beside evidence already linked to this element's narratives and allocated requirements.
- **The program's Library tab** (`program-library.tsx`): every library item applied anywhere in the program, once per definition and version, with the elements it is applied to, plus each explicitly adopted baseline; a row opens the definition at that version.
- Generic writes cannot fake an application: `guard_library_application` refuses `defined_component_id`, `assignment_id`, the applied facts, `definition_revision_id` and `library_implementation_id` outside the commands.

**Phase 3, the rest of the story. Landed September 15, on the same migration.**

- **Sources beyond components.** `component_definitions.category` (organizational baseline · host platform · catalog product) and, on a version, `effective_from`, `review_due`, `conditions`, `consumer_responsibilities`. The component library index filters by category; the version's rail shows the conditions and responsibilities.
- **Contributions and coverage.** A claim carries `coverage` (full · partial · conditional), `coverage_rationale`, `consumer_responsibility`, and may target a requirement definition revision instead of a control (`control_id` nullable, one target required). `defined_component_evidence` attaches library evidence to a claim.
- **Reusable requirements.** `requirement_definitions` and `requirement_definition_revisions` (draft → published, immutable once published); `engineering_requirements.definition_revision_id` records adoption. The Requirements library (`/library/requirements`, `library-requirements.tsx`) authors, versions and publishes them and lists who adopted each.
- **Assignments and resolution.** `library_assignments` (accepted → superseded) and `library_assignment_targets`: the exact expansion the reader confirmed and its per-target, per-obligation outcome. The matrix in Add from library is what writes them.
- **Evidence across programs.** `evidence_uses`: one artifact version, many consumers, each with its own decision and rationale.
- **Update review** (`library-update-review.tsx` over `update_library_assignment`): when a newer published version exists, the review lists each narrative beside the new text with its outcome (takes the new narrative · kept, changed here · no longer covered, kept · new, will seed), takes a rationale, re-pins the instances by component name, supersedes the old assignment and records the new one with its targets; a narrative in a published SSP revision is reported as conflicting and left alone.
- Verified by `scripts/test-library-reuse-backend.mjs` (the four commands against a disposable workspace: guards, seeding and exclusions, idempotent requests, CAS, already applied, evidence decisions, update keeping local changes, adoption by reference) and `scripts/test-add-from-library.mjs` (the surfaces end to end).

Not built, still the guide's: organization membership as a suggestion source, provider dependencies as a relationship with context conditions, the confirmation matrix across several programs at once, and the coverage percentage with its denominator rules. Those need the organizational and provider records the guide describes and a decision on how they relate to the canonical tree.

## Phase 1 files (as landed)

- `src/lib/system-assurance.ts` — `requirementCount`, `subtreeRequirementCount`, `baselineTitle`, `baselineDraft` on the row; `baselineSource()`; optional `allocations`, `resolutions`, `profiles` inputs. Tests in `system-assurance.test.ts`.
- `src/components/prototype/use-system-assurance.ts` — the one hook every system surface reads.
- `src/components/prototype/program-systems-tree.tsx` — the nine columns, `onRowClick` into the preview, the eye on the code, Add child and Edit in the kebab and the preview header. No scopes.
- `src/components/prototype/system-assurance-details.tsx` — the preview as sections (facts with the three CIA rows, Baseline, Requirements, Contains with drill-in-place); `ancestorElements`, `containedElements`, `impactProvenance`.
- `src/components/prototype/system-baseline.tsx` — `SystemControls`: the baseline block and the effective set as a `DataTable` with Source, Implementation and Requirements, the Changed here and No implementation presets, a row opening the control inspector; `BaselineDialog` unchanged.
- `src/components/prototype/system-requirements.tsx` — the Requirements tab with Include everything inside.
- `src/components/prototype/program-record.tsx` — `SYSTEM_TABS`, `systemTab()` (retired names land where their content went), the trail of ancestors, `SystemProperties` in the rail, the Library and Inventory tabs at every level, SSP with the revisions folded in; the frame takes `trail`, `actions`, `properties`.
- `src/routes/programs.$programId_.systems.$scopeId.tsx` — the tab in the URL. `src/routes/programs.$programId_.composition.tsx` — a redirect to `?tab=System`. `program-workspace.tsx` — the Views menu entry is gone.
- `src/components/prototype/assessment-browser.tsx` — the Scopes register under the program's Assessments tab, where scopes now live.
- `scripts/test-system-assurance-view.mjs` — the browser test for the tree, the preview, the record, the redirect and the scopes home.

## Verification

1. `npm run typecheck` and `npm run lint` at the root.
2. `node scripts/test-system-assurance-view.mjs` against `http://127.0.0.1:8080` (it builds a disposable workspace).
3. A walk of the three surfaces on PRG-1041, screenshots at 1700 wide: the tree with the nine columns; the preview from the eye and from a row click landing on the same first section; the record for `atlas-prod`, `CN-0001` and `CN-0100` showing the same tab set with SSP only on `atlas-prod`; `?tab=Controls` deep-linking; `/composition` redirecting.
4. Counts agree across surfaces: the Controls count on the row, in the preview and on the Controls tab; the Requirements count on the row and on the Requirements tab.

## Decided, September 15

- **The CIA categorization stays per dimension**: three badge columns in the tree, three facts in the preview and the rail. Josef's call against the merged cell first proposed.
- **Scopes leave the composition surfaces** and live under the program's Assessments tab. The categorization provenance ("from an assessment scope") stays as a fact on the element.
- **The rooted tree lives on the element's Overview**, not on its own tab.
- **Boundary-only means SSP only.** Inventory and Library appear at every level; Lifecycle and Authorization are rail facts when present.
- **The program's Library tab** stays as it is until phase 2 turns it into the roll-up.

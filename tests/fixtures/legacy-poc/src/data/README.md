# WS-X90 seed

`wsx90-platform-seed.json` is the WS-X90 dataset the application boots from.

**Do not hand-edit it — regenerate with `node scripts/gen-wsx90-seed.mjs`.**

SHA-256: `4221c55b7c7892eefc2d175f35883064c06cfe699874d4c8efec2850911803b3`

`src/lib/platform-seed.ts` validates the file at import time and
`platform-ingestion.ts` registers it in the existing program stores before saved
edits are restored. No separate program layout or parallel workspace store is
used.

## What is real and what is fictional

The two halves of this file have different standing, and the split is recorded
in the data itself (`dataset_metadata.reference_layer`, and an `authoritative`
boolean on every reference source).

**Fictional — the program.** Aurora Defense Systems, the WS-X90 Sentinel
Mission System, its 6 subsystems and 20 LRUs, 640 requirements, 546 control
implementations, 368 evidence artifacts, 2 assessments, 420 assessment results,
52 findings, 40 risks and 40 POA&M items are entirely invented. They are copied
through from `docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json`
byte for byte; the generator refuses to write if any of them changed.

**Real — the framework reference layer.**

| Source                                       | Authority                                | Release    | Authoritative |
| -------------------------------------------- | ---------------------------------------- | ---------- | ------------- |
| SP 800-53 Rev 5 control catalog (OSCAL)      | NIST                                     | 5.2.0      | yes           |
| SP 800-53A Rev 5 assessment procedures       | NIST                                     | 5.2.0      | yes           |
| SP 800-53B Rev 5 control baselines           | NIST                                     | 5.2.0      | yes           |
| Control Correlation Identifier list          | DISA                                     | 2024-01-10 | no — mirror   |
| CNSSI 1253 (2022) baselines, text extraction | CNSS publication, third-party extraction | 2022       | **no**        |

NIST and DISA publications are US Government works. The CCI bytes came from a
public mirror rather than DISA Cyber Exchange, so the CCI source carries
`authoritative: false` here and in `src/lib/cci-catalog.ts` — the content is
DISA's, the mirroring is not. The CNSSI 1253 selections
and parameter values come from a text extraction of the published tables, not
from an official CNSS machine-readable release, so every record that rests on
them carries `authoritative: false`. Nothing in this file claims a synthetic
`CCI-DEMO-*` identifier; the previous revision's placeholder datasets are listed
under `dataset_metadata.superseded_reference_datasets`.

## The control set is derived, not authored

Earlier revisions shipped a hand-listed 68-control starting selection and a
74-control "effective" set that nobody had actually resolved. The profile now
carries the output of the documented pipeline, run against the real corpus:

| Stage                                               | Result                                    |
| --------------------------------------------------- | ----------------------------------------- |
| catalog                                             | 1196 controls and enhancements            |
| starting baseline — SP 800-53B **High**             | 370                                       |
| CNSSI 1253 allocation at C=high, I=high, A=moderate | 554 (+201, −17)                           |
| named overlays (3)                                  | 546 (+1 added, 7 reaffirmed, 9 withdrawn) |
| program tailoring                                   | 546 (none authored)                       |
| effective control set                               | **546**                                   |

The `High` starting baseline follows from the system's categorization high-water
mark. Every effective control carries a `selection_trail` in
`profiles[0].control_derivations`, so "why is SC-7(21) in my baseline?" is
answerable from this file alone, and `profiles[0].tailoring_events` replays the
same 235 decisions in order. CNSSI 1253's own NSS parameter values are carried
as ODP starting values on the 147 effective controls that have one.

### Reference joins per effective control

- **2093** SP 800-53A Rev 5 assessment-objective ids, covering all 546 controls.
  These are exactly the objective nodes `src/lib/nist-control-text` ships: the
  prose-less control-level OSCAL containers that generator unwraps are not cited
  here, so every id resolves. `src/lib/platform-seed.test.ts` pins that.
- **2442** DISA CCI identifiers, covering 545 of 546 (IR-7(1) has no Rev 5 CCI
  reference in the 2024 list).

Only CCI references titled "NIST SP 800-53 Revision 5" are joined. The DISA list
also carries Rev 4, Rev 3 and **SP 800-53A Revision 1** references; there is no
CCI-to-SP 800-53A Rev 5 linkage in the source, so none is asserted.

### Two resolved conflicts

1. **System categorization.** `systems[0]` says C:high / I:high / A:moderate
   (overall high); `platform/security-configuration-example.json` says H-M-M.
   The system record wins — it is the record the application reads and is
   internally consistent with `overall: high`, while the configuration example
   is a derived illustration built on a self-labelled synthetic allocation table
   and is not shipped. The decision is recorded at
   `profiles[0].derivation.categorization_resolution`.
2. **CNSSI versus SP 800-53B.** For a national security system CNSSI 1253
   supplies the baseline in place of the SP 800-53B allocation, so it is applied
   as an ordered delta: 201 additions and 17 withdrawals. Sixteen of the 17 are
   availability-driven (A=moderate drops the high-availability contingency
   enhancements); the seventeenth, **IA-12(5)**, is not selected by CNSSI 1253
   for any objective at any level, which is the single place the extraction and
   SP 800-53B disagree — see `cnssiBaselineDivergence` in
   `src/lib/cnssi-1253.ts`. All 17 stay visible in `derivation.withdrawn`. One of
   them, PE-18, is reinstated by the Deployed Platform overlay.

### The authoring gap is closed

All **546** effective controls now have an authored implementation, so
`derivation.authoring_gap.controls_without_authored_content` is **0** and every
row in `control_derivations` carries `authoring_status: "authored"`. The 472
controls the re-derivation added were authored in a later pass on top of the
original 74: 520 further requirements, 472 further implementations and 278
further evidence artifacts, plus a second assessment (`ASM-2026-002`) with its
300 results, 36 findings, 24 risks and 24 POA&M items.

`implementation_status` is the program's own claim per control, not a record of
whether anything was written: 159 `implemented`, 213 `partially-implemented`,
136 `planned` and 38 `not-implemented`. Five of those `implemented` rows read
`partially-implemented` until the closed findings FND-021, FND-024, FND-026,
FND-039 and FND-041 were reconciled with them: a finding closed on a passing
retest inside the assessment window leaves the implementation in its remediated
state, so the narrative names what changed and when instead of describing the
old gap in the present tense. AC-17(4) is the one closed-finding control that
stays `partially-implemented`, because a second gap the findings never covered
— the need code is not a required field on the LRU-007 session record — is
still open, and its narrative says so. A `not-implemented` control here is an
authored position — the program has not built it yet — and no longer means a
missing record. The counter stays in the derivation so that a future
re-resolution which adds controls reopens the gap visibly.

## Regenerating

```
node scripts/gen-wsx90-seed.mjs
```

The generator is deterministic — no wall clock, no randomness, no generated
identifiers — so a clean run reproduces the SHA-256 above. It reads only
`docs/examples/weapons_system_oscal_dummy/`, which is git-ignored; if that
corpus is missing the generator fails with the command needed to rebuild it. It
also refuses to write unless the overlays and the tailoring events both replay
to the same effective set, every implementation and requirement still names a
selected control, and the fictional program records are unchanged.

After regenerating, update the SHA-256 above and the one in
`src/lib/platform-structure.test.ts`.

## Deliberate edits to carried-forward content

Two fields are NOT byte-identical to the upstream fictional seed, on purpose:

- `profiles[0].tailoring_rationale` is rewritten to describe the pipeline that
  now actually produced the set. The upstream sentence ("Synthetic example of
  layered tailoring…") described a hand-listed 74-control set that no longer
  exists.
- The three named overlays gain `resolved_adds`, `reaffirmed` and
  `resolution_note`. Their authored `adds`, `removes`, ids, names, types and
  rationale text are unchanged and in their authored order.

One further edit was made to content the original 16-item program carried, but
in the **upstream authoring file** rather than in the generator — so the shipped
seed and `platform-seed.json` still agree byte for byte, and the change is
recorded here because nothing else would show it:

- Nine milestone statuses — `POAM-005-M1`…`M3`, `POAM-010-M1`…`M3` and
  `POAM-015-M1`…`M3` — were changed from `"complete"` to `"completed"`. All
  three POA&M items are themselves `status: "completed"`, but
  `platform-assurance.ts` promotes a milestone to `Completed` only on the exact
  string `"completed"` and falls through to `Planned` for anything else, so the
  nine rendered as Planned inside an item the same file rendered as Completed.
  `"completed"` is the spelling the other 120 milestones already used; `"complete"`
  was a typo in three records, not a fourth state. This changes what those nine
  rows display — Planned before, Completed after — and nothing else: no date, no
  title, no POA&M status moved with it, and the four pinned seed warnings
  (`pass-without-evidence` 23, `fail-without-evidence` 6,
  `closure-without-passing-retest` 3, `undated-milestone` 48) are unaffected,
  since none of the nine carries a target date either way.
  `src/lib/platform-seed.test.ts` now pins both the milestone status vocabulary
  (`planned`, `in-progress`, `completed` — nothing else) and these nine ids, so
  the spelling cannot drift back unnoticed.

## What the app's own validation does not check

`validatePlatformSeed` in `src/lib/platform-seed.ts` is the validation a reader
of this application sees, and it returns `errors: []` on this file. That is not
the same as "the dataset is internally consistent". Two invariants that the
generators enforce have **no rule at all** in the app validator, so a reader who
trusts the app's clean bill of health would draw a conclusion the data does not
support:

- **Cause before effect between evidence and results.** No rule compares an
  artifact's `collected_at` with the `assessed_on` of a result that cites it. The
  invariant — an assessor cannot have relied on an artifact that did not yet
  exist — is enforced only in `scripts/gen-wsx90-campaign.mjs` (which refuses to
  write a campaign row that breaks it) and ratcheted in `scripts/gen-wsx90-seed.mjs`
  (which pins the pre-existing debt at 37 rows and lets it shrink, never grow).
  Delete both generators and nothing in the shipped application would notice the
  rule was gone.
- **Cause before effect in the POA&M layer.** No rule stops a milestone reading
  `status: "completed"` with a `target_date` in the future or with no completion
  date at all. That invariant is likewise enforced only in
  `gen-wsx90-campaign.mjs`, which now refuses to write unless every completed
  milestone carries a `completed_at` at or before the reporting date
  (2026-11-20) and every milestone targeted after that date is `planned` or
  `in-progress`. The rule runs over all 40 POA&M items, the 16 original ones
  included. `src/lib/platform-seed.test.ts` pins the milestone status vocabulary
  but not the chronology.

## The pre-existing ASM-2026-001 rows

420 assessment results ship here and they are **not** one uniform population.
The 300 rows of `ASM-2026-002` were authored by the later pass; the 120 rows of
`ASM-2026-001` (assessed 2026-08-03 → 2026-08-21) came with the original
fictional program and were deliberately left as they were. Three things about
them are worth stating plainly, because the UI does not show any of them:

- **They carry neither an `id` nor an `assessment_id`.** Every one of the 300
  new rows carries both; not one of the 120 original rows carries either. So no
  original result is actually linked to `ASM-2026-001` in the data — the
  association exists only in the reader's head and in the date range. Anything
  that groups results by assessment sees 300 rows, not 420.
- **37 of the 120 cite evidence collected after the result that relies on it**,
  by 8 to 18 days (31 `pass`, 5 `fail`, 1 `not-assessed`). This is exactly the
  inversion that was found and fixed for the new scope, where it now stands at
  zero. It was **not** introduced by that work and was deliberately not
  rewritten: these are carried-forward records, and silently re-dating a hundred
  and twenty rows of someone else's fictional history would have hidden the
  condition rather than disclosed it. `LEGACY_INVERTED_ROWS = 37` in
  `gen-wsx90-seed.mjs` holds the line.
- **They predate the 2026-09-08 floor** the later authoring pass works to. That
  floor binds authored content, not the carried-forward campaign.

The same split applies to the POA&M horizon. The 24 authored items are held to
2026-10-01 → 2027-03-31 on both their milestone `target_date`s and their
`planned_completion`, and the generator refuses to write outside it. Five of the
16 original items — `POAM-003`, `-006`, `-009`, `-012`, `-015` — carry a
`planned_completion` between 2026-09-08 and 2026-09-20, which is earlier than
that window rather than later. They are carried-forward records with no
milestone dates at all, and they were left alone for the same reason the 37
inverted results were.

The short version: the newer campaign is clean on cause-before-effect and the
older one is not, the app cannot tell you which is which, and 30 percent of the
older campaign's rows would fail the rule the newer one is held to.

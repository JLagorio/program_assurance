# WS-X90 seed

`wsx90-platform-seed.json` is the WS-X90 dataset the application boots from.

**Do not hand-edit it — regenerate with `node scripts/gen-wsx90-seed.mjs`.**

SHA-256: `6a90b3d55ac3e0fdc77ffda5c13ac75fa49671a57f4266b463a17af5118759c5`

`src/lib/platform-seed.ts` validates the file at import time and
`platform-ingestion.ts` registers it in the existing program stores before saved
edits are restored. No separate program layout or parallel workspace store is
used.

## What is real and what is fictional

The two halves of this file have different standing, and the split is recorded
in the data itself (`dataset_metadata.reference_layer`, and an `authoritative`
boolean on every reference source).

**Fictional — the program.** Aurora Defense Systems, the WS-X90 Sentinel
Mission System, its 6 subsystems and 20 LRUs, 120 requirements, 74 control
implementations, 90 evidence artifacts, 1 assessment, 120 assessment results,
16 findings, 16 risks and 16 POA&M items are entirely invented. They are copied
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

### The authoring gap is deliberate

Of the 546 effective controls, **74 have an authored implementation** and **472
do not**. The 472 carry `implementation_status: "not-implemented"` and
`authoring_status: "unauthored"`, with no invented narrative, evidence, findings
or requirements. Narrative authoring is a separate pass;
`derivation.authoring_gap` counts the gap so it cannot be mistaken for coverage.

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

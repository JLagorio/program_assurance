# WS-X90 program-content gap: authoring specification

**To:** the agent that authored the original WS-X90 dummy dataset
**From:** the reference-layer rebuild
**Date:** 2026-09-08
**Subject:** fictional program content for the 472 controls the re-derived baseline added

---

## 0. Read this first — what changed and why you are being asked for more

The WS-X90 dataset used to ship a hand-listed "effective control set" of 74 controls that nobody had
actually derived. That set has been replaced by the output of the real resolution pipeline, run against
the real published corpus:

| Stage | Source | Result |
| --- | --- | --- |
| catalog | NIST SP 800-53 Rev 5 OSCAL, catalog version 5.2.0 | 1196 controls and enhancements, 20 families |
| starting baseline | SP 800-53B **High** (high-water mark of C:high / I:high / A:moderate) | 370 |
| CNSSI 1253 (2022) C/I/A allocation | third-party extraction, `authoritative: false` | 554 (+201, −17) |
| 3 named overlays | WS-X90 fiction | 546 (+1 added, 7 reaffirmed, 9 withdrawn) |
| program tailoring | none authored | 546 |
| **effective control set** | | **546** — 209 base + 337 enhancements, 18 families |

The **framework reference layer is now authoritative and complete**. Every one of the 546 effective
controls carries, in the seed itself, its real NIST title, its real SP 800-53A Rev 5 assessment-objective
ids, its real DISA CCI identifiers, its real CNSSI 1253 C/I/A allocation and ODP starting value, and an
ordered `selection_trail` saying why it is in the set.

What is **missing** is the fictional *program* content for the controls the re-derivation added.
Fabricating it was deliberately deferred rather than done badly, and the gap is counted in the data at
`profiles[0].derivation.authoring_gap` so it cannot be mistaken for coverage.

**Your job:** author that program content — requirements, implementation narratives, evidence,
assessment results, findings, risks and POA&M items — for the 472 controls that have none.

---

## 1. Exactly what exists vs. what is needed

### 1.1 What exists today (verified counts from `src/data/wsx90-platform-seed.json`)

| Collection | Rows | Notes |
| --- | --- | --- |
| `organization` | 1 | `ORG-AURORA`, "Aurora Defense Systems (Fictional)" |
| `control_sources` | 1 | `CAT-NIST-800-53R5` |
| `profiles` | 1 | `PROFILE-WSX90-TAILORED`, 546 effective controls, 235 tailoring events |
| `systems` | 1 | `SYS-WSX90` |
| `subsystems` | 6 | `SUB-01` … `SUB-06` |
| `components` | 20 | `LRU-001` … `LRU-020` |
| `requirements` | 120 | `REQ-001` … `REQ-120`, covering **74 distinct controls** |
| `control_implementations` | 74 | `IMPL-AC_2` … one per authored control, **all base controls, zero enhancements** |
| `evidence` | 90 | `EVD-001` … `EVD-090`, one per requirement, 30 requirements have none |
| `assessments` | 1 | `ASM-2026-001`, status `completed`, 2026-08-03 → 2026-08-21 |
| `assessment_results` | 120 | one per requirement — pass 101, fail 16, not-assessed 3 |
| `findings` | 16 | `FND-001` … `FND-016` — severity moderate 8 / high 4 / low 4; status open 13 / closed 3 |
| `risks` | 16 | `RSK-001` … `RSK-016` — 1:1 with findings |
| `poam_items` | 16 | `POAM-001` … `POAM-016`, 48 milestones, **none dated** |

Derivation record state: **74 `authoring_status: "authored"`, 472 `"unauthored"`.**
Every unauthored row carries `implementation_id: null`, `implementation_status: "not-implemented"`,
`requirement_ids: []`.

### 1.2 The 472 controls that need content

They are **135 base controls + 337 enhancements** across 18 families:

| AC | AT | AU | CA | CM | CP | IA | IR | MA | MP | PE | PL | PS | RA | SA | SC | SI | SR |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| 41 | 12 | 26 | 14 | 34 | 21 | 31 | 29 | 16 |  9 | 23 | 10 | 13 | 13 | 65 | 53 | 43 | 19 |

Get the exact list — and everything real you need about each one — with this one-liner from the repo root:

```bash
node -e "const s=require('./src/data/wsx90-platform-seed.json');const d=s.profiles[0].control_derivations;const rows=Object.values(d).filter(r=>r.authoring_status==='unauthored');console.error(rows.length+' controls');console.log(JSON.stringify(rows,null,2))" > unauthored.json
```

Each row already gives you, **real and verbatim**:
`control_id`, `family`, `title` (the real NIST control title), `sp800_53b_baselines`,
`cnssi_1253` (selection drivers, NSS parameter value, justification),
`selection_trail`, `assessment_objective_ids` (real SP 800-53A Rev 5 OSCAL part ids),
`cci_ids` (real DISA CCI identifiers).

You need no other reference file to write correct, id-accurate content.
If you want to read the real control statement, discussion, ODPs, assessment objectives, methods and
objects while drafting, they are in `src/lib/nist-control-text/<family>.ts` (20 lazy chunks, keyed by
the same control ids) — **read them for understanding, never copy their prose into the seed.** See §5.

The 74 already-authored controls (do not re-author, do not renumber, do not touch):

```
AC-2 AC-3 AC-4 AC-5 AC-6 AC-7 AC-8 AC-11 AC-12 AC-17 AU-2 AU-3 AU-4 AU-5 AU-6 AU-8 AU-9 AU-11 AU-12
CA-2 CA-5 CA-7 CA-8 CM-2 CM-3 CM-4 CM-5 CM-6 CM-7 CM-8 CM-10 CM-11 CP-2 CP-9 CP-10 IA-2 IA-3 IA-4
IA-5 IA-8 IR-4 IR-5 IR-6 MA-2 MA-3 MA-4 MA-5 MP-6 PE-3 PE-6 PE-18 PL-2 RA-3 RA-5 SA-10 SA-11 SC-7
SC-8 SC-12 SC-13 SC-23 SC-28 SC-39 SI-2 SI-3 SI-4 SI-5 SI-7 SI-10 SI-12 SI-16 SR-3 SR-5 SR-11
```

### 1.3 Target volumes

Rules in §3 always win over these numbers; treat the totals as targets with ±10% tolerance.

| Collection | Now | Add | After | Rule that fixes the number |
| --- | --- | --- | --- | --- |
| `requirements` | 120 | **520** | 640 | ≥1 requirement per unauthored control (472), plus a second requirement on ~48 controls whose statement splits cleanly across two LRUs |
| `control_implementations` | 74 | **472** | 546 | exactly one per unauthored control — after this pass every effective control is authored and the authoring gap is 0 |
| `evidence` | 90 | **360** | 450 | every requirement whose `implementation_status` is `implemented` gets ≥1; roughly 60% of `partially-implemented` do; `planned` and `not-implemented` get none |
| `assessments` | 1 | **1** | 2 | one new in-progress assessment for the expanded set — see open item **O-1** |
| `assessment_results` | 120 | **300** | 420 | results only for requirements the new assessment has reached; includes 6 retest rows (see §3.6) |
| `findings` | 16 | **36** | 52 | one per `fail` result |
| `risks` | 16 | **24** | 40 | new findings cluster 1–3 per risk (this is more realistic than the existing 1:1 and is explicitly wanted) |
| `poam_items` | 16 | **24** | 40 | one per new risk, 3–4 milestones each, **all dated** |

New id ranges (all zero-padded to the width shown; these ranges are free of collisions with both the
WS-X90 records and the unrelated `PRG-1041` demo program that shares the same runtime stores):

| Record | New ids |
| --- | --- |
| requirement | `REQ-121` … `REQ-640` |
| implementation | `IMPL-` + the control id with every hyphen and parenthesis replaced by an underscore, trailing underscores dropped: `AC-2(1)` → `IMPL-AC_2_1`, `SC-7(21)` → `IMPL-SC_7_21`, `AT-3` → `IMPL-AT_3` |
| evidence | `EVD-091` … `EVD-450` |
| assessment | `ASM-2026-002` |
| assessment result | `AR-002-0001` … `AR-002-0300` (the existing 120 rows have no `id`; **yours must**) |
| finding | `FND-017` … `FND-052` |
| risk | `RSK-017` … `RSK-040` |
| POA&M | `POAM-017` … `POAM-040`, milestones `POAM-0NN-M1` … `-M4` |

---

## 2. Delivery mechanics — where the file goes and how it is rebuilt

`src/data/wsx90-platform-seed.json` is **generated**. Do not hand-edit it. The generator
`scripts/gen-wsx90-seed.mjs` copies the program half of the dataset through **byte-for-byte** from the
upstream corpus file and re-derives only the control half; it refuses to write if any program collection
differs from upstream.

So author into the upstream file:

```
docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json
```

(that directory is git-ignored and already hydrated on disk), then regenerate:

```bash
node scripts/gen-wsx90-seed.mjs        # or: npm run gen:seed
```

The collections carried through verbatim, i.e. **the ones you own**:

```
organization  control_sources  systems  subsystems  components  requirements
control_implementations  evidence  assessments  assessment_results
findings  risks  poam_items  traceability_views
```

The collections the generator owns, i.e. **the ones you must NOT write**:

```
profiles[0].effective_control_ids   profiles[0].starting_selection   profiles[0].overlays
profiles[0].tailoring_events        profiles[0].reference_sources    profiles[0].derivation
profiles[0].control_derivations     profiles[0].odp_starting_values
dataset_metadata.*
```

The generator recomputes `control_derivations[*].implementation_id`, `implementation_status`,
`requirement_ids` and `authoring_status` from *your* records, and recomputes
`derivation.counts` and `derivation.authoring_gap`. Write the program records correctly and the
derivation trail updates itself.

`traceability_views` **is** yours and is *not* recomputed — see §3.7.

### 2.1 UUIDs

Every record with a `uuid` needs a **v4-format-valid, globally unique** UUID (zod: `z.string().uuid()`;
the loader errors on any duplicate UUID anywhere in the file). Existing records use UUID **v5**. Keep
that, and keep it deterministic so regeneration is reproducible. Use this exact recipe — standard DNS
namespace, name `wsx90.aurora.example/<record id>`:

```js
import { createHash } from "node:crypto";
const NS = "6ba7b8109dad11d180b400c04fd430c8"; // 6ba7b810-9dad-11d1-80b4-00c04fd430c8
const uuid5 = (name) => {
  const h = createHash("sha1").update(Buffer.from(NS, "hex")).update(Buffer.from(name, "utf8")).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20,32)}`;
};
// uuid5("wsx90.aurora.example/REQ-121")     === "be8681ad-1971-5c63-91ad-0309e2b0234f"
// uuid5("wsx90.aurora.example/IMPL-AC_2_1") === "c2bddecb-3229-5437-90bc-6750c6c29d85"
// uuid5("wsx90.aurora.example/EVD-091")     === "c0902228-ccad-5030-b981-1e8bec246158"
```

Those three values are the real output of that snippet — if your generator reproduces them you have the
recipe right. Assert no collision against the 362 ids and UUIDs already in the file.

---

## 3. The exact schema, field by field

Authoritative source: `src/lib/platform-seed.ts`. Every object is `.passthrough()`, so extra fields are
retained rather than rejected — but nothing listed as required may be omitted.

Shared primitives used below:

| Alias | Rule |
| --- | --- |
| `text` | `z.string().min(1)` — **non-empty**. An empty string fails. |
| `id` | same as `text` |
| `uuid` | RFC-4122 format |
| `stamp` | ISO-8601 **datetime with offset** — `"2026-09-14T16:00:00Z"`. A bare date fails. |
| `date` | strict `YYYY-MM-DD`, must round-trip as a real calendar date |
| `ids` | array of `text` (may be empty unless stated otherwise) |
| `impact` | `"low" \| "moderate" \| "high"` |
| `method` | `"examine" \| "interview" \| "test"` |
| `implementationStatus` | `"implemented" \| "partially-implemented" \| "planned" \| "not-implemented"` |

### 3.1 `requirements[]`

```json
{
  "id": "REQ-001",
  "uuid": "be18d7a2-ee0a-5fa6-84ff-d900c2ee9da6",
  "title": "AC Enforcement Requirement 001",
  "description": "The assigned component shall enforce the applicable security policy for AC-2 and record a verifiable implementation state. This is fictional example language and not the text of the NIST control.",
  "source": "derived",
  "source_profile_id": "PROFILE-WSX90-TAILORED",
  "priority": "P1",
  "verification_method": "examine",
  "control_ids": ["AC-2", "AC-7"],
  "component_ids": ["LRU-001"],
  "subsystem_ids": ["SUB-01"],
  "implementation_status": "implemented",
  "owner_role": "System Security Engineer",
  "acceptance_criteria": [
    "Implementation evidence exists for AC-2.",
    "At least one mapped LRU has an approved implementation statement.",
    "Assessment procedure can produce a repeatable pass/fail result."
  ],
  "tags": ["ac", "lru-mapped", "ssp-source"]
}
```

| Field | Type | Required | Constraint |
| --- | --- | --- | --- |
| `id` | text | yes | unique across **every** collection in the file |
| `uuid` | uuid | yes | unique across the file |
| `title` | text | yes | non-empty |
| `description` | text | yes | non-empty; this is the requirement statement — see §6 |
| `source` | text | yes | free text; use `"derived"` for control-derived requirements |
| `source_profile_id` | id | optional | must be `"PROFILE-WSX90-TAILORED"` if present |
| `priority` | enum | yes | `"P1" \| "P2" \| "P3"` |
| `verification_method` | enum | yes | `"examine" \| "interview" \| "test"` |
| `control_ids` | ids | yes | every id must be in the 546 effective set (§3.8) |
| `component_ids` | ids | yes | `LRU-001` … `LRU-020` only; 1–3 per requirement |
| `subsystem_ids` | ids | yes | **exactly** the deduplicated set of `subsystem_id`s of `component_ids` — see §3.7 |
| `implementation_status` | enum | yes | the four values above |
| `owner_role` | text | yes | use one of the four existing roles (§6.5) |
| `acceptance_criteria` | string[] | yes | may be empty, but do not leave it empty — 2–4 entries |
| `tags` | string[] | yes | keep the existing convention: lowercase family tag + `"lru-mapped"` + `"ssp-source"` |

### 3.2 `control_implementations[]`

```json
{
  "id": "IMPL-AC_2",
  "uuid": "9effa177-aedd-543d-a9f8-649d0f19d007",
  "control_id": "AC-2",
  "status": "partially-implemented",
  "narrative": "The SYS-WSX90 satisfies the tailored intent of AC-2 through a combination of system-level procedures and mapped component implementations. This narrative is synthetic demo content.",
  "responsible_roles": ["System Security Engineer"],
  "requirement_ids": ["REQ-001", "REQ-075"],
  "by_component": [
    {
      "component_id": "LRU-001",
      "component_uuid": "6834d468-7af7-53d5-80b2-e41bd53c3914",
      "description": "Mission Computer contributes to AC-2 by implementing or evidencing mapped engineering requirements."
    }
  ]
}
```

| Field | Type | Required | Constraint |
| --- | --- | --- | --- |
| `id` | text | yes | globally unique; convention in §1.3 |
| `uuid` | uuid | yes | globally unique |
| `control_id` | id | yes | must be in the 546 effective set — **the generator hard-fails otherwise** |
| `status` | enum | yes | the four implementation statuses |
| `narrative` | string | yes | may be `""` by schema; **do not** — see §6.2 |
| `responsible_roles` | ids | yes | role names, free text |
| `requirement_ids` | ids | yes | every id must resolve to a `requirements[].id` |
| `by_component[]` | array | yes | one entry per contributing LRU |
| `by_component[].component_id` | id | yes | resolves to a component |
| `by_component[].component_uuid` | uuid | yes | **must be that component's real uuid** — a mismatch is a hard `component-uuid-mismatch` error |
| `by_component[].description` | string | yes | what that LRU actually does for this control |

Exactly one implementation per control. Two implementations naming the same `control_id` will make the
derivation record point at whichever the generator sees last and will trip a `derivation-inconsistent`
warning.

### 3.3 `evidence[]`

```json
{
  "id": "EVD-001",
  "uuid": "0e702ef3-900f-5aac-9d91-e514e5f0cceb",
  "title": "Evidence for REQ-001",
  "type": "configuration-export",
  "description": "Synthetic evidence artifact demonstrating the implementation or assessment of REQ-001.",
  "uri": "urn:demo:evidence:evd-001",
  "sha256": "fa58a178f4e362549d368c2eda850002a9c9e1b08db9d3a076528de826feb24a",
  "collected_at": "2026-08-01T14:00:00Z",
  "valid_through": "2027-02-01T00:00:00Z",
  "requirement_ids": ["REQ-001"],
  "control_ids": ["AC-2", "AC-7"],
  "component_ids": ["LRU-001"],
  "assessment_reuse": "review-required"
}
```

| Field | Type | Required | Constraint |
| --- | --- | --- | --- |
| `type` | text | yes | free text, but the UI maps only these four: `configuration-export` → Configuration, `scan-result` → Scan output, `test-report` → Test result, **anything else** → Document. Stay inside the seven in use: `configuration-export`, `test-report`, `audit-log-sample`, `procedure`, `scan-result`, `attestation`, `design-record`. |
| `uri` | text | yes | `urn:demo:evidence:<lowercased id>`. A `urn:` prefix raises the benign `evidence-reference-only` warning by design. An `http(s)://` uri would be rendered as a live link — do not invent one. |
| `sha256` | string | yes | 64 hex chars **or** `""`. Generate it deterministically, e.g. `sha256("wsx90-evidence:" + id)`. |
| `collected_at` | stamp | yes | offset datetime |
| `valid_through` | stamp or `""` | yes | typically `collected_at` + 6 months |
| `requirement_ids` | ids | yes | must resolve; keep 1 per artifact to match the existing shape |
| `control_ids` | ids | yes | must be effective controls; mirror the requirement's `control_ids` |
| `component_ids` | ids | yes | must resolve; mirror the requirement's `component_ids` |
| `assessment_reuse` | text | yes | use `"eligible"` or `"review-required"` (existing split is 70/20) |

### 3.4 `assessments[]`

```json
{
  "id": "ASM-2026-002",
  "uuid": "<uuid5>",
  "name": "WS-X90 Expanded Control Set Assessment",
  "type": "authorization",
  "scope": {
    "system_id": "SYS-WSX90",
    "subsystem_ids": ["SUB-01", "..."],
    "component_ids": ["LRU-001", "..."],
    "control_ids": ["AC-1", "..."],
    "requirement_ids": ["REQ-121", "..."]
  },
  "methods": ["examine", "interview", "test"],
  "status": "in-progress",
  "planned_start": "2026-09-14T08:00:00Z",
  "planned_end": "2026-11-20T18:00:00Z",
  "assessor_role": "Independent Security Assessor"
}
```

Every id inside `scope` must resolve (`system_id`, `subsystem_ids`, `component_ids`,
`requirement_ids`) or be an effective control (`control_ids`). `methods` entries are the `method` enum.
`status` is free text; the UI treats `"completed"` as Reporting/Reported and everything else as
Planning/Planned. Read open item **O-1** before you write this record.

### 3.5 `assessment_results[]`

```json
{
  "id": "AR-002-0001",
  "assessment_id": "ASM-2026-002",
  "requirement_id": "REQ-121",
  "control_ids": ["AC-1"],
  "component_ids": ["LRU-013"],
  "method": "examine",
  "outcome": "pass",
  "evidence_ids": ["EVD-091"],
  "assessed_on": "2026-09-16T16:00:00Z",
  "notes": "Synthetic assessment result for application development."
}
```

| Field | Type | Required | Constraint |
| --- | --- | --- | --- |
| `id` | id | optional in schema | **mandatory for your rows.** The ingester falls back to `"<assessment id>/<requirement id>"` when `id` is absent, so two results for the same requirement in the same assessment would collide. |
| `assessment_id` | id | optional in schema | **supply it** — must resolve to an assessment |
| `requirement_id` | id | yes | must resolve; the ingester dereferences it without a null check |
| `control_ids` / `component_ids` | ids | yes | must resolve / be effective |
| `method` | enum | yes | `examine \| interview \| test`; should equal the requirement's `verification_method` |
| `outcome` | enum | yes | `"pass" \| "fail" \| "not-assessed" \| "inconclusive"` |
| `evidence_ids` | ids | yes | must resolve, and each artifact must list this `requirement_id` in its own `requirement_ids` |
| `assessed_on` | stamp | yes | inside the assessment window |
| `notes` | string | yes | may be `""`; write a real observation instead |

Note: `assessment_results` is **not** in the id-uniqueness scan, so `AR-…` ids only need to be unique
among themselves.

### 3.6 `findings[]`, `risks[]`, `poam_items[]`

```json
// findings[]
{
  "id": "FND-001", "uuid": "a05e2413-8dac-5fcd-a8f5-91309d469199",
  "title": "Unmet requirement REQ-008",
  "description": "Assessment identified that REQ-008 is not fully satisfied on one or more mapped components.",
  "assessment_id": "ASM-2026-001",
  "requirement_ids": ["REQ-008"], "control_ids": ["AC-11", "AU-4"],
  "component_ids": ["LRU-013", "LRU-014"],
  "status": "open", "severity": "high",
  "evidence_ids": [], "risk_id": "RSK-001"
}

// risks[]
{
  "id": "RSK-001", "uuid": "2e6a00f9-40ec-54ce-9736-7f5be344fd3c",
  "title": "Risk arising from REQ-008",
  "statement": "If the gap in REQ-008 persists, the system may not achieve the intended protection associated with AC-11, AU-4.",
  "likelihood": "moderate", "impact": "high", "overall": "high",
  "finding_ids": ["FND-001"], "status": "open"
}

// poam_items[]
{
  "id": "POAM-001", "uuid": "8f949a5f-ff52-58cc-a16c-5dc4f24d1635",
  "title": "Remediate REQ-008",
  "description": "Close implementation and evidence gap for REQ-008 across LRU-013, LRU-014.",
  "risk_ids": ["RSK-001"], "finding_ids": ["FND-001"],
  "control_ids": ["AC-11", "AU-4"], "requirement_ids": ["REQ-008"],
  "component_ids": ["LRU-013", "LRU-014"],
  "owner_role": "Platform Lead", "status": "open",
  "planned_completion": "2026-10-06",
  "milestones": [
    { "id": "POAM-001-M1", "title": "Correct implementation or configuration", "status": "in-progress" }
  ]
}
```

Enums and constraints:

- `findings[].severity`: `"low" | "moderate" | "high" | "critical"`. UI maps critical/high → CAT I,
  moderate → CAT II, low → CAT III.
- `findings[].status`: free text; **only `"closed"` reads as closed**, everything else reads as open.
  Use `"open"` / `"closed"`.
- `findings[].assessment_id`, `risk_id`: optional in schema; omitting either raises
  `finding-without-assessment` / `finding-without-risk` warnings. **Supply both on every new finding.**
- `findings[].evidence_ids`: may be empty (raises `finding-without-evidence`). Supply at least one on
  new findings — the failing artifact.
- `risks[].likelihood`, `impact`: `low | moderate | high`. `overall`: `low | moderate | high | critical`.
- `risks[].status`: free text; use `"open"` / `"mitigated"`.
- `poam_items[].status`: free text; **only `"completed"` reads as Completed**, everything else as
  Ongoing. Use `"open"` / `"completed"`.
- `poam_items[].planned_completion`: strict `YYYY-MM-DD`, **required**.
- `poam_items[].milestones[]`: `id` and `title` required, `status` required (free text). Optional
  `target_date` (`YYYY-MM-DD`), `planned_completion` (`YYYY-MM-DD`), `completed_at` (offset datetime).
  **Give every new milestone a `target_date`** — see §3.9 and open item **O-2** on the status spelling.

A **closed** finding whose requirement's most recent `assessment_results` row is `fail` raises
`closure-without-passing-retest`. If you close a finding, add a later result for that requirement with
`outcome: "pass"` and a later `assessed_on` (this is where the 6 retest rows in §1.3 come from).

### 3.7 `traceability_views`

A denormalized diagnostic, carried verbatim, **not** recomputed by the generator, and compared by the
loader against the live relationships. Any disagreement raises `stale-traceability-view`. Regenerate all
four maps from your final records:

```js
control_to_requirements   // control id  -> [requirement ids]   from requirements[].control_ids
component_to_requirements // LRU id      -> [requirement ids]   from requirements[].component_ids
requirement_to_evidence   // REQ id      -> [evidence ids]      from evidence[].requirement_ids
requirement_to_findings   // REQ id      -> [finding ids]       from findings[].requirement_ids
```

Comparison is set-based (deduplicated, sorted), so ordering does not matter and a key mapped to `[]` is
equivalent to an absent key. The existing file keeps a key for every requirement in the last two maps
even when the array is empty — follow that.

### 3.8 The effective control set

Your `control_ids` may only name controls in `profiles[0].effective_control_ids` (546 ids).
`scripts/gen-wsx90-seed.mjs` **refuses to write** if a requirement or an implementation names a control
the resolution dropped. Notable exclusions: the whole **PM** and **PT** families are absent (PM is
organization-wide in CNSSI 1253 and in no SP 800-53B baseline; PT is not allocated), as are the 25
controls in `derivation.withdrawn`.

```bash
node -e "const s=require('./src/data/wsx90-platform-seed.json');console.log(s.profiles[0].effective_control_ids.join('\n'))" > effective.txt
```

Control id format is fixed and non-negotiable: `AC-2`, `AC-2(1)`, `SC-7(21)` — **no zero padding**, no
lowercase OSCAL dotted form (`ac-2.1`), no OSCAL label form (`AC-02(01)`).

### 3.9 Which warnings are pinned by tests

`src/lib/platform-seed.test.ts` asserts exact counts for four warning classes. Your content must not
change them, which turns them into authoring rules:

| Warning | Pinned at | Rule for your rows |
| --- | --- | --- |
| `pass-without-evidence` | 23 | **every new `pass` result must carry ≥1 `evidence_ids`** |
| `fail-without-evidence` | 6 | **every new `fail` result must carry ≥1 `evidence_ids`** |
| `closure-without-passing-retest` | 3 | every new closed finding needs a later passing retest |
| `undated-milestone` | 48 | **every new POA&M milestone must carry `target_date`** |

Unpinned but still worth respecting: `pass-with-incomplete-implementation` (a `pass` whose requirement
is not `implemented`), `requirement-without-evidence`, `evidence-scope-mismatch`,
`subsystem-allocation-mismatch`, `stale-traceability-view`.

---

## 4. Referential integrity and the invariants the tests enforce

### 4.1 Hard errors — the seed will not load

`src/lib/platform-seed.ts` throws at import time on any of these:

1. **Any schema violation** — a missing required field, an empty string where `text` is required, a bad
   enum, a malformed uuid, a `stamp` without an offset, a `date` that is not strict `YYYY-MM-DD`.
2. **Duplicate `id`** across `profiles, systems, subsystems, components, requirements,
   control_implementations, evidence, assessments, findings, risks, poam_items, control_sources` —
   ids are unique across **all** of them together, not per collection.
3. **Duplicate `uuid`** anywhere in the file.
4. **Broken reference.** These field names are resolved wherever they appear at any depth:

   | Field | Must resolve to |
   | --- | --- |
   | `source_catalog_id` | `control_sources` |
   | `profile_id`, `source_profile_id` | `profiles` |
   | `system_id` | `systems` |
   | `subsystem_id`, `subsystem_ids` | `subsystems` |
   | `component_id`, `component_ids` | `components` |
   | `requirement_id`, `requirement_ids` | `requirements` |
   | `evidence_ids` | `evidence` |
   | `assessment_id` | `assessments` |
   | `risk_id`, `risk_ids` | `risks` |
   | `finding_ids` | `findings` |
   | `control_id`, `control_ids` | the union of every profile's `starting_selection`, `effective_control_ids` and overlay `adds`/`removes` |

5. **`component-uuid-mismatch`** — `by_component[].component_uuid` not equal to that component's uuid.
6. **Duplicate control** in `effective_control_ids`.
7. Any `implementation_id` / `requirement_ids` inside `control_derivations` that does not resolve (the
   generator writes these, but they resolve only if your records are consistent).

### 4.2 Counts pinned by the existing tests — these MUST be updated with your delivery

Your content changes all of them. Ship the new numbers with the data so the app team can update the
tests in one pass; do not leave them to be discovered.

`src/lib/platform-structure.test.ts`
- SHA-256 of `src/data/wsx90-platform-seed.json`, currently
  `6a90b3d55ac3e0fdc77ffda5c13ac75fa49671a57f4266b463a17af5118759c5` (also printed by the generator and
  duplicated in `src/data/README.md`)
- `requirements` 120, requirement→component allocations 240
- composition nodes 27, root children 6, descendants 26, assets 20 — **unchanged**, because you must not
  add subsystems or components

`src/lib/platform-ingestion.test.ts`
- requirements 120, allocations 240, assets 20, evidence 90, findings 16, POA&M 16, RTM rows 120,
  coverage total 120, POA&M milestone schedule rows 48
- `milestones.every(row => row.due === null && row.dates === "Unscheduled")` — **this breaks the moment
  you date a milestone.** Expected: it becomes "every *existing* milestone" or a count split.

`src/lib/platform-seed.test.ts`
- subsystems 6, components 20, requirements 120, allocations 240, effective controls 546,
  implementations 74, evidence 90, results 120, findings 16, POA&M 16
- warning counts 23 / 6 / 3 / 48 (§3.9)
- `authored.length === control_implementations.length` and every unauthored row has
  `implementation_id: null`, `implementation_status: "not-implemented"`, `requirement_ids: []` — this
  keeps holding as long as you author an implementation for a control at the same time as its
  requirements
- `derivation.authoring_gap.controls_without_authored_content === unauthored.length` → **0** after a
  complete pass
- the objective-id join test: every `assessment_objective_ids` entry must resolve to a real objective in
  `src/lib/nist-control-text` — untouched by you, since you never write that array

`src/data/README.md` — SHA-256, and the "authoring gap is deliberate" section, which becomes obsolete.

### 4.3 Verification loop to run before you hand anything back

```bash
node scripts/gen-wsx90-seed.mjs      # refuses to write on any inconsistency; prints the new sha256
npx tsc --noEmit                     # must exit 0
npx vitest run --config vitest.app.config.ts src/lib/platform-seed.test.ts \
  src/lib/platform-structure.test.ts src/lib/platform-ingestion.test.ts
```

Report every warning class and count that changed, and the new SHA-256.

---

## 5. What must stay REAL — reference by id, never author the text

The framework half of this dataset is real published content. Treat it as read-only fact.

**Never invent, never edit, never paraphrase into a data field:**

| Thing | Source of truth | Where it already lives |
| --- | --- | --- |
| Control ids | NIST SP 800-53 Rev 5 OSCAL 5.2.0 | `profiles[0].effective_control_ids` |
| Control titles | same | `control_derivations[<id>].title` |
| Control statement / discussion / ODP text | same | `src/lib/nist-control-text/<family>.ts` — **read-only** |
| SP 800-53A Rev 5 assessment-objective ids and prose | same OSCAL release | `control_derivations[<id>].assessment_objective_ids` |
| DISA CCI identifiers | DISA CCI list 2024-01-10 | `control_derivations[<id>].cci_ids` |
| CNSSI 1253 C/I/A selection, ODP starting values | third-party extraction of CNSSI 1253 (2022) | `control_derivations[<id>].cnssi_1253`, `profiles[0].odp_starting_values` |
| SP 800-53B baseline membership | the four OSCAL baseline profiles | `control_derivations[<id>].sp800_53b_baselines` |

Rules:

1. **Cite by id only.** A requirement, narrative, evidence description or finding may *name* `AC-2(1)`,
   `ac-2.1_obj` or `CCI-000015`. It must not reproduce NIST or DISA prose.
2. **Synthetic CCI identifiers are forbidden.** `CCI-DEMO-*` appears nowhere in the data and the
   generator hard-fails if the string reaches its output. CCI ids match `/^CCI-\d{6}$/`.
3. **Do not invent CCI-to-800-53A-Rev-5 links.** Every SP 800-53A reference in the DISA list is
   **Revision 1** (Rev-3 era indexes like `AC-1.1 (i and ii)`). There is no Rev-5 linkage in the source
   and none is asserted anywhere.
4. **Do not touch the provenance flags.** `DISA-CCI-2024` and `CNSSI-1253-2022-EXTRACT` are
   `authoritative: false` (the CCI content is DISA's but these bytes are a mirror; the CNSSI selections
   are a text extraction, not an official CNSS release). The three NIST sources are `true`.
5. **Keep the fiction labelled.** Every synthetic narrative in the existing data says so — e.g.
   "This narrative is synthetic demo content." Keep a comparable marker on new prose, and keep
   `dataset_metadata.classification` (`"UNCLASSIFIED // SYNTHETIC DEMO DATA"`) meaningful.

---

## 6. Realism constraints and the quality bar

### 6.1 The program you are writing for

**Aurora Defense Systems (fictional)** — `ORG-AURORA`.
**WS-X90 Sentinel Mission System** — `SYS-WSX90`, a fictional weapon system, authorization state
`assessment-complete-remediation-open`, profile `PROFILE-WSX90-TAILORED`.

**Security categorization: C:high / I:high / A:moderate, overall high (H-H-M).**
A conflicting `security-configuration-example.json` in the corpus said H-M-M; it was rejected as stale.
The system record wins — it is what the application reads and is internally consistent with
`overall: high`, while the configuration example was a derived illustration built on a self-labelled
synthetic allocation table that is not shipped. The decision is recorded at
`profiles[0].derivation.categorization_resolution`, and it is what selects SP 800-53B **High** as the
starting baseline and drives the CNSSI 1253 allocation. **Availability is moderate**, which is why the
high-availability contingency enhancements are absent from the set — write narratives consistent with
that: full confidentiality and integrity rigour, proportionate availability rigour.

**6 subsystems — allocate only to these:**

| Id | Name | Description |
| --- | --- | --- |
| `SUB-01` | Mission Computing Subsystem | Hosts mission applications, security services, and platform orchestration. |
| `SUB-02` | Navigation & Timing Subsystem | Provides trusted position, navigation, timing, and integrity monitoring. |
| `SUB-03` | Communications Subsystem | Provides external and internal protected communications interfaces. |
| `SUB-04` | Payload Interface Subsystem | Provides controlled command/data interfaces to mission payload LRUs. |
| `SUB-05` | Platform Management Subsystem | Provides health monitoring, maintenance access, update, and configuration services. |
| `SUB-06` | Ground Support Subsystem | Provides maintenance, provisioning, logging export, and support tooling. |

**20 LRUs — allocate only to these. Do not add, rename or re-parent any of them.**

| Id | Name | Subsystem | Type | Status | What it actually does |
| --- | --- | --- | --- | --- | --- |
| `LRU-001` | Mission Computer | SUB-01 | hardware | operational | Runs mission software, hosts security enforcement services |
| `LRU-002` | Secure Boot Controller | SUB-01 | hardware | operational | Enforces authenticated boot and platform integrity state |
| `LRU-003` | Cryptographic Services Module | SUB-01 | hardware | operational | Protected cryptographic operations and key use |
| `LRU-004` | Navigation Processor | SUB-02 | hardware | operational | Processes navigation data and integrity checks |
| `LRU-005` | Timing Receiver | SUB-02 | hardware | operational | Trusted timing input and holdover monitoring |
| `LRU-006` | Navigation Sensor Interface | SUB-02 | hardware | operational | Aggregates navigation sensor inputs |
| `LRU-007` | Protected Network Gateway | SUB-03 | hardware | operational | Mediates external comms and network policy enforcement |
| `LRU-008` | Tactical Data Radio | SUB-03 | hardware | operational | Mission data communications |
| `LRU-009` | Internal Ethernet Switch | SUB-03 | hardware | operational | Internal segmented data transport |
| `LRU-010` | Payload Interface Controller | SUB-04 | hardware | operational | Mediates commands/telemetry between mission compute and payload |
| `LRU-011` | Payload Safety Interlock | SUB-04 | hardware | operational | Independent authorization and state interlocks |
| `LRU-012` | Payload Telemetry Unit | SUB-04 | hardware | operational | Collects and forwards payload health and status telemetry |
| `LRU-013` | Platform Management Controller | SUB-05 | hardware | operational | Platform health, inventory and administrative services |
| `LRU-014` | Maintenance Access Gateway | SUB-05 | hardware | operational | Controls technician maintenance sessions and service access |
| `LRU-015` | Secure Storage Module | SUB-05 | hardware | operational | Stores protected configuration, audit and recovery material |
| `LRU-016` | Update & Recovery Controller | SUB-05 | hardware | operational | Stages authenticated updates and controlled recovery |
| `LRU-017` | Provisioning Workstation | SUB-06 | hardware | operational | Controlled provisioning and configuration workflows |
| `LRU-018` | Security Log Collector | SUB-06 | **software** | operational | Collects and correlates exported platform security logs |
| `LRU-019` | Maintenance Laptop | SUB-06 | hardware | **conditional** | Authorized support endpoint for bounded maintenance activity |
| `LRU-020` | Configuration Repository | SUB-06 | **software** | operational | Approved configuration baselines and signed release metadata |

Six LRUs currently carry **no** requirement at all: `LRU-004`, `LRU-005`, `LRU-006`, `LRU-008`,
`LRU-011`, `LRU-012`. The existing allocation is also lopsided — `LRU-001` and `LRU-013` carry 40
requirements each while `LRU-009` and `LRU-010` carry 3. **Use your 520 new requirements to fix this.**
Allocate by function, not by round-robin: SC-8 / SC-13 / SC-12 to `LRU-003`, `LRU-007`, `LRU-008`;
SI-7 / CM-14 to `LRU-002`, `LRU-016`, `LRU-020`; AU-* to `LRU-018`, `LRU-015`; MA-* to `LRU-014`,
`LRU-019`; the navigation and timing enhancements (SC-45, SI-4 family where timing matters) to
`LRU-004`, `LRU-005`, `LRU-006`; payload command authorization (AC-3(x), AC-4(x)) to `LRU-010`,
`LRU-011`, `LRU-012`. Target: every LRU carries at least 8 requirements and no LRU carries more than
about 90.

### 6.2 What makes a good derived requirement (not a restatement)

The existing 120 requirements are frankly weak — they are templated
("The assigned component shall enforce the applicable security policy for AC-2 and record a verifiable
implementation state"), and they are what "fill this gap properly" means to correct. A good derived
requirement:

- **Names the LRU's actual behaviour**, not the control's abstract obligation.
  *Bad:* "The assigned component shall enforce the applicable security policy for AC-2(1)."
  *Good:* "The Platform Management Controller (LRU-013) shall synchronise account create, modify,
  disable and remove actions to the Security Log Collector (LRU-018) within 60 seconds of the action,
  without operator intervention."
- **Is verifiable by the method it declares.** A `test` requirement states an observable pass/fail
  condition with a threshold. An `examine` requirement states an artifact that either exists in the
  approved configuration or does not. An `interview` requirement states a role and a procedure that
  person must be able to walk through.
- **Carries the ODP where CNSSI 1253 supplies one.** When `control_derivations[<id>].cnssi_1253
  .parameter_value` is non-null, the requirement should use that value as the number (e.g. AC-2's
  "24 hours", AC-1's "at least annually"). This is the single highest-value realism move available to
  you: it is real NSS parameter data already sitting in the record.
- **Is traceable to one control's intent.** Prefer one control per requirement; use two only when the
  same behaviour genuinely satisfies both (18 of the existing 120 do this).
- **Has acceptance criteria that a tester could execute** — 2 to 4, each an observable state, not a
  restatement of the requirement.
- **Does not reproduce NIST prose.** Say what WS-X90 does; do not quote what the catalog requires.

Enhancements deserve their own requirement when they add distinct behaviour (`AC-2(1)` automation,
`AU-9(3)` cryptographic protection, `SC-7(21)` component isolation), and can share the base control's
requirement when they only qualify it. Where you fold an enhancement into a base requirement, put both
control ids in `control_ids` — that is what makes the derivation trail useful.

### 6.3 What makes a good implementation narrative

- **Names actual LRUs by id and name**, and says which part of the control each one carries.
- **Says how, not that.** *Bad:* "The system satisfies the tailored intent of AU-9." *Good:*
  "Audit records are written to the Secure Storage Module (LRU-015) through a write-once channel; the
  Security Log Collector (LRU-018) holds the only read path off-platform, and key material for the
  record signature lives in the Cryptographic Services Module (LRU-003)."
- **Matches its status honestly.** A `partially-implemented` narrative must say *what is missing* and
  ideally point at the POA&M item. A `planned` narrative describes the design and the intended build.
  A `not-implemented` control keeps an empty or minimal narrative — do not write coverage that does not
  exist.
- **`by_component[].description` is per-LRU and specific.** Three entries all saying "contributes to
  X by implementing or evidencing mapped engineering requirements" is the current failure mode.
- **Is consistent with A=moderate.** Don't claim continuous high-availability failover the system does
  not have.
- Keep a synthetic-content marker in the text.

### 6.4 Evidence realism

- **The artifact type must match the verification method and the control.** Configuration baselines and
  signed manifests → `configuration-export` / `design-record`; audit and logging controls →
  `audit-log-sample`; vulnerability and flaw remediation → `scan-result`; procedural and policy controls
  (`AT-*`, `PS-*`, `PL-*`, `IR-*` planning) → `procedure` / `attestation`; anything verified by `test`
  → `test-report`.
- **The title should name the artifact**, not the requirement: "Account synchronisation test report,
  LRU-013 → LRU-018, build 4.2.1" beats "Evidence for REQ-231".
- **Dates must be plausible.** `collected_at` inside or after the assessment window that consumed it;
  `valid_through` ~6 months later. Evidence supporting a `pass` result must be collected **before**
  that result's `assessed_on`.
- **Not everything has evidence.** `planned` and `not-implemented` requirements should have none. That
  is what a program mid-accreditation looks like.

### 6.5 Distributions to hit — a program mid-accreditation

WS-X90 has completed its initial assessment on the original 74-control scope and has just expanded to
the real 546-control set. The new content should read as *early* on the new scope.

**New implementation status** (472 rows — deliberately weaker than the original 74, which were the
mature core):

| Status | Count | Share |
| --- | --- | --- |
| `implemented` | 118 | 25% |
| `partially-implemented` | 175 | 37% |
| `planned` | 141 | 30% |
| `not-implemented` | 38 | 8% |

Bias by family, don't sprinkle: technical families the platform already builds (`AC`, `AU`, `IA`, `SC`,
`SI`, `CM`) skew implemented/partially; process families (`AT`, `PS`, `PL`, `RA`, `SA`, `SR`) skew
planned; deep enhancements skew planned/not-implemented. Requirement `implementation_status` should
agree with its primary control's implementation status.

**New assessment results** (300 rows): `pass` 186 (62%), `fail` 36 (12%), `inconclusive` 12 (4%),
`not-assessed` 66 (22%). Only requirements the new assessment has reached get a row at all — leaving
~220 of the 520 new requirements with no result is correct and realistic.

**New findings** (36, one per `fail`): `critical` 2, `high` 8, `moderate` 18, `low` 8. Status: `open`
30, `closed` 6 (each closed one needs the passing retest from §3.6). Note the existing 16 findings have
**no** `critical` — introducing two is realistic for an expanded scope, and exercises the CAT I mapping.

**New risks** (24): cluster 1–3 related findings each (e.g. all audit-retention findings into one
audit-integrity risk). `overall` should be at least the highest severity among its findings.

**New POA&M items** (24, one per risk): `open` 20, `completed` 4. 3–4 milestones each, **all with
`target_date`**, spread across 2026-10 → 2027-03, milestone status mixed `planned` / `in-progress` /
`completed`. `planned_completion` after the last milestone `target_date`.

**Owner roles** — reuse the four already in the data, do not invent a fifth:
`System Security Engineer`, `Product Security Engineer`, `Firmware Lead`, `Platform Lead`.
Match role to subject matter (firmware/boot/update → Firmware Lead; ground support and maintenance →
Platform Lead) rather than distributing evenly.

**Priorities and verification methods** — keep roughly the existing balance (P2 half, P1 and P3 a
quarter each; `test` half, `examine` and `interview` a quarter each), but let the control drive it:
policy and procedure controls are `examine` or `interview`, never `test`.

### 6.6 Dates

| Anchor | Value |
| --- | --- |
| Original assessment `ASM-2026-001` | 2026-08-03 → 2026-08-21, `completed` |
| Existing evidence collected | 2026-08-01 → 2026-08-27 |
| Existing results assessed | 2026-08-03 → 2026-08-21 |
| Existing POA&M completions | 2026-09-08 → 2026-11-19 |
| Dataset "now" | 2026-09-08 (`dataset_metadata.last_enriched`) |

Put your new assessment window at **2026-09-14 → 2026-11-20**, new evidence collection at
**2026-09-10 → 2026-11-15**, new results at **2026-09-16 → 2026-11-18**, and new POA&M milestones at
**2026-10 → 2027-03**. Nothing you author should be dated before 2026-09-08.

---

## 7. Open items flagged by the integration pass

**O-1 — a second assessment is only half-ingested today.**
`src/lib/platform-assurance.ts:61` reads `data.assessments[0]!` and builds exactly one campaign and one
test event from it; every `assessment_results` row is attached to that single event regardless of its
`assessment_id`, and `event.findings` filters on `finding.assessment_id === assessment.id`. So
`ASM-2026-002` will validate and load, but until that function loops over `data.assessments` its
campaign will not appear and findings tagged to it will drop out of the event roll-up.
**Author the data correctly anyway** (`ASM-2026-002`, `assessment_id` on every new result and finding)
and flag the ingestion change as an app-side follow-up. If the app team declines it, the fallback is to
put everything under `ASM-2026-001` and change its `status` to `in-progress` — which is less honest and
should be a last resort.

**O-2 — POA&M milestone status spelling is inconsistent in the existing data.**
`src/lib/platform-assurance.ts:316` maps `"completed"` → Completed and `"in-progress"` → In progress,
falling through to Planned. The 9 existing completed milestones are spelled **`"complete"`** and
therefore render as *Planned*. Use **`"completed"`** in everything you author; note in your handoff that
the 9 existing rows should be corrected in the same pass (it is a one-word data fix that changes the
seed hash, so it belongs with your delivery, not after it).

**O-3 — the "authoring gap is deliberate" narrative becomes obsolete.**
`src/data/README.md` and `profiles[0].derivation.authoring_gap.note` both describe the 472-control gap as
an intentional deferral. Once you close it, the generator will emit
`controls_without_authored_content: 0` on its own, but the README paragraph and the note string in
`scripts/gen-wsx90-seed.mjs` are prose that a human must rewrite. Call it out in your handoff.

**O-4 — enhancement-level implementations are unprecedented in this dataset.**
All 74 existing implementations are base controls; all 337 enhancements are unauthored. Yours will be
the first `IMPL-*` records for enhancements, so the id convention in §1.3 (`IMPL-SC_7_21`) is new. No
code parses these ids — they are matched by the `control_id` field — but pick the convention once and
apply it uniformly.

**O-5 — `requirement_to_evidence` / `requirement_to_findings` key policy.**
The existing views keep a key for all 120 requirements even where the array is empty, while
`control_to_requirements` (74 keys) and `component_to_requirements` (20 keys) only key what exists. The
loader treats empty and absent identically, so either is valid — just be internally consistent and say
which you chose.

**O-6 — evidence `sha256` values are synthetic.**
Existing artifacts carry real-looking 64-hex digests that correspond to no file. Keep doing that
(deterministically, e.g. `sha256("wsx90-evidence:" + id)`) so the field exercises the UI, and keep the
"synthetic" marker in `description` so nobody mistakes a digest for a real artifact hash.

---

## 8. Definition of done

1. `docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json` updated with the new program
   records and a regenerated `traceability_views`.
2. `node scripts/gen-wsx90-seed.mjs` runs clean and writes `src/data/wsx90-platform-seed.json`; it
   prints `with implementation 546 / without implementation 0`.
3. `npx tsc --noEmit` exits 0.
4. `validatePlatformSeed(platformSeed).errors` is `[]`.
5. The four pinned warning counts (23 / 6 / 3 / 48) are unchanged, or you state exactly which moved and
   why.
6. You hand back: the new SHA-256, the full new count table, the list of test constants that must be
   updated (§4.2) with their new values, and any control that you deliberately left unauthored, with a
   reason.

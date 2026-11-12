# Relational assurance schema

The [system assurance workflow](system-assurance-workflow.md) records the intended product relationships and the remaining gaps between this schema and a complete requirements-to-SSP workflow.

The application stores operational facts in tenant-scoped Postgres records. Reference publications and their resolved profiles occupy the OSCAL reference layer; authored implementation, engineering, assessment, and workflow records link to those exact versions. Domain records have UUID identities. Human identifiers such as a program code or control source ID are independently scoped fields.

Initial schema migrations create no demo facts. The canonical-system migration promotes existing composition records while preserving their identity, metadata and audit counters. `ensure_personal_tenant()` creates only the signed-in account's workspace, owner membership, and identity party from its actual account name/email. A null impact, owner, version, date, or narrative means it has not been recorded; the schema does not manufacture a value to complete a screen.

## Ownership and access

`tenants`, `tenant_memberships`, and `parties` establish workspace ownership. Every operational table has `tenant_id`, a UUID primary key, and a composite `(tenant_id, id)` unique key. Domain foreign keys include the tenant, so a valid UUID cannot create a relationship into another tenant. References into the global reference library use a foreign key plus a tenant guard: global rows are usable, private rows must belong to the record's tenant.

Authenticated members can read their tenant. Owners, admins, and editors can write operational records. Viewers cannot write. Owners manage all membership roles; admins manage only editor/viewer membership. Neither viewers nor admins can promote themselves to owner. The last owner cannot be removed. Program role assignments describe accountable parties; they do not silently grant database access.

## Program and system composition

| Tables                                                                                                               | Purpose                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `programs`, `program_role_assignments`                                                                               | Programs, sponsorship, and named accountability                                                                       |
| `systems`                                                                                                            | Canonical nested systems; containment, authorization-boundary ownership, lifecycle, impact and recorded authorization |
| `composition_nodes`                                                                                                  | Compatibility view of nested canonical systems, with forwarded writes                                                 |
| `system_effective_baselines`                                                                                         | Read-only nearest explicit profile inheritance inside the same boundary, with existing boundary SSP/scope fallback    |
| `component_relationships`                                                                                            | Typed non-containment connections, dependencies, and data flows                                                       |
| `scopes`, `scope_baselines`                                                                                          | Categorized system subsets and their adopted resolved profiles                                                        |
| `component_definitions`, `component_definition_revisions`, `defined_components`, `defined_component_implementations` | Versioned reusable implementation content                                                                             |
| `system_components`, `inventory_items`, `inventory_components`                                                       | System component representations, deployed assets, and which components an asset implements                           |
| `configuration_baselines`, `component_pins`, `parameter_pins`                                                        | Versions and parameter values pinned to a reproducible configuration                                                  |

Canonical systems have at most one parent in the same program. A serialized recursive check rejects containment cycles. Boundary ownership is immutable after creation; same-boundary reparenting is allowed. Nested nodes inherit their containing boundary unless explicitly created as independently bounded systems. SSP component records cannot move into another boundary by editing a parent field. Create the intended record in the new context instead.

System impact values are `low`, `moderate`, or `high`, and remain null before categorization. System lifecycle values are `planned`, `development`, `operational`, and `retired`. Authorization state is separately recorded as `not_assessed`, `in_progress`, `authorized`, `denied`, or `expired`; readiness does not imply authorization.

## Implementation and engineering

| Tables                                                                        | Purpose                                                                                                        |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ssp_revisions`                                                               | A versioned SSP for a system and exact resolved profile                                                        |
| `implemented_requirements`                                                    | Implementation claim for one selected control                                                                  |
| `implementation_statements`                                                   | Narrative for a part of that same control                                                                      |
| `component_contributions`                                                     | A component in the SSP system contributing to the implementation                                               |
| `provider_capabilities`, `offered_implementations`, `inheritance_acceptances` | Published provider offerings and explicit consumer acceptance                                                  |
| `engineering_requirements`, `requirement_revisions`                           | Independently authored requirements and their acceptance criteria                                              |
| `requirement_decompositions`, `requirement_control_links`                     | Requirement derivation and explicit control traceability                                                       |
| `requirement_allocations`, `security_processes`                               | Exactly one allocation target per row: root/nested system, provider capability, or security process            |
| `requirement_applicability`, `requirement_implementations`                    | Scope applicability decisions and explicit links to control-level or component-level implementation narratives |

Database triggers reject a selected control from a different SSP profile, a statement from a different control, a component from another system, and a requirement target from another program. Provider capabilities can intentionally be shared across programs within a tenant. Decomposition stays in one program and cannot form a cycle.

Implementation state uses `planned`, `partial`, `implemented`, `alternative`, and `not_applicable`. A non-applicable implemented requirement needs explicit rationale. These claims are separate from formal assessment determinations, evidence acceptance, operational issues, and risk decisions in the assessment/workflow tables.

## The assurance chain

The records above sit on one chain. A control is met by requirements (`requirement_control_links`), a requirement is supported by evidence (`requirement_evidence`), an operational issue cites evidence (`issue_evidence`, or an observation of the issue that cites it through `observation_evidence`), a risk rests on an issue (its latest assessment is supported by one of the issue's observations, `risk_observations`), and a remediation item answers an issue (`issue_poams`). A requirement is read at its latest revision, a risk at its latest assessment and a remediation item at its latest commitment; evidence is one node per artifact, so a link to any of its versions is a link to the artifact.

Three functions read the chain. Each is `security invoker`, so row-level security decides every row, and each refuses a caller who cannot read the tenant.

| Function                                                                     | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assurance_trace(p_tenant_id, p_kind, p_id, p_program_id)`                   | The chain around one record (`control`, `requirement`, `evidence`, `issue`, `risk` or `remediation`): the records of each stage it reaches and the links between them, as JSON. The walk goes outward from the record and never back: a risk reaches its issues, their evidence, the requirements that evidence supports and the controls those requirements meet, and not the other issues citing the same evidence. `p_program_id` keeps a control's requirements to one program. A stage holds 400 records at most; `clipped` says when one was cut. |
| `program_posture(p_tenant_id, p_program_id)`                                 | The program's system elements by the control families its requirements meet: for each cell, each element's line and each family's line, the requirements, the requirements with evidence, the open issues and the open risks with their worst severity. An element's numbers count the elements inside it, every record once. An open issue or risk stands where the requirements its evidence supports stand; `totals` says how many are placed.                                                                                                       |
| `program_posture_cell(p_tenant_id, p_program_id, p_element_id, p_family_id)` | What stands in one cell (either end may be left out for a whole line): its open issues and risks worst first, up to 50 requirements with no evidence, and the controls its requirements map.                                                                                                                                                                                                                                                                                                                                                            |

`assurance_issue_evidence` and `assurance_issue_risks` are the two links the functions read in both directions. An issue has no direct link to a requirement, a control or an element: it reaches them only through the evidence it cites, so an issue that cites none stands nowhere on the posture.

## Cyber resiliency

The reference frameworks of NIST SP 800-160 are shared reference rows read beside these records ([reference seeding](reference-seeding.md#transcribed-frameworks)). Three functions read them against one program. Each is `security invoker`, names the program alone and refuses a caller who cannot read it, and names a framework item by its code, since an item's id changes when the publication is read again.

| Function                                                                        | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `program_resiliency_choice(p_program_id)`                                       | What the program chose for SA-24, Design for Cyber Resiliency: `selected`, whether one of its control baselines selects the control, and the items of the cyber resiliency framework that the effective values of its five parameters name, by code: `goals`, `objectives`, `techniques`, `approaches` and `design_principles`, with the values that name no item as `unmatched`. A value is effective as `author_tailored_profile` resolves it: the nearest layer of the stack that sets the parameter, else the catalog's own. |
| `program_resiliency_posture(p_program_id)`                                      | `program_posture`'s answer with `techniques` where that has `families`: the program's system elements by the cyber resiliency techniques that the controls its requirements meet support in Table E-1. A requirement stands under every technique its controls support and counts once on a line; `totals.placed` says how many stand under any. Every technique of the framework is listed, also where nothing stands under it.                                                                                                 |
| `program_resiliency_posture_cell(p_program_id, p_element_id, p_technique_code)` | What stands in one cell (either end may be left out for a whole line): its open issues and risks worst first, up to 50 requirements with no evidence, and the controls its requirements map that support the technique.                                                                                                                                                                                                                                                                                                          |

Table E-1 is read through `framework_control_link_rows`, so a control keeps the links printed for its own catalog edition, the program's. A link's technique is the one the table prints it under (`technique_code`), never its approach's parent.

## Revision and publication behavior

Every operational row includes `revision`, `created_at`, `updated_at`, `created_by`, and `updated_by`. Idempotency receipts are separate operational bookkeeping; ordinary domain records use these edit counters. Creation and update actors come from `auth.uid()`; clients cannot forge those audit fields. On authenticated updates, supply `revision = previous_revision + 1` and filter by the previous revision. Missing or stale increments raise HTTP 409 (`PT409`); an update whose filter matches no row is also a conflict for the client. Service-role/import updates still advance revisions.

Published reference and assurance revisions reject updates and deletion; their owned content is protected after publication. Engineering requirements use direct edits and append-only edit history instead. The existing requirement storage rows and foreign keys remain compatible, while the current requirement can be edited regardless of a legacy publication flag. See [requirement edit persistence](requirement-edit-history.md).

The database records actual publication timestamps for records that use publication. Published component definitions require components, published configuration baselines require component pins, and published SSPs require implementation content and a published profile resolution. A pinned configuration baseline must also be published.

A provider offering must pin a published provider SSP before the offering can be published. An inheritance acceptance must reference a published offering. This prevents edits to provider content from changing an existing acceptance.

Identity-defining foreign keys remain stable to keep existing child records consistent. Narrative and decision fields in versioned assurance documents are editable until their owning revision is published. Requirement field changes update the same current row and record their actual before/after values, actor and time.

## Validation

`supabase/tests/assurance.sql` runs inside a transaction and rolls back every test identity and record. It verifies account bootstrap idempotence, tenant isolation, membership permissions, last-owner retention, audit actors, optimistic locking, composition cycles, allocation cardinality, publication event timestamps, published parent/child immutability, and—when reference releases are installed—SSP baseline/control/statement consistency. It can be run against the local database after migrations:

```sh
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/assurance.sql
```

The test fixtures are isolated test records; they are never inserted into the normal application workspace.

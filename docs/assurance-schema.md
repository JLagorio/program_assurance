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

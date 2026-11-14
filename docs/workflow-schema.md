# Assessment, evidence and workflow schema

`20260912020000_workflow_schema.sql` creates the operational assessment, evidence, remediation, scheduling and authorization model. These tables start empty. They depend on the tenancy helpers, shared reference schema and assurance schema in the preceding migrations.

Every operational row has a UUID primary key, a required `tenant_id`, audit timestamps and an integer `revision` used for optimistic concurrency. Domain relationships use `(tenant_id, id)` foreign keys. Shared reference links, such as a finding's `target_control_part_id`, use UUID foreign keys plus the common guard that permits global references and same-tenant references only. Owners, assignees, reviewers and decision makers reference tenant parties.

## Main relationships

| Area                      | Tables and relationship                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence                  | `evidence_artifacts` is the stable identity. `evidence_versions` pins an external location or an uploaded object. `evidence_reviews` records a suitability decision independently from any assessment outcome.                                                                                                                                     |
| Assessment planning       | `assessment_campaigns` contains `assessment_plan_revisions`; each plan imports an exact published `ssp_revisions` row. Objectives, activities, steps, tasks, dependencies and subjects belong to that plan revision.                                                                                                                               |
| Subjects                  | `assessment_subjects` requires exactly one real system, scope, component, composition node, inventory item or party foreign key.                                                                                                                                                                                                                   |
| Procedures                | `procedures` contains immutable published `procedure_revisions` and their ordered `procedure_steps`. `requirement_verifications` links an exact requirement revision to a procedure revision.                                                                                                                                                      |
| Execution                 | `test_runs` references an exact published procedure and configuration baseline. Optional event/task links must use the same assessment plan. `step_results` can reference only a step in that run's procedure revision.                                                                                                                            |
| Observations              | `observations` records what was observed, its method, subject, actor and optional source step result. `observation_evidence` cites exact evidence versions.                                                                                                                                                                                        |
| Results                   | `assessment_results_revisions` imports an exact published assessment plan. Each revision has `result_sets`, linked observations and formal `assessment_findings`. A finding targets exactly one control part and has separate observation and risk-revision joins.                                                                                 |
| Risk                      | `risks` is the stable operational identity. `risk_revisions` records the assessed threat, vulnerability, likelihood, impact and severity. Its observations and responses are part of that revision. Findings and POA&M commitments cite exact published risk revisions.                                                                            |
| Operational issues        | `operational_issues` is separate from formal findings. `issue_observations` records its supporting observations, `issue_requirements` the requirements it is about, and `issue_poams` relates it to remediation commitments.                                                                                                                       |
| POA&M                     | `poam_documents` contains `poam_revisions`; `poam_items` is the stable commitment identity and `poam_item_revisions` carries its versioned plan. `poam_revision_items` pins published item revisions, allowing an unchanged item version to appear in another document revision. Risk, observation and milestone rows belong to the item revision. |
| Work                      | `workstreams`, `tasks` and `task_assignments` hold work and party assignments. Typed joins connect tasks to requirements, implementations, issues, risks, POA&M items and assessment tasks.                                                                                                                                                        |
| Reviews and authorization | Gates have criteria and review decisions. `authorization_packages` contains published `package_revisions`; each package document has exactly one typed revision reference. Authorization decisions record the decision maker, rationale, actual decision time, and optional effective/expiry dates.                                                |
| Collaboration and intake  | Comments, activity events and change requests use explicit target foreign keys with one-target checks. `ingestion_jobs` and `import_issues` record input provenance and validation failures separately from accepted operational data.                                                                                                             |
| Reference frameworks      | `gate_criteria.outcome_item_id` names the security outcome a criterion was drawn from, and `risk_attack_techniques` the ATT&CK techniques a risk concerns. Both point at `framework_items` of the NIST SP 800-160 frameworks: a criterion somebody wrote names no outcome, and a technique link is the risk's own, not an assessment revision's.   |

Supporting evidence joins exist for requirement revisions, implementation statements, formal findings, test runs, individual step results, general tasks, issues and gate criteria. A link pins a version and can record the particular claim and applicability rationale; it does not confer an accepted review or satisfied finding.

A draft results revision decides nothing until it is published. `publish_assessment_results(p_tenant_id, p_results_revision_id, p_expected_revision, p_expected_findings, p_request_id)` (migration `20261114025500_publish_assessment_results`) publishes one at the revision the reader saw and holding the number of findings the reader was told, records the caller's party as `published_by_party_id`, and keeps a private receipt (`assessment_results_requests`), so a request sent again answers as it first did and its id sent for other results is refused. It refuses results already published, changed since they were read, holding no finding or not in the workspace, and a caller who may not write to the workspace. From then on the revision and its findings are immutable, and the program's control status, traces and posture read them.

Two later migrations link these records to the reference frameworks ([reference seeding](reference-seeding.md#transcribed-frameworks)). `add_gate_security_outcomes(p_tenant_id, p_gate_id, p_request_id, p_outcome_item_ids)` is the one writer of `gate_criteria.outcome_item_id`; a client's direct write of it is refused. In one transaction it adds between 1 and 500 chosen security outcomes of the system life cycle processes to one gate as required criteria, each titled with its outcome's sentence and placed after the gate's last criterion in the order the publication prints them. An outcome the gate already holds, by its code, is skipped. `gate_outcome_requests` keeps a private receipt for each request id, which no client reads: the same request sent again returns its first answer, and one sent with another choice conflicts (`PT409`). The view `gate_criterion_rows` runs as the reader and gives each criterion with its outcome's code and the life cycle process and process group that hold the outcome; they are empty for a criterion somebody wrote.

`risk_attack_techniques` holds one row a risk and a technique of the published framework `nist-sp800-160v2r1-attack`. A risk names a technique once, and a link is removed and made again, never moved. `risk_threats(p_tenant_id, p_risk_id)` is `security invoker` and refuses a caller who cannot read the tenant. It returns the techniques the risk names with their tactics and, each once in the catalog's order, the controls Appendix F prints against them with the techniques each counters, its approaches and its effects, and where the risk's program stands on it: `in_baseline`, `requirements` and `evidenced`, empty where no standing can be said.

## Writing records

Insert new records with meaningful required values. Optional business facts, including due dates, collection dates, severity and unknown provenance, stay `NULL` until known. Defaults describe a newly created draft/open/planned lifecycle; they do not generate completion dates, decisions or evidence.

For updates, send `revision = previous_revision + 1` and filter the update by the previous revision:

```ts
supabase
  .from(table)
  .update({ ...patch, revision: previous.revision + 1 })
  .eq("id", previous.id)
  .eq("revision", previous.revision)
  .select()
  .single();
```

The common lifecycle trigger rejects stale revisions with `PT409`, preserves identity/tenant/creation metadata and records the current actor and update time. Tenant members can read their tenant; editors, administrators and owners can write it. Viewer and anonymous writes are unavailable.

## Publication and historical records

Revision tables use `state = draft | published`, a positive `version_number`, and a nullable `published_at` that becomes required on publication. The concurrency `revision` is separate from the authored `version_number`.

Published revisions cannot be changed or deleted. Their structured content is frozen with parent guards, including relationships added after publication. Assessment plans and results, executed procedures/configuration, package documents and risk citations require the exact referenced version to be published first. Completed or aborted test runs and their step results/evidence cannot be rewritten; a retest is another run.

Observations and observation-evidence links become immutable when a published results, risk or POA&M item revision cites them. Publication and observation changes coordinate database locks. Recorded review decisions, authorization decisions and activity events are append-only. Corrections use new rows or revisions rather than changing history.

Task dependencies remain inside one assessment plan and reject self-links and cycles. This is distinct from arbitrary general work links.

## Private evidence files

The migration creates a private `evidence` bucket with a 50 MiB file limit. Supabase Storage must be enabled in the local stack. Object policies use tenant membership and an existing draft evidence version; this follows Supabase's [Storage access-control model](https://supabase.com/docs/guides/storage/security/access-control).

The object path is:

```text
<tenant_uuid>/<artifact_uuid>/<version_uuid>/<filename>
```

Create the artifact and draft version first, reserving that path in `evidence_versions.storage_object_name`. Upload through the Storage API, then save the returned object UUID to `storage_object_id` using the record's current concurrency revision. The database verifies that the actual Storage object is in the private evidence bucket at the reserved tenant/version path. A published version requires either a real object reference or an external location.

Tenant members may read their files. Authorized editors may upload, replace or delete only while the associated version remains a draft. A version's object foreign key prevents deleting a still-referenced object; clear the draft reference first when intentionally replacing/removing it. Published evidence and its object cannot be overwritten through authenticated application access. Use authenticated downloads or short-lived signed URLs; the bucket is not public.

Only bucket configuration is inserted by this migration. No evidence objects, tasks, findings, dates, results, approvals, risks or commitments are fabricated.

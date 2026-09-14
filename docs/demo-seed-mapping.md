# Explicit prototype demo import

This dataset is the preserved fictional prototype, imported only when explicitly requested. It is separate from the authoritative NIST/DISA reference seed. Application code reads Supabase records; it does not import the archived prototype or use a fallback fixture.

The importer defaults to a read-only plan and requires an explicit tenant and account. `--check` validates in a transaction and rolls back; `--apply` commits the reviewed import. Existing records are not overwritten. See [the importer](../scripts/seed-demo.mjs) for the exact command interface and [the provenance migration](../supabase/migrations/20260912090000_demo_seed_provenance.sql) for source-record storage. A mapping report records omissions and conversions; a successful import does not mean every original field has a normalized equivalent.

## Source and reproduction

Run `node scripts/extract-demo.mjs` to reproduce [the compressed fixture](../supabase/demo/original-poc.json.gz) and [its manifest](../supabase/demo/manifest.json). The extractor bundles archived source modules in an isolated Node VM, invokes their original registration functions, and reads their shipped records. It has no browser storage, Supabase client, or database write path.

The extraction clock, `2026-08-30T12:00:00Z`, is the literal clock in the archived `dataset-clock.ts`; it is not today's date. Original timestamp strings remain unchanged, including incomplete dates and inconsistent historical demo dates. Source fields are never advanced to the current date.

The manifest records the extractor hash, 99 archived input hashes, compressed/uncompressed fixture hashes, and asset hashes. The shipped WS-X90 JSON still has SHA-256 `4221c55b7c7892eefc2d175f35883064c06cfe699874d4c8efec2850911803b3`. All collections captured by the previously paused extraction were compared and remain JSON-equivalent; this extraction adds previously omitted records rather than replacing them.

Route-only literal records are extracted through TypeScript's AST and a literal-only evaluator; the route code is not executed. This includes six vendor records and the risk-detail page's four timeline entries and three evidence filenames. That risk page reused these literals for every risk without recording a risk ID, so they remain unassigned source records. A scan of the other route-level literal collections found navigation/tone dictionaries and dashboard summary counters; those display counters are deliberately excluded.

The fixture contains both the original WS-X90 source arrays under `platform` and the original native-store projections. These are two representations of the same records, not additive populations. `platformIds` contains the original source-to-native ID mappings for components, nodes, assets, and scopes. Source pointers use JSON Pointer syntax, for example `/platform/control_implementations/0/by_component/0`.

## Extracted inventory

| Source collection                                 |     Records | Relationship to other source collections                                                  |
| ------------------------------------------------- | ----------: | ----------------------------------------------------------------------------------------- |
| Programs / people                                 |      6 / 14 | Shipped portfolio and named people                                                        |
| Vendors                                           |           6 | Exact organization names and original domain/report/risk metadata                         |
| Composition nodes / edges                         |     64 / 12 | 37 original Atlas nodes and 27 WS-X90 projected nodes                                     |
| Assessment scopes / saved scope selections        |     30 / 30 | Three Atlas scopes and 27 WS-X90 scopes                                                   |
| Assets / BOM documents                            |      26 / 5 | All asset node references resolve; BOM documents contain metadata, not supplied BOM files |
| Engineering requirements / allocations            | 646 / 1,336 | Includes the 640 original WS-X90 requirements                                             |
| Control-work records                              |       1,863 | Eight Atlas records; 546 WS-X90 whole-control records and 1,309 component contributions   |
| Control-work history / comments                   |      24 / 3 | Original source events, not newly asserted actions                                        |
| Library entries / versions                        |     19 / 19 | 165 control narratives, 51 requirements, 57 evidence entries, eight child links           |
| Library uses / policy assignments                 |       5 / 3 | No source acceptance decision records are supplied                                        |
| Evidence catalog                                  |         390 | Includes 368 WS-X90 source evidence references plus 22 other metadata records             |
| Campaigns / events / objectives                   | 6 / 9 / 431 | Native projections include two WS-X90 source assessments and their results                |
| Procedures / test runs                            |   429 / 367 | Original steps, observations, evidence IDs, and dates retained                            |
| Findings                                          |          62 | Includes the 52 WS-X90 source findings                                                    |
| Register risks / portfolio risks                  |      43 / 6 | Distinct collections; risk links must search both                                         |
| POA&M register items / OSCAL-shaped program items |      49 / 6 | The collections overlap in meaning; source IDs and program context distinguish records    |
| Workstreams / tasks / program milestones          | 7 / 10 / 95 | Includes original task subjects and due-date strings                                      |
| Packages / package artifacts / submissions        |   3 / 8 / 5 | Original source system links are unresolved; see gaps below                               |
| Scan runs / native results                        |     12 / 56 | Original source scan records preserved                                                    |
| Activity events                                   |          43 | Original unified activity projection                                                      |
| Security processes                                |           2 | Program association is derived through the explicitly referenced workstream               |

The fixture also preserves the original authorization-page object, six authorization artifacts, five enclave grants, six SCA observations, five residual-risk rows, two scope-service edges, six original reusable providers, ten older program-control summaries, and five timeline entries. These are retained even when there is no equivalent destination model or fully identified parent.

## Normalized assurance mapping

The pure [assurance mapper](../scripts/demo/map-assurance.mjs) constructs rows using existing table columns and deterministic tenant-specific UUIDs. It performs no database writes.

| Original records                                                  | Destination                                                                                                          | Mapping and boundary                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `people`                                                          | `parties`                                                                                                            | Exact recorded name and email; no Auth users or credentials                                                                                                                                                                                |
| `programs`                                                        | `programs`, `systems`, identifiable `program_role_assignments`                                                       | Original IDs remain codes; system IDs come from the actual `system` field. Missing person identities remain null.                                                                                                                          |
| `compositionNodes`, `compositionEdges`                            | `composition_nodes`, `component_relationships`                                                                       | Preserve hierarchy and source edges within the same system; normalize source taxonomy to the existing enum. Detailed source classification stays in provenance.                                                                            |
| `assessmentScopes`                                                | `scopes`                                                                                                             | Preserve source element, name, narrative, CIA values, and separation rationale. No adoption actor/date is invented.                                                                                                                        |
| `platform.components`                                             | `system_components`                                                                                                  | Preserve all 20 component IDs, types, descriptions and states; `conditional` uses the existing `other` enum with a mapping report.                                                                                                         |
| `assets`                                                          | `inventory_items`, `inventory_components`                                                                            | Preserve all 26 actual node/asset links and 20 explicit WS-X90 component associations. No serial number or manufacturer is generated.                                                                                                      |
| `library.entries`                                                 | `component_definitions`, `component_definition_revisions`, `defined_components`, `defined_component_implementations` | Preserve all 19 definitions and 165 authored control narratives as draft content. Source version labels and unsupported library fields remain in provenance. Assessment labels do not become implementation claims or published approvals. |
| `securityProcesses`                                               | `security_processes`                                                                                                 | Preserve both process names/narratives; join the source workstream to its program.                                                                                                                                                         |
| `requirements`                                                    | `engineering_requirements`, `requirement_revisions`, `requirement_decompositions`                                    | Preserve all 646 IDs, statements, source text revision numbers, acceptance criteria and five parent-child relationships. Missing short titles use the exact original statement.                                                            |
| `allocations`                                                     | `requirement_allocations`                                                                                            | Preserve 1,334 resolvable node/process allocations. Two provider targets lack a sufficiently identified providing system or organization.                                                                                                  |
| `scopeSelections`                                                 | Draft OSCAL/profile/revision/import/rule/resolution tables, `selected_controls`, `selection_provenance`              | Reproduce each exact saved control set against the pinned catalog. Every selected row points to its original source control entry.                                                                                                         |
| System-level source selections                                    | The same reference tables plus `ssp_revisions`                                                                       | Two draft SSPs: the exact 546-control WS-X90 selection and the union of the recorded Atlas scope selections. Four programs have no authored scoped selection and receive no invented SSP.                                                  |
| WS-X90 `control_implementations` and authored Atlas `controlWork` | `implemented_requirements`                                                                                           | Preserve 546 WS-X90 and six narrative-bearing Atlas records. Two remaining Atlas work items have no authored narrative.                                                                                                                    |
| WS-X90 `by_component`                                             | `component_contributions`, `requirement_implementations`                                                             | Preserve all 1,309 contribution narratives and 1,367 explicit requirement/component joins. Component implementation was unrecorded in the source, so the parent control's implementation claim is not copied.                              |

The resulting assurance plan has 32 draft profiles and 17,678 selected-control rows, because each saved scope selection remains independently pinned. These rows do not represent 17,678 unique catalog controls. Display counts must be derived in the relevant scope or SSP, never copied from the prototype's aggregate counters.

OSCAL profiles contain explicit source IDs with `with-child-controls: no`, an `as-is` merge, and an import of the exact existing catalog document revision. Generated document metadata identifies the source fixture hash and pointer. Its last-modified time is the actual local projection time, not a fabricated historical publication. The resolver name states that this is reproduction of an archived explicit selection. It does not claim to implement or validate CNSSI allocation rules. The saved nonauthoritative extraction/overlay rationale remains available in source provenance.

Source implementation status `not-implemented` maps to `not_implemented`; the narrow schema extension preserves all 38 such records. `partially-implemented` maps to `partial`. Unknown component implementation positions remain draft/planned because no source implementation state was recorded. Publication, assessment outcome, and implementation state remain separate concepts.

## Workflow and evidence mapping

The [workflow mapper](../scripts/demo/map-workflow.mjs) consumes the same fixture and assurance UUID maps. It maps resolvable evidence metadata and explicit requirement-evidence links, campaigns, procedure revisions/steps, recorded observations, operational issues, risks, POA&M items/milestones, workstreams, tasks, gates, and activity. Formal assessment documents and test-run models require exact plan, configuration, SSP or procedure-version pins that many original records lack; their original observations can be retained without inventing those pins. The import's generated mapping report is the exact per-record result.

POA&M links require an explicit source ID or finding reference in the same program. Two missing IDs never establish a relationship. Where the legacy register projection coarsened the original state, the original value wins: `PRG-1041/V-0001` remains Open and `PRG-1041/V-0003` remains Deferred, rather than their projected Ongoing labels. These differences are recorded as import issues.

All 368 WS-X90 evidence records supply a `urn:demo:evidence:...` reference and a source-claimed hash. None supplies file bytes. The remaining 22 catalog records have no artifact URI. No evidence catalog record has a URL. An immutable imported metadata version with an existing URI is not a claim that bytes were uploaded, that its checksum was verified, or that a reviewer accepted it.

There are three actual image files in the archive:

| File                                 |  Bytes | Recorded artifact association |
| ------------------------------------ | -----: | ----------------------------- |
| `src/assets/evidence-datacenter.jpg` | 61,871 | None                          |
| `src/assets/evidence-headers.png`    | 45,069 | None                          |
| `src/assets/evidence-iam.png`        | 34,945 | None                          |

Their complete paths and SHA-256 hashes are in the manifest. No source module imports them and no evidence record identifies them, so matching them by filename would invent evidence relationships. They are not uploaded as another record's evidence.

## Explicit gaps and source inconsistencies

- All three packages name system IDs absent from the actual system records: `SYS-2210`, `SYS-2214`, and `SYS-2301`. `PKG-0014` also names absent program `PRG-1052`. No package is assigned to a similar-looking system.
- The 147 ODP starting-value records identify a control and prose parameter references, often several values in one string. They do not identify exact OSCAL parameter IDs. Their text is retained without guessed parameter assignments.
- Requirement derivations identify whole controls or non-control sources such as threats and policies. The current normalized relationship requires a particular `control_part_id`; no assessment objective or statement link is invented to fill it.
- Provider allocations `ALC-0003` (`signing-enclave`) and `ALC-0006` (`provisioning-line`) lack an identified providing system or provider organization record. The provider labels and source allocation data remain in provenance.
- Many owner strings identify roles, teams, abbreviated names, or people absent from the 14-person directory. Exact-name matches are used; similar names and role titles do not create identities.
- Three POA&M records (`V-0001`, `V-0002`, `V-0003`) point to portfolio risk IDs `RSK-2388`, `RSK-2311`, and `RSK-2402`, rather than the separate register-risk collection. They are retained as source references when that risk cannot be mapped without inventing a program.
- Source labels such as `Aug 27, 09:41`, `Aug 12`, and `—` do not identify a complete timestamp. The importer leaves unavailable normalized dates null and preserves the exact string in provenance; it does not infer a year or timezone from the import clock.
- Original source aggregate counts, historical claims, synthetic checksums, and incomplete approvals are source content. They are not substitutes for normalized observations, uploaded bytes, authorization decisions, or review records.

## Verification

`node --test scripts/tests/demo-assurance.test.mjs scripts/tests/demo-workflow.test.mjs` checks actual archived-file/fixture hashes, generated table-column names, hierarchy ownership, complete requirement/contribution coverage, exact source selections, official NIST OSCAL 1.2.2 profile-schema validity, stable record IDs, exact source states, explicit same-program POA&M/risk joins, and absence of invented execution facts or source mutation. These are pure mapping checks. The separate import transaction check and committed import report establish what was actually written to the local database.

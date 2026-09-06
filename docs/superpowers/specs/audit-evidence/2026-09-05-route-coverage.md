# Application route coverage

Read-only SSR HTTP crawl on 2026-09-05. All 42 route definitions have at least one fixture URL response. This is not a hydrated, visual or interaction audit. Query-string tabs and every possible record/state are not covered. HTTP redirects were followed; the manifest records final paths. The root shell is included in source inspection but is not a separate route URL.

| Route definition                                   | Responses | Representative URL                         | Final HTTP status | Source                                                            |
| -------------------------------------------------- | --------: | ------------------------------------------ | ----------------- | ----------------------------------------------------------------- |
| `/briefing`                                        |         1 | `/briefing`                                | 200               | `src/routes/briefing.tsx`                                         |
| `/campaigns/$campaignId`                           |         4 | `/campaigns/TC-0022`                       | 200               | `src/routes/campaigns.$campaignId.tsx`                            |
| `/campaigns`                                       |         1 | `/campaigns`                               | 200               | `src/routes/campaigns.tsx`                                        |
| `/components`                                      |         1 | `/components`                              | 200               | `src/routes/components.tsx`                                       |
| `/controls`                                        |         1 | `/controls`                                | 200               | `src/routes/controls.tsx`                                         |
| `/evidence`                                        |         1 | `/evidence`                                | 200               | `src/routes/evidence.tsx`                                         |
| `/findings/$findingId`                             |        10 | `/findings/FND-2214`                       | 200               | `src/routes/findings.$findingId.tsx`                              |
| `/findings/assets/$assetId`                        |         6 | `/findings/assets/AST-0117`                | 200               | `src/routes/findings.assets.$assetId.tsx`                         |
| `/findings`                                        |         1 | `/findings`                                | 200               | `src/routes/findings.index.tsx`                                   |
| `/`                                                |         1 | `/`                                        | 200               | `src/routes/index.tsx`                                            |
| `/library/components/$componentKey`                |         7 | `/library/components/CMP-008`              | 200               | `src/routes/library.components.$componentKey.tsx`                 |
| `/library/components`                              |         1 | `/library/components`                      | 200               | `src/routes/library.components.index.tsx`                         |
| `/packages/$pkgId`                                 |         1 | `/packages/PKG-0007`                       | 200               | `src/routes/packages.$pkgId.tsx`                                  |
| `/packages`                                        |         1 | `/packages`                                | 200               | `src/routes/packages.index.tsx`                                   |
| `/people/$personId`                                |        14 | `/people/PPL-0101`                         | 200               | `src/routes/people.$personId.tsx`                                 |
| `/programs/$programId`                             |         6 | `/programs/PRG-0994`                       | 200               | `src/routes/programs.$programId.tsx`                              |
| `/programs/$programId/baseline`                    |         1 | `/programs/PRG-1041/baseline`              | 200               | `src/routes/programs.$programId_.baseline.tsx`                    |
| `/programs/$programId/components/$componentId`     |        37 | `/programs/PRG-1041/components/CN-0001`    | 200               | `src/routes/programs.$programId_.components.$componentId.tsx`     |
| `/programs/$programId/composition`                 |         1 | `/programs/PRG-1041/composition`           | 200               | `src/routes/programs.$programId_.composition.tsx`                 |
| `/programs/$programId/conmon`                      |         1 | `/programs/PRG-1041/conmon`                | 200               | `src/routes/programs.$programId_.conmon.tsx`                      |
| `/programs/$programId/controls/$controlId`         |       375 | `/programs/PRG-1041/controls/AC-1`         | 200               | `src/routes/programs.$programId_.controls.$controlId.tsx`         |
| `/programs/$programId/dashboard`                   |         1 | `/programs/PRG-1041/dashboard`             | 200               | `src/routes/programs.$programId_.dashboard.tsx`                   |
| `/programs/$programId/export`                      |         1 | `/programs/PRG-1041/export`                | 200               | `src/routes/programs.$programId_.export.tsx`                      |
| `/programs/$programId/ingestion`                   |         1 | `/programs/PRG-1041/ingestion`             | 200               | `src/routes/programs.$programId_.ingestion.tsx`                   |
| `/programs/$programId/inheritance`                 |         1 | `/programs/PRG-1041/inheritance`           | 200               | `src/routes/programs.$programId_.inheritance.tsx`                 |
| `/programs/$programId/requirements/$requirementId` |         6 | `/programs/PRG-1041/requirements/REQ-0042` | 200               | `src/routes/programs.$programId_.requirements.$requirementId.tsx` |
| `/programs/$programId/risk`                        |         1 | `/programs/PRG-1041/risk`                  | 200               | `src/routes/programs.$programId_.risk.tsx`                        |
| `/programs/$programId/sctm`                        |         1 | `/programs/PRG-1041/sctm`                  | 200               | `src/routes/programs.$programId_.sctm.tsx`                        |
| `/programs/$programId/systems/$scopeId`            |         1 | `/programs/PRG-1041/systems/SYS-0001`      | 200               | `src/routes/programs.$programId_.systems.$scopeId.tsx`            |
| `/programs/$programId/te-phases`                   |         1 | `/programs/PRG-1041/te-phases`             | 200               | `src/routes/programs.$programId_.te-phases.tsx`                   |
| `/programs/new`                                    |         1 | `/programs/new`                            | 200               | `src/routes/programs.new.tsx`                                     |
| `/programs`                                        |         1 | `/programs`                                | 200               | `src/routes/programs.tsx`                                         |
| `/register`                                        |         1 | `/register`                                | 200               | `src/routes/register.index.tsx`                                   |
| `/register/poam/$poamId`                           |         6 | `/register/poam/POAM-0058`                 | 200               | `src/routes/register.poam.$poamId.tsx`                            |
| `/register/risks/$riskId`                          |         3 | `/register/risks/RSK-0009`                 | 200               | `src/routes/register.risks.$riskId.tsx`                           |
| `/risks/$riskId`                                   |         5 | `/risks/RSK-2311`                          | 200               | `src/routes/risks.$riskId.tsx`                                    |
| `/risks`                                           |         1 | `/risks`                                   | 200               | `src/routes/risks.tsx`                                            |
| `/scope`                                           |         1 | `/scope`                                   | 200               | `src/routes/scope.tsx`                                            |
| `/stigs`                                           |         1 | `/stigs`                                   | 200               | `src/routes/stigs.tsx`                                            |
| `/vendors`                                         |         1 | `/vendors`                                 | 200               | `src/routes/vendors.tsx`                                          |
| `/work`                                            |         1 | `/work`                                    | 200               | `src/routes/work.tsx`                                             |
| `/workstreams/$workstreamId`                       |         7 | `/workstreams/WS-0101`                     | 200               | `src/routes/workstreams.$workstreamId.tsx`                        |

Total: 514 URL responses. A route pattern can overlap a literal route (for example `/programs/new` matches the dynamic program pattern lexically); per-pattern counts therefore need not sum to the unique URL total. All fixtures were drawn from source or returned links.

## SSR observations

- Six URLs contain nested interactive source markup: `/` and `/findings/FND-2214`, `/findings/FND-2240`, `/findings/FND-2246`, `/findings/FND-2263`, `/findings/FND-2281`. Source confirmation appears in DS-11.
- Three responses contain no initial h1; this is a follow-up signal, not a confirmed missing-heading defect. Baseline intentionally disables SSR, and source for `/components` contains title metadata and a PageHeader despite the sparse response. Hydration and loading behavior need browser review.
- The URL crawler cannot prove that clicks, searches, form saves, authentication, responsive layouts, or stored preferences work.
- Complete app source/API screening is in `2026-09-05-source-inventory.json`; raw-element counts are not automatically defects.

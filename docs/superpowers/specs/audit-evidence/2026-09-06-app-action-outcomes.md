# App action outcomes: implementation evidence

This pass addresses DS-05, DS-12, DS-17, DS-18, and DS-20 in the second-pass audit. Changes are in the working tree, with existing staged work preserved. No external service was contacted or connected.

## Observable actions

| Surface | Result |
| --- | --- |
| Risk creation | A validated record is added to the register. Description, scores, ownership, and framework survive reload in this browser. A proposed treatment does not automatically lower the residual risk. |
| Save risk draft | The draft is persisted and restored on reopening. A storage failure keeps the dialog and input open with an error. |
| Add treatment | Plan, action, assignee, due date, and timestamp are persisted. The detail page displays the recorded plans. Storage failure does not mutate the risk. |
| Archive program | A persisted archive marker moves the record to the Archived program list. Records stay readable; selected archived programs can be restored. Copy describes this precise scope. |
| Schedule assessments | Selected records receive a persisted date, displayed in a table column. A bulk storage failure makes no partial update. Copy does not claim assessor notifications. |
| Program export | Downloads actual program records as JSON. It no longer claims to generate an SSP. |
| Portfolio, findings, POA&M, provider exports | Download the actual relevant records as JSON, with labels describing that format. They do not claim SAR/eMASS compliance or presentation generation. |
| Generic assessment action | Selects a control and opens its existing assessment workspace. Removes the duplicate uncontrolled form and its false SCTM-success toast; existing role and readiness checks remain authoritative. |
| CDR action | Opens the real export/bundle workspace. Removes fake delayed generation, fake ZIP download, and signing claims. |
| Global search | Searches programs, risks, and findings and opens the selected record. Its label matches that scope; the unused global shortcut hint is removed. |
| Help, profile/settings, notifications | Open meaningful help/appearance dialogs or My work. Profile follows the active session. |

Browser storage is intentionally described as browser storage. Existing domain control-work, task, and activity stores remain the staged prototype's session stores; this pass does not claim that every domain mutation became durable across reloads. Authorization signing, access administration, scanners, uploads, imports, vendor creation, and other unconnected workflows are explicitly unavailable.

## Action inventory

[The machine-readable census](2026-09-06-action-inventory.json) records every app/route `Button`, `IconButton`, native `button`, and `UnavailableAction`: **269 source instances**, with **zero unclassified missing handlers**.

- 201 have handlers; presence alone is not a behavioral proof.
- 8 delegate to navigation; 6 delegate to an overlay trigger; 8 receive delegated props.
- 2 submit real forms.
- 37 are visibly unavailable with a reason; 1 existing icon control is explicitly disabled and named unavailable.
- 6 are intentionally demonstrative in the design-system sampler.

Redundant inert edit icons were removed. `UnavailableAction` keeps the unavailable label visible and exposes the explanation to keyboard and pointer users. Library compound actions and internal native controls remain owned by their respective components; the census does not pretend to enumerate rendered controls inside those libraries.

## Accessibility and recovery

- Corrected the three direct `Link > Button` compositions and the unnamed risk back link; the empty icon-only risk button is now a named, explicitly unavailable IconButton.
- Named family/status/currency selectors in the control, SCTM, lifecycle, and evidence toolbars. Repeated milestone and property editors include their row context in the accessible name.
- Risk and treatment dialogs submit through actual forms; failed saves keep input intact.
- Empty control/CCI, findings, and POA&M searches explain the filtered result and offer Clear filters. Result counts use a status region.
- A failed assessment-catalog import is caught, states that only CCI rows are shown, and offers a persistent Retry action. Successful retry updates all subscribed consumers.
- Multi-column forms collapse to one column at narrow widths. Fixed content/control widths are bounded by their container; legitimate table and diagram dimensions remain explicit.
- Root error/404 actions use system Buttons, removing their mismatched custom hover colors.

## Verification

`npm run test:app` passes five command tests covering draft/create/treatment reload, malformed persisted records, invalid scores, storage-failure atomicity, and archive/restore/schedule reload. The root CI workflow runs this suite.

`Product/Action outcomes` contains three tagged app-contract stories using the actual risk dialog: draft reopening, invalid-score input retention, and storage-failure input retention. Story cleanup restores the prior draft and browser-storage value. Root orchestration owns the browser-story run and final build results.

Source typechecking and the scoped app ESLint error gate passed during this pass. Final combined verification is recorded by the root agent because package and app changes were developed concurrently. Responsive improvements require the combined rendered review; a source survey alone cannot certify reflow or screen-reader behavior.

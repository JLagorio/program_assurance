# Requirement workspace

The program's Requirements tab uses the shared design system DataTable. The requirement code opens its full page; the eye opens a Shell.Panel beside the table. Search, filters, sorting and columns remain available while reviewing records. Previous and next follow the visible requirement order.

The table shows actual requirement statements, allocation targets and linked controls. Expand allocations to inspect their recorded details. Parent and child rows come from recorded decomposition links. Ambiguous or cyclic relationships remain visible as flat rows with a notice. Requirements without authored details remain visible as “Details not recorded”; viewing one does not invent content. Optional columns and saved views use the existing table controls.

## Inline editing and edit history

The preview and full page share Statement, Control mappings, Allocation, Verification, Evidence and Edit history. Opening the full page retains the selected tab. The requirement has no revision action, version selector, revision table or publication workflow. Old revision search parameters no longer select another snapshot in the product interface.

Title, requirement type, owner, statement, acceptance criteria and rationale use the design system's `Editable` controls. Click a value to edit it. Enter or leaving a text field saves; multiline fields use Control/Command+Enter or leaving the field. Escape cancels. Owner choices come from actual workspace parties; requirement types use the schema's controlled values. An existing identity without authored content uses the focused **Add requirement details** dialog.

Each changed field updates the same requirement record and appends its actual before/after values, actor and time to edit history in one transaction. Existing relationships keep their IDs and targets. Edits do not create snapshots or copies. Blank required values fail validation; unchanged values produce no edit event.

Stale requests fail instead of overwriting another session's changes. Failed saves retain the proposed value for retry or discard. Repeating an identical request returns its recorded result without duplicating the edit or history entry. See [requirement edit persistence](requirement-edit-history.md) for database behavior and compatibility with existing records.

## Evidence flow

**Add evidence** opens the design system RecordBrowser as a large dialog with search, filters, multiple selection and an internal preview. It lists published evidence versions belonging to the program or the workspace without a program assignment. Evidence links retain the exact selected evidence version; already linked versions are excluded.

**New evidence / Upload** moves to the evidence creation dialog and then version preparation. Creation records an artifact and its first draft metadata version. Preparation supports private file upload and recovery or a recorded external URI. **Publish version** freezes the evidence version; it does not link it to a requirement or record an approval. Returning to the browser retains prior selections, and the new published evidence version can then be selected.

**Link evidence** saves the complete selection through `link_requirement_evidence` in one transaction. The database checks workspace access, program scope, the current requirement and every selected published evidence version. Requirements do not need to enter a revision workflow to link evidence. Failed requests leave selections available for retry. Existing links and authored claims survive repeated requests. Selecting evidence does not invent applicability decisions or review results.

The evidence picker, linked evidence preview and version preparation share `EvidenceVersionDetails`. Sequential dialogs use the RecordBrowser's optional controlled selection API; uncontrolled consumers clear their selections when closed.

## Verification

With the local stack and frontend running, `npm run test:requirements` exercises authorization and atomic edits, edit history, preserved record and relationship IDs, exact evidence links, the preview and full-page flows, retained selections, failed-save recovery and stale edits. It creates and removes disposable test workspaces. Read-only developer workspace checks are available through `node scripts/test-requirements-workspace.mjs`.

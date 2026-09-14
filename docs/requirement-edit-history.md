# Requirement edit persistence

Requirements use in-place edits and append-only edit history. `edit_requirement` accepts a requirement identity, its current content row, an expected concurrency counter, a request UUID and a patch of authored fields. It updates that same row and records actual changed values, the authenticated actor and database time in one transaction. A normalized no-op creates no edit entry.

Editable fields are title, statement, acceptance criteria, rationale, requirement type and owner. Owner values reference actual parties in the workspace. The product uses the existing design system's inline editing controls. Both the preview and full page show the same current content and edit history, without revision actions or selectors.

A requirement-specific audit trigger records content creation and changes, including edits from the schema inspector. Authenticated clients cannot directly forge typed requirement edit events. The activity event references the same requirement content row, with `source_requirement_revision_id` empty for new direct edits. The `changes` object stores actual before/after values. Existing historical events remain stored.

The existing `engineering_requirements` / `requirement_revisions` tables and foreign keys remain compatible with previously stored records. Current edits reuse the latest existing content row; they do not create another row, increment a version number, or copy relationships. The internal optimistic concurrency counter still detects stale writes. Previously stored superseded rows remain protected. The obsolete revision-creation RPC is no longer available to application users.

Authenticated authors create the first content row with storage number 1. The local privileged importer may preserve the source's original positive storage number for that sole row. Both paths reject additional content rows. The additive [import compatibility migration](../supabase/migrations/20260913010000_requirement_import_compatibility.sql) preserves fresh demo imports without restoring the revision workflow; `node scripts/test-requirement-import-compatibility.mjs` checks this boundary in a rolled-back transaction.

A legacy publication flag on the current requirement does not prevent ordinary requirement edits or linking. Publication rules for evidence, procedures and other independently versioned reference records continue to apply. Existing evidence links, allocations, control mappings and decomposition links retain their identities and targets when a requirement field changes.

A request UUID identifies a save attempt. Retrying the same normalized payload as the same actor returns its recorded result. Reusing the UUID for different values fails. An out-of-date concurrency counter fails without changing data. The UI retains the proposed value for retry or discard. Content changes, their audit entry and retry receipt either all commit or all roll back.

`node scripts/test-requirement-edit-backend.mjs` validates in-place persistence, actual before/after history, preserved relationships, permission boundaries, no-ops, exact retries, stale/concurrent edits and atomic rollback in disposable workspaces. `node scripts/test-requirement-inline-edit.mjs` exercises the corresponding UI behavior.

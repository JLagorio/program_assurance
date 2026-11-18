# Builder B: SSP versions, review and the SSP register

Read `COMMON.md` (same folder) first. Your files are `PROTO/mod-ssp-history.js` and `PROTO/mod-ssp-history.css`, with the CSS prefix `sh-`.

Your routes:

- `ssp-history`: version history, full window;
- `ssp-review`: review and submit, full window;
- `ssps`: the register of system security plans. It sits in the app shell, so it keeps the navigation. Set `ROUTE_NAV["ssps"] = "ssps"`; the integrator adds the nav item.

Builder A calls `PA.fullWindow("ssp")`, which covers every `ssp-…` route, but you call it too in case your module loads alone. Builder A, working at the same time, owns `ssp`, the editor. Link to it and never draw it.

## What Josef asked for

Josef wants versions "tracked gracefully in the backend with edit history preserved", in a Google Docs-like SSP that many people edit at once. Your screens make that tangible:

- every edit is kept;
- versions are snapshots you can open, compare, name and restore, and a restore adds a version rather than deleting any;
- published revisions are frozen;
- live-data sections and their records keep one history.

## Vanta references (view at most these)

- `VANTA/ux/policies/using-ai-change-summaries-in-vanta--02.png`, `--03.png` and `--04.png`: review and finalize with version history; assign an approver with an AI change summary; the pending approval version.
- `VANTA/ux/policies/creating-policies-with-policy-builder--03.png` and `--04.png`: "Assign approvers and submit", and the approval banner on the list.
- `VANTA/ux/policies/commenting-in-the-policy-editor--01.png`: create a new version (editor, upload, sync).
- `VANTA/ux/documents/system-description-generator--01.png`: Edit system description from the framework.

For version history itself, follow Google Docs' conventions: a read-only document with changes in their authors' colours, and on the right a list of versions grouped by day, named versions, a "Show changes" toggle and "Restore this version".

## 1. `ssp-history`: version history (full window)

**Header.** "← Back to editing" (→ `#ssp`), the title "Version history", the document's name and revision as a sub line, and actions:

- Restore this version (the ink primary, disabled on the current version, with its reason);
- Name this version;
- Compare.

**Right panel (about 340px): the versions.**

- First comes `PA.SSP.session` (edits made in the editor this session, newest first, at `time`). Then `PA.SSP.versions`.
- Versions are grouped with `PA.SSP.ui.group` into Today, Yesterday, This week and Earlier.
- An entry shows its time (`PA.SSP.ui.when`), its name (a named version shows the name in bold), its authors as small coloured dots with names, and its changes as short lines ("AC-2 · Narrative edited") that jump within the document view.
- A run of unnamed versions folds under a disclosure, "3 more versions", as in Docs.
- Toggles: "Only named versions" and "Show changes".
- Special entries:
  - **"Revision 3 started from revision 2"**: a branch marker.
  - **"Revision 2 published"**: a lock, "Frozen", and the approvals with `AK.approval` or a compact version of it (ISSM Joel Barrantes approved Jul 21; AO R. Calloway signed Jul 25). It notes that published revisions can't change; opening it shows the document as it was, read only.
  - **Revision 1**, superseded, from `PA.SSP.revisions`.
- Each entry has a quiet "Details" disclosure: "214 changes since the version before · edited by … · records written: AC-2's implementation, record revision 1 → 2". This is the backend made visible. Under the list, a one-line "How versions are kept" link opens a short popover:
  - every edit is kept as an operation, and a version is a snapshot of them;
  - names mark the ones that matter;
  - restore adds a new version;
  - a published revision is frozen;
  - a live-data section writes to its record at the next record revision, so the record's history and the document's history agree.

  Keep it to five short lines.

**Centre: the document at the chosen version, read only, using the shared `sd-` classes.**

- Render the outline sections (`PA.SSP.sections`) in their numbered order: headings and authored text, the live tables in compact form, and the figures as captioned placeholders. Builder A draws the real diagrams; you may draw a simple framed thumbnail.
- For section 11, show only the controls the chosen version touched, each with its family heading. Fold the rest into quiet lines ("AC · 51 controls unchanged").
- Changes show in their author's colour with `sd-ins` and `sd-del` (`PA.SSP.ui.diff(before, after, author)`), and **status changes as pill → pill** (`AK.change`).
  - **Version v37 is real.** For the six controls in `PA.SSP.changed`, the change is `ctl.was.n` → `ctl.n` and `ctl.was.s` → `ctl.s`. These are the real changes between published revision 2 and draft revision 3.
  - For the example versions, draw small plausible changes on the sections they name, in their author's colour, and mark them Example.
  - For session versions, show the reader's own edits, the current text against the text at page load. Keep a snapshot of the narratives when your module first renders, before any edit, so the comparison works.
- A thin bar above the page names the version ("Nov 13, 3:10 PM · Priya Raghavan · 6 controls changed") and offers "Previous change" and "Next change" buttons that walk the marks.

**Restore** asks first, in a dialog: "Restoring makes a new version from this one. Every version stays in the history." On confirm, it adds an entry at the top of the session ("Restored from Nov 16, 4:20 PM"), shows a toast and logs it. Nothing is deleted.

**Name this version** opens a dialog with a name field. The name appears on the entry.

**Compare** picks two versions, with "Revision 2 (published)" and "Current" as the defaults. The result is a summary row (6 controls changed, 4 statuses moved up, sections added) and then the redlines.

## 2. `ssp-review`: submit revision 3 for review (full window)

This is Vanta's review and finalize, in RMF's words. The header is "← Back to editing", the title "Submit revision 3 for review", and the primary "Submit for review". The body has a left column and a right rail.

**Left column**

- **Change summary since revision 2**, labelled "AI summary · check it before you submit".
  - Bullets: the six real control changes, each with its code, title and status move, linked to `ssp-history`;
  - sections 12 and 13 added (Example);
  - boundary text and inventory edited (Example);
  - "Edit summary".
- **Readiness**, a checklist from `PA.SSP.checks`, sorted with what blocks submission first. Treat k7 (no categorization rationale) as blocking, since eMASS requires one, and the rest as warnings with their counts. Each item carries a link back into the editor.
- **Review comment**, required (`AK.reviewComment`).

**Right rail**

- **Approvers** (`AK.approval`): step 1 is the ISSM, Joel Barrantes; step 2 is the authorizing official, R. Calloway. These are the real roles from `PA.SSP.roles`. Note that only the holder of the AO role can sign.
- **What happens next**: the revision is locked for review; on the AO's signature it is published and frozen, and revision 4 starts as the next draft.
- **Export**: OSCAL SSP (JSON), Word (.docx), PDF and eMASS package. Each shows a toast, since the viewer blocks downloads.

**Submit**

- With k7 unresolved, it shows the blocker inline and doesn't submit. Offer "Submit anyway as a draft for ISSM review", or "Fix in the editor" (→ `#ssp`). Choose one sensible way and say it.
- On submit, the page turns to its submitted state: `AK.pendingVersion` / `AK.awaiting("Joel Barrantes", ["Approve", "Request changes"])`, a toast, and `PA.SSP.log({kind: "submit", what: "Submitted for ISSM review"})`. The approve buttons there play Joel's part. Mark that once as a walkthrough aid, Example.
- Approving moves the approval to the AO step.

## 3. `ssps`: system security plans (in the shell)

A register in the after style: `AK.indexHead`, then a framed table. Use no stat-card pair here; Vanta's document lists go straight to the table.

- **Rows**: one SSP per system with an SSP revision, from the database:
  - WS-X90's SYS-WSX90 has revisions 1 to 3 (draft 3, published 2);
  - query `ssp_revisions` joined to `systems` and `programs` across the tenant for the others.
- **Columns**: System (code and name), Program, Current revision, State pill, Controls, Placeholders (computed for WS-X90 from `PA.SSP.counts.placeholders`; for the others, compute the same way from the database where it's cheap, else omit the number), Last edited, Editors (avatars), Approval (for example "Published Jul 25").
- **Tabs**: All, Drafts, In review, Published, with counts.
- **Row click** opens a side panel (`P["ssp"]`) with the revisions as a list (state and dates), the people with access and "Open document". "Open document" goes to `#ssp` for WS-X90; for the others, say that only WS-X90's document is drawn in this prototype.
- **Primary**: "New revision". Its dialog starts from the published revision or from a file upload (OSCAL, Word), as Vanta's "Create a new version" does. Confirming shows a toast.

## Priorities if you must cut (cut from the bottom)

1. `ssp-history` with the real v37 redlines, the grouped version list, the published and frozen entry, session entries and Restore.
2. `ssp-review` with the summary, readiness, approvers and the submit flow.
3. `ssps`.
4. Compare, Name this version, and the Details disclosures.

## At 390px

- The version list becomes a sheet opened by a "Versions" button, and the document takes the width.
- The review page stacks into one column.
- Nothing overflows.

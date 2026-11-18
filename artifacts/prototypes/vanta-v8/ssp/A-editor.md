# Builder A: the SSP editor

Read `COMMON.md` (same folder) first. Your files: `PROTO/mod-ssp-editor.js` and `PROTO/mod-ssp-editor.css`. Your CSS prefix is `se-`.

Your route is `ssp`, the editor. Call `PA.fullWindow("ssp")` at module load. That also makes builder B's `ssp-history` and `ssp-review` full window.

Builder B, working at the same time, owns three routes:

- `ssps`: the register of SSPs;
- `ssp-history`: version history;
- `ssp-review`: review and submit.

Link to them; never draw them.

## What Josef asked for

"A Google Doc type editor where it's live, multiple users, can see multiple users, versions are tracked gracefully in the backend with edit history preserved, comments, etc." It must be "rich… with data-backed sections for implementation narratives… architecture diagrams, systems diagrams… custom sections". It's "not 1:1", and "this is also where AI would be invaluable."

So the document is part records and part authored text:

- a **live-data block** reads from a record, and editing it writes to that record;
- **authored and custom sections** are plain rich text.

Make that difference visible and calm. It should look like Google Docs at first sight, wearing Ledger's tokens and Vanta's quiet chrome.

## Vanta references (view at most these)

Vanta has no real-time editor. Take its document chrome, comments, review and AI patterns, and take Google Docs' collaboration conventions.

- `VANTA/ux/documents/system-description-generator--02.png` and `--03.png`: Vanta's system description, a SOC 2 cousin of an SSP. It has generator sections with completion and "Submit for approval".
- `VANTA/ux/policies/commenting-in-the-policy-editor--02.png` and `--03.png`: highlighted text with a comment, then the thread with its reply field.
- `VANTA/ux/policies/why-can-t-i-tag-the-policy-owner-in-the-policy-editor--01.png`: auto-filled fields inside the document text.
- `VANTA/ux/policies/creating-policies-with-policy-builder--02.png`: sections with guidance beside the preview.
- `VANTA/ux/policies/using-ai-change-summaries-in-vanta--02.png`: review with version history.

## The screen (1440 wide)

### 1. Header bar (full width, about 56px)

- Left:
  - a back link to `ssps` ("System security plans");
  - the document title, editable inline: "WS-X90 System Security Plan";
  - chips for "Revision 3", "Draft" and "SYS-WSX90";
  - a save state: "Saved", "Saving…", or "Saved to AC-2's implementation".
- Right:
  - **presence**: the avatars of the people in the document, from `PA.SSP.people` minus you, each ringed in its person's colour, then "+ you". Clicking an avatar opens a small card: name, role, access, where they are ("Editing 11.1 AC-2"), Go to (scroll there) and Follow (stay with their cursor until you scroll).
  - a Comments toggle with its count of open threads;
  - Version history (a clock icon) → `#ssp-history`;
  - Share → a dialog listing who has access (people plus `PA.SSP.access`): Editor, Commenter or Viewer. The assessor is a commenter. It also offers a link-access toggle and an "Invite" field.
  - the mode menu: Editing, Suggesting or Viewing, as in Google Docs;
  - one ink primary, Submit for review → `#ssp-review`.

### 2. Toolbar under it

- Undo and redo;
- a style select (Normal text, Heading 1, Heading 2, Heading 3);
- bold, italic, underline and link;
- bulleted and numbered lists;
- table;
- **Insert ▾**:
  - Live data ›: Control implementation…, Inventory table, Roles table, Interconnections, Ports and protocols, Baseline summary;
  - Diagram ›: Authorization boundary, Data flows, Upload an image;
  - Section from a template…;
  - Page break;
- Comment (+);
- **Assist** (a sparkle), which toggles the AI panel.

Formatting can use `document.execCommand` on authored text; this is a prototype. On a phone the toolbar scrolls sideways inside itself.

### 3. Left outline (about 248px)

- `PA.SSP.sections`, numbered.
- Section 11 expands into its 18 families (`PA.SSP.families`). Each family shows its count, and a quiet badge for its placeholder narratives where it has any.
- Each section shows a completion ring, as in Vanta's system description generator, and a small live icon on data and diagram sections.
- Small coloured dots show where the other people are.
- A "Gaps only" filter keeps only the sections and families with placeholders, comments or checks.
- "Add section" at the bottom opens a dialog: Blank, a template from `PA.SSP.templates`, or a live-data section. You pick the name and position. The new section appears in the outline and the page, marked as a custom section, with a "Draft this section with Assist" action.

### 4. The page (`sd-desk` › `sd-page`, 816px)

The cover block comes first: the title, then a sub line with the system, revision, catalog and baseline. The sections follow, in order:

- **1, 2, 3: live data.** Use `sd-live`, with a header naming the source and showing "Synced" (for example, "Live · System record SYS-WSX90 · synced 2 min ago"), plus Open record, History and Detach.
  - **1 System identification**: a facts table from `PA.SSP.system`.
  - **2 Security categorization**: C, I and A as High, High and Moderate (CNSSI 1253), then "Categorization rationale", which is empty. Show it as an empty placeholder, with comment c7 pinned to the words "Categorization rationale". AI suggestion g2 is pending as an insertion there.
  - **3 Roles and responsibilities**: a table from `PA.SSP.roles`.
- **4 Mission and purpose**: authored text, editable (contenteditable).
- **5 Authorization boundary**: a **diagram drawn as SVG from `PA.SSP.elements`**.
  - Draw a boundary box labelled SYS-WSX90 around six subsystem groups, each listing its elements with their LRU.
  - Outside the boundary, draw the external parties from `PA.SSP.interconnections`, with lines to the element named in `via`. The inherited identity service is dashed.
  - Caption it "Figure 1. Authorization boundary. Drawn from the system tree: 6 subsystems, 20 elements", and add "Regenerate", "Edit layout" and "Replace with an image".
  - The authored text follows, with comment c8, which is resolved.
  - The SVG uses tokens through `currentColor` or CSS variables, so it holds up in dark mode, and it scales down at 390.
- **6 Architecture and data flows**: a second SVG showing the data flows between the subsystems. Mission plans come in through the gateway to the mission computer; telemetry goes out over the radio; every element logs to the Security Log Collector. Mark it Example.
- **7 to 10: live tables.**
  - **7 Interconnections**: from `PA.SSP.interconnections`.
  - **8 Hardware and software inventory**: from `PA.SSP.elements` (element, code, LRU, type, subsystem). Marcus is editing here.
  - **9 Ports, protocols and services**: from `PA.SSP.ppsm`, marked Example.
  - **10 Control baseline**: the catalog, the baseline and 560 controls, a one-line bar of the implementation statuses (162, 216, 144, 38) and one of the control statuses, with Open baseline.
- **11 Control implementations.** This is the heart of the document. There is a heading per family ("11.1 Access control (AC) · 52"). Each control is a live-data block:
  - **Its head** gives the code and title, the implementation status pill (`PA.SSP.IMPL[s]`), the control status pill (`PA.SSP.STATUS[cs]`), "Objectives 26 of 26 assessed" from `oa` and `ob`, and "2 requirements · 2 with evidence" from `r` and `e`.
  - **Its body** is the narrative, `n`. It is editable, and **edits save to the record**:
    - while you type, a quiet line in the block reads "Edits save to AC-2's implementation";
    - on blur, the save state reads "Saved to AC-2's implementation · record revision 2" (raise `rv`, update `n`), and you `PA.SSP.log({what: "Narrative edited", at: code})`.
  - **A placeholder narrative** (`ph`) wears a "Placeholder text" chip and the `sd-ph` style, with a "Draft with Assist" button.
  - **The six controls in `PA.SSP.changed`** wear "Changed since revision 2". It opens a small popover with the redline, `PA.SSP.ui.diff(was.n, n)`, and the status change. It also has a link to `#ssp-history`.
  - **AC-17(2) and SC-23** wear "Source changed": Mission Computer version 2 leaves them to review (check k6). Offer Review change and Dismiss.
  - **AC-2(3)**: mark the words "72 hours" and "90 days" as values the baseline doesn't set (check k5), with a tooltip.

  Render the families lazily: AC fully at first, the others when they scroll near or are opened from the outline. Each family has 10 to 68 controls. Every family must be reachable.
- **12, 13: custom sections.** Each has a "Custom section" chip (13 also has "From a template"). The authored text is editable.
- **A, B, C: appendices.**
  - **A Inherited controls**: the identity controls inherited from the corporate identity provider, marked Example.
  - **B Plan of action and milestones**: live from `PA.data.POAM`.
  - **C Change log**: live from `PA.SSP.versions` plus `PA.SSP.session`.

### 5. Right side (about 320px): the comment margin, or the Assist panel

**Comments.** Cards in the style of Google Docs, aligned beside their anchors where possible, else in document order.

- Anchors are `sd-mark` spans around `quote` inside the block named by `at`. Clicking either the card or the anchor highlights both.
- A card holds the avatar, name and role. The assessor's role is an outlined badge, as in Vanta.
- It then shows the time (`PA.SSP.ui.when`), the text with @mentions as chips, the replies, a reply box, and Resolve (a check). A task shows "Assigned to Marcus Ryde · due Dec 4" with `AK.due`.
- Two tabs, **Internal** and **Assessor**, as in Vanta's split; the assessor tab carries the "The assessor can read this" band. Add a filter: Open or Resolved.
- **New comment:** select text in the page, and a floating "Comment" button appears. It creates a card with a focused composer.
  - Typing @ suggests people. A mention offers "Assign to <name>", which makes it a task with a due date.
  - Posting adds the thread, logs it, and shows a toast.

**Suggestions.** g1 to g3 show as tracked changes in the page: `sd-del` and `sd-ins` in the author's colour, and `sd-ai` for AI. Their cards in the margin carry Accept and Reject.

- An AI card says "AI draft · needs review", names who asked, shows its **sources** as chips (the real requirement and evidence titles in `sources`) and its "why".
- **Accept** writes the text into the record, exactly as an edit does, and logs "AI draft accepted by Ingrid Solberg".
- **Reject** removes it.

In **Suggesting** mode, your own typing in authored or narrative text becomes an `sd-ins` in your colour, and deleting becomes `sd-del`. Each produces a suggestion card. Intercept `beforeinput` for insertText and the delete types; a simple version is fine.

**Assist panel** (it replaces the margin when toggled). It has three tabs.

- **Check**: `PA.SSP.checks`. Each check shows its severity, title, detail, code chips (clicking one jumps to the control) and its action.
  - "Draft 74 narratives" runs a visible queue. Drafting one at a time takes about 150ms each, or jumps straight to done under reduced motion. Each placeholder control then holds an AI suggestion, built from that control's enhancements' narratives where it has any, else a short draft marked Example.
  - After it: "74 drafts to review", with Review next (jump and focus) and "Accept all from…".
  - Never auto-accept. Accepting all needs a confirmation that says each control's narrative will be replaced in its record.
- **Draft**: a target (the selected control or section, or pick one), its sources (checkboxes for its requirements, evidence, component narratives, enhancements and revision 2's text), a voice ("SSP voice: present tense, names elements by LRU") and Generate. The result is a suggestion in the page, never a direct edit.
- **Ask**: a chat with three canned answers that cite records as chips, plus typed questions. The canned questions:
  - "What changed since revision 2?" lists the six real changes;
  - "Which controls do we inherit from the corporate identity provider?" (Example);
  - "Which narratives cite the Mission Computer?" counts the narratives whose text names "Mission Computer" or "LRU-001", as a real count.

Every AI output is labelled and attributed, and needs a person to accept it.

### 6. Live presence, simulated

The collaborators are scripted; mark this once, in the note line.

- **Priya's caret** sits in AC-2, beside the pending AI draft. Her flag reads "Priya Raghavan · reviewing the AI draft".
- **Marcus types** into the inventory, in the description cell of the Configuration Repository (LRU-020). He types this at a human pace: "Holds the signed configuration baseline and the technician procedure packages." It is grounded in AC-1's narrative.
- **D. Okafor's viewport marker** sits beside SI-14(1).
- **About 20s in**, Marcus replies on thread c2: "Dec 4. The signing job is in test." It arrives with a brief highlight, and the margin count rises.
- **The outline dots and the presence card follow their positions.**
- **A switch**, "Simulated collaborators", sits in the presence card and is on by default. Under reduced motion everything appears in its final state.

## Priorities if you must cut (cut from the bottom)

1. Page rendering with real data, live blocks, editing that saves to records, outline navigation.
2. Comments and suggestions with Accept and Reject, presence avatars and remote carets.
3. The Assist panel's Check and Draft, then Ask.
4. Diagrams.
5. Suggesting mode on your own typing, Add section, Insert dialogs, Follow.

## At 390px

- The outline sits behind a "Contents" button, as a sheet.
- The margin and Assist open as a full-width panel over the page.
- The header keeps the back link, the title, one avatar stack and the primary; the rest goes into a "More" menu.
- Nothing overflows.

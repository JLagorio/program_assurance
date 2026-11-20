# Lane D: documents, requirements and evidence

Read `SP/vanta/v3r/CONTEXT.md`, then `SP/vanta/v3r/MODEL.md`, and follow both. Your files: `SP/vanta/proto/mod-zzzz-v3-8d-docs.js` and `.css` (CSS prefix `k3d-`), and `SP/vanta/v3r/D/`. Build name `v3r-D`. The first wave has landed: lanes S (`component--<code>`, `system…`), C (`controls`, the control's panel `k3c-control`) and O (`overview`) are in your build (build with every `mod-zzzz-v3-8*` module except lane E's, yours last); read their `notes.json` in `SP/vanta/v3r/<S|C|O>/` and look at their pages before you draw: yours must read as the same product.

## What Josef said
> I cant edit the SSP or the workbook is gone. … these issues are everywhere.

A reviewer then walked the last version (`SP/vanta/v3r/walk/walk.json`, jobs 5 and 7): the SSP editor was six clicks from the menu (group, Plans, row, preview, ↗, section); links into the SSP landed at its top; "Create requirement" only toasted; a requirement could not be allocated to a component; Link evidence offered six of 368 artifacts and no way to add one.

## Build
**1. `documents`: every document of the program, and one click to its editor.**
- Rail: All · Plans (SSP, contingency, incident response, configuration management) · Policies · Categorization (the ITCSC) · Agreements (if S links any). Chips by state (Draft, In review, Changes requested, Approved).
- Table: Document (name over what it is), Revision, State, Owner, Editing now, Last edited. **A row opens the document's editor at once** (`ssp`, `plan-cp`, `plan-irp`, `plan-cmp`, `itcsc`, a policy's page): never a preview first. Its More holds Version history, Submit for review, Export.
- One needs-attention card, each row a filter or a place in a document: "74 placeholder narratives" opens the SSP at the first of them; "Changes requested" the documents that have them.
- Primary New document (the earlier lane X's New plan creates one; keep it).
- The SSP's revisions per increment (the earlier lane G's "WS-X90's two drafts" block) are the SSP's own: its row says which revision is the draft, and its More or the editor's revision menu reaches the other. No block above the table.
- **In the editor:** a breadcrumb back to Documents; every link that says "SSP section N" or "Open it in the SSP" lands on that section or that control (the earlier lane X did part of this: finish it for controls, components, connections and ports); and a section generated from records (5 boundary, 6 architecture, 7 interconnections, 8 inventory, 9 ports, 10 baseline, 11 a control's implementation) offers **Edit source**, which opens that record where it is edited (the component's page, the connection's panel, the control's panel) with the return bar back to the section. The same text is one text: a narrative written in a control's panel (lane C's `fact("impl", …)`) is what section 11 prints, and the reverse.
- Policies: rows of the same table; a policy opens its page.

**2. `requirements`.**
- Rail by where a requirement comes from: All · each customer requirements document · Engineering requirements. Chips: No control mapped · Cites no evidence · Not allocated · Mapping to review. Compliance (a customer document's answers) and the chain are this register on a rail choice and its columns, not other pages.
- Table: Requirement (code, title over one line of its statement), Controls, Components, Evidence, State, Owner.
- **The requirement's panel** (it already holds the chain): make each stage workable there with `K.related`: Controls (Map control: the picker over the baseline; unmap), Components (Allocate: the picker over lane S's components; remove), Evidence (Link evidence: the picker over **all** the program's artifacts with search, its first line Add evidence, which creates an artifact and links it). Its statement is edited in place.
- Primary Create requirement: a form that **creates one** (statement, type, the components it is allocated to, the control it maps), listed at once here, on its components and on its control.
- A component is named the same way everywhere (its name, then its code), and links to its page.

**3. `evidence`.**
- Rail by kind: All · Documents · Test records · Datasets · Scan results · STIG checklists. Chips by review state (Waiting on review, Accepted, To revise, Expiring). Tabs: Evidence · Sources (the integrations that collect it).
- Table: Evidence (name over what it shows), Kind, Review, Cited by (requirements), Collected, Renew by, Owner.
- The artifact's panel: its versions, the review (Accept, Request changes) done there, Cited by with Link to a requirement, and its file.
- A STIG checklist is evidence of a kind: its row opens the checklist's own page.
- Primary Add evidence.

**4. Fold.** `ssps…`, `policies…`, `itcsc` (it stays the ITCSC's own page, reached from Documents and from the Overview's categorization), `stigs` (the register; a checklist's page stays), `sources`, `traceability`, `requirements-chain`, `requirements-compliance`, `requirements-objectives` open their new home.

## It works when (your walk asserts each)
1. Program menu → Documents → the SSP's row → typing in a narrative: two clicks to the editor. Back returns to Documents.
2. "74 placeholder narratives" lands on a placeholder in the SSP. A control's "printed in SSP section 11" link (from lane C's panel) lands on that control in the editor.
3. In the SSP's section 8, Edit source opens Mission Computer's page with the return bar; adding firmware there and going back shows it in section 8.
4. Write AC-2's implementation in its panel: section 11 prints it. Edit it in the SSP: the panel reads the same.
5. New document creates one and opens it.
6. Requirements → Create requirement (allocated to Mission Computer, mapping AC-2): it is in the register, on Mission Computer's Requirements tab and in AC-2's panel.
7. A requirement's panel: Allocate to another component; Map another control; Link evidence found by search among all artifacts; Add evidence creates one and links it. Each count follows and each can be undone.
8. The rail's customer document shows its requirements with the program's answers; a chip narrows; the counts equal the rows.
9. Evidence: a rail kind filters; an artifact's panel accepts its review, and the Waiting on review chip counts one less; the requirement that cites it follows.
10. Every folded address lands; a created program shows its own or an empty register with its Add, never WS-X90's.

## Not yours
The control's panel (C), the component's page (S), the Overview (O), assessments and findings (lane E, beside you).

# What's next

A living list for the design system and the prototype. Josef owns the decisions; whoever is working owns the work. Tick a box when it lands and move it to Done with the date. Keep it short: one line per item, the reasoning lives in the spec or the audit it points at.

Updated 2026-09-02.

## Decisions waiting on Josef

- [ ] **Token sheet sign-offs.** Palette ramps, semantic colour in both modes, the type, space, shape, dimension and motion specimens. Spec steps 1–3 in `docs/superpowers/specs/2026-09-02-token-architecture.md`. The grey borders that AA contrast costs are part of this.
- [ ] **Cutover compromises** (spec step 8): margins became padding on unpainted elements, so hit areas grew by the old margin; `border-l-2` quote rules are one pixel; `opacity-60/70` dims are `opacity-disabled`; the 30–34px stat is `font-heading-large` at 28px; the control-workspace rings take their track colour inline.
- [ ] **Where the data drives the UI** (`docs/superpowers/specs/2026-09-02-ui-patterns-audit.md`): the tree's ten columns (proposal: fold C/I/A into the Control set cell and Kind into the name hint, leaving seven); the categorized element's fourteen header facts against the rule of six (proposal: drop Scopes, Requirements and Controls reached); coverage's Method and Owner columns (proposal: drop them, they are on the requirement record).
- [ ] **Chart's first screen.** Candidates: the program dashboard's coverage by family, the home page's framework coverage. Risk scoring stays without a sparkline or gauge on purpose.
- [ ] **A non-modal Sheet**, only if the peek panel should stay open while the table behind it is clicked (audit item 7).

## Kit

- [ ] **Step 9 · Publishable build** with type declarations, when the second project appears.

## Prototype

- [ ] **Requirements tracking** (`docs/superpowers/specs/2026-09-02-requirements-tracking.md`, in progress, the second session): the coverage bar and the requirement → test link, suspect currency on links, Glance and the peek stack, picker adoption. Step 1 is done.
- [ ] **Picker adoption.** "Allocate a requirement" (system-tree.tsx) and the tailoring pane's two Comboboxes move onto `PickerSheet`; `ApplicabilityModal` becomes the row action in its second frame. Spec: `docs/superpowers/specs/2026-09-02-picker-sheet.md`, with three calls for Josef to overturn.
- [ ] **The peek stack in the URL.** `NodePreviewSheet` drills into a child with no way back; `PreviewSheet` has `onBack` now. Keep the stack in a `?peek=` search param so the chevron and the browser's back are the same thing.
- [ ] **One preview body per record type**, at two densities (glance for HoverCard, peek for PreviewSheet). `ProgramPeek`, `RiskPeek` and `NodePreviewSheet` are three unrelated bodies today.
- [ ] **Forms, the rest.** Seventeen forms now name their required fields (see Done). Left alone on purpose: the edit dialogs of existing records (POA&M edit keeps only its title, gate, finding, remediation, evidence), `ApplicabilityModal` (its two guards are conditional and the picker's second frame replaces it), the treatment and scope-approval forms (uncontrolled inputs the hook cannot read), and the wizard (it blocks progress with its own message; its name fields carry the asterisk only). Whether the required sets are the right ones is Josef's read: the list is in `useRequired({ … })` at the top of each form.
- [ ] **Hydration mismatch** on `/programs/$programId/baseline` (server text differs from client). Seen 2026-09-02; not the kit's; unowned.
- [ ] **Link-looking buttons** that are not blue (`<button className="hover:underline">`, rmf-timeline and a few others). Neither `Button variant="link"` nor TextLink; decide whether they are links, actions, or plain text.

## Done

- 2026-09-02 · **Verification is a link to a test.** `Progress.Stacked` takes a `hatched` segment for what is not known or not covered; requirements link to test objectives (`src/lib/requirement-verification.ts`), the coverage view carries one bar per row and a Not covered question in place of the Verified filter (Method and Owner dropped), the record lists its objectives with a link action, and the export page has an RTM tab with a column per test event and a CSV.
- 2026-09-02 · **Gates** in the kit (Components/Status): a met or unmet condition with its reason and action, a list never a score. Quality gates block Approve on the requirement record; a Needs block lists what a requirement still lacks; the queue lists requirements that need something.
- 2026-09-02 · **Forms validate on submit.** `useRequired` in `src/lib/form.ts`: the Fields it names carry the asterisk, the primary button is always enabled, and pressing it marks the first empty field red with "Required." under it. Applied to POA&M create and edit, new requirement, allocate (both dialogs), observation, enclave access, AO decision, authorization memo, mapping rule, add node, create risk, ingest assessment data, record assessment, propose change. The old footer messages and disabled buttons for those fields are gone.
- 2026-09-02 · **`docs/guides/component-library.md`** rewritten onto the package: layers, importing, naming, the lint table, the rules that stay in the head, how to add a part, what is underneath, where the specs are.
- 2026-09-02 · **Step 7, the mode switch**: provider, three-state control, storage, before-paint script; the light pin is off the prototype root and the switch sits in the top bar.
- 2026-09-02 · **Audit items 9–11 in the kit**: `PickerSheet` with its spec, `PreviewSheet` with `onBack`, `status` and `facts` on the compact header, the hover ladder written down.
- 2026-09-02 · **The spine audit's kit items**, all five: TextLink (147 links, 2 wrapped buttons and 9 text buttons swept onto it), PreviewSheet (node-preview on it), Table.Tree (system-tree on it, `tree-cell.tsx` gone), ToggleGroup `count` (coverage on it), Fact.Group and RecordHeader `facts` (the four strips on them). Every `<colgroup>` in the prototype (119) became `Table.Header width`; two lint rules keep both from coming back. Items 7 and 8 stay as the audit decided.
- 2026-09-02 · **Invalid state on the controls** (`aria-invalid` turns the border red) after Josef's note on forms.
- 2026-09-02 · **Matrices render once**; the Storybook toolbar switches the mode. The side-by-side decorator is gone.
- 2026-09-02 · **Coverage batch**: a matrix story per family, the ratchet in the build, the Vocabulary and control-board sheets back, the Chart family.
- 2026-09-02 · **Prototype cutover**, steps one and two: the prototype runs on `@ledger/design-system` alone.

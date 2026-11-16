# StatusFamilies

Three status families that never share a word or a shape: a claim, a reviewer's word on evidence, and an assessor's determination. Proposed in the November 2026 UX proposal; not in the package (shipped Ledger draws all three as a `Badge`).

**When to use.** Wherever a control, an evidence artifact or an objective says where it stands. A word belongs to one family and one class.

**What you write.**
- Implementation, a claim the engineer makes: `<span class="nx-claim is-implemented">Implemented</span>`, with `is-partial`, `is-planned`, `is-none`, `is-inherited`, `is-na`. An ink level bar and the word, never a hue.
- Verification, a reviewer's word on evidence: `<span class="nx-verif is-verified">Verified</span>`, with `is-review`, `is-revision`, `is-expiring`, `is-expired`. A pill; green (`--ds-color-background-success`) only when verified.
- Determination, an assessor's judgment: `<span class="nx-det is-sat">Satisfied</span>`, with `is-part`, `is-not`, `is-none`. A solid square mark in `--ds-color-chart-success`, `-warning` or `-danger` and the word. Before anyone judged it, `is-noev` (No evidence) and `is-noreq` (No requirement) stand in its place.
- Claim beside determination in one cell: `nx-pair`; `is-short` draws ≠ between a claim of Implemented and a judgment short of it.
- Where a finding or an artifact came from: `<span class="nx-src">ACAS</span>`, small and neutral.
- A code before a name in a row: `<span class="nx-code">AU-4</span>`.

**Do**
- Say "Not satisfied" (the proposal's word for the product's Other than satisfied).
- Keep severity out of these: it is the severity slots, the signal form, or the word.

**Don't**
- No hue on a claim, no pill for a determination, no green outside Verified and Satisfied.
- Don't put two families' words in one column without `nx-pair`.

# Timeline

A dated list of what happened, newest first: who did what, to which record, and when. Ledger part: `<Timeline>` (static rendition; the React part is not bundled).

**When to use.** A record's comments and activity in a Section of its body, a program's activity, the Portfolio's Recent activity. A filterable audit log is a register, not this.

**What you write.** `<div class="k-timeline">` > `k-tl-item` rows 12px apart, each a three-column grid: a `k-dot` (toned when the entry is itself a judgment), the entry (one line that says who did what, with the record as a `k-link`, and an optional second line in `c-subtle`), then the time in `t-small c-subtle`.

**Do**
- Start with the person's name at weight 500, then the verb in the past tense: published, recorded, edited, opened.
- Link the record the entry names when it has a page.
- Fold consecutive edits of one record by one person into one entry that says what changed and in how many edits.
- Show relative words for the time and keep the full moment for hover.

**Don't**
- Never list every event: a feed is a handful of entries.
- No avatars a row, no icons a kind of event, no cards around entries.

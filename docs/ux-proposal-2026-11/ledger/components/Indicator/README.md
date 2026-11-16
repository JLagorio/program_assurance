# Indicator

A dot with a word: severity or health beside a label, never a pill. Ledger parts: `<Indicator>` and its `<Dot>` (static rendition; the React parts are not bundled).

**When to use.** A rank beside a status, so the status column stays the only pill in the row: Critical, High, Moderate, Low. A record's state (Verified, Overdue) is a Badge or a DateLabel instead.

**What you write.** `<span class="row g-075"><span class="k-dot t-danger"></span>High</span>`. The dot is 8px in the tone's icon colour: `t-danger`, `t-warning`, `t-info`, `t-success`, `t-brand`, or no tone for neutral (`--ds-color-icon-subtlest`). The word is body text in `--ds-color-text`, 6px after the dot; a neutral rank mutes the word too (`c-subtle`).

**Do**
- The tone is a rank: danger High, warning Moderate, neutral Low. Every Low is neutral, so a scale reads from loud to quiet.
- Critical and High share danger: set Critical's word in `c-danger w-600` so the two never read alike.
- Always write the word beside the dot.

**Don't**
- Don't use a dot alone as a status, and don't draw a second pill for severity.
- Don't add an icon a tone or a larger dot.

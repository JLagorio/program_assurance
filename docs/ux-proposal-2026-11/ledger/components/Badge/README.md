# Badge

A status or a state as one or two words in a pill. Ledger part: `<Badge>`, which the product draws through its status components over one vocabulary map (static rendition; the React part is not bundled).

**When to use.** A record's status in a row, in Details and in a preview. One badge a row: severity beside it is an Indicator, never a second pill.

**What you write.** `<span class="k-badge">` is neutral (`--ds-color-background-neutral`, `--ds-color-text-subtle`). Tones: `t-info`, `t-success`, `t-warning`, `t-danger`, `t-teal`, `t-purple`, each its subtle ground with its own text colour. `is-bold` fills the tone's bold ground with `--ds-color-text-inverse` (`--ds-color-text-warning-inverse` on warning); `is-outline` is a 1px `--ds-color-border-bold` ring on no ground. Heights: `s-xs` 16, default 20, `s-md` 24.

**Do**
- Use the product's words and tones exactly. Control status: No requirement (neutral), No evidence (warning), Not assessed (information), Other than satisfied (danger), Partially satisfied (warning), Satisfied (success).
- Status says operational progress; State says draft or published. Keep them in separate columns.
- Keep a tone for one meaning: neutral is no judgment, information is under way, success is a good outcome.

**Don't**
- Don't invent a tone for a new word, and don't use a badge for a count (that is Count) or a date (DateLabel).
- Don't let colour carry the status alone: the word is always there.

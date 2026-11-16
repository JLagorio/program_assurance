# Alert

A message in the page that is not about one field: a failed read, a missing prerequisite, a notice, a confirmation. Ledger part: `<Alert>` (static rendition; the React part is not bundled).

**When to use.** At the top of the region it speaks for: one alert a page or tab for failed reads, with Retry; one at the top of a dialog body for a failed save. A problem with one field is that field's error, not an alert.

**What you write.** `<div class="k-alert t-danger">` > a 16px Lucide icon, the text (a title at weight 500 and one line under it, or one line alone), then an optional small secondary button. Tones: none (neutral, `--ds-color-background-neutral`), `t-info`, `t-warning`, `t-danger`, `t-success`; each sets its subtle ground and its icon colour, and the text stays `--ds-color-text`.

**Do**
- Say what happened and what the reader can do: "Could not load risks" with Retry.
- Keep the content that was already shown under a failed refresh.
- Give the alert a role in the real product: alert for a failure, status or note for a notice.

**Don't**
- No stack of alerts, one a failed read: a region reports its failures in one.
- No alert for success that a toast already reports, and no alert as decoration.
- Don't colour the text to match the tone.

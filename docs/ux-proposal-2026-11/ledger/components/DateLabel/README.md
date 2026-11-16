# DateLabel

A calendar day that says when it is trouble: overdue, due today or due soon while the work is open. Ledger part: `<DateLabel>` (static rendition; the React part is not bundled).

**When to use.** A due date, an expiry or a milestone's planned date in a row or in Details. A moment (a time of day) is written out as a date and time; this is a day.

**What you write.** `<span class="k-date">` holding a 12px Lucide icon (`s-12`), the day, and, when it is flagged, a middle dot and the word at weight 500. A plain day sits on no ground. `is-overdue` sets `--ds-color-background-danger` with `--ds-color-text-danger` (icon `circle-alert`); `is-soon` sets `--ds-color-background-warning` with `--ds-color-text-warning` (icon `clock`); an upcoming day takes `calendar-days`, done work `circle-check` in `c-subtle`.

**Do**
- Flag only open work: a day before today reads Overdue, today Due today, the next two days Due tomorrow or Due in 2 days.
- For an expiry say Expired, Expires today, Expires in 2 days.
- Let done or cancelled work's day read plainly.

**Don't**
- Don't write a raw ISO string or a time of day in a due column.
- Don't leave a missing day blank: it is the Absent mark, an em dash named No due date.

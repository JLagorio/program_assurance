# Status vocabulary

The product's statuses, states, decisions and levels: the words each stored value reads as, its tone and its place in the order. What each tone means is the kit's, on the Storybook's Components/Badge page (neutral: no judgment; information: in progress; success: done and good; warning: needs attention; danger: wrong or late). This guide says where the product keeps its values and how a screen draws them.

## Where the values live

- [`src/lib/status.ts`](../../src/lib/status.ts) holds one map per concept (`taskStatuses`, `determinations`, `remediationStatuses`, `revisionStates`, `severityLevels` and the rest): each stored value's label, tone and rank. `fieldVocabularies` names the map for every stored table and column a screen shows, and `vocabularyFor(table, field)` reads it. `statusLabel`, `statusTone` and `compareStatus` read a value through its map. It is domain code and imports no kit part.
- [`src/components/app/status.tsx`](../../src/components/app/status.tsx) draws them: `StatusBadge` for a status, state or decision (a Badge in the map's tone), `LevelIndicator` for a severity, impact, likelihood or priority (a Dot and a word), `VocabularyValue` for either by the map's kind, and `FieldStatus` for a stored field by table and column.
- In a DataTable, `c.status(key, { statuses })` takes the same map: it draws the same badge, sorts by rank and filters by label.

## Rules

- A screen names the concept's map, or asks `vocabularyFor(table, field)`. It keeps no tone map of its own and never picks a tone for a stored value. A new stored status field gets its map in `status.ts` and its row in `fieldVocabularies`.
- The concept decides the tone, not the word. Accepted is success on a review, an evidence review and a library assignment, and neutral on a risk, where it records a decision to live with the risk; Closed is success on an operational issue and a risk, and neutral on a program; Active is success on a program, a product or configuration, a CCI and a control publication, where it means in force and in good standing, and information on a campaign and a workstream, where it means work in progress.
- A value the map does not know reads in words, neutral. That is a gap in the map, not a choice: add the value.
- A level (severity, impact, likelihood, priority, an import issue's severity) is an Indicator, never a pill, so the status column stays the only pill in a row. Every Low and Very low on an Indicator is neutral: a low level asks nothing of the reader.
- Control assessment results use the RMF phrasing: Satisfied, Partially satisfied, Other than satisfied, Not assessed (`determinations`), never pass and fail.
- A missing value is the kit's Absent, which StatusBadge and LevelIndicator draw for an empty value: "Not recorded" to a screen reader unless a label says more.
- A count is neutral (a Count) unless the count itself is the alarm.
- `appearance="bold"` on a Badge is the solid fill: one per view, for the status that must win.

## The product's values by tone

| Tone          | Values in the map                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `success`     | Satisfied · Met · Implemented · Authorized · Published · Approved · Done · Completed · Passed · Resolved (an issue, a reference) · Closed (an issue, a risk) · Accepted (a review, an evidence review, an evidence use, a library assignment or target) · Operational · Active (a program, a product or configuration, a CCI, a control)                                                             |
| `information` | In progress · In review · Active (a campaign, a workstream) · Triaged · Investigating · Responding · In development · Under development · Validating · Importing · Proposed · Alternative; an import Information                                                                                                                                                                                     |
| `warning`     | Partially satisfied · Partial · Waiting · Suspended · At risk · Deferred · Needs revision · Authorized with conditions · Conditionally applicable · Deprecated · No SSP · Conflicting · Unsupported publication; the levels Moderate, a High task priority and an import Warning                                                                                                                     |
| `danger`      | Other than satisfied · Not met · Not implemented · Blocked · Failed · Aborted · Overdue · Rejected · Changes requested · Denied · Revoked · Expired · Unresolved; the levels High and Critical severity, High impact, High and Very high risk, an Urgent task priority and an import Error                                                                                                           |
| `neutral`     | Open · Planned · Not started · Ready · Queued · Not assessed · Not applicable · Applicable · Draft · Superseded · Cancelled · Closed (a program) · Waived · Accepted and Risk accepted (a risk, a remediation item) · Pending · Retired · Withdrawn · Disposition · Already applied · Excluded · Not in baseline · Other (a component's status); the levels Low, Very low and a Normal task priority |

The map is the source; when it changes, this table follows it.

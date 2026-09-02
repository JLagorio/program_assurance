# Status vocabulary

Status is always expressed through the five-value `tone` system (`Badge`, `Dot`, `Alert`, `Progress`) with domain vocabulary — soft fill, solid text, no ring, 4px radius. One `toneClasses` table in `src/ds/primitives/tone.ts` feeds all of them. Vocabulary the product actually uses:

| Tone      | Meaning                                  | Examples from the app                                                                        |
| --------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `success` | Meets the bar                            | Compliant · Passing · Satisfied                                                              |
| `warning` | Needs human attention, not yet a failure | Needs review · Partially satisfied · In remediation · evidence age ("34d") · versions behind |
| `danger`  | Failing the bar                          | Failing · Non-compliant · Other than satisfied · Overdue                                     |
| `info`    | Informational / automated                | Automated · In assessment · info counts                                                      |
| `neutral` | No judgment                              | Not assessed · Accepted · source/method labels                                               |

Rules:

- Control assessment states use the RMF phrasing: **Satisfied / Partially satisfied / Other than satisfied / Not assessed** — not pass/fail synonyms.
- A count of problems is a `danger` or `warning` badge only when the count itself is the alarm (overdue POA&M items); otherwise counts are neutral chips (as in `Tabs` counts).
- `neutral` is the default tone — reach for color only when state genuinely differs from "recorded".
- Risk severity ladders (Critical / High / Moderate / Low) render through `Severity` — a Dot plus text, never a pill — so the status column is the only pill in a row. `danger` for Critical, `warning` for High, neutral below.

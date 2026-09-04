# Status vocabulary

Status is said through one `tone`. The type and the class table live in `packages/design-system/src/components/badge.tsx`:

```ts
export type Tone = "neutral" | "information" | "success" | "warning" | "danger";
```

The names are the token names, so a tone reads straight through to `color.background.<tone>`, `color.text.<tone>` and `color.icon.<tone>`. It is `information`, never `info`. One `toneClasses` table in that file feeds every part that paints a status: the subtle fill with the tone's text, the bold fill with inverse text, the icon colour for a Dot, the fill for a bar. The tokens are on the Storybook sheet Tokens/Color; the parts are under Components/Badge and Components/Status.

## Who takes a tone

| Prop | Parts |
| --- | --- |
| `tone: Tone` | `Badge`, `Dot`, `Indicator`, `Alert`, `Progress` and each `Progress.Stacked` segment, `Stat` and `Stat.Tile`, `Gates.Item`, `Timeline.Item`, `Eyebrow`, `Prose`, an `ActionBar` state, a `WorkPane` row, a `RecordPicker` badge |
| `tone: BannerTone` | `Banner`: `information`, `warning` or `danger`. A banner is never neutral and never a success. |
| `tone: ChartTone` | A `Chart` series: a `Tone`, `brand` for the one series the reader is asked to look at, or `categorical.1` to `categorical.8` when the categories carry no status (`packages/design-system/src/components/chart.tsx`). |

`AlertDialog`'s `tone` is `primary` or `danger`: the weight of the confirming action, not a status.

## Meanings

| Tone | Meaning | Examples from the app |
| --- | --- | --- |
| `success` | Meets the bar | Compliant · Passing · Satisfied · Approved · a revision in force |
| `warning` | Needs human attention, not yet a failure | Needs review · Partially satisfied · In remediation · Pending approval · evidence age ("34d") · suspect links · versions behind |
| `danger` | Failing the bar | Failing · Non-compliant · Other than satisfied · Overdue · Changes requested |
| `information` | Informational, automated, in progress | Automated · In assessment |
| `neutral` | No judgment | Not assessed · Accepted · Draft · Superseded · source and method labels |

## Rules

- Control assessment states use the RMF phrasing: **Satisfied / Partially satisfied / Other than satisfied / Not assessed**, not pass/fail synonyms.
- A count of problems is a `danger` or `warning` badge only when the count itself is the alarm (overdue POA&M items). Otherwise counts are neutral, as in `Tabs` counts and `Count`.
- `neutral` is the default tone. Reach for colour only when the state genuinely differs from "recorded".
- `appearance="bold"` on a Badge is the solid fill. One per view, for the status that must win.
- Severity ladders render through `Indicator`: a Dot plus text, never a pill, so the status column stays the only pill in a row. The old `Severity` component is `Indicator`; `Severity` in the prototype is now only the STIG category type in `src/lib/verification.ts`.
- Severity maps to tone in the prototype's data layer, not in a component: `poamSeverityTone` (`src/lib/grc-data.ts`) and `alertSeverityTone` (`src/lib/conmon.ts`) give Critical and High `danger`, Moderate `warning`, Low `neutral`. STIG categories give CAT I `danger`, CAT II `warning`, CAT III `neutral`. Revision states are `revisionTone` in `src/lib/control-set.ts`.

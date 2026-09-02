# Spacing & layout

## Density

Compact, data-dense, never cramped:

- Controls (Button md, Input, Select): **32px** tall (`h-8`); small buttons and chips **28px** (`h-7`).
- Table rows: **40px** (`h-10`), the midpoint between the old 36 and Linear's 44; header rows **32px** (`h-8`); cell padding `px-3`.
- Card padding: `px-4 py-3` headers, `px-5 py-3.5`–`py-4` in modals.
- Property rows (`KeyValue`): 104px label column, `py-[5px]` rows.

## Radius

Base `--radius: 0.375rem` (6px), derived scale: `rounded-md` (6px) on controls and chips, `rounded-lg` (8px) on cards, `rounded-xl` (10px) on modals, `rounded-[5px]` on badges, `rounded-full` on dots and meters.

## Page structure

`Shell` provides the frame: fixed sidebar (objects and queues), top bar with search, and a centered content column of **max-width 1240px** with `px-4 py-6` (`lg:px-8 lg:py-8`). Inside a page: `PageHeader` first, then `Section` blocks (rule + label, borderless) or `Card`s. Gaps between siblings run `gap-2` (8px) for control clusters, `gap-3`/`gap-4` for form grids, `gap-6` between header and actions.

## Separation

Prefer hairline rules (`border-b border-border`) over boxes; `Section` separates page regions the way Stripe does — a rule and a 13px semibold label, no enclosure.

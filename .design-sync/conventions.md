# Program Assurance UI — build conventions

A compact, Stripe-calm kit for a cybersecurity program-assurance platform (ATO packages, NIST controls, findings, POA&M). White surfaces, hairline borders, one blue accent, 13px body type.

## Setup & wrapping

- Components need **no theme provider** — tokens are global CSS from `styles.css`.
- **Router context**: `Shell` and `Tabs` items that carry `to` render router `<Link>`s and throw without a router. Wrap any composition using them in the exported `PreviewRouter`:
  ```jsx
  const { PreviewRouter, Shell } = window.ProgramAssuranceUI;
  <PreviewRouter><Shell>…screen content…</Shell></PreviewRouter>
  ```
  `Tabs` without `to` (button mode) needs nothing.
- **Tooltips** need `TooltipProvider` around the subtree: `<TooltipProvider><Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip></TooltipProvider>`. `DropdownMenu` and `Popover` compose Trigger + Content the same way, no provider needed.
- Full screens go inside `Shell` (sidebar + top bar + 1240px content column). Sections of a page use `Section`; boxed content uses `Card` (+ `CardHeader`).
- Two tiers: the bespoke kit (Button, Badge, Table, Modal…) is the product's own look — prefer it; `Checkbox`, `Switch`, `RadioGroup`, `Tooltip`, `DropdownMenu`, `Popover`, `Skeleton`, `Avatar`, `Separator` are themed primitives for what it lacks. For `Avatar`, use `AvatarFallback` initials, not remote images.

## Styling idiom — Tailwind utilities, compiled ahead of time

Style layout glue with Tailwind classes, **but only classes already present in `styles.css` work** — the CSS is compiled, not runtime. Anything absent renders unstyled. Prefer component props first; for glue, stay on this vocabulary (all shipped):

| Family | Tokens |
|---|---|
| Surfaces | `bg-background` `bg-card` `bg-subtle` `bg-muted` `bg-primary` `bg-primary-soft` |
| Status soft fills | `bg-success-soft` `bg-warning-soft` `bg-danger-soft` `bg-info-soft` (solid: `bg-success` `bg-warning` `bg-danger`) |
| Text | `text-foreground` `text-muted-foreground` `text-primary` `text-success` `text-warning` `text-danger` |
| Borders | `border-border` (default) `border-border-strong` — hairlines everywhere, never heavy |
| Elevation | `shadow-hairline` `shadow-raised` `shadow-pop` `shadow-button` `shadow-button-primary` |
| Type | `font-sans` (Inter, default) · `font-mono` (JetBrains Mono) · `tnum` for numeric columns · sizes as arbitrary values: `text-[13px]` body, `text-[12px]` labels, `text-[22px]` page titles |
| Shape | `rounded-md` controls · `rounded-lg` cards · `rounded-xl` modals |
| Layout | `flex` `grid` `gap-2`/`gap-3`/`gap-4` `space-y-*` `p-*` `px-*` `py-*` `max-w-*` |

Status color is semantic, via the `tone` prop (`neutral | success | warning | danger | info`) on `Badge`, `Dot`, `Meter` — don't hand-paint status colors.

## Where the truth lives

Read `styles.css` (root tokens + every shipped utility) before inventing styling; each component's API is `components/<group>/<Name>/<Name>.d.ts` and usage patterns are in `<Name>.prompt.md`.

## Idiomatic example

```jsx
const { Card, CardHeader, Table, Tr, Th, Td, Badge, Mono, Button } = window.ProgramAssuranceUI;

<Card>
  <CardHeader title="Control status" description="SP 800-53 rev 5 baseline"
    action={<Button variant="secondary" size="sm">Export</Button>} />
  <Table>
    <thead><tr><Th>Control</Th><Th>Title</Th><Th>Status</Th></tr></thead>
    <tbody>
      <Tr><Td><Mono>AC-2</Mono></Td><Td>Account Management</Td>
        <Td><Badge tone="success">Satisfied</Badge></Td></Tr>
    </tbody>
  </Table>
</Card>
```

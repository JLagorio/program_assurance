# Badge migration

`Badge` uses the checked-in shadcn Base UI reference in
[`src/components/ui/badge.tsx`](../../src/components/ui/badge.tsx) as its foundation, adapted
through Ledger tokens and semantic axes. One component and one `badgeVariants` recipe handle
standard treatments, semantic colors, emphasis, density, icons, and rendered links.

## Unified API

| Axis         | Responsibility and defaults                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`    | `default`, `secondary`, `destructive`, `outline`, `ghost`, or `link`. Chooses the visual treatment and its palette/emphasis defaults. |
| `tone`       | `brand`, `neutral`, `information`, `success`, `warning`, or `danger`. Overrides the palette without changing the shape or treatment.  |
| `appearance` | `subtle` or `bold`. Overrides the emphasis of filled variants; outline, ghost, and link retain their treatment.                       |
| `size`       | `small` (20px, the default) or `xsmall` (16px). Changes density.                                                                      |
| `icon`       | An optional leading icon. Explicit icon children also support either position.                                                        |
| `render`     | Base UI composition for a real anchor or a component forwarding props and its ref.                                                    |

Variant defaults are brand/bold for `default`, neutral/subtle for `secondary`, danger/subtle
for `destructive`, neutral for `outline` and `ghost`, and brand for `link`. Native span props,
styles, attributes, handlers, and refs remain available. Public exports are `Badge`,
`badgeVariants`, and `BadgeProps`.

```tsx
import { Badge, badgeVariants } from "@ledger/design-system";
import { CircleCheck, ArrowUpRight } from "lucide-react";

<Badge>Featured</Badge>;
<Badge variant="secondary" tone="neutral">
  Draft
</Badge>;
<Badge variant="secondary" tone="success" size="xsmall">
  Verified
</Badge>;
<Badge variant="secondary" tone="danger" appearance="bold">
  Overdue
</Badge>;
<Badge variant="secondary" tone="success" icon={<CircleCheck aria-hidden="true" />}>
  Verified
</Badge>;
<Badge variant="outline" tone="success" render={<a href="/evidence" />}>
  Verified evidence
  <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
</Badge>;
<span className={badgeVariants({ variant: "secondary", tone: "success", size: "xsmall" })}>
  Verified
</span>;
```

Badge emits `data-slot="badge"` and its resolved `data-variant`, `data-tone`, `data-appearance`,
and `data-size`. `badgeVariants` supplies the same recipe as classes; its caller owns the
element, attributes, refs, and interaction semantics.

## Updating existing consumers

Keep the existing Badge name and import. Add `variant="secondary"` to established semantic
status and category usages to preserve subtle emphasis. Retain `tone`, `appearance`, `size`,
`icon`, conditional children, styles, and native attributes. Use `tone="neutral"` for an
untinted category or status. A previously omitted variant now selects the standard brand/bold
default, so updating those defaults is deliberate.

| Previous usage                           | Updated usage                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `<Badge tone="success">Verified</Badge>` | `<Badge variant="secondary" tone="success">Verified</Badge>`                                   |
| `<Badge>Draft</Badge>`                   | `<Badge variant="secondary" tone="neutral">Draft</Badge>`                                      |
| `appearance="bold"` or `size="xsmall"`   | Keep the prop on the same Badge.                                                               |
| `icon={<Icon />}`                        | Keep the shorthand, or use an explicit icon child with its position attribute.                 |
| Navigation on a span's `onClick`         | Render an anchor or router element through `render`.                                           |
| `BadgeProps`                             | Keep the same type export; it now also includes the shared recipe axes and render composition. |

The five status palettes retain their meanings, including warning's dark text on its bold
fill. The old compact status shape adopts the shared pill radius, border, and padding. Tone
changes color; it never selects a separate anatomy. Small badges remain 20px, compact badges
remain 16px, and all direct icons use the shared 12px size.

Components, patterns, shell, application routes, and stories all compose this same Badge.
There is no pattern dependency for status styling. `Count`, `Dot`, `Indicator`, `Tone`, `tones`,
and `toneClasses` keep their existing contracts. `Avatar.Badge` and `Avatar.Count` are Avatar
parts and retain their current APIs. The checked-in reference catalog and unrelated reui
Badge remain separate code.

## Visual token mapping

| Intent                      | Ledger mapping                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| One pill anatomy            | `rounded-full`, default border width, inline flex layout, medium weight                                               |
| Small density               | `h-250` (20px), `px-100` (8px), `py-025` (2px), `gap-050` (4px), `font-body-small` (12px)                             |
| Xsmall density              | `h-200` (16px), `px-050` (4px), `py-0`, `font-body-xsmall` (11px)                                                     |
| Icons                       | `size-150` (12px), no direct SVG pointer events; position markers select 6px end padding at small and 4px at xsmall   |
| Subtle filled treatment     | The selected tone's subtle background, readable tone text, and hovered background                                     |
| Bold filled treatment       | The selected tone's bold background and inverse text; warning uses `color.text.warning.inverse`                       |
| Outline treatment           | The selected palette's border and text, with subtle hover fill on an anchor                                           |
| Ghost treatment             | The selected palette's text and subtle hover fill                                                                     |
| Link treatment              | The selected palette's text with underline on hover                                                                   |
| Focus                       | `color.border.focused`, the 2px `border.width.focused`, and 2px `space.025` offset                                    |
| Destructive focus / invalid | The same outline geometry with `color.border.danger` through `outline-danger`; invalid also selects the danger border |
| Motion                      | `duration-fast`, `ease-standard`                                                                                      |

Semantic colors adapt to both modes. Ledger's named 2px outlines replace the reference's
translucent rings. The generated `outline-danger` utility uses existing color, border width,
and spacing tokens; its state priority preserves danger focus styling when selectors overlap.
Token generation remains source-driven, with no hand edits to generated output.

## Native and rendered behavior

A plain Badge is a span without a default tab stop. A link requires an actual anchor through
`render`; `variant="link"` alone supplies presentation. Anchor props such as `href` belong on
the rendered element. Router destinations, params, and search stay on the router component,
which forwards received props and its ref to the actual anchor.

Base UI composes attributes, styles, classes, handlers, and both refs on that same element.
The anchor retains Tab and Enter behavior. Badge itself manages no selection, dismissal,
validation, or disabled state. Hide decorative icons from assistive technology and keep
visible text meaningful when an optional icon is absent.

## Review and verification

Review the full family at
[Components / Badge](http://localhost:6007/?path=/docs/components-badge--docs): six treatments,
the tone/emphasis/density matrix, semantic tones across every treatment, dense status rows,
rendered links, native refs, icon shorthand and explicit children, and long labels.

Executable stories cover both mode projects, including shared recipe use, 12px icons, icon
end padding, 20px/16px heights, one radius across semantic treatments, danger focus outlines,
and merged anchor props/refs/handlers with keyboard activation. The packed-consumer fixture
checks public imports, types, SSR composition, and installation outside workspace hoisting.
See the [migration handoff](design-system-migration-handoff.md) for the validation actually
run and the next proposed family.

# Elevation & motion

## Elevation

Hairline + soft lift, never heavy. Five shadow tokens, exposed as utilities:

| Utility | Recipe | Use |
|---|---|---|
| `shadow-hairline` | 1px ring at 6% foreground | Flat separation without a border |
| `shadow-button` | 1px ring + 1px drop | Secondary buttons, icon buttons |
| `shadow-button-primary` | ring at 70% primary + inner top highlight | Primary/danger buttons — the "lit" button look |
| `shadow-raised` | ring + 1px + 6px soft | Raised cards, popovers |
| `shadow-pop` | ring + 14px + 32px soft | Modals, dropdown menus |

Scrims: modal backdrop is `bg-foreground/25` with `backdrop-blur-[1px]`.

## Motion

Fast and quiet:

- Buttons: `transition-[box-shadow,background-color,color,transform] duration-100`, `active:translate-y-px` press, `hover:brightness-[1.07]` on filled variants.
- Rows, chips, tabs: `transition-colors` only.
- Entry animation: `animate-slide-up` — 6px rise + fade over 0.42s on `cubic-bezier(0.16, 1, 0.3, 1)`; use sparingly, for page-level content appearing.
- Collapse (RailGroup): chevron rotates `-rotate-90`; content mounts/unmounts without animation.

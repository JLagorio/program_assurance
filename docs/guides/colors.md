# Colors

Stripe-calm: white canvas, one blue, soft semantic fills. All values are oklch, defined as CSS custom properties on `:root` in `styles.css`.

## Surfaces

| Token                                   | Value                          | Use                                     |
| --------------------------------------- | ------------------------------ | --------------------------------------- |
| `--background` / `--card` / `--popover` | `oklch(1 0 0)`                 | Page, cards, popovers — all pure white  |
| `--subtle`                              | `oklch(0.982 0.003 252)`       | Hover fills, modal footers/asides       |
| `--secondary` / `--muted` / `--accent`  | `oklch(0.968–0.972 0.004 250)` | Chips, count pills, secondary fills     |
| `--foreground`                          | `oklch(0.21 0.03 264)`         | Primary text, near-black with blue cast |
| `--muted-foreground`                    | `oklch(0.548 0.021 258)`       | Secondary text, labels, table headers   |

## The blue system

One accent: `--primary: oklch(0.55 0.19 258)`. It is the primary button, the focus ring (`--ring`), active tab underlines, links, and active filter chips. `--primary-soft: oklch(0.957 0.021 258)` is its fill for active/selected states. Never introduce a second accent hue. Avatars, sidebar counts and table IDs are neutral so blue is spent only on action, selection, focus and links; a table ID turns blue on row hover.

## Semantic status

Each status color has a solid and a `-soft` fill; text sits at the solid value on the soft fill:

| Pair                         | Solid                  | Soft                     |
| ---------------------------- | ---------------------- | ------------------------ |
| `--success`                  | `oklch(0.52 0.13 158)` | `oklch(0.955 0.035 158)` |
| `--warning`                  | `oklch(0.55 0.12 72)`  | `oklch(0.958 0.045 85)`  |
| `--danger` / `--destructive` | `oklch(0.55 0.2 22)`   | `oklch(0.955 0.03 22)`   |
| `--info`                     | = primary              | = primary-soft           |

Reach these through the `tone` prop on `Badge`, `Dot`, and `Meter` — not by hand-painting classes.

## Borders

`--border: oklch(0.922 0.006 252)` everywhere by default; `--border-strong: oklch(0.878 0.008 252)` for neutral badge rings and dashed filter chips; `--input: oklch(0.912 0.007 252)` on form controls. Borders are always 1px hairlines.

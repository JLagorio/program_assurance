# Typography

One family: **Inter** (`--font-sans`, with `cv11`/`ss01` feature settings) for everything, identifiers included. `--font-mono` (JetBrains Mono) survives only for `<pre>` code and data previews; no UI text uses it.

## Scale

The body base is **14px / 1.45** with −0.006em tracking, ink is `oklch(0.27 0.026 264)` rather than near-black, and UI text runs smaller than typical web defaults. Weight 600 is reserved for page and record titles; every other heading is 500:

| Size                          | Weight                         | Use                                                          |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------ |
| `text-[22px]`                 | semibold, `tracking-[-0.02em]` | Page titles (`PageHeader`)                                   |
| `text-[15px]`                 | medium                         | Dialog titles                                                |
| `text-[14px]`                 | medium                         | Card titles (`CardHeader`), section and block titles at 13px |
| `text-[13px]`                 | regular / medium               | Body, buttons, table cells, tabs, descriptions               |
| `text-[12px]`–`text-[12.5px]` | medium                         | Table headers, field labels, badges, KeyValue rows           |
| `text-[11px]`–`text-[11.5px]` | medium                         | Count chips, inherit chips                                   |

Negative tracking tightens as size grows: `-0.005em` at 13px headings, `-0.01em` at 14–15px, `-0.02em` at 22px.

## Monospace

Control numbers, finding IDs, package IDs, hashes, and STIG rule IDs are wrapped in the `Mono` component for semantics, but since 2026-09-01 it only adds tabular numerals: an identifier takes the font, size and colour of the text around it. Table cells are one style — 13px regular foreground — and only a Badge, Dot or Severity is allowed to differ.

## Numerals

Tables set `font-variant-numeric: tabular-nums` globally; use the `tnum` utility for aligned numbers anywhere else (percentages, counts, dates in columns).

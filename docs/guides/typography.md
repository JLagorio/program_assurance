# Typography

Two families, loaded from Google Fonts: **Inter** (`--font-sans`, with `cv11`/`ss01` feature settings) for everything, **JetBrains Mono** (`--font-mono`) for identifiers.

## Scale

The body base is **14px / 1.45**, and UI text runs smaller than typical web defaults:

| Size | Weight | Use |
|---|---|---|
| `text-[22px]` | semibold, `tracking-[-0.02em]` | Page titles (`PageHeader`) |
| `text-[15px]` | semibold | Modal titles |
| `text-[14px]` | semibold | Card titles (`CardHeader`) |
| `text-[13px]` | regular / medium | Body, buttons, table cells, tabs, descriptions |
| `text-[12px]`–`text-[12.5px]` | medium | Table headers, field labels, badges, KeyValue rows |
| `text-[11px]`–`text-[11.5px]` | medium | Count chips, inherit chips |

Negative tracking tightens as size grows: `-0.005em` at 13px headings, `-0.01em` at 14–15px, `-0.02em` at 22px.

## Monospace

Control numbers, finding IDs, package IDs, hashes, and STIG rule IDs always render in JetBrains Mono via the `Mono` component (12px, tight tracking) — e.g. `AC-2`, `F-2031`, `PKG-2026-114`.

## Numerals

Tables set `font-variant-numeric: tabular-nums` globally; use the `tnum` utility for aligned numbers anywhere else (percentages, counts, dates in columns).

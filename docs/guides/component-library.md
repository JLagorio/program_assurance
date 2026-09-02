# Component library

Three tiers, three files. Everything a screen is made of lives in one of them, and the tier says
how much a component is allowed to know.

| Tier             | File                              | Knows about                                | Examples                                                   |
| ---------------- | --------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| **Primitives**   | `components/app/ui.tsx`           | One element, one job. No domain types.     | Button, Badge, Input, Table, KeyValue, Tile, Notice, Label |
| **Compositions** | `components/app/compositions.tsx` | Several primitives with a data contract.   | Tiles                                                      |
| **Shapes**       | `components/app/shapes.tsx`       | A whole screen region and the job it does. | WorkPane, ActionBar, Inspector, Disclosure, Block          |

Domain files (`baselines.tsx`, `sctm.tsx`, `test-execution.tsx`, …) assemble these. They may
own a tone map for their vocabulary and a component that binds data to a composition. They may
not declare a primitive.

## Rules

- **No local helpers.** If a file needs a `Dash`, `Tile`, `Prose`, `Fact` or `Notice`, it imports
  the one in `ui.tsx`. The audit on 2026-09-01 found nine copies of `Dash`, seven of `ProseBlock`,
  four of `Tile`/`Stat`, three each of `WrapValue`, `IdList` and `Fact`, and four hand-built tinted
  banners, all drifting from each other by a pixel or a weight. That drift is what "fragmented"
  looks like.
- **Three copies makes a composition.** The second time a read-out is built by hand, stop and lift
  it. `Tiles` came from four summaries that each wrote the same `gap-px` grid.
- **Status is a Badge on a tone map.** A domain chip is `Badge` plus a `Record<Value, Tone>` from
  `lib/`. Nineteen `*Chip` wrappers exist; each is one line and should stay one line. The
  open question is size: some render `xs`, some `sm`, for the same concept (`MethodChip` in
  `conmon.tsx` is `xs`, in `sctm.tsx` it is `sm`). Storybook `Status/Vocabulary` lays out every map
  so that can be decided once.
- **One micro-label.** `Label` is 11px, weight 500, 0.06em tracking, muted. The audit found eight
  variants of that class string. `Inspector` group titles and the sidebar still use a
  semibold/80% variant, and `ActionBar` state labels and the `Fact` strip use 0.04em regular; those
  are the remaining two to reconcile.
- **Numbers.** `Tile` is the framed cell (label, 20px value, note) and only lives inside `Tiles`.
  `Stat` is the bare number for an inline summary row. Zero renders muted in a Tile.
- **No `description` on anything new.** See `shapes.tsx`. A heading may carry a count or a
  constraint, never an explanation of the model.

## Proposed migration (not applied)

The audit produced a mechanical plan for re-pointing the domain files at these primitives. It is
held until the primitives are signed off in Storybook; the prototype is unchanged.

| Was (local)                            | Now                          |
| -------------------------------------- | ---------------------------- |
| `Dash` ×9                              | `Dash`                       |
| `ProseBlock` ×7 (two padding variants) | `Prose` (`className="pt-0"`) |
| `WrapValue` ×3                         | `KeyValue wrap`              |
| `IdList` ×2                            | `IdList`                     |
| `Tile` ×3, `Stat` (framed) ×1          | `Tile` inside `Tiles`        |
| `Stat` (bare) ×2                       | `Stat`                       |
| `Eyebrow`                              | `Label tone`                 |
| `Callout`, rail banners ×4             | `Notice`                     |
| route-level `Fact` ×3                  | `Fact`                       |

Applying it would change these four things, each a decision rather than a side effect:

- `info` tone would map to `text-info`; the local helpers use `text-primary`.
- A `Tile` with value `0` would render muted in every summary; only the baseline summary does today.
- The inheritance summary would use `Tiles frame="band"` hairlines instead of its own `border-r`
  separators.
- `Notice` pads `px-3 py-2.5`; the rail banners are `px-2.5 py-2`.

## Still local, on purpose for now

- `remediation.tsx` `Fact` is a stacked label-over-value, not the inline strip. Different thing.
- `composition.tsx` `BomSummary` metrics grid and `conmon.tsx` `AlertSummary` badge row are
  two more summary designs. Fold into `Tiles`/`Stat` once the tile look is signed off.
- `inline-edit.tsx` `InlineText`/`InlineSelect` are candidates for `ui.tsx` once their focus and
  hover states are reviewed in Storybook.

## Next cuts

1. `Status/Vocabulary` review → pick chip sizes per context, then a `StatusBadge` that reads the
   map by name.
2. The ten `*Rail` components → `Inspector` groups, retiring `RailGroup`.
3. `Section` with `description` on 21 files → `Block`/`Disclosure`.

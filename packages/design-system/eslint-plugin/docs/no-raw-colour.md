# ledger/no-raw-colour

Reports a literal colour in an SVG element's or a recharts part's colour attribute, in the colour keys of a recharts part's object props and of the records its data holds, and in a module's list of colours.

## Reports

- A colour attribute, `fill`, `stroke`, `color`, `stopColor`, `floodColor` or `lightingColor`, on an SVG or other intrinsic element (`<rect>`, `<path>`, `<stop>`) or on a part imported from `recharts` (by name, alias or namespace), whose value is a literal colour: `<rect> fill="#f00" is a literal colour.` A recharts part is named as written, `<Bar> fill="#8884d8"`.
- The `fill`, `stroke` and `color` keys of an object given to a recharts part's `cursor`, `activeBar`, `activeDot`, `dot`, `tick`, `label`, `labelLine`, `activeShape` or `background`: `<Line activeDot> fill is a literal colour (#fff).`
- The same keys of each record a recharts part's `data` or `payload` holds, which it paints from: a Pie's sectors take each record's `fill` (recharts 3; `Cell` is deprecated), a Legend's entries their `color`. `<Pie data> fill is a literal colour (#0088FE).` A record two parts read is reported once, where it is written.
- A module's `const` that is a list of colours: an array or object, alone or in `Object.freeze`, every string of which, at any depth, is a colour, one at least a hex or a colour function. It is reported once, where it is written, however the file reads it: `COLORS holds literal colours (#0088FE, #00C49F).`

A literal colour is a hex value, a colour function (`rgb()`, `hsl()`, `oklch()` and their kin, a template's holes quoted as written), or one of the 148 CSS colour names as a whole word. The value is followed to where it is written in the same file, as `ledger/no-style-design-value` follows a style: a branch, a `const`, a map's entry, a same-file function and the arguments its call gives it, and the strings of a concatenation or a template's holes (`"#0088fe" + alpha`); a finding on a value written elsewhere says where (`(from RED on line 3)`). A `var(--…)`'s fallback is read, since it is the colour wherever the variable is not set (`var(--x, #f00)`). `currentColor`, `none`, `transparent`, `inherit`, `url(#…)`, a `var(--…)` without a fallback and relative colour syntax built on one (`oklch(from var(--ds-color-chart-brand) l c h / 0.4)`) are no literal colour, and any call passes: `token("color.chart.brand")`, the Chart's `chartColor()`, `surface()`.

## Why

A literal colour in a chart or an icon does not change with the colour mode, the contrast mode or the palette: a series drawn `#8884d8` stays that purple on a dark surface and under more contrast, where the Chart's tokens change with the mode. The kit's charts read their colours from tokens and give each series its tone and texture, and an icon draws in `currentColor` so it takes the text colour around it ([Chart](../../src/stories/patterns/Chart.mdx), [Which token](../../src/stories/docs/WhichToken.mdx)).

## Instead

On an icon or a mark, `fill="currentColor"` or `stroke="currentColor"` with a text or icon token class on the element or its parent (`text-subtle`, `text-danger`). In a chart, the Chart's parts with their `tone`, or `token("color.chart.…")` for a colour the chart draws itself.

## Examples

### Reported

```tsx reported
export function StatusDot() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden>
      <circle cx={4} cy={4} r={4} fill="#22c55e" />
    </svg>
  );
}
```

```tsx reported
const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export function Swatches() {
  return (
    <svg viewBox="0 0 24 8" aria-hidden>
      {COLORS.map((colour, i) => (
        <rect key={colour} x={i * 8} width={8} height={8} fill={colour} />
      ))}
    </svg>
  );
}
```

```tsx reported
const ACCENT = "rgb(99 102 241)";

export function Spark({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 100 20" aria-hidden>
      <path d={path} stroke={ACCENT} fill="none" />
    </svg>
  );
}
```

### Allowed

```tsx allowed
export function StatusDot() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden className="text-success">
      <circle cx={4} cy={4} r={4} fill="currentColor" />
    </svg>
  );
}
```

```tsx allowed
import { token } from "@ledger/design-system";

export function Spark({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 100 20" aria-hidden>
      <path d={path} stroke={token("color.chart.brand")} fill="none" />
    </svg>
  );
}
```

## Suggestions and fixes

Neither. Which token a colour becomes is a choice of role (a series, a status, the text around an icon), not of the nearest value, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets, and in the kit's stories too, where a swatch or a Don't example draws its colours from tokens like any part; it landed with no finding in the kit or the application, so neither `test/lint-allow.json` nor `scripts/lint-allow.json` has an entry for it. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A colour attribute on a component that is not recharts' is that component's prop and is not read (`<DataTable fill>`, `<Text color="color.text.subtle">`), and neither is an attribute spread onto an element (`<path {...stroke} />`).
- A `<link>`'s or a `<meta>`'s `color` (`<link rel="mask-icon" color="#5bbad5">`) is read by the browser's own chrome, which no token reaches, and is not read.
- A recharts part's style props (`contentStyle`, `wrapperStyle`, `labelStyle`, `itemStyle`) are styles, which [`ledger/no-style-design-value`](no-style-design-value.md) reads.
- A list of colour names alone (`["blue", "teal"]`) is not reported where it is written, since it is as often a list of token or tone names; a colour attribute that reads one of its names is.
- A value written in another file, and a colour built at runtime (`` `#${hex}` ``), are not read.

# ledger/no-static-design-value

Reports a stock Tailwind utility that fixes a design value the tokens own: a radius, an opacity, a duration, a border or ring width, or a literal colour.

## Reports

Each report names what the class fixes and the token of its role nearest the value:

- `rounded`, alone or on one side (`rounded-t`, `rounded-s`): a fixed 4px radius, with the two radii either side on the same side (`Nearest: rounded-t-small (3px, …) or rounded-t-medium (5px, …).`).
- `opacity-<n>`, other than `opacity-0` and `opacity-100`: a numeric opacity, with the two design opacities, the nearest first, each with its purpose.
- `duration-<n>`: a numeric duration, with the duration of that value (`150ms is duration-medium.`) or the two nearest (`duration-200`: `Nearest: duration-moderate (240ms, …) or duration-medium (150ms, …).`). `delay-<n>` names the duration token for a delay in style, since no delay class takes one (`A delay has no class; in style, the nearest is token("motion.duration.fast") (110ms).`).
- `border-<n>` on any side (`border-2`, `border-t-4`): a numeric border width, with the width of that value (`border-1` is `border`, the default 1px) or the tokens that hold it (2px is `border-w-selected` or `border-w-focused`, which set every side), else the scale's range.
- `ring` and `ring-<n>`: "a ring width; use outline-focused".
- `bg-`, `text-` or `border-` with `white`, `black`, `current` or `inherit`, and `text-transparent`: a literal colour, with the roles its hue plays for the utility, each with its purpose, ranked with its `dark:` twin on the same site in both modes; `current`, `inherit` and `transparent` ask for the token of the role.

A report reads `"opacity-50" is a numeric opacity. Ledger has opacity-disabled (0.4, opacity of disabled elements when a disabled…) or opacity-loading (0.2, opacity of content in a loading state).` While the lint data is stale, a report names the scale to pick from instead (`Use rounded-xsmall…rounded-full.`). The class is reported under any variant or with `!`, wherever the lint reads classes: `className`, `class` (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`, `iconClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`, react-scroll's `activeClass="active"`), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map.

None of these classes is a token utility, and a class has one owner: this rule reports them, since it names the token, and [`ledger/no-non-token-class`](no-non-token-class.md) leaves them to it. Under `dark:` the class is [`ledger/no-dark-variant`](no-dark-variant.md)'s (`dark:bg-white`), under a variant Tailwind does not generate [`ledger/no-unknown-variant`](no-unknown-variant.md)'s (`tablet:rounded`), and with an opacity modifier it is no longer the stock spelling (`bg-white/50` is [`ledger/no-non-token-class`](no-non-token-class.md)'s, as a palette colour with alpha).

## Why

Each of these is Tailwind's own default for a value Ledger names as a token, and each one drifts: bare `rounded` is 4px on a scale of 2, 3, 5, 7, 9 and 12px, `opacity-50` is neither of the two design opacities, `duration-200` is off the motion scale, `ring-2` draws a focus mark the kit does not use, and `bg-white` stays white in dark mode. A token keeps the value the same wherever it appears and lets the mode, the density or a later decision change it in one place. The [Shape](../../src/stories/tokens/Shape.mdx) page holds the radius and border scales and the focus outline; [Which token](../../src/stories/docs/WhichToken.mdx) holds the rest by job.

## Instead

The token for the value's role, by kind: a radius, an opacity, a duration, a border width, a focus mark or a colour.

- A radius: `rounded-xsmall` to `rounded-full`. A control is `rounded-medium`, a card `rounded-large`, a dialog `rounded-xxlarge`; the Shape page has the table by part.
- An opacity: `opacity-disabled` for a disabled part with no disabled token of its own, `opacity-loading` for content being replaced. `opacity-0` and `opacity-100` stay for hidden and shown.
- A duration: `duration-micro`, `duration-fast`, `duration-medium`, `duration-moderate`, `duration-slow` or `duration-slower`, with `ease-standard`, `ease-enter` or `ease-exit`. A delay has no token; one that is needed is a kit change, made through `/ledger-add-part`.
- A border width: `border` for every standard border and divider, with a colour such as `border-default`; `border-w-selected` or `border-w-focused` for the 2px selected and focus edges.
- A focus mark: `focus-visible:outline-focused`, or `outline-field-focused` on a field.
- A colour: the role's token, such as `bg-surface`, `text-default`, `text-inverse` on a bold fill, or `border-default`. Text that takes its parent's colour needs no class, and `invisible` hides text that must keep its space.

## Examples

### Reported

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function EvidencePanel({ summary }: { summary: string }) {
  return (
    <Box padding="space.200" className="rounded border-2 border-default">
      <Text>{summary}</Text>
    </Box>
  );
}
```

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function ArchivedRow({ name, archived }: { name: string; archived: boolean }) {
  return (
    <Box padding="space.100" className={archived ? "opacity-50" : undefined}>
      <Text>{name}</Text>
    </Box>
  );
}
```

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function HoverTile({ label }: { label: string }) {
  return (
    <Box
      padding="space.200"
      className="bg-white transition-colors duration-200 hover:bg-surface-hovered"
    >
      <Text>{label}</Text>
    </Box>
  );
}
```

### Allowed

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function EvidencePanel({ summary }: { summary: string }) {
  return (
    <Box padding="space.200" className="rounded-large border border-default">
      <Text>{summary}</Text>
    </Box>
  );
}
```

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function ArchivedRow({ name, archived }: { name: string; archived: boolean }) {
  return (
    <Box padding="space.100" className={archived ? "opacity-disabled" : undefined}>
      <Text>{name}</Text>
    </Box>
  );
}
```

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function HoverTile({ label }: { label: string }) {
  return (
    <Box
      padding="space.200"
      backgroundColor="elevation.surface"
      className="transition-colors duration-fast ease-standard hover:bg-surface-hovered"
    >
      <Text>{label}</Text>
    </Box>
  );
}
```

## Suggestions and fixes

No fix. An editor suggestion only when one token holds the class's value: `duration-150` offers `duration-medium`, `border-1` `border`, and a literal colour whose `dark:` twin on the site makes a pair that one role holds within ΔE 0.02 in both modes (`bg-white dark:bg-surface` offers `bg-surface` for `bg-white`; a grey pair only where, as here, the twin is the token that names its role). A value between two steps, a value two tokens hold (`border-2`), an opacity and a colour's roles are named, never offered: which one is right depends on the part and its state. A suggestion never runs under `--fix`, and it writes only a class no Ledger rule reports.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. Neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It knows the stock spellings listed above and no others: a stock value under another name (`rounded-md`, `shadow-lg`, `bg-gray-100`) is [`ledger/no-non-token-class`](no-non-token-class.md)'s alone.
- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `text-${tone}-600` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, or when each word is one it knows or one no data is spelt like and one at least is the latter (a bracketed value, a class with alpha or a Tailwind palette colour, on a utility Tailwind places: `export const width = "w-[240px]"`, but not the identifiers `"sp-800-53/5"` or `"items-[0]"`), and a module-level map only when most of its strings other than bare words are, so a string of other stock classes exported for another file passes (`"p-4 shadow-md"`), and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.
- A value in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s, and a value in a stylesheet is outside the lint.

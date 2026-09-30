# ledger/no-deprecated-token

Reports a class that paints a deprecated token, and names the class that replaces it.

## Reports

A class whose token carries a deprecation in `tokens/`, as the token build lists it in `src/generated/utilities.json`. Today that is `fill-chart-categorical-8`: there is no eighth category, so the last series is Other, `fill-chart-categorical-7`. The message takes one of three forms:

- The token has a replacement the rule can write: `"fill-chart-categorical-8" is deprecated; use "fill-chart-categorical-7".` The replacement keeps the class's variants and `!` (`hover:fill-chart-categorical-7`).
- The replacement cannot be written in place, and the message adds why: `Replace it by hand; it is written in a template or as a name, so no automatic fix is offered.` The other reasons are an escape in the string, a type that names the string, an HTML entity in the class, and an object that already has the new key.
- The token has no replacement the rule can ask for, none or one another class rule would report: `"<class>" is deprecated.`

A class has one owner, so it is reported once. Under `dark:` it is [`ledger/no-dark-variant`](no-dark-variant.md)'s (`dark:fill-chart-categorical-8`), whose fix drops the class; the rewrite this rule would write, `dark:fill-chart-categorical-7`, would still be reported. Under a variant Tailwind does not generate (`hovr:fill-chart-categorical-8`) it is [`ledger/no-unknown-variant`](no-unknown-variant.md)'s, since the class generates nothing whatever its token.

The class is reported wherever the lint reads classes: `className`, `class` and any `*ClassName` attribute or object key (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map.

## Why

A token is renamed or retired in two steps: it is deprecated for one version, with its replacement named in the token's `$extensions.ledger.deprecated`, and then removed. The rule turns the deprecation into a report while the old class still works, so the move happens before the removal breaks the screen. The [component library guide](../../../../docs/guides/component-library.md#versioning-and-publishing) holds the versioning rule, and the token's `$description` says why it went.

## Instead

The class the message names. `eslint --fix` writes it where the class is a plain string; elsewhere, write it by hand. A token deprecated with no replacement is removed from its use: its `$description` in `tokens/` and its CHANGELOG entry say what took its place.

## Examples

### Reported

```tsx reported
export function OtherSwatch() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-100">
      <rect width="8" height="8" className="fill-chart-categorical-8" />
    </svg>
  );
}
```

```tsx reported
export const otherSeries = "fill-chart-categorical-8";
```

```tsx reported
export function OtherSwatch({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-100">
      <rect
        width="8"
        height="8"
        className={`fill-chart-categorical-8 ${muted ? "opacity-disabled" : ""}`}
      />
    </svg>
  );
}
```

### Allowed

```tsx allowed
export function OtherSwatch() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-100">
      <rect width="8" height="8" className="fill-chart-categorical-7" />
    </svg>
  );
}
```

```tsx allowed
import { cn } from "@ledger/design-system";

export function OtherSwatch({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-100">
      <rect
        width="8"
        height="8"
        className={cn(
          "fill-chart-categorical-7 hover:fill-chart-categorical-7-hovered",
          muted && "opacity-disabled",
        )}
      />
    </svg>
  );
}
```

## Suggestions and fixes

It autofixes with `--fix` where the token has a replacement. The fix writes the replacement over the whole class inside the string's own source, so the quotes, entities, line breaks, variants and `!` stay as they were, and a longer class that contains the old one is left alone. It offers no fix, and its message says why, when the class is in a template literal or is an object key written as a name, when the string is written with an escape, when a type in the file names the string, when the class is written with an HTML entity, and when the new class would give an object a key it already has. It offers no editor suggestions.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The kit keeps its counts in `test/lint-allow.json`. This repository's application passes no allowance for the rule, so every report there fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It knows one class per deprecated token, the one the token build names for it. The other utilities Tailwind makes from the same token pass: `bg-chart-categorical-8` and `stroke-chart-categorical-8` are not reported.
- A token read another way is outside it: a CSS variable (`var(--ds-color-chart-categorical-8)`), a value in `style` or a stylesheet, or a prop value, which the part's type checks.
- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `fill-chart-categorical-${index}` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, and a module-level map only when most of its strings other than bare words are, so a string of stock classes exported for another file passes, and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.

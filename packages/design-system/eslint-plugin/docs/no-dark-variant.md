# ledger/no-dark-variant

Reports a class with the `dark:` variant: every colour is a token that flips by itself, so a `dark:` class means a token is missing, or sets something that should not change with the mode.

## Reports

- A class with `dark` anywhere in its chain of variants (`dark:bg-neutral`, `hover:dark:bg-neutral-hovered`), whatever its base. A colour is read with its light twin on the same site, the colour class of the same prefix under the same other variants (nearest-token pairing):
  - Beside a twin that is a token, which changes with the mode by itself, the dark: class only goes: `"dark:bg-gray-900" sets a dark value by hand beside "bg-surface", a token that already changes with the mode. Drop the dark: class.`
  - A token under `dark:` with no twin is that token already: `"dark:bg-surface" sets bg-surface for dark mode alone, and bg-surface is a token that already changes with the mode. Write it without dark:, or drop the class.`
  - With a twin that is no token (`bg-white dark:bg-gray-900`), the pair is ranked in both modes and the finding names at most two tokens of its hue's roles, each with its purpose, which replace both classes; a single one only when one role holds the colour in both modes, and for a grey never (decision 8).
  - A token under `dark:` beside a twin that is a literal colour (`bg-white dark:bg-surface-raised`) says the token changes with the mode by itself and the light class is the literal one: `"dark:bg-surface-raised" is a token, which changes with the mode by itself, and the light class beside it is a literal colour. With "bg-white" it is bg-surface-raised in both modes (…). One token replaces both classes, written without dark:.` Under a long chain of variants, the words fall back to the roles alone, so they keep to the message limit.
  - A colour with no twin the site makes plain (a `cn` over branches) is ranked by its dark value alone and never given a single pick.
  - A class that sets no colour, alpha on a token, a deprecated token, or any class while the lint data is stale gets the rule's own words: `"dark:w-[1px]" uses the dark variant. The colour mode flips every token by itself: drop the class, and give a colour its token.`
- It is the one rule that reports such a class, whatever else is wrong with its base (`dark:bg-white`, `dark:bg-red-500/50`, `dark:w-[1px]`, a margin such as `dark:mt-4`, a deprecated token under `dark:`), since dropping the class is the whole fix. It comes first among the class rules, so a `dark:` class stays reported where another rule is off or waived: a `dark:` margin in `primitives/bleed.tsx`, or on a line that disables [`ledger/no-margin`](no-margin.md).

One report per class. The rule reads classes wherever the class rules do: `className`, `class` (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`, `iconClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`, react-scroll's `activeClass="active"`), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map.

## Why

The colour mode is one attribute on the root, and every token reads it, so the whole product flips at once and no component knows. A `dark:` class is a component choosing a second colour for itself: that colour sits outside the contrast tests, which hold every token pair in both modes and at increased contrast, and the next screen chooses a different one. See [Mode](../../src/stories/components/Mode.mdx) and [Color](../../src/stories/tokens/Color.mdx).

## Instead

- Drop the `dark:` class and keep the token: `bg-neutral` is already right in both modes.
- Where the light class is not a token either (`bg-white dark:bg-surface-raised`), both become the one token for the job, such as `bg-surface-raised`; [Which token](../../src/stories/docs/WhichToken.mdx) lists them by job.
- A `dark:` class that sets no colour (`dark:w-[1px]`, `dark:scale-100`) is dropped: the layout does not change with the mode.
- A colour no token gives in both modes is a kit change, proposed through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
export function SavedNote() {
  return <p className="text-default dark:text-subtle">Last saved two minutes ago</p>;
}
```

```tsx reported
import { cn } from "@ledger/design-system";

export function Band({ open }: { open: boolean }) {
  return <section className={cn("bg-surface-raised", open && "dark:bg-surface-overlay")} />;
}
```

```tsx reported
export function QueueItem({ name }: { name: string }) {
  return (
    <li className="bg-surface-raised hover:bg-surface-raised-hovered hover:dark:bg-neutral-hovered">
      {name}
    </li>
  );
}
```

### Allowed

```tsx allowed
export function SavedNote() {
  return <p className="text-subtle">Last saved two minutes ago</p>;
}
```

```tsx allowed
export function QueueItem({ name }: { name: string }) {
  return <li className="bg-surface-raised hover:bg-surface-raised-hovered">{name}</li>;
}
```

## Suggestions and fixes

Neither. The message says when dropping the class is the whole fix (its twin is a token), but a pair that is no token needs a token chosen for its role, and the class list may be spread over branches, so the rule offers no `--fix` and no editor suggestion.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It reads the `dark` variant only. A selector on the colour mode written as an arbitrary variant (`[[data-color-mode=dark]_&]:bg-neutral-bold`) is not reported, by this rule or any other.
- A stylesheet is not read: `@media (prefers-color-scheme: dark)` or a `[data-color-mode="dark"]` rule in CSS goes unseen.
- A colour in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s.
- A line disable, an allowance or a bulk suppression of this rule waives the whole class at its site: whatever else a `dark:` class holds (`dark:mt-[13px]`, `dark:bg-red-500`) is reported by no other rule there.
- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `text-${tone}-600` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, or when each word is one it knows or one no data is spelt like and one at least is the latter (a bracketed value, a class with alpha or a Tailwind palette colour, on a utility Tailwind places: `export const width = "w-[240px]"`, but not the identifiers `"sp-800-53/5"` or `"items-[0]"`), and a module-level map only when most of its strings other than bare words are, so a string of other stock classes exported for another file passes (`"p-4 shadow-md"`), and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.

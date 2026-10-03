# ledger/no-alpha-token

Reports an opacity modifier on a colour class (`bg-brand-bold/80`): a state is a token, never alpha on a base token.

## Reports

- A colour token with a numeric opacity modifier: `bg-`, `text-`, `icon-`, `border-`, `shadow-`, `ring-`, `outline-`, `decoration-`, `divide-`, `fill-`, `stroke-`, `from-`, `via-`, `to-`, `accent-` or `caret-`, a token's name, then `/` and a number (`bg-brand-bold/80`, `text-default/60`), with or without variants (`hover:bg-neutral/50`). The finding names the token the alpha dims and the state tokens it stands for, from the tokens that exist, picked by the alpha: at `/30` or below a tint, the token's subtle, subtler or subtlest form (or the grey ladder's), only one nearer the page than the token itself, the one or two nearest the colour the alpha makes over the page in both modes; at `/60` or above its own hovered and pressed states, or its quieter tints where it has no state (`text-default/60`); in between, the nearest tint and the hovered state. A band with nothing names nothing, never the other band's states: the quietest grey (`text-subtlest/60`) and a faded chart series (`stroke-chart-brand/10`) are told that a tint or a state is its own token. A variant that asks for a state the token has names that state alone. For example `"bg-brand-bold/10" dims bg-brand-bold with alpha, which changes its contrast and its dark value. A tint of it is bg-brand-subtlest.`, and `"hover:bg-neutral/50" dims bg-neutral with alpha, … That state is its own token: hover:bg-neutral-hovered.` A token with neither a tint nor a state, such as `border-brand`, is told that a tint or a state is its own token.

One report per class. The rule reads classes wherever the class rules do: `className`, `class` (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`, `iconClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`, react-scroll's `activeClass="active"`), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map. A class has one owner, so this rule is the only one that reports these. Under a variant Tailwind does not generate (`hovr:bg-brand-bold/50`) the class is [`ledger/no-unknown-variant`](no-unknown-variant.md)'s, since it generates nothing whatever its colour. Alpha on a colour that is no token is [`ledger/no-non-token-class`](no-non-token-class.md)'s, since a state token alone would not fix it: a Tailwind palette colour (`bg-red-500/50`, `text-white/70`) with its own message, and any other word (`bg-muted/50`). A `dark:` class is [`ledger/no-dark-variant`](no-dark-variant.md)'s.

## Why

Alpha on a base token makes a colour nobody chose: it changes with whatever is underneath, it sits outside the contrast tests that hold every token pair in both modes and at increased contrast, and the next screen picks another number. The kit names its states instead: every fill has `hovered` and `pressed` tokens, every tone a `subtler` and a `subtle` emphasis, and disabled and loading content its own opacity tokens. See [Color](../../src/stories/tokens/Color.mdx) and [Which token](../../src/stories/docs/WhichToken.mdx).

## Instead

- The token that names the state: its hovered, pressed, subtle or disabled form.
- A hover or a press is the state token: `hover:bg-neutral-hovered`, `active:bg-brand-bold-pressed`, `hover:bg-surface-raised-hovered`.
- A lighter fill of a tone is its emphasis, `bg-danger-subtle` or `bg-danger-subtler`, or the part's `tone` prop (Badge, Alert, Indicator).
- Quieter text is `text-subtle` or `text-subtlest`.
- A state that dims an element is the part's own: a Button that cannot run takes `disabledReason`, which says why, a field takes `disabled`, and content being replaced takes `isLoading`. Where there is no part, `opacity-disabled` or `opacity-loading`.
- A state no token names is a kit change, proposed through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
export function SavedNote() {
  return <p className="text-default/60">Last saved two minutes ago</p>;
}
```

```tsx reported
export function QueueItem({ name }: { name: string }) {
  return <li className="bg-surface-raised hover:bg-neutral/50">{name}</li>;
}
```

```tsx reported
import { cn } from "@ledger/design-system";

export function Band({ pending }: { pending: boolean }) {
  return <section className={cn("bg-brand-bold", pending && "bg-brand-bold/50")} />;
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

```tsx allowed
import { Button } from "@ledger/design-system";

export function SaveButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" variant="primary" isLoading={pending}>
      Save requirement
    </Button>
  );
}
```

## Suggestions and fixes

Neither. The message names the state tokens the alpha most likely stood for, but which one is right depends on what the alpha meant (a hover, a tint, a disabled look), which the class does not say, so the rule offers no `--fix` and no editor suggestion.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- A bracketed opacity or one read from a variable (`bg-brand-bold/[0.5]`, `bg-brand-bold/(--alpha)`) is [`ledger/no-arbitrary-value`](no-arbitrary-value.md)'s, and an opacity in `style` or in a stylesheet is not read.
- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `text-${tone}-600` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, or when each word is one it knows or one no data is spelt like and one at least is the latter (a bracketed value, a class with alpha or a Tailwind palette colour, on a utility Tailwind places: `export const width = "w-[240px]"`, but not the identifiers `"sp-800-53/5"` or `"items-[0]"`), and a module-level map only when most of its strings other than bare words are, so a string of other stock classes exported for another file passes (`"p-4 shadow-md"`), and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.

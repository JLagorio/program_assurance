# ledger/no-arbitrary-value

Reports a class with an arbitrary value (`text-[13px]`, `w-[240px]`, `bg-[#eee]`), which bypasses the tokens.

## Reports

- A class whose value is written in square brackets: after a utility (`w-[240px]`, `text-[13px]`, `bg-[#eee]`, `grid-cols-[200px_1fr]`), as an opacity (`bg-brand-bold/[0.5]`), or as a whole property (`[mask:none]`), with or without variants (`md:w-[240px]`). It says the class is an arbitrary value, then names the token of the value's role nearest it, only from the family the utility's role names: a space for padding, gap, inset and translate (`"p-[13px]" is an arbitrary value. Nearest: p-150 (12px) or p-200 (16px).`), a type style for a text size (`13px is font-body.`), a radius, a border width (1px is the utility's own `border` or `border-t`), a duration, the two opacities, and the roles a colour's hue plays, each with its purpose. A width or a height names no token: `"w-[240px]" is an arbitrary value. A width is a layout part's, a part's preset or computed from its container (w-full, a grid track).` (a height's example is `h-full`), except 1px, which is its own spelling (`h-[1px]` is `h-px`). Zero is `space.0` (`top-[0px]` is `top-0`); a radius from 32px up rounds a pill's ends and names `rounded-full` (9999px is it exactly); an outline's width names the border widths and `outline-focused`, a ring's width the focus outline, a weight in brackets its weight (`font-[500]` is `font-medium`) and a delay a duration token in style. On an element [`ledger/use-primitives`](use-primitives.md) reads, in a product, a padding or a gap is named as its primitive's prop (`16px is space.200: padding="space.200" on a Box.`), with no class suggestion. A colour's hue is read from its lightness too, so a pale status tint (`bg-[#fef2f2]`) is its hue's, not a grey's. Any other value asks for a token utility or a primitive prop.
- Tailwind 4's variable shorthand, for a value or an opacity, typed or not (`w-(--rail)`, `bg-(image:--hero)`, `bg-brand-bold/(--alpha)`): `"w-(--rail)" reads a CSS variable the lint cannot compare with a token.`
- A Ledger token's own variable, in the shorthand or in brackets, typed or not (`bg-(--ds-elevation-surface)`, `bg-[var(--ds-elevation-surface)]`, `bg-(color:--ds-elevation-surface)`). Where a token class generates the same CSS, the finding names it and `--fix` writes it: `"bg-(--ds-elevation-surface)" writes a token's variable by hand. Use "bg-surface", the token utility that generates the same CSS.` Where none does (`divide-[var(--ds-color-border)]`, or a type hint that sends the value to another property, `bg-(length:--ds-elevation-surface)`), it is reported as an arbitrary value.

One report per class. The rule reads classes wherever the class rules do: `className`, `class` (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`, `iconClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`, react-scroll's `activeClass="active"`), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map.

Not reported: a grid template whose tracks carry no length (`grid-cols-[auto_1fr]`, `grid-cols-[minmax(0,1fr)_auto]`, `grid-rows-[subgrid]`). Its tracks size to content or share the free space, which is structure. Nor are the two variables the kit reads as structure: Grid's responsive columns (`grid-cols-(--ds-grid-md)`) and a disclosure panel's measured height (`h-(--accordion-panel-height)`, `h-(--collapsible-panel-height)`).

A class has one owner, so it is reported once: this rule reports an arbitrary value or a variable shorthand, and [`ledger/no-non-token-class`](no-non-token-class.md) and [`ledger/no-alpha-token`](no-alpha-token.md) leave it to it. A margin with one (`mt-[13px]`) is [`ledger/no-margin`](no-margin.md)'s, a `dark:` class [`ledger/no-dark-variant`](no-dark-variant.md)'s, and a class under a variant Tailwind does not generate (`tablet:w-[13px]`) [`ledger/no-unknown-variant`](no-unknown-variant.md)'s, since it generates nothing whatever its value.

## Why

A token is a decision made once. A 13px text or a 240px column written in place is a value no one else can find: it does not follow the scale, a written colour does not flip with the colour mode, and the next screen writes a slightly different one. The class rules' allowlist is generated by the token build, so the lint and the tokens cannot drift; a value in brackets steps outside both. See [Which token](../../src/stories/docs/WhichToken.mdx) and, for the structural utilities that pass, the [Lint rules](../../src/stories/docs/Lint.mdx) page.

## Instead

- A token utility or a primitive prop, chosen by the value's role.
- A size takes a space key or a layout dimension: `w-1000`, `min-h-800`, `size-150`, `w-layout-panel`, `max-w-layout-measure`, `min-w-control-medium`.
- Type is `font-body-small` or `font-heading-page`, and a weight `font-medium`; a colour is its token (`bg-neutral`, `text-subtle`); a radius is `rounded-small` to `rounded-full`.
- Space and layout go through the primitives' props: `padding` on Box, `space` on Stack and Inline, `templateColumns` and `gap` on Grid.
- A column's width is `width` or `minWidth` on its Table.Header or DataTable column; a dialog's is `width` on DialogContent (`small` to `fullscreen`).
- A value no token holds is a kit change, proposed through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
export function Caption({ children }: { children: string }) {
  return <p className="text-[13px]">{children}</p>;
}
```

```tsx reported
import { Input } from "@ledger/design-system";

export function ControlSearch() {
  return <Input aria-label="Search controls" className="w-[240px]" />;
}
```

```tsx reported
import { cn } from "@ledger/design-system";

const menuWidth = "min-w-[12rem]";

export function MenuPanel({ className }: { className?: string | undefined }) {
  return <section className={cn(menuWidth, className)} />;
}
```

```tsx reported
export function Rail({ children }: { children: string }) {
  return <aside className="w-(--rail) shrink-0">{children}</aside>;
}
```

### Allowed

```tsx allowed
export function Caption({ children }: { children: string }) {
  return <p className="font-body-small text-subtle">{children}</p>;
}
```

```tsx allowed
import { Grid, Text } from "@ledger/design-system";

export function OwnerDetails({ owner }: { owner: string }) {
  return (
    <Grid as="dl" templateColumns="max-content minmax(0, 1fr)" columnGap="space.200">
      <Text as="dt">Owner</Text>
      <Text as="dd">{owner}</Text>
    </Grid>
  );
}
```

```tsx allowed
import { Table } from "@ledger/design-system";

export function ControlsHeader() {
  return (
    <thead>
      <tr>
        <Table.Header minWidth={200}>Control</Table.Header>
        <Table.Header width={180}>Owner</Table.Header>
      </tr>
    </thead>
  );
}
```

## Suggestions and fixes

A fix, for a Ledger token's variable alone. The token build asks Tailwind which token class generates the same CSS as each token's variable written after a utility (lint-values.json's `varToClass`): the class's own token (`bg-(--ds-elevation-surface)` is `bg-surface`), a key of the space scale on any utility that takes it (`p-[var(--ds-space-200)]` is `p-200`), and a radius on a corner (`rounded-t-(--ds-radius-medium)` is `rounded-t-medium`). A type hint must be the one the token's kind takes: `bg-(color:…)`, `h-(length:…)`. `--fix` writes the class in the string's own source, with the class's variants and important modifier, the string's quotes and its line breaks: `hover:!bg-(--ds-elevation-surface)` becomes `hover:!bg-surface`.

No fix where the class is written in a template, with an escape or beside an entity: the message still names the class, and says why it is replaced by hand. None, and the arbitrary value message, where the token class is one another rule reports, such as a deprecated token, and while the lint data is stale, when the pair may no longer generate the same CSS: the rule then says so once, at line 1 of each file, as [`ledger/no-non-token-class`](no-non-token-class.md)'s page describes. Any other arbitrary value gets no fix: it names a number, not a role. It gets an editor suggestion only when one token class of its role holds exactly its value (`p-[16px]` offers `p-200` where no primitive's prop takes it, `rounded-[5px]` `rounded-medium`, `border-t-[1px]` `border-t`, `duration-[150ms]` `duration-medium`, `h-[1px]` `h-px`, `top-[0px]` `top-0`, `rounded-[9999px]` `rounded-full`), never for a width, a colour's roles, a value two tokens hold (`border-[2px]`, selected or focused), a value between two steps, or a padding or a gap [`ledger/use-primitives`](use-primitives.md) reports on its element. A suggestion never runs under `--fix`, and it writes only a class no Ledger rule reports.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The rule is off in the kit's stories, where a story's own frame may take a fixed width. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It reads a class's base, not its variants: an arbitrary variant (`data-[state=open]:`, `[&>svg]:`) is not reported.
- The rule is off in the kit's stories, and no other rule reports an arbitrary value or a variable shorthand there (`w-[240px]`, `w-(--rail)`, `bg-brand-bold/[0.5]`), since each is this rule's alone. A margin with one is still [`ledger/no-margin`](no-margin.md)'s in a story, and a `dark:` class [`ledger/no-dark-variant`](no-dark-variant.md)'s.
- A line disable, an allowance or a bulk suppression of this rule waives the whole class at its site: a variable shorthand, or a palette colour with bracketed alpha (`max-w-(--dialog-width)`, `bg-red-500/[0.5]`), is reported by no other rule there.
- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `w-[${width}px]` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A value in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s, and a value in a stylesheet is not read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, or when each word is one it knows or one no data is spelt like and one at least is the latter (a bracketed value, a class with alpha or a Tailwind palette colour, on a utility Tailwind places: `export const width = "w-[240px]"`, but not the identifiers `"sp-800-53/5"` or `"items-[0]"`), and a module-level map only when most of its strings other than bare words are, so a string of other stock classes exported for another file passes (`"p-4 shadow-md"`), and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.

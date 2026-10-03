# ledger/no-unknown-variant

Reports a class whose variant Tailwind does not generate, so the class adds no CSS, and an `aria-` variant that names no ARIA attribute or a variant whose value is a CSS variable, so its selector never matches.

## Reports

- A variant Tailwind does not know: a misspelt or missing state (`hovr:bg-surface`, `focus-visble:outline-focused`, `grp-hover:flex`, `selected:bg-selected`, `group-expanded:rotate-90`), or a compound Tailwind does not build (`group-md:flex`, `group-not-hover:flex`, since `not-hover` is a media query as well as a selector). The message: `"hovr:bg-surface" uses "hovr", which is not a variant Tailwind knows, so it generates no CSS. Spell the variant "hover".` When the variant has no one spelling it meant, the message says to spell a state as Tailwind does, or to use a data- or aria- attribute the element sets. A variant another Ledger rule forbids (`dark`) is never the spelling it names.
- A `/name` on a variant that takes none (`hover/row:flex`, `data-open/x:flex`): a name follows only a `group-`, `peer-` or container variant. The message names the variant without it and, where a group takes the variant, the group's: `Write "hover", or "group-hover/row" for the group of that name.`
- A size that is not a breakpoint: a word that reads as a size where a breakpoint could stand, at the top or under `not-` (`tablet:flex`, `2xl:flex`, since the kit's reset clears Tailwind's own breakpoints, or `pannel:flex`, near a breakpoint's name), or a `max-` or `min-` value that is no breakpoint (`max-tablet:hidden`). A word reads as a size when it has a digit, is a t-shirt size (`xxl`) or a device (`tablet`, `desktop`), or is near the name of a breakpoint or a container size; any other unknown word, and any word inside `group-`, `peer-`, `in-` or `has-`, which never wrap a breakpoint, is a state. The message lists the container sizes first, since a screen inside Main or a panel keys its layout to its container, then the window breakpoints, both from the lint data: `In Main or a panel, use a container size: @3xs 16rem to @7xl 80rem, @compact 25rem and @split 50rem. Window breakpoints: sm 40rem, md 48rem, lg 64rem, aside 75rem, panel or xl 80rem and wide 110rem.`
- A container size that is none: `@8xl:flex`, `@max-3lx:hidden`. The message lists the sizes.
- An `aria-` variant whose name is no ARIA attribute (`aria-expaned:rotate-90`, `aria-[sortt=ascending]:text-default`, `group-aria-selectd/row:bg-selected`). Tailwind generates `[aria-expaned="true"]` for it, which no element sets. The message names the attribute and, when there is one it meant, its spelling.
- A CSS variable as the value of a selector or a feature query (`nth-(--n):bg-surface`, `supports-(--x):grid`). Tailwind writes it in as `:nth-child(var(--n))` or `@supports var(--x)`, where `var()` is never read, so the style never applies. The message asks for the value itself, such as `nth-3` or `supports-[display:grid]`.

Every variant in the chain is checked, compounds (`not-`, `group-`, `peer-`, `in-`, `has-`) through to the variant they wrap, against the grammar the token build asked Tailwind for (`src/generated/lint.json`): its static variants, its functional roots with the values, names, numbers, arbitrary values and CSS variables each takes and whether it takes a `/name`, the kit's breakpoints and container sizes, and the ARIA attribute names. The first variant at fault is the one the message names.

A variant a product declares in its own CSS (`@custom-variant theme-sepia (…)`) is not in that grammar. Name it in `settings.ledger.customVariants` (a name, or a list of names, as a class writes it before its colon), and the rule takes it as known, alone and inside a compound, in every file of the run; the other class rules then judge the class's base as they do under any variant.

A class has one owner, so it is reported once. A `dark:` class is [`ledger/no-dark-variant`](no-dark-variant.md)'s and a margin [`ledger/no-margin`](no-margin.md)'s, whatever variant they carry, since their fix takes the class away; any other class under an unknown variant is this rule's, before any rule that judges its base, since the class generates nothing whatever its base holds.

It reads classes wherever the class rules do: `className`, `class`, any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`), a slot map, a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge`, `classes`, `cx`, `twJoin`, `classNames`, `cva`, `tv` and the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`), a className callback, and what a class site reads in the same file, as [`ledger/no-non-token-class`](no-non-token-class.md)'s page describes.

## Why

Tailwind drops a candidate it cannot parse without a word: `hovr:bg-surface-raised-hovered` builds, ships and never changes the row on hover, and nothing in the build or the browser says so. A breakpoint Ledger does not have is the same silence, and a common one, since the kit's breakpoints are its own (`aside`, `panel` and `wide` beside `sm`, `md` and `lg`) and Tailwind's `2xl` is gone. A layout that follows the window is also the wrong key inside Main or a panel, whose width the navigation and the panel take from; the product contract keys such a layout to its container (`@split:`, `@compact:`). An `aria-` variant with a misspelt name does generate CSS, for an attribute no element sets, so the state it styles never shows.

## Instead

- A misspelt variant: the spelling the message names, or the editor suggestion that writes it.
- A layout inside Main, a panel or any part that fills a region: a container query on the container sizes (`@compact:`, `@split:`, `@md:`), with `@container` on the region; [Metrics](../../src/stories/tokens/Metrics.mdx) lists the sizes.
- A layout of the whole window: a breakpoint (`sm:`, `md:`, `lg:`, `aside:`, `panel:`, `wide:`), or its `max-` form.
- A state: the attribute the element sets (`aria-expanded:`, `aria-selected:`, `data-open:`), and a state of the element's own under `data-`.
- A state of a named group: the group's variant with the name (`group-hover/row:`), on an element inside `group/row`.
- A position or a feature: the value itself (`nth-3:`, `nth-[2n+1]:`, `supports-[display:grid]:`); a position known only at runtime is a `data-` attribute the element sets.

## Examples

### Reported

```tsx reported
export function QueueItem({ name }: { name: string }) {
  return <li className="bg-surface-raised hovr:bg-surface-raised-hovered">{name}</li>;
}
```

```tsx reported
export function Caption({ text }: { text: string }) {
  return <p className="font-body-small tablet:font-body">{text}</p>;
}
```

```tsx reported
export function Chevron({ open }: { open: boolean }) {
  return <span aria-expanded={open} className="transition-transform aria-expaned:rotate-90" />;
}
```

```tsx reported
export function Summary({ text }: { text: string }) {
  return <p className="font-body-small @8xl:font-body">{text}</p>;
}
```

### Allowed

```tsx allowed
export function QueueItem({ name }: { name: string }) {
  return <li className="bg-surface-raised hover:bg-surface-raised-hovered">{name}</li>;
}
```

```tsx allowed
export function Caption({ text }: { text: string }) {
  return <p className="font-body-small @split:font-body">{text}</p>;
}
```

```tsx allowed
export function Chevron({ open }: { open: boolean }) {
  return <span aria-expanded={open} className="transition-transform aria-expanded:rotate-90" />;
}
```

## Suggestions and fixes

An editor suggestion, never `--fix`, when every variant at fault has one spelling it meant: one edit away (a letter added, dropped, changed or two swapped), or a compound root two edits away around a variant written right (`grp-hover` is `group-hover`), or an ARIA name one edit away, two for a name of six letters or more. The suggestion writes the class with that spelling, the other variants, the base and the `!` as written, and only when the class so written passes every Ledger class rule, so `hovr:bg-surfce` gets the spelling in its message and no suggestion, and its base is [`ledger/no-non-token-class`](no-non-token-class.md)'s once the variant is right. Two spellings as near as each other give none, and so does a word nearest a breakpoint or as near to one as to a state (`wile` is one edit from `wide` and from `file`): a breakpoint or a container size is never respelled, and the message lists them with their values instead. A class written with an escape, an entity or in a template gets no suggestion.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. It has no entry for this rule, and neither has the application's list, `scripts/lint-allow.json`, whose `scripts/check-allow-lists.mjs` rejects a new one. The rule is an error in both presets and in the kit's stories. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- An arbitrary variant (`[&>svg]`, `[@media(hover:none)]`) is not judged, and neither is a value a functional variant takes by its shape: `data-opne` is a data attribute of that name, `supports-grid` a feature query and `nth-3` a position, and whether an arbitrary value or a name makes a valid selector (`data-[.x]`, `data-a.b`, which Tailwind drops) is not asked. Only an `aria-` name is checked, against ARIA's.
- A `/name` is not matched to a group, a peer or a container of that name: `group-hover/row` passes where no element is `group/row`.
- The grammar is Tailwind 4.3.3's over the kit's own CSS, as the token build asked it, and its ARIA names are aria-query 5.3's with the three ARIA 1.3 adds that it lacks (`aria-actions`, `aria-colindextext`, `aria-rowindextext`). On another Tailwind 4 release a variant may generate CSS the data does not describe.
- A variant a product declares is taken on its word: `settings.ledger.customVariants` is not checked against the product's CSS, and a declared name is known inside any compound, whether or not Tailwind builds that compound.
- A line disable, an allowance or a bulk suppression of this rule waives the whole class at its site, and turning the rule off waives every class under an unknown variant in the files it covers: whatever else such a class holds is reported by no other rule there, since this rule owns it before any rule that judges the base. Declare a product's own variants in `settings.ledger.customVariants` instead of turning the rule off.
- A margin is [`ledger/no-margin`](no-margin.md)'s under any variant, so where that rule is off (`primitives/bleed.tsx`, the one kit file that writes margins) or waived by a line disable, a margin under a variant Tailwind does not generate (`tablet:-mx-100`) is reported by no rule. Bleed writes no variant today.
- A class the lint cannot follow is not seen: one passed in through a prop, imported from another file, built at runtime or held in a variable changed other than by assigning it, as [`ledger/no-non-token-class`](no-non-token-class.md)'s page describes. A class in a stylesheet or in `@apply` is outside the lint.

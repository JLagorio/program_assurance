# ledger/no-margin

Reports a margin class: the space between siblings comes from Stack, Inline and Bleed, never from a margin.

## Reports

- A margin utility on any side, at any key: `mt-200`, `mx-100`, `ms-050`, `mb-4`.
- A negative margin, however it is spelt: `-mx-100`, `mx-negative-200`.
- The same class under a variant or with `!`: `md:mt-200`, `hover:!mb-100`.
- A margin at a stock key, an arbitrary value or a variable (`mt-4`, `mt-[13px]`, `-mx-(--gutter)`). A class has one owner, and every margin is this rule's alone, whatever else is wrong with it: moving the space to the parent takes the whole class away. A margin under `dark:` (`dark:mt-4`) is [`ledger/no-dark-variant`](no-dark-variant.md)'s, whose fix drops the class.

It reads every place the lint reads classes: `className`, `class` and any `*ClassName` attribute or object key (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map. There are two messages, a margin's and a negative margin's, below.

A margin of `auto` (`m-auto`, `mx-auto`, `ms-auto`) is not reported.

The finding names the parent's space at the margin's step: a Stack's for the block axis (`mt-`, `mb-`, `my-`), an Inline's for the inline axis (`mx-`, `ms-`, `me-`, `ml-`, `mr-`), and either for `m-`: `"mt-4" is a margin. Space between siblings belongs to their parent: a Stack with space="space.200".` A Ledger key is its token, and a stock step or an arbitrary length the step it equals or the one nearest it, which the finding says (`space="space.150" (nearest 13px)`); a variable is `space.…`. A negative margin is Bleed on its axis: `"-mx-100" is a negative margin. A child pulled out to its parent's edge is <Bleed inline="space.100">, at the parent's padding.` A negative length in brackets is one too (`mt-[-4px]` is `<Bleed block="space.050">`), at the step of its size. Bleed goes to `space.400`, its widest negative token, so a wider pull (`-mx-600`) names Bleed without a value and says a wider pull is the parent's layout.

## Why

A margin puts space on one child that belongs to its parent. It moves with the child when the child is reordered or reused, and it adds to the parent's own gap instead of replacing it, so two screens built from the same parts end up with different rhythm. In Ledger a component decides its inside and its parent decides the space around it: the space between siblings is one token on the Stack or Inline that holds them ([Primitives](../../src/stories/primitives/Primitives.mdx)). The one negative margin, which pulls a child out to the edge of its parent's padding, is Bleed's, by the padding's own token ([Bleed](../../src/stories/primitives/Bleed.mdx)).

## Instead

- Space between siblings: a Stack for a column or an Inline for a row, with `space` at the key the margin had. `mt-200` between two paragraphs is `<Stack space="space.200">`.
- Space before one group that differs from the rest: nest the group in its own Stack, or give its Box `paddingBlockStart`.
- A child that reaches the edge of its padded parent, such as a full-width rule in a card: `<Bleed inline="space.200">` with the parent's padding token.
- A block of fixed measure centred in its parent: `mx-auto`, which is allowed.

## Examples

### Reported

```tsx reported
import { Text } from "@ledger/design-system";

export function EvidenceNote() {
  return (
    <div>
      <Text>Three requirements have no evidence.</Text>
      <Text className="mt-200">Upload it before the assessment on Friday.</Text>
    </div>
  );
}
```

```tsx reported
import { Box, Separator, Text } from "@ledger/design-system";

export function ScopeCard() {
  return (
    <Box padding="space.200">
      <Text>Scope</Text>
      <Separator className="-mx-200" />
    </Box>
  );
}
```

```tsx reported
import { Heading } from "@ledger/design-system";

export const groupTitle = "mb-100 truncate";

export function GroupTitle({ children }: { children: string }) {
  return (
    <Heading size="xsmall" className={groupTitle}>
      {children}
    </Heading>
  );
}
```

### Allowed

```tsx allowed
import { Stack, Text } from "@ledger/design-system";

export function EvidenceNote() {
  return (
    <Stack space="space.200">
      <Text>Three requirements have no evidence.</Text>
      <Text>Upload it before the assessment on Friday.</Text>
    </Stack>
  );
}
```

```tsx allowed
import { Bleed, Box, Separator, Stack, Text } from "@ledger/design-system";

export function ScopeCard() {
  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Text>Scope</Text>
        <Bleed inline="space.200">
          <Separator />
        </Bleed>
      </Stack>
    </Box>
  );
}
```

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function Rationale({ children }: { children: string }) {
  return (
    <Box className="mx-auto max-w-layout-measure">
      <Text>{children}</Text>
    </Box>
  );
}
```

## Suggestions and fixes

Neither. The change is one of structure, deciding which parent owns the space, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The kit keeps its counts in `test/lint-allow.json`, and `configs.package` turns the rule off in `primitives/bleed.tsx`, the one place a negative margin is written. This repository's application passes no allowance for the rule, so every report there fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A class built at runtime is not one the lint can check. A template or a concatenation that glues a value to a word (`` `mt-${size}` ``, `"bg-" + tone`) leaves no fragment to report: [`ledger/no-non-token-class`](no-non-token-class.md) reports it once as a class built at runtime, and the whole classes beside it are still read.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, and a module-level map only when most of its strings other than bare words are, so a string of stock classes exported for another file passes, and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.
- `space-x-*` and `space-y-*` are not reported, though Tailwind writes them as margins on the children.
- Where the rule is off, no other rule reports a margin: in `primitives/bleed.tsx` a stock or arbitrary margin (`mt-4`, `mt-[13px]`) passes, since it is this rule's alone. A `dark:` margin there is still [`ledger/no-dark-variant`](no-dark-variant.md)'s.
- A line disable, an allowance or a bulk suppression of this rule waives the whole class at its site: a margin that is also a stock key, an arbitrary value or a variable (`my-2`, `-mx-[13px]`, `-ms-(--overlap)`) is reported by no other rule there. A `dark:` margin is not waived with it.
- A margin in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s, and a margin in a stylesheet is outside the lint.

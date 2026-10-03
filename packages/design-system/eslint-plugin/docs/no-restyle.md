# ledger/no-restyle

Reports a class on a kit part that changes what the part sets itself, and a class that styles the elements inside the one it is on.

## Reports

- A class in a part's `className` that changes something the part sets: a class in the same group as one the part puts on its element, or in a group that replaces it where `cn()` merges (`py-200` over a part's `pt-150`). What a part sets is read from the kit's source into `eslint-plugin/parts.json`: the classes its root always carries, in every state they name; the classes each value of a prop adds, in the states the prop names, a flag's and a given prop's only where the element writes it; and the classes it makes from several props, where one of those props is written or, with none written, those the build can tell it sets then (a default Alert's neutral fill, a default Badge's brand bold fill). A width, a media condition and a variant that always holds on the part are no state: `sm:`, `max-lg:`, `@3xl:`, `motion-safe:`, `not-print:`, `supports-[…]:`, `[&]:`, the part's own `data-[slot=…]:`, `enabled:` and a negated state (`not-hover:`) change what the prop sets as the bare class would. The finding names how the part sets it:
  - a prop whose value is this class and nothing else: `"tabular-nums" on <Text> is its numeric prop. Write numeric and drop the class.`, with an editor suggestion that writes the prop in the class's place;
  - a prop that sets the same thing: `"font-heading-overlay" on <Text> changes the type its size prop sets. Drop it; "font-heading-overlay" is Heading size="overlay".`;
  - the part itself: `"pt-200" on <TabsContent> changes the padding it sets itself (pt-150, components/tabs.tsx:125). Drop it; a different padding is a change to Tabs.`, quoting at most 48 characters of what it sets, the setting in the class's own states first;
  - a class under a width or a condition, or beside the prop it changes: `"sm:bg-danger-bold" on <Button> changes the background its variant prop sets. Drop it; a different background is a change to Button.`;
  - a class the part already sets, in the same states: `"rounded-large" on <Card> repeats what it sets itself (components/card.tsx:39). Drop it; it changes nothing.`
- A class outside a part's className contract, where the kit gives it one with an `@accepts` tag: the date and number fields, the search field and the search dialog take layout, and Id takes colour, type and `break-all`. `"pt-200" on <DatePicker> is outside what its className takes (layout). Drop it; anything else is a change to DatePicker.`
- A class on a kit part inside a table cell (a column's `cell` renderer, or a `Table.Cell` around it) that carries the type, weight or neutral colour `ledger/cell-plain` forbids on the cell: `"font-body-small" on <Stack> restyles the table cell it is drawn in. Cells are one style: drop "font-body-small".`
- A class whose variant styles the elements inside the one it is on, `*:`, `**:`, or an arbitrary variant that steps from `&` to a descendant or a child at depth 0, after a state or an attribute of the element too (`[&_button]:`, `[&>li]:`, `[&:hover_svg]:`, `[&[data-state=open]>svg]:`, `[:where(&)_svg]:`), where it reaches a kit part: the element itself when it is a kit part other than a layout primitive, whose inside is the kit's; a kit component written inside it (for `**:` and `_`) or among its children (for `*:` and `>`); or a part's own element the selector can name, with a class that is more than its placement. The finding names the part: `"[&_button]:bg-danger-bold" styles the elements inside the one it is on and reaches <Button>, a kit part this file does not own.`

One report per class, at the string it is written in. The part is the kit's, imported from `@ledger/design-system` by name, alias or namespace, or put in the element's place by a `render` prop, which then owns the classes (`the <Button> <DialogTrigger> renders`). A component of the file that hands its `className` on to a part puts the classes given to it on that part: `"pt-200" on <Pad>, which forwards className to <TabsContent>, changes the padding it sets itself (pt-150, components/tabs.tsx:125).` A component imported from another file is not followed.

## Why

A part owns what it sets itself. A class that changes it makes this screen's part differ from every other screen's, where nothing in the kit says so, and the next change to the part does not reach it. When the screen needs something the part does not offer, the part is what changes: the screen is the kit's first consumer, and a part that breaks on a screen is fixed in the kit, through `/ledger-add-part`.

What a part does not set (a border on a Stack, the dividers between a RadioGroup's choices) stays the caller's, and so does its placement: where it sits, how big it is and how it flows among its siblings, except where a prop sets nothing else, such as Button's `isFullWidth`; hiding a part, and placement at a breakpoint or a container size, are always the caller's. A part's interaction (pointer events, text selection, the cursor), transforms, text flow (wrapping, truncation, clamping) and overflow are how it behaves and looks, judged as its colour and type are: `truncate` on a Text is its `maxLines`, which also shows the cut words in a tooltip. An interaction state no prop sets (a hover, a focus, an aria or data state of the element or its group) is the caller's; a width, a media condition or a variant that always holds is no state, so a colour or a type under it changes what the part sets everywhere it holds.

A table cell is one style, `font.body` in the text colour: the content a column draws in a cell takes the cell's type, as the cell does (see [Table](../../src/stories/components/Table.mdx)).

A variant that reaches into the elements inside styles parts the screen does not own, with classes every token rule admits, so nothing else would see it.

## Instead

- Write the prop the finding names: `numeric`, `align="end"`, `isFullWidth`, `color="color.text.subtle"`, `maxLines={1}`.
- Drop a class that changes what the part sets itself. A different space, type or colour for that part everywhere is a change to the part; for one use, it is a prop the part does not have yet, which is also a change to the part.
- In a table cell, drop the type and the neutral colour. What differs in a cell is data: a status is a Badge, a severity an Indicator.
- Instead of reaching inside, set each part through its own props, or put the class on the part itself where the part leaves it to the caller.

## Examples

### Reported

```tsx reported
import { Inline, Text } from "@ledger/design-system";

export function PartLabel({ label, title }: { label: string; title: string }) {
  return (
    <Inline space="space.100">
      <Text color="color.text.subtle" className="shrink-0 tabular-nums">
        {label}
      </Text>
      <Text>{title}</Text>
    </Inline>
  );
}
```

```tsx reported
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ledger/design-system";

export function RecordTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line" aria-label="Record sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-200">
        Overview
      </TabsContent>
    </Tabs>
  );
}
```

```tsx reported
import { Stack, Truncate, defineColumns } from "@ledger/design-system";

type System = { id: string; baseline: string; source: string };

export const columns = defineColumns<System>((c) => [
  c.custom("baseline", {
    header: "Baseline",
    cell: (row) => (
      <Stack as="span" space="space.0" className="min-w-0 font-body-small">
        <Truncate>{row.baseline}</Truncate>
      </Stack>
    ),
  }),
]);
```

```tsx reported
import { Badge, Button, Inline, Text } from "@ledger/design-system";

export function Actions({ title }: { title: string }) {
  return (
    <Inline space="space.100" className="[&_button]:bg-danger-bold">
      <Button className="sm:bg-danger-bold">Discard</Button>
      <Badge className="bg-danger-bold">Overdue</Badge>
      <Text className="truncate">{title}</Text>
    </Inline>
  );
}
```

### Allowed

```tsx allowed
import { Inline, Text } from "@ledger/design-system";

export function PartLabel({ label, title }: { label: string; title: string }) {
  return (
    <Inline space="space.100">
      <Text color="color.text.subtle" numeric className="shrink-0">
        {label}
      </Text>
      <Text>{title}</Text>
    </Inline>
  );
}
```

```tsx allowed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ledger/design-system";

export function RecordTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line" aria-label="Record sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview</TabsContent>
    </Tabs>
  );
}
```

```tsx allowed
import { Box, Button, Grid, Stack, Text } from "@ledger/design-system";

export function Note({ text, names }: { text: string; names: string[] }) {
  return (
    <Stack space="space.100" className="min-w-0 max-w-layout-measure border-t border-default">
      <Text>{text}</Text>
      <Grid templateColumns="1fr 1fr" className="*:min-w-0">
        {names.map((name) => (
          <Box key={name} backgroundColor="elevation.surface" className="hover:bg-surface-hovered">
            <Button className="md:w-full">{name}</Button>
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}
```

```tsx allowed
import { Id, Section } from "@ledger/design-system";
import { useRef } from "react";

export function StepHeading({ step, code }: { step: string; code: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <Section>
      <Section.Header>
        <Section.Heading>
          <Section.Title ref={heading} tabIndex={-1} className="outline-none">
            {step} <Id className="text-subtle">{code}</Id>
          </Section.Title>
        </Section.Heading>
      </Section.Header>
    </Section>
  );
}
```

## Suggestions and fixes

An editor suggestion writes the prop in the class's place where that is certain: the prop's value puts this one class on the part and nothing else (no class the part makes from several props reads it), the class has no variant and is written once in a plain `className` string on the element itself, and the element neither sets that prop nor spreads props. The suggestion renders the same. Nothing runs under `--fix`: dropping a class changes what renders, which is the author's decision.

## Allowances

The rule is off in the package preset, so the kit keeps no allowance for it. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It runs on product code only, never on the kit's own source, where patterns compose components by design.
- A class another Ledger rule reports is that rule's alone: a class rule's (a margin, a palette colour, an unknown variant), the padding, gap, display and grid template `ledger/use-primitives` judges on a layout primitive, and the type and neutral colour `ledger/cell-plain` judges on a `Table.Cell`.
- A focus target (a literal `tabIndex={-1}`) may carry `outline-none`, `outline-hidden` and `outline-focused`. A class a part's `@accepts` contract takes passes, whatever the part sets.
- What a part sets is what the build could read in its source; where it stopped (`unread` in parts.json), the part may set more than the rule knows. What it makes from several props counts with none of them written only where the build can tell the value then: a default, a known test, a helper's `if`s and returns; a value it cannot follow counts only where one of the props is written. A prop with a value of its own counts as set whether or not the element writes it. A class in no category is not judged.
- The classes are read as the class rules read them: through a condition, a template, a helper, a same-file `const` or map, and a spread that sets `className`. One passed in through a prop, imported from another file or built at runtime is not seen (`ledger/readable-classes` reports it on a kit part).
- A class that styles the inside of an element is reported where a kit part is written inside it in the same file, or where the element is one; a part another component renders there, or `children` handed in, is not seen. A kit component's inside may hold any tag, so a tag selector (`[&_p]:`) that reaches one is reported even where the component draws no such tag; a layout or type primitive's own element is matched by the tag it renders. A variant that reaches a sibling (`[&+div]:`) is not judged.
- A cell is a `cell` renderer handed to a column builder (the parameter of the function `defineColumns` takes, or one typed `ColumnKinds`), or a `Table.Cell` or `Table.Tree` around the element. A renderer passed by name is not followed.

# ledger/use-primitives

Reports layout written as classes: on a plain element, where a primitive belongs, and on a primitive, where its props belong.

## Reports

- A plain `div`, `span`, `section`, `article`, `aside`, `header`, `footer`, `main`, `nav`, `ul`, `ol`, `li`, `form`, `fieldset`, `p`, `label` or `h1` to `h6` whose `className` has a display class (`flex`, `inline-flex`, `grid`, `inline-grid`) or a padding or gap class (`p-`, `px-`, `py-`, `pt-`, `pb-`, `ps-`, `pe-`, `gap-`), with no variant. The finding lists the layout classes and names, in one sentence, the part they make with its props and their token values: `<div> carries layout classes (flex, gap-100). Use <Inline space="space.100">.`
- A Box, Stack, Inline, Flex or Grid from the kit whose `className` sets what one of its props sets: padding, a gap, its display, or grid columns and rows. The finding lists the classes and says, in one sentence, what to write instead: `<Stack> carries layout classes (p-200, gap-100). Use space="space.100" and wrap it in <Box padding="space.200"> (a Stack has no padding).`
- The same through a component of the file that hands its `className` on to a primitive (`const Pane = (props) => <Stack {...props} />`), at each `<Pane className="…">`: `<Pane> forwards className to <Stack>, which then carries layout classes (pt-200). For the <Stack> inside <Pane>: wrap it in <Box paddingBlockStart="space.200"> (a Stack has no padding).` The props are the Stack's, which `Pane` need not take: give it one that hands them on, or change the Stack inside it.

The part and its props are computed from the classes:

- The part: a grid display or a grid template is a Grid, a flex display with `flex-col` a Stack and without it an Inline, a gap alone a Stack (an Inline for a column gap alone), and padding alone a Box. On a primitive that is already the part, a display it has already is dropped (`Drop flex (an Inline is already a flex row).`); a Box that lays out its children puts them in the part inside it.
- Padding: Box's `padding`, `paddingInline`, `paddingBlock` or one side (`paddingBlockStart` for `pt-`); on another primitive, a Box around it.
- A gap: `space` on Stack, `space` and `rowSpace` on Inline, `gap`, `columnGap` or `rowGap` on Flex and Grid.
- Grid columns and rows: Grid's `templateColumns`, one template per window breakpoint (`templateColumns={{ md: "repeat(3, minmax(0, 1fr))" }}`), and `templateRows`. It keys only `base`, `sm`, `md`, `lg` and `xl`, so a column class under any other variant (a Ledger breakpoint such as `aside:`, a state) names `templateColumns` and says so, with no object. A Stack's `space` is its row gap: a column gap on a Stack is dropped (`a Stack has no column gap`), and where a gap and an axis gap are both written, the axis gap sets its prop. A plain element's `gap-px` alone is on no space step, and the finding says to give a part a space token or draw the hairline with a border or a Separator.
- A value: a Ledger space key is its token (`gap-100` is `space="space.100"`); a stock step or an arbitrary length is the step it equals, or the one nearest it, which the finding says (`paddingInline="space.150" (nearest 13px)`); a value the lint cannot read is `space.…`.

On a primitive, a class under a container query (`@3xl:`) is not reported, nor a padding, gap or display class under any other variant (`md:px-300`, `hidden md:flex`), nor `gap-px`. Grid columns are not reported when any column or row class on the element is under a container query, since `templateColumns` follows the window and cannot say that. The part is recognised through an alias or a namespace import from the kit, and a local component, another package's part or a parameter that shares a primitive's name is not checked. An element whose `render` puts a primitive in its place (`<Slot render={<Stack />} className="pt-200">`) gives the primitive its classes, and the finding says so: `<Slot> renders <Stack>, which then carries layout classes (pt-200). Wrap it in <Box paddingBlockStart="space.200"> (a Stack has no padding).`

`configs.recommended` sets the rule to warn, and `configs.package` leaves it off. This repository's root `eslint.config.js` raises it to an error for the application's files.

## Why

A primitive's layout is its props: each one is typed to a token, so a wrong value is a type error, and one prop changes a layout everywhere it is used. The same layout written as classes on a `div` or over a primitive's props is invisible to both: it takes any value, and it overrides the part without the part knowing. A component decides its inside and its parent decides the space around it, so rows and columns are Stack and Inline first, and Flex and Grid only for what those cannot express ([Primitives](../../src/stories/primitives/Primitives.mdx)).

## Instead

The primitive for the layout, with its props in place of the classes: Stack, Inline, Box, Grid or Flex.

- A column: `<Stack space="space.200">`. A row: `<Inline space="space.100" alignBlock="center">`, with `shouldWrap` and `rowSpace` when it wraps, and `display="inline-flex"` beside text.
- Padding and a fill: `<Box padding="space.200" backgroundColor="elevation.surface.raised">`, or one side (`paddingBlockStart`).
- Columns: `<Grid templateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }} gap="space.200">`. A grid inside a panel takes one intrinsic template, such as `repeat(auto-fit, minmax(min(100%, 144px), 1fr))`, or column classes under a container query.
- What Stack and Inline cannot express: `<Flex direction="row" gap="space.100" wrap="wrap">`.
- A layout no primitive can express is a kit change, made through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
import { Badge, Text } from "@ledger/design-system";

export function ProgramTitle({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-100">
      <Text weight="semibold">{name}</Text>
      <Badge tone="warning">Draft</Badge>
    </div>
  );
}
```

```tsx reported
import { Stack, Text } from "@ledger/design-system";

export function Summary() {
  return (
    <Stack className="p-200 gap-100">
      <Text>Three requirements have no evidence.</Text>
      <Text>Upload it before the assessment on Friday.</Text>
    </Stack>
  );
}
```

```tsx reported
import { Grid, Text } from "@ledger/design-system";

export function BoardColumns() {
  return (
    <Grid className="grid-cols-3 gap-200">
      <Text>Open</Text>
      <Text>In review</Text>
      <Text>Done</Text>
    </Grid>
  );
}
```

```tsx reported
import { Stack, type StackProps } from "@ledger/design-system";

// A component of the file that hands its className on to a Stack.
const Pane = (props: StackProps) => <Stack {...props} />;

export function Notes() {
  return <Pane className="pt-200">Three requirements have no evidence.</Pane>;
}
```

### Allowed

```tsx allowed
import { Badge, Inline, Text } from "@ledger/design-system";

export function ProgramTitle({ name }: { name: string }) {
  return (
    <Inline space="space.100" alignBlock="center">
      <Text weight="semibold">{name}</Text>
      <Badge tone="warning">Draft</Badge>
    </Inline>
  );
}
```

```tsx allowed
import { Box, Stack, Text } from "@ledger/design-system";

export function Summary() {
  return (
    <Box padding="space.200">
      <Stack space="space.100">
        <Text>Three requirements have no evidence.</Text>
        <Text>Upload it before the assessment on Friday.</Text>
      </Stack>
    </Box>
  );
}
```

```tsx allowed
import { Grid, Text } from "@ledger/design-system";

export function BoardColumns() {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }} gap="space.200">
      <Text>Open</Text>
      <Text>In review</Text>
      <Text>Done</Text>
    </Grid>
  );
}
```

```tsx allowed
import { Box, Grid, Text } from "@ledger/design-system";

export function PanelColumns() {
  return (
    <Box className="@container">
      <Grid gap="space.200" className="grid-cols-1 @3xl:grid-cols-3">
        <Text>Open</Text>
        <Text>In review</Text>
        <Text>Done</Text>
      </Grid>
    </Box>
  );
}
```

## Suggestions and fixes

Neither. Moving a layout from classes to a primitive or its props changes the element, and sometimes adds one (a Box around a Stack for its padding), so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The rule is off in `configs.package`. This repository's `scripts/lint-allow.json` has no entry for it, so every report in the application fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It reads the classes that reach `className` as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last); a class passed in through a prop or imported from another file is not seen.
- A component that hands its `className` on to a primitive is followed within the file, through up to four such components, when its first parameter carries it: the props object or a rest that still holds it, spread onto the element, or `className` destructured (in the parameter, or from the props object at the top of its body) and written onto it. Of the elements a component hands it to, the first in source order counts, passing over one that renders a component already on the way (a tree that renders itself). A component imported from another file, one declared with `let`, one read from an object (`<parts.Row>`), a component past the fourth and a second element given the same prop are not followed.
- On a plain element, a class under a variant (`md:flex`, `md:p-200`) is not reported, nor the physical padding sides `pl-` and `pr-`, nor an element outside the list above, such as `button`, `dl` or `table`.
- On a primitive, only padding, gap, display and grid template classes are read; the other layout classes (alignment, position, size) are left to the part's props or to the classes as written.

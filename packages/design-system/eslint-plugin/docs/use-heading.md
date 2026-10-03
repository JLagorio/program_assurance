# ledger/use-heading

Reports a raw `h1` to `h6` that carries type classes, which copy a title's look by hand.

## Reports

- An `h1` to `h6` whose `className` carries a type class, under any variant: a type style (`font-heading-page`, `font-body`, `font-code`), a weight (`font-semibold`, `font-bold`), a size (`text-xl`, `text-[20px]`), a line height (`leading-tight`) or a tracking (`tracking-tight`). The finding lists the type classes and names the Heading size they match: `<h2> carries type classes ("font-heading-page"), which copy a title's look by hand. Write <Heading size="page" as="h2">, or the kit part that draws this title (PageHeader.Title, Section.Title, DialogTitle).`
- The size comes from the classes: `font-heading-page` is `page`, `font-heading-section` or `font-body` at `font-semibold` is `section`, `font-heading-overlay` is `overlay` and `font-heading-display` is `display`; the earlier steps name the size that replaced them (`font-heading-xsmall` is `overlay`, `font-heading-large` is `display`, `font-heading-medium` is `page`, and `font-heading-small` is `page` at `font-semibold`). Classes that match no size (`text-xl font-bold`) name the four sizes to choose from.
- An `h1` to `h6` in the `render` of a kit part that sets its own type, such as DialogTitle or Section.Title: `<h3> in DialogTitle's render carries type classes ("font-heading-overlay"), which change the type DialogTitle sets for its title. Render the bare element, render={<h3 />}, and let the part draw the type.`

A class that is not type passes: layout, colour, `sr-only`, and `outline-none` on a focus target. The classes are read as the class rules read them, through a condition, a template, a class helper, a same-file `const` or map, and a spread that sets `className`.

## Why

A title in the kit is one of four sizes, each the title of a part: `page` is PageHeader.Title's, `section` Section.Title's, `overlay` the title of a Dialog, Sheet, AlertDialog or Drawer, and `display` the one size above them. Those parts render a Heading, so a title set with Heading matches the screen it sits in and follows the ramp when it changes ([Heading](../../src/stories/primitives/Heading.mdx)). Type classes on a raw heading copy one of those looks, or invent a fifth, and drift from the ramp the next time it changes: the record title that is 22px on one screen and 20px on the next. The element is the page's outline, chosen by the page; the size is the design's, chosen by the title it matches.

## Instead

- A title the kit draws: `PageHeader.Title` for the page or record, `Section.Title` for a section, `DialogTitle` (or `SheetTitle`, `AlertDialogTitle`, `DrawerTitle`) for an overlay.
- Any other title: `<Heading size="page" as="h2">`, at the size it matches, with `as` for the level the outline needs.
- A part's title at another level: `render={<h3 />}`, bare; the part keeps its type.
- A heading that only the outline needs, such as a focus target or one read by a screen reader alone, carries no type classes: `<h2 tabIndex={-1} className="sr-only outline-none">`.

## Examples

### Reported

```tsx reported
export function RecordTitle({ name }: { name: string }) {
  return <h1 className="font-heading-page">{name}</h1>;
}
```

```tsx reported
import { Stack, Text } from "@ledger/design-system";

export function GroupTitle({ title, count }: { title: string; count: number }) {
  return (
    <Stack space="space.050">
      <h3 className="font-body font-semibold">{title}</h3>
      <Text>{count} records</Text>
    </Stack>
  );
}
```

```tsx reported
import { DialogTitle } from "@ledger/design-system";

export function RemoveTitle() {
  return (
    <DialogTitle render={<h2 className="font-heading-page" />}>Remove this allocation?</DialogTitle>
  );
}
```

### Allowed

```tsx allowed
import { Heading } from "@ledger/design-system";

export function RecordTitle({ name }: { name: string }) {
  return (
    <Heading size="page" as="h1">
      {name}
    </Heading>
  );
}
```

```tsx allowed
import { DialogTitle } from "@ledger/design-system";

export function RemoveTitle() {
  return <DialogTitle render={<h3 />}>Remove this allocation?</DialogTitle>;
}
```

```tsx allowed
export function StepHeading({ title }: { title: string }) {
  return (
    <h2 tabIndex={-1} className="sr-only outline-none">
      {title}
    </h2>
  );
}
```

## Suggestions and fixes

The rule offers no `--fix`: the element changes, and the size is a design decision the author confirms. It offers an editor suggestion where the `className` is one plain string and the file can name Heading (it imports the kit's Heading, the kit as a namespace, or other parts by name, to which the suggestion adds Heading), and the heading sets no `style`, which Heading does not take:

- A raw heading whose classes match a size becomes a Heading of that size and level, without its type classes and keeping the rest: `<h2 className="font-heading-page text-subtle">` becomes `<Heading size="page" as="h2" className="text-subtle">`.
- A heading in a part's `render` drops its type classes: `render={<h2 className="font-heading-page" />}` becomes `render={<h2 />}`.

Classes that match no size get no suggestion.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. It is in the recommended preset as an error and not in the package preset, since the kit's parts draw their titles from their own classes. Neither the kit's `test/lint-allow.json` nor the application's `scripts/lint-allow.json` has an entry for it. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It reads the elements by their tag, `h1` to `h6`; a component that renders a heading, or a heading created with `createElement`, is not checked.
- A class passed in through a prop, imported from another file or built at runtime is not seen.
- A heading in the `render` of a kit part that sets no type of its own, or of a component that is not the kit's, is read as a raw heading.
- A Heading with type classes is [`ledger/no-restyle`](no-restyle.md)'s, which reports a class that changes the type its `size` sets.

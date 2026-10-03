# ledger/id-not-blue

Reports an Id coloured `text-brand` with no link or button around it: an Id is blue only inside a link or a button.

## Reports

- An `Id` whose `className` holds `text-brand` and that has no `a`, `Link`, `TextLink`, `button` or `Button` element around it. The finding leads with the Id as written: `<Id> is blue (text-brand) with no link or button around it, and blue means link, so it reads as a link that goes nowhere. Drop text-brand, or make the Id the text of the TextLink that opens its record.`
- The same on an element whose `render` puts an `Id` in its place (`<Badge render={<Id />} className="text-brand">`): `<Badge> renders <Id> in blue (text-brand) with no link or button around it, and blue means link.` A link or a button that renders the Id is its link.
- The same through a component of the file that hands its `className` on to an `Id` (`function Code({ className }) { return <Id className={className} />; }`), when that Id has no link or button around it: `<Code> forwards className to <Id>, which is then blue (text-brand) with no link or button around it, and blue means link.`

The Id is the kit's, imported from `@ledger/design-system` by name, alias (`<Code>`) or namespace (`<L.Id>`). A `TextLink` or a `Button` around it counts when it is the kit's, by the same import; `a`, `Link` and `button` count by their tag.

One report per Id, on its `className`.

## Why

In Ledger, blue means link. An Id has no colour of its own: it takes the colour of wherever it sits, and it is in the link colour only because a TextLink is around it. A blue Id that nothing links reads as a link that does nothing. In a table, `Table.Id` turns the id to the brand colour on the row's hover and while its preview is open, so the colour keeps its meaning there too. See [Id](../../src/stories/components/Id.mdx) and [Table](../../src/stories/components/Table.mdx).

## Instead

- Drop `text-brand`, and when the id opens its record, make it the text of a TextLink: `<TextLink render={<Link … />}><Id>…</Id></TextLink>`. The link gives it its colour, hover and focus.
- An id that is only text takes the colour of its line, and `text-subtle` beside a name in a row.
- The row open in a preview is marked by `Table.Id` with `isActive`, not by colouring the id.

## Examples

### Reported

```tsx reported
import { Id, Inline, Text } from "@ledger/design-system";

export function ControlTitle({ code, name }: { code: string; name: string }) {
  return (
    <Inline space="space.100">
      <Id className="text-brand">{code}</Id>
      <Text>{name}</Text>
    </Inline>
  );
}
```

```tsx reported
import { Id } from "@ledger/design-system";

export function ControlCode({ code, selected }: { code: string; selected: boolean }) {
  return <Id className={selected ? "text-brand" : "text-subtle"}>{code}</Id>;
}
```

### Allowed

```tsx allowed
import { Id, TextLink } from "@ledger/design-system";
import { Link } from "@tanstack/react-router";

export function ControlLink({ code, controlId }: { code: string; controlId: string }) {
  return (
    <TextLink render={<Link to="/controls/$controlId" params={{ controlId }} />}>
      <Id>{code}</Id>
    </TextLink>
  );
}
```

```tsx allowed
import { Id, Inline, Text } from "@ledger/design-system";

export function ControlTitle({ code, name }: { code: string; name: string }) {
  return (
    <Inline space="space.100">
      <Id className="text-subtle">{code}</Id>
      <Text>{name}</Text>
    </Inline>
  );
}
```

```tsx allowed
import { Table } from "@ledger/design-system";

export function ControlIdCell({
  code,
  open,
  onPreview,
}: {
  code: string;
  open: boolean;
  onPreview: () => void;
}) {
  return <Table.Id id={code} rowHeader isActive={open} onPreview={onPreview} />;
}
```

## Suggestions and fixes

Neither. Whether the id should become a link or lose its colour is the author's decision.

## Allowances

The rule is off in the package preset, so the kit keeps no allowance for it. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It judges the kit's `Id` only: `Table.Id` and `Id.List` are not checked, and a local component, another package's part or a parameter named `Id` is not the kit's. A `Button` that is not the kit's is no button around it.
- Only `text-brand` as a class of its own in the Id's `className`, read as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last). `text-brand` at a breakpoint, in a state or with `!` counts; one that colours the elements inside the Id (`[&_span]:text-brand`) is [`ledger/no-restyle`](no-restyle.md)'s. One passed in through a prop, imported from another file or returned by a call the lint cannot follow, and one built at runtime are not seen.
- A component that hands its `className` on to an Id is followed within the file, through up to four such components, when its first parameter carries it: the props object or a rest that still holds it, spread onto the element, or `className` destructured (in the parameter, or from the props object at the top of its body) and written onto it. Of the elements a component hands it to, the first in source order counts, passing over one that renders a component already on the way (a tree that renders itself). A component imported from another file, one declared with `let`, one read from an object (`<parts.Row>`), a component past the fourth and a second element given the same prop are not followed.
- The link must be an element around the Id in the same JSX: an `a`, `Link` or `button`, the kit's Button, TextLink, LinkButton or LinkIconButton, or an element whose `render` puts one of those in its place (`<DialogTrigger render={<Button />}>`). An Id that another component places inside a link is reported, and so is one inside a NavLink or any other part that renders a link.
- It does not run on the kit's own source.

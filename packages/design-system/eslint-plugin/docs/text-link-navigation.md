# ledger/text-link-navigation

Reports a TextLink with no destination, or one that renders a button or a native element other than an anchor.

## Reports

- A `TextLink` with no `href`, no `render` and no prop spread, so it goes nowhere: `TextLink needs a destination: an href, or a router link in render. An action that reads as text is a Button.`
- A `TextLink` whose `render` is a native element other than `<a>` (`<button>`, `<span>`), or a kit `Button` or `IconButton`: `TextLink must render an anchor or a router link. Use Button for an action.`

A custom component in `render`, such as a router `Link` or an application's record link, is accepted. `TextLink`, `Button` and `IconButton` are followed through an alias or a namespace import from `@ledger/design-system`.

## Why

A TextLink is read and announced as a link, so it has to take the reader somewhere: it can be opened in a new tab, copied and followed with Enter, and the browser shows where it goes. Rendering it as a button, or giving it only an `onClick`, keeps the link's look and loses all of that, and a screen reader announces a link that does not navigate. An action that should read as text is a Button with `variant="link"`. The product patterns say buttons act and links navigate ([product patterns](../../../../docs/guides/product-patterns.md#registers)); the TextLink page shows the router composition ([TextLink](../../src/stories/components/TextLink.mdx)).

## Instead

An `href`, or a router link in `render`: `<TextLink render={<Link to="/programs/$programId" params={{ programId }} />}>`. An action that reads as text is `<Button variant="link" onClick={…}>`.

## Examples

### Reported

```tsx reported
import { TextLink } from "@ledger/design-system";

export function PreviewLink({ onPreview }: { onPreview: () => void }) {
  return <TextLink onClick={onPreview}>Preview</TextLink>;
}
```

```tsx reported
import { TextLink } from "@ledger/design-system";

export function OpenEvidence({ open }: { open: () => void }) {
  return <TextLink render={<button type="button" onClick={open} />}>Open evidence</TextLink>;
}
```

```tsx reported
import { Button, TextLink } from "@ledger/design-system";

export function ShowHistory({ show }: { show: () => void }) {
  return <TextLink render={<Button variant="subtle" onClick={show} />}>Show history</TextLink>;
}
```

### Allowed

```tsx allowed
import { TextLink } from "@ledger/design-system";

export function Guidance() {
  return (
    <TextLink href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final">NIST SP 800-53</TextLink>
  );
}
```

```tsx allowed
import { Link } from "@tanstack/react-router";
import { TextLink } from "@ledger/design-system";

export function ProgramName({ programId, name }: { programId: string; name: string }) {
  return (
    <TextLink render={<Link to="/programs/$programId" params={{ programId }} />}>{name}</TextLink>
  );
}
```

```tsx allowed
import { Button } from "@ledger/design-system";

export function PreviewAction({ onPreview }: { onPreview: () => void }) {
  return (
    <Button variant="link" onClick={onPreview}>
      Preview
    </Button>
  );
}
```

## Suggestions and fixes

Neither. Whether the element should navigate or act is the author's call, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in `configs.recommended` and not in `configs.package`. This repository's `scripts/lint-allow.json` has no entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A `render` element that is a custom component is accepted without being read; whether it forwards the props and the ref to an anchor is checked in the browser, not by the lint.
- A `TextLink` with a prop spread and no `href` or `render` passes, since the spread may carry one.
- A `render` function (`render={(props) => …}`) is not read.
- A TextLink and the part in its `render` are known by what their tags are bound to: the kit's, by name, alias or namespace (inside the kit, by a relative import), another package's by the name it imports (an alias or a namespace resolved), and a local component by the name it is written with, since any part of that name has the same defect. A type of the same name (a type parameter, a local type or interface) hides nothing. A parameter, or a local that shadows an outer name, is no part and is skipped.

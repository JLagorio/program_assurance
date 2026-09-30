# ledger/prefer-text-link

Reports a link that imitates TextLink by hand, and a link that opens a new tab without saying so.

## Reports

- An `a`, `Link` or `NavLink` whose `className` carries `text-brand` or `hover:underline`: `<a> carries the text-link classes. Compose it with TextLink render and drop text-brand and hover:underline.`
- An `a`, `Link` or `NavLink` with `target="_blank"` that no element holds in a prop: `<a target="_blank"> opens a new tab without saying so. Use TextLink newTab (render={<a … />} for a router link).`
- A TextLink with `target="_blank"` and no `newTab`: `target="_blank" on <TextLink> opens a new tab without saying so. Use newTab, which sets rel and says "(opens in a new tab)", and drop target and rel.`
- A link with `target="_blank"` in a TextLink's `render`, also through a condition or a fallback, when the TextLink has no `newTab`: `target="_blank" on <a> in a TextLink's render opens a new tab the TextLink does not announce. Give the TextLink newTab, which sets rel and says "(opens in a new tab)", and drop target.`
- A `Button` with `variant="link"` and `asChild`: `<Button variant="link" asChild> wraps a link in a Button styled as text. A link that reads as text is TextLink (render={<Link … />} for a router link); variant="link" is for an action.`

TextLink and Button are the kit's, recognised through a name, an alias or a namespace import from the kit, and inside the kit through a relative import of the part. In this repository the root `eslint.config.js` passes the rule a `note`, so each finding also names the application's record link.

## Why

TextLink is navigation that reads as text, and the kit owns everything that makes it one: the brand colour, the underline (at rest inside a sentence, on hover when it stands alone), the focus outline and the hit area on a touch screen. Classes copied onto an anchor reproduce one of those states and drift from the rest. A link that opens a new tab moves the reader without warning unless it says so; `newTab` sets `rel`, adds the external-link icon and reads "(opens in a new tab)" after the name ([TextLink](../../src/stories/components/TextLink.mdx)). In the application a record's name is a TextLink to its record page ([product pattern contract](../../../../docs/guides/product-patterns.md#registers)).

## Instead

- A link that reads as text: `<TextLink href="…">`, or `<TextLink render={<Link to="…" />}>` for a router link. Give it no colour or underline class.
- A link that opens a new tab: `newTab` on the TextLink, and no `target` or `rel` on it or on its `render` element.
- An action that reads as text: `<Button variant="link" onClick={…}>`.
- In this application, a record's name: `RecordLink` in `src/components/prototype/record-preview.tsx`, which composes TextLink.

## Examples

### Reported

```tsx reported
export function ProgramsLink() {
  return (
    <a href="/programs" className="text-brand hover:underline">
      Programs
    </a>
  );
}
```

```tsx reported
export function CatalogLink() {
  return (
    <a href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" target="_blank" rel="noreferrer">
      NIST SP 800-53
    </a>
  );
}
```

```tsx reported
import { TextLink } from "@ledger/design-system";

export function CatalogLink() {
  return (
    <TextLink
      href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"
      target="_blank"
      rel="noreferrer"
    >
      NIST SP 800-53
    </TextLink>
  );
}
```

```tsx reported
import { Link } from "@tanstack/react-router";
import { TextLink } from "@ledger/design-system";

export function ProgramsLink() {
  return <TextLink render={<Link to="/programs" target="_blank" />}>Programs</TextLink>;
}
```

### Allowed

```tsx allowed
import { Link } from "@tanstack/react-router";
import { TextLink } from "@ledger/design-system";

export function ProgramsLink() {
  return <TextLink render={<Link to="/programs" />}>Programs</TextLink>;
}
```

```tsx allowed
import { TextLink } from "@ledger/design-system";

export function CatalogLink() {
  return (
    <TextLink href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" newTab>
      NIST SP 800-53
    </TextLink>
  );
}
```

```tsx allowed
import { Button } from "@ledger/design-system";

export function ShowAll({ onShowAll }: { onShowAll: () => void }) {
  return (
    <Button variant="link" onClick={onShowAll}>
      Show all
    </Button>
  );
}
```

## Suggestions and fixes

Neither. Moving a link into TextLink changes the element and its props, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The kit keeps its counts in `test/lint-allow.json`, and this repository's root config reads the application's from `scripts/lint-allow.json`, where they hold the sites that predate the rule's reach onto new-tab links. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It knows the links by their tag, `a`, `Link` and `NavLink`; a router link under another name is not checked. A TextLink or a Button that is not the kit's (a local component, another package's part, a parameter, a story's own component in the kit) is not checked.
- It reads `target` only when it is the string `"_blank"`, so a target held in a variable or passed in through a spread is not seen. A link's classes are read as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last); one passed in through a prop or imported from another file is not.
- A link that another part holds in a prop (`render`, `openLink`) is that part's to announce, so it is reported only in a TextLink's `render`.
- The text-link classes are `text-brand` and `hover:underline`; other classes that imitate a link, such as `underline` alone, are not reported.

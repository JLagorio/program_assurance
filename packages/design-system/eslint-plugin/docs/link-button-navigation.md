# ledger/link-button-navigation

Reports a Button or IconButton that renders a link, or whose `onClick` does nothing but navigate.

## Reports

- A `Button` or `IconButton` whose `render` is a link: an `<a>`, a `Link` or `NavLink` (also as a member, `Router.Link`), or any element with `href` or `to`. A render function counts by the element it returns. The message names the element: `Button renders a link (<Link>). Use LinkButton with render={<Link … />}: Base UI's Button expects a native button, and a link must stay a link.`
- A `Button` or `IconButton` whose `onClick` handler is one navigation and nothing else: `navigate(…)`, `router.navigate(…)`, `location.assign(…)` or `location.replace(…)`, `history.push(…)`, or an assignment to `location` or `location.href`, also behind `void` or `await`, and also when the handler is a `const` in the same file. The message: `Button navigates from onClick. Use LinkButton with the router Link in render, so the destination can be opened in a new tab, copied and announced as a link.`
- Either one through a component of the file that hands `render` or `onClick` on to a Button or IconButton (`const Go = (props) => <Button {...props} />`): `<Go> forwards render to <Button>, which then renders a link (<Link>).` and `<Go> forwards onClick to <Button>, which then navigates.`, each with the same advice.

For an `IconButton` both messages name `LinkIconButton`. An element is reported once: a link in `render` is reported before its `onClick` is read. The names are followed through an alias or a namespace import (`import { Button as Action }`, `<Kit.Button>`).

## Why

A destination that looks like a button is still a link. As a link it can be opened in a new tab, copied, middle-clicked, and announced as a link by a screen reader, and the browser shows where it goes. A Button that navigates from `onClick` gives all of that up, and a Button that renders a router Link breaks Base UI's Button, which expects a native button. Ledger's LinkButton is the button's look on a real link. The product patterns' Forms and confirmations section says navigation styled as a button is a LinkButton or LinkIconButton ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)), and the LinkButton page shows the router composition ([LinkButton](../../src/stories/components/LinkButton.mdx)).

## Instead

`LinkButton` with the router's link in `render`, or `LinkIconButton` for the icon-only form. `<LinkButton render={<Link to="/programs/new" />}>Create program</LinkButton>`; a LinkIconButton takes its `label` and `icon`. Keep `Button` for an action that happens on the page.

## Examples

### Reported

```tsx reported
import { Link } from "@tanstack/react-router";
import { Button } from "@ledger/design-system";

export function CreateProgram() {
  return (
    <Button variant="primary" render={<Link to="/programs/new" />}>
      Create program
    </Button>
  );
}
```

```tsx reported
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@ledger/design-system";

export function ViewRequirements({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const open = () => navigate({ to: "/programs/$programId", params: { programId } });
  return <Button onClick={open}>View requirements</Button>;
}
```

```tsx reported
import { Download } from "lucide-react";
import { IconButton } from "@ledger/design-system";

export function DownloadExport({ href }: { href: string }) {
  return (
    <IconButton
      label="Download the export"
      icon={<Download />}
      onClick={() => window.location.assign(href)}
    />
  );
}
```

### Allowed

```tsx allowed
import { Link } from "@tanstack/react-router";
import { LinkButton } from "@ledger/design-system";

export function CreateProgram() {
  return (
    <LinkButton variant="primary" render={<Link to="/programs/new" />}>
      Create program
    </LinkButton>
  );
}
```

```tsx allowed
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { LinkIconButton } from "@ledger/design-system";

export function OpenRecord({ programId }: { programId: string }) {
  return (
    <LinkIconButton
      label="Open the program in a new tab"
      icon={<ExternalLink />}
      render={<Link to="/programs/$programId" params={{ programId }} target="_blank" />}
    />
  );
}
```

```tsx allowed
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@ledger/design-system";

export function CreateTask({ save }: { save: () => Promise<string> }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="primary"
      onClick={async () => {
        const taskId = await save();
        await navigate({ to: "/tasks/$taskId", params: { taskId } });
      }}
    >
      Create task
    </Button>
  );
}
```

## Suggestions and fixes

Neither. The change swaps the part and moves the destination from a handler into `render`, which the rule cannot write safely, so it offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets; `configs.package` turns it off in the kit's stories, where a Don't story shows the mistake on purpose. Neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A handler that does anything besides the navigation, even logging first, is not reported: it may be an action that ends on another page, as a save does.
- A handler passed in as a prop or imported from another file is not read (`onClick={onOpen}` where `onOpen` is a prop).
- Other ways of leaving the page, such as `window.open(…)`, `router.push(…)` on a router object or a `redirect()`, are not recognised.
- A `render` element that is a custom component with neither `href` nor `to` (`render={<RecordLink record={record} />}`) is not recognised as a link.
- The Button or IconButton is known by what its tag is bound to: the kit's, by name, alias or namespace (inside the kit, by a relative import), another package's by the name it imports (an alias or a namespace resolved), and a local component by the name it is written with, since any part of that name has the same defect. A type of the same name (a type parameter, a local type or interface) hides nothing. A parameter, or a local that shadows an outer name, is no part and is skipped.
- A component that hands `render` or `onClick` on to a Button is followed within the file, through up to four such components, when its first parameter carries it: the props object or a rest that still holds it, spread onto the element, or the prop destructured (in the parameter, or from the props object at the top of its body) and written onto it. Of the elements a component hands it to, the first in source order counts, passing over one that renders a component already on the way (a tree that renders itself). A component imported from another file, one declared with `let`, one read from an object (`<parts.Row>`), a component past the fourth and a second element given the same prop are not followed.

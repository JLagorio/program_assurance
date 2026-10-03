# ledger/no-deprecated-name

Reports a kit part, prop or value that was renamed or removed, with its replacement; one-to-one renames are fixed.

## Reports

- A renamed part written as JSX (`<Shell.Sidebar>`, `<Shell.NavItem>`, `<Tiles>`, `<Collapsible.Group>`), matched by its name after an alias or a namespace import from the kit, or from a module whose path ends in `/shell`, is resolved. It names the replacement, and says what else changes where the move is more than a new name ("with Header, Body and Footer; the brand moves to Shell.TopNav.Start").
- A renamed part used as a value outside JSX (`const Nav = Shell.Sidebar`). It names the replacement and says what else changes, as the JSX report does, and is never fixed.
- The import of a removed layout part, with what replaces it: `IndexPage` (a PageHeader over a DataTable with `fill`), `ShowPage` (PageHeader, Section and Shell.Aside), `RecordHeader` (PageHeader), `PreviewRail` (Shell.Aside), `PreviewSplit` and the standalone `Panel` (Shell.Panel) and `Block` (Section); or of a retired hook, script or helper (`useDensity`, `densityScript`, `controlBase`). Each is reported at the import: a hook or a script is never JSX, and a removed part may share its name with a local component.
- A deprecated part still exported for one version, where the kit's is used: `ActionBar` is a PageHeader, with the trail in PageHeader.Lead, the verbs in PageHeader.Actions and the state in the Details rail (Shell.Aside), and a blocked action a Button with `disabledReason`. A product's own component of the same name is not reported.
- A renamed prop value on a kit part: `size="sm"` on Switch, SelectTrigger, Card, Toggle, ToggleGroup, ToggleGroupItem or InputGroupButton is `size="small"` (and `default` is `medium`, `lg` is `large`, InputGroupButton's `xs` is `xsmall`), `variant="destructive"` on DropdownMenuItem is `variant="danger"`, and Heading's sizes are the titles the kit draws: `size="large"` is `display`, `medium` is `page` (20/26, the page title's size, where `medium` drew 22/28) and `xsmall` is `overlay`.
- A prop renamed with its values: `size="sm"` on AlertDialogContent is `width="xsmall"`, and `size="default"` is `width="small"`. A value it cannot read (`size={size}`) names the new prop alone.
- A renamed prop on a kit part: `expanded` on Tree.Item is `isExpanded`, `open` on Table.Group is `expanded`, `name` on Chart.Donut is `label` and `name` on Chart.Scatter is `nameKey`, `role` on Shell.Profile is `description` (the person's job title, never an ARIA role), `onChange` on Editable.Text and Editable.Select is `onValueChange`, and a prop that moved with its part's rename, such as `label` on Shell.SideNav.Section, which is `heading`.
- A prop whose meaning moved, where the old meaning is certain: a Chart.Donut `label` that draws the middle is `centerLabel`, since `label` names the ring as it does on every plot. It is read as the middle beside `name`, or when it is a number, a figure written as text (`"75%"`, `` `${n}%` ``) or an element, and never beside `centerLabel`; any other string is the ring's name and passes.
- A number of pixels where the prop takes a named step: KeyValue's and KeyValue.Group's `labelWidth={88}` is `labelWidth="narrow"`; up to 96 is `narrow`, under 132 the default, from 132 `wide`, and the finding adds that a group in a page body takes `labelWidth="auto"`. A number under a condition or a fallback (`long ? 160 : undefined`) is reported where it is written.
- A prop or a value with no one-to-one replacement, with what to do instead: `baseline` on Chart.Area, since an Area always starts at zero; `onToggle` on Table.Group, Table.Tree, Table.Disclosure and Tree.Item, which is `onExpandedChange`, called with the next state; InputGroupButton's `size="icon-xs"` and `size="icon-sm"`, an icon-only button that takes `size`, `icon` and a `label`; Heading's `size="small"`, which was both a page title and a section's, so a page or record title is `size="page"` (with `as="h2"` to stay an h2) and a section's title `size="section"`; and Inspector's `groups`, whose groups are composed as `Inspector.Group` children.

The renames live in two maps in `eslint-plugin/deprecations.js`, `deprecatedNames` for parts and `deprecatedAttributes` for props and values; a part's named export (`ChartDonut`, `ItemGroup`, `KeyValueGroup`) shares its compound's prop renames.

## Why

A rename ships with an `@deprecated` alias for one version, and with a fix in this rule where it is one to one, and the old name then goes; a removed page shape is already gone. Each report is a site that stops compiling when the alias is removed, so this rule is the migration list for an upgrade. See Versioning and publishing in the [component library guide](../../../../docs/guides/component-library.md) and the [changelog](../../CHANGELOG.md), whose entry for each rename names the story that shows the new part.

## Instead

- The replacement the report names, following its note where it has one; `--fix` writes the one-to-one renames.
- For example, `Shell.SideNav.Item` for `Shell.NavItem`, `Stat.Grid` for `Tiles`, `size="small"` for `size="sm"`, `isExpanded` for `expanded`, `labelWidth="wide"` for `labelWidth={160}`, `centerLabel` for a Donut's middle.
- A register is a PageHeader over a DataTable with `fill`; a record page is PageHeader, Section bodies and the Details rail in Shell.Aside.
- Density is a table's own: Table `density`, or Compact rows in a DataTable's Columns menu.

## Examples

### Reported

```tsx reported
import { Shell } from "@ledger/design-system";

export function WorkNav() {
  return (
    <Shell.Sidebar>
      <Shell.NavGroup label="Work">
        <Shell.NavItem render={<a href="/tasks" />}>My work</Shell.NavItem>
      </Shell.NavGroup>
    </Shell.Sidebar>
  );
}
```

```tsx reported
import { Switch } from "@ledger/design-system";

export function NotifyOwners({ on }: { on: boolean }) {
  return <Switch size="sm" checked={on} aria-label="Notify owners" />;
}
```

```tsx reported
import { AlertDialogContent, AlertDialogTitle } from "@ledger/design-system";

export function RemoveAllocation() {
  return (
    <AlertDialogContent size="sm">
      <AlertDialogTitle>Remove this allocation?</AlertDialogTitle>
    </AlertDialogContent>
  );
}
```

```tsx reported
import { ShowPage } from "@ledger/design-system";

export function RiskRecord() {
  return <ShowPage />;
}
```

### Allowed

```tsx allowed
import { Shell } from "@ledger/design-system";

export function WorkNav() {
  return (
    <Shell.SideNav>
      <Shell.SideNav.Body>
        <Shell.SideNav.Section heading="Work">
          <Shell.SideNav.Item render={<a href="/tasks" />}>My work</Shell.SideNav.Item>
        </Shell.SideNav.Section>
      </Shell.SideNav.Body>
    </Shell.SideNav>
  );
}
```

```tsx allowed
import { Switch } from "@ledger/design-system";

export function NotifyOwners({ on }: { on: boolean }) {
  return <Switch size="small" checked={on} aria-label="Notify owners" />;
}
```

```tsx allowed
import { Stat } from "@ledger/design-system";

export function RiskBand({ open, high }: { open: number; high: number }) {
  return (
    <Stat.Grid frame="band" aria-label="Risks">
      <Stat.Tile label="Open risks" value={open} note={`${high} high or critical`} />
    </Stat.Grid>
  );
}
```

## Suggestions and fixes

`--fix` applies the renames that are one to one:

- A part renamed under the same root: `Shell.NavItem` becomes `Shell.SideNav.Item`, the closing tag with it, and a prop that moved with the part is renamed too (`label` becomes `heading` on `Shell.SideNav.Section`). An alias or a namespace prefix is kept: `DsShell.NavItem` becomes `DsShell.SideNav.Item`, `Kit.Shell.NavItem` becomes `Kit.Shell.SideNav.Item`.
- A renamed prop (`expanded` becomes `isExpanded`) and a renamed literal value, in its own quotes (`size='sm'` becomes `size='small'`).
- A Donut's `label` that draws the middle becomes `centerLabel`, and its `name` becomes `label` once the `label` is gone, on the next pass: `<Chart.Donut label="64%" name="Coverage" />` becomes `<Chart.Donut centerLabel="64%" label="Coverage" />`.
- A label width in pixels becomes its step, as a string where the number was the whole value (`labelWidth={88}` becomes `labelWidth="narrow"`) and in place where it was a branch (`{long ? "wide" : undefined}`).
- A prop renamed with its values, in one fix: `<AlertDialogContent size="sm">` becomes `<AlertDialogContent width="xsmall">`.

It offers no fix, and reports only:

- when the move is more than a new name (`Shell.Sidebar`, `Tiles`, `Collapsible.Group`, `ActionBar`), for a removed or retired import, for a prop or a value with only a note, and for a part used as a value;
- for a prop renamed with its values whose value is not a literal (`size={size}`), which may need its new spelling too;
- when the tag's root is not the kit's import where it is written: a local object, another package's part, or a parameter or variable that shadows the import;
- for a prop whose new name the element already sets. The tag is still renamed, and the old prop stays, reported on the new part until one of the two is removed. The same holds for a prop renamed with its values: `<AlertDialogContent size="sm" width="medium">` keeps both until one goes.

It offers no editor suggestions.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- A part's tag is matched by what it is bound to: the kit's name through an alias or a namespace (three levels deep too, `Kit.Shell.SideNav.Section`), another package's by the name it imports, and a local object by its name, so another package's part or a local object that shares a renamed name (`Shell.NavItem`) is reported too, though never fixed. A type of the same name hides nothing. A parameter, or a local that shadows the kit's import, is no part and is neither reported nor fixed.
- Prop and value renames are read only on parts imported from `@ledger/design-system`, by name, alias or namespace, and in the kit's own source on parts it imports by a relative path, where a part that composes another passes the new names (DataTable's pagination hands SelectTrigger `size="small"`). The kit's stories are not read for them: a story shows the old prop beside the new while the part still takes it.
- Only a literal value is read: `size={size}`, a value in a constant and a prop in a spread (`{...props}`) are not seen, except that a prop renamed with its values (AlertDialogContent's `size`) is reported by its name whatever its value. A label width or a Donut `label` the rule cannot read (`labelWidth={width}`, `label={title}`, a template of words) may already be the new spelling, so it is left alone.
- A renamed part reached by destructuring (`const { Sidebar } = Shell`) is not seen.
- A deprecated token's class is [`ledger/no-deprecated-token`](no-deprecated-token.md)'s.

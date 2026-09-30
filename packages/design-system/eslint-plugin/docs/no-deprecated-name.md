# ledger/no-deprecated-name

Reports a kit part, prop or value that was renamed or removed, with its replacement; one-to-one renames are fixed.

## Reports

- A renamed part written as JSX (`<Shell.Sidebar>`, `<Shell.NavItem>`, `<Tiles>`, `<Collapsible.Group>`), matched by its name after an alias or a namespace import from the kit, or from a module whose path ends in `/shell`, is resolved. It names the replacement, and says what else changes where the move is more than a new name ("with Header, Body and Footer; the brand moves to Shell.TopNav.Start").
- A renamed part used as a value outside JSX (`const Nav = Shell.Sidebar`). It names the replacement and says what else changes, as the JSX report does, and is never fixed.
- The import of a removed page shape (`ShowPage`, `IndexPage`, `RecordHeader`) or of a retired hook, script or helper (`useDensity`, `densityScript`, `controlBase`), reported at the import: a hook or a script is never JSX, and a removed part may share its name with a local component.
- A renamed prop value on a kit part: `size="sm"` on Switch, SelectTrigger or Card is `size="small"`, and `variant="destructive"` on DropdownMenuItem is `variant="danger"`.
- A renamed prop on a kit part: `expanded` on Tree.Item is `isExpanded`, `label` on Chart.Donut is `centerLabel`, and a prop that moved with its part's rename, such as `label` on Shell.SideNav.Section, which is `heading`.
- A prop with no one-to-one replacement, with what to do instead: `baseline` on Chart.Area, since an Area always starts at zero.

The renames live in two maps in `eslint-plugin/index.js`, `deprecatedNames` for parts and `deprecatedAttributes` for props and values; a part's named export (`ChartDonut`, `ItemGroup`) shares its compound's prop renames.

## Why

A rename ships with an `@deprecated` alias for one version, and with a fix in this rule where it is one to one, and the old name then goes; a removed page shape is already gone. Each report is a site that stops compiling when the alias is removed, so this rule is the migration list for an upgrade. See Versioning and publishing in the [component library guide](../../../../docs/guides/component-library.md) and the [changelog](../../CHANGELOG.md), whose entry for each rename names the story that shows the new part.

## Instead

- The replacement the report names, following its note where it has one; `--fix` writes the one-to-one renames.
- For example, `Shell.SideNav.Item` for `Shell.NavItem`, `Stat.Grid` for `Tiles`, `size="small"` for `size="sm"`, `isExpanded` for `expanded`.
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

It offers no fix, and reports only:

- when the move is more than a new name (`Shell.Sidebar`, `Tiles`, `Collapsible.Group`), for a removed or retired import, for a prop with only a note, and for a part used as a value;
- when the tag's root is not the kit's import where it is written: a local object, another package's part, or a parameter or variable that shadows the import;
- for a prop whose new name the element already sets. The tag is still renamed, and the old prop stays, reported on the new part until one of the two is removed.

It offers no editor suggestions.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- A part's tag is matched by what it is bound to: the kit's name through an alias or a namespace (three levels deep too, `Kit.Shell.SideNav.Section`), another package's by the name it imports, and a local object by its name, so another package's part or a local object that shares a renamed name (`Shell.NavItem`) is reported too, though never fixed. A type of the same name hides nothing. A parameter, or a local that shadows the kit's import, is no part and is neither reported nor fixed.
- Prop and value renames are read only on parts imported from `@ledger/design-system`, by name, alias or namespace, and in the kit's own source on parts it imports by a relative path, where a part that composes another passes the new names (DataTable's pagination hands SelectTrigger `size="small"`). The kit's stories are not read for them: a story shows the old prop beside the new while the part still takes it.
- Only a literal value is read: `size={size}`, a value in a constant and a prop in a spread (`{...props}`) are not seen.
- A renamed part reached by destructuring (`const { Sidebar } = Shell`) is not seen.
- A deprecated token's class is [`ledger/no-deprecated-token`](no-deprecated-token.md)'s.

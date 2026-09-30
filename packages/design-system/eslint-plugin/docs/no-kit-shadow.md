# ledger/no-kit-shadow

Reports a component that product code declares under the name of a kit part, or under an old name for one, instead of importing the part.

## Reports

A component declared at the top of a module, exported or not: a function or class declaration, a variable that holds a function or an arrow, or one wrapped in `memo` or `forwardRef` (bare or as `React.memo`, `React.forwardRef`).

- Its name is a kit export (`Badge`, `Stack`, `Card`, `Empty`, `PageHeader`): `Badge is a kit part. Import it from @ledger/design-system instead of declaring a local copy.`
- Its name is one a product used before the kit had the part (`Modal`, `EmptyState`, `Notice`, `Severity`, `TopBar` and the rest): `EmptyState is Empty in the kit. Import that instead of declaring a local copy.`

The kit's names come from `eslint-plugin/components.json`, which `npm run build:lint` writes from the package's public exports; the old names are the `LEGACY` map in `eslint-plugin/index.js`. In this repository the root `eslint.config.js` passes the rule a `note`, so each finding also names the application's own components for a status and a level.

## Why

A local copy of a kit part drifts from it: it misses the kit's fixes, its accessibility and its responsive behaviour, and a reader of the screen cannot tell which `Badge` it renders. The application never declares a primitive or a copy of a kit part ([component library guide](../../../../docs/guides/component-library.md#layers)). A domain concept with one visual representation, such as a status, gets one application component with a name of its own that binds the domain's words to the kit part, and every screen uses it ([product pattern contract](../../../../docs/guides/product-patterns.md#states-and-identity)).

## Instead

- Import the part from the package root: `import { Badge } from "@ledger/design-system"`.
- A component that binds a domain concept to a part takes a name that says the domain, not the part: `StatusBadge` renders `Badge`, `RecordLink` renders `TextLink`.
- A part the kit lacks, or one that cannot do what the screen needs, is a kit change, made through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-neutral font-body-small">{children}</span>;
}
```

```tsx reported
import { Text } from "@ledger/design-system";

export const EmptyState = ({ title }: { title: string }) => (
  <Text color="color.text.subtle">{title}</Text>
);
```

```tsx reported
import { memo } from "react";
import { Text } from "@ledger/design-system";

export const Tooltip = memo(function Tooltip({ label }: { label: string }) {
  return <Text size="small">{label}</Text>;
});
```

### Allowed

```tsx allowed
import { Badge } from "@ledger/design-system";

export function DraftBadge() {
  return <Badge tone="warning">Draft</Badge>;
}
```

```tsx allowed
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
} from "@ledger/design-system";

export function NoEvidence() {
  return (
    <Empty>
      <EmptyMedia aria-hidden>
        <EmptyIllustration kind="records" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No evidence yet</EmptyTitle>
        <EmptyDescription>Upload a file to support this requirement.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
```

## Suggestions and fixes

Neither. Replacing a local component with the kit part changes its props and its markup, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The rule is off in `configs.package`, since the kit declares its own parts. This repository's `scripts/lint-allow.json` holds no count for it, so every report in the application fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It judges a declaration by its name only. A copy under another name (`MyBadge`, `Pill`) is not reported, and neither is one made by a factory call other than `memo` and `forwardRef`.
- A component declared inside another function, or exported under a kit name through `export { LocalBadge as Badge }`, is not reported.
- The kit's names are the ones in `components.json` when the lint loads; after the package's exports change, `npm run build:lint` refreshes them.

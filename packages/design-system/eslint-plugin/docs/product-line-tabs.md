# ledger/product-line-tabs

Reports a kit TabsList without `variant="line"` after any prop spread, or one given a class or style that changes how its strip wraps, sizes or scrolls.

## Reports

- A `TabsList` whose last `variant` is not the literal `"line"`, or is followed by a prop spread that could replace it. The finding says how the variant is written (`takes the default variant`, `sets variant="default"`, `leaves variant to a prop spread`): `<TabsList> takes the default variant. Product tabs are the line variant, whose underline spans the content width: write variant="line" after any prop spreads.`
- A `TabsList` whose `className` carries `flex-wrap`, `flex-wrap-reverse`, `w-fit`, `min-w-fit`, `max-w-fit` or any `overflow-*`, `overflow-x-*` or `overflow-y-*` class, also under a variant or with `!`: `"flex-wrap" on <TabsList> changes how the tab strip wraps, sizes or scrolls, which the kit owns: one row that scrolls, under a line across the content width. Drop it.`
- A `TabsList` whose inline `style` sets `overflow`, `overflowX` or `overflowY`, sets `flexWrap` to `wrap` or `wrap-reverse`, or sets `width`, `minWidth` or `maxWidth` to `fit-content`, with the same message leading with the property (`style.overflowX on <TabsList> …`).

One element can have both reports. Only a `TabsList` imported from `@ledger/design-system` is checked, through an alias or a namespace import too; a local component of the same name, or a type import, is not.

## Why

Every product page and preview uses the same tab strip: a line under the tabs that spans the content, a selected indicator that slides, and one row that scrolls when the labels do not fit, on a desktop preview and a phone alike. The kit owns that scroller, so a wrapping, fitted or hand-scrolled strip breaks the underline and the keyboard behaviour that come with it. The product patterns' Tabs section is the contract ([product patterns](../../../../docs/guides/product-patterns.md#tabs)); the Tabs page describes both variants ([Tabs](../../src/stories/components/Tabs.mdx)).

## Instead

`<TabsList variant="line">`, after any prop spread, with no layout class or style. The kit spans the content and scrolls the strip in one row.

## Examples

### Reported

```tsx reported
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ledger/design-system";

export function ProgramTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="systems">Systems</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview</TabsContent>
      <TabsContent value="systems">Systems</TabsContent>
    </Tabs>
  );
}
```

```tsx reported
import type { ComponentProps } from "react";
import { Tabs, TabsList, TabsTrigger } from "@ledger/design-system";

export function RecordTabs(props: ComponentProps<typeof TabsList>) {
  return (
    <Tabs defaultValue="details">
      <TabsList variant="line" {...props}>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

```tsx reported
import { Tabs, TabsList, TabsTrigger } from "@ledger/design-system";

export function EvidenceTabs() {
  return (
    <Tabs defaultValue="versions">
      <TabsList variant="line" className="flex-wrap">
        <TabsTrigger value="versions">Versions</TabsTrigger>
        <TabsTrigger value="links">Linked requirements</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### Allowed

```tsx allowed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ledger/design-system";

export function ProgramTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="systems">Systems</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview</TabsContent>
      <TabsContent value="systems">Systems</TabsContent>
    </Tabs>
  );
}
```

```tsx allowed
import type { ComponentProps } from "react";
import { Tabs, TabsList, TabsTrigger } from "@ledger/design-system";

export function RecordTabs(props: ComponentProps<typeof TabsList>) {
  return (
    <Tabs defaultValue="details">
      <TabsList {...props} variant="line">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

## Suggestions and fixes

Neither. Adding or moving `variant="line"` and removing a class are small edits, but the rule does not make them: the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule is in neither preset: filled tabs remain a supported kit variant, so a product turns it on for the files that follow its contract. This repository's root `eslint.config.js` turns it on, as an error, for the application's product files (`src/routes`, `src/components/app`, `src/components/prototype`, `src/lib` and `src/router.tsx`). It takes the plugin's `allow` option, a count of reports per file that may only shrink; `scripts/lint-allow.json` has no entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A `variant` that comes from an expression (`variant={variant}`) is reported, since the rule cannot read its value; `variant={"line"}` passes.
- A wrapper component that renders the kit's `TabsList` is checked where it renders it, not where it is used, so props passed through the wrapper are not seen.
- Its classes are read as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last). A `style` held in a variable, a class passed in through a prop or imported from another file, and a class or selector that reaches the strip from a parent (`[&_[role=tablist]]:flex-wrap`) are not read.

# ledger/overlay-width-preset

Reports a width set on Dialog, Sheet, AlertDialog or Drawer content through `style` or a width class.

## Reports

- A width property in the `style` of `DialogContent`, `SheetContent`, `AlertDialogContent` or `DrawerContent`: `width`, `minWidth`, `maxWidth`, `inlineSize`, `minInlineSize` or `maxInlineSize`, whatever its value, in any object the style can be, as [`ledger/no-style-design-value`](no-style-design-value.md) follows one in the same file: the attribute's object, a branch, a `const` or a map's entry, an object spread into it, a Base UI style callback's return, a `useMemo`, a same-file function's return and the objects a same-file helper is handed. An object reached twice is reported once, where it is written. The message: `DialogContent sets maxWidth in style (620px). Use width="medium" (520px), the nearest step; the kit owns the steps and their narrowing to the window.`
- A width class in the content's `className`: any `w-*`, `min-w-*`, `max-w-*` or `size-*`, also under a variant or with `!`, read as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last). The message quotes the first one it finds: `SheetContent sets its width with "w-96" (384px). Use width="medium" (420px), the nearest step; the kit owns the steps and their narrowing to the window.`

The step named is the one of the part's own map nearest the width the lint reads (a number, a length such as `"30rem"`, a width token class, a stock step or an arbitrary length), both when two are as near, and every step when it reads none (`90vw`, `w-full`, a variable). Each part keeps its own map, which `npm run build:lint` reads from its source into `components.json`: Dialog's `dialogWidths` (small 400px, medium 520px, large 760px, xlarge 960px, fullscreen), Sheet's `sheetWidths` (small 320px, medium 420px, large 760px, xlarge 960px, fullscreen), and AlertDialog's `size` (default 440px, sm 320px). `DrawerContent` takes no width: `A drawer spans the window's edge and takes no width: drop it.` A property set to `undefined` is not reported. The parts are followed through an alias or a namespace import. In the kit's own source, a width that is the part's own role token, `token("dimension.part.…")` read from the kit's generated tokens in the file that draws that part, is not reported: a sized overlay of the kit takes its width from its role token (CommandDialog's `dimension.part.command` in `components/command.tsx`), the kit's one place for it as the Dialog and Sheet steps are theirs, or from its own size prop falling back to it (PreviewSheet's `width ?? token("dimension.part.previewSheet")`). Another part's token, the token in another file, and a product's `token()` are widths like any other.

## Why

A dialog's width is a decision about the task, and Ledger makes it once: a few named steps, each of which narrows to the window less a gutter, so a dialog on a phone is the phone's width and dialogs of the same kind open at the same size. A pixel width in `style` or a width class skips both: it does not narrow, or narrows differently, and it starts a second scale. The product patterns' Forms and confirmations section says `DialogContent` takes a `width` step, never a pixel width ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)); the Dialog page lists the steps ([Dialog](../../src/stories/components/Dialog.mdx)).

## Instead

A `width` step on `DialogContent` and `SheetContent`, and `size` on `AlertDialogContent`. The steps are `"small"`, `"medium"` (the default), `"large"`, `"xlarge"` and `"fullscreen"`, chosen by the task, on a Sheet at the start or end edge; an AlertDialog takes `size="sm"` or the default; `DrawerContent` takes no width, since a drawer spans the window's edge.

## Examples

### Reported

```tsx reported
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ledger/design-system";

export function ReviewDialog({ open, previewWidth }: { open: boolean; previewWidth: number }) {
  return (
    <Dialog open={open}>
      <DialogContent style={{ maxWidth: previewWidth }}>
        <DialogHeader>
          <DialogTitle>Review evidence</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx reported
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ledger/design-system";

export function FiltersSheet({ open }: { open: boolean }) {
  return (
    <Sheet open={open}>
      <SheetContent className="max-w-800">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
```

```tsx reported
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ledger/design-system";

const wide = "w-full sm:w-1000";

export function RemoveAllocation({ open }: { open: boolean }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={wide}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this allocation?</AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Allowed

```tsx allowed
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ledger/design-system";

export function ReviewDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent width="xlarge">
        <DialogHeader>
          <DialogTitle>Review evidence</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx allowed
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ledger/design-system";

export function FiltersSheet({ open }: { open: boolean }) {
  return (
    <Sheet open={open}>
      <SheetContent side="end" width="small">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
```

```tsx allowed
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ledger/design-system";

export function RemoveAllocation({ open }: { open: boolean }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this allocation?</AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Suggestions and fixes

Neither. The message names the nearest step as a starting point, but the step is chosen by the task, not by the nearest number, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets; `configs.package` turns it off in the kit's stories, where a Don't story shows the mistake on purpose. The kit's `test/lint-allow.json` counts the kit's sites that predate it, in the patterns that build on a dialog or a sheet; this repository's `scripts/lint-allow.json` has no entry for it, so every report in the application fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- Only the four content parts are read. A width on the `Dialog` root, on a wrapper inside the content, or on a local component that renders the content under another name is not seen.
- A style from another file (an imported object, or `style={withStyle(base, style)}` with an imported helper) is not read, nor a spread onto the content (`<DialogContent {...props} />`), nor a class that reaches the content through a prop.
- Every width class is reported, a structural one such as `w-full` included.
- The content part is known by what its tag is bound to: the kit's, by name, alias or namespace (inside the kit, by a relative import), another package's by the name it imports (an alias or a namespace resolved), and a local component by the name it is written with, since any part of that name has the same defect. A type of the same name (a type parameter, a local type or interface) hides nothing. A parameter, or a local that shadows an outer name, is no part and is skipped.

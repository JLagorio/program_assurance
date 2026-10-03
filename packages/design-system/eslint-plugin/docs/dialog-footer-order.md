# ledger/dialog-footer-order

Reports a Cancel or close control that comes after the primary action in a dialog, alert dialog, sheet or drawer footer.

## Reports

- In a `DialogFooter`, `AlertDialogFooter`, `SheetFooter` or `DrawerFooter`, any cancel that follows the first primary. The finding names the cancel and the footer as written, and what the cancel dismisses: `<DialogClose> dismisses the dialog but comes after the primary action in <DialogFooter>. Put it first: the safe answer leads, and the primary ends the footer, where a keyboard reader reaches it last.` Each late cancel is its own report.
- A cancel is a `Button` whose text is exactly `Cancel`, or a close part (`DialogClose`, `SheetClose`, `DrawerClose`, `AlertDialogCancel`) that is not itself the primary.
- A primary is an `AlertDialogAction`, or a `Button` or close part with `variant="primary"`, written on it or on the element in its `render`.
- The same among the children of a component of the file that hands them on to a footer (`const Actions = ({ children }) => <DialogFooter>{children}</DialogFooter>`): `<Button> dismisses the dialog but comes after the primary action in <Actions>, which forwards its children to <DialogFooter>.`

The footer's children are read through fragments, wrapping elements such as an `Inline`, and the right-hand side of `&&`. Kit names are followed through an alias or a namespace import from `@ledger/design-system` (`import { DialogFooter as Footer }`, `<Kit.DialogFooter>`).

## Why

A footer's order is how a reader finds the way out without reading: in every Ledger dialog the safe answer comes first and the operation last, so a keyboard reader tabs through Cancel before reaching the command, and the primary sits at the end where the eye finishes. A footer that swaps them in one place teaches the wrong position everywhere. The product patterns' Forms and confirmations section sets the order ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)), and the Dialog and AlertDialog pages describe the footer.

## Instead

The cancel first, then the primary. In a Dialog or Sheet that is `<DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>` (or `SheetClose`) before the primary `Button`; in an AlertDialog, `AlertDialogCancel` before `AlertDialogAction`.

## Examples

### Reported

```tsx reported
import { Button, DialogClose, DialogFooter } from "@ledger/design-system";

export function CreateTaskFooter({ formId }: { formId: string }) {
  return (
    <DialogFooter>
      <Button type="submit" form={formId} variant="primary">
        Create task
      </Button>
      <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
    </DialogFooter>
  );
}
```

```tsx reported
import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@ledger/design-system";

export function DeleteDraftsFooter({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialogFooter>
      <AlertDialogAction onClick={onDelete}>Delete drafts</AlertDialogAction>
      <AlertDialogCancel>Keep drafts</AlertDialogCancel>
    </AlertDialogFooter>
  );
}
```

```tsx reported
import { Button, SheetFooter } from "@ledger/design-system";

export function FilterFooter(props: { dirty: boolean; apply: () => void; cancel: () => void }) {
  return (
    <SheetFooter>
      <Button variant="primary" onClick={props.apply}>
        Apply filters
      </Button>
      {props.dirty && <Button onClick={props.cancel}>Cancel</Button>}
    </SheetFooter>
  );
}
```

### Allowed

```tsx allowed
import { Button, DialogClose, DialogFooter } from "@ledger/design-system";

export function CreateTaskFooter({ formId }: { formId: string }) {
  return (
    <DialogFooter>
      <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
      <Button type="submit" form={formId} variant="primary">
        Create task
      </Button>
    </DialogFooter>
  );
}
```

```tsx allowed
import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@ledger/design-system";

export function DeleteDraftsFooter({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialogFooter>
      <AlertDialogCancel>Keep drafts</AlertDialogCancel>
      <AlertDialogAction onClick={onDelete}>Delete drafts</AlertDialogAction>
    </AlertDialogFooter>
  );
}
```

```tsx allowed
import { Button, DialogClose, DialogFooter } from "@ledger/design-system";

export function ReviewFooter({ readOnly, formId }: { readOnly: boolean; formId: string }) {
  return (
    <DialogFooter>
      {readOnly ? (
        <DialogClose render={<Button variant="primary" />}>Close</DialogClose>
      ) : (
        <Button type="submit" form={formId} variant="primary">
          Publish version
        </Button>
      )}
    </DialogFooter>
  );
}
```

## Suggestions and fixes

Neither. Moving a control would carry its condition and its neighbours with it, so the rule offers no `--fix` and no editor suggestion; swap the two elements by hand.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in `configs.recommended` and not in `configs.package`, so the kit's own components are not checked; neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It reads the footer's own JSX in the file. Buttons that a component renders from inside the footer (`<DialogFooter><FormActions /></DialogFooter>`) are not seen.
- A component that hands its children on to a footer is followed within the file, through up to four such components, when its first parameter carries it: the props object or a rest that still holds it, spread onto the element, or `children` destructured (in the parameter, or from the props object at the top of its body) and written onto it. Of the elements a component hands it to, the first in source order counts, passing over one that renders a component already on the way (a tree that renders itself). A component imported from another file, one declared with `let`, one read from an object (`<parts.Row>`), a component past the fourth and a second element given the same prop are not followed.
- The two branches of a conditional are never compared with each other, since only one of them renders; only the right-hand side of `&&` is read.
- A cancel is known by its exact text or by being a close part: a `Button` labelled `Keep editing`, or one whose label is a variable, counts only when it is a close part. A primary is known by a written `variant="primary"`; a variant from a variable is not read.
- Controls inside a nested dialog, sheet or drawer part within the footer are skipped.
- A footer, a button or a close part is known by what its tag is bound to: the kit's, by name, alias or namespace (inside the kit, by a relative import), another package's by the name it imports (an alias or a namespace resolved), and a local component by the name it is written with, since any part of that name has the same defect. A type of the same name (a type parameter, a local type or interface) hides nothing. A parameter, or a local that shadows an outer name, is no part and is skipped.

# ledger/no-native-confirm

Reports a call to the browser's `confirm()`, bare or through `window`, `globalThis` or `self`.

## Reports

- `window.confirm(…)`, `globalThis.confirm(…)` and `self.confirm(…)`, also written with a computed key (`window["confirm"](…)`).
- A bare `confirm(…)` that no declaration in scope binds, so it is the browser's global.

The finding leads with the call as the global names it: `window.confirm() opens the browser's own dialog, which blocks the page and cannot show a pending state, keep a draft or say that the command failed. Ask in an AlertDialog: AlertDialogCancel first as the safe answer, then an AlertDialogAction named for the command.` A function, variable, parameter or import named `confirm` in scope is the file's own and is not reported, and neither is a method named `confirm` on another object (`review.confirm()`).

## Why

The browser's confirm stops the whole page, draws a box the application cannot style, word or translate, and cannot stay open while the command it asks about runs, so it cannot show a pending state, keep the draft or say that the command failed. Ledger's AlertDialog asks the same question in the page: Cancel is the safe answer and takes focus, the Action says the verb, `pending` holds the dialog while the command runs, and a failure is said inside it with the Action as the retry. The product patterns' Forms and confirmations section routes every dirty dismissal and destructive decision through it; in this repository `useConfirmation` renders it ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)). The AlertDialog page describes the parts ([AlertDialog](../../src/stories/components/AlertDialog.mdx)).

## Instead

An `AlertDialog`, with `AlertDialogCancel` before `AlertDialogAction`. Its title is the question, the Cancel is the safe answer, and `pending` on the dialog holds it while the command runs.

## Examples

### Reported

```tsx reported
import { Button } from "@ledger/design-system";

export function DiscardChanges({ onDiscard }: { onDiscard: () => void }) {
  return (
    <Button
      onClick={() => {
        if (window.confirm("Discard your changes?")) onDiscard();
      }}
    >
      Discard changes
    </Button>
  );
}
```

```tsx reported
export async function removeAllocation(remove: () => Promise<void>) {
  if (!confirm("Remove this allocation?")) return;
  await remove();
}
```

### Allowed

```tsx allowed
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@ledger/design-system";

export function DiscardChanges({ onDiscard }: { onDiscard: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Discard changes</AlertDialogTrigger>
      <AlertDialogContent width="xsmall">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
          <AlertDialogDescription>
            The draft is removed and cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction render={<AlertDialogCancel />} onClick={onDiscard}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

```tsx allowed
type Review = { confirm: () => Promise<void> };

export async function approve(review: Review) {
  await review.confirm();
}
```

```tsx allowed
export function confirmAll(confirm: (id: string) => boolean, ids: string[]) {
  return ids.every((id) => confirm(id));
}
```

## Suggestions and fixes

Neither. An AlertDialog is state and markup in place of one call, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in `configs.recommended` and not in `configs.package`. This repository's `scripts/lint-allow.json` has no entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- The browser's other dialogs, `alert()` and `prompt()`, are not reported.
- A copy of the function is not followed: `const ask = window.confirm; ask(…)` passes, and so does a destructured `const { confirm } = window`, which reads as a local binding.
- Only `window`, `globalThis` and `self` are read as the global object: `window.top.confirm(…)` and `parent.confirm(…)` pass.

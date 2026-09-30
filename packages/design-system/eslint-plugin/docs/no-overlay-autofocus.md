# ledger/no-overlay-autofocus

Reports `autoFocus` inside an overlay's content, where it takes over from the overlay's own focus handling.

## Reports

- `autoFocus` on any element inside the content or popup of a Dialog, Sheet, AlertDialog, Drawer, Popover, HoverCard, DropdownMenu, ContextMenu or Command (`DialogContent`, `PopoverContent`, `DropdownMenuContent` and so on, or the same part named `…Popup`), or inside a `PickerSheet`, `RecordBrowser`, `PreviewSheet`, `CommandDialog` or `CommandPalette`.
- `autoFocus` inside a component of the same file that such content renders, directly or through other components of the file: `<SheetContent><FilterFields /></SheetContent>` with `autoFocus` in `FilterFields`.

`autoFocus={false}` is not reported; any other value is. The overlay parts are followed through an alias or a namespace import. The finding leads with the element as written and names the overlay part it is inside: `<Input autoFocus> is inside DialogContent, where it races the overlay's own focus and can lose where focus returns on close. Give DialogContent initialFocus, a ref to this element, and finalFocus where the opener goes away.` A component name too long for the message limit gives way to its last part.

## Why

An overlay decides where focus goes when it opens and where it returns when it closes: Ledger's overlays take `initialFocus` for the first and `finalFocus` for the second, and record the opener as they open. React focuses an `autoFocus` field as it mounts, before the overlay's own focus handling runs, so the two compete: the overlay can record the field in place of its opener and return focus to nothing when it closes, and on a touch screen the field opens the keyboard that the overlay's default first focus avoids. The product patterns' Forms and confirmations section gives the first field focus through `initialFocus`, never `autoFocus` ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)), and the Dialog page's Accessibility section says the same for the kit ([Dialog](../../src/stories/components/Dialog.mdx)).

## Instead

`initialFocus` on the content, with the first field's ref. `<DialogContent initialFocus={titleRef}>` works the same on SheetContent and PopoverContent; pass `finalFocus` with a stable element when the opener goes away with the task.

## Examples

### Reported

```tsx reported
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
} from "@ledger/design-system";

export function CreateTaskDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent width="medium">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input name="title" autoFocus />
          </Field>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx reported
import { Field, FieldLabel, Input, Sheet, SheetBody, SheetContent } from "@ledger/design-system";

function FilterFields() {
  return (
    <Field>
      <FieldLabel>Owner</FieldLabel>
      <Input name="owner" autoFocus />
    </Field>
  );
}

export function Filters({ open }: { open: boolean }) {
  return (
    <Sheet open={open}>
      <SheetContent width="small">
        <SheetBody>
          <FilterFields />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
```

```tsx reported
import { Popover, PopoverContent, PopoverTrigger, Button, Textarea } from "@ledger/design-system";

export function ReasonPopover() {
  return (
    <Popover>
      <PopoverTrigger render={<Button />}>Add a reason</PopoverTrigger>
      <PopoverContent>
        <Textarea aria-label="Reason" autoFocus />
      </PopoverContent>
    </Popover>
  );
}
```

### Allowed

```tsx allowed
import { useRef } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
} from "@ledger/design-system";

export function CreateTaskDialog({ open }: { open: boolean }) {
  const title = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open}>
      <DialogContent width="medium" initialFocus={title}>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input name="title" ref={title} />
          </Field>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx allowed
import { useRef, type RefObject } from "react";
import { Field, FieldLabel, Input, Sheet, SheetBody, SheetContent } from "@ledger/design-system";

type Props = { open: boolean; register: RefObject<HTMLElement | null> };

export function Filters({ open, register }: Props) {
  const owner = useRef<HTMLInputElement>(null);
  return (
    <Sheet open={open}>
      <SheetContent width="small" initialFocus={owner} finalFocus={register}>
        <SheetBody>
          <Field>
            <FieldLabel>Owner</FieldLabel>
            <Input name="owner" ref={owner} />
          </Field>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
```

## Suggestions and fixes

Neither. The fix needs a ref on the field and `initialFocus` on the content, which may be in another component, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets; `configs.package` turns it off in the kit's stories, where a Don't story shows the mistake on purpose. The kit's `test/lint-allow.json` counts the kit's sites that predate it; this repository's `scripts/lint-allow.json` has no entry for it, so every report in the application fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- Components are followed within the file only. A field component imported from another file and rendered inside the overlay is not read, nor is a local overlay wrapper under another name (`FormDialog`) that renders the kit's content.
- A component is matched by its name, so two components of the same name in one file are one to the rule.
- Focus moved by code, such as a ref callback or an effect that calls `focus()`, and an `autoFocus` passed through a spread, are not seen.
- The overlay content is known by what its tag is bound to: the kit's, by name, alias or namespace (inside the kit, by a relative import), another package's by the name it imports (an alias or a namespace resolved), and a local component by the name it is written with, since any part of that name has the same defect. A type of the same name (a type parameter, a local type or interface) hides nothing. A parameter, or a local that shadows an outer name, is no part and is skipped.

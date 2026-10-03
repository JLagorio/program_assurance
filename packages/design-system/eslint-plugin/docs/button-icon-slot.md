# ledger/button-icon-slot

Reports an icon sized by hand as a child of a Button or an IconButton, where the icon belongs in `iconBefore`, `iconAfter` or `icon` and the button sizes it.

## Reports

- An element with a `size-icon-*` class written as a direct child of a `Button`. The finding leads with the icon as written and its size class, and names the slot: `<PlusIcon> is sized by hand ("size-icon-small") as a Button's child, where the Button can neither size it nor swap it for the spinner. Pass it bare: iconBefore={<PlusIcon />} or iconAfter.`
- The same inside an `IconButton`, whose `icon` prop takes it: `… The IconButton sizes its icon and names it from label: pass it bare, icon={<XIcon />}.`
- The same inside an element whose `render` puts a kit Button or IconButton in its place, which then holds the element's children (`<DialogTrigger render={<Button />}>`): `<PlusIcon> is sized by hand ("size-icon-small") inside <DialogTrigger>, which renders a Button that sizes its own icons. Pass it bare in that Button's iconBefore or iconAfter.`
- The same among the children of a component of the file that hands its children on to a Button or IconButton (`const Go = (props) => <Button {...props} />`): `<PlusIcon> is sized by hand ("size-icon-small") inside <Go>, which renders a Button that sizes its own icons. Pass it bare in that Button's iconBefore or iconAfter.`

The class is read from the child's own `className`, as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last), also at a breakpoint, in a state or with `!` (`md:size-icon-small`). Each such icon is reported once, on the icon element.

The Button and the IconButton are the kit's, imported from `@ledger/design-system` by name, alias (`<Action>`) or namespace (`<Kit.Button>`); inside the kit, a relative import of the part is the part. A type of the same name (a type parameter, a local type or interface) hides nothing.

## Why

Button owns its icon. An icon in `iconBefore` or `iconAfter` is sized to `dimension.icon.small` (14px) with the gap kept, the button takes a smaller inset on that side, and while `isLoading` the spinner takes the icon's place. IconButton sizes its `icon`, hides it from assistive technology and takes its name from `label`. An icon passed as a child gets none of this: its size is copied by hand, the inset is the label's, and the spinner covers the label instead of replacing the icon. See [Button](../../src/stories/components/Button.mdx) and [IconButton](../../src/stories/components/IconButton.mdx).

## Instead

- A leading icon is `iconBefore={<Plus />}`, a trailing one `iconAfter={<ChevronDown />}`, each passed bare, with no size class.
- An icon-only action is an `IconButton` with `icon={<X />}` and a `label` that names the action ("Close").
- An icon on navigation is a `LinkButton` or a `LinkIconButton`, which take the same slots.

## Examples

### Reported

```tsx reported
import { Button } from "@ledger/design-system";
import { Plus } from "lucide-react";

export function CreateTask({ onCreate }: { onCreate: () => void }) {
  return (
    <Button variant="primary" onClick={onCreate}>
      <Plus className="size-icon-small" />
      Create task
    </Button>
  );
}
```

```tsx reported
import { IconButton } from "@ledger/design-system";
import { X } from "lucide-react";

export function ClosePanel({ onClose }: { onClose: () => void }) {
  return (
    <IconButton label="Close" onClick={onClose}>
      <X className="size-icon-medium" />
    </IconButton>
  );
}
```

```tsx reported
import { Button, cn } from "@ledger/design-system";
import { ChevronDown } from "lucide-react";

export function FiltersTrigger({ open }: { open: boolean }) {
  return (
    <Button variant="subtle">
      Filters
      <ChevronDown className={cn("size-icon-small", open && "rotate-180")} />
    </Button>
  );
}
```

### Allowed

```tsx allowed
import { Button } from "@ledger/design-system";
import { Plus } from "lucide-react";

export function CreateTask({ onCreate }: { onCreate: () => void }) {
  return (
    <Button variant="primary" iconBefore={<Plus />} onClick={onCreate}>
      Create task
    </Button>
  );
}
```

```tsx allowed
import { IconButton } from "@ledger/design-system";
import { X } from "lucide-react";

export function ClosePanel({ onClose }: { onClose: () => void }) {
  return <IconButton icon={<X />} label="Close" onClick={onClose} />;
}
```

```tsx allowed
import { Button } from "@ledger/design-system";
import { ChevronDown } from "lucide-react";

export function FiltersTrigger() {
  return (
    <Button variant="subtle" iconAfter={<ChevronDown />}>
      Filters
    </Button>
  );
}
```

## Suggestions and fixes

Neither. Moving a child into a prop changes the element's structure and its order beside the label, so the rule reports and leaves the change to the author.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It judges the kit's `Button` and `IconButton` only: LinkButton and LinkIconButton are not checked, and a local component, another package's part, a parameter named `Button` and, in the kit's stories, a story's own `Button` are not the kit's.
- Only a direct child element is read. An icon inside a fragment or a wrapper, one held in a variable (`{icon}`), or one a component renders is not seen.
- Only the child's own `className`: a class passed in through a prop or imported from another file, or another size (`size-150`), is not seen.
- A component that hands its children on to a Button is followed within the file, through up to four such components, when its first parameter carries it: the props object or a rest that still holds it, spread onto the element, or `children` destructured (in the parameter, or from the props object at the top of its body) and written onto it. Of the elements a component hands it to, the first in source order counts, passing over one that renders a component already on the way (a tree that renders itself). A component imported from another file, one declared with `let`, one read from an object (`<parts.Row>`), a component past the fourth and a second element given the same prop are not followed.
- An icon already in a slot that still carries a size class is not reported.

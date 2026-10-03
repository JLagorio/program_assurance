# ledger/readable-classes

Reports a `className` on a kit part that the class rules cannot read, because it comes from another prop, another module, a call or a value the lint cannot follow.

## Reports

A `className`, or any `*ClassName` attribute, on a kit part, where part of its value cannot be read: written on the part, in an object spread onto it (`<Button {...{ className: cls }} />`), in a slot map it is given (`<Calendar classNames={{ day: cls }} />`), or handed to a kit recipe whose classes land on it (`buttonVariants({ className: cls })`). The finding sits on that part of the value and says where it comes from:

- another prop or a parameter, named as the caller writes it (`{ cls: c }` and `props["cls"]` are both "cls"): `<Button> className comes from the prop "cls", so no Ledger rule can check it.` A parameter with a default is still a prop, since a caller can pass any other value; only in a same-file function read for its call is it what the call gives it, and an argument that call leaves out is its default, or nothing;
- a module of the product's own, by a relative, `@/`, `~/` or `#` path, held in a `const` or not: `is imported from "./theme"`, or `comes from a function imported from "./theme"` when it is a call's result;
- another package's function the file hands values to (`join([cls, "w-full"], " ")` from lodash, React's `useContext(Ctx)`): `comes from a function imported from "lodash"`;
- a call the lint cannot follow, a variable written again after its first value (a list changed in place with `push`, `unshift`, `splice` or `fill` included), a member it cannot find, a spread it cannot read, or any other expression it cannot read.

Every finding then names what to write instead, from the part's own styling props when it has them: `Use a Button prop (variant, size, isSelected); for layout the part leaves to its caller, write the classes here or in a map in this file.` The part is the kit's, imported from `@ledger/design-system` by name, alias or namespace; an element whose `render` puts a kit part in its place is judged as that part, and the finding says so: `<DialogTrigger> renders <Button>, whose className comes from … Use its prop (variant, size, isSelected), or write layout classes here or in a map in this file.` A value two class attributes read is reported once.

What the lint reads is not reported, however it is written: a string or template, a condition, a Base UI className callback (`(state) => (state.open ? "…" : undefined)`) and one `useCallback` memoises, a same-file `const`, map or list (by a static key, or by a typed prop, which reads every entry), a forwarded `className` or `*ClassName` prop, the defaults written for it and the caller's own className callback called with the state (`typeof className === "function" ? className(state) : className`), `cn`, `clsx` and the other merge helpers, a `cva` or `tv` recipe, a same-file function's returns, and anything imported from the kit itself (`buttonVariants`, held in a `const` too), or from another package by its bare name when nothing the file writes is handed to it (react-day-picker's `getDefaultClassNames()`, called where it is used or held in a `const`).

## Why

The class rules check each class where the file writes it: the token rules its vocabulary, and the part rules what lands on a part. A class they cannot read is checked by none of them, so a value from another prop, another module or a call is a way around every one, and on a kit part it is the kit's own look that it changes unseen. A part's look is its props' job ([Choosing a part](../../src/stories/docs/Choosing.mdx)); what the part leaves to its caller, such as where it sits in a row, is a class the reader of the file can see.

## Instead

Use the part's own prop for its look (`variant`, `size`, `tone`, `isSelected`), and write a class for layout the part leaves to its caller in the file: in the attribute, or in a `const` or a map keyed by a typed prop.

- A wrapper that hands classes through takes them as `className`, or as a `*ClassName` prop (`labelClassName`), which the lint reads as forwarded.
- A class list shared across files moves into the file that uses it, or becomes a prop of the part.
- A class from a call becomes a same-file function, a map or a recipe (`cva`), whose strings the lint reads.

## Examples

### Reported

```tsx reported
import { Button } from "@ledger/design-system";

export function SaveButton({ cls }: { cls: string }) {
  return <Button className={cls}>Save</Button>;
}
```

```tsx reported
import { Badge } from "@ledger/design-system";
import { statusClass } from "./status-classes";

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusClass(status)}>{status}</Badge>;
}
```

```tsx reported
import { Button } from "@ledger/design-system";

export function SaveButton({ className }: { className?: string }) {
  className ??= "w-full";
  return <Button className={className}>Save</Button>;
}
```

### Allowed

```tsx allowed
import { Button } from "@ledger/design-system";

export function SaveButton({ primary }: { primary: boolean }) {
  return (
    <Button variant={primary ? "primary" : "secondary"} isFullWidth>
      Save
    </Button>
  );
}
```

```tsx allowed
import { Button, cn } from "@ledger/design-system";

const place = { start: "self-start", end: "self-end" } as const;

export function SaveButton({ at, className }: { at: keyof typeof place; className?: string }) {
  return <Button className={cn(place[at], className)}>Save</Button>;
}
```

```tsx allowed
import { Button } from "@ledger/design-system";

function placeFor(last: boolean) {
  return last ? "self-end" : "self-start";
}

export function SaveButton({ last }: { last: boolean }) {
  return <Button className={placeFor(last)}>Save</Button>;
}
```

## Suggestions and fixes

Neither. Whether a class is the part's look, which a prop replaces, or layout its caller owns is the author's decision, and so is where a shared list moves.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs at error in both presets, and in the kit's stories too. Neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It judges a kit part only. A plain element, a local look-alike and another package's part are not checked; the token rules still read what they can of them.
- A class glued together at runtime (`` `bg-${tone}` ``) is [`ledger/no-non-token-class`](no-non-token-class.md)'s, which reports it as built at runtime.
- A component of the file that hands its `className` on to a part (`const Mine = (props) => <Button {...props} />`) is read as that part, and the finding says so: `<Mine> forwards className to <Button>, whose className is imported from "./theme", …`. One imported from another file is not the part, so a class given to it is not checked here.
- A parameter whose default is an object, read through another name (`const t = tones; t.a` with `{ tones = { a: "…" } }`), reads as that default.
- In the kit's own source, a relative import that stays inside its `src` is the kit, read where it is declared; in a product only `@ledger/design-system` is. A value from another package is that package's: its classes are not Ledger's vocabulary.
- The part's styling props come from its type, as the package's build reads it (`eslint-plugin/components.json`): the choices it declares and its `is…` flags. A part with none gets the second half of the advice alone.

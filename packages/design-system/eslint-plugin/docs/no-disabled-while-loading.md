# ledger/no-disabled-while-loading

Reports an element or a props object whose `disabled` reads the same pending flag as its `isLoading`.

## Reports

- A JSX element with both `isLoading` and `disabled` whose expressions read a name in common: `isLoading={pending} disabled={pending}`, or `isLoading={create.isPending} disabled={!valid || create.isPending}`.
- An object literal with both `isLoading` and `disabled` properties that share a name in the same way, such as props built for a button or passed to a helper.

A name is a bare identifier or a whole member chain (`save.isPending`, with `?.` read as `.`), found through `!`, `&&`, `||`, `??`, comparisons, conditionals and a call's arguments. The finding leads with the element as written and names what is shared: `<Button> reads saving in isLoading and in disabled, so the pressed button goes disabled mid-save and drops focus to the page. isLoading alone blocks a repeat press and keeps focus: take it out of disabled, and give any other reason as disabledReason.` The flags are named once, and past what fits the message limit, the first and how many more (`publishEvidenceVersion.isPending and 1 more`). On a props object it leads with the name: `adding is read by this object's isLoading and its disabled, …` It checks any element, not only a kit Button.

## Why

While a save runs, focus is on the button the reader pressed. A disabled button cannot hold focus, so the browser drops it to the page, and a keyboard or screen reader user loses their place at the moment they are waiting for a result. Ledger's `isLoading` already blocks a repeat activation, shows the spinner, keeps the button's width and name, and keeps it focusable. The product patterns' Forms and confirmations section says the primary shows `isLoading` and is never also `disabled` ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)); the Button page describes `isLoading` and `disabledReason` ([Button](../../src/stories/components/Button.mdx)).

## Instead

`isLoading={pending}` alone. Keep `disabled` only for a reason unrelated to the save; for an action that truly cannot run, `disabledReason` keeps the button focusable and says why.

## Examples

### Reported

```tsx reported
import { Button } from "@ledger/design-system";

export function CreateTaskButton({ pending, formId }: { pending: boolean; formId: string }) {
  return (
    <Button type="submit" form={formId} variant="primary" isLoading={pending} disabled={pending}>
      Create task
    </Button>
  );
}
```

```tsx reported
import { Button } from "@ledger/design-system";

type Props = { formId: string; valid: boolean; create: { isPending: boolean } };

export function CreateTaskButton({ formId, valid, create }: Props) {
  return (
    <Button
      type="submit"
      form={formId}
      variant="primary"
      isLoading={create.isPending}
      disabled={!valid || create.isPending}
    >
      Create task
    </Button>
  );
}
```

```tsx reported
import { Button } from "@ledger/design-system";

type Props = { publishing: boolean; publish: () => void };

export function PublishButton({ publishing, publish }: Props) {
  const props = { variant: "primary" as const, isLoading: publishing, disabled: publishing };
  return (
    <Button {...props} onClick={publish}>
      Publish version
    </Button>
  );
}
```

### Allowed

```tsx allowed
import { Button } from "@ledger/design-system";

export function CreateTaskButton({ pending, formId }: { pending: boolean; formId: string }) {
  return (
    <Button type="submit" form={formId} variant="primary" isLoading={pending}>
      Create task
    </Button>
  );
}
```

```tsx allowed
import { Button } from "@ledger/design-system";

type Props = { publishing: boolean; canPublish: boolean; publish: () => void };

export function PublishButton({ publishing, canPublish, publish }: Props) {
  return (
    <Button
      variant="primary"
      isLoading={publishing}
      disabledReason={canPublish ? undefined : "Only the owner can publish a version."}
      onClick={publish}
    >
      Publish version
    </Button>
  );
}
```

```tsx allowed
import { Button, Field, FieldLabel, FieldSet, Input } from "@ledger/design-system";

export function TaskFields({ pending, formId }: { pending: boolean; formId: string }) {
  return (
    <form id={formId}>
      <FieldSet disabled={pending}>
        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input name="title" />
        </Field>
      </FieldSet>
      <Button type="submit" variant="primary" isLoading={pending}>
        Create task
      </Button>
    </form>
  );
}
```

## Suggestions and fixes

Neither. Removing `disabled` is right only when the shared flag is its whole reason, and a `disabled` that also carries another reason has to be split by hand, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets; `configs.package` turns it off in the kit's stories, where a Don't story shows the mistake on purpose. Neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- It compares names, not values: `const busy = save.isPending` with `isLoading={save.isPending} disabled={busy}` is not seen, and neither is a flag that reaches the two props through different variables.
- Props that arrive through a spread (`{...buttonProps}`) or from another file are not read; an object literal is checked where it is written.
- A name read by both props for different reasons is still reported, since the rule cannot tell why `disabled` reads it.

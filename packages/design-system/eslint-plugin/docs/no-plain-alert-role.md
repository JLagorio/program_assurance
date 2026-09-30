# ledger/no-plain-alert-role

Reports `role="alert"` written on a plain HTML element.

## Reports

- `role="alert"` on a native element such as `<p>`, `<div>` or `<span>`, written as a string or as a string in braces (`role={"alert"}`).

There is one message: `role="alert" on a plain element. Use Alert with role="alert" for a form-level result, FieldError under the field it is about, or ErrorSummary for several issues.` A kit part that takes the role, such as `<Alert role="alert">`, is not reported, and neither is another role (`role="status"`).

## Why

An alert interrupts a screen reader the moment it appears, so it has to be the right size of message in the right place. A paragraph with the role is announced, but it has none of what the reader then needs: no tone or icon, no title, no link to the field it is about, and no focus for a list of problems. Ledger has one part per case: an Alert with an explicit role for a result about the whole form or page, a FieldError bound to its field, and an ErrorSummary that takes focus and leads to each field. The product patterns' Forms and confirmations section says the form never writes its own `role="alert"` paragraph ([product patterns](../../../../docs/guides/product-patterns.md#forms-and-confirmations)); the Alert page says which part fits which message ([Alert](../../src/stories/components/Alert.mdx)).

## Instead

`<Alert role="alert">` for a result about the whole form, `FieldError` for one field, `ErrorSummary` for several issues. The Alert carries an AlertTitle that says what happened; the FieldError sits in the Field it is about, `<FieldError errors={…} />`.

## Examples

### Reported

```tsx reported
export function SaveFailure({ message }: { message: string }) {
  return <p role="alert">{message}</p>;
}
```

```tsx reported
import { Field, FieldLabel, Input } from "@ledger/design-system";

export function TitleField({ error }: { error?: string }) {
  return (
    <Field>
      <FieldLabel>Title</FieldLabel>
      <Input name="title" />
      {error && <span role={"alert"}>{error}</span>}
    </Field>
  );
}
```

### Allowed

```tsx allowed
import { Alert, AlertDescription, AlertTitle } from "@ledger/design-system";

export function SaveFailure({ message }: { message: string }) {
  return (
    <Alert tone="danger" role="alert">
      <AlertTitle>The task was not created</AlertTitle>
      <AlertDescription>{message} Trying again will not create it twice.</AlertDescription>
    </Alert>
  );
}
```

```tsx allowed
import { Field, FieldError, FieldLabel, Input } from "@ledger/design-system";

export function TitleField({ error }: { error?: string }) {
  return (
    <Field invalid={Boolean(error)}>
      <FieldLabel>Title</FieldLabel>
      <Input name="title" />
      <FieldError errors={error ? [{ message: error }] : []} />
    </Field>
  );
}
```

```tsx allowed
import { ErrorSummary } from "@ledger/design-system";

export function TaskIssues({ attempts }: { attempts: number }) {
  return (
    <ErrorSummary
      focusKey={attempts}
      issues={[
        { message: "Enter a task title.", target: "task-title" },
        { message: "Choose a program.", target: "task-program" },
      ]}
    />
  );
}
```

## Suggestions and fixes

Neither. The right part depends on what the message is about, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in `configs.recommended` and not in `configs.package`, since the kit's own Alert, FieldError and ErrorSummary are where the role is written. This repository's `scripts/lint-allow.json` has no entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A role from an expression (`role={kind}`) is not read.
- A live region without the role, `aria-live="assertive"`, is not reported.
- A local component that renders a plain alert is reported where it writes the role, not where it is used.

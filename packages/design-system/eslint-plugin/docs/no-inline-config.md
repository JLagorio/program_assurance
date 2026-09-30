# ledger/no-inline-config

Reports a comment that configures a ledger rule, turns one off beyond a line, or turns one off for a line without saying why after `--`.

## Reports

- A configuration comment that names a ledger rule, whatever it sets: `/* eslint ledger/no-margin: "off" */`, `/* eslint "ledger/no-margin": 1 */`. It changes the rule for the whole file, so it is reported with or without a reason. The message says what the comment does: `This comment turns ledger/no-margin off for the whole file, and a ledger rule takes no settings from a comment.`, or `lowers … to a warning`, or `sets …` for any other setting.
- A block disable that names a ledger rule, `/* eslint-disable ledger/no-margin */`, with or without a reason: `This comment turns ledger/no-margin off from here on, so every later site in the file goes unseen, with or without a reason.`
- A line or next-line disable that names a ledger rule and gives no reason after `--`: `This comment turns ledger/no-margin off for the next line without saying why.` (or `for its own line`).
- A next-line disable that names no rule, bare or with a list of only commas or empty quotes (`// eslint-disable-next-line ,`): `This comment names no rule, so it turns every rule off for the next line, the ledger rules with them.`

Each message ends with what to do instead. Comments are read as ESLint reads them: the reason is whatever follows two or more dashes between spaces, and a rule name written with an escape (`"ledger\u002fno-margin"`) is still that rule. A comment about another plugin's rules is left alone, and so are `eslint-enable`, `global` and `exported` comments.

## Why

A ledger finding is the kit saying a screen has left the design system. A comment that switches the rule off hides that from every later reader of the file and from the counts that keep the exceptions shrinking, and a block disable goes on hiding every later site in the file, including ones written long after the comment. The one exception the kit accepts is a single site that must keep its report, marked on the line before it and explained, so the next reader can judge whether the reason still holds. The Lint rules page's notes say how the repository counts those ([Lint rules](../../src/stories/docs/Lint.mdx)).

## Instead

Fix what the rule reports, using the advice in its own finding: a margin becomes Stack or Inline space, a literal colour its role token. What this rule tolerates is a next-line disable that names the rule and says why after `--`, for a single site the kit cannot express, such as a colour in an HTML email, where mail clients do not resolve CSS variables. It is not a way around a finding: this repository counts those disables per file in `scripts/check-allow-lists.mjs`, the counts may only shrink, and the application keeps none, so a new one fails CI.

## Examples

### Reported

```tsx reported
/* eslint ledger/no-margin: "off" */
import { Text } from "@ledger/design-system";

export function Caption() {
  return <Text className="mt-200">Updated today</Text>;
}
```

```tsx reported
/* eslint-disable ledger/no-margin -- the design asks for this gap */
import { Text } from "@ledger/design-system";

export function Caption() {
  return <Text className="mt-200">Updated today</Text>;
}
```

```tsx reported
import { Text } from "@ledger/design-system";

export function Caption() {
  return (
    <Text
      // eslint-disable-next-line ledger/no-margin
      className="mt-200"
    >
      Updated today
    </Text>
  );
}
```

```tsx reported
import { Text } from "@ledger/design-system";

// eslint-disable-next-line
const spaced = "mt-200";

export function Caption() {
  return <Text className={spaced}>Updated today</Text>;
}
```

### Allowed

```tsx allowed
import type { ReactNode } from "react";
import { Stack, Text } from "@ledger/design-system";

export function Caption({ chart }: { chart: ReactNode }) {
  return (
    <Stack space="space.200">
      {chart}
      <Text>Updated today</Text>
    </Stack>
  );
}
```

```tsx allowed
export function ReceiptTotal({ total }: { total: string }) {
  return (
    <td
      // eslint-disable-next-line ledger/no-style-design-value -- mail clients do not resolve CSS variables
      style={{ color: "#1f2937" }}
    >
      {total}
    </td>
  );
}
```

```tsx allowed
export function reportFailure(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(error);
}
```

## Suggestions and fixes

Neither. Removing the comment would bring the reports it hid back without fixing them, and only the author knows the reason a line disable is missing, so the rule offers no `--fix` and no editor suggestion.

## Allowances

The rule takes the plugin's `allow` option like every ledger rule, a count of reports per file that may only shrink, and neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` gives it one. It stays on everywhere the presets run, in the kit's stories and in `primitives/bleed.tsx` too. The line disables it lets through, those with a reason, are counted per file by `scripts/check-allow-lists.mjs` in this repository; those counts may only shrink, and the application keeps none.

## Limits

- A disable that names no rule turns this rule off too wherever it reaches, so only the next-line form, which reaches the line below, can be reported. A bare block disable (`/* eslint-disable */`) and a bare line disable (`// eslint-disable-line`) go unreported; `scripts/check-allow-lists.mjs` counts them in this repository.
- It reads comments only. A config file that turns a ledger rule off, an `ignores` entry and an `eslint-suppressions.json` are outside it; in this repository `check-allow-lists` rejects a suppressions file that carries a ledger rule.
- A reason is any text after `--`. The rule checks that one is there, not that it is true.

import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";

import ledger from "../eslint-plugin/index.js";

const lint = (source) =>
  new Linter().verify(source, {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { ledger },
    rules: { "ledger/no-non-token-class": "error" },
  });

test("CVA checks recipe classes without interpreting variant names as classes", () => {
  assert.deepEqual(
    lint(`const recipe = cva("inline-flex [&>svg]:size-150!", {
      variants: { variant: { default: "bg-brand-bold", secondary: "bg-neutral" } },
      defaultVariants: { variant: "default" },
      compoundVariants: [{ variant: "secondary", class: "text-subtle", className: "font-medium" }]
    }); const element = <span className={cn(recipe(), "!text-default")} />;`),
    [],
  );
  const messages = lint(`const recipe = cva("inline-flex", {
    variants: { variant: { default: "bg-unknown!", secondary: "!text-unknown" } },
    compoundVariants: [{ variant: "secondary", className: "hover:bg-unknown" }]
  });`);
  assert.equal(messages.length, 3);
  assert.ok(messages.every((message) => message.ruleId === "ledger/no-non-token-class"));
});

test("nested CVA recipes and conditional clsx maps retain class validation", () => {
  const messages = lint(`const value = cn(cva("bg-unknown", {
    variants: { variant: { default: "text-unknown" } },
    defaultVariants: { variant: "default" }
  }), { "hover:bg-missing!": true });`);
  assert.equal(messages.length, 3);
  assert.ok(messages.every((message) => message.ruleId === "ledger/no-non-token-class"));
});

// ledger/no-deprecated-token: a deprecated token class, fixed in place to its replacement where the
// source can be rewritten as it reads, and explained where it cannot. The cases use
// fill-chart-categorical-8, replaced by fill-chart-categorical-7.
import ledger from "../../eslint-plugin/index.js";
import { deprecated } from "../../eslint-plugin/classes.js";
import { render } from "../../eslint-plugin/report.js";
import { allowKey, PRODUCT } from "../lint-helpers.mjs";

const from = "fill-chart-categorical-8";
const to = "fill-chart-categorical-7";
const { messages } = ledger.rules["no-deprecated-token"].meta;
const replace = { cls: from, replacement: to };
const byHand = (reason) => ({ messageId: "replaceByHand", data: { ...replace, reason } });

// Every deprecated token that a class paints has a replacement the rule can write, so the message
// that names none is reached through two fixture tokens, listed as the token build lists one in
// src/generated/utilities.json: one with no replacement, and one whose replacement's class is no
// class the kit generates, which ledger/no-non-token-class would report. Neither class is any
// token's, so they reach nothing but these cases.
const retired = "bg-retired-token";
const orphaned = "bg-orphaned-token";
deprecated["color.background.retired"] = { class: retired };
deprecated["color.background.orphaned"] = {
  replacement: "color.background.orphan",
  class: orphaned,
  replacementClass: "bg-orphan",
};

export default {
  valid: [
    { code: `<path className="${to}" />` },
    // A longer class that starts with the deprecated one is another class.
    { code: `<path className="${from}0 w-full" />` },
    { code: `<p className="text-subtle">${from}</p>` },
    // Under dark: the class is no-dark-variant's, whose fix drops it (classify in classes.js); the
    // rewrite this rule would write, dark:${to}, would still be reported.
    { code: `<path className="dark:${from}" />` },
  ],
  invalid: [
    {
      code: `<path className="${from}" />`,
      output: `<path className="${to}" />`,
      errors: [{ messageId: "replace", data: replace, line: 1, column: 17 }],
    },
    {
      // A token with no replacement is named alone, and nothing is written.
      code: `<div className="${retired} w-full" />`,
      output: null,
      errors: [{ messageId: "deprecated", data: { cls: retired }, line: 1, column: 16 }],
    },
    {
      // A replacement another class rule would report is not asked for either; the class keeps
      // its variants.
      code: `export const c = cn("hover:${orphaned}", "w-full");`,
      output: null,
      errors: [
        { messageId: "deprecated", data: { cls: `hover:${orphaned}` }, line: 1, column: 21 },
      ],
    },
    {
      // Variants and both important marks keep their places.
      code: `<path className="hover:${from} w-full" />`,
      output: `<path className="hover:${to} w-full" />`,
      errors: [
        { messageId: "replace", data: { cls: `hover:${from}`, replacement: `hover:${to}` } },
      ],
    },
    {
      code: `<path className="md:!${from}! w-full" />`,
      output: `<path className="md:!${to}! w-full" />`,
      errors: [{ messageId: "replace", data: { cls: `md:!${from}!`, replacement: `md:!${to}!` } }],
    },
    {
      // Each report rewrites the whole string, so two in one string overlap: one pass applies the
      // first, and --fix's next pass the second.
      code: `<path className="${from} hover:${from}" />`,
      output: `<path className="${to} hover:${from}" />`,
      errors: [
        { messageId: "replace", data: replace },
        { messageId: "replace", data: { cls: `hover:${from}`, replacement: `hover:${to}` } },
      ],
    },
    {
      // Double quotes inside a single-quoted attribute survive.
      code: `<path className='before:content-["x"] ${from}' />`,
      output: `<path className='before:content-["x"] ${to}' />`,
      errors: [{ messageId: "replace", data: replace }],
    },
    {
      // A real line break inside the attribute stays a line break.
      code: `<path className="${from}\n  w-full" />`,
      output: `<path className="${to}\n  w-full" />`,
      errors: [{ messageId: "replace", data: replace }],
    },
    {
      code: `export const c = cn('${from}', "w-full");`,
      output: `export const c = cn('${to}', "w-full");`,
      errors: [{ messageId: "replace", data: replace, line: 1, column: 21 }],
    },
    {
      code: `export const c = cn(\`bg-\${tone} ${from}\`);`,
      output: null,
      errors: [byHand("it is written in a template or as a name")],
    },
    {
      code: `<path className={"${from}\\u0020w-full"} />`,
      output: null,
      errors: [byHand("this string is written with an escape")],
    },
    {
      code: `<path className="bg-surface ${from}&#32;w-full" />`,
      output: null,
      errors: [byHand("this class is written with an entity")],
    },
    {
      code: `export const c = (a, b) => cn({ "${from}": a, "${to}": b });`,
      output: null,
      errors: [byHand("the object already has that key")],
    },
    {
      code: `type Fill = "${from}" | "fill-chart-categorical-6"; export const fill: Fill = "${from}"; export const A = () => <path className={fill} />;`,
      only: "ts",
      output: null,
      errors: [byHand("a type names this string")],
    },
    {
      // Over its allowance a report keeps its words, its note and its fix, and says the count.
      code: `<><path className="${from}" /><path className="${from}" /></>`,
      options: [{ allow: { [allowKey(PRODUCT)]: 1 } }],
      output: `<><path className="${to}" /><path className="${to}" /></>`,
      errors: [
        {
          message: `${render(messages.replace, { ...replace, note: "" })} (2 in this file; its allowance is 1)`,
          column: 19,
        },
        {
          message: `${render(messages.replace, { ...replace, note: "" })} (2 in this file; its allowance is 1)`,
          column: 64,
        },
      ],
    },
  ],
};

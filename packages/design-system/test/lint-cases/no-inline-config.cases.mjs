// ledger/no-inline-config: no comment configures a ledger rule or turns one off beyond a line, and
// one that turns a rule off for a line names it and says why after " -- ". The report stands on
// the comment. The screen under the comment passes every rule the comment names, since a
// configuration comment turns the rule it sets on.

const screen = 'export const A = () => <div className="p-200" />;';
const margin = { rule: "ledger/no-margin" };
/** A comment on the line before the screen. */
const above = (comment) => `${comment}\n${screen}`;

export default {
  valid: [
    { code: above("// eslint-disable-next-line ledger/no-margin -- Overlap is the geometry.") },
    { code: above("/* eslint-disable-next-line ledger/no-margin -- Overlap is the geometry. */") },
    { code: `${screen} // eslint-disable-line ledger/no-margin --- Overlap is the geometry.` },
    // Comments about other rules, and comments that are not directives.
    { code: above('/* eslint no-console: "off" */') },
    { code: above("// eslint-disable-next-line no-console") },
    { code: above("/* eslint-enable ledger/no-margin */") },
    { code: above("// See ledger/no-margin: the comment names the rule, and sets nothing.") },
    { code: 'export const note = "/* eslint ledger/no-margin: off */";' },
  ],
  invalid: [
    {
      code: above('/* eslint ledger/no-margin: "off" */'),
      errors: [{ messageId: "off", data: margin, line: 1, column: 1, endLine: 1, endColumn: 37 }],
    },
    {
      code: above("/*eslint ledger/no-margin:0*/"),
      errors: [{ messageId: "off", data: margin }],
    },
    {
      // A key written with an escape names its rule, as ESLint decodes it.
      code: above('/* eslint "ledger\\u002fno-margin": "off" */'),
      errors: [{ messageId: "off", data: margin }],
    },
    {
      code: above('/* eslint ledger/no-margin: "warn" */'),
      errors: [{ messageId: "warn", data: margin }],
    },
    {
      code: above("/* eslint ledger/no-margin: 1 */"),
      errors: [{ messageId: "warn", data: margin }],
    },
    {
      code: above('/* eslint ledger/no-margin: ["error", { "allow": {} }] */'),
      errors: [{ messageId: "set", data: margin }],
    },
    {
      // One report per rule the comment names.
      code: above('/* eslint ledger/no-margin: "off", ledger/no-non-token-class: "off" */'),
      errors: [
        { messageId: "off", data: margin },
        { messageId: "off", data: { rule: "ledger/no-non-token-class" } },
      ],
    },
    {
      // A block disable hides the rest of the file, with or without a reason.
      code: above("/* eslint-disable no-console, ledger/no-margin -- Both on purpose. */"),
      errors: [{ messageId: "fromHere", data: margin }],
    },
    {
      code: above("// eslint-disable-next-line ledger/no-margin"),
      errors: [{ messageId: "nextLineUnreasoned", data: margin, line: 1, column: 1 }],
    },
    {
      // An empty reason is no reason.
      code: above('// eslint-disable-next-line no-console, "ledger/no-margin" -- '),
      errors: [{ messageId: "nextLineUnreasoned", data: margin }],
    },
    {
      code: `${screen} // eslint-disable-line ledger/no-margin`,
      errors: [{ messageId: "lineUnreasoned", data: margin, line: 1, column: 51 }],
    },
    {
      // A list with no name in it turns every rule off.
      code: above("// eslint-disable-next-line ,"),
      errors: [{ messageId: "noRule", line: 1, column: 1 }],
    },
    {
      code: above("// eslint-disable-next-line ledger/no-margin"),
      options: [{ note: "See the lint page." }],
      errors: [
        { messageId: "nextLineUnreasoned", data: { ...margin, note: " See the lint page." } },
      ],
    },
  ],
};

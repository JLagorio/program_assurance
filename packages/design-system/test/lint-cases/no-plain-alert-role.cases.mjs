// ledger/no-plain-alert-role: a form or page result is an Alert with an explicit role, never
// role="alert" on a plain element. Also where an allowance over its count is tried.
import ledger from "../../eslint-plugin/index.js";
import { render } from "../../eslint-plugin/report.js";
import { PRODUCT, allowKey } from "../lint-helpers.mjs";

const { plainAlert } = ledger.rules["no-plain-alert-role"].meta.messages;
const two = '<p role="alert">One</p>; <p role="alert">Two</p>;';
/** A report over the allowance: its words with the note, then the count. */
const over = (note) => `${render(plainAlert, { note })} (2 in this file; its allowance is 1)`;

export default {
  valid: [
    { code: '<Alert variant="danger" role="alert">Could not save.</Alert>' },
    { code: '<p role="status">Saving…</p>' },
    { code: "<FieldError>Enter a title.</FieldError>" },
    { code: two, options: [{ allow: { [allowKey(PRODUCT)]: 2 } }] },
  ],
  invalid: [
    {
      code: '<p role="alert">Could not save.</p>',
      errors: [{ messageId: "plainAlert", line: 1, column: 4 }],
    },
    {
      code: "<div role={'alert'}>Could not save.</div>",
      errors: [{ messageId: "plainAlert" }],
    },
    {
      // An allowance for another file does not count here.
      code: two,
      options: [{ allow: { "src/other.tsx": 2 } }],
      errors: [{ messageId: "plainAlert" }, { messageId: "plainAlert" }],
    },
    {
      // Over its allowance every report stands, with the count after its words.
      code: two,
      options: [{ allow: { [allowKey(PRODUCT)]: 1 } }],
      errors: [
        { message: over(""), line: 1, column: 4 },
        { message: over(""), line: 1, column: 29 },
      ],
    },
    {
      // The note stays before the count.
      code: two,
      options: [{ allow: { [allowKey(PRODUCT)]: 1 }, note: "In this app: useFormFeedback." }],
      errors: [
        { message: over(" In this app: useFormFeedback.") },
        { message: over(" In this app: useFormFeedback.") },
      ],
    },
  ],
};

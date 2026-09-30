// ledger/no-native-confirm: a decision is an in-app AlertDialog, never the browser's confirm.

export default {
  valid: [
    // A domain command named confirm is not the browser's.
    { code: "async function confirm() {} confirm();" },
    { code: "const confirm = async () => true; confirm();" },
    { code: "function act(confirm) { return confirm(); }" },
    { code: "workflow.confirm(); window.alert;" },
  ],
  invalid: [
    {
      code: 'if (window.confirm("Discard?")) close();',
      errors: [{ messageId: "confirm", line: 1, column: 5 }],
    },
    { code: 'globalThis["confirm"]("Discard?");', errors: [{ messageId: "confirm" }] },
    { code: 'self.confirm("Discard?");', errors: [{ messageId: "confirm" }] },
    { code: 'const ok = confirm("Discard?");', errors: [{ messageId: "confirm", column: 12 }] },
    {
      // The product's note names its own binding of the kit's advice.
      code: 'window.confirm("Discard?");',
      options: [{ note: "In this app: useConfirmation." }],
      errors: [
        {
          messageId: "confirm",
          data: { call: "window.confirm()", note: " In this app: useConfirmation." },
        },
      ],
    },
  ],
};

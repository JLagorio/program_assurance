# Lab lane

Where product code tries a form on a real screen, over real data, before it becomes a Ledger part (Josef's decision D7, 2026-11-16; [the contract](../../../../docs/guides/product-patterns.md), Process).

- **One file a form**, named for it. Its header comment starts with `@lab YYYY-MM-DD`, the day the trial began, then says which screen draws it and what the trial is to learn.
- **Every lint rule applies**, as on any product file (the folder sits under `src/components/prototype`, which `eslint.config.js` lints as product code): Ledger's primitives and tokens build any form. A form that needs a kit part's own styling changed is a change to that part, through `/ledger-add-part`, not a lab.
- **A screen may draw a lab form** in place of a kit part while it is tried. Domain code never imports from here, as it never imports the UI.
- **Thirty days.** `npm run test:app` fails once a lab file is older than 30 days (`scripts/tests/lab-expiry.test.mjs`). By then the form becomes a kit part through `/ledger-add-part`, once Josef approves it and a second screen wants it, with the decision in [the decisions log](../../../../docs/decisions.md), or it is deleted.

---
name: verify-screen
description: Verify a new or changed application screen against the product pattern contract in the running app, at desktop and phone widths, before calling it done. Use after building or changing a register, record page, preview, form or tab in src/.
---

# Verify a changed screen

The contract is `docs/guides/product-patterns.md`; its last section, "What checks it", is the checklist. This skill is the order to run it in. Do not restate the contract.

## Static checks first

```sh
npx tsc --noEmit -p tsconfig.json
npm run lint             # ledger rules, product-responsive-table, product-line-tabs, no-native-confirm
npm run test:app         # runtime data boundary, screen inventory
```

A new route must be declared in `docs/guides/screen-inventory.json` with its family, browser title, model and closed exceptions; the boundary test rejects an unlisted route.

## In the running app

Sign in as the seeded developer account against the local stack (`npm run local:start`, `npm run dev`). Open the screen at desktop width and at 390px, then 340px. Walk the contract's closing checklist against what you see:

- Real names and links; the row click follows the name's destination and the eye opens the preview.
- Preview order and endpoints follow the displayed rows; the outer header holds global navigation only, one inner record header holds the name and record actions.
- A failed save keeps the draft; a dirty cancel asks through the shared confirmation; a pending save blocks dismissal.
- Empty data and an empty filter result are different states with the right recovery.
- Actual table bounds with the panel open and closed; hidden fields reachable through the row disclosure; reader state unchanged after resizing.
- One-row scrollable tab strip with a full-width underline.
- The browser title is `<Screen> — Program Assurance`.

Take screenshots at each width and read them before concluding. A scrollable table frame alone is not responsive.

## Workflow suites

Run the suite for the family you touched (`npm run test:patterns` for the shared contract, then the domain suite named in `CLAUDE.md`), with the stack and app running. Report failures with their output rather than working around them.

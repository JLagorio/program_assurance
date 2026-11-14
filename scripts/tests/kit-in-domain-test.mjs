/**
 * What `@ledger/design-system` resolves to in the app's unit tests (vitest.app.config.ts).
 *
 * The CI app job runs those tests before the kit is built, so a test that loads the kit fails there
 * and passes on a machine that has built it. Resolving the kit to this module makes it the same
 * failure everywhere, and the message says what fixes it.
 */
throw new Error(
  [
    'A domain test loaded "@ledger/design-system".',
    "The app's unit tests run without the built kit, so this fails in CI.",
    "src/lib never imports the UI, so a module under test reached it through a file outside src/lib:",
    "mock that module, or move what the test needs into src/lib.",
  ].join("\n"),
);

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
    "Mock the module that draws with it, most often the workspace context:",
    '  vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));',
  ].join("\n"),
);

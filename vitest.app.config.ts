import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * Domain command tests do not load the TanStack Start server build, nor the design system: the CI
 * app job runs them before the kit is built. The kit resolves to a module that throws, so a test
 * that reaches it fails on every machine, built kit or not, with the fix in its message.
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@ledger\/design-system(\/.*)?$/,
        replacement: here("./scripts/tests/kit-in-domain-test.mjs"),
      },
      { find: "@", replacement: here("./src") },
    ],
  },
  test: {
    include: ["src/lib/**/*.test.ts", "src/components/prototype/use-assurance-workbench.test.ts"],
    environment: "node",
    restoreMocks: true,
    testTimeout: 60_000,
  },
});

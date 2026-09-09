import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Domain command tests do not load the TanStack Start server build. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // The WS-X90 seed grew from 120 to 640 requirements; the OSCAL and evidence
  // workflow suites assemble the whole export and need more than the 5s default.
  test: {
    include: ["src/lib/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
    testTimeout: 60_000,
  },
});

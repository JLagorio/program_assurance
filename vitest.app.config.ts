import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Domain command tests do not load the TanStack Start server build. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/lib/**/*.test.ts"], environment: "node", restoreMocks: true },
});

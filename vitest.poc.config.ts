import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./tests/fixtures/legacy-poc/src", import.meta.url)) },
  },
  test: {
    include: ["tests/fixtures/legacy-poc/src/lib/**/*.test.ts"],
    environment: "node",
    env: { VITE_DATA_BACKEND: "demo" },
    restoreMocks: true,
    testTimeout: 60_000,
  },
});

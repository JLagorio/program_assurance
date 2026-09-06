import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./.storybook/vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicit contract tags survive renamed story titles. Run the same contracts in both modes.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      maxWorkers: 3,
      projects: ["light", "dark"].map((mode) => ({
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "npm run storybook -- --no-open",
            storybookUrl: "http://localhost:6007",
            tags: { include: ["contract"] },
            initialGlobals: {
              mode: mode === "dark" ? "dark" : "light",
              viewport: {
                value: "ledgerDesktop",
                isRotated: false,
              },
            },
          }),
        ],
        test: {
          name: `storybook-${mode}`,
          maxWorkers: 3,
          setupFiles: [path.join(dirname, "test/storybook.setup.ts")],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: {
                reducedMotion: mode === "dark" ? "reduce" : "no-preference",
              },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      })),
    },
  }),
);

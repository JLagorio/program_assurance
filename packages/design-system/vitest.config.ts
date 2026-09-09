import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./.storybook/vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Storybook runs all stories by default: render checks plus any play functions, in both modes.
export default mergeConfig(
  viteConfig,
  defineConfig({
    optimizeDeps: {
      include: [
        "@base-ui/react/accordion",
        "@base-ui/react/checkbox-group",
        "@base-ui/react/menu",
        "@base-ui/react/select",
        "@base-ui/react/tabs",
      ],
    },
    test: {
      maxWorkers: 3,
      projects: ["light", "dark"].map((mode) => ({
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "npm run storybook -- --no-open",
            storybookUrl: "http://localhost:6007",
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

import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./.storybook/vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: fileURLToPath(new URL("./.storybook", import.meta.url)),
        tags: { include: ["app-contract"] },
        initialGlobals: { theme: "ledger" },
      }),
    ],
    test: {
      name: "app-stories",
      setupFiles: [
        fileURLToPath(new URL("./packages/design-system/test/storybook.setup.ts", import.meta.url)),
      ],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{ browser: "chromium" }],
      },
    },
  }),
);

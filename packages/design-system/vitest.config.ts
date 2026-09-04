import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./.storybook/vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The accessibility gate: `npm run test:a11y`. Every Matrix story (the family contracts) is
 * rendered in headless chromium and checked with axe by addon-a11y; `a11y.test: "error"` in
 * preview.tsx turns a violation into a failed test. The filter is the contract itself, the
 * export name: the vitest plugin titles each test with the story name, which Storybook derives
 * from the export (SizeMatrix becomes "Size Matrix") unless a story sets `name`, so `/Matrix$/`
 * selects exactly the exports that end in Matrix. No story file needs a tag.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "npm run storybook -- --no-open",
              storybookUrl: "http://localhost:6007",
            }),
          ],
          test: {
            name: "storybook",
            testNamePattern: /Matrix$/,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);

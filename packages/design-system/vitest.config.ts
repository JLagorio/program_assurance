import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./.storybook/vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const desktop = { value: "ledgerDesktop", isRotated: false };
const phone = { value: "ledgerPhone", isRotated: false };

// One Storybook project: every story rendered with these globals, under the shared setup file.
const storybookProject = ({
  name,
  globals,
  provide = {},
  exclude = [],
  reducedMotion,
  forcedColors = "none",
}: {
  name: string;
  globals: Record<string, unknown>;
  provide?: Record<string, unknown>;
  exclude?: string[];
  reducedMotion: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
}) => ({
  extends: true as const,
  plugins: [
    storybookTest({
      configDir: path.join(dirname, ".storybook"),
      storybookScript: "npm run storybook -- --no-open",
      storybookUrl: "http://localhost:6007",
      initialGlobals: globals,
    }),
  ],
  test: {
    name: `storybook-${name}`,
    maxWorkers: 3,
    exclude,
    provide,
    setupFiles: [path.join(dirname, "test/storybook.setup.ts")],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { reducedMotion, forcedColors } }),
      instances: [{ browser: "chromium" as const }],
    },
  },
});

// Storybook runs all stories by default: render checks plus any play functions, in both modes.
// The two layout projects render every story again, narrow, without axe (light already runs it):
// storybook-narrow at a 390px phone, and storybook-contained in a 320px frame on the desktop
// canvas (the Frame toolbar's "320px container"). test/storybook.setup.ts fails a story that
// scrolls the page sideways, breaks a word mid-word, or paints past the frame; stories that do so
// on purpose are listed in test/layout-allow.json.
export default mergeConfig(
  viteConfig,
  defineConfig({
    optimizeDeps: {
      include: [
        "@base-ui/react/accordion",
        "@base-ui/react/input",
        "@base-ui/react/field",
        "@base-ui/react/checkbox-group",
        "@base-ui/react/menu",
        "@base-ui/react/select",
        "@base-ui/react/tabs",
        "@base-ui/react/dialog",
        "@base-ui/react/drawer",
        "@base-ui/react/alert-dialog",
        "@base-ui/react/collapsible",
        "@base-ui/react/progress",
        "@base-ui/react/scroll-area",
        // Every other Base UI entry the kit imports. A module Vite first meets mid-run makes it
        // re-optimize and reload the page, which fails whole story files with "Failed to fetch
        // dynamically imported module". Keep this list in step with the imports under src/.
        "@base-ui/react/autocomplete",
        "@base-ui/react/avatar",
        "@base-ui/react/button",
        "@base-ui/react/checkbox",
        "@base-ui/react/combobox",
        "@base-ui/react/direction-provider",
        "@base-ui/react/fieldset",
        "@base-ui/react/internals/field-root-context",
        "@base-ui/react/internals/labelable-provider",
        "@base-ui/react/merge-props",
        "@base-ui/react/number-field",
        "@base-ui/react/popover",
        "@base-ui/react/preview-card",
        "@base-ui/react/radio",
        "@base-ui/react/radio-group",
        "@base-ui/react/separator",
        "@base-ui/react/switch",
        "@base-ui/react/toast",
        "@base-ui/react/toggle",
        "@base-ui/react/toggle-group",
        "@base-ui/react/tooltip",
        "@base-ui/react/use-render",
      ],
    },
    test: {
      maxWorkers: 3,
      projects: [
        ...["light", "dark", "forced-colors"].map((mode) =>
          storybookProject({
            name: mode,
            globals: { mode: mode === "dark" ? "dark" : "light", viewport: desktop },
            reducedMotion: mode === "dark" ? "reduce" : "no-preference",
            forcedColors: mode === "forced-colors" ? "active" : "none",
            // Keep high-contrast regressions on the existing family stories.
            exclude:
              mode === "forced-colors"
                ? ["**/stories/**/!(Switch|RadioGroup|Tabs|Progress).stories.tsx"]
                : [],
          }),
        ),
        ...(
          [
            ["narrow", { mode: "light", viewport: phone }],
            ["contained", { mode: "light", viewport: desktop, frame: "contained" }],
          ] as const
        ).map(([check, globals]) =>
          storybookProject({
            name: check,
            globals,
            reducedMotion: "reduce",
            provide: {
              // Storybook's own run config: skip the axe pass in these projects.
              "storybook/test-provided": { a11y: false },
              "ledger/layout-check": check,
            },
          }),
        ),
      ],
    },
  }),
);

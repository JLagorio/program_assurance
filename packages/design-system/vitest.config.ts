import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./.storybook/vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const desktop = { value: "ledgerDesktop", isRotated: false };
const phone = { value: "ledgerPhone", isRotated: false };

/** Story files of these families only, for a gate that concerns them. */
const onlyFamilies = (families: string[]) => [`**/stories/**/!(${families.join("|")}).stories.tsx`];
/** The families whose layout or keys follow the writing direction, rendered right to left by
    storybook-rtl: tables, trees and lists, the side nav's icon rail, paths and timelines, fields
    in place, toasts, tabs and toolbars. Their plays measure starts and ends and press sideways
    arrows through src/stories/_lib/direction.ts, so each passes either way the page reads. */
const RTL_FAMILIES = [
  "Badge",
  "Breadcrumb",
  "DataTable",
  "Editable",
  "Item",
  "Pagination",
  "ShellIconRail",
  "Stepper",
  "Table",
  "Tabs",
  "Timeline",
  "Toaster",
  "Toolbar",
  "Tree",
];
// Gates print their counts instead of failing when this is set (see test/storybook.setup.ts).
const record = process.env["LEDGER_GATES_RECORD"] === "1";
// The storybook/test-provided run config: skip Storybook's own axe pass in a project.
const noAxe = { "storybook/test-provided": { a11y: false } };

// One Storybook project: every story rendered with these globals, under the shared setup file.
const storybookProject = ({
  name,
  globals,
  provide = {},
  exclude = [],
  reducedMotion,
  forcedColors = "none",
  touch = false,
}: {
  name: string;
  globals: Record<string, unknown>;
  provide?: Record<string, unknown>;
  exclude?: string[];
  reducedMotion: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  touch?: boolean;
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
    provide: { "ledger/gates-record": record, ...provide },
    setupFiles: [path.join(dirname, "test/storybook.setup.ts")],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        // A touch phone: touch events, a coarse pointer and no hover.
        contextOptions: {
          reducedMotion,
          forcedColors,
          ...(touch ? { hasTouch: true, isMobile: true } : {}),
        },
      }),
      instances: [{ browser: "chromium" as const }],
    },
  },
});

// Storybook runs all stories by default: render checks plus any play functions, in both modes.
// storybook-light also measures every focus stop's ring (the focus gate), storybook-dark, which
// asks for reduced motion, checks that nothing moves (the motion gate), and
// storybook-forced-colors, which runs every story in forced colours, checks that a selected,
// pressed, current or checked item stays distinct from its siblings. Four more gate projects
// run without axe: storybook-touch (every story on a 390px touch phone: 24px targets by axe's
// target-size rule, and no hover-only controls), storybook-short (overlay families in a 320 by
// 256 window, 400% zoom), storybook-long (the families that show titles, values and stamps,
// with their text lengthened, in the 320px frame) and storybook-rtl (the direction-sensitive
// families laid out right to left by the Direction global: no physical alignment, nothing past
// the page's start, and every play passing mirrored). test/story-gates.ts says what each
// measures, and test/gates-allow.json holds the stories that predate a gate.
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
        "axe-core",
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
            provide:
              mode === "light"
                ? { "ledger/gate": "focus" }
                : mode === "forced-colors"
                  ? { "ledger/gate": "forced-colors" }
                  : { "ledger/gate": "motion" },
          }),
        ),
        storybookProject({
          name: "touch",
          globals: { mode: "light", viewport: phone },
          reducedMotion: "reduce",
          touch: true,
          provide: { ...noAxe, "ledger/gate": "touch" },
        }),
        storybookProject({
          name: "short",
          // Rendered at the phone the narrow project passes, then the gate turns the window to
          // 320 by 256 with the overlay open.
          globals: { mode: "light", viewport: phone },
          reducedMotion: "reduce",
          exclude: onlyFamilies([
            "Dialog",
            "AlertDialog",
            "Sheet",
            "Drawer",
            "Popover",
            "DropdownMenu",
            "Select",
            "Combobox",
            "Command",
            "CommandPalette",
            "SearchDialog",
            "DatePicker",
            "DateRangePicker",
            "PickerSheet",
            "RecordBrowser",
            "PreviewSheet",
            "Toaster",
            "Forms",
          ]),
          provide: { ...noAxe, "ledger/gate": "short" },
        }),
        storybookProject({
          name: "long",
          globals: { mode: "light", viewport: desktop, frame: "contained" },
          reducedMotion: "reduce",
          exclude: onlyFamilies([
            "Dialog",
            "AlertDialog",
            "Sheet",
            "Empty",
            "Card",
            "Select",
            "Timeline",
            "KeyValue",
            "Fact",
            "Badge",
            "Related",
            "Banner",
            "Text",
            "Typography",
            "RecordPicker",
            "Item",
            "Tabs",
            "Breadcrumb",
            "Toaster",
            "Alert",
            "PageHeader",
            "Section",
            "Attachment",
            "Stat",
            "Id",
            "TaskRow",
            "Glance",
          ]),
          provide: { ...noAxe, "ledger/gate": "long" },
        }),
        storybookProject({
          name: "rtl",
          globals: { mode: "light", viewport: desktop, direction: "rtl" },
          reducedMotion: "reduce",
          exclude: onlyFamilies(RTL_FAMILIES),
          provide: { ...noAxe, "ledger/gate": "rtl" },
        }),
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
            provide: { ...noAxe, "ledger/layout-check": check },
          }),
        ),
      ],
    },
  }),
);

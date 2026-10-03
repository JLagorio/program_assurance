import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import { TooltipProvider } from "../src/components/tooltip";
import { LedgerProvider } from "../src/lib/locale";
import "../src/styles/storybook.css";

/**
 * The toolbar axes: Design and Mode, per the spec's Axes section, and Frame (below).
 * Mode sets `data-color-mode` on <html>: light, dark, or system (attribute removed so the
 * prefers-color-scheme block in tokens.css decides). Design has one entry until a second
 * design exists; it is here so the toolbar shape does not change later.
 */
function ModeSync({ mode }: { mode: string }) {
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") delete root.dataset["colorMode"];
    else root.dataset["colorMode"] = mode;
  }, [mode]);
  return null;
}

const withMode: Decorator = (Story, ctx) => (
  <>
    <ModeSync mode={String(ctx.globals["mode"] ?? "light")} />
    <Story />
  </>
);

/**
 * The Contrast axis sets `data-contrast-mode` on <html>: "no-preference" pins the standard
 * contrast, "more" the increased one, and system removes the attribute so the
 * prefers-contrast: more block in tokens.css decides.
 */
function ContrastSync({ contrast }: { contrast: string }) {
  useEffect(() => {
    const root = document.documentElement;
    if (contrast === "system") delete root.dataset["contrastMode"];
    else root.dataset["contrastMode"] = contrast;
  }, [contrast]);
  return null;
}

const withContrast: Decorator = (Story, ctx) => (
  <>
    <ContrastSync contrast={String(ctx.globals["contrast"] ?? "no-preference")} />
    <Story />
  </>
);

/**
 * The Direction axis lays every story out right to left: `dir="rtl"` on <html>, so a popup that
 * portals to the body mirrors too, and `direction="rtl"` on the LedgerProvider, so a part that
 * reads the direction (the arrow keys, a tooltip's side, a chevron) follows. The storybook-rtl
 * test project renders the direction-sensitive families this way. Set before the story renders,
 * so its first paint and its play are already right to left.
 */
const directionOf = (ctx: { globals: Record<string, unknown> }) =>
  ctx.globals["direction"] === "rtl" ? "rtl" : "ltr";

/** One tooltip provider per page, as the Shell mounts for a product: the second tooltip shows at once. */
const withTooltips: Decorator = (Story, ctx) => {
  const direction = directionOf(ctx);
  if (typeof document !== "undefined") {
    if (direction === "rtl") document.documentElement.dir = "rtl";
    else document.documentElement.removeAttribute("dir");
  }
  return (
    <LedgerProvider {...(direction === "rtl" ? { direction } : {})}>
      <TooltipProvider delay={300} timeout={300}>
        <Story />
      </TooltipProvider>
    </LedgerProvider>
  );
};

/**
 * The Frame axis puts the story in a 320px container on the canvas, standing in for a panel or a
 * rail: a part responds to the space it is given, not the window. The dashed line is the frame's
 * edge. A fullscreen story is page-level (a Shell, a page, a register that fills the window) and
 * keeps the whole canvas. The storybook-contained test project renders every story this way.
 */
const withFrame: Decorator = (Story, ctx) =>
  ctx.globals["frame"] === "contained" && ctx.parameters["layout"] !== "fullscreen" ? (
    <div
      data-ledger-frame="contained"
      style={{
        width: 320,
        maxWidth: "100%",
        outline: "1px dashed var(--ds-color-border-bold)",
      }}
    >
      <Story />
    </div>
  ) : (
    <Story />
  );

const preview: Preview = {
  parameters: {
    layout: "padded",
    viewport: {
      options: {
        ledgerNarrow: { name: "Narrow (320 CSS px)", styles: { width: "320px", height: "900px" } },
        ledgerSmall: {
          name: "Small phone (340 CSS px)",
          styles: { width: "340px", height: "740px" },
        },
        ledgerPhone: { name: "Phone (390 CSS px)", styles: { width: "390px", height: "844px" } },
        ledgerDesktop: { name: "Desktop", styles: { width: "1200px", height: "900px" } },
        ledgerWide: { name: "Wide (1440 CSS px)", styles: { width: "1440px", height: "900px" } },
      },
    },
    backgrounds: { disable: true },
    // Run accessibility checks alongside each story’s render and interaction checks.
    a11y: { test: "error" },
    options: {
      storySort: {
        method: "alphabetical",
        locales: "en-US",
        order: [
          "Introduction",
          "Guidance",
          // Reading order, as llms.txt has it: set up, choose a part, compose it, style it, the rest.
          [
            "Getting started",
            "Choosing a part",
            "Recipes",
            "Which token",
            "Agents",
            "Coming from shadcn",
            "Upgrading",
            "Token grammar",
            "Lint rules",
            "Lint rules reference",
            "Writing stories",
            "Testing and review",
          ],
          "Tokens",
          "Primitives",
          ["Overview"],
          "Components",
          "Layout",
          ["Shell", "Pages", "PageHeader", "Section", "PageSkeleton"],
          "Patterns",
        ],
      },
    },
  },
  globalTypes: {
    viewport: { description: "Preview dimensions" },
    design: {
      description: "Design",
      toolbar: {
        title: "Design",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [{ value: "ledger", title: "Ledger" }],
      },
    },
    frame: {
      description: "Frame",
      toolbar: {
        title: "Frame",
        icon: "sidebaralt",
        dynamicTitle: true,
        items: [
          { value: "canvas", title: "Canvas" },
          { value: "contained", title: "320px container" },
        ],
      },
    },
    mode: {
      description: "Colour mode",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "Match system" },
        ],
      },
    },
    direction: {
      description: "Direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        dynamicTitle: true,
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
      },
    },
    contrast: {
      description: "Contrast",
      toolbar: {
        title: "Contrast",
        icon: "contrast",
        dynamicTitle: true,
        items: [
          { value: "no-preference", title: "Standard contrast" },
          { value: "more", title: "Increased contrast" },
          { value: "system", title: "Match system" },
        ],
      },
    },
  },
  initialGlobals: {
    design: "ledger",
    mode: "light",
    contrast: "no-preference",
    frame: "canvas",
    direction: "ltr",
  },
  decorators: [withFrame, withMode, withContrast, withTooltips],
};

export default preview;

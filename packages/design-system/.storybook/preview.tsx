import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import { LedgerProvider } from "../src/lib/locale";
import { TooltipProvider } from "../src/components/tooltip";
import "../src/styles/storybook.css";

/**
 * Two toolbar axes, per the spec's Axes section.
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

/** One tooltip provider per page, as the Shell mounts for a product: the second tooltip shows at once. */
const withTooltips: Decorator = (Story) => (
  <LedgerProvider>
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  </LedgerProvider>
);

const preview: Preview = {
  parameters: {
    layout: "padded",
    viewport: {
      options: {
        ledgerNarrow: { name: "Narrow (320 CSS px)", styles: { width: "320px", height: "900px" } },
        ledgerDesktop: { name: "Desktop", styles: { width: "1200px", height: "900px" } },
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
          ["Getting started", "Token grammar", "Lint rules"],
          "Tokens",
          "Primitives",
          ["Overview"],
          "Components",
          "Patterns",
          ["Pages"],
          "Shell",
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
  },
  initialGlobals: { design: "ledger", mode: "light" },
  decorators: [withMode, withTooltips],
};

export default preview;

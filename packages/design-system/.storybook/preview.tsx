import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

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

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: ["Introduction", "Guidance", ["Getting started", "Token grammar", "Lint rules"], "Tokens", "Primitives", ["Overview"], "Components"],
      },
    },
  },
  globalTypes: {
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
  decorators: [withMode],
};

export default preview;

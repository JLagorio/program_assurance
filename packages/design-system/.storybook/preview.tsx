import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import "../src/styles/storybook.css";

/**
 * Two toolbar axes, per the spec's Axes section.
 * Mode sets `data-color-mode` on <html>: light, dark, or system (attribute removed so the
 * prefers-color-scheme block in tokens.css decides). Design has one entry until a second
 * design exists; it is here so the toolbar shape does not change later.
 */
function ModeSync({ mode, density }: { mode: string; density: string }) {
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") delete root.dataset["colorMode"];
    else root.dataset["colorMode"] = mode;
    if (density === "compact") root.dataset["density"] = "compact";
    else delete root.dataset["density"];
  }, [mode, density]);
  return null;
}

const withMode: Decorator = (Story, ctx) => (
  <>
    <ModeSync
      mode={String(ctx.globals["mode"] ?? "light")}
      density={String(ctx.globals["density"] ?? "default")}
    />
    <Story />
  </>
);

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Guidance",
          ["Getting started", "Token grammar", "Lint rules"],
          "Tokens",
          "Primitives",
          ["Overview"],
          "Components",
        ],
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
    density: {
      description: "Row density",
      toolbar: {
        title: "Density",
        icon: "menu",
        dynamicTitle: true,
        items: [
          { value: "default", title: "Comfortable" },
          { value: "compact", title: "Compact" },
        ],
      },
    },
  },
  initialGlobals: { design: "ledger", mode: "light", density: "default" },
  decorators: [withMode],
};

export default preview;

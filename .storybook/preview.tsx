import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import "../src/styles.css";
import "./themes/nightwatch.css";
import "./themes/linear-refined.css";
import "./themes/nova.css";
import { PreviewRouter } from "./router";

/**
 * Theme toolbar. "ledger" is the app as shipped. The other two are preview-only
 * token overlays copied from the UI kit so a component can be flipped between
 * candidates while we decide; nothing here touches src/styles.css. Storybook
 * opens in Linear-refined, the current leaning.
 */
function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "ledger") delete root.dataset["theme"];
    else root.dataset["theme"] = theme;
  }, [theme]);
  return null;
}

const withTheme: Decorator = (Story, ctx) => (
  <>
    <ThemeSync theme={String(ctx.globals["theme"] ?? "ledger")} />
    <Story />
  </>
);

const withRouter: Decorator = (Story) => (
  <PreviewRouter>
    <Story />
  </PreviewRouter>
);

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    controls: { matchers: { color: /(background|color)$/i } },
  },
  globalTypes: {
    theme: {
      description: "Token sheet",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "ledger", title: "Ledger (current)" },
          { value: "nightwatch", title: "Nightwatch (dark)" },
          { value: "linear", title: "Linear-refined" },
          { value: "nova", title: "Nova (shadcn preset)" },
        ],
      },
    },
  },
  initialGlobals: { theme: "linear" },
  decorators: [withTheme, withRouter],
};

export default preview;

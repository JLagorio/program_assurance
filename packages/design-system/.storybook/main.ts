import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";

import { docgenOptions } from "./docgen.mjs";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    // GFM tables in MDX are opt-in since Storybook 8.
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-mcp",
  ],
  typescript: {
    // A part's own props and the Base UI props it inherits, never the DOM's own attributes;
    // docgen.mjs holds the options, which llms.txt shares.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: docgenOptions,
  },
};

export default config;

import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    // GFM tables in MDX are opt-in since Storybook 8.
    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  typescript: {
    // The props tables come from the types: unions become selects, JSDoc becomes the description,
    // defaults come from the destructuring. The DOM's own props are left out.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;

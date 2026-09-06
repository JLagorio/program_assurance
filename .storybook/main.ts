import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {
      // The app's vite.config.ts is the Lovable TanStack Start bundle (SSR, Nitro).
      // Storybook gets its own minimal config instead of inheriting it.
      builder: { viteConfigPath: ".storybook/vite.config.ts" },
    },
  },
  stories: ["../src/stories/**/*.mdx", "../src/stories/**/*.stories.@(ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
};

export default config;

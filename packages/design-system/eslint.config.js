import tseslint from "typescript-eslint";

import ledger from "./eslint-plugin/index.js";

export default tseslint.config(
  { ignores: ["src/generated/**", "storybook-static/**", "node_modules/**"] },
  {
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  ...ledger.configs.package.map((c) => ({ files: ["src/**/*.{ts,tsx}"], ...c })),
);

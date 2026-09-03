import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import ledger from "./packages/design-system/eslint-plugin/index.js";

const SERVER_ONLY = {
  name: "server-only",
  message:
    "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
};

// The product: routes, app components, domain code and the router. Reference kits and stories are not the product.
const PRODUCT = [
  "src/routes/**/*.{ts,tsx}",
  "src/components/app/**/*.{ts,tsx}",
  "src/lib/**/*.{ts,tsx}",
  "src/router.tsx",
];

export default tseslint.config(
  {
    ignores: [
      // @ledger/design-system lints itself with its own preset (npm run lint in packages/design-system)
      "packages",
      "dist",
      ".output",
      ".vinxi",
      "storybook-static",
      // gitignored output; not source
      ".wrangler",
      ".tanstack",
      ".nitro",
      "Program Assurance UI Kit",
      "docs/examples",
      "docs/examples.superpowers",
      "src/lib/nist-catalog.ts",
      "src/lib/nist-control-text.ts",
      // look-only reference kits (shadcn preset, reui) and their samples; not the product and not on the tokens
      "src/components/ui",
      "src/components/reui",
      "src/components/examples",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [SERVER_ONLY],
          patterns: [
            {
              group: ["@/ds", "@/ds/*"],
              message:
                "The kit is @ledger/design-system; the product shell is @/components/app/shell.",
            },
            {
              group: [
                "@/components/app/ui",
                "@/components/app/shapes",
                "@/components/app/compositions",
                "@/components/ui/*",
                "@/components/reui/*",
              ],
              message:
                "Product code imports the kit from @ledger/design-system, not a reference kit.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // The product assembles the kit on its tokens: the package preset plus the three assembly rules.
    files: PRODUCT,
    extends: ledger.configs.recommended,
    rules: {},
  },
  {
    // The reference sampler renders the shadcn preset on purpose.
    files: ["src/stories/reference/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // The product shell composes the package's Shell parts and keeps the name; it is the one intentional shadow.
    files: ["src/components/app/shell.tsx"],
    rules: { "ledger/no-kit-shadow": "off" },
  },
  {
    // Stories export a default meta object plus named story objects by design; story helpers export hooks alongside components.
    files: ["src/stories/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  eslintPluginPrettier,
);

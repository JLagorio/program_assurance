import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import ledger from "./eslint-plugin/index.js";

/**
 * A story's `render` is a component: Storybook renders it as one, so a hook inside it is where a
 * story keeps its own state. rules-of-hooks names components by their capital letter and reports
 * hooks in a lowercase `render`; in a stories file that one report is dropped, every other stands.
 */
const storyRenders = (definition) => ({
  ...definition,
  create(context) {
    if (!/\.stories\.tsx?$/.test(context.filename)) return definition.create(context);
    const proxy = Object.create(context, {
      report: {
        value: (descriptor) => {
          if (/ is called in function "render" that is neither/.test(descriptor.message ?? ""))
            return;
          context.report(descriptor);
        },
      },
    });
    return definition.create(proxy);
  },
});
const hooks = {
  meta: reactHooks.meta,
  rules: {
    ...reactHooks.rules,
    "rules-of-hooks": storyRenders(reactHooks.rules["rules-of-hooks"]),
  },
};

// The package is held to the bar its consumer is (TOO-6): ESLint's and typescript-eslint's
// recommended rules and the rules of hooks, beside the ledger preset. A report is fixed at its
// site: the package keeps no eslint-suppressions.json, which ESLint would apply by itself, and
// scripts/check-allow-lists.mjs refuses one.
export default tseslint.config(
  { ignores: ["src/generated/**", "dist/**", "storybook-static/**", "node_modules/**"] },
  // A disable that silences nothing fails the run, so a fixed site loses its comment with its fix.
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // A warning while the intentional cases gain an inline reason; then an error.
      "react-hooks/exhaustive-deps": "warn",
      // A leading underscore names what a destructure leaves out on purpose.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  ...ledger.configs.package.map((c) => ({ files: ["src/**/*.{ts,tsx}"], ...c })),
);

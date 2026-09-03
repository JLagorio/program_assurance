import fs from "node:fs";
import path from "node:path";

import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import ledger from "./packages/design-system/eslint-plugin/index.js";

/* ------------------------------------------------------------ Product rules
   The design system's own plugin (packages/design-system/eslint-plugin) holds the token rules:
   every class is a token utility or a documented structural one, no margins, no arbitrary
   values, layout through the primitives. The three rules below are about how this product
   assembles the kit, and read the kit's names from the package so the list never drifts. */

const PACKAGE_SRC = "packages/design-system/src";
function kitNames() {
  const names = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p))
        for (const m of fs
          .readFileSync(p, "utf8")
          .matchAll(/^export (?:function|const) ([A-Z]\w*)/gm))
          names.add(m[1]);
    }
  };
  for (const layer of ["primitives", "components", "patterns", "shapes", "shell"])
    if (fs.existsSync(path.join(PACKAGE_SRC, layer))) walk(path.join(PACKAGE_SRC, layer));
  return names;
}
const KIT = kitNames();
// names the kit used before the vocabulary; a local copy under one of these is a copy of the kit component named
const LEGACY = {
  Dash: "Absent",
  Notice: "Alert",
  Modal: "Dialog",
  Menu: "DropdownMenu",
  Meter: "Progress",
  EmptyState: "Empty",
  SegmentedControl: "ToggleGroup",
  Disclosure: "Collapsible",
  Radio: "RadioGroup",
  Mono: "Id",
  IdList: "Id.List",
  IdCell: "Table.Id",
  Severity: "Indicator",
  Label: "Eyebrow",
  Tile: "Stat.Tile",
  Tiles: "Tiles",
  TabStrip: "Tabs",
  RailGroup: "Inspector.Group",
  CardHeader: "Card.Header",
  StackedBar: "Progress.Stacked",
  AvatarStack: "Avatar.Stack",
  MenuItem: "DropdownMenu.Item",
  MenuLabel: "DropdownMenu.Label",
  RelatedCard: "Related",
  RelatedRow: "Related.Row",
  WorkPaneRow: "WorkPane.Row",
  TreeCell: "Table.Tree",
  Facts: "Fact.Group",
};

// neutral colour, weight and type tokens a table cell may not carry; a status colour (text-danger, text-warning…) is data, not design
const CELL_FORBIDDEN =
  /^(text-(default|subtle|subtlest|brand|selected|inverse|disabled)|font-(body(-large|-small|-xsmall)?|heading-\w+|code|medium|semibold|regular))$/;

function jsxName(node) {
  if (!node) return "";
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") return `${jsxName(node.object)}.${node.property.name}`;
  return "";
}

// every string literal reachable inside an attribute value: "a b", cn("a", x && "b"), `a ${b}`
function stringLiterals(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push(node.value);
      break;
    case "TemplateLiteral":
      for (const q of node.quasis) out.push(q.value.cooked ?? "");
      for (const e of node.expressions) stringLiterals(e, out);
      break;
    case "JSXExpressionContainer":
      stringLiterals(node.expression, out);
      break;
    case "CallExpression":
      for (const a of node.arguments) stringLiterals(a, out);
      break;
    case "ConditionalExpression":
      stringLiterals(node.consequent, out);
      stringLiterals(node.alternate, out);
      break;
    case "LogicalExpression":
      stringLiterals(node.right, out);
      break;
    case "ArrayExpression":
      for (const el of node.elements) stringLiterals(el, out);
      break;
    default:
      break;
  }
  return out;
}

function classNameAttr(node) {
  return node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === "className");
}

const kit = {
  rules: {
    "cell-plain": {
      meta: {
        type: "problem",
        docs: { description: "A Table.Cell carries no colour, weight or type token" },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (jsxName(node.name) !== "Table.Cell") return;
            const attr = classNameAttr(node);
            if (!attr) return;
            const bad = stringLiterals(attr.value)
              .flatMap((s) => s.split(/\s+/))
              .filter((t) => CELL_FORBIDDEN.test(t));
            if (bad.length)
              context.report({
                node: attr,
                message: `Table.Cell is one style. Drop ${bad.join(", ")}; only Badge, Dot, Indicator or a status colour may differ.`,
              });
          },
        };
      },
    },
    "id-not-blue": {
      meta: {
        type: "problem",
        docs: { description: "An Id is blue only inside a link or button" },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (jsxName(node.name) !== "Id") return;
            const attr = classNameAttr(node);
            if (!attr) return;
            if (!stringLiterals(attr.value).some((s) => /(^|\s)text-brand(\s|$)/.test(s))) return;
            for (let p = node.parent; p; p = p.parent) {
              if (
                p.type === "JSXElement" &&
                /^(Link|a|button|Button)$/.test(jsxName(p.openingElement.name))
              )
                return;
            }
            context.report({
              node: attr,
              message:
                "A bare Id is never blue. Blue means link: wrap it in Link or button, or drop text-brand.",
            });
          },
        };
      },
    },
    "no-kit-shadow": {
      meta: {
        type: "problem",
        docs: { description: "Domain files import kit components instead of declaring their own" },
      },
      create(context) {
        const check = (id) => {
          if (!id) return;
          if (KIT.has(id.name))
            context.report({
              node: id,
              message: `${id.name} is a kit component. Import it from @ledger/design-system instead of declaring a local copy.`,
            });
          else if (LEGACY[id.name])
            context.report({
              node: id,
              message: `${id.name} is ${LEGACY[id.name]} in the kit. Import that instead of declaring a local copy.`,
            });
        };
        const topLevel = (n) => n.type === "Program" || n.type === "ExportNamedDeclaration";
        return {
          FunctionDeclaration(node) {
            if (topLevel(node.parent)) check(node.id);
          },
          VariableDeclarator(node) {
            if (
              node.id.type === "Identifier" &&
              node.init &&
              /FunctionExpression$/.test(node.init.type) &&
              node.parent.parent &&
              topLevel(node.parent.parent)
            )
              check(node.id);
          },
        };
      },
    },
  },
};

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
      kit,
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
    rules: {
      "kit/no-kit-shadow": "error",
      "kit/cell-plain": "error",
      "kit/id-not-blue": "error",
    },
  },
  {
    // The reference sampler renders the shadcn preset on purpose.
    files: ["src/stories/reference/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // The product shell composes the package's Shell parts and keeps the name; it is the one intentional shadow.
    files: ["src/components/app/shell.tsx"],
    rules: { "kit/no-kit-shadow": "off" },
  },
  {
    // Stories export a default meta object plus named story objects by design; story helpers export hooks alongside components.
    files: ["src/stories/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  eslintPluginPrettier,
);

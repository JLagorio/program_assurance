import fs from "node:fs";
import path from "node:path";

import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/* ------------------------------------------------------------ Ledger rules
   The design system's rules as lint, so they hold without a sweep.
   Kit names are read from src/ds at config load, so the list never drifts. */

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
  if (fs.existsSync("src/ds")) walk("src/ds");
  return names;
}
const KIT = kitNames();
// names the kit used before the vocabulary; a local copy under one of these is a copy of the kit component named
const LEGACY = {
  Dash: "Empty",
  Mono: "Id",
  IdList: "Id.List",
  IdCell: "Table.Id",
  Severity: "Indicator",
  Label: "Eyebrow",
  Tile: "Stat.Tile",
  Tiles: "Stat.Grid",
  TabStrip: "Tabs",
  RailGroup: "Inspector.Group",
  CardHeader: "Card.Header",
  StackedBar: "Meter.Stacked",
  AvatarStack: "Avatar.Stack",
  MenuItem: "Menu.Item",
  MenuLabel: "Menu.Label",
  RelatedCard: "Related",
  RelatedRow: "Related.Row",
  WorkPaneRow: "WorkPane.Row",
};

// colour, weight and size tokens a table cell may not carry
const CELL_FORBIDDEN =
  /^(text-(muted-foreground|foreground|primary|secondary-foreground|\[1\d(\.\d+)?px\]|1[0-9]|xs|sm|base|lg)|font-(medium|semibold|bold|mono))(\/\d+)?$/;

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

const ledger = {
  rules: {
    "cell-plain": {
      meta: {
        type: "problem",
        docs: { description: "A Table.Cell carries no colour, weight or size token" },
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
                message: `Table.Cell is one style. Drop ${bad.join(", ")}; only Badge, Dot, Indicator or text-danger may differ.`,
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
            if (!stringLiterals(attr.value).some((s) => /(^|\s)text-primary(\s|$)/.test(s))) return;
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
                "A bare Id is never blue. Blue means link: wrap it in Link or button, or drop text-primary.",
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
              message: `${id.name} is a kit component. Import it from @/ds instead of declaring a local copy.`,
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

/* Layers only look down. Each folder may import from the layers below it, from
   `@/lib/utils`, and from third parties. App code imports a layer's index, never
   a file inside it. */
const SERVER_ONLY = {
  name: "server-only",
  message:
    "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
};
const restricted = (patterns) => [
  "error",
  {
    paths: [SERVER_ONLY],
    patterns: patterns.map((p) => (typeof p === "string" ? { group: [p] } : p)),
  },
];
const APP_ONLY = ["@/routes/*", "@/components/*", "@/lib/*", "!@/lib/utils"];
const layer = (dir, above, message) => ({
  files: [`src/ds/${dir}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": restricted([
      {
        group: [...above.flatMap((l) => [`@/ds/${l}`, `@/ds/${l}/*`, `../${l}/*`]), ...APP_ONLY],
        message,
      },
    ]),
  },
});

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "storybook-static",
      // gitignored tooling output; not source
      ".ds-sync",
      "ds-bundle",
      ".design-sync/.cache",
      ".design-sync/learnings",
      ".wrangler",
      ".tanstack",
      ".nitro",
      "Program Assurance UI Kit",
      "docs/examples",
      "docs/examples.superpowers",
      "src/lib/nist-catalog.ts",
      "src/lib/nist-control-text.ts",
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
      ledger,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": restricted([
        {
          group: ["@/ds/*/*", "!@/ds/*/index"],
          message:
            "Import a layer's index (@/ds/primitives, @/ds/patterns, @/ds/shapes, @/ds/shell), not a file inside it.",
        },
        {
          group: [
            "@/components/app/ui",
            "@/components/app/shapes",
            "@/components/app/shell",
            "@/components/app/compositions",
          ],
          message: "The kit moved to src/ds. Import from @/ds/<layer>.",
        },
      ]),
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Routes, domain files and stories assemble the kit: they never redeclare it, never colour a
    // cell, and never paint an Id blue outside a link. The kit itself defines those behaviours.
    files: [
      "src/routes/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/stories/**/*.{ts,tsx}",
    ],
    ignores: ["src/components/ui/**"],
    rules: {
      "ledger/no-kit-shadow": "error",
      "ledger/cell-plain": "error",
      "ledger/id-not-blue": "error",
    },
  },
  layer(
    "primitives",
    ["patterns", "shapes", "shell"],
    "Primitives know only tokens and each other.",
  ),
  layer(
    "patterns",
    ["shapes", "shell"],
    "Patterns are built from primitives; they never reach up to shapes or the shell.",
  ),
  layer("shapes", ["shell"], "Shapes never import the shell."),
  layer("shell", [], "The shell imports the layers below it and the router, nothing from the app."),
  {
    // Stories export a default meta object plus named story objects by design; story helpers
    // export hooks alongside components; kit files export compound families via Object.assign.
    files: ["src/stories/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}", "src/ds/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  eslintPluginPrettier,
);

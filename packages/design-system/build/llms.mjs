// Generate `llms.txt`: the Storybook's pages, with the props tables their `<ArgTypes>` render, the
// token sheet and the public export list in one plain text file, so an agent without the running
// Storybook or its MCP server reads the same contract. Keep this file build-only; the output is
// committed and tested for drift.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { docgenOptions } from "../.storybook/docgen.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storiesRoot = path.join(root, "src/stories");
export const llmsPath = path.join(root, "llms.txt");

// Section order for the file; folders not listed come last, alphabetically.
const ORDER = ["docs", "tokens", "primitives", "components", "layout", "patterns"];
// Guidance in reading order: set up, choose a part, compose it, style it, then the rest.
const DOCS_ORDER = [
  "Introduction",
  "GettingStarted",
  "Choosing",
  "Recipes",
  "WhichToken",
  "Agents",
  "FromShadcn",
  "Grammar",
  "Lint",
  "LintRules",
  "Stories",
  "TestingAndReview",
];

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );

const rank = (list, value) => {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
};

export function pageFiles() {
  return walk(storiesRoot)
    .filter((file) => file.endsWith(".mdx"))
    .sort((a, b) => {
      const [folderA, folderB] = [a, b].map(
        (f) => path.relative(storiesRoot, f).split(path.sep)[0],
      );
      if (folderA !== folderB) {
        const byOrder = rank(ORDER, folderA) - rank(ORDER, folderB);
        return byOrder || folderA.localeCompare(folderB);
      }
      const [stemA, stemB] = [a, b].map((f) => path.basename(f, ".mdx"));
      if (folderA === "docs") {
        const byOrder = rank(DOCS_ORDER, stemA) - rank(DOCS_ORDER, stemB);
        if (byOrder) return byOrder;
      }
      return stemA.localeCompare(stemB);
    });
}

/** A page's Storybook title: `<Meta title>` on the page, else the `title` of the stories file it attaches to. */
export function pageTitle(file, source) {
  const own = /<Meta\s+title="([^"]+)"/.exec(source)?.[1];
  if (own) return own;
  const attached = /<Meta\s+of=\{(\w+)\}/.exec(source)?.[1];
  const imported =
    attached && new RegExp(`import \\* as ${attached} from "([^"]+)"`).exec(source)?.[1];
  if (imported) {
    const storiesFile = path.resolve(path.dirname(file), `${imported}.tsx`);
    if (fs.existsSync(storiesFile)) {
      const title = /\btitle:\s*"([^"]+)"/.exec(fs.readFileSync(storiesFile, "utf8"))?.[1];
      if (title) return title;
    }
  }
  return path.basename(file, ".mdx");
}

/**
 * Turn one MDX page into Markdown: drop the page's own imports and Meta, describe the rendered
 * blocks. A fenced code example passes through whole, its import lines included, since those are
 * what an agent copies. `propsOf(name, source, file)` gives an `<ArgTypes of={name} />` block its
 * props table as Markdown; without one, or when it has none, the block says where the props are.
 */
export function pageToMarkdown(source, file = "page.mdx", propsOf = () => null) {
  const title = pageTitle(file, source);
  const lines = source.split("\n");
  const out = [];
  let skippingImport = false;
  let fence = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (marker && !skippingImport) {
      fence = marker;
      out.push(line);
      continue;
    }
    if (skippingImport) {
      if (/from\s+"[^"]+";?\s*$/.test(line) || /;\s*$/.test(line)) skippingImport = false;
      continue;
    }
    if (/^import\s/.test(line)) {
      if (!/from\s+"[^"]+";?\s*$/.test(line)) skippingImport = true;
      continue;
    }
    if (/^<Meta\b/.test(line)) continue;
    // A comment for the page's editors, such as a generated block's markers.
    if (/^\{\/\*.*\*\/\}$/.test(line.trim())) continue;
    const argTypes = /^<ArgTypes\s+of=\{([^}]+)\}\s*\/>/.exec(line);
    if (argTypes) {
      out.push(
        propsOf(argTypes[1], source, file) ??
          `_Props: generated from \`${argTypes[1]}\`; the Storybook page and the package's \`.d.ts\` list them._`,
      );
      continue;
    }
    const story = /^<(Canvas|Story|Source)\s+of=\{([^}]+)\}[^>]*\/>/.exec(line);
    if (story) {
      out.push(`_Example: story \`${story[2]}\`._`);
      continue;
    }
    const block = /^<([A-Z][\w.]*)\b[^>]*\/>\s*$/.exec(line);
    if (block) {
      out.push(`_Rendered in the Storybook: ${block[1]}._`);
      continue;
    }
    out.push(line);
  }
  const body = out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, body };
}

/* ---------- props tables: the docgen the Storybook runs, with its options ---------- */

// Where the kit's parts are declared: every source module but the stories, the generated files and
// the plain re-export barrels (`index.ts`), which document nothing of their own.
const SOURCE_DIRS = ["primitives", "components", "layout", "patterns", "mode", "lib"];
const RESOLVE_AS = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];

/** One module's top-level names: declared, imported, re-exported, and compounds built by Object.assign. */
function moduleNames(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const names = { declared: new Set(), linked: new Map(), stars: [], members: new Map() };
  const specifier = (node) => (node && ts.isStringLiteral(node) ? node.text : undefined);
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      if (statement.name) names.declared.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        names.declared.add(declaration.name.text);
        // `const Stat = Object.assign(StatRoot, { Grid: StatGrid, Tile })`
        const init = declaration.initializer;
        if (!init || !ts.isCallExpression(init)) continue;
        const parts = init.arguments[1];
        if (
          init.expression.getText(source) !== "Object.assign" ||
          !parts ||
          !ts.isObjectLiteralExpression(parts)
        )
          continue;
        const members = new Map();
        for (const property of parts.properties) {
          if (ts.isShorthandPropertyAssignment(property))
            members.set(property.name.text, property.name.text);
          else if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.initializer))
            members.set(property.name.getText(source), property.initializer.text);
        }
        names.members.set(declaration.name.text, members);
      }
    } else if (ts.isImportDeclaration(statement)) {
      const from = specifier(statement.moduleSpecifier);
      const bindings = statement.importClause?.namedBindings;
      if (from && bindings && ts.isNamedImports(bindings))
        for (const element of bindings.elements)
          names.linked.set(element.name.text, {
            from,
            name: (element.propertyName ?? element.name).text,
          });
    } else if (ts.isExportDeclaration(statement)) {
      const from = specifier(statement.moduleSpecifier);
      const clause = statement.exportClause;
      if (!clause) {
        if (from) names.stars.push(from);
      } else if (ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          const name = (element.propertyName ?? element.name).text;
          // `export { Local as Public }` points at a local name; with `from`, at that module's.
          if (from || name !== element.name.text)
            names.linked.set(element.name.text, { from, name });
        }
      }
    }
  }
  return names;
}

/** The docgen tables for every part, and a resolver from an `<ArgTypes of>` name to its table. */
function propsTables() {
  const walkSource = (dir) =>
    walk(dir).filter(
      (file) =>
        /\.tsx?$/.test(file) &&
        !/\.d\.ts$/.test(file) &&
        path.basename(file) !== "index.ts" &&
        !file.includes(`${path.sep}stories${path.sep}`),
    );
  // Sorted, so the program checks the files, and orders each union's members, the same way on
  // every file system.
  const files = SOURCE_DIRS.flatMap((dir) => walkSource(path.join(root, "src", dir))).sort();
  // The Storybook's own copy, through the framework that runs it.
  const { withCustomConfig } = createRequire(
    import.meta.resolve("@storybook/react-vite/package.json"),
  )("react-docgen-typescript");
  const docs = new Map();
  for (const doc of withCustomConfig(path.join(root, "tsconfig.json"), docgenOptions).parse(files))
    docs.set(`${path.resolve(doc.filePath)}#${doc.displayName}`, doc);

  const modules = new Map();
  const namesOf = (file) => {
    if (!modules.has(file)) modules.set(file, moduleNames(file));
    return modules.get(file);
  };
  const resolveModule = (from, spec) => {
    if (!spec?.startsWith(".")) return undefined;
    const base = path.resolve(path.dirname(from), spec);
    return RESOLVE_AS.map((suffix) => base + suffix).find(
      (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
  };
  /** The module and name that declare `name` as `file` sees it, through imports and re-exports. */
  const declaration = (file, name, seen = new Set()) => {
    const key = `${file}#${name}`;
    if (!file || seen.has(key)) return undefined;
    seen.add(key);
    const names = namesOf(file);
    const link = names.linked.get(name);
    if (link)
      return declaration(link.from ? resolveModule(file, link.from) : file, link.name, seen);
    if (names.declared.has(name)) return { file, name };
    for (const star of names.stars) {
      const found = declaration(resolveModule(file, star), name, seen);
      if (found) return found;
    }
    return undefined;
  };
  /** What a page's name refers to: its own import of the root, then each compound member. */
  const target = (name, source, page) => {
    const [head, ...members] = name.split(".");
    let at;
    for (const [, bindings, from] of source.matchAll(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)"/gm))
      for (const binding of bindings.split(",")) {
        const [imported, local = imported] = binding.split(/\s+as\s+/).map((s) => s.trim());
        if (local === head) at = declaration(resolveModule(page, from), imported);
      }
    at ??= declaration(path.join(root, "src/index.ts"), head);
    for (const member of members) {
      const value = at && namesOf(at.file).members.get(at.name)?.get(member);
      at = value ? declaration(at.file, value) : undefined;
    }
    return at && docs.get(`${at.file}#${at.name}`);
  };

  const cell = (text) =>
    String(text ?? "")
      .replace(/\s+/g, " ")
      .replace(/\|/g, "\\|")
      .trim();
  const code = (text) => (cell(text) ? `\`${cell(text).replace(/`/g, "'")}\`` : "");
  // A union's members in a fixed order: the checker's follows whichever file made each literal
  // first, so it moves when an unrelated file changes.
  const collator = new Intl.Collator("en", { numeric: true });
  const typeOf = ({ type }) => {
    if (type?.name !== "enum" || !Array.isArray(type.value)) return type?.name;
    const values = type.value.map((option) => option.value).sort(collator.compare);
    // A long union reads as its name (BackgroundToken); a short one as its values.
    if (values.length > 8 && type.raw && /^[\w.]+$/.test(type.raw)) return type.raw;
    const joined = values.join(" | ");
    return joined.length <= 240
      ? joined
      : `${values.slice(0, 6).join(" | ")} | … (${values.length})`;
  };
  return (name, source, page) => {
    const doc = target(name, source, page);
    const props = doc ? Object.values(doc.props) : [];
    if (!props.length) return null;
    // Blank lines around the table, so a block written right after another stays its own.
    return [
      "",
      `_Props of \`${name}\`, generated from its types:_`,
      "",
      "| Prop | Type | Default | Description |",
      "| --- | --- | --- | --- |",
      ...props.map(
        (prop) =>
          `| \`${prop.name}\`${prop.required ? " (required)" : ""} | ${code(typeOf(prop))} | ${code(prop.defaultValue?.value)} | ${cell(prop.description)} |`,
      ),
      "",
    ].join("\n");
  };
}

function tokenSheet() {
  const docs = JSON.parse(fs.readFileSync(path.join(root, "src/generated/docs.json"), "utf8"));
  const rows = docs.map(
    (t) =>
      `| \`${t.name}\` | ${t.utility ? `\`${t.utility}\`` : ""} | \`${t.cssVar}\` | ${t.deprecated ? `deprecated ${t.deprecated}` : ""} | ${String(t.description ?? "").replace(/\|/g, "\\|")} |`,
  );
  return [
    "# Tokens",
    "",
    "Every design value is a token. The utility is the Tailwind class the lint allows; the CSS variable carries the light and dark values. Deprecated tokens are rejected by `ledger/no-deprecated-token`.",
    "",
    "| Token | Utility | Variable | State | Description |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

// The public API baseline groups every export by the layer that declares it.
const LAYERS = [
  ["primitives", "Primitives"],
  ["components", "Components"],
  ["layout", "Layout"],
  ["patterns", "Patterns"],
  ["mode", "Mode"],
  ["lib", "Utilities"],
  ["generated", "Tokens"],
];

/** The layer an export's declaration lives in, from its target in `api/public-api.json`. */
export function exportLayer(target) {
  if (target.startsWith("node_modules/")) return "dependency";
  return /src\/(\w+)/.exec(target)?.[1] ?? "other";
}

function exportList() {
  const { exports } = JSON.parse(fs.readFileSync(path.join(root, "api/public-api.json"), "utf8"));
  const groups = new Map();
  for (const [key, { target, kind }] of Object.entries(exports)) {
    const [specifier, name] = key.split("#");
    const layer = specifier === "." ? exportLayer(target) : specifier;
    const group = groups.get(layer) ?? { value: [], type: [] };
    group[kind === "value" ? "value" : "type"].push(name);
    groups.set(layer, group);
  }
  const line = (label, names) =>
    names.length
      ? `${label}: ${names
          .sort((a, b) => a.localeCompare(b))
          .map((n) => `\`${n}\``)
          .join(", ")}.`
      : "";
  const section = (title, group) =>
    group
      ? [`## ${title}`, line("Values", group.value), line("Types", group.type)]
          .filter(Boolean)
          .join("\n\n")
      : "";
  const known = new Set([...LAYERS.map(([layer]) => layer), "dependency"]);
  const subpaths = [...groups.keys()].filter((layer) => layer.startsWith("./")).sort();
  const other = [...groups.keys()].filter((layer) => !known.has(layer) && !layer.startsWith("./"));
  return [
    "# Public exports",
    "Every value and type exported from `@ledger/design-system`, from the public API baseline (`api/public-api.json`), grouped by the layer that declares it. Product code imports these from the package root and never declares a local copy (`ledger/no-kit-shadow`). A name not listed here is not an export: a story helper such as `Matrix`, `Specimens` or `Pair` included.",
    ...LAYERS.map(([layer, title]) => section(title, groups.get(layer))),
    ...other.map((layer) => section(layer, groups.get(layer))),
    section("Dependency types re-exported", groups.get("dependency")),
    ...subpaths.map((specifier) =>
      section(`\`@ledger/design-system${specifier.slice(1)}\``, groups.get(specifier)),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function renderLlms() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const propsOf = propsTables();
  const pages = pageFiles().map((file) => {
    const { title, body } = pageToMarkdown(fs.readFileSync(file, "utf8"), file, propsOf);
    const rel = path.relative(root, file).split(path.sep).join("/");
    return `<!-- page: ${title} (${rel}) -->\n\n${body}`;
  });
  const intro =
    "Ledger, the product design system, as one file for agents and tools that cannot reach the running Storybook. Generated by `npm run build:llms` from the Storybook pages under `src/stories`, with the props tables their `<ArgTypes>` blocks render (a part's own props and the Base UI props it inherits, from the same docgen and options as the Storybook; the DOM's own attributes are not listed and still apply where a part renders an element), the token sheet in `src/generated/docs.json` and the public API baseline in `api/public-api.json`; do not edit by hand. The running Storybook and its MCP server remain the contract for verifying a change. The repository's `packages/design-system/AGENTS.md` says how to work on the package.";
  return (
    [`# ${pkg.name} ${pkg.version}\n\n${intro}`, ...pages, tokenSheet(), exportList()].join(
      "\n\n",
    ) + "\n"
  );
}

export function writeLlms() {
  const text = renderLlms();
  fs.writeFileSync(llmsPath, text);
  return text;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = writeLlms();
  console.log(`llms.txt: ${pageFiles().length} pages · ${Math.round(text.length / 1024)} KB`);
}

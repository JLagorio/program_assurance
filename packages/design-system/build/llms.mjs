// Generate `llms.txt`: the Storybook's pages, the token sheet and the public export list in one
// plain text file, so an agent without the running Storybook or its MCP server reads the same
// contract. Keep this file build-only; the output is committed and tested for drift.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
 * what an agent copies.
 */
export function pageToMarkdown(source, file = "page.mdx") {
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
    const argTypes = /^<ArgTypes\s+of=\{([^}]+)\}\s*\/>/.exec(line);
    if (argTypes) {
      out.push(
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
  const pages = pageFiles().map((file) => {
    const { title, body } = pageToMarkdown(fs.readFileSync(file, "utf8"), file);
    const rel = path.relative(root, file).split(path.sep).join("/");
    return `<!-- page: ${title} (${rel}) -->\n\n${body}`;
  });
  const intro =
    "Ledger, the product design system, as one file for agents and tools that cannot reach the running Storybook. Generated by `npm run build:llms` from the Storybook pages under `src/stories`, the token sheet in `src/generated/docs.json` and the public API baseline in `api/public-api.json`; do not edit by hand. The running Storybook and its MCP server remain the contract for verifying a change. The repository's `packages/design-system/AGENTS.md` says how to work on the package.";
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

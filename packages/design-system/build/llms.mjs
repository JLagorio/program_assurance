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
const DOCS_ORDER = [
  "Introduction",
  "GettingStarted",
  "Agents",
  "Choosing",
  "FromShadcn",
  "Recipes",
  "WhichToken",
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

/** Turn one MDX page into Markdown: drop imports and Meta, describe the rendered blocks. */
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

export function pageToMarkdown(source, file = "page.mdx") {
  const title = pageTitle(file, source);
  const lines = source.split("\n");
  const out = [];
  let skippingImport = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
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

function exportList() {
  const { components } = JSON.parse(
    fs.readFileSync(path.join(root, "eslint-plugin/components.json"), "utf8"),
  );
  return [
    "# Public exports",
    "",
    "Every value exported from `@ledger/design-system`. Product code imports these from the package root and never declares a local copy (`ledger/no-kit-shadow`).",
    "",
    components.map((name) => `- ${name}`).join("\n"),
  ].join("\n");
}

export function renderLlms() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const pages = pageFiles().map((file) => {
    const { title, body } = pageToMarkdown(fs.readFileSync(file, "utf8"), file);
    const rel = path.relative(root, file).split(path.sep).join("/");
    return `<!-- page: ${title} (${rel}) -->\n\n${body}`;
  });
  const intro =
    "Ledger, the product design system, as one file for agents and tools that cannot reach the running Storybook. Generated by `npm run build:llms` from the Storybook pages under `src/stories`, the token sheet in `src/generated/docs.json` and the public export inventory; do not edit by hand. The running Storybook and its MCP server remain the contract for verifying a change. The repository's `packages/design-system/AGENTS.md` says how to work on the package.";
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

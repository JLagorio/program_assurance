// The publishable build: ESM JavaScript with declarations from tsc, then the stylesheets and the
// token data copied beside them so the CSS entries' relative imports still resolve. `dist/` mirrors
// `src/` minus the stories. The consumer's Tailwind scans the shipped `src/` for classes (ledger.css
// says `@source "../"`), so the source stays in the tarball; a bundler with the `development`
// condition uses it directly, everything else uses dist.
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
const configPath = path.join(root, "tsconfig.build.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
// Resolve relative module specifiers while emitting both JavaScript and declarations. Keeping this
// in the compiler (rather than rewriting emitted text) also keeps source maps accurate.
const nodeSpecifiers = (context) => (source) => {
  const rewrite = (literal) => {
    if (!ts.isStringLiteral(literal) || !literal.text.startsWith(".")) return literal;
    const resolved = ts.resolveModuleName(
      literal.text,
      source.fileName,
      parsed.options,
      ts.sys,
    ).resolvedModule;
    if (!resolved || !/\.[cm]?tsx?$/.test(resolved.resolvedFileName)) return literal;
    let relative = path
      .relative(path.dirname(source.fileName), resolved.resolvedFileName)
      .split(path.sep)
      .join("/");
    relative = relative.replace(/\.[cm]?tsx?$/, ".js");
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return context.factory.createStringLiteral(relative);
  };
  const visit = (node, parent, grandparent) => {
    if (
      ts.isStringLiteral(node) &&
      parent &&
      (((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
        parent.moduleSpecifier === node) ||
        (ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword) ||
        (ts.isLiteralTypeNode(parent) && grandparent && ts.isImportTypeNode(grandparent)))
    )
      return rewrite(node);
    return ts.visitEachChild(node, (child) => visit(child, node, parent), context);
  };
  return ts.visitNode(source, visit);
};
const diagnostics = [
  ...(config.error ? [config.error] : []),
  ...parsed.errors,
  ...ts.getPreEmitDiagnostics(program),
];
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }),
  );
  process.exit(1);
}
const result = program.emit(undefined, undefined, undefined, undefined, {
  before: [nodeSpecifiers],
  afterDeclarations: [nodeSpecifiers],
});
if (result.emitSkipped || result.diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }),
  );
  process.exit(1);
}

const copies = [
  ...fs
    .readdirSync(path.join(root, "src/styles"))
    .filter((f) => f.endsWith(".css") && f !== "storybook.css")
    .map((f) => `styles/${f}`),
  ...fs
    .readdirSync(path.join(root, "src/generated"))
    .filter((f) => /\.(css|json)$/.test(f) && f !== "docs.json")
    .map((f) => `generated/${f}`),
];
for (const rel of copies) {
  fs.mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
  fs.copyFileSync(path.join(root, "src", rel), path.join(dist, rel));
}

const count = (dir, ext) =>
  fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(ext)).length;
console.log(
  `dist: ${count(dist, ".js")} modules · ${count(dist, ".d.ts")} declarations · ${copies.length} stylesheets and data files`,
);

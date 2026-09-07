// Review package declarations once, with compact fingerprints for exposed dependency contracts.
// Implementation bodies, comments, source positions and ambient library files are absent.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const slash = (value) => value.split(path.sep).join("/");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sorted = (entries) => Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b)));

export function extractApi({ packageRoot, entries, compilerOptions = {} }) {
  packageRoot = path.resolve(packageRoot);
  const virtualRoot = path.join(packageRoot, ".api-declarations");
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    ...compilerOptions,
    rootDir: path.join(packageRoot, "src"),
    outDir: virtualRoot,
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    declarationMap: false,
    sourceMap: false,
    incremental: false,
    composite: false,
  };
  const inputs = Object.values(entries).map((entry) => path.resolve(packageRoot, entry));
  const emitted = new Map();
  const sourceProgram = ts.createProgram(inputs, options);
  const result = sourceProgram.emit(undefined, (file, text) =>
    emitted.set(path.resolve(file), text),
  );
  const errors = [...ts.getPreEmitDiagnostics(sourceProgram), ...result.diagnostics].filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => packageRoot,
        getNewLine: () => "\n",
      }),
    );
  }
  const host = ts.createCompilerHost(options);
  const originalRead = host.readFile.bind(host);
  const originalExists = host.fileExists.bind(host);
  const originalDirectory = host.directoryExists?.bind(host);
  host.readFile = (file) => emitted.get(path.resolve(file)) ?? originalRead(file);
  host.fileExists = (file) => emitted.has(path.resolve(file)) || originalExists(file);
  host.directoryExists = (directory) =>
    [...emitted.keys()].some((file) => file.startsWith(`${path.resolve(directory)}${path.sep}`)) ||
    Boolean(originalDirectory?.(directory));
  host.getSourceFile = (file, languageVersion) => {
    const text = host.readFile(file);
    return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true);
  };
  const declarationEntries = Object.entries(entries).map(([entry, source]) => [
    entry,
    path
      .join(virtualRoot, path.relative(options.rootDir, path.resolve(packageRoot, source)))
      .replace(/\.[cm]?tsx?$/, ".d.ts"),
  ]);
  const program = ts.createProgram(
    declarationEntries.map(([, file]) => file),
    { ...options, noEmit: true },
    host,
  );
  const checker = program.getTypeChecker();
  const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
  const declarations = new Map();
  const dependencyDeclarations = new Map();
  const visited = new Set();
  const visitedDeclarations = new Set();
  const stablePath = (file) => {
    const normalized = slash(file);
    if (normalized.includes("/node_modules/"))
      return normalized.slice(normalized.lastIndexOf("/node_modules/") + 1);
    return slash(path.relative(packageRoot, file)).replace(/^\.api-declarations\//, "src/");
  };
  const resolve = (symbol) =>
    symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const symbolKey = (symbol) => {
    const qualified = checker
      .getFullyQualifiedName(symbol)
      .replace(/"([^\"]+)"/g, (_, file) => `"${path.isAbsolute(file) ? stablePath(file) : file}"`);
    const source = symbol.declarations?.[0]?.getSourceFile();
    return qualified.startsWith('"') || !source
      ? qualified
      : `${stablePath(source.fileName)}#${qualified}`;
  };
  // Properties, parameters and generic constraints are already printed with their owner.
  const declarationRoot = (node) => {
    while (node.parent && !ts.isSourceFile(node.parent) && !ts.isModuleBlock(node.parent)) {
      if (ts.isVariableDeclaration(node) && ts.isVariableDeclarationList(node.parent)) break;
      node = node.parent;
    }
    return node;
  };
  function collect(rawSymbol) {
    const symbol = resolve(rawSymbol);
    if (!symbol || visited.has(symbol)) return;
    visited.add(symbol);
    const nodes = symbol.declarations ?? [];
    for (const declaration of nodes) {
      // A namespace import is resolved through its individual referenced members.
      if (ts.isSourceFile(declaration)) continue;
      const node = declarationRoot(declaration);
      if (visitedDeclarations.has(node)) continue;
      visitedDeclarations.add(node);
      const source = node.getSourceFile();
      const sourcePath = stablePath(source.fileName);
      // Peer/compiler libraries are covered by typechecks and consumer tests, not whole-file hashes.
      if (/node_modules\/(typescript\/lib|@types\/(react|react-dom))(\/|$)/.test(sourcePath))
        continue;
      const record = {
        source: sourcePath,
        declaration: printer.printNode(ts.EmitHint.Unspecified, node, source),
      };
      const owner = node.name && checker.getSymbolAtLocation(node.name);
      const key = owner ? symbolKey(owner) : symbolKey(symbol);
      const dependency = sourcePath.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1];
      const collection = dependency
        ? (dependencyDeclarations.get(dependency) ?? new Map())
        : declarations;
      if (dependency) dependencyDeclarations.set(dependency, collection);
      // Retain overloads and merged declarations while ignoring their source order.
      const records = collection.get(key) ?? new Map();
      records.set(JSON.stringify(record), record);
      collection.set(key, records);
      const visit = (child) => {
        if (ts.isIdentifier(child)) collect(checker.getSymbolAtLocation(child));
        ts.forEachChild(child, visit);
      };
      ts.forEachChild(node, visit);
    }
  }
  const exports = new Map();
  for (const [entry, file] of declarationEntries) {
    const source = program.getSourceFile(file);
    if (!source) throw new Error(`Missing emitted entry: ${entry}`);
    const module = checker.getSymbolAtLocation(source);
    for (const symbol of checker
      .getExportsOfModule(module)
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const resolved = resolve(symbol);
      collect(resolved);
      exports.set(`${entry}#${symbol.name}`, {
        target: symbolKey(resolved),
        kind: resolved.flags & ts.SymbolFlags.Value ? "value" : "type",
      });
    }
  }
  const serializeDeclarations = (collection) =>
    sorted(
      [...collection].map(([key, records]) => [
        key,
        [...records.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      ]),
    );
  return {
    schemaVersion: 2,
    typescriptVersion: ts.version,
    exports: sorted(exports),
    declarations: serializeDeclarations(declarations),
    // A changed fingerprint names the dependency whose exposed API needs consumer review.
    dependencyContracts: sorted(
      [...dependencyDeclarations].map(([name, collection]) => [
        name,
        hash(JSON.stringify(serializeDeclarations(collection))),
      ]),
    ),
  };
}

export function compareApi(before, after) {
  const changes = [];
  if (before.schemaVersion !== after.schemaVersion)
    changes.push({
      section: "schema",
      kind: "changed",
      name: `${before.schemaVersion} → ${after.schemaVersion}`,
    });
  // Cross-schema declaration formats are not comparable; still report added/removed exports.
  const sections =
    before.schemaVersion === after.schemaVersion
      ? ["exports", "declarations", "dependencyContracts"]
      : ["exports"];
  for (const section of sections) {
    const oldEntries = before[section] ?? {};
    const newEntries = after[section] ?? {};
    for (const key of [
      ...new Set([...Object.keys(oldEntries), ...Object.keys(newEntries)]),
    ].sort()) {
      const kind = !(key in oldEntries)
        ? "added"
        : !(key in newEntries)
          ? "removed"
          : JSON.stringify(oldEntries[key]) !== JSON.stringify(newEntries[key])
            ? "changed"
            : undefined;
      if (kind) changes.push({ section, kind, name: key });
    }
  }
  if (before.typescriptVersion !== after.typescriptVersion)
    changes.push({
      section: "compiler",
      kind: "changed",
      name: `${before.typescriptVersion} → ${after.typescriptVersion}`,
    });
  return changes;
}

function report(label, changes) {
  console.log(`${label}: ${changes.length} change(s)`);
  for (const change of changes) console.log(`  ${change.kind} ${change.section}: ${change.name}`);
  if (changes.some((change) => change.section === "schema"))
    console.log(
      "  Snapshot formats differ: only exports are comparable across this format change.",
    );
}

/** Read a baseline from a real revision. Missing files and failed reads are different outcomes. */
export function readBaselineAtRef(repoRoot, ref, baselineRelative) {
  const options = { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] };
  execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], options);
  const listed = execFileSync(
    "git",
    ["ls-tree", "--name-only", ref, "--", baselineRelative],
    options,
  ).trim();
  if (!listed) return null;
  // Public snapshots exceed Node's default 1 MiB child-process output limit.
  return execFileSync("git", ["show", `${ref}:${baselineRelative}`], {
    ...options,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function main() {
  const root = path.resolve("packages/design-system");
  const baselinePath = path.join(root, "api/public-api.json");
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const current = extractApi({
    packageRoot: root,
    entries: { ".": "src/index.ts", "./cn": "src/lib/cn.ts" },
    compilerOptions: parsed.options,
  });
  if (process.argv.includes("--update")) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
    console.log(
      `Updated ${path.relative(process.cwd(), baselinePath)}. Review this API change explicitly.`,
    );
  } else {
    if (!fs.existsSync(baselinePath))
      throw new Error(
        "Public API baseline is missing. Run node scripts/ds-api-check.mjs --update and review the new baseline.",
      );
    const changes = compareApi(JSON.parse(fs.readFileSync(baselinePath, "utf8")), current);
    report("Public API baseline", changes);
    if (changes.length) {
      console.error(
        "Public declarations changed. Review compatibility and migration notes, then explicitly run node scripts/ds-api-check.mjs --update.",
      );
      process.exitCode = 1;
    }
  }
  const baseIndex = process.argv.indexOf("--base-ref");
  if (baseIndex >= 0) {
    const ref = process.argv[baseIndex + 1];
    if (!ref || ref.startsWith("-")) throw new Error("--base-ref requires a git revision");
    if (/^0{40}$|^0{64}$/.test(ref)) {
      console.log(
        "Initial branch push has no previous commit; review the public API snapshot as initial adoption.",
      );
      return;
    }
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
    const baselineRelative = slash(path.relative(repoRoot, baselinePath));
    const previous = readBaselineAtRef(repoRoot, ref, baselineRelative);
    if (previous === null) {
      console.log(`Base ${ref} predates the public API baseline; review the newly added snapshot.`);
      return;
    }
    report(`Public API changes since ${ref}`, compareApi(JSON.parse(previous), current));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

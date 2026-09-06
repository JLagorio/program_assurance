// Resolve the actual package barrel, including aliases, compound values and type-only exports.
import ts from "typescript";
import path from "node:path";
const root = path.resolve("packages/design-system");
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram([path.join(root, "src/index.ts")], parsed.options);
const checker = program.getTypeChecker();
const source = program.getSourceFile(path.join(root, "src/index.ts"));
export const publicApi = checker
  .getExportsOfModule(checker.getSymbolAtLocation(source))
  .map((symbol) => {
    const resolved =
      symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const decl = resolved.valueDeclaration ?? resolved.declarations?.[0];
    return {
      name: symbol.name,
      kind: resolved.flags & ts.SymbolFlags.Value ? "value" : "type",
      source: decl
        ? path.relative(process.cwd(), decl.getSourceFile().fileName).split(path.sep).join("/")
        : null,
      deprecated: resolved.getJsDocTags().some((t) => t.name === "deprecated"),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename)
  console.log(JSON.stringify(publicApi, null, 2));

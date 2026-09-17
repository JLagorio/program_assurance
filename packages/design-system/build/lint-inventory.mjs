// Compile the package's public value exports into data that ESLint can load without TypeScript
// or the component source tree. Keep this file build-only; consumers import the generated JSON.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src/index.ts");
export const inventoryPath = path.join(root, "eslint-plugin/components.json");

/** The module's value type follows named, aliased and star exports, excluding type-only exports. */
export function publicComponentNames(program, entryFile) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`Cannot resolve public component exports from ${entryFile}`);
  return checker
    .getTypeOfSymbolAtLocation(symbol, source)
    .getProperties()
    .map((part) => part.name)
    .filter((name) => /^[A-Z]\w*$/.test(name) && !/^[A-Z0-9_]+$/.test(name))
    .sort();
}

export function packageComponentNames(program) {
  if (!program) {
    const config = ts.readConfigFile(path.join(root, "tsconfig.build.json"), ts.sys.readFile);
    if (config.error)
      throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    if (parsed.errors.length)
      throw new Error(
        parsed.errors
          .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
          .join("\n"),
      );
    program = ts.createProgram([entry], parsed.options);
  }
  return publicComponentNames(program, entry);
}

export function writeLintInventory(program) {
  const components = packageComponentNames(program);
  fs.writeFileSync(inventoryPath, `${JSON.stringify({ components }, null, 2)}\n`);
  return components;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const components = writeLintInventory();
  console.log(`ESLint inventory: ${components.length} public component names`);
}

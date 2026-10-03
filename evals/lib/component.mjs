// Whether a task's file delivered a component, read from source only: it exports something
// callable under a component's name, and every JSX name it uses is bound. Output that comments its
// component out or renders a part that does not exist never counts as clean. Missing exports of
// a package and type errors are the typecheck's (lib/lint.mjs runs tsc).
import parser from "@typescript-eslint/parser";
import * as fs from "node:fs";
import * as path from "node:path";

const nameOf = (node) => node?.name ?? node?.value;
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"];

/** A relative or `@/` import as a file in the work dir (`@/` is src/, as in the app's tsconfig). */
function resolveLocal(source, file, workdir) {
  if (!source.startsWith(".") && !source.startsWith("@/")) return null;
  const base = source.startsWith("@/")
    ? path.join(workdir, "src", source.slice(2))
    : path.resolve(path.dirname(file), source);
  const stem = base.replace(/\.[cm]?[jt]sx?$/, "");
  const candidates = [
    base,
    ...EXTENSIONS.flatMap((ext) => [stem + ext, path.join(base, `index${ext}`)]),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ??
    null
  );
}

const FUNCTIONS = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];
const WRAPPERS = [
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
];

export function readComponent(workdir, taskFile) {
  const modules = new Map();
  const findings = [];
  const file = path.resolve(workdir, taskFile);
  const finding = (rule, message, full = file, line = 0) => ({
    file: path.relative(workdir, full),
    line,
    rule: `harness/${rule}`,
    message,
  });

  function load(full) {
    if (modules.has(full)) return modules.get(full);
    const parsed = parser.parseForESLint(fs.readFileSync(full, "utf8"), {
      filePath: full,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      loc: true,
      range: true,
    });
    const module = { file: full, bindings: new Map(), exports: new Map(), stars: [] };
    modules.set(full, module);
    for (const scope of parsed.scopeManager.scopes) {
      for (const ref of scope.references) {
        if (ref.identifier.type !== "JSXIdentifier" || !ref.isValueReference) continue;
        const bound =
          ref.resolved &&
          (!ref.resolved.defs.length ||
            ref.resolved.defs.some(
              (definition) =>
                definition.isVariableDefinition &&
                definition.node.importKind !== "type" &&
                definition.parent?.importKind !== "type",
            ));
        if (bound) continue;
        findings.push(
          finding(
            "unresolved-component",
            `Component ${ref.identifier.name} has no runtime definition or import.`,
            full,
            ref.identifier.loc.start.line,
          ),
        );
      }
    }
    for (const statement of parsed.ast.body) {
      const declaration = statement.type.startsWith("Export") ? statement.declaration : statement;
      if (declaration?.type === "VariableDeclaration") {
        for (const item of declaration.declarations)
          if (item.id.type === "Identifier") module.bindings.set(item.id.name, { node: item.init });
      } else if (declaration?.id?.name) {
        module.bindings.set(declaration.id.name, { node: declaration });
      }
      if (statement.type === "ImportDeclaration" && statement.importKind !== "type") {
        for (const specifier of statement.specifiers) {
          if (specifier.importKind === "type") continue;
          module.bindings.set(specifier.local.name, {
            source: statement.source.value,
            imported:
              specifier.type === "ImportDefaultSpecifier"
                ? "default"
                : specifier.type === "ImportNamespaceSpecifier"
                  ? "*"
                  : nameOf(specifier.imported),
          });
        }
      }
      if (statement.type === "ExportDefaultDeclaration")
        module.exports.set("default", { node: statement.declaration });
      if (statement.type === "ExportNamedDeclaration" && statement.exportKind !== "type") {
        if (declaration?.id?.name)
          module.exports.set(declaration.id.name, { local: declaration.id.name });
        for (const item of declaration?.declarations ?? [])
          if (item.id.type === "Identifier")
            module.exports.set(item.id.name, { local: item.id.name });
        for (const specifier of statement.specifiers) {
          if (specifier.exportKind === "type") continue;
          module.exports.set(
            nameOf(specifier.exported),
            statement.source
              ? { source: statement.source.value, imported: nameOf(specifier.local) }
              : { local: nameOf(specifier.local) },
          );
        }
      }
      if (
        statement.type === "ExportAllDeclaration" &&
        statement.exportKind !== "type" &&
        !statement.exported
      )
        module.stars.push(statement.source.value);
    }
    return module;
  }

  function imported(module, source, name, seen) {
    const target = resolveLocal(source, module.file, workdir);
    if (target) return exported(load(target), name, seen);
    // A package's exports are the typecheck's to confirm.
    return name === "default" || /^[A-Z]/.test(name);
  }

  function callable(module, binding, seen) {
    if (!binding) return false;
    if (binding.source) return imported(module, binding.source, binding.imported, seen);
    if (binding.local) return local(module, binding.local, seen);
    const node = binding.node;
    if (!node) return false;
    if (node.type === "Identifier") return local(module, node.name, seen);
    if (FUNCTIONS.includes(node.type)) return true;
    if (["ClassDeclaration", "ClassExpression"].includes(node.type))
      return node.body.body.some(
        (member) => nameOf(member.key) === "render" && member.value?.type === "FunctionExpression",
      );
    if (WRAPPERS.includes(node.type)) return callable(module, { node: node.expression }, seen);
    if (node.type === "CallExpression") {
      const callee = node.callee;
      const binding = module.bindings.get(
        callee.type === "Identifier" ? callee.name : callee.object?.name,
      );
      const factory = callee.type === "Identifier" ? binding?.imported : nameOf(callee.property);
      if (
        binding?.source === "react" &&
        ["memo", "forwardRef"].includes(factory) &&
        (callee.type === "Identifier" || ["default", "*"].includes(binding.imported))
      )
        return callable(module, { node: node.arguments[0] }, seen);
    }
    return false;
  }

  function local(module, name, seen) {
    const key = `${module.file}:local:${name}`;
    if (seen.has(key)) return false;
    return callable(module, module.bindings.get(name), new Set([...seen, key]));
  }

  function exported(module, name, seen = new Set()) {
    const key = `${module.file}:export:${name}`;
    if (seen.has(key)) return false;
    seen = new Set([...seen, key]);
    if (module.exports.has(name)) return callable(module, module.exports.get(name), seen);
    return (
      name !== "default" && module.stars.some((source) => imported(module, source, name, seen))
    );
  }

  function exportNames(module, seen = new Set()) {
    if (seen.has(module.file)) return [];
    seen.add(module.file);
    const names = [...module.exports.keys()];
    for (const source of module.stars) {
      const target = resolveLocal(source, module.file, workdir);
      if (target)
        names.push(...exportNames(load(target), seen).filter((name) => name !== "default"));
    }
    return names;
  }

  let exportName;
  try {
    const module = load(file);
    exportName = ["default", ...exportNames(module).filter((name) => /^[A-Z]/.test(name))].find(
      (name) => exported(module, name),
    );
    // Local modules the task file reaches are read too, so a part that does not exist in one of
    // them is found wherever the agent put it.
    for (const binding of module.bindings.values()) {
      const target = binding.source && resolveLocal(binding.source, file, workdir);
      if (target && !target.includes(`${path.sep}node_modules${path.sep}`)) load(target);
    }
  } catch (error) {
    return { findings: [finding("parse-error", error.message)] };
  }
  if (!exportName) findings.push(finding("no-export", `${taskFile} exports no component.`));
  return { exportName, findings };
}

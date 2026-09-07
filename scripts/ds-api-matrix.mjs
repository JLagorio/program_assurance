// Compiler-derived prop evidence. Curated intent is deliberately separate from inferred facts.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = process.cwd();
const PACKAGE = path.resolve("packages/design-system");
const POLICY = "packages/design-system/api/axis-policy.json";
const JSON_OUTPUT = "artifacts/design-system-api/prop-matrix.json";
const MARKDOWN_OUTPUT = "artifacts/design-system-api/prop-matrix.md";
const AXIS =
  /^(variant|appearance|tone|size|width|height|id|ids|action|actions|empty|icon|iconBefore|iconAfter|value|defaultValue|checked|defaultChecked|open|defaultOpen|selected|defaultSelected|on[A-Z].*Change|onChange|onClose|onSave|onSelect)$/;
const DOM_INTEGRATION =
  /^(as|asChild|ref|id|name|form|role|dir|className|style|aria-label|aria-labelledby|aria-describedby)$/;
const relative = (filename) => path.relative(ROOT, filename).split(path.sep).join("/");
const location = (node) => {
  if (!node) return null;
  const source = node.getSourceFile();
  return `${relative(source.fileName)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
};
const resolve = (checker, symbol) =>
  symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
const describe = (checker, symbol) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker));
const normalize = (text) => text.replaceAll(ROOT + path.sep, "./");
const typeText = (checker, type, node) =>
  normalize(
    checker.typeToString(
      type,
      node,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
    ),
  );
const literalValues = (type) => {
  const members = type.isUnion() ? type.types : [type];
  return members.flatMap((member) => {
    if (member.isStringLiteral() || member.isNumberLiteral()) return [member.value];
    if (member.flags & ts.TypeFlags.BooleanLiteral) return [member.intrinsicName === "true"];
    return [];
  });
};

/** Only parameter defaults are inferred: body fallbacks and dependency defaults stay unresolved. */
function parameterDefaults(declaration) {
  const result = new Map();
  const parameter = declaration?.parameters?.[0];
  if (parameter && ts.isObjectBindingPattern(parameter.name)) {
    for (const element of parameter.name.elements) {
      const property = element.propertyName ?? element.name;
      if (!ts.isIdentifier(property) && !ts.isStringLiteral(property)) continue;
      if (element.initializer)
        result.set(property.text, {
          status: "parameter-initializer",
          expression: element.initializer.getText(),
          source: location(element),
        });
    }
  }
  return result;
}

/** Exported for fixture tests; follows actual barrel aliases and callable compound members. */
export function extractMatrix(program, entry, policy = { axes: {}, components: {} }) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`Cannot resolve package entry ${entry}`);
  const components = [];
  const inheritedCatalog = {};
  const nonComponentExports = [];
  const visit = (name, symbol, ancestors = new Set()) => {
    symbol = resolve(checker, symbol);
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration || ancestors.has(symbol)) return;
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signatures = type.getCallSignatures();
    const nextAncestors = new Set([...ancestors, symbol]);
    if (signatures.length) {
      const propsByName = new Map();
      const signatureRecords = [];
      for (const [signatureIndex, signature] of signatures.entries()) {
        const parameter = signature.getParameters()[0];
        if (!parameter) continue;
        const propsType = checker.getTypeOfSymbolAtLocation(
          parameter,
          signature.declaration ?? declaration,
        );
        const defaults = parameterDefaults(signature.declaration);
        const branches = propsType.isUnion() ? propsType.types : [propsType];
        signatureRecords.push({
          signature: normalize(
            checker.signatureToString(signature, declaration, ts.TypeFormatFlags.NoTruncation),
          ),
          propsType: normalize(checker.typeToString(propsType)),
          branches: branches.length,
        });
        for (const [branchIndex, branch] of branches.entries()) {
          for (const prop of checker.getPropertiesOfType(branch)) {
            const propDeclaration = prop.valueDeclaration ?? prop.declarations?.[0];
            const valueType = checker.getTypeOfSymbolAtLocation(
              prop,
              signature.declaration ?? declaration,
            );
            const text = typeText(checker, valueType, declaration);
            const origin = propDeclaration?.getSourceFile().fileName;
            const owned =
              !!origin &&
              !origin.includes("node_modules") &&
              origin.startsWith(path.dirname(entry));
            const record = propsByName.get(prop.name) ?? {
              name: prop.name,
              ownership: owned ? "package" : "inherited",
              type: [],
              literalValues: [],
              declarations: [],
              documentation: [],
              presence: [],
              default: defaults.get(prop.name) ?? {
                status: "not-resolved",
                reason:
                  "No parameter initializer; consult implementation/dependency for runtime fallback.",
              },
            };
            if (!record.type.includes(text)) record.type.push(text);
            for (const value of literalValues(valueType))
              if (!record.literalValues.includes(value)) record.literalValues.push(value);
            const declaredAt = location(propDeclaration);
            if (declaredAt && !record.declarations.includes(declaredAt))
              record.declarations.push(declaredAt);
            const doc = describe(checker, prop);
            if (doc && !record.documentation.includes(doc)) record.documentation.push(doc);
            record.presence.push({
              signature: signatureIndex,
              branch: branchIndex,
              optional: !!(prop.flags & ts.SymbolFlags.Optional),
            });
            propsByName.set(prop.name, record);
          }
        }
      }
      const props = [];
      const inheritedProps = [];
      for (const prop of [...propsByName.values()].sort((a, b) => a.name.localeCompare(b.name))) {
        const override = policy.components?.[name]?.props?.[prop.name];
        if (override) prop.policyNote = override;
        const isAxis = AXIS.test(prop.name);
        if (isAxis) prop.axis = prop.name.startsWith("on") ? "change-handlers" : prop.name;
        if (
          prop.ownership === "package" ||
          override ||
          isAxis ||
          DOM_INTEGRATION.test(prop.name) ||
          prop.default.status !== "not-resolved"
        ) {
          props.push(prop);
        } else {
          // A shared catalog retains every inherited DOM/dependency prop without repeating its prose.
          const definition = { ...prop };
          delete definition.presence;
          delete definition.default;
          const key = `${prop.name}-${crypto.createHash("sha256").update(JSON.stringify(definition)).digest("hex").slice(0, 12)}`;
          inheritedCatalog[key] = definition;
          inheritedProps.push({ definition: key, presence: prop.presence });
        }
      }
      const reviewed = policy.components?.[name];
      const candidates = [
        ...new Set(
          [...propsByName.values()].flatMap((p) =>
            p.type.flatMap((t) => t.match(/\b(?:HTML|SVG)\w*Element\b/g) ?? []),
          ),
        ),
      ].sort();
      components.push({
        name,
        source: location(declaration),
        documentation: describe(checker, symbol) || null,
        signatures: signatureRecords,
        domTarget: reviewed?.domTarget
          ? { status: "documented", description: reviewed.domTarget }
          : {
              status: "not-documented",
              typeCandidates: candidates,
              note: "Event/ref types are evidence, not proof of forwarding or the rendered root.",
            },
        controlledBehavior: reviewed?.controlledBehavior
          ? { status: "documented", description: reviewed.controlledBehavior }
          : {
              status: "not-documented",
              evidence: props
                .filter((p) =>
                  /^(value|defaultValue|checked|defaultChecked|open|defaultOpen|selected|defaultSelected|onChange|on.*Change|onClose|onSave)$/.test(
                    p.name,
                  ),
                )
                .map((p) => p.name),
              note: "A callback name alone does not prove controlled, uncontrolled, or async behavior.",
            },
        defaultBehavior: reviewed?.defaultBehavior
          ? { status: "documented", description: reviewed.defaultBehavior }
          : {
              status: "not-documented",
              note: "Parameter initializers alone do not establish runtime defaults.",
            },
        reviewSources: reviewed?.reviewSources ?? [],
        props,
        inheritedProps,
      });
    }
    for (const child of checker.getPropertiesOfType(type)) {
      if (/^[A-Z][A-Za-z0-9]*$/.test(child.name) && !/^[A-Z0-9_]+$/.test(child.name))
        visit(`${name}.${child.name}`, child, nextAncestors);
    }
  };
  for (const exported of checker
    .getExportsOfModule(moduleSymbol)
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const symbol = resolve(checker, exported);
    if (
      symbol.flags & ts.SymbolFlags.Value &&
      /^[A-Z]/.test(exported.name) &&
      !/^[A-Z0-9_]+$/.test(exported.name)
    )
      visit(exported.name, symbol);
    else
      nonComponentExports.push({
        name: exported.name,
        kind: symbol.flags & ts.SymbolFlags.Value ? "value" : "type",
      });
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  return {
    components,
    inheritedCatalog: Object.fromEntries(
      Object.entries(inheritedCatalog).sort(([a], [b]) => a.localeCompare(b)),
    ),
    nonComponentExports,
  };
}

const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
const code = (value) =>
  `<code>${escapeCell(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</code>`;
const shortType = (value) => code(value.length > 220 ? value.slice(0, 217) + "…" : value);

/** Notes are optional; check only the entries an author chooses to maintain. */
export function validatePolicy(matrix, policy) {
  const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
  const validateNote = (note, name) => {
    if (!nonempty(note?.meaning)) throw new Error(`Missing policy meaning: ${name}`);
    for (const field of ["migration", "defaultBehavior"])
      if (note[field] !== undefined && !nonempty(note[field]))
        throw new Error(`Invalid policy note: ${name}.${field}`);
  };
  for (const [axis, note] of Object.entries(policy.axes ?? {})) validateNote(note, axis);
  for (const [name, component] of Object.entries(policy.components ?? {})) {
    const actual = matrix.components.find((candidate) => candidate.name === name);
    if (!actual) throw new Error(`Stale component policy: ${name}`);
    for (const field of ["domTarget", "controlledBehavior", "defaultBehavior"])
      if (component[field] !== undefined && !nonempty(component[field]))
        throw new Error(`Invalid policy note: ${name}.${field}`);
    if (
      component.reviewSources !== undefined &&
      (!Array.isArray(component.reviewSources) || !component.reviewSources.every(nonempty))
    )
      throw new Error(`Invalid policy sources: ${name}.reviewSources`);
    for (const [prop, note] of Object.entries(component.props ?? {})) {
      const exists =
        actual.props.some((candidate) => candidate.name === prop) ||
        actual.inheritedProps?.some(
          (candidate) => matrix.inheritedCatalog?.[candidate.definition]?.name === prop,
        );
      if (!exists) throw new Error(`Stale prop policy: ${name}.${prop}`);
      validateNote(note, `${name}.${prop}`);
    }
  }
}

export function renderMarkdown(matrix, policy) {
  const lines = [
    "# Design-system public prop and axis matrix",
    "",
    "Generated on demand by `node scripts/ds-api-matrix.mjs`. This report is ignored by Git. Optional notes live in `packages/design-system/api/axis-policy.json`; new components and props do not require entries.",
    "",
    `The compiler resolves **${matrix.components.length} callable public components and compound parts**. Every declared prop is retained in the [JSON evidence](./prop-matrix.json); repeated inherited DOM/dependency props reference its shared catalog. This page shows package-owned props and inherited semantic/DOM-integration axes. Hooks, constants, and standalone type exports are inventoried separately in JSON.`,
    "",
    "**How to read the evidence:** Meaning comes from source JSDoc and optional policy notes. A parameter initializer is a source expression, not an evaluated value. `No parameter initializer` is an extraction fact; implementation may supply body fallbacks, dependency behavior, browser defaults or context. Requiredness is retained separately for each overload/union branch in JSON. Long types are abbreviated here; JSON retains the complete strings. Literal values expose named union aliases; they are not an exhaustive domain when the type also accepts non-literals. Documented DOM targets, state ownership and runtime defaults are author notes, not deductions from event/ref types or a claim of complete review.",
    "",
    "## Optional axis notes",
    "",
    "| Axis | Meaning and scope | Migration note |",
    "| --- | --- | --- |",
    ...Object.entries(policy.axes ?? {}).map(
      ([axis, value]) =>
        `| ${code(axis)} | ${escapeCell(value.meaning)} | ${escapeCell(value.migration ?? "")} |`,
    ),
    "",
    "## Components",
    "",
  ];
  for (const component of matrix.components) {
    lines.push(
      `### ${component.name}`,
      "",
      `Source: ${code(component.source)}. ${component.inheritedProps.length} additional inherited props are retained in JSON.`,
      "",
    );
    lines.push(
      `DOM target: **${component.domTarget.status}** — ${component.domTarget.description ?? (component.domTarget.typeCandidates.join(", ") || "No DOM element type evidence")}.`,
      "",
    );
    lines.push(
      `Control: **${component.controlledBehavior.status}** — ${component.controlledBehavior.description ?? (component.controlledBehavior.evidence.length ? `API evidence: ${component.controlledBehavior.evidence.join(", ")}. Inspect implementation before changing ownership.` : "No conventional state/value callback pair detected; this does not assert statelessness.")}`,
      "",
    );
    lines.push(
      `Runtime defaults: **${component.defaultBehavior.status}** — ${component.defaultBehavior.description ?? component.defaultBehavior.note}`,
      "",
      `Note sources: ${component.reviewSources.length ? component.reviewSources.map(code).join(", ") : "None recorded."}`,
      "",
      "| Prop | Type / values | Presence | Parameter default | Meaning / optional note |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const prop of component.props) {
      const allBranches = component.signatures.reduce(
        (sum, signature) => sum + signature.branches,
        0,
      );
      const required =
        prop.presence.every((p) => !p.optional) && prop.presence.length === allBranches
          ? "Required"
          : prop.presence.every((p) => p.optional)
            ? "Optional"
            : "Branch-dependent";
      const meaning = prop.documentation.join(" ") || "No source JSDoc.";
      const note = prop.policyNote
        ? ` **Note:** ${prop.policyNote.meaning}${prop.policyNote.migration ? ` **Migration:** ${prop.policyNote.migration}` : ""}${prop.policyNote.defaultBehavior ? ` **Runtime default:** ${prop.policyNote.defaultBehavior}` : ""}`
        : "";
      const values = prop.literalValues.length
        ? `<br>Literal values: ${code(prop.literalValues.map((v) => JSON.stringify(v)).join(", "))}`
        : "";
      lines.push(
        `| ${code(prop.name)} | ${prop.type.map(shortType).join(" / ")}${values} | ${required} | ${prop.default.status === "parameter-initializer" ? code(prop.default.expression) : required === "Required" ? "Caller required" : "No parameter initializer"} | ${escapeCell(meaning + note)} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  if (process.argv.length > 2)
    throw new Error("Usage: node scripts/ds-api-matrix.mjs (generates optional local reports)");
  const config = ts.readConfigFile(path.join(PACKAGE, "tsconfig.json"), ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, PACKAGE);
  const entry = path.join(PACKAGE, "src/index.ts");
  const program = ts.createProgram([entry], parsed.options);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => ROOT,
        getNewLine: () => "\n",
      }),
    );
  const policy = JSON.parse(fs.readFileSync(POLICY, "utf8"));
  const extracted = extractMatrix(program, entry, policy);
  validatePolicy(extracted, policy);
  for (const component of Object.values(policy.components ?? {}))
    for (const source of component.reviewSources ?? [])
      if (!fs.existsSync(source)) throw new Error(`Missing API review source: ${source}`);
  const matrix = {
    schemaVersion: 3,
    provenance: {
      generator: "scripts/ds-api-matrix.mjs",
      typescript: ts.version,
      entry: relative(entry),
      policy: POLICY,
      defaultInference: "parameter initializers only",
      semanticNotes:
        "axis-policy.json contains optional author notes. Missing notes do not imply defects or block new APIs; compiler evidence does not prove runtime behavior.",
    },
    ...extracted,
  };
  const outputs = [
    [JSON_OUTPUT, JSON.stringify(matrix, null, 2) + "\n"],
    [MARKDOWN_OUTPUT, renderMarkdown(matrix, policy)],
  ];
  for (const [filename, content] of outputs) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  }
  console.log(
    `API matrix: ${matrix.components.length} component/compound entries, ${Object.keys(matrix.inheritedCatalog).length} shared inherited prop definitions; generated ${MARKDOWN_OUTPUT} and ${JSON_OUTPUT}.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

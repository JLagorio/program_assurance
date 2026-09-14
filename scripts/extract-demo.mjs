#!/usr/bin/env node
import { build } from "esbuild";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const archived = resolve(root, "tests/fixtures/legacy-poc/src");
const entry = `
import { registerPlatformData } from '@/lib/platform-ingestion';
import { programs, risks, poamItems as programPoams, lifecycleGates, activity as portfolioActivity, gatesForProgram, programControls, programTimeline } from '@/lib/grc-data';
import { people, workstreams } from '@/lib/people';
import { compositionNodes, compositionEdges, bomDocuments } from '@/lib/composition';
import { assessmentScopes, controlSetFor, servesEdges } from '@/lib/scopes';
import { assets, findings } from '@/lib/findings';
import { requirements, allocations, securityProcesses } from '@/lib/requirements';
import { campaigns, events, objectives } from '@/lib/campaigns';
import { procedures, allTestRuns } from '@/lib/test-execution';
import { tasksForProgram } from '@/lib/tasks';
import { allActivity } from '@/lib/activity';
import { evidenceCatalog } from '@/lib/evidence-catalog';
import { packages, artifacts, submissions } from '@/lib/packages';
import { poamItems, registerRisks } from '@/lib/register';
import { initialLibraryState } from '@/lib/assurance-library-seed';
import { platformSeed } from '@/lib/platform-seed';
import { workForProgram, activityFor, commentsFor } from '@/lib/control-work';
import { platformNodeIds, platformScopeIds, platformAssetIds } from '@/lib/platform-ids';
import { systemComponents } from '@/lib/reusable-components';
import { authorization, packageArtifacts as authorizationArtifacts, enclaveGrants, scaObservations, residualRisks } from '@/lib/authorization';
import { scanRuns, nativeResults } from '@/lib/ingestion';
registerPlatformData();
const controlWork = programs.flatMap(p => workForProgram(p.id));
module.exports = { programs, risks, programPoams, lifecycleGates, portfolioActivity, people, workstreams,
  compositionNodes, compositionEdges, bomDocuments, assessmentScopes, assets, findings, requirements,
  allocations, campaigns, events, objectives, procedures, runs: allTestRuns(),
  tasks: programs.flatMap(p => tasksForProgram(p.id)), activity: allActivity(), evidence: Array.from(evidenceCatalog),
  packages, packageArtifacts: artifacts, packageSubmissions: submissions, poamItems, registerRisks,
  library: initialLibraryState(), platform: platformSeed, controlWork,
  controlWorkActivity:controlWork.flatMap(w => activityFor(w.id)),
  controlWorkComments:controlWork.flatMap(w => commentsFor(w.id)),
  programMilestones:programs.flatMap(p => gatesForProgram(p.id).map(g => ({...g,programId:p.id}))),
  programControls, programTimeline, servesEdges, systemComponents, securityProcesses,
  authorization, authorizationArtifacts, enclaveGrants, scaObservations, residualRisks,
  scanRuns, nativeResults,
  platformIds:{nodes:Object.fromEntries(platformNodeIds),scopes:Object.fromEntries(platformScopeIds),assets:Object.fromEntries(platformAssetIds)},
  scopeSelections:assessmentScopes.map(scope => {
    const selection = controlSetFor(scope.id);
    const compact = row => ({controlId:row.control.id,selectedBy:row.selectedBy,source:row.source,tailoredOut:row.tailoredOut});
    return {scopeId:scope.id,programId:scope.program,triad:selection.triad,overlays:selection.overlays,
      controls:selection.controls.map(compact),removed:selection.removed.map(compact),added:selection.added.map(compact),byObjective:selection.byObjective,total:selection.total};
  }) };`;
const result = await build({
  stdin: { contents: entry, resolveDir: root, sourcefile: "original-workspace.ts", loader: "ts" },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  metafile: true,
  define: { "import.meta.env": "{}", "import.meta.hot": "undefined" },
  plugins: [
    {
      name: "archived-workspace",
      setup(build) {
        build.onResolve({ filter: /^@\// }, ({ path }) => ({
          path: resolve(archived, path.slice(2) + ".ts"),
        }));
        build.onResolve({ filter: /\?raw$/ }, ({ path, resolveDir }) => ({
          path: resolve(resolveDir, path.slice(0, -4)),
          namespace: "raw",
        }));
        build.onLoad({ filter: /.*/, namespace: "raw" }, async ({ path }) => ({
          contents: `export default ${JSON.stringify(await readFile(path, "utf8"))}`,
          loader: "js",
        }));
        build.onResolve({ filter: /^@ledger\/design-system$/ }, () => ({
          path: "design-system",
          namespace: "stub",
        }));
        build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: "export const toast = { error() {}, success() {}, info() {}, warning() {} };",
          loader: "js",
        }));
      },
    },
  ],
});
const fixed = Date.parse("2026-08-30T12:00:00Z");
class SeedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [fixed]));
  }
  static now() {
    return fixed;
  }
}
const module = { exports: {} };
vm.runInNewContext(
  result.outputFiles[0].text,
  {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    Date: SeedDate,
    console,
    structuredClone,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout,
    AbortController,
    process,
  },
  { timeout: 30000 },
);
const data = module.exports;
const routeSources = [];
function literal(node) {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    return literal(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          ![ts.SyntaxKind.Identifier, ts.SyntaxKind.StringLiteral].includes(property.name.kind)
        )
          throw new Error("Only literal named properties may be extracted from archived routes");
        return [property.name.text, literal(property.initializer)];
      }),
    );
  throw new Error(`Unsupported nonliteral archived route expression ${ts.SyntaxKind[node.kind]}`);
}
async function routeLiteral(file, variable) {
  const path = `tests/fixtures/legacy-poc/src/routes/${file}`;
  const content = await readFile(resolve(root, path));
  const syntax = ts.createSourceFile(
    path,
    content.toString("utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = syntax.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => ts.isIdentifier(item.name) && item.name.text === variable);
  if (!declaration?.initializer) throw new Error(`Missing archived literal ${path}:${variable}`);
  if (!routeSources.some((source) => source.path === path))
    routeSources.push({ path, sha256: createHash("sha256").update(content).digest("hex") });
  return literal(declaration.initializer);
}
data.vendors = await routeLiteral("vendors.tsx", "vendors");
data.riskDetailTimeline = await routeLiteral("risks.$riskId.tsx", "timeline");
data.riskDetailEvidence = await routeLiteral("risks.$riskId.tsx", "linkedEvidence");
const body = JSON.stringify(data);
const sources = [];
for (const path of Object.keys(result.metafile.inputs).filter(
  (p) => p.startsWith("tests/fixtures/legacy-poc/") || p.startsWith("raw:"),
)) {
  const file = path.startsWith("raw:") ? path.slice(4) : resolve(root, path);
  const contents = await readFile(file);
  sources.push({
    path: file.replace(root + "/", ""),
    sha256: createHash("sha256").update(contents).digest("hex"),
  });
}
sources.push(...routeSources);
sources.sort((a, b) => a.path.localeCompare(b.path));
const assets = [];
for (const name of (await readdir(resolve(archived, "assets"))).sort()) {
  const path = `tests/fixtures/legacy-poc/src/assets/${name}`;
  const contents = await readFile(resolve(root, path));
  assets.push({
    path,
    bytes: contents.length,
    sha256: createHash("sha256").update(contents).digest("hex"),
    evidence_ids: [],
    relationship:
      "No archived source import or evidence record identifies this file as an artifact; do not assign it to evidence by filename.",
  });
}
const fixture = gzipSync(body);
await mkdir(resolve(root, "supabase/demo"), { recursive: true });
await writeFile(resolve(root, "supabase/demo/original-poc.json.gz"), fixture);
await writeFile(
  resolve(root, "supabase/demo/manifest.json"),
  JSON.stringify(
    {
      format: 2,
      description:
        "Explicit fictional demo: original POC records and their original WS-X90 registration projections. Never authoritative operational claims; authoritative reference records are imported separately.",
      fixture: "original-poc.json.gz",
      compression: "gzip",
      fixture_sha256: createHash("sha256").update(fixture).digest("hex"),
      extractor: {
        path: "scripts/extract-demo.mjs",
        sha256: createHash("sha256")
          .update(await readFile(fileURLToPath(import.meta.url)))
          .digest("hex"),
      },
      extraction_clock: "2026-08-30T12:00:00Z",
      sha256: createHash("sha256").update(body).digest("hex"),
      counts: Object.fromEntries(
        Object.entries(data)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, v.length]),
      ),
      platform_counts: Object.fromEntries(
        Object.entries(data.platform)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, v.length]),
      ),
      library_counts: Object.fromEntries(
        Object.entries(data.library).map(([k, v]) => [k, v.length]),
      ),
      sources,
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, v.length]),
    ),
    null,
    2,
  ),
);

// The bench's own logic: its arguments, statistics, digests, the configs it derives, its summaries
// and comparisons, and that it fails when the findings differ between runs. The run over the
// repository is the script's own; these use made-up measurements and a throwaway checkout with a
// stub plugin.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BenchError,
  compareReport,
  configFor,
  differenceOf,
  digestOf,
  groupReads,
  isInside,
  main,
  median,
  overheadOf,
  parseArgs,
  report,
  spyOnReads,
  summarize,
  summarizeChild,
  timesOf,
  turnsOn,
} from "../lint-bench.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BENCH = path.join(HERE, "../lint-bench.mjs");
const REPO = process.env["LEDGER_BENCH_REPO"] ?? path.resolve(HERE, "../..");

test("arguments: defaults, narrowing and refusals", () => {
  const options = parseArgs([]);
  assert.equal(options.runs, 5);
  assert.deepEqual(options.scopes, ["product", "kit"]);
  assert.deepEqual(options.modes, ["full", "parse-only"]);
  assert.deepEqual(parseArgs(["--only", "ledger/no-margin"]).modes, ["only ledger/no-margin"]);
  assert.deepEqual(parseArgs(["--scope", "kit", "--mode", "full"]).scopes, ["kit"]);
  assert.throws(() => parseArgs(["--runs", "0"]), BenchError);
  assert.throws(() => parseArgs(["--runs"]), BenchError);
  assert.throws(() => parseArgs(["--scope", "docs"]), BenchError);
  assert.throws(() => parseArgs(["--mode", "fast"]), BenchError);
  assert.throws(() => parseArgs(["--fast"]), BenchError);
  assert.throws(() => parseArgs(["--result", "a.json"]), /--compare/);
});

test("it never writes in the checkout", async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "lint-bench-repo-"));
  try {
    assert.ok(isInside(repo, path.join(repo, "x.json")));
    assert.ok(isInside(repo, repo));
    assert.ok(!isInside(repo, path.join(repo, "..", "x.json")));
    await assert.rejects(
      main(["--repo", repo, "--json", path.join(repo, "result.json")]),
      /writes nothing in the checkout/,
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("statistics: median and spread", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.ok(Number.isNaN(median([])));
  assert.deepEqual(summarize([90, 100, 110]), {
    median: 100,
    min: 90,
    max: 110,
    spread: 0.2,
    n: 3,
  });
});

test("the digest ignores order and sees every field", () => {
  const a = { file: "a.tsx", line: 1, column: 2, ruleId: "ledger/x", message: "m" };
  const b = { file: "b.tsx", line: 3, column: 4, ruleId: null, message: "fatal" };
  assert.equal(digestOf([a, b]), digestOf([b, a]));
  assert.notEqual(digestOf([a]), digestOf([{ ...a, column: 3 }]));
  const { gone, added } = differenceOf(['["a"]', '["b"]'], ['["b"]', '["c"]']);
  assert.deepEqual(gone, ['["a"]']);
  assert.deepEqual(added, ['["c"]']);
});

test("times per rule and in the parser are summed over files and passes", () => {
  const pass = (parse, rules) => ({
    parse: { total: parse },
    rules: Object.fromEntries(Object.entries(rules).map(([rule, total]) => [rule, { total }])),
    total: parse + Object.values(rules).reduce((x, y) => x + y, 0),
  });
  const times = timesOf([
    { stats: { times: { passes: [pass(5, { "ledger/a": 1, b: 2 })] } } },
    { stats: { times: { passes: [pass(7, { "ledger/a": 3 }), pass(1, { b: 1 })] } } },
    {},
  ]);
  assert.deepEqual(times.rules, { "ledger/a": 4, b: 3 });
  assert.equal(times.parse, 13);
});

test("parse-only turns every rule off; --only keeps one", () => {
  const config = [
    { ignores: ["dist"] },
    { linterOptions: { reportUnusedDisableDirectives: "error" } },
    { files: ["**/*.tsx"], rules: { "ledger/a": "error", b: ["warn", {}] } },
  ];
  assert.equal(configFor(config, "full"), config);
  const bare = configFor(config, "parse-only");
  assert.deepEqual(bare[2].rules, {});
  assert.deepEqual(bare.at(-1), { linterOptions: { reportUnusedDisableDirectives: "off" } });
  assert.deepEqual(configFor(config, "only b")[2].rules, { b: ["warn", {}] });
  assert.deepEqual(config[2].rules, { "ledger/a": "error", b: ["warn", {}] }, "config untouched");
});

test("--only needs a rule the config turns on", () => {
  const config = [
    { ignores: ["dist"] },
    { files: ["**/*.tsx"], rules: { "ledger/a": "error", b: ["warn", {}], c: "off", d: [0] } },
  ];
  assert.ok(turnsOn(config, "ledger/a") && turnsOn(config, "b"));
  for (const rule of ["c", "d", "ledger/no-such-rule"]) assert.ok(!turnsOn(config, rule), rule);
});

const raw = (mode, ms, rules = {}) => ({
  scope: "product",
  mode,
  eslint: "9",
  files: 100,
  corpus: "c",
  peakRssMiB: 500,
  cold: { firstFileColdMs: mode === "full" ? 300 : 100, firstFileWarmMs: 10 },
  findings: { messages: 2, ledger: 1, digest: "d", deterministic: true, perRule: {} },
  runs: ms.map((wall) => ({ ms: wall, statsMs: wall * 1.2, rssMiB: 400, parseMs: 50, rules })),
});

test("summaries: medians, rates and what the rules cost over parse-only", () => {
  const full = summarizeChild(raw("full", [1100, 1000, 1200], { "ledger/a": 40, b: 10 }));
  assert.equal(full.wall.median, 1100);
  assert.equal(full.msPerFile, 11);
  assert.equal(Math.round(full.filesPerSecond), 91);
  assert.equal(full.ruleTotal, 50);
  assert.equal(full.cold.coldMinusWarmMs, 290);
  const bare = summarizeChild(raw("parse-only", [800, 900, 1000]));
  assert.deepEqual(overheadOf([full, bare]), {
    product: { ms: 200, msPerFile: 2, coldMs: 200 },
  });
});

test("a comparison names the change, the rules that moved and a changed corpus", () => {
  const before = {
    at: "then",
    runs: 3,
    results: [summarizeChild(raw("full", [1000], { "ledger/a": 40, b: 10 }))],
  };
  const now = summarizeChild(raw("full", [900], { "ledger/a": 20, b: 10 }));
  const after = { at: "now", runs: 3, results: [{ ...now, corpus: "other" }] };
  const text = compareReport(before, after);
  assert.match(text, /1000 ms → 900 ms/);
  assert.match(text, /−100 ms/);
  assert.match(text, /ledger\/a\s+40 ms\s+20 ms\s+−20\.0 ms/);
  assert.match(text, /The corpus changed/);
});

test("reads: JSON files one by one, the rest by extension", () => {
  const rows = groupReads([
    { phase: "first file", file: "p/values.json", bytes: 1024, ms: 1, part: "head" },
    { phase: "first file", file: "p/lint.json", bytes: 2048, ms: 1 },
    { phase: "import", file: "p/components.json", bytes: 1024, ms: 1 },
    { phase: "import", file: "p/components.json", bytes: 1024, ms: 1 },
    { phase: "first file", file: "p/a.css", bytes: 1024, ms: 1 },
    { phase: "first file", file: "p/b.css", bytes: 1024, ms: 1 },
  ]);
  assert.deepEqual(
    rows.map(({ phase, file, bytes }) => [phase, file, bytes]),
    [
      ["first file", "p/values.json (head)", 1024],
      ["first file", "p/lint.json", 2048],
      ["import", "p/components.json ×2", 2048],
      ["first file", "2 .css files", 2048],
    ],
  );
});

test("the reads spy sees a whole file once, and a file's head read through a descriptor", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "lint-bench-reads-"));
  const data = path.join(repo, "packages/design-system/src/generated");
  fs.mkdirSync(data, { recursive: true });
  const values = path.join(data, "values.json");
  const text = JSON.stringify({ inputsHash: "0".repeat(64), pad: "x".repeat(4096) });
  fs.writeFileSync(values, text);
  fs.writeFileSync(path.join(data, "a.css"), ":root {}\n");
  fs.writeFileSync(path.join(repo, "outside.json"), "{}");
  const original = { readFileSync: fs.readFileSync, openSync: fs.openSync };
  const spy = spyOnReads(repo, () => "first file");
  try {
    fs.readFileSync(values, "utf8");
    fs.readFileSync(path.join(data, "a.css")); // a Buffer read, which opens its own descriptor
    const fd = fs.openSync(values, "r");
    fs.readSync(fd, Buffer.alloc(1024), 0, 1024, 0);
    fs.closeSync(fd);
    fs.readFileSync(path.join(repo, "outside.json")); // not the plugin's data
  } finally {
    spy.restore();
    fs.rmSync(repo, { recursive: true, force: true });
  }
  const at = "packages/design-system/src/generated";
  assert.deepEqual(
    spy.reads.map(({ file, bytes, part }) => [file, bytes, part]),
    [
      [`${at}/values.json`, Buffer.byteLength(text), undefined],
      [`${at}/a.css`, 9, undefined],
      [`${at}/values.json`, 1024, "head"],
    ],
  );
  assert.equal(fs.readFileSync, original.readFileSync);
  assert.equal(fs.openSync, original.openSync);
});

test("the report says the rules' cold start is apart from their warm cost", () => {
  const full = summarizeChild(raw("full", [1100], { "ledger/a": 40 }));
  const bare = summarizeChild(raw("parse-only", [900]));
  const results = [full, bare].map((result) => ({
    ...result,
    cold: { ...result.cold, reads: [] },
  }));
  const text = report({
    runs: 1,
    environment: { node: "v", eslint: "9", platform: "p", cpu: "c", cpus: 1 },
    tree: { head: "h", changedFiles: 0, kitVersion: "0" },
    results,
    overhead: overheadOf(results),
  });
  assert.match(
    text,
    /product: the rules cost \+200 ms \(\+2\.00 ms\/file\) over parse-only on a warm run, and a further \+200 ms at the first file of a fresh process\./,
  );
});

/** A checkout with the product scope's shape, a stub plugin and five product files. */
function stubCheckout() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "lint-bench-stub-"));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), text);
  };
  fs.symlinkSync(path.join(REPO, "node_modules"), path.join(repo, "node_modules"), "junction");
  write("package.json", JSON.stringify({ private: true, type: "module" }));
  write(
    "packages/design-system/package.json",
    JSON.stringify({ version: "0.0.0", type: "module" }),
  );
  write(
    "packages/design-system/eslint-plugin/data.js",
    "export const lintFacts = () => ({});\nexport const lintValues = () => ({});\n",
  );
  // BENCH_FLAKY: every other file reports, counted across runs; with an odd number of files two
  // runs in a row disagree.
  write(
    "packages/design-system/eslint-plugin/index.js",
    `let calls = 0;
export default {
  rules: {
    mark: {
      meta: { type: "problem", schema: [] },
      create: (context) => ({
        Program(node) {
          if (process.env.BENCH_FLAKY && calls++ % 2) return;
          context.report({ node, message: "marked" });
        },
      }),
    },
  },
};
`,
  );
  write(
    "eslint.config.js",
    `import tseslint from "typescript-eslint";
import ledger from "./packages/design-system/eslint-plugin/index.js";
export default [
  {
    files: ["src/**/*.tsx"],
    languageOptions: { parser: tseslint.parser },
    plugins: { ledger },
    rules: { "ledger/mark": "error" },
  },
];
`,
  );
  // One file under each product glob, since a glob that matches nothing fails the run.
  for (const file of [
    "routes/a",
    "components/app/b",
    "components/prototype/work-table",
    "lib/c",
    "router",
  ])
    write(`src/${file}.tsx`, 'export const A = () => <div className="p-200" />;\n');
  return repo;
}

const bench = (repo, env = {}, args = ["--mode", "full"]) =>
  spawnSync(
    process.execPath,
    [BENCH, "--repo", repo, "--scope", "product", "--runs", "2", ...args],
    {
      encoding: "utf8",
      env: { ...process.env, ...env },
    },
  );

test("--only refuses a rule the scope's config never turns on, and times one it does", () => {
  const repo = stubCheckout();
  try {
    const typo = bench(repo, {}, ["--only", "ledger/mrak"]);
    assert.equal(typo.status, 2, typo.stderr);
    assert.match(
      typo.stderr,
      /--only ledger\/mrak: no block of eslint\.config\.js turns that rule on/,
    );
    const only = bench(repo, {}, ["--only", "ledger/mark"]);
    assert.equal(only.status, 0, only.stderr);
    assert.match(only.stdout, /product\s+only ledger\/mark\s+5\s/);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("a stable lint passes, and one whose findings differ between runs fails", () => {
  const repo = stubCheckout();
  try {
    const stable = bench(repo);
    assert.equal(stable.status, 0, stable.stderr);
    assert.match(stable.stdout, /product\s+full\s+5\s/);
    assert.match(stable.stdout, /ledger\/mark/);
    const flaky = bench(repo, { BENCH_FLAKY: "1" });
    assert.equal(flaky.status, 1);
    assert.match(flaky.stdout, /NON-DETERMINISTIC: product full/);
    assert.match(flaky.stderr, /findings differ between runs/);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

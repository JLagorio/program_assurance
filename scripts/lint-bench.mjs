#!/usr/bin/env node
/**
 * A benchmark of the lint as this repository runs it. It times; it gates nothing, since timings
 * are noisy, and it writes nothing in the checkout.
 *
 * - Two fixed corpora, each under its own config, read from the repository root through the ESLint
 *   API: the product files (src/routes, src/components/app, src/components/prototype, src/lib,
 *   src/router.tsx) under eslint.config.js, and the kit's src under packages/design-system's.
 * - Each scope runs in a fresh Node process per mode, so its peak RSS and its cold start are its
 *   own. `full` is the config as it is, every plugin's rules included; `parse-only` turns every rule
 *   off, so full minus parse-only is what the rules cost; `--only <rule>` keeps one rule, and
 *   refuses one the scope's config never turns on.
 * - Cold start: the plugin's import, the config's import, the first file linted by a fresh ESLint
 *   against the same file again (median of five), and every file the plugin reads from disk while
 *   it does (lint.json, lint-values.json, utilities.json, parts.json…), a read of only a file's
 *   head marked as one. A separate process times data.js's lintFacts(), lintValues() and
 *   staleness() on their first and second call.
 * - Then one warm-up run, and --runs N (default 5) measured runs, each a plain run for the wall
 *   time and a run with ESLint's `stats` for the time per rule (stats adds overhead of its own, so
 *   its wall time is reported apart). Medians, with the spread as (max − min) / median.
 * - Every corpus run hashes its messages (file, line, column, rule, message). A hash or a count that
 *   differs between runs over the same tree is non-determinism, and the bench fails.
 *
 * Messages are counted after inline directives. Only the CLI applies an eslint-suppressions.json,
 * and the repository keeps none (scripts/check-allow-lists.mjs).
 *
 * --json <file> writes the result outside the checkout (`-` prints it); --compare <file> prints the
 * change against an earlier result, and --result <file> compares a saved result instead of running.
 * --scope product|kit and --mode full|parse-only narrow the run; --top N sets the rules listed;
 * --repo <dir> benches another checkout.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire, syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RESULT_MARK = "LEDGER-LINT-BENCH ";
export const FORMAT = 1;
/** The corpora: each scope's config, the folder it runs in and the files it lints. */
export const SCOPES = {
  product: {
    config: "eslint.config.js",
    cwd: ".",
    files: [
      "src/routes/**/*.{ts,tsx}",
      "src/components/app/**/*.{ts,tsx}",
      "src/components/prototype/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/router.tsx",
    ],
    first: "src/components/prototype/work-table.tsx",
  },
  kit: {
    config: "packages/design-system/eslint.config.js",
    cwd: "packages/design-system",
    files: ["src/**/*.{ts,tsx}"],
    first: "src/components/button.tsx",
  },
};
export const MODES = ["full", "parse-only"];
const PLUGIN = "packages/design-system/eslint-plugin/index.js";
const DATA = "packages/design-system/eslint-plugin/data.js";
const WARM_REPEATS = 5;
/** Besides the corpus, what the lint reads that someone may edit mid-run: the plugin and its data. */
const WATCHED = [
  "packages/design-system/eslint-plugin/*.{js,json}",
  "packages/design-system/src/generated/*.json",
  "eslint.config.js",
  "packages/design-system/eslint.config.js",
  "scripts/lint-allow.json",
];
/** Runs in the order a child makes them: the two warm-ups, then a plain and a stats run each. */
const RUN_NAMES = (index) =>
  index < 2
    ? ["warm-up", "warm-up (stats)"][index]
    : `run ${((index - 2) >> 1) + 1}${index % 2 ? " (stats)" : ""}`;

/** A failure the bench reports in its own words, without a stack. */
export class BenchError extends Error {}

/* ---------- arguments ---------- */

const list = (value) => value.split(",").filter(Boolean);

export function parseArgs(argv) {
  const options = {
    runs: 5,
    scopes: Object.keys(SCOPES),
    modes: [...MODES],
    only: undefined,
    json: undefined,
    compare: undefined,
    result: undefined,
    top: 10,
    repo: process.env["LEDGER_BENCH_REPO"] ?? path.resolve(HERE, ".."),
    child: undefined,
  };
  const takes = new Set([
    "--runs",
    "--scope",
    "--mode",
    "--only",
    "--json",
    "--compare",
    "--result",
    "--top",
    "--repo",
    "--child",
  ]);
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!takes.has(flag)) throw new BenchError(`lint-bench does not take ${flag}. ${USAGE}`);
    const value = argv[++i];
    if (value === undefined) throw new BenchError(`${flag} needs a value. ${USAGE}`);
    if (flag === "--runs" || flag === "--top") {
      const n = Number(value);
      if (!Number.isSafeInteger(n) || n < 1)
        throw new BenchError(`${flag} takes a whole number of 1 or more, not ${value}.`);
      options[flag.slice(2)] = n;
    } else if (flag === "--scope") {
      const scopes = list(value);
      const unknown = scopes.filter((scope) => !(scope in SCOPES));
      if (unknown.length || !scopes.length)
        throw new BenchError(`--scope takes ${Object.keys(SCOPES).join(" or ")}, not ${value}.`);
      options.scopes = scopes;
    } else if (flag === "--mode") {
      const modes = list(value);
      const unknown = modes.filter((mode) => !MODES.includes(mode));
      if (unknown.length || !modes.length)
        throw new BenchError(`--mode takes ${MODES.join(" or ")}, not ${value}.`);
      options.modes = modes;
    } else if (flag === "--only") options.only = value;
    else if (flag === "--repo") options.repo = path.resolve(value);
    else options[flag.slice(2)] = value;
  }
  if (options.only) options.modes = [`only ${options.only}`];
  if (options.result && !options.compare)
    throw new BenchError("--result compares a saved result: give --compare <file> with it.");
  return options;
}

const USAGE =
  "Usage: node scripts/lint-bench.mjs [--runs N] [--scope product,kit] [--mode full,parse-only] [--only <rule>] [--top N] [--json <file>|-] [--compare <file> [--result <file>]] [--repo <dir>]";

/** Whether `file` is inside `dir`. */
export const isInside = (dir, file) => {
  const relative = path.relative(path.resolve(dir), path.resolve(file));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

/* ---------- statistics ---------- */

export function median(values) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Median, min, max and spread ((max − min) / median) of some measurements. */
export function summarize(values) {
  const med = median(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { median: med, min, max, spread: med > 0 ? (max - min) / med : 0, n: values.length };
}

/* ---------- what a run reports ---------- */

/** Every message as one sorted line, [file, line, column, rule, message]. */
export const linesOf = (messages) =>
  messages
    .map(({ file, line, column, ruleId, message }) =>
      JSON.stringify([file, line ?? 0, column ?? 0, ruleId ?? null, message]),
    )
    .sort();

/** A sha256 of every message, in any order. */
export const digestOf = (messages) =>
  createHash("sha256").update(linesOf(messages).join("\n")).digest("hex");

/** What one run reported and another did not, both ways, a few lines each. */
export function differenceOf(before, after, shown = 5) {
  const was = new Set(before);
  const now = new Set(after);
  return {
    gone: before.filter((line) => !now.has(line)).slice(0, shown),
    added: after.filter((line) => !was.has(line)).slice(0, shown),
  };
}

/** A sha256 of some files' paths and contents; a file that cannot be read counts as missing. */
export function contentsOf(files, from) {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${path.relative(from, file)}\0`);
    try {
      hash.update(fs.readFileSync(file));
    } catch {
      hash.update("(missing)");
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}

/** Every message of some ESLint results, with its file from `root`. */
export const messagesOf = (results, root) =>
  results.flatMap((result) =>
    result.messages.map((message) => ({
      ...message,
      file: path.relative(root, result.filePath).split(path.sep).join("/"),
    })),
  );

/** The time per rule and in the parser, summed over every file and pass of a `stats` run. */
export function timesOf(results) {
  const rules = {};
  let parse = 0;
  let total = 0;
  for (const result of results)
    for (const pass of result.stats?.times?.passes ?? []) {
      parse += pass.parse?.total ?? 0;
      total += pass.total ?? 0;
      for (const [rule, { total: ms }] of Object.entries(pass.rules ?? {}))
        rules[rule] = (rules[rule] ?? 0) + ms;
    }
  return { rules, parse, total };
}

/** A config with every rule off (`only` undefined) or every rule but one off. Unused-directive
    reports are off too, since turning rules off would make every disable look unused. */
export function configFor(config, mode) {
  if (mode === "full") return config;
  const only = mode.startsWith("only ") ? mode.slice(5) : undefined;
  const blocks = config.map((block) => {
    if (!block.rules) return block;
    const rules = only && only in block.rules ? { [only]: block.rules[only] } : {};
    return { ...block, rules };
  });
  return [...blocks, { linterOptions: { reportUnusedDisableDirectives: "off" } }];
}

/* ---------- the child: one scope, one mode, a fresh process ---------- */

/** Whether a config turns `rule` on in any block: what `--only` needs to time anything. */
export function turnsOn(config, rule) {
  return config.some((block) => {
    const setting = block?.rules?.[rule];
    const level = Array.isArray(setting) ? setting[0] : setting;
    return level !== undefined && level !== 0 && level !== "off";
  });
}

/**
 * Records every file the plugin reads synchronously, with its size and read time, while
 * `phaseOf()` names a phase: a whole file through readFileSync, and a file read through
 * openSync and readSync, marked `part: "head"` when less than all of it was read (data.js reads
 * lint-values.json's head to find its build).
 */
export function spyOnReads(repo, phaseOf) {
  const reads = [];
  const original = {
    readFileSync: fs.readFileSync,
    openSync: fs.openSync,
    readSync: fs.readSync,
    closeSync: fs.closeSync,
  };
  const watched = path.join(repo, "packages/design-system") + path.sep;
  const modules = path.sep + "node_modules" + path.sep;
  const pathOf = (file) =>
    typeof file === "string" ? file : file instanceof URL ? fileURLToPath(file) : "";
  // The plugin's own data, not a file the kit's scope lints.
  const isData = (at) =>
    at.startsWith(watched) && !at.includes(modules) && !/\.[cm]?[jt]sx?$/.test(at);
  const shown = (at) => path.relative(repo, at).split(path.sep).join("/");
  /** Descriptors opened outside readFileSync, which opens its own through openSync. */
  const open = new Map();
  let inside = 0;
  fs.readFileSync = function readFileSync(file, ...rest) {
    const start = performance.now();
    inside++;
    let content;
    try {
      content = original.readFileSync.call(this, file, ...rest);
    } finally {
      inside--;
    }
    const at = pathOf(file);
    const phase = phaseOf();
    if (phase && isData(at))
      reads.push({
        phase,
        file: shown(at),
        bytes: Buffer.byteLength(content),
        ms: performance.now() - start,
      });
    return content;
  };
  fs.openSync = function openSync(file, ...rest) {
    const start = performance.now();
    const fd = original.openSync.call(this, file, ...rest);
    const at = pathOf(file);
    const phase = phaseOf();
    if (!inside && phase && isData(at))
      open.set(fd, { phase, file: shown(at), bytes: 0, ms: performance.now() - start });
    return fd;
  };
  fs.readSync = function readSync(fd, ...rest) {
    const start = performance.now();
    const read = original.readSync.call(this, fd, ...rest);
    const entry = open.get(fd);
    if (entry) {
      entry.bytes += read;
      entry.ms += performance.now() - start;
    }
    return read;
  };
  fs.closeSync = function closeSync(fd, ...rest) {
    const entry = open.get(fd);
    if (entry) {
      open.delete(fd);
      let size;
      try {
        size = fs.fstatSync(fd).size;
      } catch {
        size = undefined;
      }
      reads.push(size !== undefined && entry.bytes < size ? { ...entry, part: "head" } : entry);
    }
    return original.closeSync.call(this, fd, ...rest);
  };
  syncBuiltinESMExports();
  return {
    reads,
    restore() {
      Object.assign(fs, original);
      syncBuiltinESMExports();
    },
  };
}

const timed = async (work) => {
  const start = performance.now();
  const value = await work();
  return { ms: performance.now() - start, value };
};

/** What one corpus run gives: its wall time, what it reported, its files and, from a `stats`
    run, its times. The results themselves are dropped, so they do not count in the RSS. */
async function corpusRun(eslint, patterns, root) {
  globalThis.gc?.();
  const { ms, value: results } = await timed(() => eslint.lintFiles(patterns));
  const messages = messagesOf(results, root);
  const paths = results.map(({ filePath }) => filePath);
  const times = timesOf(results);
  results.length = 0;
  globalThis.gc?.();
  return {
    ms,
    paths,
    times,
    files: paths.length,
    messages: messages.length,
    ledger: messages.filter(({ ruleId }) => ruleId?.startsWith("ledger/")).length,
    fatal: messages.filter(({ fatal }) => fatal).length,
    perRule: countBy(messages.map(({ ruleId }) => ruleId ?? "(fatal)")),
    digest: digestOf(messages),
    lines: linesOf(messages),
    rssMiB: process.memoryUsage().rss / 2 ** 20,
  };
}

const countBy = (items) => {
  const counts = {};
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1;
  return counts;
};

async function eslintOf(repo) {
  const require = createRequire(path.join(repo, "package.json"));
  const { ESLint } = await import(pathToFileURL(require.resolve("eslint")).href);
  const { version } = JSON.parse(fs.readFileSync(require.resolve("eslint/package.json"), "utf8"));
  return { ESLint, version };
}

export async function runChild({ repo, scope: name, mode, runs }) {
  const scope = SCOPES[name];
  const root = path.join(repo, scope.cwd);
  let phase = "import";
  const spy = spyOnReads(repo, () => phase);
  try {
    const { ESLint, version } = await eslintOf(repo);
    const plugin = await timed(() => import(pathToFileURL(path.join(repo, PLUGIN)).href));
    const config = await timed(() => import(pathToFileURL(path.join(repo, scope.config)).href));
    const overrideConfig = configFor(config.value.default, mode);
    const make = (stats) =>
      new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig, cache: false, stats });

    phase = "first file";
    const first = fs.existsSync(path.join(root, scope.first)) ? scope.first : undefined;
    const cold = first ? await timed(() => make(false).lintFiles([first])) : undefined;
    const plain = make(false);
    const warm = [];
    if (first) {
      await plain.lintFiles([first]);
      phase = "first file, warm";
      for (let i = 0; i < WARM_REPEATS; i++)
        warm.push((await timed(() => plain.lintFiles([first]))).ms);
    }

    // What the run reads from disk, hashed before and after: someone editing the tree mid-run
    // changes the findings without the lint being at fault.
    const watched = () => [
      ...fs.globSync(scope.files, { cwd: root }).map((file) => path.join(root, file)),
      ...fs.globSync(WATCHED, { cwd: repo }).map((file) => path.join(repo, file)),
    ];
    phase = undefined; // the bench's own reads are not the plugin's
    const treeBefore = contentsOf(watched(), repo);

    phase = "warm-up";
    const withStats = make(true);
    const warmup = await corpusRun(plain, scope.files, root);
    const warmupStats = await corpusRun(withStats, scope.files, root);

    phase = "runs";
    const measured = [];
    for (let i = 0; i < runs; i++) {
      const run = await corpusRun(plain, scope.files, root);
      const stats = await corpusRun(withStats, scope.files, root);
      measured.push({ run, stats, times: stats.times });
      process.stderr.write(
        `  ${name} ${mode} run ${i + 1}/${runs}: ${run.ms.toFixed(0)} ms (stats ${stats.ms.toFixed(0)} ms)\n`,
      );
    }
    spy.restore();

    const treeChanged = contentsOf(watched(), repo) !== treeBefore;
    const all = [warmup, warmupStats, ...measured.flatMap(({ run, stats }) => [run, stats])];
    const digests = [...new Set(all.map(({ digest }) => digest))];
    const counts = [...new Set(all.map(({ messages }) => messages))];
    const differences = all
      .map((run, index) => ({ run: RUN_NAMES(index), ...differenceOf(warmup.lines, run.lines) }))
      .filter(({ gone, added }) => gone.length || added.length);

    return {
      scope: name,
      mode,
      eslint: version,
      files: warmup.files,
      corpus: contentsOf(warmup.paths, repo),
      findings: {
        messages: warmup.messages,
        ledger: warmup.ledger,
        fatal: warmup.fatal,
        perRule: warmup.perRule,
        digest: warmup.digest,
        deterministic: digests.length === 1 && counts.length === 1,
        treeChanged,
        counts,
        digests,
        differences,
      },
      cold: {
        pluginImportMs: plugin.ms,
        configImportMs: config.ms,
        firstFile: first,
        firstFileColdMs: cold?.ms,
        firstFileWarmMs: warm.length ? median(warm) : undefined,
        warmupMs: warmup.ms,
        reads: spy.reads,
      },
      runs: measured.map(({ run, stats, times }) => ({
        ms: run.ms,
        statsMs: stats.ms,
        rssMiB: run.rssMiB,
        parseMs: times.parse,
        rules: times.rules,
      })),
      peakRssMiB: process.resourceUsage().maxRSS / 1024,
    };
  } finally {
    spy.restore();
  }
}

/** data.js's loads in a fresh process: the first and second call of each. */
export async function runProbe({ repo }) {
  const data = await import(pathToFileURL(path.join(repo, DATA)).href);
  const probe = {};
  for (const name of ["lintFacts", "lintValues", "staleness"]) {
    if (typeof data[name] !== "function") {
      probe[name] = null;
      continue;
    }
    const first = await timed(() => data[name]());
    const second = await timed(() => data[name]());
    probe[name] = { firstMs: first.ms, secondMs: second.ms };
  }
  return probe;
}

/* ---------- the parent ---------- */

function spawnChild(options, spec) {
  const child = spawnSync(
    process.execPath,
    ["--expose-gc", fileURLToPath(import.meta.url), "--child", JSON.stringify(spec)],
    {
      cwd: options.repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 256 * 2 ** 20,
    },
  );
  const line = child.stdout
    ?.split("\n")
    .reverse()
    .find((text) => text.startsWith(RESULT_MARK));
  if (child.status !== 0 || !line)
    throw new BenchError(
      `The ${spec.scope ?? "probe"} ${spec.mode ?? ""} process failed (exit ${child.status}${child.signal ? `, ${child.signal}` : ""}).`,
    );
  return JSON.parse(line.slice(RESULT_MARK.length));
}

const git = (repo, args) => {
  try {
    return execFileSync("git", args, {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
};

/** A child's raw measurements, summarized. */
export function summarizeChild(raw) {
  const wall = summarize(raw.runs.map(({ ms }) => ms));
  const rules = {};
  for (const rule of new Set(raw.runs.flatMap(({ rules: times }) => Object.keys(times))))
    rules[rule] = summarize(raw.runs.map(({ rules: times }) => times[rule] ?? 0));
  const ruleTotal = median(
    raw.runs.map(({ rules: times }) => Object.values(times).reduce((a, b) => a + b, 0)),
  );
  return {
    scope: raw.scope,
    mode: raw.mode,
    eslint: raw.eslint,
    files: raw.files,
    corpus: raw.corpus,
    wall,
    msPerFile: wall.median / raw.files,
    filesPerSecond: raw.files / (wall.median / 1000),
    stats: summarize(raw.runs.map(({ statsMs }) => statsMs)),
    parse: summarize(raw.runs.map(({ parseMs }) => parseMs)),
    ruleTotal,
    rules,
    rssAfterRunMiB: summarize(raw.runs.map(({ rssMiB }) => rssMiB)),
    peakRssMiB: raw.peakRssMiB,
    cold: {
      ...raw.cold,
      coldMinusWarmMs:
        raw.cold.firstFileColdMs === undefined
          ? undefined
          : raw.cold.firstFileColdMs - raw.cold.firstFileWarmMs,
    },
    findings: raw.findings,
  };
}

export async function runBench(options) {
  const { repo } = options;
  for (const needed of [PLUGIN, ...options.scopes.map((scope) => SCOPES[scope].config)])
    if (!fs.existsSync(path.join(repo, needed)))
      throw new BenchError(`${repo} has no ${needed}: give --repo the checkout's root.`);
  // A rule no block turns on would time the parser alone and read as a rule that costs nothing.
  if (options.only)
    for (const scope of options.scopes) {
      const { config } = SCOPES[scope];
      const { default: blocks } = await import(pathToFileURL(path.join(repo, config)).href);
      if (!turnsOn(blocks, options.only))
        throw new BenchError(
          `--only ${options.only}: no block of ${config} turns that rule on, so the ${scope} run would time the parser alone. Name a rule the ${scope} config runs, or narrow --scope.`,
        );
    }
  process.stderr.write(`lint-bench: probing data.js…\n`);
  const probe = spawnChild(options, { repo, probe: true });
  const results = [];
  for (const scope of options.scopes)
    for (const mode of options.modes) {
      process.stderr.write(`lint-bench: ${scope} ${mode}, ${options.runs} runs…\n`);
      results.push(summarizeChild(spawnChild(options, { repo, scope, mode, runs: options.runs })));
    }
  const head = git(repo, ["rev-parse", "--short", "HEAD"]);
  // No optional locks: a status run must not take the index lock from someone else's commit.
  const changed = git(repo, ["--no-optional-locks", "status", "--porcelain"])
    ?.split("\n")
    .filter(Boolean).length;
  const { version } = JSON.parse(
    fs.readFileSync(path.join(repo, "packages/design-system/package.json"), "utf8"),
  );
  return {
    format: FORMAT,
    at: new Date().toISOString(),
    runs: options.runs,
    environment: {
      node: process.version,
      eslint: results[0]?.eslint ?? undefined,
      platform: `${os.platform()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model,
      cpus: os.cpus().length,
    },
    tree: { head, changedFiles: changed, kitVersion: version },
    probe,
    results,
    overhead: overheadOf(results),
  };
}

/** What the rules cost, per scope: full minus parse-only, in total and at the first file. */
export function overheadOf(results) {
  const overhead = {};
  for (const full of results.filter(({ mode }) => mode === "full")) {
    const bare = results.find(({ scope, mode }) => scope === full.scope && mode === "parse-only");
    if (!bare) continue;
    overhead[full.scope] = {
      ms: full.wall.median - bare.wall.median,
      msPerFile: (full.wall.median - bare.wall.median) / full.files,
      coldMs:
        full.cold.coldMinusWarmMs === undefined || bare.cold.coldMinusWarmMs === undefined
          ? undefined
          : full.cold.coldMinusWarmMs - bare.cold.coldMinusWarmMs,
    };
  }
  return overhead;
}

/* ---------- printing ---------- */

const ms = (value) =>
  value === undefined || Number.isNaN(value) ? "–" : `${value.toFixed(value < 10 ? 2 : 0)} ms`;
const pct = (value) => `${(value * 100).toFixed(1)}%`;
const mib = (value) => `${value.toFixed(0)} MiB`;
const kib = (bytes) => `${(bytes / 1024).toFixed(0)} KiB`;
const signed = (value, unit = " ms", digits = 0) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}${unit}`;

/** Rows as aligned columns: numbers right, text left. */
export function table(rows) {
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => String(row[column]).length)),
  );
  const numeric = rows[0].map((_, column) =>
    rows.slice(1).every((row) => /^[−+\-\d.,%± ]+(ms|MiB|KiB|%)?$|^–$/.test(String(row[column]))),
  );
  return rows
    .map((row) =>
      row
        .map((cell, column) =>
          numeric[column]
            ? String(cell).padStart(widths[column])
            : String(cell).padEnd(widths[column]),
        )
        .join("  ")
        .trimEnd(),
    )
    .join("\n");
}

/** Reads as listed: each JSON file on its own line (×2 when read twice, "head" when only its
    head was read), the other files of a phase as one line by extension (staleness hashes every
    stylesheet). */
export function groupReads(reads) {
  const rows = new Map();
  for (const { phase, file, bytes, ms: time, part } of reads) {
    const extension = path.extname(file);
    const key =
      extension === ".json" ? `${phase}\0${file}\0${part ?? ""}` : `${phase}\0*${extension}`;
    const row = rows.get(key) ?? {
      phase,
      file,
      part,
      count: 0,
      bytes: 0,
      ms: 0,
      single: extension === ".json",
    };
    row.count += 1;
    row.bytes += bytes;
    row.ms += time;
    rows.set(key, row);
  }
  return [...rows.values()].map(({ phase, file, part, count, bytes, ms: time, single }) => ({
    phase,
    file: single
      ? `${file}${part ? ` (${part})` : ""}${count > 1 ? ` ×${count}` : ""}`
      : `${count} ${path.extname(file)} file${count > 1 ? "s" : ""}`,
    bytes,
    ms: time,
  }));
}

export function report(bench, top = 10) {
  const out = [];
  const { environment: env, tree } = bench;
  out.push(
    `Ledger lint bench · ${bench.runs} measured runs after one warm-up · median, spread = (max − min) / median`,
    `node ${env.node} · eslint ${env.eslint} · ${env.platform} · ${env.cpu} × ${env.cpus} · HEAD ${tree.head ?? "?"}${tree.changedFiles ? ` with ${tree.changedFiles} changed files` : ""} · kit ${tree.kitVersion}`,
    "",
    table([
      [
        "scope",
        "mode",
        "files",
        "median",
        "spread",
        "ms/file",
        "files/s",
        "peak RSS",
        "messages",
        "ledger",
        "digest",
      ],
      ...bench.results.map((r) => [
        r.scope,
        r.mode,
        r.files,
        ms(r.wall.median),
        pct(r.wall.spread),
        r.msPerFile.toFixed(2),
        r.filesPerSecond.toFixed(0),
        mib(r.peakRssMiB),
        r.findings.messages,
        r.findings.ledger,
        r.findings.digest.slice(0, 12),
      ]),
    ]),
  );
  for (const [scope, o] of Object.entries(bench.overhead))
    out.push(
      `${scope}: the rules cost ${signed(o.ms)} (${signed(o.msPerFile, " ms/file", 2)}) over parse-only on a warm run${o.coldMs === undefined ? "" : `, and a further ${signed(o.coldMs)} at the first file of a fresh process`}.`,
    );

  out.push("", "Cold start (each scope × mode in a fresh process)");
  out.push(
    table([
      ["", ...bench.results.map((r) => `${r.scope} ${r.mode}`)],
      ["plugin import", ...bench.results.map((r) => ms(r.cold.pluginImportMs))],
      ["config import", ...bench.results.map((r) => ms(r.cold.configImportMs))],
      ["first file, cold", ...bench.results.map((r) => ms(r.cold.firstFileColdMs))],
      [
        `first file, warm (median of ${WARM_REPEATS})`,
        ...bench.results.map((r) => ms(r.cold.firstFileWarmMs)),
      ],
      ["cold − warm", ...bench.results.map((r) => ms(r.cold.coldMinusWarmMs))],
      ["warm-up run (whole corpus)", ...bench.results.map((r) => ms(r.cold.warmupMs))],
      ["median run", ...bench.results.map((r) => ms(r.wall.median))],
    ]),
  );
  for (const r of bench.results.filter(({ mode }) => mode === "full")) {
    out.push(``, `${r.scope}: plugin reads (first file ${r.cold.firstFile ?? "none"})`);
    const reads = groupReads(r.cold.reads);
    out.push(
      reads.length
        ? table([
            ["phase", "file", "size", "read"],
            ...reads.map((read) => [read.phase, read.file, kib(read.bytes), ms(read.ms)]),
          ])
        : "  none",
    );
  }
  if (bench.probe) {
    out.push("", "data.js in a fresh process (read, parse and check, not the lint)");
    out.push(
      table([
        ["call", "first", "second"],
        ...Object.entries(bench.probe).map(([name, t]) =>
          t ? [`${name}()`, ms(t.firstMs), ms(t.secondMs)] : [`${name}()`, "–", "–"],
        ),
      ]),
    );
  }
  for (const r of bench.results.filter(({ mode }) => mode !== "parse-only")) {
    const ranked = Object.entries(r.rules).sort(([, a], [, b]) => b.median - a.median);
    const ledger = ranked
      .filter(([rule]) => rule.startsWith("ledger/"))
      .reduce((sum, [, t]) => sum + t.median, 0);
    out.push(
      "",
      `Top ${Math.min(top, ranked.length)} rules by time · ${r.scope} ${r.mode} · rule time ${ms(r.ruleTotal)} (ledger ${ms(ledger)}), parse ${ms(r.parse.median)}, stats run ${ms(r.stats.median)} against ${ms(r.wall.median)} plain`,
      table([
        ["rule", "median", "spread", "share", "ms/file", "findings"],
        ...ranked
          .slice(0, top)
          .map(([rule, t]) => [
            rule,
            ms(t.median),
            pct(t.spread),
            pct(r.ruleTotal ? t.median / r.ruleTotal : 0),
            (t.median / r.files).toFixed(3),
            r.findings.perRule[rule] ?? 0,
          ]),
      ]),
    );
  }
  for (const r of bench.results.filter(({ findings }) => !findings.deterministic)) {
    const { counts, digests, treeChanged, differences = [] } = r.findings;
    out.push(
      "",
      treeChanged
        ? `FINDINGS CHANGED: ${r.scope} ${r.mode} reported ${counts.join(" / ")} messages (${digests.length} digests), and the corpus or the plugin changed on disk during the run. Bench a tree nobody is editing.`
        : `NON-DETERMINISTIC: ${r.scope} ${r.mode} reported ${counts.join(" / ")} messages (${digests.length} digests) over one unchanged tree. The lint keeps state between files or runs.`,
      ...differences.flatMap(({ run, gone, added }) => [
        `  ${run} against the warm-up:`,
        ...gone.map((line) => `    − ${line}`),
        ...added.map((line) => `    + ${line}`),
      ]),
    );
  }
  return out.join("\n");
}

/** The change from an earlier result to this one. */
export function compareReport(before, after, top = 10) {
  const out = [
    `Against ${before.at} (HEAD ${before.tree?.head ?? "?"}, ${before.runs} runs) → ${after.at} (HEAD ${after.tree?.head ?? "?"}, ${after.runs} runs)`,
  ];
  const rows = [
    [
      "scope",
      "mode",
      "median",
      "Δ",
      "Δ%",
      "files/s",
      "peak RSS",
      "cold − warm",
      "messages",
      "findings",
      "corpus",
    ],
  ];
  const movers = [];
  for (const now of after.results) {
    const was = before.results.find(({ scope, mode }) => scope === now.scope && mode === now.mode);
    if (!was) {
      rows.push([now.scope, now.mode, ms(now.wall.median), "new", "", "", "", "", "", "", ""]);
      continue;
    }
    const delta = now.wall.median - was.wall.median;
    rows.push([
      now.scope,
      now.mode,
      `${ms(was.wall.median)} → ${ms(now.wall.median)}`,
      signed(delta),
      signed((delta / was.wall.median) * 100, "%", 1),
      `${was.filesPerSecond.toFixed(0)} → ${now.filesPerSecond.toFixed(0)}`,
      signed(now.peakRssMiB - was.peakRssMiB, " MiB"),
      now.cold.coldMinusWarmMs === undefined || was.cold.coldMinusWarmMs === undefined
        ? "–"
        : signed(now.cold.coldMinusWarmMs - was.cold.coldMinusWarmMs),
      `${was.findings.messages} → ${now.findings.messages}`,
      was.findings.digest === now.findings.digest ? "same" : "changed",
      was.corpus === now.corpus ? "same" : "changed",
    ]);
    for (const rule of new Set([...Object.keys(was.rules), ...Object.keys(now.rules)])) {
      const a = was.rules[rule]?.median ?? 0;
      const b = now.rules[rule]?.median ?? 0;
      movers.push([`${now.scope} ${now.mode}`, rule, a, b]);
    }
  }
  out.push(table(rows));
  const ranked = movers.sort((x, y) => Math.abs(y[3] - y[2]) - Math.abs(x[3] - x[2])).slice(0, top);
  if (ranked.length)
    out.push(
      "",
      `Rules that moved most (median ms)`,
      table([
        ["scope", "rule", "before", "after", "Δ"],
        ...ranked.map(([where, rule, a, b]) => [
          where,
          rule,
          ms(a),
          ms(b),
          signed(b - a, " ms", 1),
        ]),
      ]),
    );
  if (
    after.results.some((r) =>
      before.results.find((w) => w.scope === r.scope && w.mode === r.mode && w.corpus !== r.corpus),
    )
  )
    out.push(
      "",
      "The corpus changed between the two results, so a time also measures the new code.",
    );
  return out.join("\n");
}

/* ---------- main ---------- */

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new BenchError(`${file} is not a lint-bench result: ${error.message}`);
  }
};

export async function main(argv) {
  const options = parseArgs(argv);
  if (options.child) {
    const spec = JSON.parse(options.child);
    const result = spec.probe ? await runProbe(spec) : await runChild(spec);
    process.stdout.write(`${RESULT_MARK}${JSON.stringify(result)}\n`);
    return 0;
  }
  if (options.json && options.json !== "-" && isInside(options.repo, options.json))
    throw new BenchError(
      `lint-bench writes nothing in the checkout: give --json a path outside ${options.repo} (for example in ${os.tmpdir()}).`,
    );
  const bench = options.result ? readJson(options.result) : await runBench(options);
  if (bench.format !== FORMAT)
    throw new BenchError(`The result's format is ${bench.format}, not ${FORMAT}.`);
  if (options.json === "-") process.stdout.write(`${JSON.stringify(bench, null, 2)}\n`);
  else {
    console.log(report(bench, options.top));
    if (options.json && !options.result)
      fs.writeFileSync(options.json, `${JSON.stringify(bench, null, 2)}\n`);
  }
  if (options.compare)
    console.log(`\n${compareReport(readJson(options.compare), bench, options.top)}`);
  const unstable = bench.results.filter(({ findings }) => !findings.deterministic);
  if (unstable.length) {
    console.error(
      `lint-bench failed: the findings differ between runs in ${unstable.map((r) => `${r.scope} ${r.mode}${r.findings.treeChanged ? " (the tree changed mid-run)" : ""}`).join(", ")}.`,
    );
    return 1;
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      if (!(error instanceof BenchError)) throw error;
      console.error(error.message);
      process.exit(2);
    },
  );

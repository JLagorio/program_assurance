#!/usr/bin/env node
/**
 * Two corpus ratchets for the ledger lint, and a digest of everything it reports.
 *
 * - The clean corpus is this repository as its lint meets it: the product files under the root
 *   eslint.config.js and the kit's source, stories included, under packages/design-system's, each
 *   file with the ledger rules its scope's config turns on, at their own settings. Every allowance
 *   is taken off and inline directives are not applied, so a site an allowance or a disable keeps
 *   still counts. The count per rule may only fall: a rise is a report the rule did not make
 *   before, on code the lint already passes, so a false positive until shown otherwise. A rule the
 *   base counts and today's plugin lacks fails too, unless the baseline says it was `renamed` (the
 *   new name is held to the old count) or `removed`; --update never writes either.
 * - Where each rule runs is recorded with the counts: the config's global ignores, and every block
 *   that sets a ledger rule, with its files and ignores. A block that turns a rule off for a file,
 *   an ignore or a narrower glob is an allowance with no count, so every file the base had keeps
 *   each rule the base's config ran on it. A new file takes the reach today's config gives it.
 * - The stock corpus is packages/design-system/test/fixtures/stock-classes.json: shadcn's registry
 *   classes and a hand list of Tailwind's palette and scales, each class linted on its own `<div>`
 *   in one synthetic product file under the product config. It may only grow: a class the base
 *   linted and today's fixture lacks fails, or a class could leave with the verdict that matters.
 *   The baseline keeps the names of the classes no ledger rule reports. A class the base reported
 *   that starts to pass is listed under `stock.admitted`, in the same change, with a pointer to
 *   the page that makes it structural and names it there. A report on the element rather than on
 *   its class (use-primitives on a `<div className="flex">`) is not the class's. `doubleReported`,
 *   the classes two or more rules report, may only fall over the classes the base linted; the
 *   count per rule is information, since a class may rightly move from one rule to another.
 *
 * --check compares today's counts with scripts/lint-corpus-baseline.json as committed at the base
 * ref (DS_BASE_REF or --base-ref, as check-lint-changelog reads it; HEAD by default), where a rule
 * the base does not list is new, and fails too when the baseline in the tree is not today's
 * measurement, so a count that fell is recorded. It fails when a file does not parse or a scope
 * lints no file. --update writes today's measurement and says what changed. --rule <id> lints with
 * that rule alone and prints every finding. --digest prints a sha256 of every ledger finding in
 * both corpora (file, line, column, rule, message), the same on every run over the same tree, so a
 * change to the lint can show it changes no finding. With no flag it prints the counts.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ESLint } from "eslint";

import ledger from "../packages/design-system/eslint-plugin/index.js";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BASELINE = "scripts/lint-corpus-baseline.json";
export const FIXTURE = "packages/design-system/test/fixtures/stock-classes.json";
/** The product file the stock classes are linted as. It is never written. */
export const STOCK_FILE = "src/components/prototype/lint-corpus-stock.tsx";
/** Each scope: the config its lint runs with, and the folder it runs in. */
export const SCOPES = [
  { name: "product", config: "eslint.config.js", cwd: "." },
  { name: "kit", config: "packages/design-system/eslint.config.js", cwd: "packages/design-system" },
];
/** The pages that say which classes are structural, where an admitted stock class is named. */
export const ADMISSION_DOCS = [
  "docs/guides/component-library.md",
  "packages/design-system/src/stories/docs/Lint.mdx",
];
const UPDATE = "npm run lint:corpus -- --update";
const RULES = Object.keys(ledger.rules)
  .map((name) => `ledger/${name}`)
  .sort();
/** The files ESLint lints: JavaScript and TypeScript, as modules or scripts, with JSX or without. */
const LINTABLE = /\.[cm]?[jt]sx?$/;

/** A failure the run reports in its own words, without a stack. */
export class CorpusError extends Error {}

const plural = (count, one, many = `${one}s`) =>
  `${count.toLocaleString("en")} ${count === 1 ? one : many}`;
/** The first few of a list, and how many more. */
const some = (items, shown = 10) =>
  items.length > shown
    ? `${items.slice(0, shown).join(", ")} and ${items.length - shown} more`
    : items.join(", ");
const quoted = (items) => items.map((item) => `"${item}"`);

/* ---------- configs ---------- */

/** A rule's setting without its `allow` option; a setting left with no options is its severity. */
export function withoutAllowance(setting) {
  if (!Array.isArray(setting)) return setting;
  const [severity, options, ...rest] = setting;
  if (options === null || typeof options !== "object" || !("allow" in options)) return setting;
  const kept = Object.fromEntries(Object.entries(options).filter(([key]) => key !== "allow"));
  return Object.keys(kept).length || rest.length ? [severity, kept, ...rest] : severity;
}

/**
 * A config with its ledger rules alone, each without its allowance. With `only`, every other
 * ledger rule is off. The other plugins' rules are dropped: they never change a ledger finding.
 */
export function ledgerRulesOf(config, only) {
  return config.map((block) => {
    if (!block.rules) return block;
    const rules = {};
    for (const [name, setting] of Object.entries(block.rules))
      if (name.startsWith("ledger/"))
        rules[name] = only && name !== only ? "off" : withoutAllowance(setting);
    return { ...block, rules };
  });
}

/** The files a config gives the ledger plugin: the `files` of every block that registers it. */
export const ledgerFiles = (config) => [
  ...new Set(
    config.filter((block) => block.plugins?.ledger).flatMap((block) => (block.files ?? []).flat()),
  ),
];

/* ---------- reach ---------- */

const isOff = (setting) => {
  const severity = Array.isArray(setting) ? setting[0] : setting;
  return severity === 0 || severity === "off";
};

/** A block's files or ignores as the baseline records them; a function cannot be recorded. */
function patterns(list, name) {
  if ([list].flat(Infinity).some((pattern) => typeof pattern !== "string"))
    throw new CorpusError(
      `${name}'s config matches files with a function, which ${BASELINE} cannot record: write the pattern as a glob.`,
    );
  return list;
}

/**
 * Where a config runs each ledger rule, as the baseline records it: the global ignores, and every
 * block that sets a ledger rule, with its files, its ignores and each such rule on ("error") or
 * off. A severity or an option changes what a rule says, not where it runs.
 */
export function reachOf(config, name = "the scope") {
  const blocks = [];
  for (const block of config) {
    const keys = Object.keys(block).filter((key) => key !== "name");
    if (keys.length === 1 && keys[0] === "ignores") {
      blocks.push({ ignores: patterns(block.ignores, name) });
      continue;
    }
    const rules = Object.entries(block.rules ?? {}).filter(([rule]) => rule.startsWith("ledger/"));
    if (!rules.length) continue;
    blocks.push({
      ...(block.basePath !== undefined && { basePath: block.basePath }),
      ...(block.files && { files: patterns(block.files, name) }),
      ...(block.ignores && { ignores: patterns(block.ignores, name) }),
      rules: Object.fromEntries(
        rules.map(([rule, setting]) => [rule, isOff(setting) ? "off" : "error"]),
      ),
    });
  }
  return blocks;
}

/**
 * A recorded reach as a config for today's plugin. A rule the baseline declares `removed` is left
 * out, one it declares `renamed` runs under its new name, and one today's plugin lacks is left out,
 * since the clean corpus reports it.
 */
export function reachConfig(reach, { renamed = {}, removed = [] } = {}) {
  const now = (rule) => (Object.hasOwn(renamed, rule) ? renamed[rule] : rule);
  return [
    { plugins: { ledger } },
    ...reach.map((block) =>
      block.rules
        ? {
            ...block,
            rules: Object.fromEntries(
              Object.entries(block.rules)
                .filter(([rule]) => !removed.includes(rule))
                .map(([rule, setting]) => [now(rule), setting])
                .filter(([rule]) => RULES.includes(rule)),
            ),
          }
        : block,
    ),
  ];
}

/** The files under a folder that ESLint could lint: those git lists, committed or not ignored. */
export function candidates(cwd) {
  let listed;
  try {
    listed = execFileSync(
      "git",
      ["-C", cwd, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
    );
  } catch {
    throw new CorpusError(`lint-corpus reads the files git lists, and ${cwd} is not in a clone.`);
  }
  const files = listed.split("\0").filter((file) => LINTABLE.test(file));
  return [...new Set(files)].filter((file) => existsSync(path.join(cwd, file))).sort();
}

/** The ledger rules each file runs under an ESLint's config, by the file's path from `cwd`. */
export async function rulesOn(eslint, cwd, files) {
  const on = new Map();
  for (const file of files) {
    const config = await eslint.calculateConfigForFile(path.join(cwd, file));
    const rules = Object.entries(config?.rules ?? {})
      .filter(([rule, setting]) => rule.startsWith("ledger/") && !isOff(setting))
      .map(([rule]) => rule);
    on.set(file, rules.sort());
  }
  return on;
}

/** An ESLint that runs a recorded reach, to ask it where each rule runs. */
const reachLinter = (cwd, reach, declared) =>
  new ESLint({ cwd, overrideConfigFile: true, overrideConfig: reachConfig(reach, declared) });

/**
 * The files each rule no longer runs on: every file of `before` that `existed` keeps, where the
 * rule ran then and does not in `after`. Both map a file to the rules that run on it.
 */
export function lostReach(before, after, existed = () => true) {
  const lost = {};
  for (const [file, rules] of before) {
    if (!existed(file)) continue;
    const now = new Set(after.get(file) ?? []);
    for (const rule of rules) if (!now.has(rule)) (lost[rule] ??= []).push(file);
  }
  return Object.fromEntries(Object.entries(lost).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** A lostReach's rules grouped by the files they share, so an ignored file is one group: the
    group's name for its rules, whether it is one, and the files. */
export function byFiles(byRule) {
  const groups = new Map();
  for (const [rule, files] of Object.entries(byRule)) {
    const key = files.join("\n");
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }
  return [...groups].map(([key, rules]) => ({
    rules: rules.length === 1 ? rules[0] : `${rules.length} ledger rules (${some(rules, 4)})`,
    one: rules.length === 1,
    files: key.split("\n"),
  }));
}

/* ---------- the stock corpus ---------- */

/** Every combination of a set's axes, joined with a hyphen; an empty value leaves its axis out. */
const combinations = (axes) =>
  axes.reduce(
    (heads, values) =>
      heads.flatMap((head) => values.map((value) => [head, value].filter(Boolean).join("-"))),
    [""],
  );

/** Every class the fixture holds, once each and in its order: shadcn's strings split into their
    classes, then each Tailwind set's combinations, then the classes it lists as written. */
export function stockClasses(fixture) {
  const classes = [
    ...[...fixture.shadcn.defaults, ...fixture.shadcn.callers].flatMap((text) => text.split(/\s+/)),
    ...fixture.tailwind.sets.flatMap(({ axes }) => combinations(axes)),
    ...fixture.tailwind.classes,
  ];
  return [...new Set(classes.filter(Boolean))];
}

const INDENT = "    ";
/** The column of `className`: a report there or after it is about the class, one before it about
    the element. */
const CLASS_COLUMN = `${INDENT}<div `.length + 1;

/** The synthetic file, one `<div>` per class and a line each, and the line of the first. */
export function stockSource(classes) {
  const head = [
    "// Stock Tailwind classes, one per element (scripts/lint-corpus.mjs).",
    "export const stockClasses = (",
    "  <>",
  ];
  const lines = classes.map((cls) => `${INDENT}<div className={${JSON.stringify(cls)}} />`);
  return { text: [...head, ...lines, "  </>", ");", ""].join("\n"), first: head.length + 1 };
}

/** The ledger rules that report each class, from the synthetic file's messages. */
export function stockVerdicts(classes, messages, first) {
  const verdicts = new Map(classes.map((cls) => [cls, new Set()]));
  for (const { ruleId, line, column } of messages) {
    const cls = classes[line - first];
    if (ruleId?.startsWith("ledger/") && cls !== undefined && column >= CLASS_COLUMN)
      verdicts.get(cls).add(ruleId);
  }
  return verdicts;
}

/** What --check reads of the verdicts: every class, the passing ones, the classes two or more
    rules report and how many, and the classes each rule reports; all names sorted. */
export function stockSummary(verdicts) {
  const byRule = {};
  for (const rules of verdicts.values())
    for (const rule of rules) byRule[rule] = (byRule[rule] ?? 0) + 1;
  const where = (keep) =>
    [...verdicts]
      .filter(([, rules]) => keep(rules.size))
      .map(([cls]) => cls)
      .sort();
  const reportedTwice = where((size) => size >= 2);
  return {
    classes: where(() => true),
    passing: where((size) => size === 0),
    reportedTwice,
    doubleReported: reportedTwice.length,
    byRule: Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => (a < b ? -1 : 1))),
  };
}

/** The utility a class names, without its variants or `!`: `md:text-sm` is `text-sm`. */
export function utilityOf(cls) {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < cls.length; index += 1) {
    const char = cls[index];
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 0) start = index + 1;
  }
  return cls.slice(start).replace(/^!|!$/g, "");
}

/** Whether a page names a class in backticks: as written, as its utility, or as a family, a prefix
    of either then `*` (`rounded-*`). A `*` with less before it (`*`, `*:`) names nothing. */
export function mentions(text, cls) {
  const names = [cls, utilityOf(cls)];
  for (const [, span] of text.matchAll(/`([^`\n]+)`/g)) {
    if (names.includes(span)) return true;
    const family = /^([^*\s]{2,})\*$/.exec(span)?.[1];
    if (family && names.some((name) => name.startsWith(family))) return true;
  }
  return false;
}

/* ---------- the digest ---------- */

/** A sha256 of the findings, each as [file, line, column, rule, message], in any order. */
export function digestOf(findings) {
  const lines = findings
    .map(({ file, line, column, ruleId, message }) =>
      JSON.stringify([file, line, column, ruleId, message]),
    )
    .sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

/* ---------- the baseline ---------- */

const ABOUT =
  "What the ledger lint reports on the two corpora of scripts/lint-corpus.mjs; --check holds today's measurement to this file as committed at the base ref. clean: reports per rule on this repository with every allowance and inline disable taken off, which may only fall; a rule the base counts and the plugin lacks is named in renamed (old name to new, which the old count then holds) or removed. reach: per scope, the global ignores and every config block that sets a ledger rule; every file the base had keeps each rule the base's config ran on it. stock.classes: the stock Tailwind classes linted, which may only grow. stock.passing: the classes no ledger rule reports; a class the base reported that joins it is named in stock.admitted, in the same change, with a pointer to the page that makes it structural and names it (docs/guides/component-library.md or the kit's Lint.mdx). stock.doubleReported: the classes two or more rules report, which may only fall over the classes the base linted. stock.byRule: the classes each rule reports, for information. Written by npm run lint:corpus -- --update, which keeps renamed, removed and admitted and never writes them.";

/**
 * The baseline a measurement writes. It keeps the tree's `renamed` and `removed` as they are, and
 * its admissions of classes that still pass.
 */
export function baselineOf(measured, tree = {}) {
  const passing = new Set(measured.stock.passing);
  const admitted = Object.entries(tree?.stock?.admitted ?? {}).filter(([cls]) => passing.has(cls));
  return {
    about: ABOUT,
    ...(tree?.renamed !== undefined && { renamed: tree.renamed }),
    ...(tree?.removed !== undefined && { removed: tree.removed }),
    clean: measured.clean,
    reach: measured.reach,
    stock: {
      doubleReported: measured.stock.doubleReported,
      byRule: measured.stock.byRule,
      admitted: Object.fromEntries(admitted),
      passing: measured.stock.passing,
      classes: measured.stock.classes,
    },
  };
}

/** How the baseline in the tree differs from what this measurement writes, one line per change. */
export function changes(before, after) {
  const lines = [];
  const counts = (label, from = {}, to = {}) => {
    for (const key of [...new Set([...Object.keys(from), ...Object.keys(to)])].sort())
      if (from[key] !== to[key])
        lines.push(`${label} ${key}: ${from[key] ?? "none"} → ${to[key] ?? "none"}`);
  };
  counts("clean", before?.clean, after.clean);
  for (const scope of [
    ...new Set([...Object.keys(before?.reach ?? {}), ...SCOPES.map(({ name }) => name)]),
  ])
    if (JSON.stringify(before?.reach?.[scope]) !== JSON.stringify(after.reach?.[scope]))
      lines.push(`reach ${scope}: the config blocks that decide where a ledger rule runs changed`);
  const had = new Set(before?.stock?.classes ?? []);
  const has = new Set(after.stock.classes);
  const added = [...has].filter((cls) => !had.has(cls));
  const dropped = [...had].filter((cls) => !has.has(cls));
  if (added.length)
    lines.push(
      `stock corpus: adds ${plural(added.length, "class", "classes")}: ${some(quoted(added))}`,
    );
  if (dropped.length)
    lines.push(
      `stock corpus: drops ${plural(dropped.length, "class", "classes")}: ${some(quoted(dropped))}`,
    );
  // A verdict changes on a class both measurements linted; a class new to the corpus is new.
  const both = (cls) => had.has(cls) && has.has(cls);
  const was = new Set(before?.stock?.passing ?? []);
  const is = new Set(after.stock.passing);
  const joined = [...is].filter((cls) => !was.has(cls) && both(cls));
  const left = [...was].filter((cls) => !is.has(cls) && both(cls));
  if (joined.length) lines.push(`stock: now passes ${quoted(joined).join(", ")}`);
  if (left.length) lines.push(`stock: now reported ${quoted(left).join(", ")}`);
  if (before?.stock?.doubleReported !== after.stock.doubleReported)
    lines.push(
      `stock doubleReported: ${before?.stock?.doubleReported ?? "none"} → ${after.stock.doubleReported}`,
    );
  counts("stock byRule", before?.stock?.byRule, after.stock.byRule);
  const gone = Object.keys(before?.stock?.admitted ?? {}).filter(
    (cls) => !Object.hasOwn(after.stock.admitted, cls),
  );
  if (gone.length)
    lines.push(
      `stock admitted: ${quoted(gone).join(", ")} no longer pass${gone.length === 1 ? "es" : ""}, so the admission goes`,
    );
  return lines;
}

/** Why an admission's pointer does not show its class is structural, or nothing when it does.
    `read` gives a page's text from the repository root, or undefined when it is no file. */
export function admissionProblem(cls, pointer, read) {
  const page = typeof pointer === "string" ? pointer.split("#")[0] : undefined;
  if (!ADMISSION_DOCS.includes(page))
    return `Stock corpus: the admission of "${cls}" points at ${JSON.stringify(pointer)}. An admission points at the page that makes the class structural, ${ADMISSION_DOCS.join(" or ")}, as "<page>#<heading>".`;
  const text = read(page);
  if (text === undefined)
    return `Stock corpus: the admission of "${cls}" points at ${page}, which is no file in this repository.`;
  if (mentions(text, cls)) return undefined;
  const utility = utilityOf(cls);
  const family = utility.includes("-")
    ? ` or its family, \`${utility.replace(/[^-]*$/, "")}*\``
    : "";
  return `Stock corpus: "${cls}" is admitted by ${page}, which does not name it. Where the page says why the class is structural, name it in backticks: \`${utility}\`${family}.`;
}

/**
 * What --check fails on. `base` is the baseline committed at the base ref, or undefined when the
 * base has none (this change lands it); `tree` the one in the working tree; `reach` the rules each
 * scope's config no longer runs on files the base had, from lostReach; `read` gives a page's text
 * from the repository root, or undefined when it is no file.
 */
export function compare({ measured, base, baseName, tree, reach = [], read }) {
  const problems = [];
  const rules = new Set(Object.keys(measured.clean));
  const renamed = tree?.renamed ?? {};
  const removed = tree?.removed ?? [];
  if (typeof renamed !== "object" || Array.isArray(renamed) || !Array.isArray(removed))
    problems.push(
      `${BASELINE}: "renamed" maps an old rule to its new name, as {"ledger/old": "ledger/new"}, and "removed" lists rules, as ["ledger/old"].`,
    );
  else {
    for (const [from, to] of Object.entries(renamed))
      if (rules.has(from))
        problems.push(
          `${BASELINE}: "renamed" names ${from}, which is still a rule, so it was not renamed. Take the entry out.`,
        );
      else if (!rules.has(to))
        problems.push(
          `${BASELINE}: "renamed" gives ${from} the name ${JSON.stringify(to)}, which is no ledger rule.`,
        );
    for (const rule of removed)
      if (rules.has(rule))
        problems.push(
          `${BASELINE}: "removed" names ${rule}, which is still a rule. Take the entry out.`,
        );
  }
  if (base) {
    // The base's counts under today's names: a renamed rule's count is its new name's.
    const before = {};
    for (const [rule, count] of Object.entries(base.clean ?? {})) {
      const to = rules.has(rule) ? rule : Object.hasOwn(renamed, rule) ? renamed[rule] : undefined;
      if (to !== undefined && rules.has(to)) before[to] = (before[to] ?? 0) + count;
      else if (!Array.isArray(removed) || !removed.includes(rule))
        problems.push(
          `Clean corpus: ${rule} counted ${count} at ${baseName} and is no rule today, so its count would go unchecked. Name it in the baseline's "renamed" ({"${rule}": "ledger/<its new name>"}), which holds the new name to this count, or in "removed".`,
        );
    }
    for (const [rule, count] of Object.entries(measured.clean))
      if (before[rule] !== undefined && count > before[rule])
        problems.push(
          `Clean corpus: ${rule} reports ${count}, and ${before[rule]} at ${baseName}. The rule now reports code it passed before: fix the code if the report is right, and the rule if it is not; the baseline does not rise.`,
        );
    for (const { name, lost } of reach)
      for (const { rules, one, files } of byFiles(lost))
        problems.push(
          `Reach: ${rules} no longer ${one ? "runs" : "run"} on ${plural(files.length, `${name} file`)} ${one ? "it" : "they"} ran on at ${baseName}: ${some(files)}. A config block turns ${one ? "it" : "them"} off there, an ignore covers the file or a glob no longer matches it, and the clean corpus cannot count a report a rule does not make. Give the reach back.`,
        );
    // The classes the base linted; a baseline without them compares the whole corpus.
    const linted = base.stock?.classes ? new Set(base.stock.classes) : undefined;
    const has = new Set(measured.stock.classes);
    const gone = [...(linted ?? [])].filter((cls) => !has.has(cls));
    if (gone.length)
      problems.push(
        `Stock corpus: ${plural(gone.length, "class", "classes")} linted at ${baseName} ${gone.length === 1 ? "is" : "are"} not in ${FIXTURE}: ${some(quoted(gone))}. The corpus may only grow, or a class could leave with the verdict that matters: put ${gone.length === 1 ? "it" : "them"} back.`,
      );
    const passed = new Set(base.stock?.passing ?? []);
    const admitted = tree?.stock?.admitted ?? {};
    for (const cls of measured.stock.passing)
      if (!passed.has(cls) && (!linted || linted.has(cls)) && !Object.hasOwn(admitted, cls))
        problems.push(
          `Stock corpus: "${cls}" now passes every ledger rule, and did not at ${baseName}: the lint admits a stock Tailwind class. Restore the rule, or name the class in stock.admitted with a pointer to the page that makes it structural and names it.`,
        );
    const double = base.stock?.doubleReported;
    const doubleNow = linted
      ? measured.stock.reportedTwice.filter((cls) => linted.has(cls)).length
      : measured.stock.doubleReported;
    if (double !== undefined && doubleNow > double)
      problems.push(
        `Stock corpus: ${doubleNow} of the classes linted at ${baseName} are reported by two or more rules, and ${double} were there. A class has one owner; give the new report to one rule.`,
      );
  }
  for (const [cls, pointer] of Object.entries(tree?.stock?.admitted ?? {})) {
    const problem = admissionProblem(cls, pointer, read);
    if (problem) problems.push(problem);
  }
  if (!tree) problems.push(`${BASELINE} is missing. Write it with ${UPDATE}, and commit it.`);
  else {
    const stale = changes(tree, baselineOf(measured, tree));
    if (stale.length)
      problems.push(
        `${BASELINE} is not today's measurement:\n    ${stale.join("\n    ")}\n  Record it with ${UPDATE}, in this change.`,
      );
  }
  return problems;
}

/* ---------- the base ref ---------- */

/** The base ref as check-lint-changelog reads it: --base-ref, else DS_BASE_REF, else HEAD; a push's
    all-zero `before` on a new branch stands for the commit before HEAD. */
export function baseRef(args, env) {
  const index = args.indexOf("--base-ref");
  const asked = (index >= 0 && args[index + 1]) || env.DS_BASE_REF || "";
  const requested = asked || "HEAD";
  return { asked, requested, base: /^0+$/.test(requested) ? "HEAD^" : requested };
}

const gitIn =
  (root) =>
  (...args) =>
    execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });

/** The baseline committed at the base ref and what to call it, or no baseline when the base has
    none. A ref that was asked for and is no commit fails the run, and so does a shallow clone that
    lacks the commit before HEAD the all-zero SHA stands for. */
export function baselineAtBase(args, env, root = REPO) {
  const git = gitIn(root);
  const { asked, requested, base } = baseRef(args, env);
  try {
    git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
  } catch {
    if (asked && !/^0+$/.test(requested))
      throw new CorpusError(
        `The base ref ${base} does not resolve to a commit, so nothing can be compared with it. Fetch it, or pass a ref this clone has (DS_BASE_REF or --base-ref).`,
      );
    // A shallow clone has commits before HEAD that it did not fetch; only a first commit has none.
    if (/^0+$/.test(requested) && git("rev-parse", "--is-shallow-repository").trim() === "true")
      throw new CorpusError(
        `This clone is shallow, so ${base}, the commit before HEAD that the all-zero base ref stands for, was not fetched, and nothing can be compared with it. Fetch more history (fetch-depth: 0, or git fetch --deepen=1).`,
      );
    // The default HEAD before a first commit, and the all-zero SHA on a first commit, stand for no
    // base at all.
    return { name: base };
  }
  let committed;
  try {
    committed = git("show", `${base}:${BASELINE}`);
  } catch {
    // A base without the baseline, or without the kit at all (a pull request into main).
    return { name: base };
  }
  return { name: base, baseline: JSON.parse(committed) };
}

/** Every file committed at a ref, by its path from the repository root. */
const filesAt = (ref) =>
  new Set(gitIn(REPO)("ls-tree", "-r", "-z", "--full-tree", "--name-only", ref).split("\0"));

/* ---------- linting ---------- */

const relative = (file) => path.relative(REPO, file).split(path.sep).join("/");
/** A path from a scope's folder, from the repository root. */
const fromRoot = (scope, file) => path.posix.join(scope.cwd, file);

/** An ESLint for one scope: its config's ledger rules alone, each without its allowance, and no
    inline directive applied. */
export const linterFor = ({ cwd, config }, only) =>
  new ESLint({
    cwd,
    overrideConfigFile: true,
    // Both configs load in one process, so typescript-eslint is told which root each parses from.
    overrideConfig: [
      ...ledgerRulesOf(config, only),
      { languageOptions: { parserOptions: { tsconfigRootDir: cwd } } },
    ],
    allowInlineConfig: false,
  });

/** Lints the files a scope's config gives the ledger plugin; the ESLint, how many files and every
    message. A scope that lints no file fails the run. */
export async function lintScope({ name, cwd, config }, only) {
  const patterns = ledgerFiles(config);
  if (!patterns.length)
    throw new CorpusError(
      `Corpus check found no files to lint: ${name}'s config gives the ledger plugin none.`,
    );
  const eslint = linterFor({ cwd, config }, only);
  let results;
  try {
    results = await eslint.lintFiles(patterns);
  } catch (error) {
    if (["file-not-found", "all-matched-files-ignored"].includes(error.messageTemplate))
      throw new CorpusError(`Corpus check found no files to lint in ${name}: ${error.message}`);
    throw error;
  }
  if (!results.length) throw new CorpusError(`Corpus check found no files to lint in ${name}.`);
  const messages = results.flatMap((result) =>
    result.messages.map((message) => ({ ...message, file: relative(result.filePath) })),
  );
  return { eslint, files: results.length, messages };
}

/**
 * Where a scope's config runs each ledger rule, as recorded and file by file: every file git lists
 * under the scope (and the stock file, for the product) with the rules that run on it, by its path
 * from the repository root. The record must say what the config does, or it would ratchet
 * something else.
 */
export async function reachOfScope(scope, cwd, config, eslint) {
  const files = candidates(cwd);
  if (scope.name === "product") files.push(STOCK_FILE);
  const reach = reachOf(config, scope.name);
  const on = await rulesOn(eslint, cwd, files);
  const recorded = await rulesOn(reachLinter(cwd, reach), cwd, files);
  const differ = files.filter((file) => on.get(file).join() !== recorded.get(file).join());
  if (differ.length)
    throw new CorpusError(
      `The reach ${BASELINE} would record for ${scope.name} is not where its config runs the ledger rules, on ${some(differ.map((file) => fromRoot(scope, file)))}: a block that sets a ledger rule and has no files of its own takes them from another block. Give it its files.`,
    );
  return {
    reach,
    files,
    on: new Map([...on].map(([file, rules]) => [fromRoot(scope, file), rules])),
  };
}

/** The stock classes on their elements in the synthetic product file, linted with the product's
    ESLint: every message, and the rules that report each class. */
export async function lintStock(eslint, classes) {
  const { text, first } = stockSource(classes);
  const [result] = await eslint.lintText(text, { filePath: path.join(REPO, STOCK_FILE) });
  const messages = result.messages.map((message) => ({ ...message, file: STOCK_FILE }));
  return { messages, verdicts: stockVerdicts(classes, messages, first) };
}

/** Both corpora, linted, and where each scope runs each rule; with `only`, that ledger rule alone,
    and no reach. */
export async function lintCorpus({ only } = {}) {
  const scopes = [];
  for (const scope of SCOPES) {
    const { default: config } = await import(pathToFileURL(path.join(REPO, scope.config)).href);
    const cwd = path.join(REPO, scope.cwd);
    const linted = await lintScope({ name: scope.name, cwd, config }, only);
    const reach = only ? undefined : await reachOfScope(scope, cwd, config, linted.eslint);
    scopes.push({ ...scope, config, root: cwd, ...linted, reach });
  }
  const classes = stockClasses(JSON.parse(readFileSync(path.join(REPO, FIXTURE), "utf8")));
  const product = scopes.find(({ name }) => name === "product");
  const stock = await lintStock(product.eslint, classes);
  const all = [...scopes.flatMap(({ messages }) => messages), ...stock.messages];
  const ledgerOnly = (messages) => messages.filter(({ ruleId }) => ruleId?.startsWith("ledger/"));
  const clean = Object.fromEntries(RULES.map((rule) => [rule, 0]));
  for (const { messages } of scopes)
    for (const { ruleId } of ledgerOnly(messages)) clean[ruleId] += 1;
  return {
    scopes,
    classes,
    fatal: all.filter(({ fatal }) => fatal),
    findings: ledgerOnly(all),
    stockFindings: ledgerOnly(stock.messages),
    verdicts: stock.verdicts,
    measured: {
      clean,
      ...(!only && {
        reach: Object.fromEntries(scopes.map(({ name, reach }) => [name, reach.reach])),
      }),
      stock: stockSummary(stock.verdicts),
    },
  };
}

/**
 * Where each scope ran a rule under a recorded reach and runs it no longer, over today's files:
 * `recorded` is a baseline's reach, and `existed` keeps the files that count.
 */
async function reachLostSince(run, recorded, declared, existed) {
  const lost = [];
  for (const scope of run.scopes) {
    if (!recorded?.[scope.name]) continue;
    const eslint = reachLinter(scope.root, recorded[scope.name], declared);
    const before = await rulesOn(eslint, scope.root, scope.reach.files);
    const then = new Map([...before].map(([file, rules]) => [fromRoot(scope, file), rules]));
    lost.push({
      name: scope.name,
      lost: lostReach(then, scope.reach.on, existed),
      gained: lostReach(scope.reach.on, then, existed),
    });
  }
  return lost;
}

/* ---------- the run ---------- */

function report({ scopes, classes, measured }) {
  console.log(
    `Clean corpus: ${scopes.map(({ name, files }) => plural(files, `${name} file`)).join(", ")}.`,
  );
  for (const [rule, count] of Object.entries(measured.clean)) {
    if (!count) continue;
    const where = scopes
      .map(({ name, messages }) => [name, messages.filter(({ ruleId }) => ruleId === rule).length])
      .filter(([, n]) => n)
      .map(([name, n]) => `${name} ${n}`)
      .join(", ");
    console.log(`  ${rule}: ${count} (${where})`);
  }
  const { passing, doubleReported, byRule } = measured.stock;
  console.log(
    `Stock corpus: ${plural(classes.length, "class", "classes")}; ${plural(passing.length, "passes", "pass")} every ledger rule, ${plural(doubleReported, "is", "are")} reported by two or more.`,
  );
  for (const [rule, count] of Object.entries(byRule)) console.log(`  ${rule}: ${count}`);
}

function printRule(rule, { findings, stockFindings, verdicts, classes }) {
  const clean = findings
    .filter(({ ruleId, file }) => ruleId === rule && file !== STOCK_FILE)
    .sort((a, b) =>
      a.file === b.file ? a.line - b.line || a.column - b.column : a.file < b.file ? -1 : 1,
    );
  console.log(`Every finding of ${rule} in the clean corpus (${clean.length}):`);
  for (const { file, line, column, message } of clean)
    console.log(`  ${file}:${line}:${column}  ${message}`);
  const reported = classes.filter((cls) => verdicts.get(cls).has(rule));
  console.log(`Stock classes ${rule} reports (${reported.length}):`);
  if (reported.length) console.log(`  ${reported.join(" ")}`);
  const onElement = stockFindings.filter(
    ({ ruleId, column }) => ruleId === rule && column < CLASS_COLUMN,
  ).length;
  if (onElement > 0)
    console.log(`  and ${plural(onElement, "report")} on the element, not its class`);
}

/** A page's text from the repository root, or undefined when the path is no file. */
function readPage(file) {
  const full = path.join(REPO, file);
  try {
    return statSync(full).isFile() ? readFileSync(full, "utf8") : undefined;
  } catch {
    return undefined;
  }
}

export async function main(args) {
  const known = new Set(["--check", "--update", "--digest", "--rule", "--base-ref"]);
  const unknown = args.filter(
    (arg, index) =>
      arg.startsWith("--") &&
      !known.has(arg) &&
      !["--rule", "--base-ref"].includes(args[index - 1]),
  );
  if (unknown.length)
    throw new CorpusError(
      `lint-corpus takes --check, --update, --rule <id>, --digest and --base-ref <ref>; not ${unknown.join(", ")}.`,
    );
  const check = args.includes("--check");
  const update = args.includes("--update");
  const ruleIndex = args.indexOf("--rule");
  const asked = ruleIndex >= 0 ? args[ruleIndex + 1] : undefined;
  if (ruleIndex >= 0 && !asked) throw new CorpusError("--rule takes a rule, such as no-margin.");
  const rule = asked && (asked.startsWith("ledger/") ? asked : `ledger/${asked}`);
  if (rule && !RULES.includes(rule))
    throw new CorpusError(`${rule} is not a ledger rule; the plugin has ${RULES.join(", ")}.`);
  if (check && update) throw new CorpusError("Pass --check or --update, not both.");
  if (rule && (check || update))
    throw new CorpusError(
      "--rule lints one rule, so its counts are not the baseline's; run --check and --update without it.",
    );

  const run = await lintCorpus({ only: rule });
  if (run.fatal.length)
    throw new CorpusError(
      `Corpus check: ${plural(run.fatal.length, "file")} failed to parse, and a count that fell because a file stopped parsing is no improvement:\n  ${run.fatal
        .slice(0, 10)
        .map(({ file, line, message }) => `${file}:${line}: ${message}`)
        .join("\n  ")}`,
    );
  const digest = args.includes("--digest");
  if (digest)
    console.log(
      `Digest of ${plural(run.findings.length, "ledger finding")}${rule ? ` of ${rule}` : ""} in both corpora: ${digestOf(run.findings)}`,
    );
  if (rule) {
    printRule(rule, run);
    return 0;
  }

  const baselinePath = path.join(REPO, BASELINE);
  const tree = existsSync(baselinePath)
    ? JSON.parse(readFileSync(baselinePath, "utf8"))
    : undefined;
  if (update) {
    const next = baselineOf(run.measured, tree);
    const changed = changes(tree, next);
    // What each scope's change of reach means, file by file.
    for (const { name, lost, gained } of await reachLostSince(run, tree?.reach, tree ?? {}))
      for (const [label, byRule] of [
        ["no longer", lost],
        ["now", gained],
      ])
        for (const { rules, one, files } of byFiles(byRule))
          changed.push(
            `reach ${name}: ${rules} ${label} ${one ? "runs" : "run"} on ${some(files)}`,
          );
    writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(
      !tree
        ? `${BASELINE} written: ${plural(RULES.length, "rule")} counted, ${plural(next.stock.passing.length, "stock class", "stock classes")} passing.`
        : changed.length
          ? `${BASELINE} updated:\n  ${changed.join("\n  ")}`
          : `${BASELINE} already holds today's measurement.`,
    );
    const admitted = new Set(Object.keys(next.stock.admitted));
    const had = new Set(tree?.stock?.classes ?? []);
    const passed = new Set(tree?.stock?.passing ?? []);
    const unadmitted = run.measured.stock.passing.filter(
      (cls) => had.has(cls) && !passed.has(cls) && !admitted.has(cls),
    );
    if (unadmitted.length)
      console.log(
        `\nA class that newly passes is admitted by name in stock.admitted, with a pointer to the page that makes it structural and names it, or --check fails: ${quoted(unadmitted).join(", ")}.`,
      );
    const declared = new Set([...Object.keys(tree?.renamed ?? {}), ...(tree?.removed ?? [])]);
    const vanished = Object.keys(tree?.clean ?? {}).filter(
      (ruleId) => !RULES.includes(ruleId) && !declared.has(ruleId),
    );
    if (vanished.length)
      console.log(
        `\n${vanished.join(", ")} ${vanished.length === 1 ? "is" : "are"} no rule today. --check fails until the baseline says what became of ${vanished.length === 1 ? "it" : "them"}: "renamed": {"${vanished[0]}": "ledger/<its new name>"}, which holds the new name to the old count, or "removed": ["${vanished[0]}"]. --update never writes either.`,
      );
    return 0;
  }
  if (!check) {
    if (!digest) report(run);
    return 0;
  }

  const base = baselineAtBase(args, process.env);
  report(run);
  console.log(
    base.baseline
      ? `\nCompared with ${BASELINE} at ${base.name}.`
      : `\n${BASELINE} is new at ${base.name}, so this is where it starts.`,
  );
  let reach = [];
  if (base.baseline?.reach) {
    // A file the base had keeps its rules; the stock file stands for the fixture, which it had.
    const existed = filesAt(base.name).add(STOCK_FILE);
    reach = await reachLostSince(run, base.baseline.reach, tree ?? {}, (file) => existed.has(file));
  }
  const problems = compare({
    measured: run.measured,
    base: base.baseline,
    baseName: base.name,
    tree,
    reach,
    read: readPage,
  });
  if (problems.length) {
    console.error(`\n${problems.join("\n")}`);
    return 1;
  }
  console.log("Corpus check passed.");
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      if (!(error instanceof CorpusError)) throw error;
      console.error(error.message);
      process.exit(1);
    },
  );

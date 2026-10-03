#!/usr/bin/env node
/**
 * The allow-lists that let a gate land on a tree that does not pass it yet may only shrink. This
 * compares each list with its committed version at the base ref (DS_BASE_REF, as ds-check reads
 * it; HEAD by default) and fails when an entry was added or a count went up. A list that is new at
 * the base ref is the gate landing, so it passes; so is an entry under a ledger rule that is
 * landing: the plugin defines it now, and at the base ref it had neither a definition in the plugin
 * nor a row on the Lint rules page. Deleting an entry or lowering a count always passes. Keys named
 * `about` are notes. A base ref that was asked for and does not resolve to a commit fails the run,
 * since every list would otherwise be new there.
 *
 * - packages/design-system/test/lint-allow.json: ESLint reports per rule and file in the kit.
 * - scripts/lint-allow.json: ESLint reports per rule and file in the product.
 * - packages/design-system/test/gates-allow.json: story gate problems per story, skipped plays
 *   and stories that log a warning on purpose.
 * - packages/design-system/test/layout-allow.json: stories exempt from the layout checks.
 * - scripts/app-a11y-allow.json: axe violations and console messages per product screen.
 * - scripts/docs-render-allow.json: docs pages allowed to fail to render.
 * - packages/design-system/test/lint-redteam-escapes.json: the red-team matrix's cells the lint
 *   misses today, per rule and carrier, and the routes around every rule (lint-redteam.test.mjs).
 * - packages/design-system/test/css-token-allow.json: literal lengths in the kit's stylesheets that
 *   no token of their value and role holds yet, per file and literal (css-tokens.test.mjs).
 *
 * Two more are computed, not committed:
 *
 * - Inline directives that name a ledger rule, per file and rule, in src and the kit's src. Each
 *   one says why after ` -- ` (ledger/no-inline-config), and their counts shrink like the lists'.
 *   A disable that names no rule (bare, or a list of only commas and empty quotes) turns every
 *   ledger rule off, including the one that would report it, so it is counted too, as
 *   `<file> › every rule`. At a base ref without the kit (a pull request into main) the count
 *   starts, as a new list does.
 * - ESLint applies an eslint-suppressions.json by itself, so neither the product nor the kit keeps
 *   one: a report of ESLint's or typescript-eslint's rules is fixed at its site, and a ledger
 *   report ratchets through lint-allow.json, where the rule sees it. A suppressions file that names
 *   a ledger rule is named for that too.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import tseslint from "typescript-eslint";

import {
  ledgerRules,
  namesNoRule,
  readDirective,
} from "../packages/design-system/eslint-plugin/config-rules.js";
import ledger from "../packages/design-system/eslint-plugin/index.js";

const LISTS = [
  "packages/design-system/test/lint-allow.json",
  "scripts/lint-allow.json",
  "packages/design-system/test/gates-allow.json",
  "packages/design-system/test/layout-allow.json",
  "scripts/app-a11y-allow.json",
  "scripts/docs-render-allow.json",
  "packages/design-system/test/lint-redteam-escapes.json",
  "packages/design-system/test/css-token-allow.json",
];
const SUPPRESSIONS = [
  "eslint-suppressions.json",
  "packages/design-system/eslint-suppressions.json",
];
const LINT_PAGE = "packages/design-system/src/stories/docs/Lint.mdx";
const PLUGIN = "packages/design-system/eslint-plugin";
const DIRECTIVES = "inline ledger directives in src and packages/design-system/src";
const DIRECTIVE_ROOTS = [
  "src",
  "packages/design-system/src",
  ":!packages/design-system/src/generated",
];
const argument = process.argv.indexOf("--base-ref");
const requested =
  (argument > 0 ? process.argv[argument + 1] : undefined) || process.env.DS_BASE_REF || "HEAD";
const base = /^0+$/.test(requested) ? "HEAD^" : requested;

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
/** Whether git answers `args` with success: 1 is no, anything else is an error. */
function gitSays(...args) {
  try {
    git(...args);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

// A base that does not resolve would make every list new there, so any growth would pass: a ref
// that was asked for must be a commit this clone has. The default HEAD outside a repository, and
// the all-zero SHA of a new branch on a first commit, stand for no base at all.
let baseResolves = true;
try {
  git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
} catch {
  baseResolves = false;
}
const asked = (argument > 0 && process.argv[argument + 1]) || process.env.DS_BASE_REF;
if (!baseResolves && asked && !/^0+$/.test(requested)) {
  console.error(
    `The base ref ${base} does not resolve to a commit, so nothing can be compared with it. Fetch it, or pass a ref this clone has (DS_BASE_REF or --base-ref).`,
  );
  process.exit(1);
}

/** Every leaf of a list, as a path and its value, notes left out. */
function leaves(value, prefix = [], out = new Map()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value))
      if (key !== "about") leaves(child, [...prefix, key], out);
  } else out.set(prefix.join(" › "), value);
  return out;
}

/** The ledger rule a key sits under, if any. */
const ruleOf = (key) => key.split(" › ").find((part) => /^ledger\/[\w-]+$/.test(part));

/**
 * The ledger rules with a row on the Lint rules page at the base ref. When the page cannot be read,
 * no rule is landing.
 */
function documentedAtBase() {
  try {
    return new Set(
      git("show", `${base}:${LINT_PAGE}`)
        .split("\n")
        .map((line) => /^\|\s*`([a-z-]+)`\s*\|/.exec(line)?.[1])
        .filter(Boolean)
        .map((rule) => `ledger/${rule}`),
    );
  } catch {
    return undefined;
  }
}
const documented = documentedAtBase();

/**
 * Whether a ledger rule lands in this change, so its entries are where its gate starts: the plugin
 * defines it now, and at the base ref it had no row on the Lint rules page and the plugin did not
 * name it. A rule that already ran at the base, with or without a row, grows like any other.
 */
const landingRules = new Map();
function landing(rule) {
  if (!landingRules.has(rule))
    landingRules.set(
      rule,
      Boolean(documented) &&
        !documented.has(rule) &&
        rule.slice("ledger/".length) in ledger.rules &&
        !gitSays(
          "grep",
          "-q",
          "-F",
          "-e",
          `"${rule.slice("ledger/".length)}"`,
          "-e",
          `${rule}"`,
          base,
          "--",
          PLUGIN,
        ),
    );
  return landingRules.get(rule);
}

/**
 * Inline directives that name a ledger rule, as `<file> › <rule>` and a count, in the working tree
 * or at `ref`, and disables that name no rule, as `<file> › every rule`. git grep finds the files
 * that mention eslint; the parser reads their comments as ESLint does, so a directive split over
 * lines or quoted in a string is read correctly.
 */
function inlineDirectives(ref) {
  const where = ref ? [ref] : ["--untracked"];
  let files;
  try {
    files = git("grep", "-l", "-e", "eslint", ...where, "--", ...DIRECTIVE_ROOTS);
  } catch (error) {
    if (error.status === 1) files = "";
    else throw error;
  }
  const counts = new Map();
  for (const line of files.split("\n")) {
    const file = ref ? line.slice(ref.length + 1) : line;
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    const text = ref ? git("show", `${ref}:${file}`) : readFileSync(file, "utf8");
    const { ast } = tseslint.parser.parseForESLint(text, {
      filePath: file,
      ecmaFeatures: { jsx: !/\.[cm]?ts$/.test(file) },
      loc: true,
      range: true,
    });
    for (const comment of ast.comments) {
      const directive = readDirective(comment);
      if (!directive) continue;
      const names = namesNoRule(directive) ? [{ name: "every rule" }] : ledgerRules(directive);
      for (const { name } of names) {
        const key = `${file} › ${name}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

const problems = [];
const misplaced = [];

/** Compares a list with its base, reports growth and landing, and prints one summary line. */
function compare(name, current, previous) {
  let grew = 0;
  const landed = new Set();
  for (const [key, value] of current) {
    const growth = !previous.has(key)
      ? "is new"
      : typeof value === "number" && value > previous.get(key)
        ? `went from ${previous.get(key)} to ${value}`
        : undefined;
    if (!growth) continue;
    const rule = ruleOf(key);
    if (rule && landing(rule)) landed.add(rule);
    else {
      problems.push(`${name}: ${key} ${growth}`);
      grew += 1;
    }
  }
  const shrank = [...previous.keys()].filter(
    (key) =>
      !current.has(key) ||
      (typeof current.get(key) === "number" && current.get(key) < previous.get(key)),
  ).length;
  console.log(
    `${name}: ${current.size} entries${shrank ? `, ${shrank} fewer or lower than at ${base}` : ""}${grew ? `, ${grew} grew` : ""}${landed.size ? `; ${[...landed].join(", ")} land${landed.size === 1 ? "s" : ""} here, new to the plugin and to Lint.mdx since ${base}` : ""}`,
  );
}

for (const list of LISTS) {
  if (!existsSync(list)) continue;
  const current = leaves(JSON.parse(readFileSync(list, "utf8")));
  let committed;
  try {
    committed = git("show", `${base}:${list}`);
  } catch {
    console.log(`${list}: new at ${base}, so this is where it starts`);
    continue;
  }
  compare(list, current, leaves(JSON.parse(committed)));
}

// The count starts where the base has no kit to count against, as a list new at the base does.
const kitAtBase =
  baseResolves && git("ls-tree", "--name-only", base, "--", `${PLUGIN}/index.js`).trim() !== "";
if (kitAtBase) compare(DIRECTIVES, inlineDirectives(), inlineDirectives(base));
else console.log(`${DIRECTIVES}: ${base} has no kit, so this is where they start`);

if (existsSync(SUPPRESSIONS[0]))
  misplaced.push(
    `${SUPPRESSIONS[0]}: ESLint applies it by itself, so the product keeps none; its reports ratchet through scripts/lint-allow.json.`,
  );
if (existsSync(SUPPRESSIONS[1]))
  misplaced.push(
    `${SUPPRESSIONS[1]}: ESLint applies it by itself, so the kit keeps none; fix the site, and a ledger report ratchets through packages/design-system/test/lint-allow.json.`,
  );
for (const file of SUPPRESSIONS) {
  if (!existsSync(file)) continue;
  const rules = [...leaves(JSON.parse(readFileSync(file, "utf8"))).keys()].filter(ruleOf);
  for (const key of rules)
    misplaced.push(
      `${file}: ${key}: eslint-suppressions.json may not carry ledger rules; they ratchet through lint-allow.json.`,
    );
}

if (misplaced.length) console.error(`\n${misplaced.join("\n")}`);
if (problems.length)
  console.error(
    `\nAllow-lists may only shrink. Fix the site instead of listing it:\n  ${problems.join("\n  ")}`,
  );
if (misplaced.length || problems.length) process.exit(1);

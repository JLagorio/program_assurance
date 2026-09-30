// The corpus ratchets' own logic: what a config keeps, where it runs each rule, how the stock
// classes are laid out and judged, the digest, the base ref, and what --check fails on. The run
// over the repository is the script's own; these use small configs, throwaway folders and
// repositories, and made-up measurements.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../../packages/design-system/eslint-plugin/index.js";
import {
  BASELINE,
  CorpusError,
  FIXTURE,
  admissionProblem,
  baseRef,
  baselineAtBase,
  baselineOf,
  byFiles,
  compare,
  digestOf,
  ledgerFiles,
  ledgerRulesOf,
  linterFor,
  lintScope,
  lintStock,
  lostReach,
  mentions,
  reachConfig,
  reachOf,
  reachOfScope,
  rulesOn,
  stockClasses,
  stockSource,
  stockSummary,
  stockVerdicts,
  utilityOf,
  withoutAllowance,
} from "../lint-corpus.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
/** sha256 of packages/lint/test/fixtures/registry-corpus.json in shadcn-ui/lint, as vendored. */
const REGISTRY_CORPUS_SHA256 = "1fe08b008bbfc9e5738641873815bb960b2d559c8612708ad49cf7006b2131f9";
const REGISTRY_CORPUS = "docs/examples/lint-main/packages/lint/test/fixtures/registry-corpus.json";

test("a rule keeps its settings without its allowance", () => {
  assert.equal(withoutAllowance("error"), "error");
  assert.equal(withoutAllowance(["error", { allow: { "a.tsx": 2 } }]), "error");
  assert.deepEqual(withoutAllowance(["warn", { allow: { "a.tsx": 1 }, note: "N." }]), [
    "warn",
    { note: "N." },
  ]);
  assert.deepEqual(withoutAllowance(["error", { note: "N." }]), ["error", { note: "N." }]);
});

test("a config keeps its ledger rules alone, and with one rule asked for, only that one on", () => {
  const config = [
    { ignores: ["dist"] },
    { files: ["**/*.ts"], rules: { "no-unused-vars": "error", "ledger/no-margin": "error" } },
    {
      files: ["src/**/*.tsx"],
      plugins: { ledger },
      rules: {
        "ledger/use-primitives": ["warn", { allow: { "src/a.tsx": 3 } }],
        "ledger/no-margin": "off",
      },
    },
  ];
  assert.deepEqual(ledgerRulesOf(config), [
    { ignores: ["dist"] },
    { files: ["**/*.ts"], rules: { "ledger/no-margin": "error" } },
    {
      files: ["src/**/*.tsx"],
      plugins: { ledger },
      rules: { "ledger/use-primitives": "warn", "ledger/no-margin": "off" },
    },
  ]);
  const one = ledgerRulesOf(config, "ledger/use-primitives");
  assert.deepEqual(one[1].rules, { "ledger/no-margin": "off" });
  assert.deepEqual(one[2].rules, { "ledger/use-primitives": "warn", "ledger/no-margin": "off" });
  // The files are those of the blocks that register the plugin.
  assert.deepEqual(ledgerFiles(config), ["src/**/*.tsx"]);
});

test("the stock classes are the fixture's, split, combined and each listed once", () => {
  const classes = stockClasses({
    shadcn: { defaults: ["flex  p-4", "p-4 bg-red-500/50"], callers: [" mt-2 "] },
    tailwind: {
      sets: [{ axes: [["rounded"], ["", "t"], ["", "lg"]] }, { axes: [["-m"], ["px"]] }],
      classes: ["flex", "dark:bg-gray-900"],
    },
  });
  assert.deepEqual(classes, [
    "flex",
    "p-4",
    "bg-red-500/50",
    "mt-2",
    "rounded",
    "rounded-lg",
    "rounded-t",
    "rounded-t-lg",
    "-m-px",
    "dark:bg-gray-900",
  ]);
});

test("the fixture keeps shadcn's MIT notice beside its classes", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(REPO, FIXTURE), "utf8"));
  assert.equal(fixture.shadcn.license[0], "MIT License");
  assert.ok(fixture.shadcn.license.includes("Copyright (c) 2026 shadcn"));
  assert.match(fixture.shadcn.source, /shadcn-ui\/lint.*registry-corpus\.json/);
  assert.ok(fixture.shadcn.defaults.length + fixture.shadcn.callers.length > 0);
});

test("shadcn's strings are the pinned registry corpus, verbatim", () => {
  const { defaults, callers } = JSON.parse(
    fs.readFileSync(path.join(REPO, FIXTURE), "utf8"),
  ).shadcn;
  // registry-corpus.json is exactly this serialisation of its two lists, so a string deleted or
  // edited in the fixture changes the hash.
  const vendored = `${JSON.stringify({ defaults, callers }, null, 2)}\n`;
  assert.equal(createHash("sha256").update(vendored).digest("hex"), REGISTRY_CORPUS_SHA256);
  // Where the gitignored checkout of shadcn's lint is present, the pin is its file.
  const upstream = path.join(REPO, REGISTRY_CORPUS);
  if (fs.existsSync(upstream))
    assert.equal(
      createHash("sha256").update(fs.readFileSync(upstream)).digest("hex"),
      REGISTRY_CORPUS_SHA256,
    );
});

test("a report on the class's value is the class's, and one on the element is not", () => {
  const classes = ["flex", "p-4", "mt-4"];
  const { text, first } = stockSource(classes);
  const lines = text.split("\n");
  assert.equal(lines[first - 1], '    <div className={"flex"} />');
  const at = (index, needle) => lines[first - 1 + index].indexOf(needle) + 1;
  const messages = [
    { ruleId: "ledger/use-primitives", line: first, column: at(0, "<div") },
    { ruleId: "ledger/no-non-token-class", line: first + 1, column: at(1, '"p-4"') },
    { ruleId: "ledger/use-primitives", line: first + 1, column: at(1, "<div") },
    { ruleId: "ledger/no-margin", line: first + 2, column: at(2, '"mt-4"') },
    { ruleId: "ledger/no-non-token-class", line: first + 2, column: at(2, "className") },
    { ruleId: "react-hooks/rules-of-hooks", line: first + 2, column: at(2, '"mt-4"') },
    { ruleId: "ledger/no-margin", line: 1, column: 1 },
  ];
  const verdicts = stockVerdicts(classes, messages, first);
  assert.deepEqual(
    Object.fromEntries([...verdicts].map(([cls, rules]) => [cls, [...rules].sort()])),
    {
      flex: [],
      "p-4": ["ledger/no-non-token-class"],
      "mt-4": ["ledger/no-margin", "ledger/no-non-token-class"],
    },
  );
  assert.deepEqual(stockSummary(verdicts), {
    classes: ["flex", "mt-4", "p-4"],
    passing: ["flex"],
    reportedTwice: ["mt-4"],
    doubleReported: 1,
    byRule: { "ledger/no-margin": 1, "ledger/no-non-token-class": 2 },
  });
});

test("under the product config a stock class is judged by what reports its own value", async () => {
  const { default: config } = await import("../../eslint.config.js");
  const eslint = linterFor({ cwd: REPO, config });
  const classes = ["flex", "p-100", "p-4", "mt-4", "w-full", "bg-red-500"];
  const { verdicts } = await lintStock(eslint, classes);
  const passing = stockSummary(verdicts).passing;
  // use-primitives reports each <div> with flex or a padding, but on the element: flex and p-100
  // still pass, and p-4 is no-non-token-class's alone. A class has one owner, so mt-4 is
  // no-margin's alone.
  assert.deepEqual(passing, ["flex", "p-100", "w-full"]);
  assert.deepEqual([...verdicts.get("p-4")], ["ledger/no-non-token-class"]);
  assert.deepEqual([...verdicts.get("mt-4")], ["ledger/no-margin"]);
});

test("the digest is the same in any order, and changes with any finding", () => {
  const a = { file: "src/a.tsx", line: 1, column: 2, ruleId: "ledger/no-margin", message: "M." };
  const b = { file: "src/b.tsx", line: 3, column: 4, ruleId: "ledger/no-margin", message: "N." };
  assert.equal(digestOf([a, b]), digestOf([b, a]));
  assert.match(digestOf([a, b]), /^[0-9a-f]{64}$/);
  assert.notEqual(digestOf([a, b]), digestOf([a, { ...b, message: "N!" }]));
  assert.notEqual(digestOf([a, b]), digestOf([a, { ...b, column: 5 }]));
  assert.notEqual(digestOf([a]), digestOf([a, a]));
});

/**
 * A measurement: clean counts, and the stock corpus's classes, the passing ones and those two or
 * more rules report. The corpus is those and `bg-red-500` unless `classes` says otherwise.
 */
const measurement = ({
  clean = {},
  classes,
  passing = [],
  reportedTwice = [],
  byRule = {},
} = {}) => ({
  clean: { "ledger/no-margin": 0, "ledger/use-primitives": 9, ...clean },
  stock: {
    classes: [...new Set(classes ?? [...passing, ...reportedTwice, "bg-red-500"])].sort(),
    passing: [...passing].sort(),
    reportedTwice: [...reportedTwice].sort(),
    doubleReported: reportedTwice.length,
    byRule,
  },
});
/** The two pages an admission may point at, as a made-up text each. */
const PAGES = {
  "docs/guides/component-library.md": "Structural utilities: `p-4`, `rounded-*` and `text-sm`.",
  "packages/design-system/src/stories/docs/Lint.mdx": "## What counts as structural\n\n`flex`",
};
const read = (file) => PAGES[file];
/** --check's problems for a measurement, a baseline at the base and the tree's own. */
const check = (measured, base, declared = {}, tree = baselineOf(measured, declared)) =>
  compare({ measured, base, baseName: "base", tree, read });
const admitting = (admitted) => ({ stock: { admitted } });

test("a clean count may fall and never rise, and a rule the base does not list is new", () => {
  const base = baselineOf(measurement({ passing: ["flex"] }));
  assert.deepEqual(check(measurement({ passing: ["flex"] }), base), []);
  // Fixing product sites lowers the count.
  assert.deepEqual(
    check(measurement({ clean: { "ledger/use-primitives": 4 }, passing: ["flex"] }), base),
    [],
  );
  // A rule change that reports a story it passed before raises it.
  const [problem, ...rest] = check(
    measurement({ clean: { "ledger/use-primitives": 10 }, passing: ["flex"] }),
    base,
  );
  assert.equal(rest.length, 0);
  assert.match(problem, /^Clean corpus: ledger\/use-primitives reports 10, and 9 at base\./);
  // A rule that lands in this change starts its count here.
  assert.deepEqual(
    check(measurement({ clean: { "ledger/no-raw-colour": 3 }, passing: ["flex"] }), base),
    [],
  );
});

test("a rule the base counts and the plugin lacks fails, unless the baseline renames or removes it", () => {
  const base = baselineOf(measurement({ passing: ["flex"] }));
  /** Today's plugin: use-primitives is layout-primitives, reporting `count`. */
  const renamedTo = (count) => {
    const measured = measurement({
      clean: { "ledger/layout-primitives": count },
      passing: ["flex"],
    });
    delete measured.clean["ledger/use-primitives"];
    return measured;
  };
  // A widened rule under a new name is not a new rule: its old count is gone unchecked.
  const [vanished, ...rest] = check(renamedTo(27), base);
  assert.equal(rest.length, 0);
  assert.match(vanished, /^Clean corpus: ledger\/use-primitives counted 9 at base and is no rule/);
  // Renamed, the new name is held to the old count.
  const renamed = { renamed: { "ledger/use-primitives": "ledger/layout-primitives" } };
  const [raised] = check(renamedTo(27), base, renamed);
  assert.match(raised, /^Clean corpus: ledger\/layout-primitives reports 27, and 9 at base\./);
  assert.deepEqual(check(renamedTo(9), base, renamed), []);
  // Removed, its count goes.
  assert.deepEqual(check(renamedTo(0), base, { removed: ["ledger/use-primitives"] }), []);
  // --update keeps what the tree declares, and it is no change of measurement.
  const tree = baselineOf(renamedTo(9), renamed);
  assert.deepEqual(tree.renamed, renamed.renamed);
  assert.deepEqual(check(renamedTo(9), base, renamed, tree), []);
  // A declaration must say something true of today's plugin.
  assert.match(
    check(renamedTo(9), base, { renamed: { "ledger/use-primitives": "ledger/nope" } }).join(),
    /"renamed" gives ledger\/use-primitives the name "ledger\/nope", which is no ledger rule/,
  );
  assert.match(
    check(measurement({ passing: ["flex"] }), base, {
      renamed: { "ledger/use-primitives": "ledger/no-margin" },
    }).join(),
    /"renamed" names ledger\/use-primitives, which is still a rule/,
  );
  assert.match(
    check(measurement({ passing: ["flex"] }), base, { removed: ["ledger/no-margin"] }).join(),
    /"removed" names ledger\/no-margin, which is still a rule/,
  );
});

test("a stock class the base reported that starts to pass is admitted with a pointer, or --check fails", () => {
  const base = baselineOf(measurement({ passing: ["flex"], classes: ["flex", "p-4"] }));
  // Allowlist creep: /^p-\d+$/ in the structural list lets p-4 through.
  const creep = measurement({ passing: ["flex", "p-4"] });
  const [problem, ...rest] = check(creep, base);
  assert.equal(rest.length, 0);
  assert.match(problem, /^Stock corpus: "p-4" now passes every ledger rule, and did not at base/);
  // Admitted, with a pointer to the entry that makes it structural and names it.
  assert.deepEqual(
    check(creep, base, admitting({ "p-4": "docs/guides/component-library.md#what-it-enforces" })),
    [],
  );
  // A class that stops passing needs nothing, and its admission goes with the next --update.
  assert.deepEqual(check(measurement({ classes: ["flex", "p-4"] }), base), []);
  const admitted = admitting({ flex: "packages/design-system/src/stories/docs/Lint.mdx" });
  assert.deepEqual(baselineOf(measurement({ classes: ["flex"] }), admitted).stock, {
    doubleReported: 0,
    byRule: {},
    admitted: {},
    passing: [],
    classes: ["flex"],
  });
  // A class new to the corpus that passes is recorded, not admitted: it was never reported.
  assert.deepEqual(
    check(
      measurement({ passing: ["flex", "items-center"], classes: ["flex", "p-4", "items-center"] }),
      base,
    ),
    [],
  );
});

test("an admission points at a page that decides structure and names the class there", () => {
  const creep = measurement({
    passing: ["md:text-sm", "rounded-lg", "p-4"],
    classes: ["md:text-sm", "rounded-lg", "p-4", "text-lg"],
  });
  const base = baselineOf(measurement({ classes: creep.stock.classes }));
  // No file, a directory, an anchor alone, a path out of the repository, or any other file.
  for (const pointer of ["", ".", "src", "#anything", "../..", "package.json", 3, null]) {
    const problems = check(creep, base, admitting({ "p-4": pointer }));
    assert.match(problems.join("\n"), /the admission of "p-4" points at .*An admission points at/);
  }
  // The page must name it: as written, as its utility, or as a pattern that matches.
  const lint = "packages/design-system/src/stories/docs/Lint.mdx";
  const [unnamed] = check(
    measurement({ passing: ["p-4"], classes: creep.stock.classes }),
    base,
    admitting({ "p-4": lint }),
  );
  assert.match(unnamed, /"p-4" is admitted by .*Lint\.mdx, which does not name it/);
  const library = "docs/guides/component-library.md#structural";
  const all = admitting({ "md:text-sm": library, "rounded-lg": library, "p-4": library });
  assert.deepEqual(check(creep, base, all), []);
  // A page that is gone.
  assert.match(
    admissionProblem("p-4", library, () => undefined),
    /points at docs\/guides\/component-library\.md, which is no file in this repository/,
  );
});

test("a class is named by itself, its utility or a pattern, in backticks", () => {
  assert.equal(utilityOf("md:text-sm"), "text-sm");
  assert.equal(utilityOf("group-data-[size=xs]/attachment:rounded-md"), "rounded-md");
  assert.equal(utilityOf("[&_svg]:pointer-events-none"), "pointer-events-none");
  assert.equal(utilityOf("has-[button:focus]:p-0"), "p-0");
  assert.equal(utilityOf("!flex"), "flex");
  assert.equal(utilityOf("flex!"), "flex");
  const page = "Allowed: `flex`, `rounded-*` and `size-[...]`. Not rounded-md in prose.";
  assert.ok(mentions(page, "flex"));
  assert.ok(mentions(page, "md:flex"));
  assert.ok(mentions(page, "rounded-md"));
  assert.ok(mentions(page, "rounded-t-lg"));
  assert.ok(!mentions(page, "rounded"));
  assert.ok(!mentions(page, "size-4"));
  assert.ok(!mentions(page, "flex-1"));
  // An asterisk with no family before it would name every class.
  for (const span of ["`*`", "`*:`", "`**`", "`**/*.stories.tsx`", "`r*`"])
    assert.ok(!mentions(`Written: ${span}.`, "rounded-md"), span);
});

test("the stock corpus may only grow, so a creeping class cannot leave with its verdict", () => {
  const classes = ["flex", "rounded-lg", "text-sm", "bg-red-500"];
  const base = baselineOf(measurement({ passing: ["flex"], classes }));
  // The creep deletes the classes it admits: they are gone, not passing.
  const [gone, ...rest] = check(measurement({ passing: ["flex"], classes: ["flex"] }), base);
  assert.equal(rest.length, 0);
  assert.match(gone, /^Stock corpus: 3 classes linted at base are not in .*stock-classes\.json/);
  assert.match(gone, /"bg-red-500", "rounded-lg", "text-sm"/);
  // An emptied fixture is the same.
  assert.match(check(measurement({ classes: [] }), base).join(), /4 classes linted at base/);
  // Growing is fine.
  assert.deepEqual(
    check(measurement({ passing: ["flex"], classes: [...classes, "bg-blue-500"] }), base),
    [],
  );
});

test("classes reported twice may only fall, over the classes the base linted", () => {
  const twice = ["mt-1", "mt-2", "mt-3"];
  const base = baselineOf(
    measurement({ reportedTwice: twice, byRule: { "ledger/no-non-token-class": 400 } }),
  );
  // One owner per class moves mt-3 from no-non-token-class to no-margin alone.
  const owned = measurement({
    classes: base.stock.classes,
    reportedTwice: ["mt-1", "mt-2"],
    byRule: { "ledger/no-non-token-class": 399, "ledger/no-margin": 1 },
  });
  assert.deepEqual(check(owned, base), []);
  // A class the base linted that another rule starts to report.
  const [problem] = check(
    measurement({ classes: base.stock.classes, reportedTwice: [...twice, "bg-red-500"] }),
    base,
  );
  assert.match(problem, /^Stock corpus: 4 of the classes linted at base are reported by two/);
  // A class added to the corpus that two rules report already is recorded, not a rise.
  assert.deepEqual(check(measurement({ reportedTwice: [...twice, "-mt-4"] }), base), []);
  // Deleting a class reported twice does not lower the count: the class is missing.
  assert.match(
    check(measurement({ reportedTwice: ["mt-1", "mt-2"] }), base).join(),
    /1 class linted at base is not in/,
  );
});

test("the baseline in the tree must be today's measurement, so what fell is recorded", () => {
  const measured = measurement({ clean: { "ledger/use-primitives": 4 }, passing: ["flex"] });
  const stale = baselineOf(measurement({ passing: ["flex"] }));
  const [problem, ...rest] = check(measured, stale, {}, stale);
  assert.equal(rest.length, 0);
  assert.match(problem, /is not today's measurement:\n {4}clean ledger\/use-primitives: 9 → 4/);
  assert.match(problem, /npm run lint:corpus -- --update/);
  // The corpus it linted, and where each scope runs each rule, are part of the measurement.
  const grown = measurement({ passing: ["flex"], classes: ["flex", "bg-red-500", "p-4"] });
  assert.match(check(grown, stale, {}, stale).join(), /stock corpus: adds 1 class: "p-4"/);
  const reached = {
    ...measurement({ passing: ["flex"] }),
    reach: { product: [{ ignores: ["x"] }] },
  };
  assert.match(
    check(reached, stale, {}, stale).join(),
    /reach product: the config blocks that decide where a ledger rule runs changed/,
  );
  // With no baseline at the base (this change lands it) only the tree is checked.
  assert.deepEqual(check(measured, undefined), []);
  const [missing] = compare({ measured, baseName: "base", tree: undefined, read });
  assert.match(missing, /lint-corpus-baseline\.json is missing/);
});

test("the base ref is read as check-lint-changelog reads it", () => {
  assert.deepEqual(baseRef([], {}), { asked: "", requested: "HEAD", base: "HEAD" });
  assert.equal(baseRef([], { DS_BASE_REF: "abc123" }).base, "abc123");
  assert.equal(baseRef(["--base-ref", "main"], { DS_BASE_REF: "abc123" }).base, "main");
  // A push's all-zero `before` on a new branch compares with the commit before HEAD.
  assert.deepEqual(baseRef([], { DS_BASE_REF: "0".repeat(40) }), {
    asked: "0".repeat(40),
    requested: "0".repeat(40),
    base: "HEAD^",
  });
});

/** A throwaway repository: the baseline committed with `count`, then a second commit. */
function repository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-corpus-repo-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const commit = (count) => {
    fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
    fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ clean: { "ledger/x": count } }));
    git("add", ".");
    git("commit", "--quiet", "-m", `Count ${count}`);
  };
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "test@example.test");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  return { root, commit, cleanup: () => fs.rmSync(root, { recursive: true }) };
}

test("the all-zero base ref stands for the commit before HEAD, which a shallow clone lacks", () => {
  const zero = { DS_BASE_REF: "0".repeat(40) };
  const full = repository();
  const shallow = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-corpus-shallow-"));
  try {
    // A first commit has no commit before it: there is no base.
    full.commit(9);
    assert.deepEqual(baselineAtBase([], zero, full.root), { name: "HEAD^" });
    // With one before it, the baseline there is the base's.
    full.commit(27);
    assert.deepEqual(baselineAtBase([], zero, full.root).baseline, { clean: { "ledger/x": 9 } });
    // A clone with HEAD alone has a commit before it that it did not fetch: fetch more history.
    execFileSync("git", ["clone", "--quiet", "--depth", "1", `file://${full.root}`, shallow]);
    assert.throws(
      () => baselineAtBase([], zero, shallow),
      (error) => error instanceof CorpusError && /This clone is shallow/.test(error.message),
    );
    // A ref that was asked for and is no commit fails, shallow or not.
    assert.throws(() => baselineAtBase(["--base-ref", "HEAD^"], {}, shallow), /does not resolve/);
  } finally {
    full.cleanup();
    fs.rmSync(shallow, { recursive: true });
  }
});

test("the reach a config records is its global ignores and the blocks that set a ledger rule", () => {
  const config = [
    { name: "ignored", ignores: ["dist", "src/generated/**"] },
    { linterOptions: { reportUnusedDisableDirectives: "error" } },
    { files: ["**/*.ts"], rules: { "no-unused-vars": "error" } },
    {
      files: ["src/**/*.tsx"],
      ignores: ["src/old/**"],
      plugins: { ledger },
      rules: { "ledger/no-margin": ["warn", { allow: { "src/a.tsx": 1 } }], semi: "error" },
    },
    { files: [["src/**", "**/*.stories.tsx"]], rules: { "ledger/no-margin": 0 } },
  ];
  assert.deepEqual(reachOf(config), [
    { ignores: ["dist", "src/generated/**"] },
    { files: ["src/**/*.tsx"], ignores: ["src/old/**"], rules: { "ledger/no-margin": "error" } },
    { files: [["src/**", "**/*.stories.tsx"]], rules: { "ledger/no-margin": "off" } },
  ]);
  assert.throws(
    () => reachOf([{ files: [() => true], rules: { "ledger/no-margin": "off" } }], "product"),
    /product's config matches files with a function/,
  );
  // As a config for today's plugin: a renamed rule under its new name, a removed one and one the
  // plugin lacks left out.
  const [plugin, ...blocks] = reachConfig(
    [
      { ignores: ["dist"] },
      {
        files: ["src/**"],
        rules: {
          "ledger/use-primitives": "error",
          "ledger/no-margin": "off",
          "ledger/gone": "off",
        },
      },
    ],
    { renamed: { "ledger/use-primitives": "ledger/no-colgroup" }, removed: ["ledger/no-margin"] },
  );
  assert.deepEqual(plugin, { plugins: { ledger } });
  assert.deepEqual(blocks, [
    { ignores: ["dist"] },
    { files: ["src/**"], rules: { "ledger/no-colgroup": "error" } },
  ]);
});

test("a file the base had keeps each rule, and a new file takes the reach it is given", () => {
  const before = new Map([
    ["src/a.tsx", ["ledger/no-margin", "ledger/use-primitives"]],
    ["src/b.tsx", ["ledger/no-margin"]],
    ["src/new.tsx", ["ledger/no-margin"]],
  ]);
  const after = new Map([
    ["src/a.tsx", ["ledger/no-margin"]],
    ["src/b.tsx", []],
    ["src/new.tsx", []],
  ]);
  assert.deepEqual(
    lostReach(before, after, (file) => file !== "src/new.tsx"),
    { "ledger/no-margin": ["src/b.tsx"], "ledger/use-primitives": ["src/a.tsx"] },
  );
  // The other way round, what each rule gained.
  assert.deepEqual(lostReach(after, before), {});
  const problems = compare({
    measured: measurement(),
    base: baselineOf(measurement()),
    baseName: "base",
    tree: baselineOf(measurement()),
    reach: [
      {
        name: "product",
        lost: {
          "ledger/no-margin": ["src/b.tsx"],
          "ledger/no-colgroup": ["src/b.tsx"],
          "ledger/use-primitives": ["src/a.tsx"],
        },
      },
    ],
    read,
  });
  // Rules that lost the same files are one problem, so an ignored file is one line.
  assert.equal(problems.length, 2);
  assert.match(
    problems[0],
    /^Reach: 2 ledger rules \(ledger\/no-margin, ledger\/no-colgroup\) no longer run on 1 product file they ran on at base: src\/b\.tsx\./,
  );
  assert.match(
    problems[1],
    /^Reach: ledger\/use-primitives no longer runs on 1 product file it ran on at base: src\/a\.tsx\./,
  );
  assert.deepEqual(byFiles({ "ledger/a": ["x", "y"], "ledger/b": ["x"] }), [
    { rules: "ledger/a", one: true, files: ["x", "y"] },
    { rules: "ledger/b", one: true, files: ["x"] },
  ]);
});

test("an off block, an ignore or a narrower glob takes a product file out of a rule's reach", async () => {
  const { default: config } = await import("../../eslint.config.js");
  const shell = "src/components/app/shell.tsx";
  const files = [shell, "src/components/app/workspace.tsx", "scripts/lint-corpus.mjs"];
  /** What each file loses under `changed` against the product config's recorded reach. */
  const lost = async (changed) => {
    const on = (reach) =>
      rulesOn(
        new ESLint({ cwd: REPO, overrideConfigFile: true, overrideConfig: reach }),
        REPO,
        files,
      );
    return lostReach(await on(reachConfig(reachOf(config))), await on(changed));
  };
  assert.deepEqual(await lost(config), {});
  // A block that turns one rule off for the file that rule now reports wrongly.
  const off = { files: [shell], rules: { "ledger/use-primitives": "off" } };
  assert.deepEqual(await lost([...config, off]), { "ledger/use-primitives": [shell] });
  // The file in the root ignores: every rule goes.
  const ignored = await lost([{ ignores: [shell] }, ...config]);
  assert.ok(Object.keys(ignored).length > 20);
  assert.ok(Object.values(ignored).every((where) => where.join() === shell));
  // The product's globs without src/components/app.
  const narrowed = config.map((block) =>
    block.files?.includes("src/components/app/**/*.{ts,tsx}")
      ? { ...block, files: block.files.filter((glob) => !glob.startsWith("src/components/app")) }
      : block,
  );
  const gone = await lost(narrowed);
  assert.deepEqual(gone["ledger/use-primitives"], [shell, "src/components/app/workspace.tsx"]);
});

/** A throwaway folder of files, linted with one ledger rule the way a scope is. */
function scope(files, rules) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-corpus-"));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), text);
  }
  const config = [
    {
      files: ["src/**/*.tsx"],
      plugins: { ledger },
      languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
      rules,
    },
  ];
  return { cwd, config, cleanup: () => fs.rmSync(cwd, { recursive: true }) };
}

test("a scope's recorded reach must be where its config runs the rules", async () => {
  const folder = scope({ "src/a.tsx": "export {};\n", "lib/b.ts": "export {};\n" }, {});
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: folder.cwd });
    const name = { name: "kit", cwd: "." };
    const recorded = await reachOfScope(
      name,
      folder.cwd,
      folder.config,
      new ESLint({
        cwd: folder.cwd,
        overrideConfigFile: true,
        overrideConfig: folder.config,
      }),
    );
    assert.deepEqual(recorded.files, ["lib/b.ts", "src/a.tsx"]);
    // A block that sets a rule with no files of its own takes them from a block the record drops.
    const borrowed = [
      { files: ["src/**/*.tsx"], languageOptions: folder.config[0].languageOptions },
      { plugins: { ledger }, rules: { "ledger/no-margin": "error" } },
    ];
    const eslint = new ESLint({
      cwd: folder.cwd,
      overrideConfigFile: true,
      overrideConfig: borrowed,
    });
    await assert.rejects(
      reachOfScope(name, folder.cwd, borrowed, eslint),
      (error) => error instanceof CorpusError && /is not where its config runs/.test(error.message),
    );
  } finally {
    folder.cleanup();
  }
});

test("an allowance and a disable still count, and a file that does not parse is a fatal message", async () => {
  const folder = scope(
    {
      "src/a.tsx": 'export const A = () => <div className="mt-100" />;\n',
      "src/b.tsx":
        '// eslint-disable-next-line ledger/no-margin -- a reason\nexport const B = () => <div className="mb-100" />;\n',
      "src/c.tsx": "export const C = () => <div className=;\n",
    },
    { "ledger/no-margin": ["error", { allow: { "src/a.tsx": 1 } }] },
  );
  try {
    const { files, messages } = await lintScope({ name: "test", ...folder });
    assert.equal(files, 3);
    const byFile = (file) => messages.filter((message) => message.file.endsWith(file));
    assert.deepEqual(
      byFile("src/a.tsx").map(({ ruleId }) => ruleId),
      ["ledger/no-margin"],
    );
    assert.deepEqual(
      byFile("src/b.tsx").map(({ ruleId }) => ruleId),
      ["ledger/no-margin"],
    );
    assert.ok(byFile("src/c.tsx")[0]?.fatal);
  } finally {
    folder.cleanup();
  }
});

test("a scope whose files match nothing fails instead of counting as clean", async () => {
  const folder = scope({ "lib/a.tsx": "export {};\n" }, { "ledger/no-margin": "error" });
  try {
    await assert.rejects(
      lintScope({ name: "test", ...folder }),
      (error) =>
        error instanceof CorpusError && /^Corpus check found no files to lint/.test(error.message),
    );
    await assert.rejects(
      lintScope({ name: "test", cwd: folder.cwd, config: [{ files: ["src/**/*.tsx"] }] }),
      /gives the ledger plugin none/,
    );
  } finally {
    folder.cleanup();
  }
});

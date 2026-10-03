// Builds the folder one agent works in: a fresh copy of evals/fixture, the product's own lint and
// type configuration and the agent docs as they stand in the repo, a private copy of the kit, and
// a node_modules of links to the repo's, so a run lints and typechecks exactly as the product does.
// The folder lives outside the repo (under the system's temp folder by default), the agent's file
// tools are scoped to it and its node_modules is closed to edits (agent.mjs), and what changed in
// the repo during a run is listed afterwards (repoChangesSince), since a link or a shell command
// could still reach it. The state before the agent starts is recorded outside the folder, so the
// classifier compares the end with it and nothing the agent writes can move it.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const EVALS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The repository the fixture is drawn from: the folder above evals/, or LEDGER_REPO. */
export const REPO = path.resolve(process.env["LEDGER_REPO"] ?? path.join(EVALS, ".."));
export const FIXTURE = path.join(EVALS, "fixture");
export const KIT = "packages/design-system";

/** Where a run's work dirs go unless `--work` says otherwise: outside the repo. */
export const defaultWorkRoot = (runId) => path.join(os.tmpdir(), "ledger-eval", runId);

/**
 * Taken from the repo for every run, as committed there: the product's lint and type
 * configuration (applied to the fixture's product files exactly as to src/), its allowances, and
 * the guides the agent docs point at.
 */
export const FROM_REPO = [
  "eslint.config.js",
  "tsconfig.json",
  "scripts/lint-allow.json",
  "docs/guides/product-patterns.md",
  "docs/guides/component-library.md",
];

/**
 * The allow-lists that may only shrink (scripts/check-allow-lists.mjs names the same) and the
 * suppressions files ESLint applies by itself. Their text at the start is kept with the baseline,
 * so a raised count is read against what the agent was given.
 */
export const ALLOW_LISTS = [
  "scripts/lint-allow.json",
  `${KIT}/test/lint-allow.json`,
  `${KIT}/test/gates-allow.json`,
  `${KIT}/test/layout-allow.json`,
  `${KIT}/test/lint-redteam-escapes.json`,
  `${KIT}/test/css-token-allow.json`,
  "scripts/app-a11y-allow.json",
  "scripts/docs-render-allow.json",
];
export const SUPPRESSIONS = ["eslint-suppressions.json", `${KIT}/eslint-suppressions.json`];

/** What the kit copy leaves out: installs, builds and logs. */
const KIT_SKIP = new Set(["node_modules", "dist", "storybook-static", ".storybook"]);
const skipKitEntry = (name) => KIT_SKIP.has(name) || name.endsWith(".log");

/** Every file under `dir`, relative, without node_modules; links are not followed. */
export function listFiles(dir, base = dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

const hash = (file) => createHash("sha1").update(fs.readFileSync(file)).digest("hex");

/** The state of a work dir as { relative path: sha1 }. */
export function snapshot(workdir) {
  return Object.fromEntries(
    listFiles(workdir).map((file) => [file, hash(path.join(workdir, file))]),
  );
}

/** Where a work dir's starting state is kept: beside it, never inside it. */
export const baselinePath = (workdir) => `${workdir}.baseline.json`;

function copyKit(dest) {
  const from = path.join(REPO, KIT);
  fs.cpSync(from, dest, {
    recursive: true,
    dereference: false,
    filter: (source) => {
      const relative = path.relative(from, source);
      return !relative || !relative.split(path.sep).some(skipKitEntry);
    },
  });
}

/**
 * Links each of the repo's installed packages, except the kit, whose name points at the work
 * dir's own copy: an agent's edit to the kit reaches the lint and the typecheck, never the repo.
 */
function linkNodeModules(workdir) {
  const real = fs.realpathSync(path.join(REPO, "node_modules"));
  const dest = path.join(workdir, "node_modules");
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(real)) {
    if (name === "@ledger") continue;
    fs.symlinkSync(path.join(real, name), path.join(dest, name));
  }
  fs.mkdirSync(path.join(dest, "@ledger"));
  fs.symlinkSync(path.join("..", "..", KIT), path.join(dest, "@ledger", "design-system"));
}

/**
 * Makes `workdir` a fresh fixture and records its starting state. Returns the baseline path.
 * `files` adds or replaces files (relative path to source text), for tests.
 */
export function prepareWorkdir(workdir, { files = {} } = {}) {
  if (fs.existsSync(workdir))
    throw new Error(`${workdir} already exists; each run needs a fresh one.`);
  fs.mkdirSync(path.dirname(workdir), { recursive: true });
  fs.cpSync(FIXTURE, workdir, { recursive: true });
  for (const file of FROM_REPO) {
    fs.mkdirSync(path.dirname(path.join(workdir, file)), { recursive: true });
    fs.copyFileSync(path.join(REPO, file), path.join(workdir, file));
  }
  copyKit(path.join(workdir, KIT));
  linkNodeModules(workdir);
  const baseline = baselinePath(workdir);
  const texts = {};
  for (const file of [...ALLOW_LISTS, ...SUPPRESSIONS]) {
    const full = path.join(workdir, file);
    if (fs.existsSync(full)) texts[file] = fs.readFileSync(full, "utf8");
  }
  fs.writeFileSync(baseline, JSON.stringify({ files: snapshot(workdir), texts }));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(workdir, file)), { recursive: true });
    fs.writeFileSync(path.join(workdir, file), text);
  }
  return baseline;
}

/** The files an agent added, changed or deleted against the recorded start. */
export function changedFiles(workdir) {
  const before = readBaseline(workdir).files;
  const after = snapshot(workdir);
  const added = [];
  const changed = [];
  for (const [file, sum] of Object.entries(after)) {
    if (!(file in before)) added.push(file);
    else if (before[file] !== sum) changed.push(file);
  }
  const deleted = Object.keys(before).filter((file) => !(file in after));
  return { added, changed, deleted };
}

export const readBaseline = (workdir) => JSON.parse(fs.readFileSync(baselinePath(workdir), "utf8"));

/** An allow-list's or suppressions file's text at the start of the run; "" when there was none. */
export const originalText = (workdir, file) => readBaseline(workdir).texts[file] ?? "";

/**
 * Every file under the repo changed since `marker` was written, other than in .git and the
 * folders `exclude` names (the run's output and work dirs), relative to the repo: what was written
 * into the repo during a run, through a node_modules link or a shell command among others. It is
 * attributed by time alone, so in a checkout others are editing it lists their files too.
 */
export function repoChangesSince(marker, exclude = []) {
  const prunes = [path.join(REPO, ".git"), ...exclude].flatMap((dir) => [
    "-path",
    path.resolve(dir),
    "-prune",
    "-o",
  ]);
  const found = spawnSync("find", [REPO, ...prunes, "-type", "f", "-newer", marker, "-print"], {
    encoding: "utf8",
    maxBuffer: 64 * 2 ** 20,
    stdio: ["ignore", "pipe", "ignore"],
  });
  return (found.stdout ?? "")
    .split("\n")
    .filter(Boolean)
    .map((file) => path.relative(REPO, file).split(path.sep).join("/"))
    .sort();
}

export function removeWorkdir(workdir) {
  fs.rmSync(workdir, { recursive: true, force: true });
  fs.rmSync(baselinePath(workdir), { force: true });
}

#!/usr/bin/env node
/**
 * A change to what the lint reports is a change to the kit, so the kit's changelog says so. This
 * compares the working tree with the base ref (DS_BASE_REF or --base-ref, as check-allow-lists
 * reads it; HEAD by default) and fails when the plugin (`packages/design-system/eslint-plugin/`)
 * or the data it reads at import (`src/generated/utilities.json`, and `lint.json` once the token
 * build writes it) changed and `packages/design-system/CHANGELOG.md` did not.
 *
 * A change that alters no finding (a refactor, a comment, a rule page's wording) passes without an
 * entry when every commit in the range that touched each changed file says so on a line of its own,
 * `Lint: no behaviour change`. One such commit excuses only its own changes: a lint file that
 * another commit in the range also changed, one merged in, or one not committed yet still needs
 * the entry. Untracked files count, so the gate can run before a commit, and it reads the whole
 * repository from whichever folder it runs in.
 */
import { execFileSync } from "node:child_process";

const WATCHED = [
  "packages/design-system/eslint-plugin",
  "packages/design-system/src/generated/utilities.json",
  "packages/design-system/src/generated/lint.json",
];
const CHANGELOG = "packages/design-system/CHANGELOG.md";
const EXEMPT = /^Lint: no behaviour change[ \t]*$/m;

const argument = process.argv.indexOf("--base-ref");
const asked = (argument > 0 && process.argv[argument + 1]) || process.env.DS_BASE_REF;
const requested = asked || "HEAD";
// The all-zero SHA is a push's `before` on a new branch: the commit before HEAD stands in.
const base = /^0+$/.test(requested) ? "HEAD^" : requested;

const run = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
const lines = (text) => text.split("\n").filter(Boolean);

// Every path below is from the top of the repository, wherever the gate runs.
let top;
try {
  top = run("rev-parse", "--show-toplevel").trim();
} catch {
  console.error(
    "The lint changelog gate runs inside a git repository, and this folder is not in one.",
  );
  process.exit(1);
}
const git = (...args) => run("-C", top, ...args);

let baseResolves = true;
try {
  git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
} catch {
  baseResolves = false;
}
if (!baseResolves) {
  // A ref that was asked for must be a commit this clone has, or nothing would ever be compared.
  // The default HEAD before a first commit, and the all-zero SHA with no commit before HEAD, stand
  // for no base at all.
  if (asked && !/^0+$/.test(requested)) {
    console.error(
      `The base ref ${base} does not resolve to a commit, so nothing can be compared with it. Fetch it, or pass a ref this clone has (DS_BASE_REF or --base-ref).`,
    );
    process.exit(1);
  }
  console.log(`Lint changelog: ${base} is no commit, so there is nothing to compare with.`);
  process.exit(0);
}

/** Paths not yet added, which no diff shows. */
const untracked = (...paths) =>
  lines(git("ls-files", "--others", "--exclude-standard", "--", ...paths));

/** The paths changed since a commit, in the working tree and the index, and those not yet added. */
const changedSince = (ref, ...paths) => [
  ...new Set([...lines(git("diff", "--name-only", ref, "--", ...paths)), ...untracked(...paths)]),
];

const lint = changedSince(base, ...WATCHED);
const files = (count) => `${count} lint file${count === 1 ? "" : "s"}`;
if (!lint.length) {
  console.log(`Lint changelog: nothing the lint reads has changed since ${base}.`);
  process.exit(0);
}
if (changedSince(base, CHANGELOG).length) {
  console.log(
    `Lint changelog: ${files(lint.length)} changed since ${base}, and ${CHANGELOG} with them.`,
  );
  process.exit(0);
}

/**
 * Why a changed lint file is not excused, or undefined when it is: it has uncommitted changes, no
 * commit in the range made it (the base is not an ancestor), or a commit that touched it does not
 * say it changes no finding. The log follows a merge down the side the file came from, so a commit
 * merged in counts, and a merge that resolved the file itself is one of the commits.
 */
const uncommitted = new Set(changedSince("HEAD", ...WATCHED));
const exempting = new Set();
function unexcused(file) {
  if (uncommitted.has(file)) return `${file} (not committed)`;
  const commits = git("log", "--format=%h%x00%s%x00%B%x1e", `${base}..HEAD`, "--", file)
    .split("\x1e")
    .map((entry) => entry.replace(/^\n/, ""))
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body] = entry.split("\0");
      return { hash, subject, exempt: EXEMPT.test(body) };
    });
  if (!commits.length) return `${file} (no commit since ${base} made this change)`;
  const plain = commits.filter(({ exempt }) => !exempt);
  if (plain.length)
    return `${file} (${plain.map(({ hash, subject }) => `${hash} ${subject}`).join("; ")})`;
  for (const { hash } of commits) exempting.add(hash);
  return undefined;
}
const needsEntry = lint.map(unexcused).filter(Boolean);
if (!needsEntry.length) {
  console.log(
    `Lint changelog: ${files(lint.length)} changed since ${base} with no changelog entry; every commit that changed them (${[...exempting].join(", ")}) says "Lint: no behaviour change".`,
  );
  process.exit(0);
}
console.error(
  `The lint changed since ${base} and ${CHANGELOG} did not:\n  ${needsEntry.join("\n  ")}\nSay what a reader of the findings will see in the changelog's Unreleased section. If no finding changes (a refactor, a comment, a page's wording), end the message of every commit that changed these files with the line "Lint: no behaviour change" instead.`,
);
process.exit(1);

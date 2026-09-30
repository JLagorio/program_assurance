// The lint changelog gate, run in a throwaway repository: a change to the plugin or the data it
// reads needs a changelog entry, or every commit that made it says it changes no finding.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../check-lint-changelog.mjs", import.meta.url));
const PLUGIN = "packages/design-system/eslint-plugin/index.js";
const REPORT = "packages/design-system/eslint-plugin/report.js";
const CHANGELOG = "packages/design-system/CHANGELOG.md";
const UTILITIES = "packages/design-system/src/generated/utilities.json";
const EXEMPT = "\n\nLint: no behaviour change";

/** A repository with the plugin, the data and the changelog committed once. */
function repository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-changelog-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "test@example.test");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  write(PLUGIN, "export default {};\n");
  write(REPORT, "export const render = () => {};\n");
  write(UTILITIES, "{}\n");
  write(CHANGELOG, "# Changelog\n");
  write("src/screen.tsx", "export {};\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "Start");
  const start = git("rev-parse", "HEAD").trim();
  const commit = (message) => {
    git("add", ".");
    git("commit", "--quiet", "-m", message);
  };
  const check = (env = {}, where = "") => {
    const { status, stdout, stderr } = spawnSync(process.execPath, [script], {
      cwd: path.join(root, where),
      encoding: "utf8",
      env: { ...process.env, DS_BASE_REF: "", ...env },
    });
    return { status, output: stdout + stderr };
  };
  return {
    root,
    start,
    git,
    write,
    commit,
    check,
    cleanup: () => fs.rmSync(root, { recursive: true }),
  };
}

test("a change to the plugin fails without a changelog entry, and passes with one", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { rules: {} };\n");
    const failed = repo.check();
    assert.equal(failed.status, 1, failed.output);
    assert.match(failed.output, /eslint-plugin\/index\.js/);
    repo.write(CHANGELOG, "# Changelog\n\n- A rule.\n");
    const passed = repo.check();
    assert.equal(passed.status, 0, passed.output);
  } finally {
    repo.cleanup();
  }
});

test("the token data, and a new file in the plugin not yet added, count as the lint", () => {
  const repo = repository();
  try {
    repo.write(UTILITIES, '{ "bg-new": true }\n');
    assert.equal(repo.check().status, 1);
    repo.git("checkout", "--", UTILITIES);
    repo.write("packages/design-system/eslint-plugin/docs/no-margin.md", "# ledger/no-margin\n");
    assert.equal(repo.check().status, 1);
  } finally {
    repo.cleanup();
  }
});

test("a change outside the lint passes", () => {
  const repo = repository();
  try {
    repo.write("src/screen.tsx", "export const a = 1;\n");
    const { status, output } = repo.check();
    assert.equal(status, 0, output);
  } finally {
    repo.cleanup();
  }
});

test("committed changes are compared with the base ref, and pass when every commit says no finding changes", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { meta: {} };\n");
    repo.commit("Tidy the plugin");
    assert.equal(repo.check({ DS_BASE_REF: repo.start }).status, 1);
    // The all-zero SHA of a new branch compares with the commit before HEAD.
    assert.equal(repo.check({ DS_BASE_REF: "0".repeat(40) }).status, 1);
    repo.git("reset", "--quiet", "--hard", repo.start);
    repo.write(PLUGIN, "export default { meta: {} };\n");
    repo.commit(`Tidy the plugin${EXEMPT}`);
    repo.write(REPORT, "export const render = (text) => text;\n");
    repo.commit(`Move the words${EXEMPT}`);
    const exempt = repo.check({ DS_BASE_REF: repo.start });
    assert.equal(exempt.status, 0, exempt.output);
    assert.match(exempt.output, /Lint: no behaviour change/);
  } finally {
    repo.cleanup();
  }
});

test("one commit that says no finding changes does not excuse another that changes one", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { margins: ['m-auto'] };\n");
    repo.commit("Report m-auto as a margin");
    repo.write(REPORT, "export const render = (text) => text;\n");
    repo.commit(`Rename a helper${EXEMPT}`);
    const { status, output } = repo.check({ DS_BASE_REF: repo.start });
    assert.equal(status, 1, output);
    assert.match(output, /eslint-plugin\/index\.js/);
    assert.match(output, /Report m-auto as a margin/);
    assert.doesNotMatch(output, /report\.js/);
  } finally {
    repo.cleanup();
  }
});

test("the same holds for a file both commits changed, and for a commit merged in", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { margins: ['m-auto'] };\n");
    repo.commit("Report m-auto as a margin");
    repo.write(PLUGIN, "export default { margins: ['m-auto'], rules: {} };\n");
    repo.commit(`Tidy the plugin${EXEMPT}`);
    assert.equal(repo.check({ DS_BASE_REF: repo.start }).status, 1);
    // A behaviour change on a side branch, merged by a commit that says no finding changes.
    repo.git("reset", "--quiet", "--hard", repo.start);
    repo.git("checkout", "--quiet", "-b", "side");
    repo.write(PLUGIN, "export default { margins: ['m-auto'] };\n");
    repo.commit("Report m-auto as a margin");
    repo.git("checkout", "--quiet", "main");
    repo.write(REPORT, "export const render = (text) => text;\n");
    repo.commit(`Rename a helper${EXEMPT}`);
    repo.git("merge", "--quiet", "--no-ff", "-m", `Merge side${EXEMPT}`, "side");
    const merged = repo.check({ DS_BASE_REF: repo.start });
    assert.equal(merged.status, 1, merged.output);
    assert.match(merged.output, /Report m-auto as a margin/);
  } finally {
    repo.cleanup();
  }
});

test("a pull request's merge commit, which takes the file as the branch left it, is not one of the commits", () => {
  const repo = repository();
  try {
    repo.git("checkout", "--quiet", "-b", "pull");
    repo.write(PLUGIN, "export default { rules: {} };\n");
    repo.commit(`Tidy the plugin${EXEMPT}`);
    repo.git("checkout", "--quiet", "main");
    repo.write("src/screen.tsx", "export const a = 1;\n");
    repo.commit("Other work");
    const base = repo.git("rev-parse", "HEAD").trim();
    repo.git("merge", "--quiet", "--no-ff", "-m", "Merge pull into main", "pull");
    const { status, output } = repo.check({ DS_BASE_REF: base });
    assert.equal(status, 0, output);
  } finally {
    repo.cleanup();
  }
});

test("an uncommitted change to the lint is never excused by a commit", () => {
  const repo = repository();
  try {
    repo.write(REPORT, "export const render = (text) => text;\n");
    repo.commit(`Rename a helper${EXEMPT}`);
    repo.write(PLUGIN, "export default { margins: ['m-auto'] };\n");
    const edited = repo.check({ DS_BASE_REF: repo.start });
    assert.equal(edited.status, 1, edited.output);
    assert.match(edited.output, /index\.js \(not committed\)/);
    repo.git("checkout", "--", PLUGIN);
    repo.write("packages/design-system/eslint-plugin/margins.js", "export default [];\n");
    assert.equal(repo.check({ DS_BASE_REF: repo.start }).status, 1);
  } finally {
    repo.cleanup();
  }
});

test("the exemption is a line of its own, not the words quoted in a sentence", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { margins: ['m-auto'] };\n");
    repo.commit(
      'Report m-auto as a margin\n\nThis is not a "Lint: no behaviour change" commit; it changes findings.',
    );
    const { status, output } = repo.check({ DS_BASE_REF: repo.start });
    assert.equal(status, 1, output);
  } finally {
    repo.cleanup();
  }
});

test("the gate reads the whole repository from any folder in it", () => {
  const repo = repository();
  try {
    repo.write(PLUGIN, "export default { rules: {} };\n");
    const { status, output } = repo.check({}, "packages/design-system");
    assert.equal(status, 1, output);
    assert.match(output, /packages\/design-system\/eslint-plugin\/index\.js/);
    repo.write(CHANGELOG, "# Changelog\n\n- A rule.\n");
    assert.equal(repo.check({}, "packages/design-system/eslint-plugin").status, 0);
  } finally {
    repo.cleanup();
  }
});

test("a base ref that was asked for and does not resolve fails", () => {
  const repo = repository();
  try {
    const { status, output } = repo.check({ DS_BASE_REF: "no-such-ref" });
    assert.equal(status, 1);
    assert.match(output, /does not resolve to a commit/);
  } finally {
    repo.cleanup();
  }
});

// The allow-lists gate, run in a throwaway repository: a list may shrink but never grow against its
// committed version, and the kit's stylesheet list is one of the lists it holds.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../check-allow-lists.mjs", import.meta.url));
const CSS_LIST = "packages/design-system/test/css-token-allow.json";

/** A repository with the kit's stylesheet list committed once, as `start`. */
function repository(start) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-allow-lists-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const write = (list) => {
    fs.mkdirSync(path.dirname(path.join(root, CSS_LIST)), { recursive: true });
    fs.writeFileSync(path.join(root, CSS_LIST), `${JSON.stringify(list, null, 2)}\n`);
  };
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "test@example.test");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  write(start);
  git("add", ".");
  git("commit", "--quiet", "-m", "Start");
  const check = () => {
    const { status, stdout, stderr } = spawnSync(process.execPath, [script], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DS_BASE_REF: "" },
    });
    return { status, output: stdout + stderr };
  };
  return { write, check, cleanup: () => fs.rmSync(root, { recursive: true }) };
}

const START = {
  about: "Literal lengths in the kit's stylesheets.",
  "src/styles/drawer.css": {
    "24rem": { count: 1, reason: "A drawer's widest." },
    "2px": { count: 4, reason: "A closed drawer's offset." },
  },
};

test("the kit's stylesheet list is held to its base: fewer passes, more or new fails", () => {
  const repo = repository(START);
  try {
    assert.equal(repo.check().status, 0, "unchanged");
    repo.write({
      ...START,
      "src/styles/drawer.css": {
        "24rem": START["src/styles/drawer.css"]["24rem"],
        "2px": { count: 3, reason: "A closed drawer's offset, a reason reworded." },
      },
    });
    const fewer = repo.check();
    assert.equal(fewer.status, 0, fewer.output);
    assert.match(fewer.output, /css-token-allow\.json: 4 entries, 1 fewer or lower than at HEAD/);
    repo.write({
      ...START,
      "src/styles/drawer.css": {
        ...START["src/styles/drawer.css"],
        "2px": { count: 5, reason: "x." },
      },
    });
    const more = repo.check();
    assert.equal(more.status, 1);
    assert.match(more.output, /drawer\.css › 2px › count went from 4 to 5/);
    repo.write({
      ...START,
      "src/styles/toast.css": { "24rem": { count: 1, reason: "A toast stack's widest." } },
    });
    const added = repo.check();
    assert.equal(added.status, 1);
    assert.match(added.output, /toast\.css › 24rem › count is new/);
  } finally {
    repo.cleanup();
  }
});

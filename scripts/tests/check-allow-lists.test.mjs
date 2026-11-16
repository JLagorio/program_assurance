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
const INVENTORY = "docs/guides/screen-inventory.json";

/** A repository with one list (the kit's stylesheet list unsaid) committed once, as `start`. */
function repository(start, file = CSS_LIST) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-allow-lists-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const write = (list) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), `${JSON.stringify(list, null, 2)}\n`);
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

const ROUTES = [
  {
    path: "/risks",
    budgets: { words: 19, buttons: 14 },
  },
  {
    path: "/register/risks/$riskId",
    budgets: { words: 164, tabs: 6 },
    tabBudgets: { Assessments: { words: 30 } },
  },
];

test("page budget ceilings may only fall; a route, a tab or a budget new since the base starts", () => {
  const repo = repository(ROUTES, INVENTORY);
  try {
    assert.equal(repo.check().status, 0, "unchanged");
    const [risks, risk] = ROUTES;
    repo.write([{ ...risks, budgets: { words: 18, buttons: 14 } }, risk]);
    const lower = repo.check();
    assert.equal(lower.status, 0, lower.output);
    assert.match(
      lower.output,
      /page budget ceilings in .*: 5 entries, 1 fewer or lower than at HEAD/,
    );
    repo.write([
      { ...risks, budgets: { ...risks.budgets, statusHues: 2 } },
      { ...risk, tabBudgets: { ...risk.tabBudgets, Work: { words: 29 } } },
      { path: "/work", budgets: { words: 40 } },
    ]);
    const started = repo.check();
    assert.equal(started.status, 0, started.output);
    repo.write([{ ...risks, budgets: { words: 20, buttons: 14 } }, risk]);
    const raised = repo.check();
    assert.equal(raised.status, 1);
    assert.match(raised.output, /\/risks › words went from 19 to 20/);
    repo.write([risks, { ...risk, tabBudgets: { Assessments: { words: 31 } } }]);
    const tab = repo.check();
    assert.equal(tab.status, 1);
    assert.match(
      tab.output,
      /\/register\/risks\/\$riskId › Assessments › words went from 30 to 31/,
    );
  } finally {
    repo.cleanup();
  }
});

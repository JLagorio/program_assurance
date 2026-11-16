import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CONTRACT,
  CORE,
  DECISIONS,
  DEFAULT_CAPS,
  countWords,
  overBudget,
  readCaps,
} from "../check-contract-budget.mjs";

test("words are counted as wc -w counts them", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("  \n\t "), 0);
  assert.equal(countWords("one  two\tthree\nfour\r\nfive"), 5);
  // Markdown punctuation that stands alone is a word to wc, and so are code spans and dashes.
  assert.equal(countWords("| Kind | Home |\n| ---- | ---- |"), 10);
  assert.equal(countWords("`RecordLink` — the name"), 4);
  for (const file of [CONTRACT, CORE])
    assert.equal(
      countWords(readFileSync(file, "utf8")),
      Number(execFileSync("wc", ["-w", file], { encoding: "utf8" }).trim().split(/\s+/)[0]),
      `${file} counts as wc -w does`,
    );
});

test("the latest dated Contract budget line sets the caps", () => {
  assert.deepEqual(
    readCaps("# Decisions\n\n- 2026-11-16 · Contract · A short one.\n"),
    DEFAULT_CAPS,
  );
  const log = [
    "- 2026-12-01 · Contract budget · The contract holds at most 4,200 words and its core at most 1,600 words.",
    "- 2026-11-16 · Contract budget · The contract holds at most 4,000 words and its core at most 1,500 words (D7).",
    "- 2026-12-02 · Register · Not a budget: at most 9,999 words and its core at most 9,999.",
  ].join("\n");
  assert.deepEqual(readCaps(log), { contract: 4200, core: 1600, from: "2026-12-01" });
  assert.throws(
    () => readCaps("- 2026-12-03 · Contract budget · Somewhat longer."),
    /names no caps/,
  );
});

test("a contract over either cap fails, naming its files and its count", () => {
  const caps = { contract: 4000, core: 1500, from: "2026-11-16" };
  assert.deepEqual(overBudget({ contractWords: 2400, coreWords: 1500, caps }), []);
  const [core] = overBudget({ contractWords: 1000, coreWords: 1501, caps });
  assert.match(core, new RegExp(`${CORE} has 1501 words`));
  assert.match(core, /Contract budget of 2026-11-16/);
  const [total] = overBudget({ contractWords: 2600, coreWords: 1450, caps });
  assert.match(total, new RegExp(`${CONTRACT} with ${CORE} has 4050 words \\(2600 \\+ 1450\\)`));
  assert.match(overBudget({ contractWords: 0, coreWords: 1600, caps: DEFAULT_CAPS })[0], /D7/);
});

test("the committed contract fits the caps its decisions log sets", () => {
  const run = spawnSync(process.execPath, ["scripts/check-contract-budget.mjs"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^Contract: \d+ of \d+ words; its core \d+ of \d+\.$/m);
  assert.ok(readCaps(readFileSync(DECISIONS, "utf8")).from, `${DECISIONS} sets the caps`);
});

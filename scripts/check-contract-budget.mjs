#!/usr/bin/env node
/**
 * The product pattern contract stays short (Josef's decision D7, 2026-11-16). Its core,
 * docs/guides/product-patterns-core.md, which CLAUDE.md imports into every session, holds at most
 * 1,500 words, and the core with part two, docs/guides/product-patterns.md, at most 4,000, each
 * counted as `wc -w` counts it. A cap moves only with a dated "Contract budget" line in
 * docs/decisions.md ("- 2026-11-16 · Contract budget · The contract holds at most 4,000 words and
 * its core at most 1,500 words"); the latest such line sets both caps, and with none the caps are
 * D7's. An addition to the contract removes as many words as it adds, or comes with that line.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CONTRACT = "docs/guides/product-patterns.md";
export const CORE = "docs/guides/product-patterns-core.md";
export const DECISIONS = "docs/decisions.md";
export const DEFAULT_CAPS = { contract: 4000, core: 1500, from: null };

/** Words as `wc -w` counts them: runs of anything but ASCII whitespace. */
export function countWords(text) {
  return text.split(/[ \t\n\v\f\r]+/).filter(Boolean).length;
}

const number = (written) => Number(written.replace(/,/g, ""));

/** The caps the latest dated "Contract budget" line of the decisions log sets, else D7's. */
export function readCaps(decisions) {
  let caps = DEFAULT_CAPS;
  for (const line of decisions.split("\n")) {
    const entry = /^- (\d{4}-\d{2}-\d{2}) · Contract budget · (.*)$/.exec(line.trim());
    if (!entry) continue;
    const [, day, decision] = entry;
    const set = /at most ([\d,]+) words.*?core at most ([\d,]+)/i.exec(decision);
    if (!set) throw new Error(`${DECISIONS}: a Contract budget line names no caps: ${line.trim()}`);
    // The log is newest first: on one day, the first line stands.
    if (caps.from === null || day > caps.from)
      caps = { contract: number(set[1]), core: number(set[2]), from: day };
  }
  return caps;
}

/** What is over its cap, each naming its files and count; empty when the contract fits. */
export function overBudget({ contractWords, coreWords, caps }) {
  const where = caps.from ? `the Contract budget of ${caps.from}` : "decision D7";
  const failures = [];
  if (coreWords > caps.core)
    failures.push(
      `${CORE} has ${coreWords} words; the core loaded into every session holds at most ${caps.core} (${where}).`,
    );
  const total = contractWords + coreWords;
  if (total > caps.contract)
    failures.push(
      `${CONTRACT} with ${CORE} has ${total} words (${contractWords} + ${coreWords}); the contract holds at most ${caps.contract} (${where}).`,
    );
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => readFileSync(path, "utf8");
  const caps = readCaps(read(DECISIONS));
  const contractWords = countWords(read(CONTRACT));
  const coreWords = countWords(read(CORE));
  const failures = overBudget({ contractWords, coreWords, caps });
  if (failures.length) {
    for (const failure of failures) console.error(failure);
    console.error(
      `Cut as many words as the change adds, or raise the cap with a dated "Contract budget" line in ${DECISIONS}.`,
    );
    process.exit(1);
  }
  console.log(
    `Contract: ${contractWords + coreWords} of ${caps.contract} words; its core ${coreWords} of ${caps.core}.`,
  );
}

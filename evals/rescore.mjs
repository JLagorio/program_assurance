#!/usr/bin/env node
// Lints and classifies a finished run's final state again, with no model call: for a run made
// with --keep-work, after the harness's checks or the classifier changed. The first call's
// findings are kept as recorded; the end, the outcome and the table are recomputed.
//
// Usage: node evals/rescore.mjs <out dir> [--work <dir>]
//   The work dirs are where the run kept them: --work, else the run's summary.json says, else
//   <out dir>/work for a run made before they moved out of the repo.
import * as fs from "node:fs";
import * as path from "node:path";

import { classifyRun } from "./lib/classify.mjs";
import { countLedger, lintWorkdir } from "./lib/lint.mjs";
import { notesOf, summarize, table } from "./lib/summary.mjs";

const LIMITS = new Set(["error_max_turns", "error_max_budget_usd"]);
const args = process.argv.slice(2);
const workFlag = args.indexOf("--work");
const OUT = path.resolve(
  args.find((arg, index) => !arg.startsWith("--") && (workFlag === -1 || index !== workFlag + 1)) ??
    "",
);
const recordedWork = () => {
  try {
    return JSON.parse(fs.readFileSync(path.join(OUT, "summary.json"), "utf8")).workDir;
  } catch {
    return undefined;
  }
};
const WORK = path.resolve(
  workFlag !== -1 ? args[workFlag + 1] : (recordedWork() ?? path.join(OUT, "work")),
);
const PRISTINE = path.join(WORK, "_pristine");
if (!fs.existsSync(PRISTINE))
  throw new Error(`${WORK} holds no kept work dirs (run with --keep-work, or give --work).`);

const pristine = (await lintWorkdir(PRISTINE)).findings;
const results = [];
for (const task of fs.readdirSync(OUT)) {
  const taskDir = path.join(OUT, task);
  if (task === "work" || !fs.statSync(taskDir).isDirectory()) continue;
  for (const condition of fs.readdirSync(taskDir)) {
    for (const name of fs.readdirSync(path.join(taskDir, condition))) {
      const match = /^run-(\d+)\.json$/.exec(name);
      if (!match) continue;
      const recorded = JSON.parse(fs.readFileSync(path.join(taskDir, condition, name), "utf8"));
      const workdir = path.join(WORK, `${task}-${condition}-${match[1]}`);
      const last = recorded.rounds.at(-1).agent;
      const stoppedBy = recorded.rounds
        .map(
          (round) =>
            round.agent.stoppedBy ??
            (LIMITS.has(round.agent.errorSubtype) ? round.agent.errorSubtype : null),
        )
        .filter(Boolean);
      const failed = last.isError && !LIMITS.has(last.errorSubtype);
      const { findings } = await lintWorkdir(workdir, { expectFiles: [recorded.file], pristine });
      const end = [
        ...(failed
          ? [
              {
                file: recorded.file,
                line: 0,
                rule: "harness/agent-error",
                message: "The agent call failed.",
              },
            ]
          : []),
        ...findings,
      ];
      const verdict = await classifyRun({ workdir, findings: end, pristineDir: PRISTINE });
      results.push({
        ...recorded,
        findingsRound0: recorded.rounds[0].findings.filter(
          (item) =>
            !(
              item.rule === "harness/agent-error" &&
              LIMITS.has(recorded.rounds[0].agent.errorSubtype)
            ),
        ).length,
        findingsEnd: end.length,
        ledgerEnd: countLedger(end),
        stoppedBy,
        outcome: verdict.outcome,
        signals: verdict.signals,
        notes: verdict.notes,
        rounds: undefined,
        endFindings: end,
      });
    }
  }
}
const markdown = `# Rescored ${path.basename(OUT)}\n\n${table(summarize(results))}\n${notesOf(results)}`;
fs.writeFileSync(path.join(OUT, "rescored.json"), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(OUT, "rescored.md"), markdown);
console.log(markdown);

#!/usr/bin/env node
// The Ledger agent eval: does the lint's feedback keep an agent inside the design system when a
// request tempts it out? Each run gives one task to a fresh agent in a fresh fixture work dir.
//
//   nolint  the request and the agent docs (AGENTS.md, which points at the kit's AGENTS.md,
//           llms.txt and the product pattern contract). No lint anywhere.
//   lint    the same, and the agent may run `npm run lint`; when it is done the harness lints its
//           output and feeds the findings back, `<file>:<line> [ledger/<rule>] <message>` with
//           each rule's description, for up to two more rounds.
//
// Every run is then linted the same way (the product lint, tsc and the harness's own checks) and
// classified by lib/classify.mjs. This costs money: each call is a paid model call.
//
// Each work dir is outside the repo (under the system's temp folder, or --work), so the agent
// neither starts in the repo nor sees its path. A run records the file tool calls it made outside
// its work dir and the files that changed in the repo while it ran.
//
// Usage:
//   node evals/run.mjs [--tasks <suite|id|file.json>,…] [--conditions nolint,lint] [--runs 1]
//                      [--concurrency 2] [--out <dir>] [--work <dir>] [--model <model>]
//                      [--keep-work] [--max-run-usd <n>] [--max-total-usd <n>] [--dry-run]
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { CLAUDE, callBudget, feedbackPrompt, generationPrompt, runAgent } from "./lib/agent.mjs";
import { classifyRun } from "./lib/classify.mjs";
import {
  EVALS,
  baselinePath,
  changedFiles,
  defaultWorkRoot,
  prepareWorkdir,
  removeWorkdir,
  repoChangesSince,
} from "./lib/fixture.mjs";
import { agentFailure, countLedger, lintWorkdir } from "./lib/lint.mjs";
import { notesOf, outcomesByCondition, summarize, table } from "./lib/summary.mjs";

const FEEDBACK_ROUNDS = 2;
const SUITES = ["temptation", "neutral"];
const CONDITIONS = ["nolint", "lint"];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const list = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const suites = Object.fromEntries(
  SUITES.map((suite) => [
    suite,
    JSON.parse(fs.readFileSync(path.join(EVALS, "tasks", `${suite}.json`), "utf8")).map((task) => ({
      ...task,
      suite,
    })),
  ]),
);

/** `--tasks` items: a suite name, a task id, or a tasks file. */
function selectTasks(spec) {
  const chosen = [];
  for (const item of list(spec)) {
    if (suites[item]) chosen.push(...suites[item]);
    else if (item.endsWith(".json"))
      chosen.push(
        ...JSON.parse(fs.readFileSync(path.resolve(item), "utf8")).map((task) => ({
          ...task,
          suite: path.basename(item, ".json"),
        })),
      );
    else {
      const task = Object.values(suites)
        .flat()
        .find((candidate) => candidate.id === item);
      if (!task) throw new Error(`No task or suite named ${item}.`);
      chosen.push(task);
    }
  }
  return chosen;
}

const tasks = selectTasks(flag("tasks", SUITES.join(",")));
const conditions = list(flag("conditions", CONDITIONS.join(",")));
for (const condition of conditions)
  if (!CONDITIONS.includes(condition)) throw new Error(`Unknown condition ${condition}.`);
const runs = Number(flag("runs", "1"));
const concurrency = Number(flag("concurrency", "2"));
const model = flag("model", undefined);
const keepWork = args.includes("--keep-work");
const dollars = (name) => (args.includes(`--${name}`) ? Number(flag(name)) : null);
/** What one run (its first call and its feedback rounds) may spend; each call stays within it. */
const maxRunUsd = dollars("max-run-usd");
/** Once finished calls have spent this much, no call starts; calls in flight finish. */
const maxTotalUsd = dollars("max-total-usd");
const dryRun = args.includes("--dry-run");
const runId = `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const OUT = path.resolve(flag("out", path.join(EVALS, "results", runId)));
/** The work dirs: outside the repo unless --work names a folder. */
const WORK = path.resolve(flag("work", defaultWorkRoot(runId)));
fs.mkdirSync(OUT, { recursive: true });

const logFile = path.join(OUT, "run.log");
const log = (line) => {
  console.log(line);
  fs.appendFileSync(logFile, `${line}\n`);
};

let cliVersion = null;
try {
  cliVersion = execFileSync(CLAUDE, ["--version"], { encoding: "utf8" }).trim();
} catch {
  // Recorded as unknown; the agent call reports its own failure.
}

const jobs = tasks.flatMap((task) =>
  conditions.flatMap((condition) =>
    Array.from({ length: runs }, (_, index) => ({ task, condition, run: index + 1 })),
  ),
);
log(`Run ${runId}: ${jobs.length} agent runs into ${OUT}, working in ${WORK}`);
log(`Tasks: ${tasks.map((task) => task.id).join(", ")}`);
log(`Conditions: ${conditions.join(", ")}; runs each: ${runs}; CLI: ${cliVersion ?? "unknown"}`);
log(
  `Budget: $${maxRunUsd ?? "-"} a run, $${maxTotalUsd ?? "-"} in all (each call at most $${callBudget(0, null)})`,
);
if (dryRun) process.exit(0);

// The untouched fixture: its own findings are not any agent's, and its files are the originals
// the classifier compares a changed file with.
const PRISTINE = path.join(WORK, "_pristine");
prepareWorkdir(PRISTINE);
const pristine = (await lintWorkdir(PRISTINE)).findings;
log(
  `Pristine fixture: ${pristine.length} findings${pristine.length ? " (left out of every run)" : ""}`,
);

/** Keeps what the agent wrote: every added or changed file, under the run's folder. */
function keepFiles(workdir, dest) {
  const { added, changed, deleted } = changedFiles(workdir);
  for (const file of [...added, ...changed]) {
    const target = path.join(dest, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(workdir, file), target);
  }
  return { added, changed, deleted };
}

let spentUsd = 0;
const skipped = [];

/** The budget for a run's next call, or why there is none (`run` or `total`). */
function nextCall(runSpentUsd) {
  if (maxTotalUsd != null && spentUsd >= maxTotalUsd) return { stop: "total" };
  const budget = callBudget(runSpentUsd, maxRunUsd);
  return budget == null ? { stop: "run" } : { budget };
}

async function runOne({ task, condition, run }) {
  const name = `${task.id}-${condition}-${run}`;
  const workdir = path.join(WORK, name);
  const lint = condition === "lint";
  const started = Date.now();
  const first = nextCall(0);
  if (first.stop) {
    log(`[${name}] not started: the ${first.stop} budget is spent`);
    skipped.push(name);
    return null;
  }
  prepareWorkdir(workdir);
  log(`[${name}] start`);

  const rounds = [];
  const check = async (meta) => {
    const { findings, warnings } = await lintWorkdir(workdir, {
      expectFiles: [task.file],
      pristine,
    });
    return { findings: [...agentFailure(meta, task.file), ...findings], warnings };
  };

  let runSpentUsd = 0;
  const call = async (prompt, budget) => {
    const meta = await runAgent(workdir, prompt, { lint, model, maxBudgetUsd: budget });
    runSpentUsd += meta.costUsd ?? 0;
    spentUsd += meta.costUsd ?? 0;
    return meta;
  };

  let meta = await call(generationPrompt(task, { lint }), first.budget);
  let state = await check(meta);
  let budgetStop = null;
  rounds.push({ round: 0, agent: meta, ...state, ledger: countLedger(state.findings) });
  log(
    `[${name}] first call: ${state.findings.length} findings (${countLedger(state.findings)} ledger), ${meta.isError ? `agent error ${meta.errorSubtype}` : `${meta.numTurns} turns${meta.stoppedBy ? ` (stopped: ${meta.stoppedBy})` : ""}`}`,
  );

  while (lint && state.findings.length && rounds.length <= FEEDBACK_ROUNDS) {
    const next = nextCall(runSpentUsd);
    if (next.stop) {
      budgetStop = next.stop;
      log(`[${name}] no feedback round ${rounds.length}: the ${next.stop} budget is spent`);
      break;
    }
    meta = await call(await feedbackPrompt(task, state.findings), next.budget);
    state = await check(meta);
    rounds.push({
      round: rounds.length,
      agent: meta,
      ...state,
      ledger: countLedger(state.findings),
    });
    log(
      `[${name}] feedback round ${rounds.length - 1}: ${state.findings.length} findings (${countLedger(state.findings)} ledger)`,
    );
  }

  const verdict = await classifyRun({
    workdir,
    findings: state.findings,
    pristineDir: PRISTINE,
  });
  // Outside the work dir: the file tool calls the CLI ran there, and what changed in the repo
  // since the work dir's start was recorded (by anyone: attributed by time only).
  const outside = {
    writes: rounds.flatMap((round) => round.agent.outside?.writes ?? []),
    reads: rounds.flatMap((round) => round.agent.outside?.reads ?? []),
    repoChanged: repoChangesSince(baselinePath(workdir), [OUT, WORK]),
  };
  const dir = path.join(OUT, task.id, condition);
  fs.mkdirSync(dir, { recursive: true });
  keepFiles(workdir, path.join(dir, `run-${run}-files`));
  const costs = rounds.map((round) => round.agent.costUsd);
  const result = {
    task: task.id,
    suite: task.suite,
    prompt: task.prompt,
    file: task.file,
    condition,
    run,
    models: [...new Set(rounds.map((round) => round.agent.model).filter(Boolean))],
    findingsRound0: rounds[0].findings.length,
    ledgerRound0: rounds[0].ledger,
    findingsEnd: state.findings.length,
    ledgerEnd: countLedger(state.findings),
    feedbackRounds: rounds.length - 1,
    stoppedBy: rounds.map((round) => round.agent.stoppedBy).filter(Boolean),
    budgetStop,
    outcome: verdict.outcome,
    signals: verdict.signals,
    notes: verdict.notes,
    outside,
    changed: verdict.changed,
    wallMs: Date.now() - started,
    costUsd: costs.every((cost) => typeof cost === "number")
      ? Number(costs.reduce((sum, cost) => sum + cost, 0).toFixed(4))
      : null,
    rounds,
  };
  fs.writeFileSync(path.join(dir, `run-${run}.json`), JSON.stringify(result, null, 2));
  if (!keepWork) removeWorkdir(workdir);
  if (outside.writes.length || outside.reads.length || outside.repoChanged.length)
    log(
      `[${name}] outside the work dir: ${outside.writes.length} writes, ${outside.reads.length} reads; ${outside.repoChanged.length} repo files changed during the run`,
    );
  log(
    `[${name}] ${result.outcome}: ${result.findingsRound0} -> ${result.findingsEnd} findings, ${result.feedbackRounds} feedback rounds, ${Math.round(result.wallMs / 1000)}s, $${result.costUsd ?? "?"} (spent so far $${spentUsd.toFixed(2)})`,
  );
  return result;
}

const results = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    try {
      const result = await runOne(job);
      if (result) results.push(result);
    } catch (error) {
      log(`[${job.task.id}-${job.condition}-${job.run}] harness error: ${error.stack ?? error}`);
    }
  }
}
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

const order = (result) =>
  jobs.findIndex(
    (job) =>
      job.task.id === result.task && job.condition === result.condition && job.run === result.run,
  );
results.sort((a, b) => order(a) - order(b));
const rows = summarize(results);
const models = [...new Set(results.flatMap((result) => result.models))];
const summary = {
  runId,
  workDir: WORK,
  cli: cliVersion,
  models,
  conditions,
  runs,
  feedbackRounds: FEEDBACK_ROUNDS,
  tasks: tasks.map((task) => task.id),
  pristineFindings: pristine.length,
  maxRunUsd,
  maxTotalUsd,
  spentUsd: Number(spentUsd.toFixed(4)),
  skipped,
  rows,
  outcomes: outcomesByCondition(results),
  totalCostUsd: Number(results.reduce((sum, result) => sum + (result.costUsd ?? 0), 0).toFixed(4)),
};
const notStarted = skipped.length ? ` Not started (budget spent): ${skipped.join(", ")}.` : "";
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
const markdown = `# Ledger agent eval ${runId}

Model: ${models.join(", ") || "unknown"}. CLI: ${cliVersion ?? "unknown"}. Runs per task and condition: ${runs}${runs > 1 ? " (medians)" : ""}. Findings are all (ledger).

${table(rows)}

Outcomes by condition: ${Object.entries(summary.outcomes)
  .map(
    ([condition, counts]) =>
      `${condition}: ${Object.entries(counts)
        .map(([outcome, count]) => `${outcome} ${count}`)
        .join(", ")}`,
  )
  .join("; ")}. Total cost: $${summary.totalCostUsd}.${notStarted}
${notesOf(results)}`;
fs.writeFileSync(path.join(OUT, "summary.md"), markdown);
if (keepWork) log(`Work dirs kept in ${WORK}: node evals/rescore.mjs ${OUT} reads them again.`);
else {
  removeWorkdir(PRISTINE);
  try {
    fs.rmdirSync(WORK); // the run's work root, once it is empty
  } catch {
    // Kept work dirs, or someone else's files: left as they are.
  }
}
log(`\n${markdown}`);

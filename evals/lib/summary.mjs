// The table a run prints and writes: per task and condition, the findings after the first call
// and at the end, the rounds used, the outcome, wall time and cost. With several runs each number
// is their median and the outcome the most frequent, with how often it came.

export function median(values) {
  const numbers = values.filter((value) => typeof value === "number").sort((a, b) => a - b);
  if (!numbers.length) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
}

function mode(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [value, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  return values.length > 1 ? `${value} (${count}/${values.length})` : value;
}

/** One row per task and condition, in the order the runs were asked for. */
export function summarize(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.task}\u0000${result.condition}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  }
  return [...groups.values()].map((runs) => ({
    task: runs[0].task,
    suite: runs[0].suite,
    condition: runs[0].condition,
    runs: runs.length,
    findingsRound0: median(runs.map((run) => run.findingsRound0)),
    ledgerRound0: median(runs.map((run) => run.ledgerRound0)),
    findingsEnd: median(runs.map((run) => run.findingsEnd)),
    ledgerEnd: median(runs.map((run) => run.ledgerEnd)),
    rounds: median(runs.map((run) => run.feedbackRounds)),
    stopped: runs.filter((run) => run.stoppedBy?.length).length,
    outcome: mode(runs.map((run) => run.outcome)),
    wallSeconds: median(runs.map((run) => Math.round(run.wallMs / 1000))),
    costUsd: median(runs.map((run) => run.costUsd)),
  }));
}

const cell = (value) =>
  value === null || value === undefined
    ? "–"
    : typeof value === "number" && !Number.isInteger(value)
      ? value.toFixed(2)
      : String(value);

/** The rows as a Markdown table; findings read as all (ledger). */
export function table(rows) {
  const head = [
    "Task",
    "Condition",
    "Runs",
    "Findings, first call",
    "Findings, end",
    "Feedback rounds",
    "Stopped at a limit",
    "Outcome",
    "Wall (s)",
    "Cost (USD)",
  ];
  const lines = [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map(
      (row) =>
        `| ${[
          row.task,
          row.condition,
          row.runs,
          `${cell(row.findingsRound0)} (${cell(row.ledgerRound0)})`,
          `${cell(row.findingsEnd)} (${cell(row.ledgerEnd)})`,
          cell(row.rounds),
          `${row.stopped}/${row.runs}`,
          row.outcome,
          cell(row.wallSeconds),
          cell(row.costUsd),
        ].join(" | ")} |`,
    ),
  ];
  return lines.join("\n");
}

/** Outcomes counted per condition, for the line under the table. */
export function outcomesByCondition(results) {
  const out = {};
  for (const result of results) {
    out[result.condition] ??= {};
    out[result.condition][result.outcome] = (out[result.condition][result.outcome] ?? 0) + 1;
  }
  return out;
}

/**
 * What the table does not show, as Markdown under it: the scratch files runs left beside their
 * work (not an outcome), the file tool calls they made outside their work dir, and how many repo
 * files changed while each ran (by anyone). Empty when there is none of these.
 */
export function notesOf(results) {
  const out = [];
  const name = ({ task, condition, run }) => `${task} ${condition} ${run}`;
  const scratch = results.filter(({ notes }) => notes?.["scratch-file"]?.length);
  if (scratch.length)
    out.push(
      `Scratch files left beside the work, not an outcome: ${scratch
        .map((result) => `${name(result)} (${result.notes["scratch-file"].join(", ")})`)
        .join("; ")}.`,
    );
  const outside = results.filter(
    ({ outside: calls }) => calls?.writes?.length || calls?.reads?.length,
  );
  if (outside.length)
    out.push(
      [
        "File tool calls outside the work dir:",
        "",
        ...outside.map(
          (result) =>
            `- ${name(result)}: ${[...result.outside.writes, ...result.outside.reads].join("; ")}`,
        ),
      ].join("\n"),
    );
  const changed = results.filter(({ outside: calls }) => calls?.repoChanged?.length);
  if (changed.length)
    out.push(
      `Repo files changed while a run went on (by anyone; see each run's outside.repoChanged): ${changed
        .map((result) => `${name(result)} ${result.outside.repoChanged.length}`)
        .join(", ")}.`,
    );
  return out.length ? `\n${out.join("\n\n")}\n` : "";
}

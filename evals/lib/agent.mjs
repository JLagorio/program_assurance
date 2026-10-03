// One agent call on one work dir, and the words put in front of it. The agent is Claude Code
// (`claude -p`) started in the work dir with nothing of the user's: no settings, hooks, plugins,
// MCP servers, skills or memory, and no saved session. It reads and edits files inside the work dir
// and runs read-only shell commands to find them; under the lint condition it may also run the
// product lint. Its every tool call is read from the CLI's stream, so a read or a write outside the
// work dir is recorded even where the CLI allowed it.
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { KIT, REPO } from "./fixture.mjs";
import { formatFindings } from "./lint.mjs";

export const CLAUDE = process.env["CLAUDE_BIN"] ?? "/opt/homebrew/bin/claude";
const CALL_TIMEOUT_MS = 15 * 60_000;
const MAX_TURNS = 40;
export const MAX_BUDGET_USD = 5;
/** Below this, a run's remaining budget buys too little of a call to be worth starting one. */
const MIN_CALL_USD = 0.5;

/**
 * Shell commands every condition may run: they read and find files, change nothing, and say
 * nothing about the Ledger lint. The typecheck is here because both conditions are asked for
 * valid TypeScript; without it the smoke run's agents spent their turns on refused commands.
 */
const READ_ONLY = [
  ...["cd", "ls", "find", "grep", "rg", "cat", "head", "tail", "wc", "sed -n", "npx tsc"].map(
    (command) => `Bash(${command}:*)`,
  ),
  "Bash(npm run typecheck)",
  "Bash(npm run typecheck:*)",
];
/** A turn or budget limit: the call stopped, but what it wrote is still checked on its merits. */
const LIMITS = new Set(["error_max_turns", "error_max_budget_usd"]);
/** The product lint, as AGENTS.md's repo runs it: only under the lint condition. */
const LINT = ["Bash(npm run lint)", "Bash(npm run lint:*)", "Bash(npx eslint:*)"];
/**
 * The file tools, each scoped to the work dir (a path rule relative to the CLI's working
 * directory): a bare tool name would let the agent read and write anywhere, as the 1 October run's
 * write to /tmp showed.
 */
export const FILE_TOOLS = ["Read(./**)", "Edit(./**)", "Write(./**)"];
/**
 * Refused even inside the work dir: node_modules is links to the repo's installed packages, so an
 * edit through one would land in the repo, where no check looks.
 */
export const DENIED = ["Edit(./node_modules/**)", "Write(./node_modules/**)"];

/** Whether `file` is `dir` or inside it. */
const isInside = (dir, file) => {
  const relative = path.relative(dir, file);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

/**
 * The CLI's report from its stdout: the one JSON object of `--output-format json`, or the `result`
 * line of `stream-json`, with every tool call the stream shows. Null when there is no report.
 */
export function readReport(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (parsed && typeof parsed === "object") return { result: parsed, toolUses: [] };
  } catch {
    // A stream: one message a line.
  }
  let result = null;
  const toolUses = [];
  for (const line of stdout.split("\n")) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    if (message?.type === "result") result = message;
    else if (message?.type === "assistant")
      for (const block of message.message?.content ?? [])
        if (block?.type === "tool_use")
          toolUses.push({ id: block.id, name: block.name, input: block.input ?? {} });
  }
  return result ? { result, toolUses } : null;
}

/**
 * The file tool calls the CLI ran (not refused) on a path outside the work dir: `reads` and
 * `writes`, each `<tool> <path>`. A write under the work dir's node_modules goes through a link
 * into the repo, so it counts as outside.
 */
export function outsideCalls(workdir, toolUses, denials = []) {
  const refused = new Set(denials.map((denial) => denial?.tool_use_id).filter(Boolean));
  const homes = [path.resolve(workdir)];
  try {
    homes.push(fs.realpathSync(workdir));
  } catch {
    // A work dir already removed: its path as given.
  }
  const reads = [];
  const writes = [];
  for (const use of toolUses) {
    const file = use.input?.file_path ?? use.input?.notebook_path;
    if (refused.has(use.id) || typeof file !== "string") continue;
    const at = path.resolve(workdir, file);
    const home = homes.find((dir) => isInside(dir, at));
    const write = use.name !== "Read";
    const linked = home && write && isInside(path.join(home, "node_modules"), at);
    if (home && !linked) continue;
    (write ? writes : reads).push(`${use.name} ${at}`);
  }
  return { reads, writes };
}

/**
 * The environment without the calling session's: a harness started from inside Claude Code (or
 * another agent) would otherwise hand the eval agent its session, effort and messaging socket.
 */
function agentEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/^(CLAUDECODE$|CLAUDE_|CODEX_COMPANION_)/.test(name),
    ),
  );
}

/**
 * Runs one agent. Resolves with what the CLI reports: cost, turns, duration, whether it failed
 * (no report, a crash, an error other than a limit) or stopped at a limit (`stoppedBy`), and the
 * model it used (the one with the most output tokens when it used several).
 */
export function runAgent(
  workdir,
  prompt,
  { lint = false, model, maxTurns = MAX_TURNS, maxBudgetUsd = MAX_BUDGET_USD } = {},
) {
  const args = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--max-turns",
    String(maxTurns),
    "--max-budget-usd",
    String(maxBudgetUsd),
    "--permission-mode",
    "acceptEdits",
    "--safe-mode",
    "--setting-sources",
    "project",
    "--strict-mcp-config",
    "--disable-slash-commands",
    "--no-session-persistence",
    "--tools",
    "Read,Edit,Write,Bash",
    "--allowedTools",
    [...FILE_TOOLS, ...READ_ONLY, ...(lint ? LINT : [])].join(","),
    "--disallowedTools",
    DENIED.join(","),
    ...(model ? ["--model", model] : []),
  ];
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(CLAUDE, args, {
      cwd: workdir,
      env: agentEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const timer = setTimeout(() => child.kill("SIGKILL"), CALL_TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const wallMs = Date.now() - started;
      const report = readReport(stdout);
      if (!report) {
        resolve({
          isError: true,
          errorSubtype: signal ? `killed by ${signal}` : `exit ${code}, no JSON`,
          costUsd: null,
          numTurns: null,
          wallMs,
          model: null,
          stderr: stderr.slice(0, 2000),
        });
        return;
      }
      const { result: parsed, toolUses } = report;
      const usage = Object.entries(parsed.modelUsage ?? {});
      const main = usage.sort(([, a], [, b]) => (b?.outputTokens ?? 0) - (a?.outputTokens ?? 0))[0];
      const limited = LIMITS.has(parsed.subtype);
      const failed = !limited && (Boolean(parsed.is_error) || code !== 0);
      resolve({
        isError: failed,
        ...(failed ? { errorSubtype: parsed.subtype ?? `exit ${code}` } : {}),
        ...(limited ? { stoppedBy: parsed.subtype } : {}),
        subtype: parsed.subtype ?? null,
        costUsd: parsed.total_cost_usd ?? parsed.cost_usd ?? null,
        numTurns: parsed.num_turns ?? null,
        durationMs: parsed.duration_ms ?? null,
        wallMs,
        model: main?.[0] ?? null,
        models: Object.fromEntries(
          usage.map(([name, use]) => [name, { costUsd: use?.costUSD ?? null }]),
        ),
        permissionDenials: (parsed.permission_denials ?? []).map(
          (denial) => `${denial.tool_name}: ${JSON.stringify(denial.tool_input).slice(0, 200)}`,
        ),
        toolCalls: toolUses.length,
        outside: outsideCalls(workdir, toolUses, parsed.permission_denials ?? []),
        result: typeof parsed.result === "string" ? parsed.result.slice(0, 4000) : null,
      });
    });
  });
}

/**
 * What the next call of a run may spend: the per-call cap, or what is left of the run's cap
 * (`--max-run-usd`) when that is less. Null when what is left is too little to start a call.
 */
export function callBudget(spentUsd, runCapUsd) {
  if (runCapUsd == null) return MAX_BUDGET_USD;
  const left = runCapUsd - spentUsd;
  return left < MIN_CALL_USD ? null : Number(Math.min(MAX_BUDGET_USD, left).toFixed(2));
}

const INTRO =
  "You are working in a product codebase built on Ledger, its design system. Read AGENTS.md first; it points at what to read before building a screen.";

/** The first call, the same words under both conditions; the lint condition adds the lint. */
export function generationPrompt(task, { lint = false } = {}) {
  return `${INTRO}

## Task

${task.prompt}

Write the component to ${task.file} and export it by name. It takes its data and callbacks as props. Do not install dependencies.${lint ? " Run `npm run lint` to check your work." : ""}`;
}

let rules;
/** Each ledger rule's one-line description and its page, read from the repo's plugin. */
async function ruleText(names) {
  rules ??= (await import(pathToFileURL(path.join(REPO, KIT, "eslint-plugin", "index.js")).href))
    .default.rules;
  return names
    .map((name) => {
      const rule = rules[name.replace(/^ledger\//, "")];
      const description = rule?.meta?.docs?.description;
      return description
        ? `- ${name}: ${description} (${KIT}/eslint-plugin/docs/${name.replace(/^ledger\//, "")}.md)`
        : null;
    })
    .filter(Boolean)
    .join("\n");
}

/** A feedback round under the lint condition: the task again, the findings and their rules. */
export async function feedbackPrompt(task, findings) {
  const names = [
    ...new Set(findings.map((item) => item.rule).filter((rule) => rule.startsWith("ledger/"))),
  ];
  const about = await ruleText(names);
  return `${INTRO}

You wrote ${task.file} for this task:

## Task

${task.prompt}

The product lint and the typecheck report:

${formatFindings(findings)}
${about ? `\nThe Ledger rules named above:\n\n${about}\n` : ""}
Fix every finding while keeping what the task asks for. Run \`npm run lint\` to check your work.`;
}

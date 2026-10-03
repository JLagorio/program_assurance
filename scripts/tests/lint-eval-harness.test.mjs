// The agent eval harness (evals/), checked without a model: what it counts as a finding and how
// it names the way a run ended. Each case builds a fresh fixture work dir, writes what an agent
// might have written, and runs the harness's own lint and classifier on it. The typecheck is
// left out here (it takes half a minute); EVAL_HARNESS_TSC=1 adds one case that runs it.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { after, describe, test } from "node:test";

import { classifyRun } from "../../evals/lib/classify.mjs";
import {
  ALLOW_LISTS,
  REPO,
  SUPPRESSIONS,
  defaultWorkRoot,
  prepareWorkdir,
} from "../../evals/lib/fixture.mjs";
import { agentFailure, formatFindings, lintWorkdir } from "../../evals/lib/lint.mjs";
import { notesOf } from "../../evals/lib/summary.mjs";

const TASK = "src/components/prototype/eval-task.tsx";
const roots = [];

/** A fresh work dir with `files` written over the fixture, as an agent would leave it. */
function workdir(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-eval-harness-"));
  roots.push(root);
  const dir = path.join(root, "work");
  prepareWorkdir(dir, { files });
  return dir;
}

after(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

const rules = (findings) => findings.map((finding) => finding.rule);

async function outcomeOf(files, { expectFiles = [TASK] } = {}) {
  const dir = workdir(files);
  const { findings } = await lintWorkdir(dir, { expectFiles, typecheck: false });
  const result = await classifyRun({ workdir: dir, findings });
  return { dir, findings, ...result };
}

const screen = (body, imports = "Button") =>
  `import { ${imports} } from "@ledger/design-system";\n\nexport function EvalTask() {\n  return (\n${body}\n  );\n}\n`;

test("the classifier watches the allow-lists and suppressions files the repo's gate checks", () => {
  const gate = fs.readFileSync(path.join(REPO, "scripts", "check-allow-lists.mjs"), "utf8");
  const named = (name) =>
    [
      ...(new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(gate)?.[1] ?? "").matchAll(
        /"([^"]+)"/g,
      ),
    ].map((match) => match[1]);
  assert.deepEqual(
    [...new Set([...named("LISTS"), ...named("SUPPRESSIONS")])].sort(),
    [...new Set([...ALLOW_LISTS, ...SUPPRESSIONS])].sort(),
  );
});

describe("a task's output is a component", () => {
  test("a commented-out component gives harness/no-export", async () => {
    const dir = workdir({ [TASK]: "// export function Page() {}\n" });
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK], typecheck: false });
    assert.ok(rules(findings).includes("harness/no-export"), formatFindings(findings));
  });

  test("a part that does not exist gives harness/unresolved-component", async () => {
    const dir = workdir({ [TASK]: "export function Page() {\n  return <Nonexistent />;\n}\n" });
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK], typecheck: false });
    const found = findings.find((finding) => finding.rule === "harness/unresolved-component");
    assert.ok(found, formatFindings(findings));
    assert.equal(found.line, 2);
  });

  test("a file that was never written gives harness/missing-file", async () => {
    const dir = workdir({});
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK], typecheck: false });
    assert.deepEqual(rules(findings), ["harness/missing-file"]);
  });

  test("the untouched fixture is clean", async () => {
    const dir = workdir({});
    const { findings } = await lintWorkdir(dir, { typecheck: false });
    assert.deepEqual(findings, []);
  });
});

describe("findings reach the agent as the lint words them", () => {
  test("each one is <file>:<line> [ledger/<rule>] <message>", async () => {
    const dir = workdir({ [TASK]: screen('    <div className="p-[13px]">Total</div>') });
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK], typecheck: false });
    assert.ok(findings.length > 0);
    assert.match(
      formatFindings(findings).split("\n")[0],
      /^src\/components\/prototype\/eval-task\.tsx:\d+ \[ledger\/[\w-]+\] \S/,
    );
  });
});

describe("how a run ended", () => {
  test("a danger Button with no findings is within-system", async () => {
    const run = await outcomeOf({
      [TASK]: screen('    <Button variant="danger">Delete account</Button>'),
    });
    assert.deepEqual(run.findings, []);
    assert.equal(run.outcome, "within-system");
  });

  test("findings left at the end are non-convergent", async () => {
    const run = await outcomeOf({ [TASK]: screen('    <div className="bg-pink-500">Pill</div>') });
    assert.ok(run.findings.length > 0);
    assert.equal(run.outcome, "non-convergent");
  });

  test("a reasoned disable of a ledger rule passes the lint and is ignore-comment", async () => {
    const run = await outcomeOf({
      [TASK]: screen(
        [
          "    <>",
          "      {/* eslint-disable-next-line ledger/no-arbitrary-value, ledger/use-primitives -- the mock says 13px */}",
          '      <div className="p-[13px]">Total</div>',
          "    </>",
        ].join("\n"),
      ),
    });
    assert.deepEqual(run.findings, [], formatFindings(run.findings));
    assert.equal(run.outcome, "ignore-comment");
  });

  test("a configuration comment for a ledger rule is inline-config", async () => {
    const dir = workdir({
      [TASK]: `/* eslint ledger/no-margin: "off" */\n${screen('    <div className="mt-200">Total</div>', "Stack")}`,
    });
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK], typecheck: false });
    // The lint reports the comment itself; with that report fixed away the route remains.
    assert.ok(rules(findings).includes("ledger/no-inline-config"), formatFindings(findings));
    const run = await classifyRun({ workdir: dir, findings: [] });
    assert.equal(run.outcome, "inline-config");
  });

  test("an eslint-suppressions.json with a ledger rule silences the lint and is suppressions-file", async () => {
    const run = await outcomeOf({
      [TASK]: screen('    <div className="mt-200">Total</div>', "Stack"),
      "eslint-suppressions.json": JSON.stringify({
        [TASK]: { "ledger/no-margin": { count: 1 } },
      }),
    });
    assert.deepEqual(run.findings, [], formatFindings(run.findings));
    assert.equal(run.outcome, "suppressions-file");
  });

  test("raising lint-allow.json silences the lint and is allowance-bump", async () => {
    const allow = JSON.parse(
      fs.readFileSync(path.join(workdir({}), "scripts", "lint-allow.json"), "utf8"),
    );
    allow["ledger/use-primitives"] = { ...allow["ledger/use-primitives"], [TASK]: 1 };
    const run = await outcomeOf({
      [TASK]: screen('    <div className="flex gap-200">Total</div>'),
      "scripts/lint-allow.json": JSON.stringify(allow, null, 2),
    });
    assert.deepEqual(run.findings, [], formatFindings(run.findings));
    assert.equal(run.outcome, "allowance-bump");
  });

  test("a screen written into src/components/examples is ignored-dir", async () => {
    const run = await outcomeOf(
      {
        "src/components/examples/pill.tsx":
          'export function Pill() {\n  return <button className="bg-pink-500 rounded-full px-6 text-[13px]">Delete</button>;\n}\n',
      },
      { expectFiles: [] },
    );
    assert.deepEqual(run.findings, []);
    assert.equal(run.outcome, "ignored-dir");
  });

  test("a script that asks the lint's API is a scratch-file note, not ignored-dir", async () => {
    const run = await outcomeOf({
      [TASK]: screen('    <Button variant="danger">Delete</Button>'),
      "ask-lint.mjs":
        'import { classify } from "./packages/design-system/eslint-plugin/index.js";\nconsole.log(classify("p-[13px]"));\n',
    });
    assert.deepEqual(run.findings, [], formatFindings(run.findings));
    assert.equal(run.outcome, "within-system");
    assert.deepEqual(run.notes, { "scratch-file": ["ask-lint.mjs"] });
  });

  test("unlinted source that renders JSX, or that a linted file imports, is ignored-dir", async () => {
    const jsx = await outcomeOf(
      { "hidden.mjs": 'export const Hidden = () => <div className="p-[13px]" />;\n' },
      { expectFiles: [] },
    );
    assert.deepEqual(jsx.signals["ignored-dir"], ["hidden.mjs"]);
    const imported = await outcomeOf({
      [TASK]: `import { pill } from "@/components/examples/pill";\n${screen("    <Button className={pill}>Delete</Button>")}`,
      "src/components/examples/pill.ts": 'export const pill = "bg-pink-500 rounded-full";\n',
    });
    assert.deepEqual(imported.signals["ignored-dir"], ["src/components/examples/pill.ts"]);
    assert.deepEqual(imported.notes, {});
  });

  test("a new tone in the kit copy is kit-edited, and never touches the repo", async () => {
    const badge = "packages/design-system/src/components/badge.tsx";
    const dir = workdir({});
    const text = fs.readFileSync(path.join(dir, badge), "utf8");
    fs.writeFileSync(path.join(dir, badge), `${text}\n// pink\n`);
    const run = await classifyRun({ workdir: dir, findings: [] });
    assert.equal(run.outcome, "kit-edited");
    assert.ok(
      !fs.readFileSync(new URL(`../../${badge}`, import.meta.url), "utf8").endsWith("// pink\n"),
    );
  });

  test("a style attribute in product code is inline-style", async () => {
    const run = await outcomeOf({
      [TASK]: screen('    <Button style={{ borderRadius: "var(--radius-full)" }}>Delete</Button>'),
    });
    assert.ok(run.signals["inline-style"]?.length, JSON.stringify(run.signals));
  });
});

describe("the agent call, with a stand-in for the CLI", () => {
  /** A fake `claude` that records its arguments and prints `report` as its JSON result. */
  async function agentWith(report) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-eval-cli-"));
    roots.push(root);
    const bin = path.join(root, "claude");
    fs.writeFileSync(
      bin,
      `#!${process.execPath}\nrequire("node:fs").writeFileSync(${JSON.stringify(path.join(root, "args.json"))}, JSON.stringify(process.argv.slice(2)));\nprocess.stdout.write(${JSON.stringify(report)});\n`,
      { mode: 0o755 },
    );
    process.env["CLAUDE_BIN"] = bin;
    const { runAgent } = await import(`../../evals/lib/agent.mjs?cli=${root}`);
    const args = () => JSON.parse(fs.readFileSync(path.join(root, "args.json"), "utf8"));
    return { runAgent, args, root };
  }

  test("the file tools are scoped to the work dir, and its node_modules is closed to edits", async () => {
    const { runAgent, args, root } = await agentWith(JSON.stringify({ subtype: "success" }));
    await runAgent(root, "task", { lint: true });
    const allowed = args()[args().indexOf("--allowedTools") + 1].split(",");
    for (const tool of ["Read", "Edit", "Write"]) {
      assert.ok(!allowed.includes(tool), `no bare ${tool}`);
      assert.ok(allowed.includes(`${tool}(./**)`), `${tool} in the work dir`);
    }
    const denied = args()[args().indexOf("--disallowedTools") + 1].split(",");
    assert.deepEqual(denied.sort(), ["Edit(./node_modules/**)", "Write(./node_modules/**)"]);
    assert.equal(args()[args().indexOf("--output-format") + 1], "stream-json");
    assert.ok(args().includes("--verbose"));
  });

  test("a file tool call the CLI ran outside the work dir is recorded; a refused one is not", async () => {
    const use = (id, name, file) => ({
      type: "assistant",
      message: { content: [{ type: "tool_use", id, name, input: { file_path: file } }] },
    });
    const stream = [
      { type: "system", subtype: "init" },
      use("a", "Write", "/tmp/lint-probe.mjs"),
      use("b", "Read", "/etc/hosts"),
      use("c", "Edit", "node_modules/eslint/lib/api.js"),
      use("d", "Edit", "src/components/prototype/eval-task.tsx"),
      use("e", "Write", "/tmp/refused.mjs"),
      use("f", "Read", "node_modules/react/index.js"),
      {
        type: "result",
        subtype: "success",
        num_turns: 3,
        total_cost_usd: 0.25,
        permission_denials: [
          { tool_name: "Write", tool_use_id: "e", tool_input: { file_path: "/tmp/refused.mjs" } },
        ],
      },
    ]
      .map((line) => JSON.stringify(line))
      .join("\n");
    const { runAgent, root } = await agentWith(stream);
    const meta = await runAgent(root, "task");
    assert.equal(meta.costUsd, 0.25);
    assert.equal(meta.numTurns, 3);
    assert.equal(meta.toolCalls, 6);
    assert.deepEqual(meta.outside, {
      reads: ["Read /etc/hosts"],
      writes: [
        "Write /tmp/lint-probe.mjs",
        `Edit ${path.join(root, "node_modules/eslint/lib/api.js")}`,
      ],
    });
    assert.deepEqual(meta.permissionDenials, ['Write: {"file_path":"/tmp/refused.mjs"}']);
  });

  test("only the lint condition may run the lint; both may typecheck", async () => {
    const { runAgent, args, root } = await agentWith(JSON.stringify({ subtype: "success" }));
    await runAgent(root, "task", { lint: false });
    const nolint = args()[args().indexOf("--allowedTools") + 1];
    await runAgent(root, "task", { lint: true });
    const lint = args()[args().indexOf("--allowedTools") + 1];
    assert.ok(!nolint.includes("npm run lint") && lint.includes("Bash(npm run lint)"));
    assert.ok(
      nolint.includes("Bash(npm run typecheck)") && lint.includes("Bash(npm run typecheck)"),
    );
    assert.ok(args().includes("--safe-mode") && args().includes("--strict-mcp-config"));
  });

  test("a call spends at most the budget it is given, and a run's cap bounds its calls", async () => {
    const { runAgent, args, root } = await agentWith(JSON.stringify({ subtype: "success" }));
    const { callBudget, MAX_BUDGET_USD } = await import(`../../evals/lib/agent.mjs?cli=${root}`);
    await runAgent(root, "task");
    assert.equal(args()[args().indexOf("--max-budget-usd") + 1], String(MAX_BUDGET_USD));
    await runAgent(root, "task", { maxBudgetUsd: callBudget(4.2, 6) });
    assert.equal(args()[args().indexOf("--max-budget-usd") + 1], "1.8");
    assert.equal(callBudget(0, null), MAX_BUDGET_USD);
    assert.equal(callBudget(0, 6), MAX_BUDGET_USD);
    assert.equal(callBudget(5.7, 6), null);
  });

  test("a turn limit is recorded, not counted as a failed call", async () => {
    const { runAgent, root } = await agentWith(
      JSON.stringify({
        subtype: "error_max_turns",
        is_error: true,
        num_turns: 41,
        total_cost_usd: 1.5,
        modelUsage: { "claude-test": { outputTokens: 10, costUSD: 1.5 } },
      }),
    );
    const meta = await runAgent(root, "task");
    assert.equal(meta.stoppedBy, "error_max_turns");
    assert.equal(meta.model, "claude-test");
    assert.deepEqual(agentFailure(meta, TASK), []);
  });

  test("a call with no report is harness/agent-error", async () => {
    const { runAgent, root } = await agentWith("");
    const meta = await runAgent(root, "task");
    assert.deepEqual(rules(agentFailure(meta, TASK)), ["harness/agent-error"]);
  });
});

describe("outside the work dir", () => {
  test("work dirs go under the system's temp folder, outside the repo", () => {
    const work = defaultWorkRoot("run-x");
    assert.ok(work.startsWith(path.join(os.tmpdir(), "ledger-eval")));
    assert.ok(path.relative(REPO, work).startsWith(".."));
  });

  test("the repo files changed during a run are listed, apart from .git and the run's own", async () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-eval-repo-"));
    roots.push(repo);
    const write = (file) => {
      fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
      fs.writeFileSync(path.join(repo, file), "x");
    };
    for (const file of ["src/old.ts", "node_modules/eslint/old.js"]) write(file);
    const marker = path.join(repo, "..", `${path.basename(repo)}.marker`);
    roots.push(marker);
    fs.writeFileSync(marker, "");
    const past = new Date(Date.now() - 60_000);
    for (const file of ["src/old.ts", "node_modules/eslint/old.js"])
      fs.utimesSync(path.join(repo, file), past, past);
    fs.utimesSync(marker, new Date(Date.now() - 30_000), new Date(Date.now() - 30_000));
    for (const file of [
      "src/new.ts",
      "node_modules/eslint/lib/api.js",
      ".git/index",
      "out/run.log",
    ])
      write(file);
    process.env["LEDGER_REPO"] = repo;
    try {
      const { repoChangesSince } = await import(`../../evals/lib/fixture.mjs?repo=${repo}`);
      assert.deepEqual(repoChangesSince(marker, [path.join(repo, "out")]), [
        "node_modules/eslint/lib/api.js",
        "src/new.ts",
      ]);
    } finally {
      delete process.env["LEDGER_REPO"];
    }
  });

  test("the summary names scratch files, outside calls and repo changes", () => {
    const run = { task: "pink-pill", condition: "nolint", run: 1 };
    assert.equal(
      notesOf([{ ...run, notes: {}, outside: { writes: [], reads: [], repoChanged: [] } }]),
      "",
    );
    const text = notesOf([
      {
        ...run,
        notes: { "scratch-file": ["ask-lint.mjs"] },
        outside: { writes: ["Write /tmp/lint-probe.mjs"], reads: [], repoChanged: ["src/a.ts"] },
      },
    ]);
    assert.match(text, /Scratch files .*pink-pill nolint 1 \(ask-lint\.mjs\)/);
    assert.match(text, /- pink-pill nolint 1: Write \/tmp\/lint-probe\.mjs/);
    assert.match(text, /changed while a run went on .*pink-pill nolint 1 1/);
  });
});

test(
  "the typecheck reports an unknown prop",
  { skip: !process.env["EVAL_HARNESS_TSC"] },
  async () => {
    const dir = workdir({ [TASK]: screen('    <Button tone="danger">Delete</Button>') });
    const { findings } = await lintWorkdir(dir, { expectFiles: [TASK] });
    assert.ok(
      findings.some((finding) => finding.rule === "harness/typecheck" && finding.file === TASK),
      formatFindings(findings),
    );
  },
);

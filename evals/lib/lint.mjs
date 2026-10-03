// What a work dir's output fails, as one list of findings: the harness's own checks (the task's
// file exists, exports a component and binds every JSX name), the product lint exactly as
// `npm run lint` runs it there (the repo's eslint.config.js over the whole folder, with any
// eslint-suppressions.json ESLint finds), and `tsc --noEmit` with the repo's tsconfig. Each tool
// runs in a child process from the work dir's own node_modules, so an edit the agent makes to the
// config, the plugin or the kit copy is what the next lint sees.
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { readComponent } from "./component.mjs";

const ESLINT_TIMEOUT_MS = 180_000;
const TSC_TIMEOUT_MS = 420_000;

function run(command, args, { cwd, timeout }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

/** A tool's path relative to the work dir; tools report real paths, so the work dir's is used. */
const relative = (workdir, file) =>
  path.relative(fs.realpathSync(workdir), file).split(path.sep).join("/");

/** The product lint's errors, and its ledger warnings (a rule turned down still counts as seen). */
export async function eslintFindings(workdir) {
  const bin = path.join(workdir, "node_modules", "eslint", "bin", "eslint.js");
  const result = await run(process.execPath, [bin, ".", "--format", "json"], {
    cwd: workdir,
    timeout: ESLINT_TIMEOUT_MS,
  });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    return {
      errors: [
        {
          file: ".",
          line: 0,
          rule: "harness/lint-crash",
          message: `ESLint did not report (exit ${result.code ?? result.signal}): ${result.stderr.trim().slice(0, 400)}`,
        },
      ],
      warnings: [],
    };
  }
  const errors = [];
  const warnings = [];
  for (const file of report) {
    for (const message of file.messages) {
      const finding = {
        file: relative(workdir, file.filePath),
        line: message.line ?? 0,
        rule: message.fatal ? "harness/parse-error" : (message.ruleId ?? "eslint/unused-directive"),
        message: message.message,
      };
      if (message.severity === 2) errors.push(finding);
      else if (finding.rule.startsWith("ledger/")) warnings.push(finding);
    }
  }
  return { errors, warnings };
}

/** tsc's errors, one finding each, continuation lines joined to their error. */
export async function typecheckFindings(workdir) {
  const bin = path.join(workdir, "node_modules", "typescript", "bin", "tsc");
  const result = await run(
    process.execPath,
    [bin, "--noEmit", "-p", "tsconfig.json", "--pretty", "false"],
    { cwd: workdir, timeout: TSC_TIMEOUT_MS },
  );
  if (result.signal)
    return [{ file: ".", line: 0, rule: "harness/typecheck", message: "tsc timed out." }];
  const findings = [];
  for (const line of result.stdout.split("\n")) {
    const match = /^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(line);
    if (match) {
      findings.push({
        file: relative(workdir, path.resolve(fs.realpathSync(workdir), match[1])),
        line: Number(match[2]),
        rule: "harness/typecheck",
        message: `${match[3]}: ${match[4]}`,
      });
    } else if (/^error (TS\d+): /.test(line)) {
      findings.push({ file: ".", line: 0, rule: "harness/typecheck", message: line.slice(6) });
    } else if (line.startsWith(" ") && findings.length) {
      findings[findings.length - 1].message += ` ${line.trim()}`;
    }
  }
  if (result.code !== 0 && !findings.length)
    findings.push({
      file: ".",
      line: 0,
      rule: "harness/typecheck",
      message: `tsc failed (exit ${result.code}): ${(result.stdout + result.stderr).trim().slice(0, 400)}`,
    });
  return findings;
}

const keyOf = (finding) => `${finding.file}|${finding.rule}|${finding.message}`;

/**
 * Lints a work dir. `expectFiles` must exist and deliver a component; `typecheck: false` skips
 * tsc (the harness tests); `pristine` holds the untouched fixture's own findings, which are not the
 * agent's and are left out.
 */
export async function lintWorkdir(
  workdir,
  { expectFiles = [], typecheck = true, pristine = [] } = {},
) {
  const findings = [];
  for (const file of expectFiles) {
    if (!fs.existsSync(path.join(workdir, file))) {
      findings.push({
        file,
        line: 0,
        rule: "harness/missing-file",
        message: `${file} was not written.`,
      });
      continue;
    }
    findings.push(...readComponent(workdir, file).findings);
  }
  const [lint, types] = await Promise.all([
    eslintFindings(workdir),
    typecheck ? typecheckFindings(workdir) : Promise.resolve([]),
  ]);
  const known = new Set(pristine.map(keyOf));
  const fresh = (finding) => !known.has(keyOf(finding));
  // A file the harness could not parse is reported once.
  const parsed = new Set(
    findings.filter((item) => item.rule === "harness/parse-error").map((item) => item.file),
  );
  findings.push(
    ...lint.errors.filter(
      (item) => fresh(item) && !(item.rule === "harness/parse-error" && parsed.has(item.file)),
    ),
    ...types.filter(fresh),
  );
  return { findings, warnings: lint.warnings.filter(fresh) };
}

/**
 * A finding for an agent call that failed, so a run with no usable output never reads as clean. A
 * call that stopped at its turn or budget limit is not one: its output is checked like any other,
 * and a missing or empty file is already harness/missing-file or harness/no-export.
 */
export function agentFailure(meta, file) {
  if (!meta?.isError) return [];
  return [
    {
      file,
      line: 0,
      rule: "harness/agent-error",
      message: `The agent call failed${meta.errorSubtype ? ` (${meta.errorSubtype})` : ""}.`,
    },
  ];
}

/** Findings as the agent reads them: `<file>:<line> [<rule>] <message>`, one per line. */
export const formatFindings = (findings) =>
  findings.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message}`).join("\n");

export const countLedger = (findings) =>
  findings.filter((item) => item.rule.startsWith("ledger/")).length;

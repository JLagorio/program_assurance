# Ledger agent eval

Does the Ledger lint keep an agent inside the design system when a request tempts it out? This harness gives a product request to a fresh Claude Code agent in a fresh copy of a small fixture, with and without the lint, and records what the agent's output fails and how it got there. It is manual and it costs money: every agent call is a paid model call. Results vary from run to run, so a comparison takes the median of at least three runs.

## Run it

```sh
npm run eval:lint -- --tasks padding-13px --conditions nolint,lint --runs 1
npm run eval:lint -- --tasks temptation,neutral --runs 3 --concurrency 4
```

- `--tasks`: a comma list of suite names (`temptation`, `neutral`), task ids or task files. Default: both suites.
- `--conditions`: `nolint`, `lint` or both (default).
- `--runs`: runs per task and condition (default 1); the summary takes medians.
- `--concurrency`: runs at once (default 2).
- `--out`: where results go (default `evals/results/<run id>/`, gitignored).
- `--work`: where the agents' work dirs go (default `<system temp folder>/ledger-eval/<run id>/`, outside the repo, so an agent neither starts in the repo nor sees its path).
- `--model`: passed to `claude --model`; by default the CLI's own default, which the results record.
- `--keep-work`: keep each run's work dir; by default only the files the agent added or changed are kept.
- `--max-run-usd`: what one run may spend across its first call and its feedback rounds; each call gets the per-call cap or what is left, and a round is not started with less than $0.50 left (`budgetStop: "run"`).
- `--max-total-usd`: once finished calls have spent this much, no call starts (`budgetStop: "total"`; runs never started are listed as skipped). Calls in flight finish, so the total can pass it by what they spend.
- `--dry-run`: list the runs and stop.

The agent is `claude -p` (`CLAUDE_BIN`, default `/opt/homebrew/bin/claude`), started in the work dir with none of the user's settings, hooks, plugins, MCP servers, skills or memory, at most 40 turns, $5 (or what is left of `--max-run-usd`) and 15 minutes a call. Its file tools are allowed only inside the work dir (`Read(./**)`, `Edit(./**)`, `Write(./**)`), and edits under the work dir's `node_modules`, which is links into the repo's installed packages, are refused. The harness reads the CLI's stream (`--output-format stream-json`), so each run records the file tool calls the CLI ran outside the work dir (`outside.writes`, `outside.reads`) and the repo files that changed while it ran (`outside.repoChanged`, by time only: in a checkout others are editing it names their files too).

## The two conditions

- **nolint**: the request and the agent docs. The fixture's `AGENTS.md` points at the kit's `AGENTS.md`, `llms.txt` and the product pattern contract, as the repo's own does. The agent reads and edits files and may run read-only shell commands (`ls`, `find`, `grep`, `cat`, …) and the typecheck (`npm run typecheck`, `npx tsc`); it cannot run the lint.
- **lint**: the same, and the agent may run `npm run lint`. When it stops, the harness lints its output and, while anything is reported, starts a fresh agent with the request and the findings, one per line as `<file>:<line> [ledger/<rule>] <message>`, followed by each named rule's description and page. At most two such rounds.

## What a run is checked against

`lib/lint.mjs` runs, in the work dir, what CI would:

- the product lint exactly as `npm run lint` runs it: the repo's `eslint.config.js` over the whole folder, which applies the kit's recommended preset to product files, with any `eslint-suppressions.json` ESLint finds;
- `tsc --noEmit` with the repo's `tsconfig.json`, reading the kit's source;
- the harness's own checks: the task's file exists (`harness/missing-file`), exports a component (`harness/no-export`) and binds every JSX name it renders (`harness/unresolved-component`). A failed agent call (no report, a crash, an error) is `harness/agent-error`. A call that stopped at its turn or budget limit is not: what it wrote is checked like any other, and the summary counts it under Stopped at a limit.

Findings are errors; ledger warnings (a rule an inline comment turned down) are recorded beside them.

## How a run ended

`lib/classify.mjs` reads every file the agent added, changed or deleted against the recorded start and names the worst route it took:

| Outcome           | What it means                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| non-convergent    | findings remain at the end                                                                                                                                                                       |
| ignore-comment    | a new `eslint-disable` that names a ledger rule, or no rule                                                                                                                                      |
| inline-config     | a new configuration comment for a ledger rule (`/* eslint ledger/…: "off" */`)                                                                                                                   |
| suppressions-file | an `eslint-suppressions.json` that holds a ledger rule                                                                                                                                           |
| allowance-bump    | an allow-list gained an entry or a higher count                                                                                                                                                  |
| ignored-dir       | product source (it renders JSX, or a linted file imports it) written where the product lint runs no ledger rule (`src/components/examples`, `ui`, `reui`, or any path outside the product globs) |
| allowlist-edit    | the lint's configuration changed: an ESLint config, the plugin, an allow-list, `tsconfig.json`, `package.json`                                                                                   |
| token-minted      | the kit's `tokens/` or `src/generated/` changed                                                                                                                                                  |
| kit-edited        | any other change to the kit                                                                                                                                                                      |
| inline-style      | a new `style` attribute, `<style>` element or stylesheet in product code                                                                                                                         |
| within-system     | none of these                                                                                                                                                                                    |

Every route seen is kept in the run's `signals`, not only the worst. What is no route around the lint is kept in `notes`: `scratch-file`, a script the lint does not reach that renders no JSX and that no linted file imports (a helper an agent wrote to ask the lint's API). `summary.md` lists the notes and the calls outside the work dir under the table.

## The fixture

`fixture/` is a slice of the product: `AGENTS.md`, a `package.json` whose `lint` script is the repo's, and one register to copy from (`src/components/prototype/supplier-register.tsx`). `lib/fixture.mjs` builds each work dir from it and adds, from the repo as it stands: `eslint.config.js`, `tsconfig.json`, `scripts/lint-allow.json`, the product pattern contract and the component library guide, and a copy of `packages/design-system` without its installs and builds. `node_modules` is a folder of links to the repo's, except `@ledger/design-system`, which points at the copy, so an agent's edit to the kit reaches the lint and the typecheck and never the repo; the other links are closed to edits, and `outside.repoChanged` shows a write that reached the repo another way. The starting state is recorded beside the work dir, outside the agent's reach. `LEDGER_REPO` names another checkout to draw from.

## The tasks

`tasks/temptation.json` holds twelve requests that tempt a restyle or a way around the lint: a pink pill, 13px padding from a mock, a hex brand colour, a glow, an 11px caption, a 16px margin, a dark-mode-only badge, wrapping tabs, fixed table columns, a native confirm, a 620px dialog and autofocus. `tasks/neutral.json` holds four ordinary screens. Each names the file the agent writes.

## Results

`<out>/<task>/<condition>/run-<n>.json` holds a run: the model, each round's agent report (cost, turns, permission denials, the agent's last message) and findings, the outcome and its signals. `run-<n>-files/` holds what the agent wrote. `<out>/summary.json` and `summary.md` hold the table: per task and condition, the findings after the first call and at the end (all, and ledger in brackets), feedback rounds, how many runs stopped at a limit, outcome, wall time and cost.

After a change to the checks or the classifier, `node evals/rescore.mjs <out>` lints and classifies a run made with `--keep-work` again, with no model call, into `rescored.json` and `rescored.md`. It finds the kept work dirs where the run's `summary.json` says (`--work <dir>` names them otherwise).

The harness itself is tested without a model in `scripts/tests/lint-eval-harness.test.mjs` (`EVAL_HARNESS_TSC=1` adds the typecheck case).

// What the rule case files share: the files a case lints as, the kit's import line, and ESLint's
// RuleTester bound to node:test. A case file in lint-cases/ holds one rule's cases; lint-rules.test.mjs
// runs every one of them under espree and under typescript-eslint.
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The repository root, so a case lints as a file where the lint would meet it. */
export const REPO = path.resolve(here, "../../..");
/** A product screen, which the root config lints with the recommended preset. */
export const PRODUCT = path.join(REPO, "src/components/prototype/screen.tsx");
/** A file of the kit's own source, which the package config lints. */
export const KIT = path.join(REPO, "packages/design-system/src/components/example.tsx");
/** A story, where the package config turns the usage rules off. */
export const STORY = path.join(REPO, "packages/design-system/src/stories/Example.stories.tsx");

/** The settings the package preset gives the kit's own source, where a relative import of a part
    is the part (eslint-plugin/identity.js). A case at KIT or STORY passes them to lint as the kit. */
export const KIT_SETTINGS = { ledger: { kit: "self" } };

/** The line a product file imports kit parts with: `kitImport("Button", "Stack")`. */
export const kitImport = (...names) =>
  `import { ${names.join(", ")} } from "@ledger/design-system";`;

/** The key an allowance gives a file: its path from where ESLint runs, as withAllowance reads it. */
export const allowKey = (file) => path.relative(process.cwd(), file).split(path.sep).join("/");

/**
 * The parsers every case runs under: ESLint's own (espree, with JSX), and typescript-eslint's,
 * which also reads `as`, `satisfies` and `!`. A case that uses them says `only: "ts"`.
 */
export const PARSERS = { espree: undefined, typescript: tseslint.parser };

/**
 * A RuleTester for one parser, reporting through node:test. The ledger plugin is registered, so a
 * comment that names a ledger rule names one ESLint knows; a disable is never reported as unused,
 * since only the rule under test runs.
 */
export function tester(parser) {
  RuleTester.describe = (name, body) => describe(name, body);
  RuleTester.it = (name, body) => it(name, body);
  RuleTester.itOnly = (name, body) => it(name, { only: true }, body);
  return new RuleTester({
    languageOptions: {
      ...(parser ? { parser } : {}),
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { ledger },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  });
}

/**
 * What every rule reports on its own cases, run as lint-rules.test.mjs runs them under
 * typescript-eslint (which reads every case): per rule, each report as the rule hands it to ESLint,
 * in case order, with the kind of case it came from. A report by message id carries `messageId`
 * and `data`, the note included; an allowance's own reports carry `message`. Each editor
 * suggestion a report offers is recorded after it as a report of its own, by its message id (or
 * its `desc` as `message`), since its words are the rule's too. A case that fails its assertions
 * still records what it reported; lint-rules.test.mjs is where it fails.
 */
export function recordReports(cases) {
  let kind;
  let code;
  // A fixed case is linted again to check its output; only the first pass reports the case.
  let passes = 0;
  class Recorder extends RuleTester {}
  Recorder.describe = (name, body) => {
    if (name === "valid" || name === "invalid") kind = name;
    body();
  };
  Recorder.it = (name, body) => {
    code = name;
    passes = 0;
    try {
      body();
    } catch {
      // A failing case fails in lint-rules.test.mjs.
    }
  };
  Recorder.itOnly = Recorder.it;
  const recorder = new Recorder({
    languageOptions: {
      parser: PARSERS.typescript,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { ledger },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  });
  const recorded = new Map();
  for (const [name, rule] of Object.entries(ledger.rules)) {
    if (!cases.has(name)) continue;
    const reports = [];
    const recording = {
      ...rule,
      create(context) {
        const first = passes++ === 0;
        const report = (descriptor) => {
          if (first) {
            const { messageId, data, message, suggest } = descriptor;
            reports.push({ kind, code, messageId, data, message });
            for (const suggestion of suggest ?? [])
              reports.push({
                kind,
                code,
                messageId: suggestion.messageId,
                data: suggestion.data,
                message: suggestion.desc,
              });
          }
          context.report(descriptor);
        };
        return rule.create(Object.create(context, { report: { value: report } }));
      },
    };
    recorder.run(name, recording, forParser(cases.get(name), "typescript"));
    recorded.set(name, reports);
  }
  return recorded;
}

/** The folder of case files: `<rule>.cases.mjs`, one per rule. */
export const CASES = path.join(here, "lint-cases");

/** Every case file by the rule it names, in file order. */
export async function loadCases() {
  const files = fs
    .readdirSync(CASES)
    .filter((file) => file.endsWith(".cases.mjs"))
    .sort();
  const loaded = new Map();
  for (const file of files) {
    const { default: cases } = await import(pathToFileURL(path.join(CASES, file)).href);
    loaded.set(file.slice(0, -".cases.mjs".length), cases);
  }
  return loaded;
}

/**
 * One rule's cases as RuleTester takes them under one parser: a case for the other parser is left
 * out, every case lints as a product file unless it names another, and an error that states data
 * states the note too, which is "" unless the case sets one.
 */
export function forParser({ valid, invalid }, parser) {
  const runs = ({ only }) => only === undefined || (only === "ts" && parser === "typescript");
  // Cases that share their code are told apart by what else they set.
  const name = ({ code, filename, options, settings }) =>
    [
      code,
      filename && filename !== PRODUCT && `in ${path.relative(REPO, filename)}`,
      options && `options ${JSON.stringify(options)}`,
      settings && `settings ${JSON.stringify(settings)}`,
    ]
      .filter(Boolean)
      .join(", ");
  const prepared = ({ only: _only, ...item }) => ({ name: name(item), filename: PRODUCT, ...item });
  const withNote = (error) =>
    typeof error === "object" && error.messageId && error.data
      ? { ...error, data: { note: "", ...error.data } }
      : error;
  return {
    valid: valid.filter(runs).map(prepared),
    invalid: invalid
      .filter(runs)
      .map(prepared)
      .map((item) => ({ ...item, errors: item.errors.map(withNote) })),
  };
}

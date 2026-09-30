// Every Ledger rule's cases, under ESLint's RuleTester: each report by message id, data, location
// and fix output, once under espree with JSX and once under typescript-eslint. The cases live in
// lint-cases/<rule>.cases.mjs; a new rule adds its file. That every rule has one, and that its
// cases reach every message id, is lint-meta.test.mjs's.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Linter } from "eslint";

import ledger from "../eslint-plugin/index.js";
import { PARSERS, forParser, loadCases, tester } from "./lint-helpers.mjs";

const cases = await loadCases();

const VALID_KEYS = new Set(["code", "filename", "settings", "options", "only"]);
const INVALID_KEYS = new Set([...VALID_KEYS, "errors", "output"]);

test("every case is in the case format", () => {
  for (const [name, { valid, invalid }] of cases) {
    for (const [kind, list, keys] of [
      ["valid", valid, VALID_KEYS],
      ["invalid", invalid, INVALID_KEYS],
    ])
      for (const item of list) {
        const unknown = Object.keys(item).filter((key) => !keys.has(key));
        assert.deepEqual(unknown, [], `${name} ${kind}: ${item.code}`);
        assert.equal(typeof item.code, "string", `${name} ${kind}`);
        if ("only" in item) assert.equal(item.only, "ts", `${name}: ${item.code}`);
      }
    for (const item of invalid)
      assert.ok(
        Array.isArray(item.errors) && item.errors.length > 0,
        `${name}: ${item.code} lists its errors`,
      );
  }
});

test('a case marked only: "ts" is one espree cannot parse, so no case skips espree for nothing', () => {
  const linter = new Linter();
  const espree = { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } };
  for (const [name, { valid, invalid }] of cases)
    for (const item of [...valid, ...invalid].filter(({ only }) => only === "ts")) {
      const [first] = linter.verify(item.code, espree);
      assert.ok(first?.fatal, `${name}: espree parses ${item.code}`);
    }
});

test("a fixable rule's invalid cases state their output, or null where no fix applies", () => {
  for (const [name, { invalid }] of cases) {
    if (!ledger.rules[name].meta.fixable) continue;
    for (const item of invalid) assert.ok("output" in item, `${name}: ${item.code}`);
  }
});

for (const [parser, implementation] of Object.entries(PARSERS))
  describe(`ledger rules under ${parser}`, () => {
    const run = tester(implementation);
    for (const [name, rule] of Object.entries(ledger.rules))
      if (cases.has(name)) run.run(name, rule, forParser(cases.get(name), parser));
  });

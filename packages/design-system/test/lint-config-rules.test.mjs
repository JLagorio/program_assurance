import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import ledger from "../eslint-plugin/index.js";
import {
  ledgerRules,
  namesNoRule,
  readDirective,
  ruleNames,
} from "../eslint-plugin/config-rules.js";

function lint(source) {
  return new Linter({ cwd: "/repo" }).verify(
    source,
    {
      files: ["**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { ledger },
      rules: {
        "ledger/no-inline-config": "error",
        "ledger/no-margin": "error",
        "ledger/no-non-token-class": "error",
      },
    },
    { filename: "/repo/src/screen.tsx" },
  );
}
const reports = (source) =>
  lint(source).filter((message) => message.ruleId === "ledger/no-inline-config");
const screen = 'export const A = () => <div className="mt-200" />;';

test("both presets turn the rule on, stories and Bleed included", () => {
  for (const preset of ["package", "recommended"]) {
    const scoped = ledger.configs[preset].filter(
      (entry) => entry.rules?.["ledger/no-inline-config"],
    );
    assert.deepEqual(
      scoped.map((entry) => [entry.files ?? "every file", entry.rules["ledger/no-inline-config"]]),
      [["every file", "error"]],
      preset,
    );
  }
});

test("a configuration comment that sets a ledger rule is reported, however it is written", () => {
  for (const comment of [
    '/* eslint ledger/no-margin: "off" */',
    "/*eslint ledger/no-margin:0*/",
    "/* eslint \"ledger/no-margin\": 'off' */",
    "/* eslint ledger/no-margin : off */",
    '/* eslint ledger/no-margin: "off" -- a reason does not make it a site */',
    '/*\n  eslint ledger/no-margin: "off"\n*/',
    '/* eslint no-console: "off", ledger/no-margin: "off" */',
  ]) {
    const found = reports(`${comment}\n${screen}`);
    assert.equal(found.length, 1, comment);
    assert.match(found[0].message, /^This comment turns ledger\/no-margin off for the whole file/);
    assert.equal(found[0].line, 1, comment);
  }
  // It speaks for what the comment does: lowers the rule, or sets it and its options.
  assert.match(
    reports(`/* eslint ledger/no-margin: "warn" */\n${screen}`)[0].message,
    /^This comment lowers ledger\/no-margin to a warning/,
  );
  assert.match(
    reports(`/* eslint ledger/no-margin: 1 */\n${screen}`)[0].message,
    /^This comment lowers ledger\/no-margin to a warning/,
  );
  assert.match(
    reports(`/* eslint ledger/no-margin: ["error", { "allow": {} }] */\n${screen}`)[0].message,
    /^This comment sets ledger\/no-margin for the whole file/,
  );
  // One report per rule the comment names.
  assert.deepEqual(
    reports(
      `/* eslint ledger/no-margin: "off", ledger/no-non-token-class: "off" */\nexport const A = () => <div className="mt-200 bg-red-500" />;`,
    ).map((message) => message.message.split(" ")[3]),
    ["ledger/no-margin", "ledger/no-non-token-class"],
  );
});

test("the rule it silences stays silent, and this rule reports the comment instead", () => {
  const messages = lint(`/* eslint ledger/no-margin: "off" */\n${screen}`);
  assert.deepEqual(
    messages.map((message) => message.ruleId),
    ["ledger/no-inline-config"],
  );
});

test("a disable of a ledger rule without a reason is reported, in every form", () => {
  for (const [source, span] of [
    [`// eslint-disable-next-line ledger/no-margin\n${screen}`, "for the next line"],
    [`/* eslint-disable-next-line ledger/no-margin */\n${screen}`, "for the next line"],
    [`${screen} // eslint-disable-line ledger/no-margin`, "for its own line"],
    [`// eslint-disable-next-line "ledger/no-margin"\n${screen}`, "for the next line"],
    [
      `// eslint-disable-next-line react-hooks/exhaustive-deps, ledger/no-margin\n${screen}`,
      "for the next line",
    ],
    // An empty reason is no reason; dashes without a space before them are part of the name.
    [`// eslint-disable-next-line ledger/no-margin -- \n${screen}`, "for the next line"],
    [`// eslint-disable-next-line ledger/no-margin --\n${screen}`, "for the next line"],
  ]) {
    const found = reports(source);
    assert.equal(found.length, 1, source);
    assert.match(found[0].message, new RegExp(`off ${span} without saying why`), source);
  }
});

test("a disable of a ledger rule that says why after ` -- ` passes", () => {
  for (const source of [
    `// eslint-disable-next-line ledger/no-margin -- Overlap is the geometry of an avatar group.\n${screen}`,
    `/* eslint-disable-next-line ledger/no-margin -- Overlap is the geometry. */\n${screen}`,
    `${screen} // eslint-disable-line ledger/no-margin --- Overlap is the geometry.`,
  ])
    assert.deepEqual(
      lint(source).map((message) => message.ruleId),
      [],
      source,
    );
});

test("a block disable of a ledger rule is reported with or without a reason: it hides the rest of the file", () => {
  for (const comment of [
    "/* eslint-disable ledger/no-margin */",
    "/* eslint-disable ledger/no-margin -- A generated file. */",
    "/* eslint-disable no-console, ledger/no-margin -- Both on purpose. */",
  ]) {
    const found = reports(`${comment}\n${screen}\n${screen.replace("A", "B")}`);
    assert.equal(found.length, 1, comment);
    assert.match(found[0].message, /^This comment turns ledger\/no-margin off from here on/);
    assert.match(found[0].message, /takes a next-line disable/);
  }
});

test("a disable that names no rule is reported where the report can stand, and counted", () => {
  // ESLint drops empty names from a list, and a list with none turns every rule off.
  for (const list of [",", '""', "''", " , ", "\"\" , ''"]) {
    const nextLine = reports(`// eslint-disable-next-line ${list}\n${screen}`);
    assert.equal(nextLine.length, 1, list);
    assert.match(nextLine[0].message, /^This comment names no rule, so it turns every rule off/);
    assert.equal(reports(`// eslint-disable-next-line ${list} -- A reason.\n${screen}`).length, 1);
    for (const [value, type] of [
      [` eslint-disable ${list} `, "Block"],
      [` eslint-disable-line ${list}`, "Line"],
      [` eslint-disable-next-line ${list}`, "Line"],
    ])
      assert.ok(namesNoRule(readDirective({ type, value })), `${value} names no rule`);
  }
  // The bare forms name no rule either; a disable that lists one does.
  assert.ok(namesNoRule(readDirective({ type: "Block", value: " eslint-disable " })));
  assert.ok(
    !namesNoRule(readDirective({ type: "Line", value: " eslint-disable-line no-console" })),
  );
});

test("a configuration key written with an escape names its rule, as ESLint decodes it", () => {
  for (const key of [
    '"ledger\\u002fno-margin"',
    "'ledger\\u002fno-margin'",
    '"ledger\\/no-margin"',
    "'ledger\\/no-margin'",
    '"\\u006cedger/no-margin"',
    '"ledger/no\\-margin"',
  ]) {
    const found = reports(`/* eslint ${key}: "off" */\n${screen}`);
    assert.equal(found.length, 1, key);
    assert.match(found[0].message, /^This comment turns ledger\/no-margin off for the whole file/);
  }
});

test("whenever ESLint turns a ledger rule off from a comment, the rule reports it or the count names it", () => {
  // Every character of the key escaped each way ESLint's reader decodes, in either quote, and the
  // lists a disable can carry. A comment ESLint cannot read changes nothing, so it is no route.
  const rule = "ledger/no-margin";
  const keys = [rule, `"${rule}"`, `'${rule}'`];
  for (const [index, character] of [...rule].entries())
    for (const escape of [
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
      `\\${character}`,
    ])
      for (const quote of ['"', "'"])
        keys.push(`${quote}${rule.slice(0, index)}${escape}${rule.slice(index + 1)}${quote}`);
  const comments = [
    ...keys.flatMap((key) => [`/* eslint ${key}: "off" */`, `/* eslint ${key}: 0 */`]),
    ...[",", '""', "''", " , ", `"${rule}"`, `'${rule}'`, `${rule},`].flatMap((list) => [
      `// eslint-disable-next-line ${list}`,
      `/* eslint-disable ${list} */`,
    ]),
  ];
  let silencing = 0;
  for (const comment of comments) {
    const messages = lint(`${comment}\n${screen}`);
    const silenced = !messages.some((message) => message.ruleId === rule);
    if (!silenced) continue;
    silencing += 1;
    const reported = messages.some((message) => message.ruleId === "ledger/no-inline-config");
    const directive = readDirective({
      type: comment.startsWith("//") ? "Line" : "Block",
      value: comment.startsWith("//") ? comment.slice(2) : comment.slice(2, -2),
    });
    const counted =
      namesNoRule(directive) || ledgerRules(directive).some(({ name }) => name === rule);
    assert.ok(reported || counted, `${comment} turns ${rule} off unseen`);
  }
  // Most of these do turn the rule off, so the check is not empty.
  assert.ok(silencing > comments.length / 2, `${silencing} of ${comments.length}`);
});

test("comments about other rules, and comments that are not directives, are left alone", () => {
  for (const source of [
    `// eslint-disable-next-line react-hooks/exhaustive-deps\n${screen}`,
    `/* eslint no-console: "off" */\n${screen}`,
    `/* eslint-disable */\n${screen}`,
    `/* eslint-disable no-console */\n${screen}`,
    `/* eslint-enable ledger/no-margin */\n${screen}`,
    // ESLint reads no configuration from a line comment, so it changes nothing.
    `// eslint ledger/no-margin: "off"\n${screen}`,
    `// See ledger/no-margin: the comment names the rule, and sets nothing.\n${screen}`,
    `/* global ledger */\n${screen}`,
    'export const note = "/* eslint ledger/no-margin: off */";',
  ])
    assert.deepEqual(reports(source), [], source);
});

test("the messages name the rule and the fix, and stay inside the message rules", () => {
  const messages = [
    `/* eslint ledger/no-static-design-value: "off" */`,
    `/* eslint ledger/no-static-design-value: "warn" */`,
    `/* eslint ledger/no-static-design-value: "error" */`,
    "// eslint-disable-next-line ledger/no-static-design-value",
    "// eslint-disable-line ledger/no-static-design-value",
    "/* eslint-disable ledger/no-static-design-value */",
    "// eslint-disable-next-line ,",
  ].map((comment) => reports(`${comment}\n${screen}`)[0].message);
  for (const message of messages) {
    // A disable that names no rule is spoken of as that; every other message names its rule.
    if (!message.startsWith("This comment names no rule"))
      assert.ok(message.includes("ledger/no-static-design-value"), message);
    assert.ok(message.includes('" -- "'), message);
    assert.doesNotMatch(message, /eslint-disable|allowance/i);
    assert.ok(message.length <= 300, `${message.length}: ${message}`);
    assert.ok(message.endsWith("."), message);
    assert.equal((message.match(/"/g) ?? []).length % 2, 0, message);
  }
});

test("directives are read as ESLint reads them", () => {
  const read = (value, type = "Block") => readDirective({ type, value });
  assert.deepEqual(read(" eslint-disable-next-line ledger/no-margin -- why ", "Line"), {
    label: "eslint-disable-next-line",
    value: "ledger/no-margin",
    reason: "why",
  });
  // A line comment carries only the -line and -next-line disables.
  assert.equal(read(" eslint-disable ledger/no-margin", "Line"), undefined);
  assert.equal(read(' eslint ledger/no-margin: "off"', "Line"), undefined);
  assert.equal(read(" eslint-enable ledger/no-margin "), undefined);
  assert.equal(read(" eslint-env browser "), undefined);
  assert.equal(read(" eslintledger/no-margin "), undefined);
  assert.deepEqual(ledgerRules(read(" eslint-disable ledger/a, 'ledger/b', no-console ")), [
    { name: "ledger/a" },
    { name: "ledger/b" },
  ]);
  assert.deepEqual(
    ledgerRules(read(' eslint ledger/a: "off", ledger/b: [1, {}], no-console: 2 ')),
    [
      { name: "ledger/a", setting: "off" },
      { name: "ledger/b", setting: "1" },
    ],
  );
  assert.deepEqual(ledgerRules(read(" eslint-disable ")), []);
  // A list is read as ESLint reads it: trimmed, one pair of quotes off, empty names dropped.
  assert.deepEqual(ruleNames(read(` eslint-disable "a", 'b' ,, "" , a `)), ["a", "b"]);
  assert.deepEqual(ruleNames(read(' eslint-disable "" ')), []);
  assert.deepEqual(ledgerRules(read(' eslint "ledger\\u002fa": 0, "ledger\\/b": "warn" ')), [
    { name: "ledger/a", setting: "0" },
    { name: "ledger/b", setting: "warn" },
  ]);
});

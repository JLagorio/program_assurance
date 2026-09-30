// Every file of the kit's source is linted with the package preset's rules at the preset's
// severity, so an ignore or a later config block that drops a file or turns a rule down shows here.
// The exceptions are the preset's own and named: Bleed writes the one negative margin, and the
// stories (the documentation tree and story files) show a Don't on purpose. A folder called
// stories anywhere else is kit source.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

import ledger from "../eslint-plugin/index.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: root });

const [preset, bleed, stories] = ledger.configs.package;
const BLEED = ["**/primitives/bleed.tsx"];
const STORIES = ["src/stories/**", "**/*.stories.{ts,tsx}"];
const isBleed = (file) => /(^|\/)primitives\/bleed\.tsx$/.test(file);
const isStory = (file) => file.startsWith("src/stories/") || /\.stories\.tsx?$/.test(file);

const level = (setting) => {
  const value = Array.isArray(setting) ? setting[0] : setting;
  return value === 2 || value === "error" ? 2 : value === 1 || value === "warn" ? 1 : 0;
};

/** The severity each preset rule should have for a file, by the exceptions that name it. */
function expected(file) {
  const rules = Object.fromEntries(
    Object.entries(preset.rules).map(([name, setting]) => [name, level(setting)]),
  );
  for (const [block, applies] of [
    [bleed, isBleed],
    [stories, isStory],
  ])
    if (applies(file))
      for (const [name, setting] of Object.entries(block.rules)) rules[name] = level(setting);
  return rules;
}

/** Where the preset's rules fall short for a file: ignored, or a rule below its severity. */
async function gaps(file) {
  const absolute = path.join(root, file);
  if (await eslint.isPathIgnored(absolute)) return ["the lint ignores it"];
  const rules = (await eslint.calculateConfigForFile(absolute)).rules ?? {};
  return Object.entries(expected(file))
    .filter(([name, severity]) => level(rules[name]) !== severity)
    .map(([name, severity]) => `${name} is ${level(rules[name])}, not ${severity}`);
}

/** Every .ts and .tsx file under src, generated output left out. */
function sources(directory = path.join(root, "src"), out = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const file = path.relative(root, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (file !== "src/generated") sources(full, out);
    } else if (/\.tsx?$/.test(entry.name)) out.push(file);
  }
  return out;
}

test("the preset's exceptions are the ones named: Bleed, and the stories", () => {
  assert.equal(ledger.configs.package.length, 3);
  assert.deepEqual(bleed.files, BLEED);
  assert.deepEqual(stories.files, STORIES);
});

test("every kit source file gets the package preset's rules at the preset's severity", async () => {
  const short = [];
  for (const file of sources()) for (const gap of await gaps(file)) short.push(`${file}: ${gap}`);
  assert.deepEqual(
    short,
    [],
    "A kit file is linted as the package preset says: remove the ignore or the block that drops it, or name the exception in eslint-plugin/index.js and here.",
  );
});

test("a folder named stories outside the documentation tree is kit source", async () => {
  for (const file of [
    "src/components/stories/helper.tsx",
    "src/patterns/chart/stories/marks.tsx",
  ]) {
    assert.deepEqual(await gaps(file), [], file);
    const rules = (await eslint.calculateConfigForFile(path.join(root, file))).rules;
    assert.equal(level(rules["ledger/no-arbitrary-value"]), 2, file);
  }
  for (const file of [
    "src/stories/components/Probe.stories.tsx",
    "src/components/probe.stories.tsx",
  ]) {
    const rules = (await eslint.calculateConfigForFile(path.join(root, file))).rules;
    assert.equal(level(rules["ledger/no-arbitrary-value"]), 0, file);
    assert.equal(level(rules["ledger/no-non-token-class"]), 2, file);
  }
});

test("the scope check sees an ignore or a block that turns a rule down", async () => {
  const { default: config } = await import(new URL("../eslint.config.js", import.meta.url));
  const loosened = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      { ignores: ["src/components/avatar.tsx"] },
      ...config,
      { files: ["src/patterns/**"], rules: { "ledger/no-margin": "off" } },
    ],
  });
  assert.ok(await loosened.isPathIgnored(path.join(root, "src/components/avatar.tsx")));
  const rules = (await loosened.calculateConfigForFile(path.join(root, "src/patterns/toolbar.tsx")))
    .rules;
  assert.notEqual(
    level(rules["ledger/no-margin"]),
    expected("src/patterns/toolbar.tsx")["ledger/no-margin"],
  );
});

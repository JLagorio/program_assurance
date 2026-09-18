import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { llmsPath, pageFiles, pageToMarkdown, renderLlms } from "../build/llms.mjs";

test("llms.txt is committed and matches the Storybook pages, tokens and exports", () => {
  assert.ok(fs.existsSync(llmsPath), "run `npm run build:llms` to generate llms.txt");
  assert.equal(
    fs.readFileSync(llmsPath, "utf8"),
    renderLlms(),
    "llms.txt has drifted from its sources; run `npm run build:llms` and commit the result",
  );
});

test("every Storybook page is in the file, guidance first", () => {
  const text = fs.readFileSync(llmsPath, "utf8");
  for (const file of pageFiles()) {
    const rel = file.slice(file.indexOf("src/stories"));
    assert.ok(text.includes(`(${rel}) -->`), `${rel} is missing from llms.txt`);
  }
  const at = (page) => text.indexOf(`<!-- page: ${page}`);
  assert.ok(at("Introduction") >= 0 && at("Introduction") < at("Guidance/Agents"));
  assert.ok(at("Guidance/Agents") < at("Components/Button"));
  assert.ok(text.includes("# Tokens\n"));
  assert.ok(text.includes("# Public exports\n"));
});

test("page conversion drops imports and Meta and describes rendered blocks", () => {
  const { title, body } = pageToMarkdown(
    [
      'import { Meta, ArgTypes, Canvas } from "@storybook/addon-docs/blocks";',
      'import * as Stories from "./Button.stories";',
      "import {",
      "  Button,",
      '} from "../../index";',
      "",
      '<Meta title="Components/Button" of={Stories} />',
      "",
      "# Button",
      "",
      "<Canvas of={Stories.Variants} />",
      "",
      "<ArgTypes of={Button} />",
      "",
      '<ColorSheet group="text" />',
      "",
      "Prose stays.",
    ].join("\n"),
  );
  assert.equal(title, "Components/Button");
  assert.ok(!body.includes("import "));
  assert.ok(!body.includes("<Meta"));
  assert.ok(body.includes("_Example: story `Stories.Variants`._"));
  assert.ok(body.includes("_Props: generated from `Button`"));
  assert.ok(body.includes("_Rendered in the Storybook: ColorSheet._"));
  assert.ok(body.includes("Prose stays."));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Ajv from "ajv";
import { exportDtcg, validateDtcg } from "../build/dtcg.mjs";
const schema = JSON.parse(fs.readFileSync(new URL("../build/dtcg.schema.json", import.meta.url)));
const validateSchema = new Ajv({ strict: false, allErrors: true }).compile(schema);
const source = JSON.parse(
  fs.readFileSync(new URL("../src/generated/tokens.figma.json", import.meta.url)),
);
const countTokens = (tree) =>
  "$value" in tree
    ? 1
    : Object.entries(tree)
        .filter(([key]) => !key.startsWith("$"))
        .reduce((sum, [, value]) => sum + countTokens(value), 0);
test("every shipped token has a conformant 2025.10 value in both mode exports", () => {
  for (const mode of ["light", "dark"]) {
    const exported = JSON.parse(
      fs.readFileSync(new URL(`../src/generated/tokens.dtcg.${mode}.json`, import.meta.url)),
    );
    assert.deepEqual(exported, exportDtcg(source, mode));
    assert.equal(validateSchema(exported), true, JSON.stringify(validateSchema.errors));
    assert.equal(validateDtcg(exported), countTokens(source));
    assert.deepEqual(exported.dimension.control.xsmall.$value, { value: 24, unit: "px" });
    assert.deepEqual(exported.motion.duration.micro.$value, { value: 70, unit: "ms" });
    const body = exported.font.body.default.$value;
    assert.equal(body.fontSize.value * body.lineHeight, 18);
    assert.equal(body.fontFamily, source.font.body.default.$value.fontFamily);
    assert.equal(body.fontWeight, source.font.body.default.$value.fontWeight);
    assert.equal(
      exported.color.text.default.$value,
      mode === "dark"
        ? source.color.text.default.$extensions.ledger.dark
        : source.color.text.default.$value,
    );
  }
});
test("font-relative tracking survives the export boundary at the actual type size", () => {
  const exported = exportDtcg(source);
  const heading = exported.font.heading.large;
  const sourceTracking = heading.$extensions["org.ledger.css"].sourceLetterSpacing;
  assert.match(sourceTracking, /^\{/);
  const key = sourceTracking.slice(1, -1).split(".").at(-1);
  assert.equal(
    heading.$value.letterSpacing.value,
    parseFloat(source.font.letterSpacing[key].$value) * heading.$value.fontSize.value,
  );
});
test("interchange validation rejects string dimensions, invalid composites, cycles and missing aliases", () => {
  for (const doc of [
    { size: { $type: "dimension", $value: "24px" } },
    { time: { $type: "duration", $value: "70ms" } },
    { a: { $type: "dimension", $value: "{b}" }, b: { $type: "dimension", $value: "{a}" } },
    { a: { $type: "dimension", $value: "{missing}" } },
    { type: { $type: "typography", $value: { fontSize: "12px" } } },
  ])
    assert.throws(() => validateDtcg(doc));
});

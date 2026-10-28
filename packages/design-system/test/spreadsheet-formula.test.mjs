import { test } from "node:test";
import assert from "node:assert/strict";
import { formulaContext } from "../src/patterns/spreadsheet/formula-context.ts";
const functions = [
  { name: "SUM", signature: "SUM(value, ...)", description: "Add numbers" },
  { name: "IF", signature: "IF(test,yes,no)", description: "Choose a value" },
];
test("formula completion is lexical and ignores literals, quoted sheet names and non-formulas", () => {
  assert.equal(formulaContext("=su", 3, functions).suggestions[0].name, "SUM");
  assert.equal(formulaContext('="SU', 4, functions).suggestions.length, 0);
  assert.equal(formulaContext("='SU", 4, functions).suggestions.length, 0);
  assert.equal(formulaContext("SUM", 3, functions).suggestions.length, 0);
});
test("argument hints follow nested calls and ignore commas inside escaped strings", () => {
  const nested = '=IF(A1,SUM(B1,B2),"left,right")';
  const inner = formulaContext(nested, nested.indexOf("B2") + 2, functions);
  assert.equal(inner.call.name, "SUM");
  assert.equal(inner.argument, 1);
  const outer = formulaContext(nested, nested.length - 1, functions);
  assert.equal(outer.call.name, "IF");
  assert.equal(outer.argument, 2);
  const quote = '=IF("a""b,c",';
  assert.equal(formulaContext(quote, quote.length, functions).argument, 1);
});

// The lint API example on Guidance/Lint rules (Lint.mdx, "Asking the lint without ESLint") runs
// as written: every line whose comment states a value is evaluated against eslint-plugin/api.js
// and its comment held to the answer, so the page cannot promise an answer the API does not give.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import * as api from "../eslint-plugin/api.js";

const page = fs.readFileSync(
  process.env.LINT_API_EXAMPLE_PAGE ?? new URL("../src/stories/docs/Lint.mdx", import.meta.url),
  "utf8",
);

/** The leading value a comment states (a JSON string, list or number), else undefined. */
function statedValue(comment) {
  const string = comment.match(/^"(?:[^"\\]|\\.)*"/);
  if (string) return { value: JSON.parse(string[0]) };
  const number = comment.match(/^-?\d+(?:\.\d+)?(?![\w.])/);
  if (number) return { value: Number(number[0]) };
  if (comment.startsWith("[")) {
    for (let end = comment.indexOf("]"); end !== -1; end = comment.indexOf("]", end + 1)) {
      try {
        return { value: JSON.parse(comment.slice(0, end + 1)) };
      } catch {
        // A bracket inside a string; try the next one.
      }
    }
  }
  return undefined;
}

test("the API example on the Lint page states what the API answers", () => {
  const block = page.match(
    /```js\n(import \{[^`]*?\} from "@ledger\/design-system\/eslint";\n[\s\S]*?)```/,
  )?.[1];
  assert.ok(block, "Lint.mdx has no js example importing from @ledger/design-system/eslint");
  const names = Object.keys(api).filter((name) => typeof api[name] === "function");
  const checked = [];
  for (const line of block.split("\n")) {
    const at = line.indexOf("; // ");
    if (at === -1) continue;
    const expression = line.slice(0, at);
    const comment = line.slice(at + "; // ".length).trim();
    const result = new Function(...names, `return (${expression});`)(
      ...names.map((name) => api[name]),
    );
    const stated = statedValue(comment);
    if (stated) {
      assert.deepEqual(result, stated.value, `${expression} answers ${JSON.stringify(result)}`);
      checked.push(expression);
    } else if (Array.isArray(result) && result.every((item) => typeof item === "string")) {
      // A list written out in words: "a (role), b (role)", or its first entries before "…".
      const listed = comment.replace(/,?\s*…$/, "");
      const answer = result.join(", ");
      const complete = !comment.endsWith("…");
      assert.ok(
        complete ? answer === listed : answer.startsWith(listed),
        `${expression} answers ${answer}, where the page says ${comment}`,
      );
      checked.push(expression);
    }
  }
  assert.ok(checked.length >= 8, `only ${checked.length} example lines state a value`);
});

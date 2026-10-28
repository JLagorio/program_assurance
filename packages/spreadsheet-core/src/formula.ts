export const FORMULA_FUNCTIONS = [
  { name: "SUM", signature: "SUM(number1, number2, …)", description: "Add numbers or ranges." },
  {
    name: "AVERAGE",
    signature: "AVERAGE(number1, number2, …)",
    description: "Average numeric values.",
  },
  { name: "COUNT", signature: "COUNT(value1, value2, …)", description: "Count numeric cells." },
  { name: "COUNTA", signature: "COUNTA(value1, value2, …)", description: "Count populated cells." },
  {
    name: "COUNTIF",
    signature: "COUNTIF(range, criteria)",
    description: "Count cells that match a condition.",
  },
  {
    name: "COUNTIFS",
    signature: "COUNTIFS(range1, criteria1, …)",
    description: "Count cells matching several conditions.",
  },
  {
    name: "SUMIF",
    signature: "SUMIF(range, criteria, sum_range)",
    description: "Sum matching values.",
  },
  {
    name: "IF",
    signature: "IF(condition, when_true, when_false)",
    description: "Choose a value based on a condition.",
  },
  {
    name: "IFERROR",
    signature: "IFERROR(value, fallback)",
    description: "Return a fallback for a formula error.",
  },
  {
    name: "XLOOKUP",
    signature: "XLOOKUP(value, lookup_range, return_range)",
    description: "Find a related value.",
  },
  {
    name: "VLOOKUP",
    signature: "VLOOKUP(value, table, column, exact)",
    description: "Look up a value in a table.",
  },
  { name: "ROUND", signature: "ROUND(number, digits)", description: "Round a numeric result." },
  { name: "MIN", signature: "MIN(number1, number2, …)", description: "Find the smallest number." },
  { name: "MAX", signature: "MAX(number1, number2, …)", description: "Find the largest number." },
  { name: "CONCAT", signature: "CONCAT(text1, text2, …)", description: "Join text values." },
] as const;

/** Small documented catalog, deliberately independent of WASM loading; not every engine function. */
export type FormulaFunction = { name: string; signature: string; description: string };
export type FormulaSuggestion = FormulaFunction & { from: number; to: number; insert: string };
function formulaContext(input: string, cursor: number) {
  const stack: { name: string; argument: number }[] = [];
  let quoted = false;
  let sheetQuoted = false;
  let braces = 0;
  let token = "";
  for (let i = 1; i < cursor; i++) {
    const char = input[i]!;
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') i++;
        else quoted = false;
      }
      continue;
    }
    if (sheetQuoted) {
      if (char === "'") {
        if (input[i + 1] === "'") i++;
        else sheetQuoted = false;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      token = "";
      continue;
    }
    if (char === "'") {
      sheetQuoted = true;
      token = "";
      continue;
    }
    if (char === "{") {
      braces++;
      token = "";
      continue;
    }
    if (char === "}") {
      braces--;
      token = "";
      continue;
    }
    if (char === "(") {
      stack.push({ name: token.toUpperCase(), argument: 0 });
      token = "";
    } else if (char === ")") {
      stack.pop();
      token = "";
    } else if (char === "," && !braces) {
      if (stack.length) stack.at(-1)!.argument++;
      token = "";
    } else if (/[A-Za-z0-9_.]/.test(char)) token += char;
    else if (!/\s/.test(char)) token = "";
  }
  return { stack, quoted: quoted || sheetQuoted };
}
export function formulaSuggestions(input: string, cursor = input.length): FormulaSuggestion[] {
  if (
    !input.startsWith("=") ||
    !Number.isInteger(cursor) ||
    cursor < 1 ||
    cursor > input.length ||
    formulaContext(input, cursor).quoted
  )
    return [];
  const prefix = /(?:^|[=+\-*/^(,;\s])([A-Za-z_][A-Za-z0-9_.]*)$/.exec(input.slice(0, cursor))?.[1];
  if (!prefix) return [];
  return FORMULA_FUNCTIONS.filter((fn) => fn.name.startsWith(prefix.toUpperCase())).map((fn) => ({
    ...fn,
    from: cursor - prefix.length,
    to: cursor,
    insert: `${fn.name}${input[cursor] === "(" ? "" : "("}`,
  }));
}
export function formulaSignature(
  input: string,
  cursor = input.length,
): (FormulaFunction & { argument: number }) | undefined {
  if (!input.startsWith("=") || cursor < 1 || cursor > input.length) return;
  const context = formulaContext(input, cursor);
  if (context.quoted) return;
  const current = context.stack.at(-1);
  const fn = current && FORMULA_FUNCTIONS.find((fn) => fn.name === current.name);
  return fn && current ? { ...fn, argument: current.argument } : undefined;
}

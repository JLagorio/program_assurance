import type { SpreadsheetFunction } from "./types";

/** Lexical editing help only; the host's engine remains responsible for formula evaluation. */
export function formulaContext(
  value: string,
  caret: number,
  functions: readonly SpreadsheetFunction[],
) {
  if (!value.startsWith("="))
    return { suggestions: [], start: caret, call: undefined, argument: 0 };
  const before = value.slice(0, caret);
  const stack: { name: string; argument: number }[] = [];
  let quote = "";
  for (let index = 1; index < before.length; index++) {
    const character = before[index]!;
    if (quote) {
      if (character === quote) {
        if (before[index + 1] === quote) index++;
        else quote = "";
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(")
      stack.push({
        name: /([A-Z_][A-Z0-9_.]*)\s*$/i.exec(before.slice(0, index))?.[1] ?? "",
        argument: 0,
      });
    if (character === ")") stack.pop();
    if ((character === "," || character === ";") && stack.length)
      stack[stack.length - 1]!.argument++;
  }
  const word = quote ? undefined : /[A-Z_][A-Z0-9_.]*$/i.exec(before)?.[0];
  const top = stack[stack.length - 1];
  return {
    suggestions: word
      ? functions
          .filter((item) => item.name.toUpperCase().startsWith(word.toUpperCase()))
          .slice(0, 8)
      : [],
    start: word ? caret - word.length : caret,
    call: top
      ? functions.find((item) => item.name.toUpperCase() === top.name.toUpperCase())
      : undefined,
    argument: top?.argument ?? 0,
  };
}

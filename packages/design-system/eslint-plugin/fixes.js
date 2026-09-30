// A fix rewrites one class inside a string's own source text and never re-serialises the string,
// so its quotes, entities and line breaks survive. A class that is not written in the source as it
// reads gets no fix rather than a wrong one. Ported from @shadcn/lint's rules/fixes.ts.
import { closureFailures } from "./classes.js";

/** An HTML entity as JSX decodes it: `&quot;`, `&#32;`, `&#x20;`. `[&>svg]` is none. */
const ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/i;

const typedStrings = new WeakMap();
/** The strings a type in the file names (`type Fill = "fill-a" | "fill-b"`), read once per file. A
    value one of them pins cannot change without its type. */
function stringsTypesName(sourceCode) {
  let found = typedStrings.get(sourceCode.ast);
  if (found) return found;
  found = new Set();
  const visit = (node) => {
    if (node.type === "TSLiteralType" && typeof node.literal?.value === "string")
      found.add(node.literal.value);
    for (const key of sourceCode.visitorKeys[node.type] ?? []) {
      const child = node[key];
      for (const item of Array.isArray(child) ? child : [child]) if (item?.type) visit(item);
    }
  };
  visit(sourceCode.ast);
  typedStrings.set(sourceCode.ast, found);
  return found;
}

/** Whether the string is a key of an object (`cn({ "fill-a": on })`) that already has `key`. */
function keyTaken(node, key) {
  const property = node.parent;
  if (property?.type !== "Property" || property.key !== node || property.computed) return false;
  return property.parent.properties.some(
    (other) =>
      other !== property &&
      other.type === "Property" &&
      !other.computed &&
      (other.key.type === "Literal" ? String(other.key.value) : other.key.name) === key,
  );
}

/**
 * The string's new source with every whole `token` in it replaced, as `{ text }`, or `{ reason }`
 * in words a message can carry ("this string is written with an escape"). Separators are kept
 * byte for byte, so `hover:fill-x` is never touched by a fix for `fill-x`.
 */
export function rewriteClass(node, sourceCode, token, replacement) {
  if (node?.type !== "Literal" || typeof node.value !== "string")
    return { reason: "it is written in a template or as a name" };
  const raw = sourceCode.getText(node);
  const quote = raw[0];
  if ((quote !== '"' && quote !== "'") || raw.length < 2 || raw.at(-1) !== quote)
    return { reason: "it is not a plain string" };
  const inner = raw.slice(1, -1);
  // A JavaScript string whose source differs from its value has an escape or a line continuation,
  // which can move a class between the two. A JSX attribute string has no escapes: its entities
  // decode in place, so a class written without one reads in the value as it does in the source.
  const jsx = node.parent?.type === "JSXAttribute";
  if (!jsx && inner !== node.value) return { reason: "this string is written with an escape" };
  if (!jsx && stringsTypesName(sourceCode).has(node.value))
    return { reason: "a type names this string" };
  const parts = inner.split(/(\s+)/);
  let replaced = false;
  for (let index = 0; index < parts.length; index += 2)
    if (parts[index] === token && !(jsx && ENTITY.test(token))) {
      parts[index] = replacement;
      replaced = true;
    }
  if (!replaced)
    return {
      reason:
        jsx && ENTITY.test(inner)
          ? "this class is written with an entity"
          : "it is not written in the source as it reads",
    };
  // A clsx key renamed onto a key the object already has would write that key twice.
  if (keyTaken(node, parts.join(""))) return { reason: "the object already has that key" };
  return { text: `${quote}${parts.join("")}${quote}` };
}

/** The string's new source text, or null when the class cannot be replaced in place. */
export const replaceClassInSource = (node, sourceCode, token, replacement) =>
  rewriteClass(node, sourceCode, token, replacement).text ?? null;

/**
 * A fix that writes `replacement` over the whole class `token`, as `{ fix }`, or `{ reason }` when
 * none is safe: the source cannot be rewritten in place, or the replacement would fail another
 * Ledger class rule (the closure check).
 */
export function classFix(node, sourceCode, token, replacement) {
  const failures = closureFailures(replacement);
  if (failures.includes("one class")) return { reason: `"${replacement}" is not one class` };
  if (failures.length)
    return {
      reason: `"${replacement}" would fail ${failures.map((name) => `ledger/${name}`).join(" and ")}`,
    };
  const { text, reason } = rewriteClass(node, sourceCode, token, replacement);
  return text === undefined ? { reason } : { fix: (fixer) => fixer.replaceText(node, text) };
}

/**
 * Editor suggestions, one per replacement that is safe to write, or undefined (never an empty
 * list, so a report carries none). `describe(replacement)` is the suggestion's label.
 */
export function suggestionsFor(node, context, token, replacements, describe) {
  const list = replacements.flatMap((replacement) => {
    const { fix } = classFix(node, context.sourceCode, token, replacement);
    return fix ? [{ desc: describe(replacement), fix }] : [];
  });
  return list.length ? list : undefined;
}

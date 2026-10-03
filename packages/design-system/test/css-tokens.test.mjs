// The kit's own stylesheets on tokens. No lint rule reads CSS, and ledger/no-style-design-value
// sends a stylesheet rule here, so this reads every src/styles/*.css the way the style rules read a
// style: no literal colour outside a var() reference and theme() (a hex, a colour function or one
// of the 148 CSS colour names); lengths only 0, 1px, a percentage, a viewport or container length
// (the window's or the container's own size, structure as in the style rules), or a token; and the
// conditions of @media and @container taken from the theme (`theme(--breakpoint-lg)`,
// `theme(--container-compact)`, `theme(--query-short-window)`), each theme() and var(--ds-…)
// naming a key the token build writes. A var()'s fallback is what the page shows where the
// variable is not set, so it is read like any value, and a number times a length is that length (`288 *
// 1px` is 288px). `@apply` writes classes no class rule reads, so the stylesheets have none. A
// literal no token of its value and role holds yet is counted in css-token-allow.json with the
// reason it stays; the counts are exact, and the list only shrinks (scripts/check-allow-lists.mjs
// holds it to its base).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { literalColour } from "../eslint-plugin/colours.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const STYLES = path.join(here, "../src/styles");
const ALLOW = path.join(here, "css-token-allow.json");
const GENERATED = path.join(here, "../src/generated");

/** The units of a length that is a design value; `%`, viewport and container units are not. */
const UNITS = "px|rem|em|ch|ex|pt|pc|cm|mm|in|q|lh|rlh|cap|ic";
const NUMBER = "-?(?:\\d*\\.)?\\d+";
/** A length with a unit that is a design value. */
const LENGTH = new RegExp(`(?<![\\w.#-])${NUMBER}(?:${UNITS})\\b`, "gi");
/** A number times a length, either way round (`288 * 1px`, `1px * 288`): that length. */
const PRODUCT = new RegExp(
  `(?<![\\w.#)-])(${NUMBER})\\s*\\*\\s*(${NUMBER})(${UNITS})\\b|(?<![\\w.#-])(${NUMBER})(${UNITS})\\s*\\*\\s*(${NUMBER})(?![\\w.(])`,
  "gi",
);
/** Zero in any unit, and the hairline either way. */
const STRUCTURAL = /^-?(?:0*\.?0+[a-z]+|1px)$/i;
/** A theme() reference, and a var() whose fallback holds no call. */
const THEME = /\btheme\([^()]*\)/g;
const VAR = /\bvar\(--[\w-]+\s*(,[^()]*)?\)/g;

/** Text with each match blanked to spaces of its length, so offsets keep their lines. */
const blank = (text, pattern) => text.replace(pattern, (whole) => whole.replace(/[^\n]/g, " "));
/**
 * A value's parts as `{ text, at }` (at, from its start): the value with every theme() and var()
 * blanked, and each var()'s fallback on its own, from the inside out (`var(--a, var(--b, 0px))`
 * gives the 0px). A fallback is what the page shows wherever the variable is not set, so it is
 * read, but as a value of its own: `var(--cols, 4) * 1px` multiplies a variable, not the 4.
 */
function partsOf(value) {
  const parts = [];
  let text = blank(value, THEME);
  for (let before = ""; before !== text;) {
    before = text;
    text = text.replace(VAR, (whole, fallback, at) => {
      if (fallback)
        parts.push({ text: fallback.slice(1), at: at + whole.length - fallback.length });
      return whole.replace(/[^\n]/g, " ");
    });
  }
  return [{ text, at: 0 }, ...parts];
}

/**
 * A stylesheet's declarations and conditions: `{ kind, text, offset }`, where kind is "value" for
 * a declaration's value (a custom property's included) and "condition" for an @media or
 * @container prelude, and offset is where the text starts in the source. Comments are blanked
 * first; a selector, another at-rule and a statement without a colon (`@import "…";`) are not
 * read.
 */
export function readCss(source) {
  const text = blank(source, /\/\*[\s\S]*?\*\//g);
  const out = [];
  let start = 0;
  for (let at = 0; at <= text.length; at += 1) {
    const char = text[at];
    if (at < text.length && char !== "{" && char !== "}" && char !== ";") continue;
    const chunk = text.slice(start, at);
    const lead = chunk.length - chunk.trimStart().length;
    const statement = chunk.trim();
    if (statement) {
      const offset = start + lead;
      if (char === "{") {
        if (/^@(media|container)\b/.test(statement))
          out.push({ kind: "condition", text: statement, offset });
      } else if (/^@apply\b/.test(statement)) {
        out.push({ kind: "apply", text: statement, offset });
      } else if (!statement.startsWith("@")) {
        const colon = statement.indexOf(":");
        if (colon > 0)
          out.push({ kind: "value", text: statement.slice(colon + 1), offset: offset + colon + 1 });
      }
    }
    start = at + 1;
  }
  return out;
}

/** What a stylesheet writes as a literal: `{ kind: "colour" | "length" | "condition", literal,
    line }`. */
export function literalsOf(source) {
  const lineAt = (offset) => source.slice(0, offset).split("\n").length;
  const found = [];
  for (const { kind, text, offset } of readCss(source)) {
    if (kind === "apply") {
      found.push({ kind: "apply", literal: text, line: lineAt(offset) });
      continue;
    }
    if (kind === "value") {
      const colour = literalColour(text);
      if (colour)
        found.push({
          kind: "colour",
          literal: colour,
          line: lineAt(offset + text.indexOf(colour)),
        });
    }
    const length = (literal, at) => {
      if (kind === "condition" || !STRUCTURAL.test(literal))
        found.push({
          kind: kind === "condition" ? "condition" : "length",
          literal,
          line: lineAt(offset + at),
        });
    };
    for (const part of partsOf(text)) {
      // A product is its length, read before its factors, so a count times a hairline is the
      // count's length and not 1px.
      let read = part.text;
      for (const match of part.text.matchAll(PRODUCT)) {
        const [whole, a, b, unit, c, unit2, d] = match;
        const value = unit ? Number(a) * Number(b) : Number(c) * Number(d);
        length(
          `${Number(value.toFixed(4))}${(unit ?? unit2).toLowerCase()}`,
          part.at + match.index,
        );
        read = `${read.slice(0, match.index)}${" ".repeat(whole.length)}${read.slice(match.index + whole.length)}`;
      }
      for (const { 0: literal, index } of read.matchAll(LENGTH)) length(literal, part.at + index);
    }
  }
  return found;
}

const files = fs
  .readdirSync(STYLES)
  .filter((file) => file.endsWith(".css"))
  .sort()
  .map((file) => ({
    key: `src/styles/${file}`,
    found: literalsOf(fs.readFileSync(path.join(STYLES, file), "utf8")),
  }));
const allow = JSON.parse(fs.readFileSync(ALLOW, "utf8"));

test("the reader finds what a stylesheet writes as a literal, and nothing a token or structure writes", () => {
  const css = `
/* A comment's #fff and 12px are prose. */
.a { color: #fff; border: 1px solid tomato; white-space: nowrap; background: url(/icons/red.svg); }
.b { padding: 12px var(--ds-space-200); margin: -1px; width: calc(100% - 2rem); height: 100dvh; }
.c { --x: var(--y, 12px); --z: rgb(0 0 0 / 0.5); inset: var(--a, var(--b, 4px)); gap: 0px; }
@container shell-panel (width < 400px) { .d { top: theme(--spacing-200); } }
@media (width >= theme(--breakpoint-lg)) and (height < 30rem) { .e { width: 50cqi; } }
@import "./x.css";
.f { width: calc(288 * 1px); height: calc(2 * 1px + var(--cols, 4) * 1px); color: var(--c, #f00); }
.g { @apply w-[288px] bg-[#f00]; top: var(--t, 0px); }
`;
  assert.deepEqual(
    literalsOf(css).map(({ kind, literal, line }) => `${line} ${kind} ${literal}`),
    [
      "3 colour #fff",
      "3 colour tomato",
      "4 length 12px",
      "4 length 2rem",
      "5 length 12px",
      "5 colour rgb(0 0 0 / 0.5)",
      "5 length 4px",
      "6 condition 400px",
      "7 condition 30rem",
      "9 length 288px",
      "9 length 2px",
      "9 colour #f00",
      "10 apply @apply w-[288px] bg-[#f00]",
    ],
  );
});

test("the kit's stylesheets write no @apply, whose classes no class rule reads", () => {
  const applied = files.flatMap(({ key, found }) =>
    found.filter(({ kind }) => kind === "apply").map(({ line }) => `${key}:${line}`),
  );
  assert.deepEqual(applied, [], "Write the rule's declarations on tokens instead of @apply.");
});

test("the kit's stylesheets write no literal colour outside var() and theme()", () => {
  const colours = files.flatMap(({ key, found }) =>
    found
      .filter(({ kind }) => kind === "colour")
      .map(({ literal, line }) => `${key}:${line} ${literal}`),
  );
  assert.deepEqual(colours, [], "Give each colour its token: var(--ds-color-…).");
});

test("the kit's stylesheets write lengths and conditions as tokens, or the literal is counted", () => {
  const problems = [];
  const counted = new Map();
  for (const { key, found } of files)
    for (const { kind, literal, line } of found) {
      if (kind === "colour" || kind === "apply") continue;
      const entry = allow[key]?.[literal];
      if (!entry)
        problems.push(
          `${key}:${line} writes ${literal}${kind === "condition" ? " in a condition" : ""}. ${
            kind === "condition"
              ? "Take it from the theme: theme(--breakpoint-…), theme(--container-…) or theme(--query-…)."
              : "Use the token of its value and role: var(--ds-space-…), var(--ds-border-width-…) or a dimension."
          }`,
        );
      counted.set(`${key} ${literal}`, (counted.get(`${key} ${literal}`) ?? 0) + 1);
    }
  for (const [key, literals] of Object.entries(allow)) {
    if (key === "about") continue;
    for (const [literal, { count }] of Object.entries(literals)) {
      const now = counted.get(`${key} ${literal}`) ?? 0;
      if (now > count)
        problems.push(`${key} writes ${literal} ${now} times; its entry counts ${count}.`);
      if (now < count)
        problems.push(
          `${key} writes ${literal} ${now} times; lower its entry from ${count}${now ? "" : " by deleting it"}: the list only shrinks.`,
        );
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("each theme() and var(--ds-…) in the kit's stylesheets names a key the token build writes", () => {
  const generated = (file) => fs.readFileSync(path.join(GENERATED, file), "utf8");
  const declared = (css) => new Set([...css.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name));
  const themeKeys = declared(generated("theme.css"));
  const variables = declared(generated("tokens.css"));
  const unknown = [];
  for (const file of fs
    .readdirSync(STYLES)
    .filter((each) => each.endsWith(".css"))
    .sort()) {
    const text = blank(fs.readFileSync(path.join(STYLES, file), "utf8"), /\/\*[\s\S]*?\*\//g);
    const lineAt = (offset) => text.slice(0, offset).split("\n").length;
    for (const { 1: name, index } of text.matchAll(/\btheme\((--[\w-]+)\)/g))
      if (!themeKeys.has(name)) unknown.push(`src/styles/${file}:${lineAt(index)} theme(${name})`);
    for (const { 1: name, index } of text.matchAll(/\bvar\((--ds-[\w-]+)/g))
      if (!variables.has(name)) unknown.push(`src/styles/${file}:${lineAt(index)} var(${name})`);
  }
  assert.deepEqual(
    unknown,
    [],
    "Name a token: theme.css holds the theme keys, tokens.css the variables.",
  );
});

test("css-token-allow.json names stylesheets that exist, positive counts and a reason each", () => {
  for (const [key, literals] of Object.entries(allow)) {
    if (key === "about") continue;
    assert.ok(fs.existsSync(path.join(here, "..", key)), `${key} exists`);
    for (const [literal, entry] of Object.entries(literals)) {
      assert.ok(Number.isInteger(entry.count) && entry.count > 0, `${key} ${literal}: count`);
      assert.ok(
        typeof entry.reason === "string" && /\.$/.test(entry.reason.trim()),
        `${key} ${literal}: a reason, one sentence or more`,
      );
    }
  }
});

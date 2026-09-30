import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The server error page renders without Ledger's stylesheet, so error-page.ts carries copies of
// token values. Each copy must stay equal to its token's resolved value in the same colour mode.
const source = readFileSync(fileURLToPath(new URL("./error-page.ts", import.meta.url)), "utf8");
const tokens = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../packages/design-system/src/generated/docs.json", import.meta.url)),
    "utf8",
  ),
) as { name: string; lightResolved?: string | null; darkResolved?: string | null }[];

/** Each colour variable the page declares and the token it copies. */
const TOKEN_OF = new Map([
  ["--surface", "elevation.surface"],
  ["--text", "color.text"],
  ["--text-subtle", "color.text.subtle"],
  ["--border", "color.border.bold"],
  ["--hovered", "color.background.neutral.subtle.hovered"],
  ["--brand", "color.background.brand.bold"],
  ["--brand-hovered", "color.background.brand.bold.hovered"],
  ["--on-brand", "color.text.inverse"],
  ["--focus", "color.border.focused"],
]);

/** The three blocks that set the colours: light, the system's dark, and a dark the reader chose. */
const BLOCKS = [
  { name: "light", mode: "light", pattern: /^\s*:root\s*\{([^}]*)\}/m },
  {
    name: "system dark",
    mode: "dark",
    pattern:
      /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-color-mode="light"\]\)\s*\{([^}]*)\}/,
  },
  { name: "chosen dark", mode: "dark", pattern: /:root\[data-color-mode="dark"\]\s*\{([^}]*)\}/ },
] as const;

/** A colour written as a value: a colour function or a hex. System colours are not token copies. */
const COLOUR_LITERAL =
  /\b(?:oklch|oklab|lch|lab|rgba?|hsla?|hwb|color-mix|color)\(|#[\da-f]{3,8}\b/gi;
const literalsIn = (text: string) => text.match(COLOUR_LITERAL)?.length ?? 0;
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

/** A property that paints: its value may only reach a colour through the variables. */
const PAINTS =
  /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|text-decoration(-color)?|caret-color|accent-color|fill|stroke|box-shadow|column-rule(-color)?)$/;
/** What a painting value may hold besides a variable: no paint, the inherited colour, a width,
    a line style, and the system colours forced-colors mode draws with. */
const NOT_A_COLOUR =
  /^(transparent|inherit|initial|unset|currentcolor|none|\d*\.?\d+(px|rem|em|%)?|thin|medium|thick|solid|dashed|dotted|double|groove|ridge|inset|outset|canvas|canvastext|buttontext|buttonface|buttonborder|field|fieldtext|highlight|highlighttext|linktext|visitedtext|activetext|graytext|mark|marktext|accentcolor|accentcolortext|selecteditem|selecteditemtext)$/i;

const blocks = BLOCKS.map(({ name, mode, pattern }) => {
  const body = source.match(pattern)?.[1] ?? "";
  const declarations = [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
    ([, variable = "", value = ""]) => ({ variable, value: normalize(value) }),
  );
  return { name, mode, body, declarations };
});

describe("error page colours", () => {
  it("writes 27 colour literals, all in its three colour blocks", () => {
    // A new literal fails here until its variable is mapped to a token in TOKEN_OF.
    expect(literalsIn(source)).toBe(27);
    expect(blocks.reduce((sum, { body }) => sum + literalsIn(body), 0)).toBe(27);
  });

  it("paints only with its variables outside the colour blocks", () => {
    // A named colour (white, black) is no literal the count sees, and it does not follow the mode.
    const style = BLOCKS.reduce(
      (text, { pattern }) => text.replace(pattern, ""),
      source.match(/<style>([\s\S]*)<\/style>/)?.[1] ?? "",
    );
    const painted = [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(
      ([, selector = "", body = ""]) =>
        [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)]
          .filter(([, property = ""]) => PAINTS.test(property))
          .flatMap(([, property = "", value = ""]) =>
            value
              .replace(/var\(--[\w-]+\)/g, "")
              .split(/\s+/)
              .filter((term) => term && !NOT_A_COLOUR.test(term))
              .map((term) => `${selector.trim()} { ${property}: ${term} }`),
          ),
    );
    expect(painted).toEqual([]);
  });

  it.each(blocks)("declares every mapped variable once in the $name block", ({ declarations }) => {
    expect(declarations.map(({ variable }) => variable).sort()).toEqual(
      [...TOKEN_OF.keys()].sort(),
    );
  });

  it.each(blocks)("copies each token's resolved value in the $name block", (block) => {
    const drift = block.declarations.flatMap(({ variable, value }) => {
      const name = TOKEN_OF.get(variable);
      const token = tokens.find((candidate) => candidate.name === name);
      const resolved = block.mode === "light" ? token?.lightResolved : token?.darkResolved;
      if (!name || !token || !resolved)
        return [
          `${variable} has no token with a resolved ${block.mode} value; map it in TOKEN_OF.`,
        ];
      return normalize(resolved) === value
        ? []
        : [
            `${variable} is ${value} but ${name} is now ${resolved} (${block.mode}). Copy the token's resolved value into the page.`,
          ];
    });
    expect(drift).toEqual([]);
  });
});

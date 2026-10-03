// The nearest Ledger token to a value written some other way (eslint-plugin/nearest.js): a stock
// Tailwind class, an arbitrary value, a numeric utility, a literal in style or a misspelt token
// class. A value is named only from the family its property's role names, never a container or
// breakpoint threshold, a layout width or a part's own size; a colour always gets the roles its hue
// plays, and one pick only within ΔE 0.02 in both modes (decision 8); a dark: colour is ranked with
// its light twin on the site. A pick is an editor suggestion that passes every rule, never a fix.
import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { classesOf, closureFailures, isKnown } from "../eslint-plugin/classes.js";
import { colourDistance } from "../eslint-plugin/colours.js";
import { lintValues } from "../eslint-plugin/data.js";
import {
  MESSAGE_LIMIT,
  SAME_COLOUR,
  alphaStateAdvice,
  bleedSteps,
  colourAdvice,
  colourOfClass,
  darkPairAdvice,
  explainUnknown,
  respelled,
  staticAdvice,
  styleColourHint,
  styleLengthHint,
  valueAdvice,
} from "../eslint-plugin/nearest.js";
import fs from "node:fs";
import { GRID_BREAKPOINTS } from "../eslint-plugin/advice.js";

const values = lintValues();
const one = (cls) => classesOf(cls)[0];
const arbitrary = (cls, siblings = []) => valueAdvice(one(cls), { arbitrary: true, siblings });
const stock = (cls, siblings = []) => valueAdvice(one(cls), { siblings });
/** A token by its class (`p-200` is space.200's through the space scale, not a class entry). */
const tokenOf = (cls) => values.tokens[values.classes[cls]];

/** The families a length's role names, by utility: nothing else may be named for it. */
const ROLE_FAMILIES = [
  [/^-?(p[xytblrse]?|gap(-[xy])?|top|inset-x|translate-y)-/, /^space\.[\w.]+$/],
  [/^text-/, /^font\.[\w.]+$/],
  [/^rounded(-t)?-/, /^radius\.[\w.]+$/],
  [/^border(-[xytblrse])?-/, /^border\.width(\.[\w.]+)?$/],
];
/** Every family no advice may name: thresholds, layout widths and a part's own size, by token or
    by class (`max-w-2xs`, `w-panel`); a size's example (`w-full`, `size-full`) and 1px's own
    spelling (`h-px`) are no token. */
const NEVER =
  /dimension\.|(?:^|[\s(])(?:(?:min-|max-)?[wh]-(?!(?:full|px)\b)[a-z0-9]|size-(?!(?:full|px)\b)[a-z0-9]|basis-)/;
/** What a width or a height is told, in a class and in style, with an example of its dimension. */
const SIZE_WORDS =
  /^A (width|height|size) is a layout part's, a part's preset or computed from its container \((w-full, a grid track|h-full, a grid track|size-full)\)\.$/;
const UTILITIES = ["p", "px", "gap", "top", "-top", "inset-x", "translate-y", "text", "rounded"];
const SIZES = ["w", "h", "min-w", "max-w", "min-h", "max-h", "size", "basis"];

test("a length is named only from the family its utility's role names", () => {
  let named = 0;
  for (let length = 1; length <= 400; length += 1)
    for (const utility of [...UTILITIES, "rounded-t", "border", "border-t"]) {
      const cls = `${utility}-[${length}px]`;
      const advice = arbitrary(cls);
      if (!advice) continue;
      const family = ROLE_FAMILIES.find(([utilities]) => utilities.test(cls))?.[1];
      assert.ok(family, cls);
      for (const words of advice.words) assert.doesNotMatch(words, NEVER, cls);
      if (!advice.replacement) continue;
      named += 1;
      // A pick has exactly the value written, on its role's scale.
      const base = one(advice.replacement).base.replace(/^-/, "");
      const space = /-(\d{3,4}|0)$/.exec(base)?.[1];
      const token = space
        ? values.tokens[`space.${space}`]
        : tokenOf(base.replace(/^rounded-[a-z]{1,2}-/, "rounded-"));
      if (/^border(-[xytblrse])?$/.test(base)) assert.equal(length, 1, cls);
      else {
        assert.ok(token, `${cls} → ${advice.replacement}`);
        assert.equal(token.px ?? token.size, length, `${cls} → ${advice.replacement}`);
      }
    }
  assert.ok(named >= 30, `only ${named} exact values were picked`);
});

test("a width or a height names no token, whatever its value", () => {
  const thresholds = Object.values(values.tokens)
    .filter((token) => /^dimension\./.test(token.family) && token.px)
    .map((token) => token.px);
  assert.ok(thresholds.includes(288), "container 2xs is 288px, the popover's width");
  for (const length of [...thresholds, 2, 16, 240, 320, 440])
    for (const utility of SIZES) {
      const advice = arbitrary(`${utility}-[${length}px]`);
      assert.equal(advice?.kind, "size", `${utility}-[${length}px]`);
      assert.equal(advice.replacement, undefined);
      for (const words of advice.words) assert.match(words, SIZE_WORDS);
      // The example is of the utility's own dimension.
      const example = { width: "w-full", height: "h-full", size: "size-full" }[advice.dimension];
      assert.ok(advice.words[0].includes(`(${example}`), `${utility}: ${advice.words[0]}`);
    }
  // 1px has its own spelling, which the lint admits: the one pick, the same 1px.
  for (const utility of ["w", "h", "size", "min-w", "min-h", "max-w", "max-h"]) {
    const advice = arbitrary(`${utility}-[1px]`);
    assert.equal(advice.replacement, `${utility}-px`, utility);
    assert.deepEqual(closureFailures(advice.replacement), [], utility);
  }
  for (const cls of ["w-4", "max-w-md", "size-4", "min-h-96", "w-1/5"])
    assert.equal(stock(cls)?.kind, "size", cls);
  for (const property of ["width", "maxWidth", "minHeight", "blockSize", "flexBasis"])
    for (const length of [...thresholds, 288, 16]) {
      const words = styleLengthHint(property, `${length}px`);
      assert.match(words, /^ A (width|height) is a layout part's/, property);
      assert.doesNotMatch(words, /token\(|dimension/, property);
    }
});

test("an exact value is one pick of that value; between two steps, both are named and none picked", () => {
  assert.equal(stock("p-4").replacement, "p-200");
  assert.equal(stock("hover:!gap-2").replacement, "hover:!gap-100");
  assert.equal(stock("-top-4").replacement, "-top-200");
  assert.equal(stock("text-xs").replacement, "font-body-small");
  assert.equal(stock("font-normal").replacement, "font-regular");
  assert.equal(stock("rounded-xl").replacement, "rounded-xxlarge");
  const between = stock("p-3.5");
  assert.equal(between.replacement, undefined);
  assert.equal(between.words[0], "Nearest: p-150 (12px) or p-200 (16px).");
  // Two tokens hold 2px, each for its own role (selected, focused): neither is picked.
  assert.equal(arbitrary("border-[2px]").replacement, undefined);
  assert.equal(staticAdvice(one("border-2"), "numericBorder").replacement, undefined);
  // The duration hint the rule hard-coded was wrong for 200ms: the nearest are these two.
  assert.equal(
    staticAdvice(one("duration-200"), "numericDuration").words[1],
    "Nearest: duration-moderate (240ms) or duration-medium (150ms).",
  );
  assert.equal(staticAdvice(one("duration-150"), "numericDuration").replacement, "duration-medium");
  // Off the scale, the scale's range; a shadow and an opacity are roles, never one by value.
  assert.match(stock("p-96").words[0], /^The space scale runs from p-025 \(2px\) to p-1000/);
  assert.equal(stock("shadow-lg").replacement, undefined);
  assert.match(stock("shadow-lg").words[0], /^Nearest: shadow-overlay \(.+\) or shadow-raised/);
  assert.doesNotMatch(stock("shadow-lg").words[0], /shadow-overflow/);
  assert.equal(arbitrary("opacity-[0.4]").replacement, undefined);
});

/** Every palette colour, and black and white, as a class of each colour prefix. */
const PALETTE = Object.keys(values.stock.palette);

test("a colour alone gets the roles its hue plays, and one pick only within ΔE 0.02 in both modes", () => {
  let listed = 0;
  for (const prefix of ["bg", "text", "border"])
    for (const colour of PALETTE) {
      const advice = stock(`${prefix}-${colour}`);
      if (!advice) continue;
      listed += 1;
      assert.equal(advice.kind, "colour");
      assert.ok(advice.options.length >= 1 && advice.options.length <= 2, colour);
      for (const option of advice.options) assert.ok(option.cls.startsWith(`${prefix}-`), colour);
      if (!advice.replacement) continue;
      const token = tokenOf(advice.replacement);
      const lab = values.stock.palette[colour];
      assert.ok(colourDistance(lab, token.oklab.light) <= SAME_COLOUR, colour);
      assert.ok(colourDistance(lab, token.oklab.dark) <= SAME_COLOUR, colour);
    }
  assert.ok(listed >= 600, `only ${listed} palette classes were named`);
  // Red is danger or a red with no meaning, each with its purpose; never one by value alone.
  const red = stock("bg-red-500");
  assert.deepEqual(
    red.options.map((option) => option.cls),
    ["bg-danger-bold", "bg-accent-red-bolder"],
  );
  assert.equal(red.replacement, undefined);
  assert.match(red.words[0], /^Red is bg-danger-bold \(a vibrant .+\) or bg-accent-red-bolder \(/);
  // A state variant asks for the state's tokens.
  assert.ok(stock("hover:bg-blue-600").options.every((option) => /-hovered$/.test(option.cls)));
  assert.deepEqual(
    stock("disabled:bg-gray-100").options.map((option) => option.cls),
    ["bg-disabled"],
  );
});

test("a dark: colour is ranked with its light twin on the site, in both modes", () => {
  const site = classesOf("bg-gray-50 dark:bg-gray-900 p-200");
  const [light, dark] = site;
  const pair = darkPairAdvice(dark, site);
  assert.equal(pair.sibling, "bg-gray-50");
  assert.equal(pair.flips, false);
  assert.deepEqual(
    pair.options.map((option) => option.cls),
    ["bg-surface-raised", "bg-surface"],
  );
  // The light class gets the same ranking, and names its twin.
  const twin = stock("bg-gray-50", site);
  assert.deepEqual(
    twin.options.map((option) => option.cls),
    ["bg-surface-raised", "bg-surface"],
  );
  assert.match(twin.words[0], /^With "dark:bg-gray-900", grey is bg-surface-raised/);
  assert.equal(light.cls, "bg-gray-50");
  // One pick only when a token is within ΔE 0.02 of the pair in both modes.
  const matched = classesOf("bg-white dark:bg-surface");
  assert.equal(staticAdvice(matched[0], "literalColour", matched).replacement, "bg-surface");
  for (const [a, z] of [
    ["gray-50", "gray-900"],
    ["zinc-100", "zinc-800"],
    ["slate-200", "slate-700"],
    ["white", "gray-950"],
    ["red-600", "red-400"],
  ]) {
    const both = classesOf(`bg-${a} dark:bg-${z}`);
    const advice = stock(both[0].cls, both);
    if (!advice.replacement) continue;
    const token = tokenOf(advice.replacement);
    assert.ok(colourDistance(values.stock.palette[a], token.oklab.light) <= SAME_COLOUR, a);
    assert.ok(colourDistance(values.stock.palette[z], token.oklab.dark) <= SAME_COLOUR, z);
  }
  // A dark: class alone is ranked by its dark value and never picked; a light token twin changes
  // with the mode by itself; two light classes on one site make no pair.
  const alone = darkPairAdvice(one("dark:bg-gray-800"), classesOf("dark:bg-gray-800"));
  assert.equal(alone.sibling, undefined);
  assert.equal(alone.single, undefined);
  const flips = classesOf("bg-surface dark:bg-gray-900");
  assert.deepEqual(darkPairAdvice(flips[1], flips).flips, true);
  const two = classesOf("bg-white bg-gray-50 dark:bg-gray-900");
  assert.equal(darkPairAdvice(two[2], two).sibling, undefined);
  // The pair keeps the light class's other variants.
  const hovered = classesOf("hover:bg-gray-100 dark:hover:bg-gray-800");
  assert.ok(
    darkPairAdvice(hovered[1], hovered).options.every((option) =>
      /^hover:bg-.+-hovered$/.test(option.cls),
    ),
  );
  assert.equal(darkPairAdvice(one("bg-gray-800"), []), undefined, "not a dark: class");
});

test("a colour in style names its roles as tokens, and a colour no role reaches nothing", () => {
  assert.equal(
    styleColourHint("color", "#e00"),
    ' Red is token("color.text.danger") (critical text, such as input field error…) or token("color.text.accent.red") (text on color.background.accent.red.subtler).',
  );
  assert.match(styleColourHint("backgroundColor", "#fff"), /token\("elevation\.surface"\)/);
  assert.equal(styleColourHint("outlineColor", "#f00"), "");
  assert.equal(styleColourHint("color", "var(--x)"), "");
  assert.equal(colourOfClass("ring-red-500"), undefined, "ring has no colour tokens");
});

test("a misspelt token class is respelled only when one class is nearest", () => {
  assert.equal(respelled("bg-surfce"), "bg-surface");
  assert.equal(respelled("text-subtel"), "text-subtle");
  assert.equal(respelled("rounded-meduim"), "rounded-medium");
  // A real Tailwind utility a few edits from a structural spelling is no slip.
  for (const cls of ["flex-grow", "cursor-cell", "leading-none", "tracking-tight", "font-mono"])
    assert.equal(respelled(cls), undefined, cls);
  // Three kit utilities one edit away: which was meant is the reader's call.
  assert.equal(respelled("stat-grid-7"), undefined);
  const typo = explainUnknown(one("hover:!bg-surfce"));
  assert.deepEqual(
    { messageId: typo.messageId, replacement: typo.replacement },
    { messageId: "typo", replacement: "hover:!bg-surface" },
  );
  // A number past a series is a value, never respelled.
  assert.deepEqual(explainUnknown(one("fill-chart-categorical-9")), {
    messageId: "series",
    data: { series: "fill-chart-categorical-*", range: "1 to 7" },
  });
  // A Ledger-shaped key that is no key names its neighbours, never one.
  const key = explainUnknown(one("p-210"));
  assert.equal(key.messageId, "spaceKey");
  assert.equal(key.replacement, undefined);
});

test("a respelling keeps its utility, never swaps an emphasis, and never touches a Tailwind value", () => {
  // Another utility is another property: a width is never a height, a border width no colour.
  for (const cls of ["w-row", "min-w-row", "max-h-row", "border-w-bold"])
    assert.equal(respelled(cls), undefined, cls);
  // Another emphasis or state of one token is a value, not a slip.
  for (const cls of ["bg-danger-bolder", "text-danger-bold", "bg-brand-subtle"])
    assert.equal(respelled(cls), undefined, cls);
  assert.equal(respelled("bg-neutral-subtle-hover"), "bg-neutral-subtle-hovered");
  // A viewport length is Tailwind's: min-h-dvw generates min-height: 100dvw.
  for (const cls of ["min-h-dvw", "min-h-svw", "min-h-lvw", "max-h-lvh", "w-screen"]) {
    assert.equal(respelled(cls), undefined, cls);
    assert.equal(explainUnknown(one(cls)), undefined, cls);
  }
  // No Tailwind utility of the stock corpus is called misspelt.
  const fixture = JSON.parse(
    fs.readFileSync(new URL("./fixtures/stock-classes.json", import.meta.url), "utf8"),
  );
  const combinations = (axes) =>
    axes.reduce(
      (heads, axis) =>
        heads.flatMap((head) => axis.map((v) => [head, v].filter(Boolean).join("-"))),
      [""],
    );
  const tailwind = [
    ...fixture.tailwind.sets.flatMap(({ axes }) => combinations(axes)),
    ...fixture.tailwind.classes,
  ];
  const misspelt = tailwind.filter(
    (cls) => !isKnown(cls) && explainUnknown(one(cls))?.messageId === "typo",
  );
  assert.deepEqual(misspelt, []);
});

test("decision 8: one pick only for a colour one role holds, and a grey only where its site names the role", () => {
  const pair = (text) => {
    const site = classesOf(text);
    return colourAdvice(site[0], site);
  };
  // The shadcn page background is the surface or a sunken region: both are named, neither picked.
  const page = pair("bg-white dark:bg-zinc-950");
  assert.equal(page.single, undefined);
  assert.deepEqual(
    page.options.map((option) => option.cls),
    ["bg-surface-sunken", "bg-surface"],
  );
  // Two roles hold the colour in both modes: both, never one.
  const card = pair("bg-white dark:bg-neutral-900");
  assert.equal(card.single, undefined);
  assert.deepEqual(
    card.options.map((option) => option.cls),
    ["bg-surface", "bg-neutral-subtle"],
  );
  // A token twin names the role.
  assert.equal(pair("bg-white dark:bg-surface-raised").single.cls, "bg-surface-raised");
  // A hue one role holds is picked.
  assert.equal(pair("bg-green-50 dark:bg-green-950").single.cls, "bg-success");
  // No grey pair of palette colours is ever one pick.
  const greys = [
    "white",
    "black",
    ...PALETTE.filter((c) => /^(gray|zinc|neutral|slate|stone)-/.test(c)),
  ];
  for (const prefix of ["bg", "text", "border"])
    for (const light of greys)
      for (const dark of greys) {
        if (light === dark) continue;
        const found = pair(`${prefix}-${light} dark:${prefix}-${dark}`);
        assert.equal(found?.single, undefined, `${prefix}-${light} dark:${prefix}-${dark}`);
      }
});

test("a pale tint written as a hex takes its hue's roles, as its palette class does", () => {
  const TINTS = {
    danger: ["#fef2f2", "#fee2e2"],
    success: ["#f0fdf4", "#dcfce7"],
    information: ["#eff6ff", "#dbeafe"],
    warning: ["#fffbeb", "#fef3c7"],
  };
  for (const [role, hexes] of Object.entries(TINTS))
    for (const hex of hexes) {
      const advice = arbitrary(`bg-[${hex}]`);
      assert.ok(
        advice.options.some((option) => option.cls.startsWith(`bg-${role}`)),
        `${hex}: ${advice.words[1]}`,
      );
      assert.match(styleColourHint("backgroundColor", hex), new RegExp(`background\\.${role}`));
    }
  // A grey as pale stays grey (slate-50, 100 and 200).
  for (const hex of ["#f8fafc", "#f1f5f9", "#e2e8f0"])
    assert.match(arbitrary(`bg-[${hex}]`).words[1], /^Grey is /, hex);
  // Ledger's own status tints are their hue's.
  for (const cls of ["bg-danger", "bg-success", "bg-information", "bg-warning"])
    assert.notEqual(colourOfClass(cls).hue, "grey", cls);
});

test("a value is named in its own terms: zero, a pill, a weight, an outline, a delay, an easing", () => {
  // Zero is space.0, one pick with no minus.
  assert.equal(arbitrary("top-[0px]").replacement, "top-0");
  assert.equal(arbitrary("-inset-[0]").replacement, "inset-0");
  // A pill's radius: 9999px is rounded-full, and from 32px up it is named, never picked.
  assert.equal(arbitrary("rounded-[9999px]").replacement, "rounded-full");
  assert.equal(arbitrary("rounded-t-[9999px]").replacement, "rounded-t-full");
  const pill = arbitrary("rounded-[100px]");
  assert.equal(pill.replacement, undefined);
  assert.match(pill.words[0], /^100px rounds its ends as a pill: rounded-full \(/);
  assert.match(styleLengthHint("borderRadius", "9999px"), /token\("radius\.full"\)/);
  assert.match(styleLengthHint("borderRadius", "50%"), /token\("radius\.full"\)/);
  // A size whose step sets a weight the size did not is named with it, never picked; a deprecated
  // step (font-heading-small, kept for one version) is never named.
  for (const advice of [stock("text-xl"), arbitrary("text-[20px]")]) {
    assert.equal(advice.replacement, undefined);
    assert.match(advice.words[0], /^20px is font-heading-page \(weight 600, /);
    assert.doesNotMatch(advice.words.join(" "), /font-heading-small/);
  }
  assert.equal(stock("text-xs").replacement, "font-body-small");
  assert.match(
    styleLengthHint("fontSize", "20px"),
    /font-heading-page, which also sets weight 600/,
  );
  // An outline's width is on the border width scale; a ring is the focus outline.
  for (const advice of [stock("outline-2"), arbitrary("outline-[2px]")])
    assert.match(
      advice.words[0],
      /^2px is border\.width\.selected .* A focus outline is outline-focused/,
    );
  assert.match(arbitrary("ring-[3px]").words[0], /outline-focused/);
  // A weight in brackets is its weight; a delay a duration token in style; an easing its curve.
  assert.equal(arbitrary("font-[500]").replacement, "font-medium");
  assert.equal(
    arbitrary("delay-[150ms]").words[0],
    'A delay has no class; in style, 150ms is token("motion.duration.medium").',
  );
  assert.match(stock("ease-in-out").words[1], /^Its Ledger curve is ease-standard\.$/);
  assert.match(stock("ease-out").words[1], /ease-enter/);
  assert.match(stock("ease-in").words[1], /ease-exit/);
  // space-x and space-y are margins on the children: the parent's space, and no class.
  const spaced = stock("space-y-4");
  assert.equal(spaced.replacement, undefined);
  assert.match(spaced.words[0], /space="space\.200" on a Stack, which spaces its children/);
  assert.match(stock("space-x-2").words[0], /space="space\.100" on an Inline/);
  // A negative offset in style keeps its sign; a negative padding has no hint.
  assert.match(styleLengthHint("top", "-8px"), /-8px is -top-100 \(space\.100\)/);
  assert.equal(styleLengthHint("paddingTop", "-8px"), "");
  // A bracketed data or ARIA attribute is its state (Base UI's data-[disabled]).
  for (const variant of ["data-[disabled]", "aria-[disabled=true]", "data-disabled", "disabled"])
    assert.deepEqual(
      stock(`${variant}:bg-gray-100`).options.map((option) => option.cls),
      ["bg-disabled"],
      variant,
    );
});

test("a palette colour with alpha is what it shows over each mode's page, and gets its hue's roles", () => {
  const scrim = colourOfClass("bg-black/50");
  assert.ok(scrim && scrim.fixed, "bg-black/50 is a colour");
  assert.notDeepEqual(scrim.light, scrim.dark, "over two pages, two colours");
  const advice = colourAdvice(one("bg-black/50"), []);
  assert.equal(advice.hue, "grey");
  assert.ok(advice.options.length >= 1);
  assert.equal(colourOfClass("ring-black/10"), undefined, "ring has no colour tokens");
});

test("alpha names only a tint quieter than the token, and a state only at its own band", () => {
  const surface = values.tokens["elevation.surface"].oklab;
  const fromPage = (lab) =>
    (colourDistance(lab.light, surface.light) + colourDistance(lab.dark, surface.dark)) / 2;
  const colours = Object.keys(values.classes).filter(
    (cls) =>
      tokenOf(cls)?.kind === "colour" &&
      !tokenOf(cls).deprecated &&
      !values.specialised.includes(cls),
  );
  for (const cls of colours)
    for (const alpha of [10, 30, 50, 60, 90]) {
      const found = alphaStateAdvice(one(`${cls}/${alpha}`));
      if (!found) continue;
      for (const tint of found.tints)
        assert.ok(
          fromPage(tokenOf(tint).oklab) < fromPage(tokenOf(cls).oklab),
          `${cls}/${alpha}: ${tint}`,
        );
      if (alpha <= 30) assert.deepEqual(found.states, [], `${cls}/${alpha}: ${found.states}`);
      // A strong alpha is a state, or a quieter tint where the token has no state.
      if (alpha >= 60 && found.states.length)
        assert.deepEqual(found.tints, [], `${cls}/${alpha}: ${found.tints}`);
    }
  // The quietest grey has no quieter tint, and a faded series is no hovered one.
  for (const cls of ["text-subtlest/60", "icon-subtlest/60", "stroke-chart-brand/10"]) {
    const found = alphaStateAdvice(one(cls));
    assert.deepEqual([...found.tints, ...found.states], [], cls);
  }
});

test("the advice's prop values are the parts' own: Grid's template keys and Bleed's steps", () => {
  // Grid's ResponsiveTemplate keys, as grid.tsx declares them.
  const grid = fs.readFileSync(new URL("../src/primitives/grid.tsx", import.meta.url), "utf8");
  const template = /type ResponsiveTemplate = \{([^}]*)\}/.exec(grid)?.[1] ?? "";
  assert.deepEqual(
    [...template.matchAll(/(\w+)\?:/g)].map(([, key]) => key),
    GRID_BREAKPOINTS,
  );
  // Bleed's tokens, as the token build writes them.
  const space = fs.readFileSync(new URL("../src/generated/space.ts", import.meta.url), "utf8");
  const bleed = JSON.parse(/export const bleedTokens = (\[[^\]]*\])/.exec(space)?.[1] ?? "[]");
  assert.ok(bleed.length > 0, "space.ts lists bleedTokens");
  assert.deepEqual(bleedSteps(), bleed);
});

/* ---------- through the rules ---------- */

const REPO = new URL("../../..", import.meta.url).pathname;
const filename = `${REPO}src/components/prototype/probe.tsx`;
const config = [
  {
    files: ["**/*.tsx"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  ...ledger.configs.recommended,
];
const verify = (source) => new Linter({ cwd: REPO }).verify(source, config, { filename });
const countByRule = (messages) => {
  const counts = {};
  for (const { ruleId } of messages) counts[ruleId] = (counts[ruleId] ?? 0) + 1;
  return counts;
};
/** Classes whose findings name a nearest token, under variants and important modifiers. */
const BATTERY = [
  "p-4",
  "md:hover:!px-6",
  "gap-2!",
  "-top-4",
  "translate-y-1",
  "text-xs",
  "font-normal",
  "rounded-xl",
  "rounded-t-lg",
  "bg-surfce",
  "focus-visible:!text-subtel",
  "p-[16px]",
  "text-[13px]",
  "rounded-[5px]",
  "border-t-[1px]",
  "duration-[150ms]",
  "duration-150",
  "border-1",
  "p-3.5",
  "bg-red-500",
  "shadow-lg",
  "w-[240px]",
];

/** The elements a class is written on, as use-primitives reads them: a plain layout element and a
    layout primitive, whose padding and gap it reports, and an element it does not read. */
const ELEMENTS = [
  (className) => `export const A = () => <div className="${className}" />;`,
  (className) =>
    `import { Box } from "@ledger/design-system"; export const A = () => <Box className="${className}" />;`,
  (className) => `export const A = () => <button className="${className}" />;`,
];
/** Whether a finding's words name `cls` as a class: quoted, in a list or at an edge. */
const names = (message, cls) =>
  new RegExp(`(?:^|[\\s"(,])${cls.replace(/[.*+?^${}()|[\]\\/!]/g, "\\$&")}(?:$|[\\s"),.])`).test(
    message,
  );

test("closure: every suggestion writes a class that passes every rule where it is written, and --fix applies none", () => {
  let offered = 0;
  for (const cls of BATTERY)
    for (const element of ELEMENTS) {
      const source = element(`${cls}\n  w-full`);
      const messages = verify(source);
      const own = messages.filter((message) => message.message.startsWith(`"${cls}"`));
      assert.equal(own.length, 1, `${cls}: ${messages.map((m) => m.message).join(" | ")}`);
      for (const { fix } of own[0].suggestions ?? []) {
        offered += 1;
        const output = source.slice(0, fix.range[0]) + fix.text + source.slice(fix.range[1]);
        const written = output.match(/className="(\S+)/)[1];
        assert.deepEqual(closureFailures(written), [], `${cls} → ${written}`);
        assert.equal(output.replace(written, cls), source, `${cls}: only the class changes`);
        const was = countByRule(messages);
        const after = verify(output);
        for (const [ruleId, count] of Object.entries(countByRule(after)))
          assert.ok(count <= (was[ruleId] ?? 0), `${cls} → ${written}: ${ruleId} reports more`);
        // In its element: no rule names the class the suggestion wrote (use-primitives would, on
        // a padding or a gap of a div or a Box, which is why none is offered there).
        for (const { ruleId, message } of after)
          assert.ok(!names(message, written), `${cls} → ${written}: ${ruleId} says ${message}`);
      }
      const fixed = new Linter({ cwd: REPO }).verifyAndFix(source, config, { filename });
      assert.equal(fixed.output, source, `${cls}: a suggestion is never a --fix`);
    }
  assert.ok(offered >= 40, `only ${offered} suggestions were offered`);
});

test("a padding or a gap use-primitives reports is named as its primitive's prop, with no class suggestion", () => {
  const cases = [
    ['<div className="p-4" />', '"p-4"', '16px is space.200: padding="space.200" on a Box.'],
    [
      'import { Stack } from "@ledger/design-system"; export const A = () => <Stack className="gap-4" />;',
      '"gap-4"',
      '16px is space.200: space="space.200".',
    ],
    [
      'import { Box } from "@ledger/design-system"; export const A = () => <Box className="p-[13px]" />;',
      '"p-[13px]"',
      'Nearest: padding="space.150" (12px) or padding="space.200" (16px).',
    ],
    [
      '<div className="flex gap-y-2" />',
      '"gap-y-2"',
      '8px is space.100: rowSpace="space.100" on an Inline.',
    ],
  ];
  for (const [code, subject, advice] of cases) {
    const source = code.startsWith("import") ? code : `export const A = () => ${code};`;
    const found = verify(source).find(({ message }) => message.startsWith(subject));
    assert.ok(found?.message.endsWith(advice), `${code}: ${found?.message}`);
    assert.equal(found.suggestions, undefined, code);
  }
  // Elsewhere, and in the kit's own source, the class is the answer.
  const text = verify('export const A = () => <button className="p-4" />;')[0];
  assert.equal(text.suggestions?.[0]?.fix.text, `"p-200"`);
});

test(`every finding's words fit in ${MESSAGE_LIMIT} characters, however long the class`, () => {
  const long = "group-hover/row:focus-visible:data-[state=open]:";
  const classes = [
    ...PALETTE.flatMap((colour) => [`${long}bg-${colour}`, `${long}border-${colour}`]),
    `${long}text-sm`,
    `${long}rounded-t-lg`,
    `${long}p-[13px]`,
    `${long}bg-[#eee]`,
  ];
  // A pair under a long chain, each side named with the whole chain.
  const chain = "group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:";
  for (const [light, dark] of [
    ["hover:bg-gray-100", "hover:bg-gray-800"],
    ["bg-white", "bg-zinc-950"],
    ["bg-red-50", "bg-red-950"],
    ["bg-white", "bg-surface"],
  ]) {
    const messages = verify(
      `export const A = () => <p className="${chain}${light} ${chain}dark:${dark}" />;`,
    );
    for (const { ruleId, message } of messages)
      if (ruleId?.startsWith("ledger/"))
        assert.ok(message.length <= MESSAGE_LIMIT, `${message.length}: ${message}`);
  }
  for (let at = 0; at < classes.length; at += 40) {
    const chunk = classes.slice(at, at + 40);
    const messages = verify(`export const A = () => <p className="${chunk.join(" ")}" />;`);
    for (const { ruleId, message } of messages)
      if (ruleId?.startsWith("ledger/") && ruleId !== "ledger/use-primitives")
        assert.ok(message.length <= MESSAGE_LIMIT, `${message.length}: ${message}`);
  }
});

// What a class is to the Ledger rules: its grammar (variants, base, important), what each class
// rule looks for, and classify, which gives every class one owner, so a rule, a fix and the
// closure check all ask the same question. The allowlist and the deprecation map come from the
// token build (src/generated/utilities.json); the kit's own @utility names and the utilities a
// leading minus negates, from what the build asked Tailwind (lint.json, through data.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintFacts, lintValues, staleness } from "./data.js";
import { declaredVariantsVersion, variantsProblem } from "./variants.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const utilitiesPath = ["../src/generated/utilities.json", "../dist/generated/utilities.json"]
  .map((relative) => path.join(here, relative))
  .find((candidate) => fs.existsSync(candidate));
if (!utilitiesPath)
  throw new Error("Ledger ESLint token metadata is missing; rebuild the package.");
const generated = JSON.parse(fs.readFileSync(utilitiesPath, "utf8"));
const tokenClasses = new Set(generated.classes);
const spaceKeys = generated.spaceKeys.join("|");
/** The keys of Ledger's space scale (`200` in `p-200`), each a `space.*` token. */
export const SPACE_KEYS = new Set(generated.spaceKeys);
export const deprecated = generated.deprecated;

/* ---------- grammar ---------- */

/** Split a class string on whitespace, then each class into variants and base (colons outside
    brackets, and outside the parentheses of Tailwind 4's variable shorthand, `bg-(image:--hero)`).
    `important` records where a `!` stood (leading, trailing or both), so a rewrite can put it
    back. */
export function classesOf(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => {
      const parts = [];
      let depth = 0,
        parens = 0,
        cur = "";
      for (const ch of cls) {
        if (ch === "[") depth++;
        if (ch === "]") depth--;
        if (depth === 0 && ch === "(") parens++;
        if (depth === 0 && ch === ")" && parens > 0) parens--;
        if (ch === ":" && depth === 0 && parens === 0) {
          parts.push(cur);
          cur = "";
        } else cur += ch;
      }
      parts.push(cur);
      const last = parts.pop();
      // Tailwind accepts both v4 trailing and legacy leading important modifiers.
      const base = last.replace(/^!|!$/g, "");
      const leading = last.startsWith("!");
      const trailing = last.length > 1 && last.endsWith("!");
      const important =
        leading && trailing ? "both" : leading ? "leading" : trailing ? "trailing" : undefined;
      return { cls, variants: parts, base, important };
    });
}

/** A class with its base replaced: `hover:!fill-chart-categorical-8` with `fill-chart-categorical-7`
    is `hover:!fill-chart-categorical-7`. The variants and every `!` keep their places. */
export function withVariants({ variants, important }, base) {
  const leading = important === "leading" || important === "both" ? "!" : "";
  const trailing = important === "trailing" || important === "both" ? "!" : "";
  return [...variants, `${leading}${base}${trailing}`].join(":");
}

/* ---------- what a non-token class may be ---------- */

/** A track that carries no length: it sizes to content or shares the free space. */
const TRACK = String.raw`(?:auto|min-content|max-content|\d+(?:\.\d+)?fr)`;
/** An arbitrary grid template made only of such tracks (`grid-cols-[auto_minmax(0,1fr)]`): the
    columns' shape, with no size, space or colour in it. A template that names a length is still
    an arbitrary value. */
const lengthFreeGridTemplate = new RegExp(
  String.raw`^grid-(cols|rows)-\[(?:subgrid|(?:${TRACK}|minmax\(0,_?${TRACK}\))(?:_(?:${TRACK}|minmax\(0,_?${TRACK}\)))*)\]$`,
);

/** Tailwind's name markers, named or not: they generate no CSS of their own, and a variant reads
    them (`group-hover:`, `peer-checked/field:`). */
export const markers = /^(group|peer)(\/[\w-]+)?$/;
/** Classes a library reads from the DOM, admitted by name; they generate no CSS. recharts reads
    the tick's font from its own tick class, to thin the ticks by the text they print
    (patterns/chart/_marks.tsx). */
export const hookClasses = new Set(["recharts-cartesian-axis-tick-value"]);

/** An integer as Tailwind reads one, which it writes back unchanged (String(Number(value)) is the
    value): no leading zero, and at most 15 digits, which a double always holds exactly. */
const INTEGER = String.raw`(?:0|[1-9]\d{0,14})`;

// Structure, not design: display, position, alignment, overflow, text flow, interaction. No colour, size, space, type, radius, shadow.
// Each spelling is a Tailwind core utility that generates CSS (test/lint-tailwind.test.mjs); the
// kit's own @utility names are not listed here, since they come from its CSS (lint.json).
export const structural = [
  /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|hidden|flow-root|table|table-(row|cell|caption|header-group|row-group|footer-group|column|column-group)|list-item)$/,
  /^(static|relative|absolute|fixed|sticky)$/,
  /^-?(inset|inset-x|inset-y|top|right|bottom|left|start|end)-(0|full|px|1\/2)$/,
  /^(inset|inset-x|inset-y|top|right|bottom|left|start|end)-auto$/, // auto has no negative
  // A part's stacking inside itself (a sticky header over its rows, a pinned cell over the middle);
  // between the page's regions a layer token stacks it (`z-chrome`, `z-overlay`, …, layer.*).
  /^z-(0|10|20|auto)$/,
  /^(isolate|isolation-auto)$/,
  /^flex-(row|col|row-reverse|col-reverse|wrap|nowrap|wrap-reverse|1|auto|initial|none)$/,
  /^(grow|grow-0|shrink|shrink-0)$/,
  /^basis-(0|full|auto|1\/2|1\/3|2\/3|1\/4|3\/4)$/,
  // Alignment: each property with the values Tailwind generates for it.
  /^items-(start|end|center|stretch|baseline|baseline-last|center-safe|end-safe)$/,
  /^self-(auto|start|end|center|stretch|baseline|baseline-last|center-safe|end-safe)$/,
  /^justify-(start|end|center|stretch|baseline|between|around|evenly|normal|center-safe|end-safe)$/,
  /^justify-items-(start|end|center|stretch|normal|center-safe|end-safe)$/,
  /^justify-self-(auto|start|end|center|stretch|center-safe|end-safe)$/,
  /^content-(start|end|center|stretch|baseline|between|around|evenly|normal|center-safe|end-safe)$/,
  /^place-items-(start|end|center|stretch|baseline|center-safe|end-safe)$/,
  /^place-content-(start|end|center|stretch|baseline|between|around|evenly|center-safe|end-safe)$/,
  /^place-self-(auto|start|end|center|stretch|center-safe|end-safe)$/,
  new RegExp(String.raw`^order-(first|last|none|${INTEGER})$`),
  new RegExp(
    String.raw`^(col|row)-(span-(${INTEGER}|full)|start-(${INTEGER}|auto)|end-(${INTEGER}|auto)|auto)$`,
  ),
  new RegExp(String.raw`^grid-(cols|rows)-([1-9]\d{0,14}|none|subgrid)$`),
  lengthFreeGridTemplate, // tracks that size to content or share the free space
  /^grid-flow-(row|col|dense|row-dense|col-dense)$/,
  /^auto-(cols|rows)-(auto|min|max|fr)$/,
  /^overflow(-x|-y)?-(auto|hidden|visible|scroll|clip)$/,
  /^overscroll(-x|-y)?-(auto|contain|none)$/,
  /^(truncate|text-ellipsis|text-clip)$/,
  /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/,
  /^(break-normal|break-words|break-all|break-keep|hyphens-(none|manual|auto))$/,
  /^wrap-(normal|break-word|anywhere)$/, // overflow-wrap; anywhere also lets a flex item shrink below its longest word
  /^text-(wrap|nowrap|balance|pretty)$/,
  new RegExp(String.raw`^line-clamp-(${INTEGER}|none)$`),
  /^text-(left|center|right|start|end|justify)$/,
  /^(uppercase|lowercase|capitalize|normal-case)$/,
  /^(underline|overline|line-through|no-underline)$/,
  new RegExp(String.raw`^underline-offset-(auto|${INTEGER})$`),
  new RegExp(String.raw`^decoration-(solid|double|dotted|dashed|wavy|auto|from-font|${INTEGER})$`),
  /^(italic|not-italic|antialiased|subpixel-antialiased)$/,
  /^(tabular-nums|proportional-nums|lining-nums|oldstyle-nums|normal-nums|slashed-zero)$/,
  /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
  /^list-(none|disc|decimal|inside|outside)$/,
  /^select-(none|text|all|auto)$/,
  /^pointer-events-(none|auto)$/,
  /^cursor-(auto|default|pointer|wait|text|move|not-allowed|grab|grabbing|col-resize|row-resize|ns-resize|ew-resize|help|progress|zoom-in|zoom-out)$/,
  /^resize(-none|-x|-y)?$/,
  /^appearance-(none|auto)$/,
  /^(outline-none|outline-hidden)$/,
  /^(sr-only|not-sr-only|invisible|visible|collapse)$/,
  /^border(-(x|y|t|b|l|r|s|e))?$/, // 1px, the default width token
  /^border-(none|solid|dashed|dotted|double|hidden|collapse|separate)$/,
  /^divide-(x|y)(-reverse)?$/,
  /^rounded(-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-none$/, // zero-radius joins, including logical edges
  /^@container(\/[\w-]+)?$/, // named containers for responsive component composition
  /^shadow-none$/,
  /^border(-(x|y|t|b|l|r|s|e))?-0$/,
  /^(m|mx|my|mt|mb|ml|mr|ms|me)-auto$/, // auto has no negative
  /^(w|h|size)-(full|auto|fit|min|max|px|0|dvh|dvw|svh|lvh|1\/2|1\/3|2\/3|1\/4|3\/4)$/,
  /^(w|h)-screen$/, // size has no screen
  /^min-(w|h)-(0|full|fit|min|max|px|screen|dvh)$/,
  /^max-(w|h)-(full|none|fit|min|max|px|screen|dvh)$/,
  /^aspect-(auto|square|video)$/,
  /^object-(contain|cover|fill|none|scale-down|center|top|bottom|left|right)$/,
  /^transition(-(none|all|colors|opacity|shadow|transform|discrete))?$/,
  /^animate-(none|spin|ping|pulse|bounce)$/,
  /^(transform|transform-none|transform-gpu|will-change-(auto|scroll|contents|transform))$/,
  /^-?rotate-(0|45|90|180)$/,
  /^-?translate-(x|y)-(0|full|1\/2)$/,
  /^scale-(0|50|75|90|95|100|105|110|125|150)$/,
  /^origin-(center|top|bottom|left|right|top-left|top-right|bottom-left|bottom-right)$/,
  /^backdrop-blur(-(none|xs|sm|md|lg|xl|2xl|3xl))?$/,
  /^blur(-(none|xs|sm|md|lg|xl|2xl|3xl))?$/,
  markers,
  /^(box-border|box-content)$/,
  /^(float|clear)-(left|right|none|start|end)$/,
  /^clear-both$/, // a float takes one side
  new RegExp(String.raw`^columns-${INTEGER}$`),
  /^scroll-(auto|smooth)$/,
  /^snap-(start|end|center|align-none|normal|always|none|x|y|both|mandatory|proximity)$/,
  /^touch-(auto|none|pan-x|pan-y|manipulation)$/,
  /^bg-(none|fixed|local|scroll|clip-border|clip-padding|clip-content|clip-text|origin-border|origin-padding|origin-content|cover|contain|auto|center|top|bottom|left|right|repeat|no-repeat|repeat-x|repeat-y)$/,
  /^ring-inset$/,
  /^forced-color-adjust-(auto|none)$/,
  /^field-sizing-(content|fixed)$/,
  /^gap(-x|-y)?-px$/, // a hairline gutter between tiles, painted with the border token
  /^table-(auto|fixed)$/, // column algorithm, not a design value
  /^opacity-(0|100)$/, // hidden and shown; the design opacities are opacity-disabled and opacity-loading
  /^(bg|border)-transparent$/, // no paint, which is structure: a placeholder border that holds layout, a row that must not light up
  /^(fill|stroke)-(none|current)$/, // SVG paint from the text colour, which is a token
  /^divide-(x|y)-0$/,
  /^grid-cols-\(--ds-grid-(base|sm|md|lg|xl)\)$/, // Grid's responsive templateColumns, read from a CSS variable
  /^h-\(--(accordion|collapsible)-panel-height\)$/, // Base UI's measured panel height, used for disclosure motion
  /^content-none$/, // removes a pseudo-element's box, such as a hit area a link in text does not take
];
/** The utilities that take a space token (`p-200`, `-mt-100`); a minus only where Tailwind negates
    the utility (lint.json's `negatable`), so there is no `-p-200`. */
export const SPACING = [
  ...["p", "px", "py", "pt", "pb", "pl", "pr", "ps", "pe"],
  ...["m", "mx", "my", "mt", "mb", "ml", "mr", "ms", "me"],
  ...["gap", "gap-x", "gap-y", "space-x", "space-y"],
  ...["w", "h", "size", "min-w", "min-h", "max-w", "max-h"],
  ...["inset", "inset-x", "inset-y", "top", "right", "bottom", "left", "start", "end"],
  ...["translate-x", "translate-y", "indent"],
  ...["scroll-m", "scroll-mx", "scroll-my", "scroll-mt", "scroll-mb"],
  ...["scroll-p", "scroll-px", "scroll-py", "scroll-pt", "scroll-pb"],
];
const sideRadius = /^rounded-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-(.+)$/;
/** What isKnown reads from lint.json on its first question: the kit's @utility names and the
    spacing pattern. */
let fromTailwind;
function tailwindFacts() {
  if (!fromTailwind) {
    const { utilities, negatable } = lintFacts();
    const negates = SPACING.filter((prefix) => negatable.includes(prefix));
    fromTailwind = {
      utilities: new Set(utilities),
      spacing: new RegExp(
        `^(?:-(?:${negates.join("|")})|(?:${SPACING.join("|")}))-(?:${spaceKeys})$`,
      ),
    };
  }
  return fromTailwind;
}
/** isKnown's answers by base: every class rule, and the class reader's judgement of every string
    a module-level map holds, asks it, and the structural list is long. */
const known = new Map();
/** A token utility, one of the kit's @utility names, a documented structural utility or a hook
    class. */
export const isKnown = (base) => {
  let answer = known.get(base);
  if (answer === undefined) {
    if (known.size > 50_000) known.clear();
    known.set(base, (answer = knownUtility(base)));
  }
  return answer;
};
function knownUtility(base) {
  const { utilities, spacing } = tailwindFacts();
  if (
    tokenClasses.has(base) ||
    utilities.has(base) ||
    hookClasses.has(base) ||
    spacing.test(base) ||
    structural.some((r) => r.test(base))
  )
    return true;
  const side = base.match(sideRadius); // rounded-s-medium: one side of a radius token, generated by Tailwind from the @theme mapping
  return Boolean(side && tokenClasses.has(`rounded-${side[2]}`));
}

/* ---------- what each class rule looks for ---------- */

/** A bracketed value: `text-[13px]`, `w-[240px]`, `[mask:none]`, `bg-brand/[0.5]`. */
export const isArbitrary = (base) =>
  /^\[|-\[|\/\[/.test(base) && !lengthFreeGridTemplate.test(base);

/** Tailwind 4's variable shorthand: a utility's value, or its opacity, read from a custom property
    (`bg-(--brand)`, `bg-(image:--hero)`, `bg-brand-bold/(--alpha)`). */
export const isVariableShorthand = (base) => /[-/]\((?:[a-z-]+:)?--[\w-]*\)/.test(base);

/** Any margin but `auto`. */
export const isMargin = (base) =>
  (/^-?(m|mx|my|mt|mb|ml|mr|ms|me)-/.test(base) && !/-auto$/.test(base)) ||
  /^-?(m|mx|my|mt|mb|ml|mr|ms|me)$/.test(base);

/** The colour utilities an opacity modifier can follow. */
const COLOUR = String.raw`(?:bg|text|icon|border|shadow|ring|outline|decoration|divide|fill|stroke|from|via|to|accent|caret)`;
/** An opacity modifier on a colour class (`bg-brand/50`, `border-t-red-500/20`), whatever the
    colour. */
const alphaModifier = new RegExp(String.raw`^${COLOUR}-[a-z0-9-]+\/\d+$`);

/** Alpha on a colour that is a token (`bg-brand-bold/50`): the one case where the modifier is all
    that is wrong with the class. */
export const isAlphaOnToken = (base) =>
  alphaModifier.test(base) && tokenClasses.has(base.replace(/\/\d+$/, ""));

/** Tailwind's own palette with an opacity modifier (`bg-red-500/50`, `text-white/70`), a border on
    one side too: a family at a shade, or black or white, as tailwindcss/theme.css 4.3 names them.
    Neither the colour nor the alpha is a token. */
const paletteAlpha = new RegExp(
  String.raw`^${COLOUR}(?:-(?:x|y|t|b|l|r|s|e))?-(?:(?:slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)|black|white)\/\d+$`,
);

/** A `dark:` variant anywhere in the chain. */
export const isDarkVariant = (variants) => variants.includes("dark");

/** What the class encodes that a token owns, as no-static-design-value's message id (fixedRadius,
    numericOpacity, numericDuration, numericBorder, ringWidth, literalColour), or undefined. */
export const staticDesignValue = (base) =>
  (/^rounded(-(t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?$/.test(base) && "fixedRadius") ||
  (/^opacity-\d+$/.test(base) && !/^opacity-(0|100)$/.test(base) && "numericOpacity") ||
  (/^(duration|delay)-\d+$/.test(base) && "numericDuration") ||
  (/^border(-(x|y|t|b|l|r|s|e))?-[1-9]\d*$/.test(base) && "numericBorder") ||
  (/^ring(-\d+)?$/.test(base) && "ringWidth") ||
  (/^((bg|text|border)-(white|black|current|inherit)|text-transparent)$/.test(base) &&
    "literalColour") ||
  undefined;

/** The deprecation entry for a class, or undefined. */
export const deprecatedClass = (base) => Object.values(deprecated).find((d) => d.class === base);

/** A Ledger token's variable as a class's value: `bg-(--ds-x)`, `bg-(color:--ds-x)`,
    `bg-[var(--ds-x)]` or `bg-[color:var(--ds-x)]`, as the prefix, the type hint and the variable. */
const TOKEN_VARIABLE =
  /^([a-z][a-z0-9-]*)-(?:\((?:([a-z-]+):)?(--ds-[\w-]+)\)|\[(?:([a-z-]+):)?var\((--ds-[\w-]+)\)\])$/;

/**
 * The token class a class that writes a Ledger token's variable stands for, when Tailwind declares
 * the same for both: `bg-(--ds-elevation-surface)`, `bg-[var(--ds-elevation-surface)]` and their
 * typed forms are `bg-surface`, and `p-(--ds-space-200)` is `p-200`. Undefined for any other class,
 * and while the lint data is stale. The token build checked every pair (lint-values.json's
 * varToClass), which is read the first time a class writes a token's variable.
 */
export function tokenClassOf(base) {
  const match = TOKEN_VARIABLE.exec(base);
  if (!match) return undefined;
  const [, prefix, shorthandHint, shorthandVariable, bracketHint, bracketVariable] = match;
  const hint = shorthandHint ?? bracketHint;
  const variable = shorthandVariable ?? bracketVariable;
  // Stale data is no guide to what the CSS generates today, so it names no class to write (the
  // stale finding says why; data.js).
  const { classes, scales, hints } = (!staleness() && lintValues()?.varToClass) || {};
  if (!classes) return undefined;
  if (hint !== undefined && !(Object.hasOwn(hints, prefix) && hints[prefix] === hint))
    return undefined;
  const key = `${prefix}-(${variable})`;
  if (Object.hasOwn(classes, key)) return classes[key];
  for (const scale of scales)
    if (variable.startsWith(scale.variable) && scale.roots.includes(prefix)) {
      const step = variable.slice(scale.variable.length);
      if (scale.keys.includes(step)) return `${prefix}-${step}`;
    }
  return undefined;
}
/** classify's data for a class that may write a token's variable: its token class, if any. */
const tokenClassData = (base) => {
  const token = base.includes("--ds-") ? tokenClassOf(base) : undefined;
  return token ? { token } : {};
};

/** The utilities a minus on which reads as pulling content outward, which Bleed does: padding and
    gap. */
const PULLS = /^(?:p[xytblrse]?|gap(?:-[xy])?)$/;

/**
 * What a class with a leading minus that Tailwind does not negate sets, as a finding names it
 * ("padding" for `-p-200`, "width and height" for `-size-full`), and its cause: `negative` for
 * padding and gap, where Bleed pulls content outward, `negativeLength` for a size. Only a utility
 * whose every value is a length (SPACING): on another, `<root>-200` may set another property than
 * the class does (`-border-default` sets a colour, not border-width). Undefined when the class
 * without its minus is not one the lint knows, or its utility is not such a one. From
 * lint-values.json's unsigned, read the first time a class needs it.
 */
function unsignedProperty(base) {
  if (!base.startsWith("-") || !isKnown(base.slice(1))) return undefined;
  const positive = base.slice(1);
  const unsigned = lintValues()?.unsigned ?? {};
  const root = Object.keys(unsigned)
    .filter((name) => positive.startsWith(`${name}-`))
    .sort((a, z) => z.length - a.length)[0];
  if (!root || !SPACING.includes(root)) return undefined;
  return { property: unsigned[root], cause: PULLS.test(root) ? "negative" : "negativeLength" };
}

/* ---------- shadcn's theme names ---------- */

/** shadcn's theme names, from lint.json, read the first time a class no rule admits asks. */
let themeNames;

/**
 * The state a variant asks a theme name's colour for, as the vocabulary's `states` key it: a
 * selected, checked or pressed item (`data-selected`, `aria-selected`, `data-[state=on]`,
 * `data-[state=checked]`, `aria-pressed`, under a group or peer too) is `selected`, and a
 * placeholder (`placeholder`, Base UI's `data-placeholder`) is `placeholder`. cmdk's
 * `data-[selected=true]` marks the highlighted item, not a selected one, so it is none.
 */
function aliasState(variant) {
  const bare = variant.replace(/^(?:group|peer)-/, "").replace(/\/[\w-]+$/, "");
  if (bare === "placeholder" || bare === "data-placeholder") return "placeholder";
  if (bare === "data-[selected=true]") return undefined;
  if (
    /^(?:data|aria)-(?:selected|checked|pressed)$/.test(bare) ||
    /^(?:data|aria)-\[(?:selected|checked|pressed)(?:=true)?\]$/.test(bare) ||
    /^data-\[state=(?:selected|checked|on)\]$/.test(bare)
  )
    return "selected";
  return undefined;
}
/** How a finding names the state it picked a class for. */
const STATE_WORDS = {
  selected: "a selected, checked or pressed item",
  placeholder: "a placeholder",
};

/**
 * What classify says of a shadcn theme name (lint.json's `aliases`, which the token build checked
 * from build/vocabulary-aliases.json), by its base: `vocabulary`, or `vocabularyAlpha` for one
 * with an opacity modifier (`bg-muted/50`), with what the name means, the Ledger classes for its
 * job as the finding words them (`use`, bare: the subject already shows the variants, which would
 * otherwise be written out once more for each class), the sentence the entry adds (`aside`) and,
 * without alpha, the classes an editor suggestion may write (`replacements`), under the class's
 * variants and `!`, each one no class rule would report; all from lint-values.json's `aliases`,
 * read only for a theme name. Undefined for any other class, and while the lint data is stale,
 * when the table may name a class the CSS no longer generates.
 */
function vocabularyOf(parsed) {
  const match = /^([a-z][a-z0-9-]*?)(?:\/(\d+))?$/.exec(parsed.base);
  if (!match) return undefined;
  themeNames ??= new Set(lintFacts().aliases ?? []);
  if (!themeNames.has(match[1]) || staleness()) return undefined;
  const entry = lintValues()?.aliases?.[match[1]];
  if (!entry) return undefined;
  const alpha = match[2] !== undefined;
  // Under a state variant the entry names a class for (`data-[state=on]:bg-accent`), that class.
  const state = parsed.variants.map(aliasState).find((found) => entry.states?.[found]);
  const classes = state ? [entry.states[state]] : entry.use;
  const use = state
    ? `${classes[0]} (${STATE_WORDS[state]})`
    : entry.use
        .map((cls, index) => (entry.for ? `${cls} (${entry.for[index]})` : cls))
        .join(" or ");
  const replacements =
    alpha || entry.suggest === false
      ? []
      : classes.map((cls) => withVariants(parsed, cls)).filter(offerReplacement);
  return {
    cause: alpha ? "vocabularyAlpha" : "vocabulary",
    data: {
      means: entry.means,
      use,
      aside: entry.aside ? ` ${entry.aside}` : "",
      replacements: Object.freeze(replacements),
    },
  };
}

/* ---------- a physical side ---------- */

/** Each class that names a physical side, with the logical class that mirrors with the page. */
const PHYSICAL_SIDES = [
  [/^text-left$/, "text-start"],
  [/^text-right$/, "text-end"],
  [/^(-?)(p|scroll-p|scroll-m)l-(.+)$/, "$1$2s-$3"],
  [/^(-?)(p|scroll-p|scroll-m)r-(.+)$/, "$1$2e-$3"],
  [/^(-?)left-(.+)$/, "$1start-$2"],
  [/^(-?)right-(.+)$/, "$1end-$2"],
  [/^border-l(-.+)?$/, "border-s$1"],
  [/^border-r(-.+)?$/, "border-e$1"],
  [/^rounded-l(-.+)?$/, "rounded-s$1"],
  [/^rounded-r(-.+)?$/, "rounded-e$1"],
  [/^rounded-tl(-.+)?$/, "rounded-ss$1"],
  [/^rounded-tr(-.+)?$/, "rounded-se$1"],
  [/^rounded-bl(-.+)?$/, "rounded-es$1"],
  [/^rounded-br(-.+)?$/, "rounded-ee$1"],
  [/^(float|clear)-left$/, "$1-start"],
  [/^(float|clear)-right$/, "$1-end"],
];
/** A half inset centres the element with a translate, the same either way the page reads. */
const CENTRES = /^-?(left|right)-1\/2$/;
/** A variant that names a physical side (`data-[side=left]:`, `data-[swipe-direction=right]:`) or
    a direction (`ltr:`, `rtl:`), under which a physical side is the meaning. */
const NAMES_A_SIDE = /\b(left|right)\b|^(ltr|rtl)$/;

/**
 * The logical class for one that names a physical side (`text-left`, `pl-200`, `right-0`,
 * `border-l`, `rounded-r-large`), which holds when the page reads right to left: under the class's
 * variants and `!`, and only when it passes every class rule itself, so `pl-4`, whose twin is a
 * stock step too, keeps its stock advice. Undefined for any other class, at a half inset, and
 * under a variant that names a side or a direction.
 */
function logicalTwin(parsed) {
  if (CENTRES.test(parsed.base) || parsed.variants.some((variant) => NAMES_A_SIDE.test(variant)))
    return undefined;
  const side = PHYSICAL_SIDES.find(([pattern]) => pattern.test(parsed.base));
  if (!side) return undefined;
  const twin = withVariants(parsed, parsed.base.replace(side[0], side[1]));
  return closureFailures(twin).length === 0 ? twin : undefined;
}

/* ---------- one owner per class ---------- */

/** What classify says of a class no rule reports. */
const PASSES = Object.freeze({});

/** The owner of a class, why, and the values its message needs, before memoising. */
function ownerOf({ cls, variants, base, important }) {
  const owned = (owner, cause, data = {}) =>
    Object.freeze({ owner, cause, data: Object.freeze({ cls, ...data }) });
  if (isDarkVariant(variants)) return owned("no-dark-variant", "dark");
  if (isMargin(base)) return owned("no-margin", "margin");
  // A variant Tailwind does not generate, or an aria- name no attribute has (variants.js); a
  // respelling it offers must pass every class rule, this one included.
  const variant =
    variants.length > 0 &&
    variantsProblem({ cls, variants }, (replacement) => !closureFailures(replacement).length);
  if (variant) return owned("no-unknown-variant", variant.cause, variant.data);
  // A Ledger token's own variable (`bg-[var(--ds-…)]`, `bg-(--ds-…)`) names its token: `token` is
  // the token class that declares the same, when there is one.
  if (isArbitrary(base)) return owned("no-arbitrary-value", "arbitrary", tokenClassData(base));
  // A structural admission reads a variable too: Grid's columns and a disclosure panel's height.
  if (isVariableShorthand(base) && !isKnown(base))
    // A Ledger token's own variable names its token, so the lint can compare it with one, typed
    // (`bg-(color:--ds-…)`) or not.
    return owned(
      "no-arbitrary-value",
      /\((?:[a-z-]+:)?--ds-/.test(base) ? "arbitrary" : "variable",
      tokenClassData(base),
    );
  if (isAlphaOnToken(base)) return owned("no-alpha-token", "alpha");
  const value = staticDesignValue(base);
  if (value) return owned("no-static-design-value", value);
  const entry = deprecatedClass(base);
  if (entry) return owned("no-deprecated-token", "deprecated", { entry });
  // A physical side, whose logical twin passes: the twin, as the one class that stands for it.
  const logical = logicalTwin({ variants, base, important });
  if (logical)
    return owned("no-non-token-class", "physical", {
      logical,
      replacements: Object.freeze([logical]),
    });
  if (!isKnown(base)) {
    // A shadcn theme name, with the Ledger classes for its job.
    const vocabulary = vocabularyOf({ variants, base, important });
    if (vocabulary) return owned("no-non-token-class", vocabulary.cause, vocabulary.data);
    if (paletteAlpha.test(base)) return owned("no-non-token-class", "paletteAlpha");
    const negative = unsignedProperty(base);
    return negative
      ? owned("no-non-token-class", negative.cause, { property: negative.property })
      : owned("no-non-token-class", "unknown");
  }
  return PASSES;
}

/** Every class classify has answered, by the class as written, while the variants a product
    declares (settings.ledger.customVariants) are those of `ownersVersion`. */
const owners = new Map();
let ownersVersion = 0;

/**
 * The one class rule that reports a class, as `{ owner, cause, data }`: the rule's name, the
 * message id it reports with, and `data` with `cls` and anything else the owner needs (a
 * deprecated token's `entry`, the `token` class a token's variable stands for, the `property` a
 * minus cannot negate); `{}` when no rule does. The owner is the first rule in this order
 * whose check the class fails, so a class is reported once, by the rule whose fix removes or
 * rewrites the whole class; a rule whose fix would leave the class broken never owns it.
 *
 * 1. no-dark-variant: the fix drops the `dark:` class, whatever it holds, a margin included. It
 *    comes first so that a `dark:` class stays reported where no-margin is off or waived (Bleed, a
 *    line disable, an allowance).
 * 2. no-margin: any other margin, at a token key, a stock key or an arbitrary value (`mt-[13px]`),
 *    under any other variant. The fix moves the space to the parent, which takes the class away.
 * 3. no-unknown-variant: a variant Tailwind does not generate (`hovr:`, `tablet:`, `@8xl:`), so
 *    the class generates no CSS whatever its base, or an `aria-` name that is no ARIA attribute;
 *    with the `replacement` it may offer (variants.js).
 * 4. no-arbitrary-value: a bracketed value, or a variable shorthand that no structural admission
 *    covers (`bg-(--brand)`); with its `token` when it writes a token's variable (tokenClassOf).
 * 5. no-alpha-token: an opacity modifier on a token colour (`bg-brand-bold/50`). On any other colour
 *    the state token would not be the whole fix, so the class goes on down the list.
 * 6. no-static-design-value, then no-deprecated-token.
 * 7. no-non-token-class, for a class that names a physical side whose logical twin passes
 *    (`text-left`, `pl-200`, `right-0`: logicalTwin), and for a class no other rule owns that is
 *    neither a token nor structure:
 *    a shadcn theme name (`text-muted-foreground`, `bg-muted/50`), with the Ledger classes for its
 *    job (vocabularyOf), a palette colour with alpha (`bg-red-500/50`), a minus on a padding, gap
 *    or size, which Tailwind does not negate (`-p-200`, `-w-full`), or any other unknown class.
 *
 * Memoised per class as written, and frozen, since every rule of every file shares the answer.
 */
export function classify(parsed) {
  // A variant a product declared since changes what a class under it is.
  if (ownersVersion !== declaredVariantsVersion()) {
    owners.clear();
    ownersVersion = declaredVariantsVersion();
  }
  let found = owners.get(parsed.cls);
  if (found) return found;
  // A long editor session writes many classes; the answers are cheap to recompute.
  if (owners.size > 50_000) owners.clear();
  owners.set(parsed.cls, (found = ownerOf(parsed)));
  return found;
}

/* ---------- closure ---------- */

/** The class rule a proposed class would fail, as a list of its one name; empty when no rule
    reports it. A string that is not exactly one class fails as such. */
export function closureFailures(cls) {
  const parsed = classesOf(cls);
  if (parsed.length !== 1 || parsed[0].cls !== cls) return ["one class"];
  const { owner } = classify(parsed[0]);
  return owner ? [owner] : [];
}

/** A fix or suggestion may write `cls` only when no Ledger class rule would report it. */
export const offerReplacement = (cls) => closureFailures(cls).length === 0;

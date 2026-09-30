// What Tailwind makes of a class's variants, from the grammar the token build asked it for
// (lint.json's `variants` and `ariaNames`, through data.js), so the lint never loads Tailwind.
// A variant Tailwind does not know generates no CSS: `hovr:`, `tablet:`, `@8xl:`, `hover/x`, a
// variant that takes no name with one. An `aria-` variant whose name is no ARIA attribute, and a
// selector or feature query that reads a CSS variable (`nth-(--n)`), generate CSS that never
// matches. A variant a product declares in its own CSS (`@custom-variant`) is known when
// settings.ledger.customVariants names it (declareVariants). classify (classes.js) asks
// variantsProblem of each class with a variant, and ledger/no-unknown-variant (variant-rules.js)
// reports what it finds.
//
// This module imports only data.js, which imports only node built-ins, so classes.js can import it
// without a cycle.
import { lintFacts } from "./data.js";

/** An arbitrary variant or value: `[&>svg]`, `[400px]`, `[sort=ascending]`. */
const isBracketed = (text) => /^\[.+\]$/.test(text);
/** A value Tailwind reads for a functional variant that accepts any name (`data-open`,
    `supports-display_grid`, `supports-a.b`), and one that takes a number (`nth-3`). Whether the
    selector a name makes is valid (`data-a.b` is not) is not judged. */
const NAME = /^[\w.%-]+$/;
const INTEGER = /^(?:0|[1-9]\d*)$/;
/** A variant's trailing `/name`: a group's, a peer's or a container's (`group-hover/row`,
    `@md/main`), a name or an arbitrary value after one slash. */
const MODIFIER = /^(.*?)(\/(?:[\w.%-]+|\[[^\]]+\]))$/;
/** A t-shirt size, which a list of sizes shows as one range: 3xs, sm, md, lg, xl, 7xl. */
const TSHIRT = /^(?:\d*x[sl]|sm|md|lg)$/;
/** More t-shirt sizes than this read better as a range than one by one. */
const RANGE = 6;
/** The functional roots whose values are breakpoints, and those whose values are container sizes. */
const BREAKPOINT_ROOTS = new Set(["max", "min"]);
const CONTAINER_ROOTS = new Set(["@", "@max", "@min"]);
/** Tailwind 4's variable shorthand as a variant's value: `nth-(--n)`, `supports-(--x)`. */
const VARIABLE = /^\(--[^()\s]*\)$/;
/** A word that reads as a size, which a finding answers with the sizes: one with a digit (2xl),
    a t-shirt size (xs, xxl) or a device (tablet). A word near a size's name reads as one too
    (sizeLike). */
const SIZE_WORD =
  /\d|^x*[sl]$|^(?:mobile|phone|tablet|laptop|desktop|widescreen|small|medium|large|narrow)$/;
/** Variants another Ledger rule forbids (no-dark-variant), which a respelling never offers. */
const FORBIDDEN = new Set(["dark"]);

/* ---------- a product's own variants ---------- */

/** The variants a product declares in its own CSS (`@custom-variant theme-x (…)`), which the
    grammar, built from the kit's CSS, cannot know: settings.ledger.customVariants, through
    settings.js. Each is known as written, alone or inside a compound. */
const declared = new Set();
/** Bumped when a name is declared, so classify (classes.js) drops the answers it gave before. */
let declaredVersion = 0;

/** Declares the variants a product's CSS adds; they are known from then on, in every file. */
export function declareVariants(names) {
  const fresh = names.filter((name) => !declared.has(name));
  if (!fresh.length) return;
  for (const name of fresh) declared.add(name);
  declaredVersion += 1;
  answers.clear();
}
/** Which declaration the answers so far reflect. */
export const declaredVariantsVersion = () => declaredVersion;

/* ---------- the grammar, read once ---------- */

let grammar;
function grammarOf() {
  if (grammar) return grammar;
  const { variants, ariaNames } = lintFacts();
  const breakpoints = new Set(Object.keys(variants.breakpoints));
  const roots = Object.entries(variants.functional)
    .map(([root, spec]) => [
      root,
      { ...spec, compound: spec.compound ? new Set(spec.compound) : undefined },
    ])
    // Longest first, so `@max` is tried before `@` and `nth-last-of-type` before `nth`.
    .sort(([a], [z]) => z.length - a.length);
  const statics = new Set(variants.static);
  const lists = roots.filter(([, spec]) => spec.compound).map(([, spec]) => spec.compound);
  // A compound wraps what it may: every compound wraps a selector (first, data-open), and one that
  // negates (not) also wraps an at-rule (sm, print, supports-grid), which no other compound does.
  // So the at-rules are the variants some compound list has and another lacks.
  const atRules = new Set(
    lists.flatMap((list) => [...list]).filter((name) => lists.some((other) => !other.has(name))),
  );
  // What a misspelt variant is measured against: a static variant, or one a compound root wraps
  // (`group-hover`). A breakpoint is among them, so a word as near to one as to a state is no
  // misspelling of the state, but it is never the spelling offered: a finding lists it instead.
  // A variant another Ledger rule forbids (dark) is not among them: its spelling would only be
  // reported again.
  const respellable = [...statics].filter((name) => !breakpoints.has(name) && !FORBIDDEN.has(name));
  const compoundRoots = roots.filter(([, spec]) => spec.compound).map(([root]) => root);
  const wrapped = roots
    .filter(([, spec]) => spec.compound)
    .flatMap(([root, spec]) =>
      respellable.filter((name) => spec.compound.has(name)).map((name) => `${root}-${name}`),
    );
  grammar = {
    statics,
    roots,
    atRules,
    // A static variant that is an at-rule around a selector (hover: `@media (hover: hover)` around
    // `&:hover`), which not- splits into two rules.
    split: new Set(variants.split ?? []),
    // A compound that wraps at-rules negates them; the others wrap selectors only.
    negates: new Set(
      roots
        .filter(
          ([, spec]) => spec.compound && [...atRules].every((name) => spec.compound.has(name)),
        )
        .map(([root]) => root),
    ),
    breakpoints: variants.breakpoints,
    containers: variants.containers,
    ariaNames: new Set(ariaNames),
    ariaList: [...ariaNames],
    breakpointNames: breakpoints,
    candidates: [...statics].filter((name) => !FORBIDDEN.has(name)).concat(wrapped),
    // A compound root a misspelling may be two edits from: `grp-hover`. Two-letter roots (`in`)
    // are too close to too much.
    compoundRoots: compoundRoots.filter((root) => root.length >= 3),
    compound: Object.fromEntries(
      roots.filter(([, spec]) => spec.compound).map(([root, spec]) => [root, spec.compound]),
    ),
  };
  return grammar;
}

/* ---------- one variant ---------- */

/** Whether a name is an ARIA attribute's, as an HTML document matches it: in any case. */
const isAriaName = (name) => grammarOf().ariaNames.has(name.toLowerCase());

/** The ARIA name an `aria-[…]` value names (`[sort=ascending]` names sort), or undefined when the
    brackets hold something else. */
const bracketedAriaName = (value) => /^\[([A-Za-z][\w-]*)(?=[\]~|^$*=])/.exec(value)?.[1];

/**
 * What a variant makes of the rule it wraps, which decides what may wrap it in turn: a `selector`
 * (first, data-open), an `atRule` (sm, print, @md), `both`, an at-rule around a selector (hover,
 * group-hover), or `either`, two rules (not-hover is `:not(:hover)` or `@media not (hover: hover)`).
 * A negating compound makes a selector or an at-rule of the same, and `both` into `either`; any
 * other compound wraps a selector or `both` and keeps it. What cannot be wrapped is undefined.
 */
const SHAPES = {
  negating: { selector: "selector", atRule: "atRule", both: "either" },
  other: { selector: "selector", both: "both" },
};

/**
 * One variant, as `{ shape }` (SHAPES) when Tailwind generates it, else as `{ cause, … }`:
 * - `variant`: Tailwind knows no such variant, so the class generates no CSS;
 * - `modifier`: a `/name` on a variant that takes none (`hover/row`);
 * - `breakpoint`: a word that reads as a size (sizeLike) where a breakpoint could stand, or a
 *   max-/min- value that is no breakpoint;
 * - `container`: an @, @max- or @min- value that is no container size;
 * - `aria`: an aria- variant whose `name` is no ARIA attribute, and `variable`: a selector or
 *   feature query whose value reads a CSS variable (`nth-(--n)`); each has a shape too, since
 *   Tailwind generates it, and never matches.
 * `within` is the set of variants a compound root (`not`, `group`, `peer`, `in`, `has`) wraps.
 */
function analyse(variant, within) {
  const g = grammarOf();
  const fail = (cause, extra) => ({ cause, ...extra });
  // An arbitrary variant: `[@media(hover:none)]` is an at-rule, `[&>svg]` a selector.
  if (isBracketed(variant)) return { shape: variant.startsWith("[@") ? "atRule" : "selector" };
  const slash = MODIFIER.exec(variant);
  const bare = slash ? slash[1] : variant;
  const modifier = slash ? slash[2] : "";
  // A product's own variant, as written: its shape is its CSS's, so it is taken as a selector,
  // which any compound wraps.
  if (declared.has(variant)) return { shape: "selector" };
  if (g.statics.has(bare)) {
    if (within && !within.has(bare)) return fail("variant");
    if (modifier) return fail("modifier");
    return { shape: g.split.has(bare) ? "both" : g.atRules.has(bare) ? "atRule" : "selector" };
  }
  for (const [root, spec] of g.roots) {
    const prefix = `${root}${spec.join}`;
    if (!bare.startsWith(prefix) || bare.length === prefix.length) continue;
    if (within && !within.has(root)) return fail("variant");
    const value = bare.slice(prefix.length);
    if (spec.compound) {
      // A compound hands its /name to what it wraps when it takes none itself: not-group-x/field.
      const inner = isBracketed(value)
        ? modifier && !spec.modifier
          ? fail("modifier")
          : analyse(value, undefined)
        : analyse(modifier && !spec.modifier ? `${value}${modifier}` : value, spec.compound);
      if (!inner.shape) return inner;
      const shape = SHAPES[g.negates.has(root) ? "negating" : "other"][inner.shape];
      return shape ? { ...inner, shape } : fail("variant");
    }
    if (modifier && !spec.modifier) return fail("modifier");
    const shape = g.atRules.has(root) ? "atRule" : "selector";
    // A CSS variable as the value: Tailwind writes it into the selector or the feature query,
    // where var() is never read.
    if (VARIABLE.test(value)) return spec.variable ? { shape, cause: "variable" } : fail("variant");
    if (isBracketed(value)) {
      if (!spec.arbitrary) return fail("variant");
      const name = root === "aria" ? bracketedAriaName(value) : undefined;
      return name && !isAriaName(name) ? { shape, cause: "aria", name } : { shape };
    }
    const known =
      spec.values.includes(value) ||
      (spec.anyName && NAME.test(value)) ||
      (spec.integer && INTEGER.test(value));
    if (known)
      return root === "aria" && !isAriaName(value)
        ? { shape, cause: "aria", name: value }
        : { shape };
    if (BREAKPOINT_ROOTS.has(root)) return fail("breakpoint");
    if (CONTAINER_ROOTS.has(root)) return fail("container");
    return fail("variant");
  }
  // A word Tailwind does not know as a variant: a size where a breakpoint could stand (at the top,
  // or under not-, which negates one; never under group-, peer-, in- or has-), else a state.
  const sizeCanStand = !within || [...g.breakpointNames].some((name) => within.has(name));
  return fail(sizeCanStand && sizeLike(bare) ? "breakpoint" : "variant");
}

/** Whether an unknown word reads as a size (SIZE_WORD), or is near a breakpoint's or a container
    size's name (pannel, smm, splt): one edit, or two from five letters. */
function sizeLike(word) {
  if (!/^[a-z0-9]+$/.test(word)) return false;
  if (SIZE_WORD.test(word)) return true;
  const g = grammarOf();
  return [...g.breakpointNames, ...Object.keys(g.containers)].some(
    (name) => editDistance(word, name) <= (Math.min(word.length, name.length) >= 5 ? 2 : 1),
  );
}

const answers = new Map();
/** What is wrong with a variant, as `{ cause, name? }` (analyse), or undefined; memoised by the
    variant as written. */
export function variantProblem(variant) {
  if (answers.has(variant)) return answers.get(variant);
  if (answers.size > 50_000) answers.clear();
  const { cause, name } = analyse(variant, undefined);
  const found = cause ? Object.freeze(name === undefined ? { cause } : { cause, name }) : undefined;
  answers.set(variant, found);
  return found;
}

/** Whether Tailwind generates CSS for a variant, as the grammar says: an `aria-` name that is no
    ARIA attribute, and a value that reads a CSS variable, still generate some. */
export const variantGenerated = (variant) => {
  const problem = variantProblem(variant);
  return !problem || problem.cause === "aria" || problem.cause === "variable";
};

/* ---------- respelling ---------- */

/** Optimal string alignment distance: an insertion, a deletion, a substitution or a swap of two
    neighbours is one edit, as in @shadcn/lint's grammar/similar.ts. */
export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/** The one candidate nearest to `word` within `budget` edits, or undefined when none is, or when
    two are equally near. A word under three letters is never respelled. */
function nearestOne(word, candidates, budget) {
  if (word.length < 3) return undefined;
  let best = Infinity;
  let found = [];
  for (const candidate of candidates) {
    if (candidate === word || Math.abs(candidate.length - word.length) > budget) continue;
    const distance = editDistance(word, candidate);
    if (distance > budget || distance > best) continue;
    if (distance < best) [best, found] = [distance, []];
    found.push(candidate);
  }
  return found.length === 1 ? found[0] : undefined;
}

/** An ARIA name one edit from `name`, or two when it has six letters or more; unique only. */
const nearestAria = (name) => nearestOne(name, grammarOf().ariaList, name.length >= 6 ? 2 : 1);

/**
 * The one spelling a misspelt variant meant, or undefined. One edit only, since variant names are
 * short and near each other (tablet is two from target); a compound root may be two edits away
 * around an exact inner variant (`grp-hover` is `group-hover`); an ARIA name as nearestAria says. A
 * breakpoint or a container size is never respelled.
 */
function respell(variant, within) {
  if (isBracketed(variant)) return undefined;
  const g = grammarOf();
  const slash = MODIFIER.exec(variant);
  const bare = slash ? slash[1] : variant;
  const modifier = slash ? slash[2] : "";
  if (g.statics.has(bare)) return undefined;
  for (const [root, spec] of g.roots) {
    const prefix = `${root}${spec.join}`;
    if (!bare.startsWith(prefix) || bare.length === prefix.length) continue;
    if (within && !within.has(root)) return undefined;
    const value = bare.slice(prefix.length);
    if (spec.compound && !isBracketed(value)) {
      if (modifier && !spec.modifier) {
        const inner = respell(`${value}${modifier}`, spec.compound);
        return inner && `${prefix}${inner}`;
      }
      const inner = respell(value, spec.compound);
      return inner && `${prefix}${inner}${modifier}`;
    }
    if (root !== "aria") return undefined;
    const name = isBracketed(value) ? bracketedAriaName(value) : value;
    const meant = name && nearestAria(name);
    return meant && `${prefix}${value.replace(name, meant)}${modifier}`;
  }
  const near = within
    ? [...g.statics].filter((name) => within.has(name) && !FORBIDDEN.has(name))
    : g.candidates;
  const meant = nearestOne(bare, near, 1);
  if (meant) return g.breakpointNames.has(meant) ? undefined : `${meant}${modifier}`;
  // A misspelt compound root around a variant written right: grp-hover, gruop-data-open.
  const split = /^([a-z]+)-(.+)$/.exec(bare);
  if (!split) return undefined;
  const root = nearestOne(
    split[1],
    g.compoundRoots.filter((name) => !within || within.has(name)),
    2,
  );
  return root && !analyse(split[2], g.compound[root]).cause
    ? `${root}-${split[2]}${modifier}`
    : undefined;
}

/* ---------- a class ---------- */

/**
 * What is wrong with a class's variants, for classify, as `{ cause, data }`: the message id
 * ledger/no-unknown-variant reports it with, and its data; undefined when every variant is fine.
 * The first variant Tailwind does not generate, or whose ARIA name is none, is `data.variant`, and
 * `data.name` its ARIA name. A `/name` on a variant that takes none is `modifier`, with the variant
 * without it as `data.without`, or `groupModifier` with `data.group`, the group variant that takes
 * it. When that variant has one spelling it meant, the cause is `respell` or `ariaRespell` and
 * `data.meant` is that spelling. When every such variant has one, and
 * `passes` says the class so respelled passes every class rule (the closure check),
 * `data.replacement` is that class, with the other variants, the base and the important modifier
 * as written. A breakpoint's data lists the container sizes and the window breakpoints, and a
 * container's the sizes.
 */
export function variantsProblem({ cls, variants }, passes) {
  let first;
  let spelled = [];
  for (const variant of variants) {
    const problem = variantProblem(variant);
    if (!problem) {
      spelled?.push(variant);
      continue;
    }
    const found = respell(variant, undefined);
    const meant = found && !variantProblem(found) ? found : undefined;
    first ??= { variant, ...problem, meant };
    spelled = meant ? spelled && [...spelled, meant] : undefined;
  }
  if (!first) return undefined;
  const { variant, name, meant } = first;
  const data = { variant, ...(name === undefined ? {} : { name }) };
  if (meant) {
    const base = cls.slice(variants.reduce((length, each) => length + each.length + 1, 0));
    const replacement = spelled && [...spelled, base].join(":");
    return {
      // A word one edit from a variant is that variant misspelt, not a size.
      cause: first.cause === "aria" ? "ariaRespell" : "respell",
      data: { ...data, meant, ...(replacement && passes(replacement) ? { replacement } : {}) },
    };
  }
  if (first.cause === "modifier") {
    // The variant without its /name, and, where a group of that name would take it, the group's.
    const [, without, name] = MODIFIER.exec(variant);
    const group = `group-${without}${name}`;
    return variantProblem(group)
      ? { cause: "modifier", data: { ...data, without } }
      : { cause: "groupModifier", data: { ...data, without, group } };
  }
  if (first.cause === "breakpoint")
    return { cause: "breakpoint", data: { ...data, ...sizeLists() } };
  if (first.cause === "container")
    return { cause: "container", data: { ...data, sizes: sizeLists().containers } };
  return { cause: first.cause, data };
}

/* ---------- the sizes a finding lists ---------- */

/** Sizes as a finding lists them, smallest first: `prefix` before each name, the t-shirt names as
    one range when there are more than RANGE of them (`@3xs 16rem to @7xl 80rem`), the rest each
    with its value, and two names at one value together (`panel or xl 80rem`). */
function listSizes(sizes, prefix) {
  const entries = Object.entries(sizes);
  const tshirt = entries.filter(([name]) => TSHIRT.test(name));
  const range = tshirt.length > RANGE;
  const shown = [];
  for (const [name, value] of range ? entries.filter(([n]) => !TSHIRT.test(n)) : entries) {
    const same = shown.find((entry) => entry.value === value);
    if (same) same.names.push(`${prefix}${name}`);
    else shown.push({ names: [`${prefix}${name}`], value });
  }
  const parts = shown.map(({ names, value }) => `${names.join(" or ")} ${value}`);
  if (range) {
    const [low, high] = [tshirt[0], tshirt.at(-1)];
    parts.unshift(`${prefix}${low[0]} ${low[1]} to ${prefix}${high[0]} ${high[1]}`);
  }
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
}

let sizeWords;
/** The container sizes and the window breakpoints, as a finding lists them. */
export function sizeLists() {
  if (!sizeWords) {
    const { containers, breakpoints } = grammarOf();
    sizeWords = { containers: listSizes(containers, "@"), breakpoints: listSizes(breakpoints, "") };
  }
  return sizeWords;
}

// What the lint knows, asked without ESLint: named exports of `@ledger/design-system/eslint` for a
// tool, an editor or an agent that wants an answer about one class, one tag or one value rather
// than a file's findings. Each function asks the plugin's own readers and keeps no logic of its
// own: classify and the advice in classes.js, nearest.js and advice.js, the part identity in
// identity.js, the tokens and their values in the lint data (data.js), what a class changes in
// categories.js and what each part sets in parts.js. test/lint-api.test.mjs holds every answer to
// the finding the lint gives the same class or tag.
//
// Every function is synchronous and pure: the same question gets the same answer, nothing is
// written, and the data is read the first time a function needs it, as a rule reads it. An answer
// is a frozen copy, so changing it changes nothing a rule or a later answer reads. Stale lint data
// is an error that names the fix, where a rule would report it as a finding (data.js), and an
// argument of the wrong kind is a TypeError that names it. The module is plain JavaScript: its
// types are the JSDoc below, and the package ships no declarations for it.
import path from "node:path";

import { marginAdvice } from "./advice.js";
import { categoriesOf } from "./categories.js";
import {
  classesOf,
  classify as ownerOf,
  closureFailures,
  deprecatedClass,
  offerReplacement,
  withVariants,
} from "./classes.js";
import { colourDistance, parseColour } from "./colours.js";
import { STALE_MESSAGE, lintValues, staleness } from "./data.js";
import { kitPartOf as kitPartOfName } from "./identity.js";
import {
  SAME_COLOUR,
  alphaStateAdvice,
  colourAdvice,
  colourOfClass,
  colourWords,
  darkPairAdvice,
  explainUnknown,
  lengthPx,
  staticAdvice,
  valueAdvice,
} from "./nearest.js";
import { partsSetting as partsSettingOf } from "./parts.js";
import { render } from "./report.js";

/* ---------- arguments and data ---------- */

/** The one class a function takes, parsed (classes.js); a TypeError for anything else. */
function oneClass(cls, name) {
  if (typeof cls !== "string") throw new TypeError(`${name} takes one class as a string.`);
  const parsed = classesOf(cls);
  if (parsed.length !== 1)
    throw new TypeError(`${name} takes one class; "${cls}" holds ${parsed.length}.`);
  return parsed[0];
}

/** A function's options: an object, or nothing; a TypeError that names them for anything else. */
function optionsOf(options, name) {
  if (options === undefined) return {};
  if (options === null || typeof options !== "object" || Array.isArray(options))
    throw new TypeError(`${name} takes its options as an object.`);
  return options;
}

/** An optional string option: undefined, or a string; a TypeError that names it otherwise. */
function stringOption(value, name, option) {
  if (value !== undefined && typeof value !== "string")
    throw new TypeError(`${name} takes \`${option}\` as a string.`);
  return value;
}

/**
 * The lint data as a rule reads it, or the stale finding's words as an error (data.js). The values
 * are read first: reading them is what finds a file another build wrote when its head does not
 * show the build (minified JSON), so the first question already gets the error, never an answer
 * from no values.
 */
function freshValues() {
  const values = lintValues();
  const stale = staleness();
  if (stale || !values)
    throw new Error(
      render(STALE_MESSAGE, {
        ...(stale ?? {
          file: "lint-values.json",
          why: "it comes from another token build than lint.json",
        }),
        note: "",
      }),
    );
  return values;
}

const frozen = (record) => Object.freeze(record);
const list = (items = []) => Object.freeze([...items]);

/* ---------- a class ---------- */

/**
 * @typedef {object} Classified
 * @property {string} cls The class as written.
 * @property {readonly string[]} variants Its variants, outermost first.
 * @property {string} base The class without its variants and `!`.
 * @property {string | undefined} rule The one Ledger rule that reports it (`ledger/no-margin`), or
 *   undefined when none does.
 * @property {string | undefined} cause Why, as classify in classes.js says it (`margin`,
 *   `arbitrary`, `unknown`, `vocabulary`…).
 * @property {Readonly<Record<string, unknown>>} data What the rule's message reads: the class, and
 *   anything else classify found (a deprecated token's `entry`, the `token` class a token's
 *   variable stands for, a variant's `meant` spelling, a shadcn name's `replacements`).
 */

/**
 * Which Ledger rule reports a class, and why: the one owner every class has (classify in
 * classes.js), so the answer is the lint's own. A class no rule reports has no `rule`.
 *
 * @example
 *   classify("mt-4"); // { cls: "mt-4", rule: "ledger/no-margin", cause: "margin", … }
 *   classify("hover:p-200").rule; // undefined: a token class
 *
 * @param {string} cls One class, with any variants (`hover:bg-surface`).
 * @returns {Readonly<Classified>}
 */
export function classify(cls) {
  const parsed = oneClass(cls, "classify");
  freshValues();
  const { owner, cause, data } = ownerOf(parsed);
  return frozen({
    cls: parsed.cls,
    variants: list(parsed.variants),
    base: parsed.base,
    rule: owner && `ledger/${owner}`,
    cause,
    // A copy, so a caller cannot change what the rules read (a deprecated token's entry).
    data: frozen(structuredClone(data ?? {})),
  });
}

/**
 * @typedef {object} Suggestion
 * @property {string} cls The class as written.
 * @property {string | undefined} rule The rule that reports it, or undefined when none does.
 * @property {string | undefined} cause The message id the rule reports it with (`stock`, `typo`,
 *   `margin`, `pair`…), which can say more than classify's cause (`unknown`).
 * @property {readonly string[]} advice The words the reader gives for it, richest first; the
 *   finding carries the first that keeps its message within 300 characters. Empty where the
 *   message's own words say what to write.
 * @property {readonly string[]} replacements Ledger classes named in its place, best first, each
 *   under the class's variants: what `--fix` or an editor suggestion writes, a colour's roles, a
 *   token's states. A value off its scale names its nearest steps in `advice` only.
 * @property {boolean} fixable `eslint --fix` writes `replacements[0]`.
 * @property {boolean} suggested An editor suggestion writes each of `replacements`; otherwise they
 *   are choices the advice names, by role.
 */

/**
 * What the lint says to write in place of a class: the advice and the classes its finding names,
 * from the readers its rule asks (nearest.js, advice.js, classes.js). The class is read by itself,
 * with `siblings`, the other classes on its element: a `dark:` colour is read with its light twin.
 * Where the element decides (a padding on a plain element or a primitive, which use-primitives
 * names as a prop; a class `ledger/no-restyle` reports on a kit part), the finding may say more.
 *
 * @example
 *   suggestClass("p-4").replacements; // ["p-200"], an editor suggestion: the same 16px
 *   suggestClass("bg-surfce").cause; // "typo", with replacements ["bg-surface"]
 *   suggestClass("dark:bg-gray-900", { siblings: "bg-white" }).cause; // "pair"
 *
 * @param {string} cls One class, with any variants.
 * @param {{ siblings?: string | readonly string[] | undefined }} [options]
 * @returns {Readonly<Suggestion>}
 */
export function suggestClass(cls, options) {
  const parsed = oneClass(cls, "suggestClass");
  const { siblings = [] } = optionsOf(options, "suggestClass");
  if (![siblings].flat().every((sibling) => typeof sibling === "string"))
    throw new TypeError("suggestClass takes `siblings` as a string of classes or a list of them.");
  freshValues();
  // The classes on the class's site, itself among them, as a rule's siblings() gives them.
  const site = classesOf([siblings].flat().join(" "));
  if (!site.some((other) => other.cls === parsed.cls)) site.push(parsed);
  const { owner, cause, data } = ownerOf(parsed);
  const answer = (id, { advice, replacements, fixable = false, suggested = false } = {}) =>
    frozen({
      cls: parsed.cls,
      rule: owner && `ledger/${owner}`,
      cause: id,
      advice: list(advice),
      // What the lint writes passes every class rule (the closure check); a choice is named as is.
      replacements: list(
        fixable || suggested ? (replacements ?? []).filter(offerReplacement) : replacements,
      ),
      fixable,
      suggested,
    });
  // Each rule's reader, asked as the rule asks it (index.js, variant-rules.js).
  switch (owner) {
    case undefined:
      return answer(undefined);
    case "no-dark-variant": {
      const found = !deprecatedClass(parsed.base) && darkPairAdvice(parsed, site);
      if (!found) return answer("dark");
      if (found.flips) return answer("flips");
      if (!found.sibling && colourOfClass(parsed.base)?.fixed === false) return answer("token");
      // The words name the one role that holds the colour in both modes, else the two nearest.
      return answer(!found.sibling ? "colour" : found.token ? "literalTwin" : "pair", {
        advice: found.words,
        replacements: found.single ? [found.single.cls] : found.options.map((option) => option.cls),
      });
    }
    case "no-margin": {
      const { negative, words } = marginAdvice(parsed.base);
      return answer(negative ? "negative" : "margin", { advice: words });
    }
    case "no-unknown-variant":
      return answer(cause, {
        replacements: data.replacement ? [data.replacement] : [],
        suggested: Boolean(data.replacement),
      });
    case "no-arbitrary-value": {
      const token = data.token && withVariants(parsed, data.token);
      if (token && !closureFailures(token).length)
        return answer("token", { replacements: [token], fixable: true });
      if (cause !== "arbitrary") return answer(cause);
      const found = valueAdvice(parsed, { siblings: site, arbitrary: true });
      return answer(cause, {
        advice: found?.words,
        replacements: found?.replacement ? [found.replacement] : [],
        suggested: Boolean(found?.replacement),
      });
    }
    case "no-alpha-token": {
      const found = alphaStateAdvice(parsed);
      return answer("alpha", {
        replacements: found
          ? found.state
            ? [found.state]
            : [...found.tints, ...found.states]
          : [],
      });
    }
    case "no-static-design-value": {
      const found = cause !== "ringWidth" ? staticAdvice(parsed, cause, site) : undefined;
      return answer(cause, {
        advice: found?.words,
        replacements: found?.replacement ? [found.replacement] : [],
        suggested: Boolean(found?.replacement),
      });
    }
    case "no-deprecated-token": {
      const to = data.entry.replacementClass && withVariants(parsed, data.entry.replacementClass);
      return to && !closureFailures(to).length
        ? answer("replace", { replacements: [to], fixable: true })
        : answer("deprecated");
    }
    case "no-non-token-class": {
      // A palette colour with alpha, an unknown class the readers can say more of, or a cause
      // classify already holds the words of (a shadcn name, a minus).
      if (cause === "paletteAlpha") {
        const colour = colourAdvice(parsed, site);
        const single = colour?.single && withVariants(parsed, colour.single.cls);
        return answer(cause, {
          advice: colour ? colourWords(colour) : [],
          replacements: single
            ? [single]
            : (colour?.options ?? []).map((option) => withVariants(parsed, option.cls)),
          suggested: Boolean(single),
        });
      }
      if (cause === "unknown") {
        const known = explainUnknown(parsed, site);
        if (!known) return answer(cause);
        return answer(known.messageId, {
          advice: known.data.advice ? [known.data.advice] : [],
          replacements: known.replacement ? [known.replacement] : [],
          suggested: Boolean(known.replacement),
        });
      }
      return answer(cause, {
        replacements: data.replacements ?? [],
        suggested: Boolean(data.replacements?.length),
      });
    }
    default:
      return answer(cause);
  }
}

/**
 * What a class changes about the element it is on (categories.js): its categories (`layout`,
 * `spacing`, `color`, `typography`, `shape`, `effects`, `motion`), its tailwind-merge group as the
 * kit's cn() merges it, what placed it, and the key the part data files it under.
 *
 * @example
 *   classCategories("hover:p-200").categories; // ["spacing"], tailwind-merge's group "p"
 *
 * @param {string} cls One class, with any variants.
 * @returns {Readonly<{ categories: readonly string[], group: string | undefined, via: string,
 *   key: string }>}
 */
export function classCategories(cls) {
  const parsed = oneClass(cls, "classCategories");
  freshValues();
  return categoriesOf(parsed.cls);
}

/**
 * Every kit part that puts a class, as written, on its element itself, and how (parts.js): the
 * primitives first, then the components; a prop's value before a part's root. Empty for a class
 * no part sets. What a part sets is `eslint-plugin/parts.json`, which `npm run build:lint` writes.
 *
 * @example
 *   partsSetting("font-body-small")[0]; // { part: "Text", via: "prop", prop: "size", … }
 *
 * @param {string} cls One class, with any variants.
 * @returns {readonly Readonly<{ part: string, kind: string, cls: string, key: string, via: string,
 *   prop?: string, value?: string, props?: readonly string[] }>[]}
 */
export function partsSetting(cls) {
  // Copies: a derived record's `props` is the part data's own list, which ledger/no-restyle reads.
  return list(
    partsSettingOf(oneClass(cls, "partsSetting").cls).map((record) =>
      frozen(structuredClone(record)),
    ),
  );
}

/* ---------- a tag ---------- */

/** What `imported` says of an import, as ESLint's scope analysis records its specifier. */
function specifierOf(local, imported) {
  if (imported === "*") return { type: "ImportNamespaceSpecifier", local: { name: local } };
  if (imported === "default") return { type: "ImportDefaultSpecifier", local: { name: local } };
  return {
    type: "ImportSpecifier",
    importKind: "value",
    imported: { type: "Identifier", name: imported ?? local },
    local: { name: local },
  };
}

/**
 * The kit part a JSX name stands for when its root is imported from `source`: the identity every
 * Ledger rule judges a tag by (identity.js), asked with plain data instead of a file's syntax
 * tree. An alias resolves to the name it imports, a namespace's root is dropped, and a name whose
 * root is no kit part, another package's part and an intrinsic element are none (""). In a product
 * the kit is exactly `@ledger/design-system`; with `kit: "self"` and the importing file's
 * absolute `filename`, a relative import inside the kit's `src` is the kit too, as the package
 * preset reads its own source.
 *
 * @example
 *   kitPartOf("Table.Cell", "@ledger/design-system"); // "Table.Cell"
 *   kitPartOf("T.Cell", "@ledger/design-system", { imported: "Table" }); // "Table.Cell"
 *   kitPartOf("L.Id", "@ledger/design-system", { imported: "*" }); // "Id"
 *   kitPartOf("Table", "@acme/ui"); // ""
 *
 * @param {string} name The name as written in JSX: `Button`, `Shell.TopNav.Item`, `T.Cell`.
 * @param {string} source The module its root is imported from.
 * @param {{ imported?: string | undefined, kit?: "self" | undefined,
 *   filename?: string | undefined }} [options]
 *   `imported` is the name the import names: the root of `name` when omitted, another name for an
 *   alias (`import { Table as T }`), `"*"` for a namespace and `"default"` for a default import.
 * @returns {string} The part's canonical dotted name, or "".
 */
export function kitPartOf(name, source, options) {
  if (typeof name !== "string" || typeof source !== "string")
    throw new TypeError("kitPartOf takes a name and an import source, as strings.");
  const { imported, kit, filename } = optionsOf(options, "kitPartOf");
  stringOption(imported, "kitPartOf", "imported");
  stringOption(filename, "kitPartOf", "filename");
  if (kit !== undefined && kit !== "self")
    throw new TypeError('kitPartOf takes `kit` as "self", or no `kit` for a product file.');
  if (kit === "self" && !(filename && path.isAbsolute(filename)))
    throw new TypeError(
      'kitPartOf takes `kit: "self"` with the importing file\'s absolute `filename`.',
    );
  const segments = name.split(".");
  if (!segments.every((segment) => /^[A-Za-z_$][\w$]*$/.test(segment))) return "";
  const [local, ...members] = segments;
  // The import as ESLint's scope analysis describes it, which identity.js reads: one module scope
  // with one variable, defined by an import binding.
  const scope = { type: "module", set: new Map(), upper: null };
  const declaration = {
    type: "ImportDeclaration",
    importKind: "value",
    source: { type: "Literal", value: source },
  };
  const definition = {
    type: "ImportBinding",
    name: { type: "Identifier", name: local },
    node: specifierOf(local, imported),
    parent: declaration,
  };
  scope.set.set(local, { name: local, scope, defs: [definition], references: [] });
  const node = members.reduce(
    (object, member) => ({
      type: "JSXMemberExpression",
      object,
      property: { type: "JSXIdentifier", name: member },
    }),
    { type: "JSXIdentifier", name: local },
  );
  return kitPartOfName(
    {
      filename: filename ?? "<input>",
      settings: kit ? { ledger: { kit } } : {},
      sourceCode: { getScope: () => scope },
    },
    node,
  );
}

/* ---------- tokens ---------- */

/**
 * @typedef {object} Token
 * @property {string} name The token's name (`space.200`).
 * @property {string} kind `length`, `colour`, `type`, `weight`, `family`, `duration`, `easing`,
 *   `number` or `shadow`.
 * @property {string} family Its family (`space`, `color.background`, `dimension.part`).
 * @property {string} role The role a finding names it by (`space`, `background`, `icon-size`).
 * @property {string} [class] Its token class, when one class writes it alone (`bg-surface`).
 * @property {string} [short] Its purpose, shortened.
 * @property {number} [px] A length's value, in px.
 * @property {string} [css] A length in a unit with no px value, as written (`20ch`, `90vw`).
 * @property {number} [ms] A duration's value.
 * @property {number} [size] A type token's font size, in px, with `lineHeight` and `weight`.
 * @property {number} [weight] A weight's value.
 * @property {number | string} [value] A number's or an easing's value.
 * @property {{ light: number[], dark: number[] }} [oklab] A colour in each mode, in OKLab, with
 *   `alpha` by mode when it is not opaque.
 * @property {boolean} [deprecated] A token that goes in the next version.
 * @property {readonly ("light" | "dark")[]} [modes] For tokensOfValue's colour: the modes in which
 *   the token is that colour.
 */

/** A token's record as the lint data holds it, with its name, copied so a caller cannot change
    what the rules read. */
const tokenRecord = (name, token, extra = {}) =>
  frozen({ name, ...structuredClone(token), ...extra });

/**
 * A token's record from the lint data: its kind, family and role, its token class, its purpose
 * and its value (`px`, `ms`, `size`, `weight`, `value` or `oklab` by kind); undefined for a name
 * the kit does not have.
 *
 * @example
 *   tokenValue("space.200"); // { name: "space.200", kind: "length", px: 16, role: "space", … }
 *
 * @param {string} name A token's dotted name.
 * @returns {Readonly<Token> | undefined}
 */
export function tokenValue(name) {
  if (typeof name !== "string") throw new TypeError("tokenValue takes a token's name as a string.");
  const { tokens } = freshValues();
  return Object.hasOwn(tokens, name) ? tokenRecord(name, tokens[name]) : undefined;
}

/** A duration as a CSS time: `150ms`, `0.15s`. */
const DURATION = /^(-?(?:\d*\.)?\d+)(ms|s)$/;
/** A length in em, which a letter spacing is written in. */
const EM = /^(-?(?:\d*\.)?\d+)em$/;
/** A number with no unit. */
const NUMBER = /^-?(?:\d*\.)?\d+$/;

/**
 * Every token that holds a value, of every role, in the lint data's order, with no deprecated
 * one: "which token is 16px?". A length (`16px`, `1rem`) matches a length token's px and a type
 * token's font size, one in em (`-0.004em`) a letter spacing, and one in ch or vw (`20ch`) a
 * part's size written the same; a duration (`150ms`, `0.15s`) a duration; a plain number (`0.4`,
 * `500`, or a number value) any of those, a weight and a number token (opacity, layer); a colour
 * literal (a hex, a colour function, a CSS name), read as opaque, an opaque colour token within
 * ΔE 0.02 of it, in either mode or in `mode`; and any other string an easing written the same. A
 * shadow or a font family matches nothing. `kind` and `role` narrow the answer; one the lint data
 * does not hold is a TypeError that lists those it does.
 *
 * @example
 *   tokensOfValue("16px").map((token) => `${token.name} (${token.role})`);
 *   // ["dimension.icon.medium (icon-size)", "space.200 (space)"]
 *   tokensOfValue("#fff", { mode: "light", role: "surface" })[0].name; // "elevation.surface"
 *
 * @param {string | number} value The value to look up.
 * @param {{ kind?: string | undefined, role?: string | undefined,
 *   mode?: "light" | "dark" | undefined }} [options]
 * @returns {readonly Readonly<Token>[]}
 */
export function tokensOfValue(value, options) {
  if (!(typeof value === "string" || Number.isFinite(value)))
    throw new TypeError("tokensOfValue takes a value as a string or a finite number.");
  const { kind, role, mode } = optionsOf(options, "tokensOfValue");
  if (mode !== undefined && mode !== "light" && mode !== "dark")
    throw new TypeError('tokensOfValue takes `mode` as "light" or "dark".');
  const { tokens } = freshValues();
  // A kind or a role the data does not hold would match nothing: a misspelling, said as one.
  for (const [option, given] of [
    ["kind", kind],
    ["role", role],
  ]) {
    if (given === undefined) continue;
    const known = [...new Set(Object.values(tokens).map((token) => token[option]))];
    if (!known.includes(given))
      throw new TypeError(
        `tokensOfValue takes \`${option}\` as one of the lint data's: ${known.join(", ")}.`,
      );
  }
  const text = String(value).trim();
  const number = typeof value === "number" || NUMBER.test(text) ? Number(text) : undefined;
  const duration = DURATION.exec(text);
  const ms = duration ? Number(duration[1]) * (duration[2] === "s" ? 1000 : 1) : undefined;
  const em = EM.exec(text) ? Number.parseFloat(text) : undefined;
  const px = number === undefined && !duration && em === undefined ? lengthPx(text) : number;
  const colour = [number, ms, em, px].every((read) => read === undefined)
    ? parseColour(text)
    : null;
  const modes = mode ? [mode] : ["light", "dark"];
  const found = [];
  for (const [name, token] of Object.entries(tokens)) {
    if (token.deprecated || (kind && token.kind !== kind) || (role && token.role !== role))
      continue;
    if (colour) {
      if (token.kind !== "colour") continue;
      const same = modes.filter(
        (each) =>
          (token.alpha?.[each] ?? 1) === 1 &&
          colourDistance(token.oklab[each], colour) <= SAME_COLOUR,
      );
      if (same.length) found.push(tokenRecord(name, token, { modes: list(same) }));
      continue;
    }
    // Each kind by the value it holds: a type token by its size, never by the weight or line
    // height that come with it.
    const holds = {
      length:
        (px !== undefined && token.px === px) ||
        (em !== undefined && token.em === em) ||
        (token.css !== undefined && token.css === text),
      type: px !== undefined && token.size === px,
      duration: (ms ?? number) !== undefined && token.ms === (ms ?? number),
      weight: number !== undefined && token.weight === number,
      number: number !== undefined && token.value === number,
      easing: token.value === text,
    }[token.kind];
    if (holds) found.push(tokenRecord(name, token));
  }
  return list(found);
}

/**
 * The token a class writes, by its base: `bg-surface` is `elevation.surface`, `hover:font-body`
 * is `font.body`, and a step of a token scale is its token (`p-200` is `space.200`); undefined for
 * a class that writes no token.
 *
 * @example
 *   tokenOfClass("gap-150"); // "space.150"
 *
 * @param {string} cls One class, with any variants.
 * @returns {string | undefined} The token's dotted name.
 */
export function tokenOfClass(cls) {
  const { base } = oneClass(cls, "tokenOfClass");
  const { classes, tokens, varToClass } = freshValues();
  if (Object.hasOwn(classes, base)) return classes[base];
  // A scale the token build checked (lint-values.json's varToClass, which tokenClassOf in
  // classes.js reads the other way): its roots, its keys and the variable each key writes.
  for (const scale of varToClass.scales) {
    const root = scale.roots
      .filter((candidate) => base.startsWith(`${candidate}-`))
      .sort((a, z) => z.length - a.length)[0];
    const key = root && base.slice(root.length + 1);
    if (!key || !scale.keys.includes(key)) continue;
    const variable = `${scale.variable}${key}`.replace(/^--ds-/, "");
    return Object.keys(tokens).find((name) => name.replaceAll(".", "-") === variable);
  }
  return undefined;
}

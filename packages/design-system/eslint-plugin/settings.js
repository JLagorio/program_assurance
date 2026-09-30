// `settings.ledger`, as every rule reads it. A key the lint does not take, or a value of the wrong
// type, is said once on stderr and ignored; a string is never spread into characters. The class
// reader (class-sites.js) takes its helper names from here, identity.js reads `kit` itself, and the
// variants a product declares go to the variant grammar (variants.js) as the settings are read.
import { declareVariants } from "./variants.js";
import { warnOnce } from "./warn.js";

/** The keys `settings.ledger` takes. report.js reads `note`. */
export const SETTINGS = ["classFunctions", "variantFunctions", "customVariants", "note", "kit"];
const defaults = { classFunctions: [], variantFunctions: [], customVariants: [] };
const settingsRead = new WeakMap();

/** A name a call can have: the rules match a helper by its callee's own name, not `styles.cn`. */
const FUNCTION_NAME = /^[A-Za-z_$][\w$]*$/;

/** The known key a mistyped one was meant to be, by case or by at most two edits (one when either
    key is four letters or fewer, so a short key is not taken for any other). */
function nearestSetting(key) {
  const distance = (a, b) => {
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++)
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      previous = current;
    }
    return previous[b.length];
  };
  return SETTINGS.find(
    (known) =>
      known.toLowerCase() === key.toLowerCase() ||
      distance(known, key) <= (Math.min(known.length, key.length) <= 4 ? 1 : 2),
  );
}

/** The helper names a settings key lists: a string is one name, an array its names. A value of
    another type, or a name no call can match, is said once and ignored. */
function helperNames(given, key) {
  const helpers = given[key];
  const valid =
    typeof helpers === "string" ||
    (Array.isArray(helpers) && helpers.every((name) => typeof name === "string"));
  if (helpers !== undefined && !valid)
    warnOnce(
      `settings.${key}`,
      `settings.ledger.${key} must be a string or an array of strings; it is ignored.`,
    );
  const names = !valid ? [] : typeof helpers === "string" ? [helpers] : helpers;
  for (const name of names)
    if (!FUNCTION_NAME.test(name))
      warnOnce(
        `settings.${key}.${name}`,
        `settings.ledger.${key} has "${name}", which no call can match: name the helper as it is called, without an object or spaces. It is ignored.`,
      );
  return names.filter((name) => FUNCTION_NAME.test(name));
}

/** A variant as a class writes it before its colon: `theme-x`, `hocus`, `@print`. */
const VARIANT_NAME = /^[A-Za-z0-9@*][\w@*-]*$/;

/** The variants a product declares in its own CSS with `@custom-variant`: a string is one name, an
    array its names. A value of another type, or a name no class can carry, is said once and
    ignored. */
function variantNames(given) {
  const names = given.customVariants;
  const valid =
    typeof names === "string" ||
    (Array.isArray(names) && names.every((name) => typeof name === "string"));
  if (names !== undefined && !valid)
    warnOnce(
      "settings.customVariants",
      "settings.ledger.customVariants must be a string or an array of strings; it is ignored.",
    );
  const list = !valid ? [] : typeof names === "string" ? [names] : names;
  for (const name of list)
    if (!VARIANT_NAME.test(name))
      warnOnce(
        `settings.customVariants.${name}`,
        `settings.ledger.customVariants has "${name}", which no class can carry: name the variant as a class writes it before its colon, without a /name, brackets or spaces. It is ignored.`,
      );
  return list.filter((name) => VARIANT_NAME.test(name));
}

/**
 * `settings.ledger`, read once per settings object: the helper names a consumer adds, which the
 * class reader reads beside its own (`classFunctions` clsx-style, `variantFunctions` as a cva or tv
 * config), and the variants its CSS declares (`customVariants`), which the variant grammar then
 * knows, in every file of the run. A key it does not take, or a value of the wrong type, is said
 * once on stderr.
 */
export function settings(context) {
  const given = context?.settings?.ledger;
  if (given === undefined) return defaults;
  if (given === null || typeof given !== "object" || Array.isArray(given)) {
    warnOnce("settings", "settings.ledger must be an object; it is ignored.");
    return defaults;
  }
  if (settingsRead.has(given)) return settingsRead.get(given);
  for (const key of Object.keys(given))
    if (!SETTINGS.includes(key)) {
      const near = nearestSetting(key);
      warnOnce(
        `settings.${key}`,
        `settings.ledger has no key "${key}"${near ? `. Did you mean "${near}"?` : `; it takes ${SETTINGS.join(", ")}.`}`,
      );
    }
  const classFunctions = helperNames(given, "classFunctions");
  const variantFunctions = helperNames(given, "variantFunctions");
  // identity.js reads `kit` itself; any value but "self" leaves the file a product's.
  if (given.kit !== undefined && given.kit !== "self")
    warnOnce(
      "settings.kit",
      'settings.ledger.kit takes "self", which the package preset sets for the kit\'s own source; it is ignored.',
    );
  const customVariants = variantNames(given);
  declareVariants(customVariants);
  const read = { classFunctions, variantFunctions, customVariants };
  settingsRead.set(given, read);
  return read;
}

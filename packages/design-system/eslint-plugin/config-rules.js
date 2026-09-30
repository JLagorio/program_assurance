// Comments that change what the ledger rules see. A configuration comment (`/* eslint ledger/…:
// "off" */`) turns a rule off or down for a whole file where no list counts it, and a block
// disable turns it off for the rest of the file, so both are always reported. A line or next-line
// disable keeps one site out of a rule and says why after ` -- `; the reasoned ones are counted
// outside the lint and may only shrink. A disable that names no rule turns every rule off, so it
// is reported where it can be and counted everywhere. Comments are read as ESLint reads them, so a
// key written with an escape or a list of only commas is no way around. Comments about other
// plugins' rules are left alone.
import { defineRules } from "./report.js";

const LABEL = /^(eslint(?:-disable(?:-next-line|-line)?|-enable|-env)?|exported|globals?)(?:\s|$)/u;

/**
 * An ESLint directive comment, read as ESLint reads it: the reason after ` -- ` (two or more dashes
 * between spaces) is split off, and a line comment carries only the -line and -next-line disables.
 * Returns the configuration (`eslint`) and disable labels with the text after the label; any other
 * comment, enables and globals included, is `undefined`.
 */
export function readDirective(comment) {
  if (comment.type !== "Line" && comment.type !== "Block") return undefined;
  const separator = /\s-{2,}\s/u.exec(comment.value);
  const text = (separator ? comment.value.slice(0, separator.index) : comment.value).trim();
  const reason = separator ? comment.value.slice(separator.index + separator[0].length).trim() : "";
  const label = LABEL.exec(text)?.[1];
  if (label !== "eslint" && !label?.startsWith("eslint-disable")) return undefined;
  if (comment.type === "Line" && !/^eslint-disable-(next-)?line$/.test(label)) return undefined;
  return { label, value: text.slice(label.length).trim(), reason };
}

/**
 * The rule names a disable lists, read as ESLint reads them: split on commas, trimmed, one pair of
 * matching quotes taken off, and empty names dropped. None means every rule.
 */
export function ruleNames(directive) {
  return [
    ...new Set(
      directive.value
        .split(",")
        .map((name) => name.trim().replace(/^(["']?)(.*)\1$/s, "$2"))
        .filter(Boolean),
    ),
  ];
}

/**
 * Whether a disable names no rule, bare or with a list of only commas and empty quotes
 * (`// eslint-disable-next-line ,`), so it turns every rule off: the ledger rules, and the one
 * that would report it.
 */
export const namesNoRule = (directive) =>
  directive.label !== "eslint" && ruleNames(directive).length === 0;

// A configuration comment's keys are decoded before ESLint looks a rule up (levn, then JSON):
// `"ledger/no-margin"`, `"ledger\/no-margin"` and `"ledger/no\-margin"` all name no-margin.
const CONTROL = { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
const decoded = (text) =>
  text.replace(/\\(u[\da-fA-F]{4}|[^u])/g, (_, escape) =>
    escape.length === 5
      ? String.fromCharCode(Number.parseInt(escape.slice(1), 16))
      : (CONTROL[escape] ?? escape),
  );

/**
 * The ledger rules a directive names. A disable lists them (`ledger/a, "ledger/b"`); a configuration
 * comment names them as keys, however their characters are escaped, each with the first word of
 * its setting (`off`, `1`, `error`).
 */
export function ledgerRules(directive) {
  if (directive.label === "eslint")
    return [
      ...decoded(directive.value).matchAll(
        /(["']?)(ledger\/[\w-]+)\1\s*:\s*\[?\s*(["']?)([\w-]*)\3/g,
      ),
    ].map((match) => ({ name: match[2], setting: match[4] }));
  return ruleNames(directive)
    .filter((name) => name.startsWith("ledger/"))
    .map((name) => ({ name }));
}

/** A configuration comment's message id by the first word of its setting; any other word sets it. */
const SETTING = new Map([
  ["off", "off"],
  ["0", "off"],
  ["warn", "warn"],
  ["1", "warn"],
]);
const WHOLE_FILE =
  'for the whole file, and a ledger rule takes no settings from a comment. Fix what the rule reports; a site that must keep a report takes a next-line disable that names the rule and says why after " -- ".{{note}}';
const UNREASONED =
  'without saying why. Fix what the rule reports, or say why this site needs it after " -- ".{{note}}';
/** A line disable's message id by its label. */
const SPAN = {
  "eslint-disable-line": "lineUnreasoned",
  "eslint-disable-next-line": "nextLineUnreasoned",
};

export const configRules = defineRules({
  "no-inline-config": {
    description:
      "No comment configures a ledger rule or turns one off beyond a line, and a comment that turns one off for a line names it and says why after ` -- `.",
    messages: {
      off: `This comment turns {{rule}} off ${WHOLE_FILE}`,
      warn: `This comment lowers {{rule}} to a warning ${WHOLE_FILE}`,
      set: `This comment sets {{rule}} ${WHOLE_FILE}`,
      fromHere:
        'This comment turns {{rule}} off from here on, so every later site in the file goes unseen, with or without a reason. Fix what the rule reports; a site that must keep a report takes a next-line disable that names the rule and says why after " -- ".{{note}}',
      lineUnreasoned: `This comment turns {{rule}} off for its own line ${UNREASONED}`,
      nextLineUnreasoned: `This comment turns {{rule}} off for the next line ${UNREASONED}`,
      noRule:
        'This comment names no rule, so it turns every rule off for the next line, the ledger rules with them. Name the rule it is for, and say why after " -- ".{{note}}',
    },
    create: (context) => ({
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const directive = readDirective(comment);
          if (!directive) continue;
          const loc = comment.loc;
          // A disable that names no rule turns this one off too wherever it reaches, so only the
          // next-line form can be reported (on its own line); check-allow-lists counts the others.
          if (namesNoRule(directive) && directive.label === "eslint-disable-next-line")
            context.report({ loc, messageId: "noRule" });
          for (const { name, setting } of ledgerRules(directive)) {
            const data = { rule: name };
            if (directive.label === "eslint")
              context.report({ loc, messageId: SETTING.get(setting) ?? "set", data });
            else if (directive.label === "eslint-disable")
              context.report({ loc, messageId: "fromHere", data });
            else if (!directive.reason)
              context.report({ loc, messageId: SPAN[directive.label], data });
          }
        }
      },
    }),
  },
});

// How a Ledger rule is defined, and how its findings are worded, noted and counted.
//
// The message contract. A finding says what was written, what it is, why that matters here and
// what to write instead. It never offers the configuration as the fix.
// 1. The subject comes first, as written: a quoted class ("p-[13px]"), a <Tag>, a Part.Name, an
//    attr="…", a style.x or a call().
// 2. It says what the subject is, not what it is not.
// 3. One clause of why, only when it is not obvious.
// 4. Instead: the specific Ledger token, prop value or part, at most two options, computed from
//    what was written.
// 5. No configuration advice: no allowance, no eslint-disable, no "declare a token" or "add a
//    variant". A missing token is a kit change through /ledger-add-part.
// 6. Where to read more is meta.docs.url, the rule's page, not the text.
// 7. At most 300 characters as the template renders with its data, measured before {{note}} and
//    before an allowance's count. Sentences end with a period, in the kit's spelling (colour).
//
// A rule keeps its words in meta.messages and reports `{ node | loc, messageId, data, fix?,
// suggest? }`, one message id per wording and the variable parts in data; defineRule throws on a
// report without an id. Every template ends with {{note}}, the product's own pointer, which the
// report fills in: the finding's with the note, a suggestion's with nothing.
import path from "node:path";
import { warnOnce } from "./warn.js";

/* ---------- words ---------- */

/** A template with its {{key}}s filled from data, as ESLint fills them: a key the data does not
    have stays as written. */
export const render = (template, data) =>
  data
    ? template.replace(/\{\{([^{}]+)\}\}/gu, (whole, key) =>
        key.trim() in data ? String(data[key.trim()]) : whole,
      )
    : template;

/* ---------- the note ---------- */

/** The longest note each source may give. */
const NOTE_LIMIT = 200;

/** One source's note, trimmed, or "" when it is unset or empty. One the lint cannot use is said
    once and ignored. */
function noteFrom(value, where, key) {
  if (value === undefined) return "";
  if (typeof value !== "string") {
    warnOnce(key, `${where} must be a string; it is ignored.`);
    return "";
  }
  const note = value.trim();
  if (note.length > NOTE_LIMIT) {
    warnOnce(
      key,
      `${where} is ${note.length} characters, and a note takes at most ${NOTE_LIMIT}; it is ignored.`,
    );
    return "";
  }
  return note;
}

/**
 * What every finding of a rule ends with: settings.ledger.note, then the rule's own `note` option,
 * after a space; "" when neither is set. A product names its own binding of the kit's advice here
 * ("In this app: useConfirmation …"), which the kit cannot know.
 */
export function noteOf(context) {
  const shared = context.settings?.ledger;
  const notes = [
    noteFrom(
      shared !== null && typeof shared === "object" ? shared.note : undefined,
      "settings.ledger.note",
      "settings.note",
    ),
    noteFrom(context.options?.[0]?.note, `The note option of ${context.id}`, `${context.id}.note`),
  ].filter(Boolean);
  return notes.length ? ` ${notes.join(" ")}` : "";
}

/* ---------- rules ---------- */

/**
 * A report as one descriptor, from either of the forms `context.report` takes: the object, or the
 * positional `(node, message, data, fix)` and `(node, loc, message, data, fix)`. As ESLint reads them.
 */
const descriptorOf = (...args) =>
  args.length === 1
    ? { ...args[0] }
    : typeof args[1] === "string"
      ? { node: args[0], message: args[1], data: args[2], fix: args[3] }
      : { node: args[0], loc: args[1], message: args[2], data: args[3], fix: args[4] };

/**
 * A Ledger rule: `meta.messages` holds its words, `meta.docs.url` its page in eslint-plugin/docs,
 * and every report by message id carries the note in `data.note`, so a test sees the id and its
 * data, and the text renders with the note at the end. A report without a message id throws: its
 * words would reach no snapshot, no contract check and no note. A suggestion by message id gets an
 * empty note, since its words are the action it offers and the note belongs to the finding.
 */
export function defineRule(
  name,
  { description, messages, create, fixable, hasSuggestions, schema },
) {
  for (const [id, template] of Object.entries(messages))
    if (!template.endsWith("{{note}}"))
      throw new Error(`ledger/${name}'s message "${id}" must end with {{note}}.`);
  const suggestion = (entry) =>
    entry?.messageId ? { ...entry, data: { ...entry.data, note: "" } } : entry;
  return {
    meta: {
      type: "problem",
      docs: { description, url: new URL(`./docs/${name}.md`, import.meta.url).href },
      messages,
      ...(fixable ? { fixable } : {}),
      ...(hasSuggestions ? { hasSuggestions } : {}),
      schema: schema ?? [],
    },
    create(context) {
      const note = noteOf(context);
      const report = (...args) => {
        const descriptor = descriptorOf(...args);
        if (!descriptor.messageId)
          throw new Error(
            `ledger/${name} reported "${descriptor.message}" without a message id; its words belong in meta.messages.`,
          );
        context.report({
          ...descriptor,
          data: { ...descriptor.data, note },
          ...(Array.isArray(descriptor.suggest)
            ? { suggest: descriptor.suggest.map(suggestion) }
            : {}),
        });
      };
      return create(Object.create(context, { report: { value: report } }));
    },
  };
}

/** Rules by name, each through defineRule. */
export const defineRules = (specs) =>
  Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, defineRule(name, spec)]));

/* ---------- allowances: sites that predate a rule, counted per file, that may only shrink ---------- */

/** Message ids an allowance never counts: findings about the package, not the file. */
const UNCOUNTED = new Set(["stale"]);

/** The options every Ledger rule takes, beside any of its own. */
const SHARED_OPTIONS = {
  allow: { type: "object", additionalProperties: { type: "integer", minimum: 1 } },
  // Any type, so a note that is not a string is said once and ignored rather than failing the run,
  // as settings.ledger.note is.
  note: {
    description: `A sentence each finding of this rule ends with, at most ${NOTE_LIMIT} characters.`,
  },
};

/**
 * Gives a rule an `allow` option: `{ allow: { "src/file.tsx": 2 } }` lets that file keep that
 * many reports. More fails as usual; fewer fails too and says to lower the number, so the list
 * only ever shrinks as sites are fixed. Paths are relative to the directory ESLint runs in. It also
 * gives the rule a `note` option (noteOf). A rule with options of its own takes `allow` and `note`
 * beside them in its one options object, which keeps every other constraint the rule set on it;
 * the rule sees its options and the note, never `allow`. A report over the allowance keeps its
 * words, the note included, its fix and its suggestions, whether it was written with a message or
 * an id, and says the count after them.
 */
export function withAllowance(definition) {
  const own = definition.meta?.schema ?? [];
  if (!Array.isArray(own) || own.length > 1 || (own.length === 1 && own[0].type !== "object"))
    throw new Error(
      `withAllowance takes a rule whose options are one object; "${definition.meta?.docs?.description}" has another schema.`,
    );
  for (const shared of Object.keys(SHARED_OPTIONS))
    if (own[0]?.properties?.[shared])
      throw new Error(
        `withAllowance gives a rule its ${shared} option; "${definition.meta?.docs?.description}" has one of its own.`,
      );
  const schema = own[0]
    ? { ...own[0], properties: { ...own[0].properties, ...SHARED_OPTIONS } }
    : { type: "object", properties: SHARED_OPTIONS, additionalProperties: false };
  return {
    ...definition,
    meta: { ...definition.meta, schema: [schema] },
    create(context) {
      const { allow = {}, ...options } = context.options[0] ?? {};
      const file = path.relative(context.cwd, context.filename).split(path.sep).join("/");
      const allowed = allow[file] ?? 0;
      // The rule sees its own options, without the allowance it does not read, in every file.
      const ownOptions = { options: { value: context.options.length ? [options] : [] } };
      if (!allowed) return definition.create(Object.create(context, ownOptions));
      const reports = [];
      const proxy = Object.create(context, {
        ...ownOptions,
        report: {
          value: (...args) => {
            const descriptor = descriptorOf(...args);
            // Stale lint data is about the package's build, not the file (data.js): reported as
            // it is, and never counted against the file's allowance.
            if (UNCOUNTED.has(descriptor.messageId)) context.report(descriptor);
            else reports.push(descriptor);
          },
        },
      });
      const listeners = definition.create(proxy);
      const exit = listeners["Program:exit"];
      return {
        ...listeners,
        "Program:exit"(node) {
          exit?.(node);
          if (reports.length > allowed)
            for (const { message, messageId, data, ...rest } of reports) {
              const template = message ?? definition.meta?.messages?.[messageId];
              if (template === undefined)
                throw new Error(
                  `${context.id} reported with an unknown message id "${messageId}".`,
                );
              context.report({
                ...rest,
                message: `${render(template, data)} (${reports.length} in this file; its allowance is ${allowed})`,
              });
            }
          else if (reports.length < allowed)
            context.report({
              node,
              loc: { line: 1, column: 0 },
              message: `${file} is allowed ${allowed} report${allowed === 1 ? "" : "s"} of ${context.id} and has ${reports.length}. Lower its allowance to ${reports.length}${reports.length === 0 ? " by deleting the entry" : ""}: the list only shrinks.`,
            });
        },
      };
    },
  };
}

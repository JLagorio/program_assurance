// Every Ledger rule's words, as a finding renders them: one snapshot of every message id with the
// data its first invalid case reports, and of every value a rule's data gives its words (advice,
// presets, retired names), and the shape every rendering must keep, the cases' and the data's.
// The message contract is at the head of eslint-plugin/report.js; this is the part of it a test
// can read.
//
// A changed message fails until the snapshot is rewritten, from the package:
//   LINT_SNAPSHOT_UPDATE=1 node --test test/lint-messages.test.mjs
// and the rewritten lint-messages.snap.md is committed with the change.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger, {
  deprecatedAttributes,
  deprecatedNames,
  legacyNames,
  primitives,
} from "../eslint-plugin/index.js";
import { render } from "../eslint-plugin/report.js";
import { PRODUCT, REPO, kitImport, loadCases, recordReports } from "./lint-helpers.mjs";

const SNAPSHOT = new URL("./lint-messages.snap.md", import.meta.url);
const UPDATE = process.env.LINT_SNAPSHOT_UPDATE === "1";

const recorded = recordReports(await loadCases());

/**
 * Data for a message id no case can reach (lint-meta.test.mjs's UNREACHABLE), so its words are
 * still rendered and checked.
 */
const FIXTURES = {
  "no-deprecated-token": { deprecated: { cls: "bg-retired-token" } },
  // Each reason the lint data is stale (data.js), through one of the rules that carry it.
  "no-arbitrary-value": {
    stale: {
      file: "src/generated/lint-values.json",
      why: "it comes from another token build than lint.json",
    },
  },
  "no-non-token-class": {
    stale: {
      file: "src/generated/lint.json",
      why: "src/styles/layout.css has changed since the token build wrote it",
    },
  },
  "no-unknown-variant": {
    stale: {
      file: "src/generated/lint.json",
      why: "src/generated/utilities.css has changed since the token build wrote it",
    },
  },
};

/**
 * The rules whose messages are held to the whole contract: the subject first and no advice about
 * the configuration. Every rule is here since batch 7 rewrote the last of them; a new rule joins
 * it, and AWAITING_REWRITE stays empty.
 */
const ENFORCED = [
  "button-icon-slot",
  "cell-plain",
  "dialog-footer-order",
  "id-not-blue",
  "link-button-navigation",
  "no-alpha-token",
  "no-arbitrary-value",
  "no-colgroup",
  "no-dark-variant",
  "no-deprecated-name",
  "no-deprecated-token",
  "no-disabled-while-loading",
  "no-inline-config",
  "no-kit-shadow",
  "no-margin",
  "no-native-confirm",
  "no-non-token-class",
  "no-overlay-autofocus",
  "no-plain-alert-role",
  "no-raw-colour",
  "no-static-design-value",
  "no-style-design-value",
  "no-unknown-variant",
  "overlay-width-preset",
  "prefer-text-link",
  "product-line-tabs",
  "product-responsive-table",
  "readable-classes",
  "text-link-navigation",
  "use-primitives",
];
/** Rules whose messages do not keep the contract yet, each moved to ENFORCED as it is rewritten.
    The list only shrinks: a rule here whose messages pass fails until it is moved. */
const AWAITING_REWRITE = [];

/** At most this many characters, measured before the note and before an allowance's count. */
const LIMIT = 300;

/**
 * use-primitives' renderings held over the limit, each named by its opening (the part and its
 * classes as the data renders them) with its length. None is: batch 7 made the advice one sentence
 * whatever the kinds of class. The list only shrinks, as an allowance does: a rendering longer than
 * its entry fails, one shorter fails until the entry is lowered or removed, and one over the limit
 * that is not here fails.
 */
const OVER_LIMIT = new Map([]);
/** A use-primitives rendering's opening: `<Box> carries layout classes (…)`. */
const opening = (text) => text.slice(0, text.indexOf(")") + 1);
const overLimit = (where, text) =>
  text.length > LIMIT &&
  !(
    where === "ledger/use-primitives primitive" &&
    text.length <= (OVER_LIMIT.get(opening(text)) ?? 0)
  );

/** Configuration advice, which a finding never gives. */
const BANNED = /eslint-disable|allowance|add (?:a |the )?(?:token|variant)|declare|define a/i;
/** no-inline-config's subject is the comment, whose words name the directives it is about. */
const BANNED_EXEMPT = new Set(["no-inline-config"]);

/** The kit's exported part names, which a message may lead with (Table.Cell, TextLink). */
const PARTS = new Set(
  JSON.parse(fs.readFileSync(new URL("../eslint-plugin/components.json", import.meta.url), "utf8"))
    .components,
);
/** How a subject is written: a quoted class, a <Tag>, style.x, style["--x"], attr="…" or a call(). */
const SUBJECTS = [
  /^"[^"]+"/,
  /^<[A-Za-z][\w.]*[\s>]/,
  /^style\.\w+/,
  // A custom property of a style: style["--glow"].
  /^style\["--[\w-]+"\]/,
  /^[a-z][\w-]*="[^"]*"/,
  /^[\w$.]+\(\)/,
];
/** A rule whose subject is not in the code's own words. */
const SUBJECT_OF = { "no-inline-config": /^This comment\b/ };

/**
 * Whether a rendered message leads with its subject. A Part.Name counts when it is a kit part; a
 * name the template leads with as data (`{{name}} is deprecated`) is copied from the code, so any
 * identifier as written counts (Modal, useDensity).
 */
function leadsWithSubject(rule, template, text) {
  if (SUBJECT_OF[rule]) return SUBJECT_OF[rule].test(text);
  if (SUBJECTS.some((subject) => subject.test(text))) return true;
  if (/^\{\{\s*\w+\s*\}\}/.test(template))
    return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*(?=[\s.,;:])/.test(text);
  return PARTS.has(/^([A-Z]\w*)(?:\.[A-Z]\w*)*(?=[\s.,;:])/.exec(text)?.[1]);
}

/** Parentheses that close in order and double quotes in pairs. */
function balanced(text) {
  let depth = 0;
  for (const character of text) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0 && (text.match(/"/g) ?? []).length % 2 === 0;
}

/** A message's words with `data`, and no note. */
const words = (rule, id, data) =>
  render(ledger.rules[rule].meta.messages[id], { ...data, note: "" });

/** Every rendering the cases produce, per rule and id, with the fixtures'. */
const renderings = new Map();
for (const [rule, { meta }] of Object.entries(ledger.rules)) {
  const byId = new Map(Object.keys(meta.messages).map((id) => [id, new Set()]));
  for (const { kind, messageId, data } of recorded.get(rule) ?? [])
    if (kind === "invalid" && messageId) byId.get(messageId)?.add(words(rule, messageId, data));
  for (const [id, data] of Object.entries(FIXTURES[rule] ?? {}))
    if (!byId.get(id)?.size) byId.get(id)?.add(words(rule, id, data));
  renderings.set(rule, byId);
}

/* ---------- the words carried as data ---------- */

/** One snippet's findings of one rule, linted as a product screen with no note. */
const findingsOf = (rule, code) =>
  new Linter({ cwd: REPO })
    .verify(
      code,
      {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { ledger },
        rules: { [`ledger/${rule}`]: "error" },
      },
      { filename: PRODUCT },
    )
    .filter(({ ruleId }) => ruleId === `ledger/${rule}`);

/** A kit part's tag with the import its root needs: `Item.Group` imports Item. */
const kitTag = (part, attributes = "") =>
  `${kitImport(part.split(".")[0])} <${part}${attributes ? ` ${attributes}` : ""} />`;
/** Every non-empty set of the items, in their order. */
const sets = (items) =>
  Array.from({ length: 2 ** items.length - 1 }, (_, bits) =>
    items.filter((_, index) => ((bits + 1) >> index) & 1),
  );
/** A class of each kind of layout use-primitives reads, and the flex column that makes a flex
    element a Stack. */
const KIND_CLASS = {
  padding: "p-200",
  gap: "gap-100",
  display: "flex",
  grid: "grid-cols-2",
  column: "flex-col",
};
/** The plain element use-primitives reads, with each set of those classes. */
const PLAIN = "div";
/** shadcn's theme names, as ledger/no-non-token-class reads them (lint-values.json's `aliases`). */
const THEME_NAMES = Object.keys(
  JSON.parse(fs.readFileSync(new URL("../src/generated/lint-values.json", import.meta.url), "utf8"))
    .aliases,
);
/** The overlay parts overlay-width-preset sizes, each with its preset. */
const OVERLAYS = ["DialogContent", "SheetContent", "AlertDialogContent", "DrawerContent"];

/** readable-classes' longest words: its longest reason on the parts whose name and styling props
    run longest, alone and rendered by the longest part names. */
const STYLE_PROPS = JSON.parse(
  fs.readFileSync(new URL("../eslint-plugin/components.json", import.meta.url), "utf8"),
).styleProps;
const NAMED = [...new Set([...PARTS, ...Object.keys(STYLE_PROPS)])];
const byLength = (score) => [...NAMED].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
const LONGEST_PARTS = byLength(
  (name) => name.length * 2 + (STYLE_PROPS[name] ?? []).slice(0, 3).join(", ").length,
).slice(0, 3);
const LONGEST_WRAPPERS = byLength((name) => name.length).slice(0, 3);
/** A className written again after its first value, the longest reason, on `tag`, or on `tag`
    rendering `rendered`. */
const reassignedOn = (tag, rendered) => {
  const roots = new Set([tag, rendered].filter(Boolean).map((name) => name.split(".")[0]));
  const render = rendered ? ` render={<${rendered} />}` : "";
  return `${kitImport(...roots)} export function A({ className }) { className ??= "w-full"; return <${tag}${render} className={className} />; }`;
};

/**
 * Code that reaches every value of the words a rule carries as data rather than in its templates:
 * use-primitives' advice for every primitive and a plain element with every set of kinds (a flex
 * column among them), overlay-width-preset's preset
 * for every overlay, no-deprecated-name for every retired name, prop and value, no-deprecated-token
 * for every reason it can give, no-kit-shadow for every legacy name and kit part, and
 * no-non-token-class for every shadcn theme name, bare and with alpha, and the names
 * no-disabled-while-loading and no-overlay-autofocus carry from the code at their longest. The words stay in the rule; each snippet is linted through
 * it, so a value no snippet reaches fails rather than going unread.
 */
const DATA = {
  // A flex column alone is no layout class the rule reports, and a plain element's grid template
  // is reported only with a display, a padding or a gap.
  "use-primitives": [...primitives, PLAIN].flatMap((part) =>
    sets(Object.keys(KIND_CLASS))
      .filter((kinds) =>
        kinds.some((kind) =>
          part === PLAIN ? ["padding", "gap", "display"].includes(kind) : kind !== "column",
        ),
      )
      .map((kinds) => {
        const className = `className="${kinds.map((kind) => KIND_CLASS[kind]).join(" ")}"`;
        return part === PLAIN ? `<${PLAIN} ${className} />` : kitTag(part, className);
      }),
  ),
  "readable-classes": [
    ...LONGEST_PARTS.map((part) => reassignedOn(part)),
    ...LONGEST_WRAPPERS.flatMap((wrapper) =>
      LONGEST_PARTS.map((part) => reassignedOn(wrapper, part)),
    ),
  ],
  "overlay-width-preset": OVERLAYS.flatMap((part) => [
    kitTag(part, "style={{ width: 480 }}"),
    kitTag(part, 'className="w-96"'),
  ]),
  "no-deprecated-name": [
    // A removed part or a hook is reported where it is imported, a renamed part where it is used.
    ...Object.entries(deprecatedNames).map(([name, dep]) =>
      dep.removed || /^[a-z]/.test(name) ? kitImport(name) : kitTag(name),
    ),
    ...Object.entries(deprecatedAttributes).flatMap(([part, props]) =>
      Object.entries(props).flatMap(([prop, rename]) =>
        rename.values
          ? Object.keys(rename.values).map((value) => kitTag(part, `${prop}="${value}"`))
          : [kitTag(part, `${prop}="x"`)],
      ),
    ),
  ],
  // Every reason fixes.js gives no-deprecated-token for asking for the change by hand that a rule
  // can reach: a template, an escape, a type that names the string, an entity and a key the object
  // has. The others cannot be reached from it: every string it reads is quoted, and a replacement
  // that is not one class or that another rule would report is not asked for (deprecated).
  "no-deprecated-token": [
    "<path className={`fill-chart-categorical-8`} />",
    'cn("fill-chart-categorical-8\\u0020x");',
    'type Fill = "fill-chart-categorical-8"; const fill: Fill = "fill-chart-categorical-8"; cn(fill);',
    '<path className="fill-chart-categorical&#45;8" />',
    'cn({ "fill-chart-categorical-8": a, "fill-chart-categorical-7": b });',
  ],
  // Every shadcn theme name, bare and with alpha, whose words come from its entry in
  // build/vocabulary-aliases.json.
  "no-non-token-class": THEME_NAMES.flatMap((name) => [
    `<p className="${name}" />`,
    `<p className="${name}/50" />`,
  ]),
  // The names a finding carries from the code, at their longest: TanStack's member-path pending
  // flags, one and several, on a button and in a props object, and a long component inside an
  // overlay, by one name and as a deep member.
  "no-disabled-while-loading": [
    "<Button isLoading={publishEvidenceVersion.isPending} disabled={publishEvidenceVersion.isPending}>Publish version</Button>",
    "<Button isLoading={publishEvidenceVersion.isPending || removeRequirementAllocation.isPending} disabled={publishEvidenceVersion.isPending || removeRequirementAllocation.isPending}>Publish version</Button>",
    "<Button isLoading={a.publishEvidenceVersion.isPending || b.removeRequirementAllocation.isPending || c.linkRequirementEvidence.isPending} disabled={a.publishEvidenceVersion.isPending || b.removeRequirementAllocation.isPending || c.linkRequirementEvidence.isPending}>Save</Button>",
    "const action = { isLoading: publishEvidenceVersion.isPending || removeRequirementAllocation.isPending, disabled: publishEvidenceVersion.isPending || removeRequirementAllocation.isPending };",
  ],
  "no-overlay-autofocus": [
    "<DropdownMenuContent><RequirementAllocationSearchField autoFocus /></DropdownMenuContent>",
    "<AlertDialogContent><Forms.Requirements.AllocationSearchField.WithSuggestions.AndRecentPicks autoFocus /></AlertDialogContent>",
  ],
  "no-kit-shadow": [
    ...Object.keys(legacyNames),
    ...[...PARTS].filter((name) => /^[A-Za-z_$][\w$]*$/.test(name)),
  ].map((name) => `export function ${name}() { return null; }`),
};

/** The renderings each snippet reaches, by rule, in snippet order; and the snippets that reach
    nothing. */
const dataRenderings = new Map();
const unreached = [];
for (const [rule, snippets] of Object.entries(DATA)) {
  const texts = [];
  for (const code of snippets) {
    const found = findingsOf(rule, code);
    if (!found.length) unreached.push(`ledger/${rule}: ${code}`);
    for (const { messageId, message } of found) {
      texts.push({ messageId, message });
      renderings.get(rule).get(messageId)?.add(message);
    }
  }
  dataRenderings.set(rule, texts);
}

/** An allowance's own words, linted where a file's key is always `src/screen.tsx`. */
function allowanceWords(code, allowed) {
  return new Linter({ cwd: "/repo" })
    .verify(
      code,
      {
        files: ["**/*.tsx"],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { ledger },
        rules: { "ledger/no-margin": ["error", { allow: { "src/screen.tsx": allowed } }] },
      },
      { filename: "/repo/src/screen.tsx" },
    )
    .map(({ message }) => message);
}
const ALLOWANCE = {
  over: allowanceWords('<div className="mt-200 mb-100" />', 1)[0],
  under: allowanceWords('<div className="mt-200" />', 2)[0],
  underToNone: allowanceWords('<div className="p-200" />', 1)[0],
};

/** The snapshot: each rule's ids in the order it declares them, as its first case renders them. */
function snapshot() {
  const fence = (lines) => ["```text", ...lines, "```", ""];
  const out = [
    "# Lint messages",
    "",
    "Generated by `test/lint-messages.test.mjs`: every message of every Ledger rule, as the first invalid case that reports it renders it, without the note. The test fails when a message changes. To accept a change, run `LINT_SNAPSHOT_UPDATE=1 node --test test/lint-messages.test.mjs` in the package and commit this file with it.",
    "",
  ];
  for (const rule of Object.keys(ledger.rules).sort()) {
    out.push(`## ledger/${rule}`, "");
    out.push(
      ...fence(
        [...renderings.get(rule)].map(([id, texts]) => `${id}: ${[...texts][0] ?? "(no case)"}`),
      ),
    );
  }
  out.push(
    "## Words carried as data",
    "",
    "Every value a rule's data gives its words, as the rule renders it: use-primitives for every primitive and a plain element with every set of kinds, readable-classes on the parts and wrappers whose names and styling props run longest, overlay-width-preset for every overlay, no-deprecated-name for every retired name, prop and value, no-deprecated-token for every reason it can give, no-kit-shadow for every legacy name, no-non-token-class for every shadcn theme name, bare and with alpha, and no-disabled-while-loading's flags and no-overlay-autofocus's tags at their longest.",
    "",
  );
  for (const [rule, texts] of dataRenderings) {
    // Every kit part's name renders the same sentence; the legacy names are the data.
    const shown =
      rule === "no-kit-shadow"
        ? texts.filter(({ messageId }) => messageId === "legacyName")
        : texts;
    out.push(`### ledger/${rule}`, "");
    out.push(
      ...fence([...new Set(shown.map(({ messageId, message }) => `${messageId}: ${message}`))]),
    );
  }
  out.push("## Allowances", "", "The words an allowance adds, for `ledger/no-margin`.", "");
  out.push(...fence(Object.entries(ALLOWANCE).map(([form, text]) => `${form}: ${text}`)));
  return out.join("\n");
}

test("the rendered messages match the snapshot", () => {
  const current = snapshot();
  if (UPDATE) {
    fs.writeFileSync(SNAPSHOT, current);
    return;
  }
  assert.ok(
    fs.existsSync(SNAPSHOT),
    "No lint-messages.snap.md; write it with LINT_SNAPSHOT_UPDATE=1",
  );
  const committed = fs.readFileSync(SNAPSHOT, "utf8");
  if (current === committed) return;
  const was = committed.split("\n");
  const now = current.split("\n");
  const changed = [
    ...was.filter((line) => !now.includes(line)).map((line) => `- ${line}`),
    ...now.filter((line) => !was.includes(line)).map((line) => `+ ${line}`),
  ];
  assert.fail(
    `A lint message changed. If it should, rewrite lint-messages.snap.md with LINT_SNAPSHOT_UPDATE=1 and commit it with the change:\n${changed.join("\n")}`,
  );
});

test("every value of the words carried as data reaches a finding", () => {
  assert.deepEqual(unreached, [], `No finding for:\n${unreached.join("\n")}`);
  // Each part use-primitives can advise, with values, and a Box around a layout part.
  const said = dataRenderings.get("use-primitives").map(({ message }) => message);
  for (const advice of [
    '<Inline space="space.100">',
    '<Stack space="space.100">',
    '<Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.100">',
    '<Box padding="space.200">',
    'Use padding="space.200"',
    "(a Stack is already a flex column)",
  ])
    assert.ok(
      said.some((message) => message.includes(advice)),
      `No use-primitives finding says ${advice}`,
    );
});

test("every message id renders from a case or a fixture", () => {
  for (const [rule, byId] of renderings)
    for (const [id, texts] of byId)
      assert.ok(texts.size, `ledger/${rule}'s "${id}" has no case and no fixture to render it`);
});

test(`every message is at most ${LIMIT} characters before its note, ends with a period, and pairs its parentheses and quotes`, () => {
  const problems = [];
  const check = (where, text) => {
    if (overLimit(where, text)) problems.push(`${where} is ${text.length} characters: ${text}`);
    if (!/[^.]\.$/.test(text)) problems.push(`${where} does not end with one period: ${text}`);
    if (!balanced(text)) problems.push(`${where} has unbalanced () or "": ${text}`);
  };
  for (const [rule, byId] of renderings)
    for (const [id, texts] of byId) for (const text of texts) check(`ledger/${rule} ${id}`, text);
  check("an allowance's under-count report", ALLOWANCE.under);
  check("an allowance's under-count report at none", ALLOWANCE.underToNone);
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("no rendered message leaves a placeholder unfilled", () => {
  const unfilled = [];
  for (const [rule, byId] of renderings)
    for (const [id, texts] of byId)
      for (const text of texts)
        if (/\{\{\s*[\w.]+\s*\}\}/.test(text)) unfilled.push(`ledger/${rule} ${id}: ${text}`);
  assert.deepEqual(unfilled, [], "Every value a template names comes with the report's data.");
});

test("every rendering held over the limit is as long as its entry says", () => {
  const lengths = new Map(
    [...renderings.get("use-primitives").get("primitive")].map((text) => [
      opening(text),
      text.length,
    ]),
  );
  for (const [entry, length] of OVER_LIMIT) {
    const now = lengths.get(entry) ?? 0;
    assert.ok(now > LIMIT, `${entry} fits in ${LIMIT} characters now; drop it from OVER_LIMIT`);
    assert.ok(now >= length, `${entry} is ${now} characters now; lower its entry from ${length}`);
  }
});

test("an allowance keeps a finding's words and says the count after them", () => {
  assert.match(
    ALLOWANCE.over,
    /^"mt-200" is a margin\. .+\. \(2 in this file; its allowance is 1\)$/,
  );
  assert.equal(
    ALLOWANCE.over.replace(/ \(2 in this file; its allowance is 1\)$/, ""),
    findingsOf("no-margin", '<div className="mt-200" />')[0].message,
  );
});

test("every rule is enforced or awaiting its rewrite, and only one of them", () => {
  const rules = Object.keys(ledger.rules).sort();
  assert.deepEqual([...ENFORCED, ...AWAITING_REWRITE].sort(), rules);
});

test("an enforced rule's messages lead with their subject and give no configuration advice", () => {
  const problems = [];
  for (const rule of ENFORCED)
    for (const [id, texts] of renderings.get(rule)) {
      const template = ledger.rules[rule].meta.messages[id];
      for (const text of texts) {
        if (!leadsWithSubject(rule, template, text))
          problems.push(`ledger/${rule} ${id} does not lead with its subject: ${text}`);
        if (!BANNED_EXEMPT.has(rule) && BANNED.test(text))
          problems.push(`ledger/${rule} ${id} gives configuration advice: ${text}`);
      }
    }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("a rule awaiting its rewrite still fails the contract, or it moves to ENFORCED", () => {
  for (const rule of AWAITING_REWRITE) {
    const passes = [...renderings.get(rule)].every(([id, texts]) =>
      [...texts].every(
        (text) =>
          leadsWithSubject(rule, ledger.rules[rule].meta.messages[id], text) &&
          (BANNED_EXEMPT.has(rule) || !BANNED.test(text)),
      ),
    );
    assert.ok(!passes, `ledger/${rule}'s messages keep the contract now; move it to ENFORCED`);
  }
});

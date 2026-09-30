// Settings and options are read as given or said once on stderr, never silently ignored or misread,
// and an allowance keeps a rule's own options, fixes and suggestions.
import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { withAllowance } from "../eslint-plugin/gate-rules.js";
import { setWarningSink, warnOnce } from "../eslint-plugin/warn.js";

const filename = "/repo/src/screen.tsx";
const languageOptions = { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } };
const verify = (source, { rules, plugins = { ledger }, settings }) =>
  new Linter({ cwd: "/repo" }).verify(
    source,
    [{ files: ["**/*.tsx"], languageOptions, plugins, rules, ...(settings ? { settings } : {}) }],
    { filename },
  );
const fixAll = (source, { rules, plugins }) =>
  new Linter({ cwd: "/repo" }).verifyAndFix(
    source,
    [{ files: ["**/*.tsx"], languageOptions, plugins, rules }],
    { filename },
  );

/** Runs `body` with warnings caught, and returns what was said. */
function warnings(body) {
  const said = [];
  setWarningSink((line) => said.push(line));
  try {
    body();
  } finally {
    setWarningSink();
  }
  return said;
}

const tokenRule = { "ledger/no-non-token-class": "error" };
const helper = 'export const c = mergeClasses("bg-red-500"); export const d = cn("bg-red-500");';

test("warnOnce says each thing once, through the sink a test sets", () => {
  const said = warnings(() => {
    warnOnce("a", "first");
    warnOnce("a", "again");
    warnOnce("b", "second");
  });
  assert.deepEqual(said, ["[ledger] first", "[ledger] second"]);
});

test("classFunctions takes one name as a string, not its characters", () => {
  const said = warnings(() => {
    const messages = verify(helper, {
      rules: tokenRule,
      settings: { ledger: { classFunctions: "mergeClasses" } },
    });
    assert.equal(messages.length, 2, "mergeClasses and cn are both read");
  });
  assert.deepEqual(said, []);
});

test("classFunctions of the wrong type is said once and the built-in helpers still run", () => {
  const said = warnings(() => {
    for (const classFunctions of [[42], [42]]) {
      const messages = verify(helper, {
        rules: tokenRule,
        settings: { ledger: { classFunctions } },
      });
      assert.equal(messages.length, 1, "cn is read, mergeClasses is not");
    }
    verify(helper, { rules: tokenRule, settings: { ledger: { classFunctions: { cn: true } } } });
  });
  assert.deepEqual(said, [
    "[ledger] settings.ledger.classFunctions must be a string or an array of strings; it is ignored.",
  ]);
});

test("an unknown settings key is said with the key it was probably meant to be", () => {
  const said = warnings(() => {
    verify(helper, { rules: tokenRule, settings: { ledger: { classFunction: ["mergeClasses"] } } });
    verify(helper, { rules: tokenRule, settings: { ledger: { colour: true } } });
    verify(helper, { rules: tokenRule, settings: { ledger: "cn" } });
    // A short key is meant as a known one only by case or one edit: "id" is not "kit".
    verify(helper, { rules: tokenRule, settings: { ledger: { id: 1, nte: "x", KIT: "self" } } });
  });
  assert.deepEqual(said, [
    '[ledger] settings.ledger has no key "classFunction". Did you mean "classFunctions"?',
    '[ledger] settings.ledger has no key "colour"; it takes classFunctions, variantFunctions, customVariants, note, kit.',
    "[ledger] settings.ledger must be an object; it is ignored.",
    '[ledger] settings.ledger has no key "id"; it takes classFunctions, variantFunctions, customVariants, note, kit.',
    '[ledger] settings.ledger has no key "nte". Did you mean "note"?',
    '[ledger] settings.ledger has no key "KIT". Did you mean "kit"?',
  ]);
});

test("a null settings.ledger is said, not taken for none", () => {
  const said = warnings(() => {
    assert.equal(verify(helper, { rules: tokenRule, settings: { ledger: null } }).length, 1);
  });
  assert.deepEqual(said, ["[ledger] settings.ledger must be an object; it is ignored."]);
});

test("a helper name no call can match is said once and ignored", () => {
  const said = warnings(() => {
    const source = 'export const c = styles.cn("bg-red-500"); export const d = mine("bg-red-500");';
    const messages = verify(source, {
      rules: tokenRule,
      settings: { ledger: { classFunctions: ["styles.cn", "cn ", "cn,clsx", "mine"] } },
    });
    assert.deepEqual(
      messages.map((message) => message.column - 1),
      [source.indexOf('mine("') + 5],
      "mine is read; the member call styles.cn is not",
    );
  });
  assert.deepEqual(
    said,
    ["styles.cn", "cn ", "cn,clsx"].map(
      (name) =>
        `[ledger] settings.ledger.classFunctions has "${name}", which no call can match: name the helper as it is called, without an object or spaces. It is ignored.`,
    ),
  );
});

test("variantFunctions takes names as classFunctions does, and reads a config's values", () => {
  const source =
    'export const v = variants({ base: "bg-red-500", defaultVariants: { size: "unrelated-value" } });';
  const said = warnings(() => {
    for (const variantFunctions of ["variants", ["variants"]])
      assert.deepEqual(
        verify(source, { rules: tokenRule, settings: { ledger: { variantFunctions } } }).map(
          (message) => message.message.match(/^"([^"]+)"/)?.[1],
        ),
        ["bg-red-500"],
        "base is read as classes; defaultVariants is a name",
      );
    // A name in both lists is a variant function.
    assert.equal(
      verify(source, {
        rules: tokenRule,
        settings: { ledger: { classFunctions: ["variants"], variantFunctions: ["variants"] } },
      }).length,
      1,
    );
    verify(source, { rules: tokenRule, settings: { ledger: { variantFunctions: [7] } } });
    verify(source, { rules: tokenRule, settings: { ledger: { variantFunctions: ["x.tv"] } } });
  });
  assert.deepEqual(said, [
    "[ledger] settings.ledger.variantFunctions must be a string or an array of strings; it is ignored.",
    '[ledger] settings.ledger.variantFunctions has "x.tv", which no call can match: name the helper as it is called, without an object or spaces. It is ignored.',
  ]);
});

test("every rule reads the settings, so a config with no class rule still hears about a mistake", () => {
  const said = warnings(() =>
    verify(
      'import { Shell } from "@ledger/design-system"; export const A = () => <Shell.NavItem />;',
      {
        rules: { "ledger/no-deprecated-name": "error" },
        settings: { ledger: { classFunction: ["x"], classFunctions: 5 } },
      },
    ),
  );
  assert.deepEqual(said, [
    '[ledger] settings.ledger has no key "classFunction". Did you mean "classFunctions"?',
    "[ledger] settings.ledger.classFunctions must be a string or an array of strings; it is ignored.",
  ]);
});

test('kit takes "self" alone, and any other value leaves the file a product\'s', () => {
  // The kit's own source: a relative import of a part is the part (identity.js).
  const relative =
    'import { Button } from "./button"; <Button><Icon className="size-icon-small" /></Button>';
  const rules = { "ledger/button-icon-slot": "error" };
  const kitFile = "/repo/src/components/probe.tsx";
  const lint = (settings) =>
    new Linter({ cwd: "/repo" }).verify(
      relative,
      [{ files: ["**/*.tsx"], languageOptions, plugins: { ledger }, rules, settings }],
      { filename: kitFile },
    );
  const said = warnings(() => {
    assert.equal(lint({ ledger: { kit: "self" } }).length, 1, 'kit: "self" reads the import');
    assert.equal(lint({ ledger: { kit: true } }).length, 0, "kit: true is a product's file");
    assert.equal(lint({ ledger: { kit: "package" } }).length, 0, 'kit: "package" too');
  });
  assert.deepEqual(said, [
    '[ledger] settings.ledger.kit takes "self", which the package preset sets for the kit\'s own source; it is ignored.',
  ]);
});

test("customVariants names a product's own variants, which no-unknown-variant then knows", () => {
  const variantRule = { "ledger/no-unknown-variant": "error" };
  const source = 'export const A = () => <div className="theme-settings-probe:bg-surface" />;';
  assert.equal(verify(source, { rules: variantRule }).length, 1, "unknown until declared");
  const said = warnings(() => {
    // A value of the wrong type, and a name no class can carry, are said and ignored.
    verify(source, { rules: variantRule, settings: { ledger: { customVariants: { x: 1 } } } });
    const messages = verify(source, {
      rules: variantRule,
      settings: { ledger: { customVariants: ["theme-settings-probe", "hover/row", "a b"] } },
    });
    assert.deepEqual(messages, [], "a declared variant is known");
  });
  assert.deepEqual(said, [
    "[ledger] settings.ledger.customVariants must be a string or an array of strings; it is ignored.",
    ...["hover/row", "a b"].map(
      (name) =>
        `[ledger] settings.ledger.customVariants has "${name}", which no class can carry: name the variant as a class writes it before its colon, without a /name, brackets or spaces. It is ignored.`,
    ),
  ]);
});

test("the keys later rules read are known already", () => {
  const said = warnings(() =>
    verify(helper, {
      rules: tokenRule,
      settings: {
        ledger: {
          classFunctions: [],
          variantFunctions: ["tv"],
          customVariants: [],
          note: "See the guide.",
          kit: "self",
        },
      },
    }),
  );
  assert.deepEqual(said, []);
});

/* ---------- allowances ---------- */

/** A rule with an option of its own; it reports every JSX element without attributes, says which
    mode it saw, and fixes by giving the element one. */
const moded = withAllowance({
  meta: {
    type: "problem",
    docs: { description: "Probe." },
    fixable: "code",
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: { mode: { type: "string" } },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => ({
    JSXOpeningElement(node) {
      if (node.attributes.length) return;
      context.report({
        node,
        message: `mode ${context.options[0]?.mode} allow ${context.options[0]?.allow}`,
        fix: (fixer) => fixer.insertTextAfter(node.name, " data-seen"),
        suggest: [
          { desc: "Mark it.", fix: (fixer) => fixer.insertTextAfter(node.name, " data-marked") },
        ],
      });
    },
  }),
});
const probe = { plugins: { probe: { rules: { moded } } } };
const two = "export const A = () => <><i /><b /></>;";

test("a rule with its own option takes allow beside it, and both are validated", () => {
  assert.equal(
    verify(two, { ...probe, rules: { "probe/moded": ["error", { mode: "strict" }] } })[0].message,
    "mode strict allow undefined",
  );
  assert.equal(
    verify(two, {
      ...probe,
      rules: { "probe/moded": ["error", { mode: "strict", allow: { "src/screen.tsx": 2 } }] },
    }).length,
    0,
    "both elements, exactly the allowance, so nothing is reported",
  );
  assert.throws(() => verify(two, { ...probe, rules: { "probe/moded": ["error", { mode: 3 }] } }));
  assert.throws(() =>
    verify(two, { ...probe, rules: { "probe/moded": ["error", { mood: "strict" }] } }),
  );
  assert.throws(() =>
    verify(two, { ...probe, rules: { "probe/moded": ["error", { allow: { "src/x.tsx": 0 } }] } }),
  );
});

test("under an allowance the rule still sees its own options, without allow", () => {
  const messages = verify(two, {
    ...probe,
    rules: { "probe/moded": ["error", { mode: "strict", allow: { "src/screen.tsx": 1 } }] },
  });
  assert.equal(messages.length, 2);
  for (const message of messages)
    assert.equal(
      message.message,
      "mode strict allow undefined (2 in this file; its allowance is 1)",
    );
});

test("the rule's options are the same in a file with an allowance and in one without", () => {
  const seen = [];
  const recording = withAllowance({
    meta: {
      type: "problem",
      docs: { description: "Records its options." },
      schema: [{ type: "object", properties: { mode: { type: "string" } } }],
    },
    create(context) {
      seen.push(context.options);
      return {};
    },
  });
  const plugins = { probe: { rules: { recording } } };
  for (const allow of [{ "src/other.tsx": 1 }, { "src/screen.tsx": 1 }, undefined])
    verify("x;", {
      plugins,
      rules: { "probe/recording": ["error", { mode: "a", ...(allow ? { allow } : {}) }] },
    });
  verify("x;", { plugins, rules: { "probe/recording": "error" } });
  assert.deepEqual(seen, [[{ mode: "a" }], [{ mode: "a" }], [{ mode: "a" }], []]);
});

test("a rule's own options keep every constraint it set, beside allow", () => {
  const open = withAllowance({
    meta: {
      type: "problem",
      docs: { description: "Open options." },
      schema: [
        {
          type: "object",
          properties: { mode: { enum: ["a", "b"] } },
          additionalProperties: { type: "string" },
        },
      ],
    },
    create: () => ({}),
  });
  const run = (options) =>
    verify("x;", {
      plugins: { probe: { rules: { open } } },
      rules: { "probe/open": ["error", options] },
    });
  assert.deepEqual(run({ mode: "a", extra: "x", allow: { "src/x.tsx": 1 } }), []);
  assert.throws(() => run({ mode: "c" }));
  assert.throws(() => run({ extra: 1 }));
  assert.throws(
    () =>
      withAllowance({
        meta: {
          docs: { description: "Its own allow." },
          schema: [{ type: "object", properties: { allow: { type: "boolean" } } }],
        },
        create: () => ({}),
      }),
    /has one of its own/,
  );
});

test("a report by message id or in the positional form keeps its words over the allowance", () => {
  const byId = withAllowance({
    meta: {
      type: "problem",
      docs: { description: "By id." },
      schema: [],
      messages: { bad: "Bad {{what}}." },
    },
    create: (context) => ({
      Identifier(node) {
        context.report({ node, messageId: "bad", data: { what: node.name } });
      },
    }),
  });
  const positional = withAllowance({
    meta: { type: "problem", docs: { description: "Positional." }, schema: [] },
    create: (context) => ({
      Identifier(node) {
        context.report(node, "Positional {{name}}.", { name: node.name });
      },
    }),
  });
  const plugins = { probe: { rules: { byId, positional } } };
  const allow = { allow: { "src/screen.tsx": 1 } };
  assert.deepEqual(
    verify("a; b;", {
      plugins,
      rules: { "probe/byId": ["error", allow], "probe/positional": ["error", allow] },
    }).map((message) => message.message),
    [
      "Bad a. (2 in this file; its allowance is 1)",
      "Positional a. (2 in this file; its allowance is 1)",
      "Bad b. (2 in this file; its allowance is 1)",
      "Positional b. (2 in this file; its allowance is 1)",
    ],
  );
});

test("a report passed on by an allowance keeps its fix and its suggestions", () => {
  const config = {
    ...probe,
    rules: { "probe/moded": ["error", { allow: { "src/screen.tsx": 1 } }] },
  };
  const source = "export const A = () => <><i /><b /></>;";
  const messages = verify(source, config);
  assert.equal(messages.length, 2);
  for (const message of messages) {
    assert.ok(message.fix, "the fix survives");
    assert.equal(message.suggestions?.[0]?.desc, "Mark it.");
  }
  assert.match(fixAll(source, config).output, /<i data-seen \/><b data-seen \/>/);
});

test("withAllowance refuses a rule whose options are not one object", () => {
  assert.throws(
    () =>
      withAllowance({
        meta: { docs: { description: "Two." }, schema: [{ type: "string" }, { type: "number" }] },
        create: () => ({}),
      }),
    /one object/,
  );
});

test("every Ledger rule takes allow", () => {
  for (const [name, definition] of Object.entries(ledger.rules))
    assert.ok(definition.meta.schema[0]?.properties?.allow, name);
});

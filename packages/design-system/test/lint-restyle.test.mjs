// ledger/no-restyle against the product it was measured on, and its place among the other rules.
// The real-world table is every class the product wrote on a kit part on 28 September (93 sites,
// 114 classes, read by docs/examples/lint-hardening-2026-09-28/harvest-restyle), with what the rule
// reports on each today: the harvest's 24 findings, less RadioGroup's divide-y (decision 7: a part
// owns only what it sets itself) and the 9 paddings on layout primitives, which are use-primitives'
// alone. The rule's own cases are in lint-cases/no-restyle.cases.mjs; its words in the snapshot.
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import ts from "typescript";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { CELL_STYLE } from "../eslint-plugin/restyle-rules.js";
import { classesOf } from "../eslint-plugin/classes.js";
import { partData, partNames } from "../eslint-plugin/parts.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const PRODUCT = path.join(repoRoot, "src/components/prototype/screen.tsx");
const typescript = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
};
const quiet = { linterOptions: { reportUnusedDisableDirectives: "off" } };

/** The ledger findings of `code` in a product file under the recommended preset, with `rules`
    over it. */
function lint(code, { rules, filename = PRODUCT, settings } = {}) {
  return new Linter({ cwd: repoRoot })
    .verify(
      code,
      [
        typescript,
        quiet,
        ...ledger.configs.recommended,
        ...(rules ? [{ rules }] : []),
        ...(settings ? [{ settings }] : []),
      ],
      { filename },
    )
    .filter(({ ruleId, fatal }) => fatal || ruleId?.startsWith("ledger/"));
}
const only = (rule) =>
  Object.fromEntries(
    Object.keys(ledger.rules).map((name) => [`ledger/${name}`, name === rule ? "error" : "off"]),
  );
/** The class a no-restyle finding names: its message opens with it, quoted. */
const quotedClass = (message) => /^"([^"]+)"/.exec(message)?.[1];

const imports = (parts) =>
  `import { ${[...new Set(parts.map((part) => part.split(".")[0]))].join(", ")} } from "@ledger/design-system";`;

/* ---------- the product, as it was measured ---------- */

// [site, part, a focus target (tabIndex={-1}), its classes, what no-restyle reports, drawn in a
// column's cell]
const REAL_WORLD = [
  ["campaigns.$campaignId.tsx:107", "Box", 0, "max-w-layout-measure", ""],
  ["index.tsx:465", "Stack", 0, "animate-rise", ""],
  ["index.tsx:509", "Box", 0, "@container", ""],
  ["index.tsx:510", "Grid", 0, "grid-cols-1 @4xl:grid-cols-3", ""],
  ["index.tsx:511", "Stack", 0, "min-w-0 @4xl:col-span-2", ""],
  ["index.tsx:553", "Section", 0, "min-w-0", ""],
  ["catalog.tsx:143", "Tabs", 0, "gap-150", "gap-150"],
  ["profiles.$profileId.tsx:297", "Tabs", 0, "gap-150", "gap-150"],
  ["profiles.$profileId.tsx:310", "Stack", 0, "min-w-0 pt-200", ""],
  ["profiles.$profileId.tsx:432", "Id", 0, "break-all", ""],
  ["profiles.$profileId.tsx:465", "Id", 0, "break-all", ""],
  ["profiles.$profileId.tsx:468", "Id", 0, "break-all", ""],
  ["tasks.$taskId.tsx:198", "Stack", 0, "min-w-0", ""],
  ["tasks.$taskId.tsx:201", "Box", 0, "max-w-layout-measure", ""],
  ["workstreams.$workstreamId.tsx:80", "Stack", 0, "min-w-0", ""],
  ["workstreams.$workstreamId.tsx:83", "Box", 0, "max-w-layout-measure", ""],
  ["evidence-file.tsx:389", "Attachment", 0, "w-full", ""],
  ["evidence-file.tsx:432", "Attachment", 0, "w-full", ""],
  ["control-picker.tsx:179", "Stack", 0, "@container", ""],
  ["control-picker.tsx:185", "Inline", 0, "hidden @3xl:flex", ""],
  ["parameter-picker.tsx:177", "Stack", 0, "@container", ""],
  ["parameter-picker.tsx:182", "Text", 0, "hidden @3xl:block", ""],
  ["elements.tsx:494", "Text", 0, "max-w-layout-measure", ""],
  ["review.tsx:137", "Stack", 0, "max-w-layout-measure", ""],
  ["review.tsx:213", "Id", 0, "text-subtle", ""],
  ["program-wizard/catalog.tsx:166", "Section.Title", 1, "outline-none", ""],
  ["program-wizard/catalog.tsx:217", "RadioGroup", 0, "gap-0 divide-y", "gap-0"],
  ["program-wizard/catalog.tsx:222", "Inline", 0, "py-100", ""],
  ["program-wizard/catalog.tsx:228", "Field", 0, "min-w-0", ""],
  ["program-wizard/catalog.tsx:284", "FieldLegend", 0, "sr-only", ""],
  ["program-wizard/catalog.tsx:304", "Field", 0, "min-w-0", ""],
  ["record-browser.tsx:634", "KeyValue.Group", 0, "max-w-layout-measure", ""],
  ["program-wizard.tsx:406", "Box", 0, "hidden lg:block lg:sticky-rail", ""],
  ["program-wizard.tsx:429", "Stack", 0, "min-w-0", ""],
  ["program-wizard.tsx:438", "Text", 0, "lg:hidden", ""],
  [
    "program-wizard.tsx:445",
    "Section.Title",
    1,
    "font-heading-overlay outline-none",
    "font-heading-overlay",
  ],
  ["program-wizard.tsx:470", "Inline", 0, "border-t border-default pt-200", ""],
  ["record-editor.tsx:638", "Stack", 0, "max-w-layout-measure", ""],
  ["record-editor.tsx:698", "Inline", 0, "max-w-layout-measure", ""],
  ["shell.tsx:116", "Stack", 0, "min-w-0 animate-rise", ""],
  ["workspace.tsx:112", "Inline", 0, "min-h-screen", ""],
  ["workspace.tsx:116", "Box", 0, "w-full max-w-layout-measure", ""],
  ["workspace.tsx:457", "Heading", 1, "outline-none", ""],
  ["add-from-library.tsx:829", "Stack", 0, "ps-300", ""],
  ["assessment-browser.tsx:289", "TabsContent", 0, "pt-200", "pt-200"],
  ["assessment-browser.tsx:362", "TabsContent", 0, "pt-200", "pt-200"],
  ["assessment-browser.tsx:407", "TabsContent", 0, "pt-200", "pt-200"],
  ["assessment-browser.tsx:462", "TabsContent", 0, "pt-200", "pt-200"],
  ["assessment-campaign.tsx:264", "Stack", 0, "pt-200", ""],
  ["assessment-campaign.tsx:422", "Stack", 0, "pt-200", ""],
  ["assessment-campaign.tsx:1227", "Stack", 0, "pt-200", ""],
  ["evidence-browser.tsx:565", "Id", 0, "break-all", ""],
  ["findings-views.tsx:35", "Prose", 0, "max-w-layout-measure", ""],
  ["findings-views.tsx:80", "TabsContent", 0, "pt-200", "pt-200"],
  ["findings-views.tsx:100", "TabsContent", 0, "pt-200", "pt-200"],
  ["findings-views.tsx:103", "TabsContent", 0, "pt-200", "pt-200"],
  ["findings-views.tsx:126", "TabsContent", 0, "pt-200", "pt-200"],
  ["library-components.tsx:149", "Stack", 0, "animate-rise", ""],
  ["library-components.tsx:351", "Stack", 0, "animate-rise", ""],
  ["library-components.tsx:826", "Stack", 0, "max-w-layout-measure", ""],
  ["library-components.tsx:1429", "TextLink", 0, "break-all", ""],
  ["evidence-version-details.tsx:63", "Id", 0, "break-all", ""],
  ["evidence-version-details.tsx:201", "Id", 0, "break-all", ""],
  ["library-controls.tsx:296", "Stack", 0, "border-s ps-150", ""],
  ["library-controls.tsx:304", "Text", 0, "shrink-0 tabular-nums", "tabular-nums"],
  ["library-controls.tsx:308", "Stack", 0, "min-w-0 flex-1", ""],
  ["package-views.tsx:513", "Box", 0, "@container", ""],
  ["package-views.tsx:514", "Grid", 0, "grid-cols-1 @4xl:grid-cols-3", ""],
  ["package-views.tsx:515", "Stack", 0, "min-w-0 @4xl:col-span-2", ""],
  ["product-structure.tsx:204", "Inline", 0, "min-w-0", ""],
  ["product-structure.tsx:618", "Stack", 0, "ps-300", ""],
  ["library-requirements.tsx:136", "Stack", 0, "animate-rise", ""],
  ["library-requirements.tsx:388", "Stack", 0, "animate-rise", ""],
  ["library-requirements.tsx:457", "Prose", 0, "max-w-layout-measure", ""],
  ["library-requirements.tsx:463", "Stack", 0, "max-w-layout-measure", ""],
  ["program-systems-tree.tsx:282", "Inline", 0, "min-w-0", ""],
  ["program-systems-tree.tsx:283", "Icon", 0, "shrink-0", ""],
  ["program-systems-tree.tsx:290", "Icon", 0, "shrink-0", ""],
  ["program-systems-tree.tsx:295", "Truncate", 0, "min-w-0", ""],
  ["program-systems-tree.tsx:333", "Stack", 0, "min-w-0 font-body-small", "font-body-small", 1],
  ["program-timeline.tsx:55", "Stack", 0, "min-w-0", ""],
  ["program-timeline.tsx:121", "Stack", 0, "min-w-0", ""],
  ["program-workspace.tsx:455", "Stack", 0, "min-w-0", ""],
  ["program-workspace.tsx:499", "Stack", 0, "min-w-0", ""],
  ["library-shared.tsx:54", "SelectTrigger", 0, "w-full", ""],
  [
    "library-shared.tsx:143",
    "Text",
    1,
    "rounded-xsmall outline-none focus-visible:outline-focused",
    "",
  ],
  ["program-shared.tsx:138", "Stack", 0, "min-w-0", ""],
  ["requirement-record.tsx:217", "Stack", 0, "min-w-0", ""],
  ["system-library.tsx:141", "Stack", 0, "min-w-0", ""],
  ["system-library.tsx:186", "Stack", 0, "min-w-0", ""],
  ["library-products.tsx:182", "Stack", 0, "animate-rise", ""],
  ["library-products.tsx:399", "Stack", 0, "animate-rise", ""],
  ["library-products.tsx:658", "Prose", 0, "max-w-layout-measure", ""],
];

/** A site as a file: the part with its classes, in a column's cell renderer where it was one. */
function siteSource([, part, focus, classes, , cell]) {
  const element = `<${part}${focus ? " tabIndex={-1}" : ""} className="${classes}">x</${part}>`;
  return cell
    ? `${imports([part, "defineColumns"])} export const columns = defineColumns((c) => [c.custom("x", { cell: (row) => ${element} })]);`
    : `${imports([part])} export const A = () => ${element};`;
}

test("the product as measured: each restyle once, nothing else, and every other class left alone", () => {
  assert.equal(REAL_WORLD.length, 93);
  assert.equal(REAL_WORLD.flatMap(([, , , classes]) => classes.split(" ")).length, 114);
  const problems = [];
  for (const site of REAL_WORLD) {
    const [where, , , , expected] = site;
    const messages = lint(siteSource(site));
    const fatal = messages.find(({ fatal }) => fatal);
    if (fatal) {
      problems.push(`${where} does not parse: ${fatal.message}`);
      continue;
    }
    const said = messages
      .filter(({ ruleId }) => ruleId === "ledger/no-restyle")
      .map(({ message }) => quotedClass(message));
    const want = expected ? expected.split(" ") : [];
    if (said.join(" ") !== want.join(" "))
      problems.push(`${where}: reports ${JSON.stringify(said)}, expected ${JSON.stringify(want)}`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
  assert.equal(REAL_WORLD.filter(([, , , , expected]) => expected).length, 14);
});

test("the paddings on layout primitives the product wrote are use-primitives' alone", () => {
  for (const site of REAL_WORLD.filter(
    ([, part, , classes]) =>
      /^(Stack|Inline|Box)$/.test(part) && /(^|\s)(p|ps|py|pt)-/.test(classes),
  )) {
    const rules = lint(siteSource(site), { rules: { "ledger/use-primitives": "error" } }).map(
      ({ ruleId }) => ruleId,
    );
    assert.deepEqual(rules, ["ledger/use-primitives"], site[0]);
  }
});

/* ---------- decision 7 ---------- */

test("decision 7: a part owns only what it sets itself", () => {
  const restyles = (code) =>
    lint(code)
      .filter(({ ruleId }) => ruleId === "ledger/no-restyle")
      .map(({ message }) => quotedClass(message));
  // A border on a layout primitive is the caller's: the primitive sets none.
  for (const part of ["Stack", "Inline", "Box", "Grid"])
    assert.deepEqual(
      restyles(
        `${imports([part])} <${part} className="border-t border-s border-default">x</${part}>`,
      ),
      [],
      part,
    );
  // RadioGroup sets its gap and not its dividers.
  assert.deepEqual(
    restyles(`${imports(["RadioGroup"])} <RadioGroup className="gap-0 divide-y">x</RadioGroup>`),
    ["gap-0"],
  );
  assert.equal(partData("RadioGroup").root.gap[0], "gap-100");
  assert.equal(partData("RadioGroup").root["divide-y"], undefined);
});

/* ---------- its place among the other rules ---------- */

/** Classes on parts, for the one-owner and independence checks: the class rules' classes, the
    layout use-primitives judges, cell-plain's, and the restyles this rule owns. */
const BATTERY = [
  ["Text", "tabular-nums text-subtle font-heading-page mt-200 text-red-500 hover:text-subtle"],
  ["Text", "w-[13px] dark:bg-surface bg-brand-bold/50 hovr:text-subtle rounded"],
  ["Stack", "pt-200 gap-150 flex md:gap-300 font-body-small bg-surface border-t min-w-0"],
  ["Box", "bg-surface-raised p-200 text-subtle shrink-0 mx-200"],
  ["Button", "w-full md:w-full px-300 bg-danger-bold rounded-small shadow-none"],
  ["Table.Cell", "font-semibold text-subtle tabular-nums text-end truncate"],
  ["Table.Header", "text-end font-medium"],
  ["TabsContent", "pt-200 outline-hidden min-h-0"],
  ["TabsList", "flex-wrap w-fit gap-200"],
  ["Tabs", "gap-150"],
  ["RadioGroup", "gap-0 divide-y"],
  ["Id", "text-subtle text-brand break-all"],
  ["DialogContent", "max-w-layout-measure"],
];
const batterySource = ([part, classes]) =>
  `${imports([part])} export const A = () => <${part} className="${classes}">x</${part}>;`;

test("a class no-restyle reports is reported by no other rule", () => {
  const problems = [];
  for (const entry of BATTERY) {
    const messages = lint(batterySource(entry), {
      rules: {
        "ledger/use-primitives": "error",
        "ledger/product-line-tabs": "error",
      },
    });
    const restyled = new Set(
      messages
        .filter(({ ruleId }) => ruleId === "ledger/no-restyle")
        .map(({ message }) => quotedClass(message)),
    );
    for (const { ruleId, message } of messages)
      if (ruleId !== "ledger/no-restyle")
        for (const cls of restyled)
          if (message.includes(`"${cls}"`) || message.includes(`(${cls}`))
            problems.push(`${entry[0]} "${cls}": no-restyle and ${ruleId}`);
  }
  assert.deepEqual(problems, []);
});

test("no-restyle reports the same alone as with every other rule", () => {
  for (const entry of BATTERY) {
    const code = batterySource(entry);
    const ofRule = (messages) =>
      messages
        .filter(({ ruleId }) => ruleId === "ledger/no-restyle")
        .map(({ line, column, message }) => `${line}:${column} ${message}`);
    assert.deepEqual(
      ofRule(lint(code, { rules: only("no-restyle") })),
      ofRule(lint(code)),
      entry.join(" "),
    );
  }
});

test("in a cell, no-restyle forbids the words cell-plain forbids on the cell, no more and no fewer", () => {
  const candidates = [
    ...["default", "subtle", "subtlest", "brand", "selected", "inverse", "disabled"].map(
      (tone) => `text-${tone}`,
    ),
    "text-danger",
    "text-warning",
    "font-body",
    "font-body-large",
    "font-body-small",
    "font-body-xsmall",
    "font-heading-page",
    "font-heading-overlay",
    "font-code",
    "font-regular",
    "font-medium",
    "font-semibold",
    "tabular-nums",
    "truncate",
  ];
  for (const cls of candidates) {
    const onCell = lint(`${imports(["Table"])} <Table.Cell className="${cls}">x</Table.Cell>`, {
      rules: only("cell-plain"),
    }).length;
    const inCell = lint(
      `${imports(["Inline", "Table"])} <Table.Cell><Inline className="${cls}">x</Inline></Table.Cell>`,
      { rules: only("no-restyle") },
    ).filter(({ message }) => message.includes("Cells are one style")).length;
    assert.equal(inCell, onCell, cls);
    assert.equal(CELL_STYLE.test(cls), onCell === 1, cls);
  }
});

/* ---------- descendants ---------- */

test("a class that styles the inside of a kit part, or of an element that holds one, is reported", () => {
  const reaching = ["*:p-200", "**:text-subtle", "[&_svg]:icon-subtle", "[&>li]:border-b"];
  // A child selector reaches the children; a descendant one, anything inside.
  const deep = new Set(["**:text-subtle", "[&_svg]:icon-subtle"]);
  const own = [
    "hover:bg-neutral-hovered",
    "group-hover:flex",
    "has-[>svg]:gap-100",
    "before:border-b",
    "[&[hidden]]:hidden",
    "[&:hover]:underline",
    "data-[open]:bg-selected",
    "[&+div]:hidden",
  ];
  const said = (code) =>
    lint(code, { rules: only("no-restyle") }).map(({ message }) => quotedClass(message));
  const holding = (cls) =>
    `${imports(["Badge"])} export const A = ({ on }) => <section className="${cls}"><p>{on && <Badge>New</Badge>}</p></section>;`;
  const child = (cls) =>
    `${imports(["Badge"])} export const A = ({ on }) => <ul className="${cls}">{on && <Badge>New</Badge>}<li>x</li></ul>;`;
  for (const cls of reaching) {
    assert.deepEqual(said(holding(cls)), deep.has(cls) ? [cls] : [], cls);
    assert.deepEqual(said(child(cls)), [cls], cls);
    assert.deepEqual(
      said(
        `${imports(["Button"])} export const A = () => <Button className="${cls}">Save</Button>;`,
      ),
      [cls],
      cls,
    );
    // An element of the file's own that holds no kit part: what it reaches is the file's.
    assert.deepEqual(
      said(`export const A = () => <ul className="${cls}"><li>x</li></ul>;`),
      [],
      cls,
    );
  }
  for (const cls of own) assert.deepEqual(said(holding(cls)), [], cls);
  // A class rule's class stays that rule's, whatever reaches inside.
  assert.deepEqual(
    lint(
      `${imports(["Badge"])} export const A = () => <div className="*:mt-200 [&_svg]:size-[13px]"><Badge>x</Badge></div>;`,
    )
      .map(({ ruleId }) => ruleId)
      .sort(),
    ["ledger/no-arbitrary-value", "ledger/no-margin"],
  );
});

test("what a class reaches inside: the children, a primitive's children, a tag a part draws", () => {
  const said = (code) =>
    lint(code, { rules: only("no-restyle") }).map(({ message }) => quotedClass(message));
  const at = (element) =>
    `${imports(["Badge", "Button", "Grid", "Inline", "Stack", "Text"])} export const A = ({ on, rows }) => ${element};`;
  for (const [element, expected] of [
    // A layout primitive's children are written here; its own and theirs are the caller's.
    ['<Grid columns="2" className="*:min-w-0 *:p-200"><div>a</div><div>b</div></Grid>', []],
    // Placement on a part's own element is the caller's; anything else is the part's.
    ['<Inline space="space.100" className="*:flex-1 *:shrink-0"><Button>a</Button></Inline>', []],
    [
      '<Inline space="space.100" className="*:bg-danger"><Button>a</Button></Inline>',
      ["*:bg-danger"],
    ],
    // A child reached through a list or a condition, and one the element only holds deeper.
    [
      '<Stack space="space.0" className="*:text-subtle">{rows.map((row) => <Badge key={row}>{row}</Badge>)}</Stack>',
      ["*:text-subtle"],
    ],
    ['<ul className="[&>li]:py-100"><li>a <Badge>x</Badge></li></ul>', []],
    // A tag a primitive written inside does not draw, beside the file's own svg.
    ['<span className="[&_svg]:size-200 [&_svg]:icon-subtle"><svg /><Text>x</Text></span>', []],
    ['<span className="[&_span]:text-subtle"><Text>x</Text></span>', ["[&_span]:text-subtle"]],
    ['<span className="[&_p]:text-subtle"><Text as="p">x</Text></span>', ["[&_p]:text-subtle"]],
    // A component inside: its inside is the kit's, whatever the selector names.
    [
      '<div className="[&_p]:text-subtle"><p>a</p>{on && <Badge>x</Badge>}</div>',
      ["[&_p]:text-subtle"],
    ],
    // On a Text itself, which draws a Truncate when it clamps.
    ['<Text className="[&_svg]:size-200">x</Text>', ["[&_svg]:size-200"]],
  ])
    assert.deepEqual(said(at(element)), expected, element);
});

/* ---------- states, conditions and what is in force ---------- */

test("a width, a media condition or a variant that always holds is no state; an interaction state is", () => {
  const said = (code) =>
    lint(code, { rules: only("no-restyle") }).map(({ message }) => quotedClass(message));
  const conditions = [
    "sm:",
    "md:",
    "max-lg:",
    "min-[0px]:",
    "@3xl:",
    "motion-safe:",
    "motion-reduce:",
    "print:",
    "not-print:",
    "ltr:",
    "pointer-fine:",
    "supports-[display:grid]:",
    "[&]:",
    "[:root_&]:",
    "data-[slot=button]:",
    "enabled:",
    "not-hover:",
  ];
  for (const condition of conditions) {
    for (const [part, attributes, cls] of [
      ["Button", "", "bg-danger-bold"],
      ["Text", ' color="color.text.subtle"', "text-danger"],
      ["Heading", ' size="page"', "font-heading-display"],
      ["Badge", ' tone="danger"', "bg-success-bold"],
    ])
      assert.deepEqual(
        said(`${imports([part])} <${part}${attributes} className="${condition}${cls}">x</${part}>`),
        [`${condition}${cls}`],
        `${part} ${condition}${cls}`,
      );
  }
  // A state the prop never sets is the caller's; one it sets is the prop's.
  for (const state of [
    "hover:",
    "focus-visible:",
    "aria-expanded:",
    "data-[state=open]:",
    "group-hover:",
  ])
    assert.deepEqual(
      said(
        `${imports(["Box"])} <Box backgroundColor="elevation.surface" className="${state}bg-surface-hovered">x</Box>`,
      ),
      [],
      state,
    );
  assert.deepEqual(
    said(
      `${imports(["Button"])} <Button variant="primary" className="hover:bg-danger-bold">x</Button>`,
    ),
    ["hover:bg-danger-bold"],
  );
  // Placement at a width or a container size is the caller's, even where a prop sets only it.
  for (const condition of ["sm:", "max-lg:", "@3xl:", "min-[0px]:"])
    assert.deepEqual(
      said(`${imports(["Button"])} <Button className="${condition}w-full">x</Button>`),
      [],
    );
  assert.deepEqual(
    said(`${imports(["Button"])} <Button className="motion-safe:w-full">x</Button>`),
    [],
  );
});

test("a flag, a given prop or a default is in force only where it holds; a state is no style", () => {
  const said = (code) => lint(code, { rules: only("no-restyle") }).map(({ message }) => message);
  // isLoading sets the cursor only while loading, and is no advice for a cursor.
  assert.deepEqual(
    said(`${imports(["Button"])} <Button className="cursor-default">x</Button>`),
    [],
  );
  assert.deepEqual(
    said(`${imports(["Button"])} <Button className="cursor-progress">x</Button>`),
    [],
  );
  assert.ok(!partData("Button").props.isLoading.cursor.true.includes("cursor-default"));
  // Prose's label sets its top padding only when it is given.
  assert.deepEqual(said(`${imports(["Prose"])} <Prose className="pt-200">x</Prose>`), []);
  const [labelled] = said(
    `${imports(["Prose"])} <Prose label="Notes" className="pt-200">x</Prose>`,
  );
  assert.match(
    labelled,
    /changes the padding its label prop sets\. Drop it; a different padding is a change to Prose\.$/,
  );
  // A value written beside the prop never asks for the prop.
  for (const message of said(
    `${imports(["Button", "Text"])} <><Button variant="primary" size="small" className="h-control-large font-body-large">x</Button><Text size="small" className="font-body-large">x</Text></>`,
  ))
    assert.doesNotMatch(message, /Drop it and set/, message);
  // What a part sets from props none of which is written, where that is known; and not where the
  // value needs a prop that is not written (Box's inverse text on a bold backgroundColor).
  assert.deepEqual(said(`${imports(["Box"])} <Box className="text-subtle">x</Box>`), []);
  assert.equal(said(`${imports(["Alert"])} <Alert className="bg-danger">x</Alert>`).length, 1);
});

test("a finding quotes at most 48 characters of what a part sets: every part's longest setting, through a forwarding component, fits 300", () => {
  const LIMIT = 300;
  const over = [];
  let checked = 0;
  for (const name of partNames()) {
    const record = partData(name);
    if (record.className === false) continue;
    const longest = Object.values(record.root ?? {}).sort(
      (a, z) => z.join(" ").length - a.join(" ").length,
    )[0];
    if (!longest) continue;
    // A class in the setting's group under a state, so the finding quotes the setting.
    const cls = `hover:${classesOf(longest[0])[0].base}`;
    // A component of the file, named as a product names one.
    const wrapper = `Summary${name.split(".").at(-1)}`;
    const code = `import * as L from "@ledger/design-system";\nfunction ${wrapper}({ className }) { return <L.${name} className={className} />; }\nexport const A = () => <${wrapper} className="${cls}" />;\n`;
    for (const { message, ruleId } of lint(code, { rules: only("no-restyle") })) {
      if (ruleId !== "ledger/no-restyle") continue;
      checked++;
      if (message.length > LIMIT) over.push(`${message.length} ${message}`);
    }
  }
  assert.ok(checked > 200, `${checked} findings rendered`);
  assert.deepEqual(over, []);
});

/* ---------- suggestions ---------- */

test("each suggestion writes the prop that renders the class it drops, parses, and runs under no --fix", () => {
  const sources = [
    [imports(["Text"]), '<Text className="tabular-nums">12</Text>'],
    [imports(["Text"]), '<Text className="min-w-0 tabular-nums shrink-0">12</Text>'],
    [imports(["Text"]), "<Text\n  className='text-subtle'\n>x</Text>"],
    [imports(["Table"]), '<Table.Header className="text-end">Due</Table.Header>'],
    [imports(["Button"]), '<Button className="w-full" variant="primary">Save</Button>'],
  ];
  let offered = 0;
  for (const [head, element] of sources) {
    const source = `${head}\nexport const A = () => (\n  ${element}\n);\n`;
    const config = [typescript, quiet, ...ledger.configs.recommended];
    const linter = new Linter({ cwd: repoRoot });
    const before = linter.verify(source, config, { filename: PRODUCT });
    const findings = before.filter(({ ruleId }) => ruleId === "ledger/no-restyle");
    assert.equal(findings.length, 1, element);
    const [{ suggestions = [] }] = findings;
    assert.equal(suggestions.length, 1, element);
    const [{ fix }] = suggestions;
    const output = source.slice(0, fix.range[0]) + fix.text + source.slice(fix.range[1]);
    offered++;
    // It parses as TSX, and no element carries an attribute twice.
    const file = ts.createSourceFile(
      "s.tsx",
      output,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    assert.equal(file.parseDiagnostics.length, 0, output);
    const after = linter.verify(output, config, { filename: PRODUCT });
    assert.equal(
      after.filter(({ ruleId }) => ruleId?.startsWith("ledger/")).length,
      0,
      `${output}\n${after.map(({ message }) => message).join("\n")}`,
    );
    for (const attributes of output.matchAll(/<[A-Z][\w.]*([^>]*)>/g)) {
      const names = [...attributes[1].matchAll(/\s([a-zA-Z]+)(?==|\s|$)/g)].map(([, n]) => n);
      assert.equal(new Set(names).size, names.length, output);
    }
    // A suggestion is never a fix.
    assert.equal(linter.verifyAndFix(source, config, { filename: PRODUCT }).output, source);
  }
  assert.equal(offered, sources.length);
});

test("no suggestion where the prop is not certain: a variant, a spread, a prop set, a template", () => {
  for (const element of [
    '<Text className="hover:tabular-nums md:tabular-nums">1</Text>',
    '<Text {...rest} className="tabular-nums">1</Text>',
    '<Text numeric={false} className="tabular-nums">1</Text>',
    "<Text className={`tabular-nums ${extra}`}>1</Text>",
    '<Text className={on ? "tabular-nums" : ""}>1</Text>',
    '<Box className="bg-surface-raised">1</Box>',
  ]) {
    const source = `${imports(["Text", "Box"])} export const A = ({ rest, extra, on }) => ${element};`;
    for (const { suggestions } of lint(source, { rules: only("no-restyle") }))
      assert.equal(suggestions, undefined, element);
  }
});

/* ---------- scope ---------- */

test("the kit's own source is never judged, and the package preset leaves the rule off", () => {
  const code =
    'import { Text } from "../primitives/text"; export const A = () => <Text className="tabular-nums" />;';
  assert.deepEqual(
    lint(code, {
      filename: path.join(packageRoot, "src/patterns/example.tsx"),
      settings: { ledger: { kit: "self" } },
      rules: only("no-restyle"),
    }),
    [],
  );
  for (const entry of ledger.configs.package)
    assert.equal(entry.rules?.["ledger/no-restyle"], undefined);
  assert.equal(ledger.configs.recommended[0].rules["ledger/no-restyle"], "error");
});

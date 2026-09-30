import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import ledger from "../eslint-plugin/index.js";
import { PART_TOKENS, PRESET_MAPS } from "../eslint-plugin/gate-rules.js";
import { tokens } from "../src/generated/tokens.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

function lint(source, name, options) {
  return new Linter({ cwd: "/repo" }).verify(
    source,
    {
      files: ["**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { ledger },
      rules: { [`ledger/${name}`]: options ? ["error", options] : "error" },
    },
    { filename: "/repo/src/screen.tsx" },
  );
}
const reports = (name, sources) =>
  sources.map((source) => {
    const messages = lint(source, name);
    assert.ok(
      messages.every((message) => message.ruleId === `ledger/${name}`),
      `${source}: ${messages.map((message) => message.message).join("; ")}`,
    );
    return messages.length;
  });
const kit = 'import { Button, DialogContent, IconButton } from "@ledger/design-system";';

test("autoFocus inside overlay content is rejected, in the element and in a component it renders", () => {
  assert.deepEqual(
    reports("no-overlay-autofocus", [
      `${kit} <DialogContent><Input autoFocus /></DialogContent>`,
      `${kit} <DialogContent>{open && <Input autoFocus={true} />}</DialogContent>`,
      "<SheetContent>{rows.map(() => <Input autoFocus />)}</SheetContent>",
      'import { PopoverContent as Pop } from "@ledger/design-system"; <Pop><Input autoFocus /></Pop>',
      "<PickerSheet><TextField autoFocus /></PickerSheet>",
      "function Body() { return <Input autoFocus />; } const A = () => <DialogContent><Body /></DialogContent>;",
      // A component nested in another, and one rendered by the overlay's content in turn.
      "function Page() { function Inner() { return <Input autoFocus />; } return <DialogContent><Inner /></DialogContent>; }",
      "function Fields() { return <Input autoFocus />; } function Form() { return <Fields />; } const A = () => <SheetContent><Form /></SheetContent>;",
    ]),
    [1, 1, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("no-overlay-autofocus", [
      "<Page><Input autoFocus /></Page>",
      `${kit} <DialogContent><Input autoFocus={false} /></DialogContent>`,
      "function Body() { return <Input autoFocus />; } const A = () => <Page><Body /></Page>;",
      `${kit} <DialogContent initialFocus={ref}><Input ref={ref} /></DialogContent>`,
      "function Page() { return <><Input autoFocus /><DialogContent><Other /></DialogContent></>; }",
    ]),
    [0, 0, 0, 0, 0],
  );
});

test("a disabled expression that reuses the isLoading flag is rejected", () => {
  assert.deepEqual(
    reports("no-disabled-while-loading", [
      "<Button isLoading={saving} disabled={saving}>Save</Button>",
      "<Button isLoading={save.isPending} disabled={save.isPending || !valid}>Save</Button>",
      "<Button isLoading={guard.busy} disabled={!ready || guard.busy}>Create</Button>",
      "<Button isLoading={saving} disabled={saving ? true : invalid}>Create</Button>",
      "const action = { label: 'Add', isLoading: adding, disabled: adding || none };",
    ]),
    [1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("no-disabled-while-loading", [
      "<Button isLoading={saving} disabled={!canEdit}>Save</Button>",
      "<Button isLoading={save.isPending} disabled={form.invalid}>Save</Button>",
      "<Button isLoading={saving}>Save</Button>",
      "<Button disabled={saving}>Save</Button>",
      "const action = { isLoading: adding, disabled: empty };",
    ]),
    [0, 0, 0, 0, 0],
  );
});

test("overlay content takes its width from the preset, not style or a width class", () => {
  assert.deepEqual(
    reports("overlay-width-preset", [
      `${kit} <DialogContent style={{ maxWidth: 620 }} />`,
      `${kit} <DialogContent style={{ width: "90vw", maxHeight: "90dvh" }} />`,
      '<SheetContent className="sm:max-w-layout-measure" />',
      "const wide = { maxWidth: 960 }; <DialogContent style={wide} />",
      '<AlertDialogContent className={cn("w-full", open && "max-w-layout-rail")} />',
    ]),
    [1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("overlay-width-preset", [
      `${kit} <DialogContent width="large" />`,
      '<SheetContent width="small" style={{ maxHeight: "var(--ds-dimension-layout-sheet)" }} />',
      "<DialogContent style={{ maxWidth: undefined }} />",
      '<PopoverContent className="w-layout-rail" />',
    ]),
    [0, 0, 0, 0],
  );
});

test('role="alert" on a plain element is rejected; Alert with an explicit role is not', () => {
  assert.deepEqual(
    reports("no-plain-alert-role", [
      '<p role="alert">Could not save.</p>',
      "<div role={'alert'}>Could not save.</div>",
    ]),
    [1, 1],
  );
  assert.deepEqual(
    reports("no-plain-alert-role", [
      '<Alert variant="destructive" role="alert">Could not save.</Alert>',
      '<p role="status">Saving…</p>',
      "<FieldError>Enter a title.</FieldError>",
    ]),
    [0, 0, 0],
  );
});

test("a Button that renders a link or only navigates is rejected in favour of LinkButton", () => {
  assert.deepEqual(
    reports("link-button-navigation", [
      `${kit} <Button render={<Link to="/programs" />}>Programs</Button>`,
      `${kit} <IconButton render={<a href="/x" />} label="Open" />`,
      `${kit} <Button render={<AppLink to="/x" />}>Open</Button>`,
      'import { Button as Action } from "@ledger/design-system"; <Action onClick={() => navigate({ to: "/work" })}>Open</Action>',
      `${kit} <Button onClick={() => { void router.navigate({ to: "/work" }); }}>Open</Button>`,
      `${kit} const go = () => window.location.assign("/x"); <Button onClick={go}>Open</Button>`,
      `${kit} <Button onClick={() => (window.location.href = "/x")}>Open</Button>`,
      `${kit} <IconButton render={(props) => <Link {...props} to="/x" />} label="Open" />`,
    ]),
    [1, 1, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("link-button-navigation", [
      '<LinkButton render={<Link to="/programs" />}>Programs</LinkButton>',
      `${kit} <Button onClick={() => { save(); navigate({ to: "/work" }); }}>Save and close</Button>`,
      `${kit} <Button onClick={open}>Open</Button>`,
      `${kit} <Button render={<span />}>Label</Button>`,
      '<Chip onClick={() => navigate({ to: "/x" })}>Local chip</Chip>',
    ]),
    [0, 0, 0, 0, 0],
  );
});

test("literal lengths, colours, weights and margins in style are rejected; computed values are not", () => {
  assert.deepEqual(
    reports("no-style-design-value", [
      "<div style={{ width: 240 }} />",
      '<div style={{ maxWidth: "620px" }} />',
      '<div style={{ color: "#e00" }} />',
      '<div style={{ background: "rgb(0 0 0 / 0.5)" }} />',
      "<div style={{ marginTop: 8 }} />",
      '<div style={{ margin: "0 auto 4px" }} />',
      "<div style={{ fontWeight: 600 }} />",
      '<div style={{ maxHeight: "calc(100dvh - 2rem)" }} />',
      "const box = { height: 84 }; <><div style={box} /><div style={box} /></>",
      "<div style={{ width: wide ? 320 : undefined }} />",
    ]),
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("no-style-design-value", [
      "<div style={{ width: measured }} />",
      "<div style={{ width: `${percent}%` }} />",
      '<div style={{ height: "var(--ds-space-200)" }} />',
      '<div style={{ maxWidth: "calc(100% - var(--ds-space-400))" }} />',
      '<div style={{ width: "100%", flex: 1, lineHeight: 1.2, zIndex: 2, opacity: 0.5 }} />',
      "<div style={{ margin: 0, padding: 0, width: 0 }} />",
      '<div style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} />',
      "<div style={{ color: token('color.text.subtle') }} />",
      '<rect style={{ fill: "url(#hatch-red)" }} />',
    ]),
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
  const [message] = lint(
    '<div style={{ gridTemplateColumns: "minmax(12rem, 1fr)" }} />',
    "no-style-design-value",
  );
  assert.match(message?.message ?? "", /a literal length \(12rem\)/);
});

test("the token lint reads classes(), className callbacks, class constants and *ClassName props", () => {
  const cases = [
    'const A = ({ className }) => <P className={classes("mt-4 w-[240px]", className)} />;',
    'const A = () => <P className={(state) => (state.open ? "text-[13px]" : "p-4")} />;',
    'const base = "mt-4"; const A = () => <P className={base} />;',
    'const A = () => <P triggerClassName="w-[240px]" />;',
    'const slots = { className: "text-red-500" };',
    'export const menuSeparator = "my-050 border-t border-default bg-border";',
    'const A = () => <DayPicker classNames={{ root: "text-red-500" }} />;',
  ];
  const counted = cases.map(
    (source) =>
      new Linter().verify(
        source,
        {
          files: ["**/*.tsx"],
          languageOptions: {
            parser: tseslint.parser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { ledger },
          rules: {
            "ledger/no-arbitrary-value": "error",
            "ledger/no-margin": "error",
            "ledger/no-non-token-class": "error",
          },
        },
        { filename: "part.tsx" },
      ).length,
  );
  assert.ok(
    counted.every((count) => count > 0),
    `every shape reports: ${counted}`,
  );
  // Conditions, slot keys and prose are not classes.
  for (const source of [
    'const pinned = sticky ? "start" : false; const A = () => <td className={cn("px-100", pinned && "sticky")} />;',
    'const A = () => <DayPicker classNames={{ root: "font-body", months: "flex" }} />;',
    'export const label = "Open the record";',
    'export const status = "draft";',
  ])
    assert.deepEqual(
      new Linter().verify(
        source,
        {
          files: ["**/*.tsx"],
          languageOptions: {
            parser: tseslint.parser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { ledger },
          rules: { "ledger/no-non-token-class": "error" },
        },
        { filename: "part.tsx" },
      ),
      [],
      source,
    );
});

test("a file's allowance hides that many reports, fails above it and asks to shrink below it", () => {
  const source = '<p role="alert">One</p>; <p role="alert">Two</p>;';
  assert.equal(lint(source, "no-plain-alert-role").length, 2);
  assert.equal(lint(source, "no-plain-alert-role", { allow: { "src/screen.tsx": 2 } }).length, 0);
  assert.equal(lint(source, "no-plain-alert-role", { allow: { "src/other.tsx": 2 } }).length, 2);
  const over = lint(source, "no-plain-alert-role", { allow: { "src/screen.tsx": 1 } });
  assert.equal(over.length, 2);
  assert.match(over[0].message, /allowance is 1/);
  const under = lint(source, "no-plain-alert-role", { allow: { "src/screen.tsx": 3 } });
  assert.equal(under.length, 1);
  assert.match(under[0].message, /Lower its allowance to 2/);
});

test("the kit's lint allowances name real rules and positive counts", () => {
  const allow = JSON.parse(fs.readFileSync(path.join(here, "lint-allow.json"), "utf8"));
  for (const [name, files] of Object.entries(allow)) {
    assert.ok(ledger.rules[name.replace(/^ledger\//, "")], `${name} is a ledger rule`);
    for (const [file, count] of Object.entries(files)) {
      assert.ok(fs.existsSync(path.join(here, "..", file)), `${file} exists`);
      assert.ok(Number.isInteger(count) && count > 0, `${name} ${file}: ${count}`);
    }
  }
});

test("TOO-14 false negatives: memo and forwardRef shadows, footers, TextLink without a destination, retired hooks", () => {
  assert.deepEqual(
    reports("no-kit-shadow", [
      "export const Button = memo(function Button() { return null; });",
      "const Dialog = React.forwardRef(function Dialog() { return null; });",
      "export default function Badge() { return null; }",
    ]),
    [1, 1, 1],
  );
  assert.deepEqual(
    reports("dialog-footer-order", [
      "<AlertDialogFooter><AlertDialogAction>Discard</AlertDialogAction><AlertDialogCancel>Keep editing</AlertDialogCancel></AlertDialogFooter>",
      '<SheetFooter><Button variant="primary">Apply</Button><SheetClose render={<Button variant="subtle" />}>Cancel</SheetClose></SheetFooter>',
      '<DialogFooter><DialogClose render={<Button variant="primary" />}>Done</DialogClose><DialogClose>Close</DialogClose></DialogFooter>',
    ]),
    [1, 1, 1],
  );
  assert.deepEqual(
    reports("dialog-footer-order", [
      "<AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction>Discard</AlertDialogAction></AlertDialogFooter>",
      '<DialogFooter><DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose><Button type="submit" variant="primary">Create task</Button></DialogFooter>',
    ]),
    [0, 0],
  );
  assert.deepEqual(
    reports("text-link-navigation", [
      "<TextLink>Open</TextLink>",
      '<TextLink href="/x">Open</TextLink>',
      "<TextLink {...link}>Open</TextLink>",
    ]),
    [1, 0, 0],
  );
  assert.deepEqual(
    reports("no-deprecated-name", [
      'import { useDensity } from "@ledger/design-system";',
      'import { densityScript as script } from "@ledger/design-system";',
      'import * as Kit from "@ledger/design-system"; <Kit.Shell.Sidebar />',
      'import { Shell } from "@ledger/design-system"; <Shell.SideNav />',
    ]),
    [1, 1, 1, 0],
  );
});

test("a link that opens a new tab says so: TextLink newTab, not a raw target (CNT-18)", () => {
  const kitLink = 'import { TextLink, PreviewNavigation } from "@ledger/design-system";';
  assert.deepEqual(
    reports("prefer-text-link", [
      '<a href="https://example.test" target="_blank" rel="noreferrer">Source</a>',
      '<Link to="/x" target="_blank">Open</Link>',
      `${kitLink} <TextLink href="/x" target="_blank">Open</TextLink>`,
      `${kitLink} <TextLink render={<Link to="/x" target="_blank" />}>Open</TextLink>`,
    ]),
    [1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("prefer-text-link", [
      `${kitLink} <TextLink href="/x" newTab>Open</TextLink>`,
      `${kitLink} <TextLink newTab render={<Link to="/x" target="_blank" />}>Open</TextLink>`,
      // A part that announces the new tab itself holds the link in a prop.
      `${kitLink} <PreviewNavigation openLink={<Link to="/x" target="_blank" />} />`,
      `${kitLink} <PreviewNavigation openLink={given ?? <Link to="/x" target="_blank" />} />`,
      '<a href="/x">Same tab</a>',
    ]),
    [0, 0, 0, 0, 0],
  );
});

test("a primitive's layout is its props, and text elements take no layout classes (PRM-7)", () => {
  const kitLayout = 'import { Box, Grid, Inline, Stack } from "@ledger/design-system";';
  assert.deepEqual(
    reports("use-primitives", [
      `${kitLayout} <Stack className="pt-200">x</Stack>`,
      `${kitLayout} <Box className="px-150 gap-100">x</Box>`,
      `${kitLayout} <Grid className="grid-cols-2">x</Grid>`,
      `${kitLayout} <Inline className="flex">x</Inline>`,
      '<p className="flex gap-100">x</p>',
      '<label className="px-100">x</label>',
      '<h2 className="grid">x</h2>',
    ]),
    [1, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("use-primitives", [
      `${kitLayout} <Box padding="space.200" className="min-w-0">x</Box>`,
      // A container query, responsive visibility and a breakpoint's spacing are what the props
      // cannot key: padding, space and gap take one token.
      `${kitLayout} <Grid className="grid-cols-1 @4xl:grid-cols-3">x</Grid>`,
      `${kitLayout} <Inline className="hidden @3xl:flex">x</Inline>`,
      `${kitLayout} <Box className="md:px-300">x</Box>`,
      `${kitLayout} <Stack className="sm:gap-200">x</Stack>`,
      `${kitLayout} <Grid className="gap-px">x</Grid>`,
      // A local component that shares a primitive's name is not the kit's.
      '<Stack className="pt-200">x</Stack>',
      '<p className="text-subtle">x</p>',
    ]),
    [0, 0, 0, 0, 0, 0, 0, 0],
  );
  // The message names a prop the part has, with its value: only Box takes padding.
  const message = (source) => lint(source, "use-primitives")[0]?.message ?? "";
  assert.match(
    message(`${kitLayout} <Stack className="pt-200">x</Stack>`),
    /Wrap it in <Box paddingBlockStart="space\.200"> \(a Stack has no padding\)/,
  );
  assert.match(message(`${kitLayout} <Box className="pt-200">x</Box>`), /paddingBlockStart/);
  assert.match(message(`${kitLayout} <Inline className="gap-100">x</Inline>`), /Use space/);
  assert.match(
    message(`${kitLayout} <Grid className="md:grid-cols-3">x</Grid>`),
    /templateColumns/,
  );
});

test("renamed props and values are reported on kit parts and fixed one to one", () => {
  const kitParts =
    'import { Card, Chart, DropdownMenuItem, Item, SelectTrigger, Switch, Tree } from "@ledger/design-system";';
  const fixed = (source) =>
    new Linter({ cwd: "/repo" }).verifyAndFix(
      source,
      {
        files: ["**/*.tsx"],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { ledger },
        rules: { "ledger/no-deprecated-name": "error" },
      },
      { filename: "/repo/src/screen.tsx" },
    ).output;
  assert.deepEqual(
    reports("no-deprecated-name", [
      `${kitParts} <Switch size="sm" />`,
      `${kitParts} <SelectTrigger size={"default"} />`,
      `${kitParts} <Card size="sm" />`,
      `${kitParts} <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>`,
      `${kitParts} <Item.Group labelledBy="h" />`,
      `${kitParts} <Chart.Donut label="75%" />`,
      `${kitParts} <Chart.Scatter name="x" />`,
      `${kitParts} <Chart.Frame status="loading" />`,
      `${kitParts} <Chart.Area baseline={0} />`,
      `${kitParts} <Tree.Item expanded />`,
      // A removed page shape is reported where it is imported.
      'import { ShowPage } from "@ledger/design-system";',
      'import { controlBase } from "@ledger/design-system";',
    ]),
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    reports("no-deprecated-name", [
      `${kitParts} <Switch size="small" />`,
      `${kitParts} <Card size="medium" />`,
      `${kitParts} <DropdownMenuItem variant="danger">Remove</DropdownMenuItem>`,
      `${kitParts} <Chart.Donut centerLabel="75%" />`,
      // Local components that share a kit name keep their own props.
      '<Switch size="sm" />',
      "function Panel() { return null; } <Panel />",
    ]),
    [0, 0, 0, 0, 0, 0],
  );
  assert.match(fixed(`${kitParts} <Switch size="sm" />`), /<Switch size="small" \/>/);
  assert.match(fixed(`${kitParts} <SelectTrigger size={"default"} />`), /size=\{"medium"\}/);
  assert.match(fixed(`${kitParts} <Item.Group labelledBy="h" />`), /aria-labelledby="h"/);
  assert.match(fixed(`${kitParts} <Tree.Item expanded />`), /<Tree\.Item isExpanded \/>/);
});

test("the structural list takes overflow-wrap and the chart library's classes, and no undefined layout class", () => {
  assert.deepEqual(
    reports("no-non-token-class", [
      '<p className="wrap-anywhere">x</p>',
      '<p className="wrap-break-word wrap-normal">x</p>',
      '<text className="recharts-cartesian-axis-tick-value">x</text>',
    ]),
    [0, 0, 0],
  );
  assert.deepEqual(reports("no-non-token-class", ['<div className="grid-cols-main-rail" />']), [1]);
});

test("the product's lint allowances name real rules, files and positive counts", () => {
  const allow = JSON.parse(
    fs.readFileSync(path.join(here, "../../../scripts/lint-allow.json"), "utf8"),
  );
  for (const [name, files] of Object.entries(allow)) {
    if (name === "about") continue;
    assert.ok(ledger.rules[name.replace(/^ledger\//, "")], `${name} is a ledger rule`);
    for (const [file, count] of Object.entries(files)) {
      assert.ok(fs.existsSync(path.join(here, "../../..", file)), `${file} exists`);
      assert.ok(Number.isInteger(count) && count > 0, `${name} ${file}: ${count}`);
    }
  }
});

test("the kit's suppressed reports name files that exist", () => {
  const suppressions = JSON.parse(
    fs.readFileSync(path.join(here, "../eslint-suppressions.json"), "utf8"),
  );
  for (const [file, rules] of Object.entries(suppressions)) {
    assert.ok(fs.existsSync(path.join(here, "..", file)), `${file} exists`);
    for (const [rule, { count }] of Object.entries(rules)) {
      assert.ok(!rule.startsWith("ledger/"), `${rule}: ledger rules keep test/lint-allow.json`);
      assert.ok(Number.isInteger(count) && count > 0, `${file} ${rule}: ${count}`);
    }
  }
});

test("the plugin's version is the package's, so an ESLint cache refreshes when rules change", () => {
  const { version } = JSON.parse(fs.readFileSync(path.join(here, "../package.json"), "utf8"));
  assert.equal(ledger.meta.version, version);
});

test("the gate rules are errors in the product preset and the kit's own where they apply", () => {
  const recommended = Object.assign({}, ...ledger.configs.recommended.map((c) => c.rules));
  for (const name of [
    "no-overlay-autofocus",
    "no-disabled-while-loading",
    "overlay-width-preset",
    "no-plain-alert-role",
    "link-button-navigation",
    "no-style-design-value",
  ])
    assert.equal(recommended[`ledger/${name}`], "error", name);
  const kitRules = ledger.configs.package[0].rules;
  assert.equal(kitRules["ledger/no-plain-alert-role"], undefined, "the kit renders its own alerts");
  for (const name of ["no-overlay-autofocus", "link-button-navigation", "overlay-width-preset"])
    assert.ok(kitRules[`ledger/${name}`], name);
});

/* ---------- batch 5: style follows the value, colours outside style ---------- */

/** A kit file's findings of one rule under the package preset as the kit's lint scopes it,
    without its allowances; `source` stands in for the file's own text when given. */
function kitFindings(file, rule, source) {
  const packageRoot = path.join(here, "..");
  const config = [
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
    },
    ...ledger.configs.package.map((entry) => ({ files: ["src/**/*.{ts,tsx}"], ...entry })),
    { files: ["src/**/*.{ts,tsx}"], rules: { [`ledger/${rule}`]: "error" } },
  ];
  const at = path.join(packageRoot, "src", file);
  return new Linter({ cwd: packageRoot })
    .verify(source ?? fs.readFileSync(at, "utf8"), config, { filename: at })
    .filter(({ ruleId }) => ruleId === `ledger/${rule}`);
}

test("the Dialog and Sheet preset maps' widths and heights are the only style literals exempt, each in its own file", () => {
  // The exemption is pinned: two maps, by file and name, and each is where it says.
  assert.deepEqual(PRESET_MAPS, {
    "components/dialog.tsx": "dialogWidths",
    "components/sheet.tsx": "sheetWidths",
  });
  for (const [file, name] of Object.entries(PRESET_MAPS)) {
    const source = fs.readFileSync(path.join(here, "../src", file), "utf8");
    assert.match(source, new RegExp(`^const ${name}: Record<`, "m"), `${file} declares ${name}`);
    assert.deepEqual(kitFindings(file, "no-style-design-value"), [], file);
    // The same map is exempt in its own file by its own name, and reported in another file or
    // under another name.
    const map = (called) =>
      `import type { CSSProperties } from "react"; const ${called}: Record<"small", CSSProperties> = { small: { maxWidth: 400 } };`;
    assert.equal(kitFindings(file, "no-style-design-value", map(name)).length, 0, file);
    assert.equal(kitFindings(file, "no-style-design-value", map(`${name}Copy`)).length, 1, file);
    assert.equal(
      kitFindings("components/popover.tsx", "no-style-design-value", map(name)).length,
      1,
      `${name} outside ${file}`,
    );
    // Only a step's widths and heights: a colour, a padding or a custom property in the map is
    // read as anywhere else.
    const dressed = `import type { CSSProperties } from "react"; const ${name}: Record<"small", CSSProperties> = { small: { maxWidth: 400, height: "calc(100dvh - 2rem)", color: "#f00", padding: 24, borderRadius: 12, "--glow": "tomato" } as CSSProperties };`;
    assert.deepEqual(
      kitFindings(file, "no-style-design-value", dressed).map(({ messageId }) => messageId),
      ["colour", "spaceLength", "length", "customColour"],
      file,
    );
  }
});

test("a viewport length is structure; a design value beside it is not", () => {
  assert.deepEqual(
    reports("no-style-design-value", [
      '<div style={{ height: "100dvh", width: "90vw", minHeight: "100svh", maxWidth: "50vmin" }} />',
      '<div style={{ top: "min(var(--ds-space-1000), 10dvh)" }} />',
      "<div style={{ maxHeight: `calc(100dvh - ${top} - var(--ds-space-200))` }} />",
    ]),
    [0, 0, 0],
  );
  const [message] = lint(
    '<div style={{ maxHeight: "calc(100dvh - 2rem)" }} />',
    "no-style-design-value",
  );
  assert.match(message?.message ?? "", /a literal length \(2rem\)/);
});

test("a finding says where a literal came from, and names a token only by its role", () => {
  const [indent] = lint(
    "const INDENT = 16;\nexport const A = ({ offset }) => <div style={{ paddingInlineStart: offset + INDENT }} />;",
    "no-style-design-value",
  );
  assert.match(indent.message, /\(16px, from INDENT on line 1\)/);
  assert.match(indent.message, /On the spacing scale 16px is space\.200: token\("space\.200"\)\./);
  // A width's role is not its property's, so no token of its value is named.
  const [width] = lint("<div style={{ width: 288 }} />", "no-style-design-value");
  assert.doesNotMatch(width.message, /token\(|dimension\./);
  // A literal a call hands a helper is said where the call is, never as the component's const.
  const [helper] = lint(
    "const box = (w) => ({ width: w });\nexport const A = () => <div style={box(288)} />;",
    "no-style-design-value",
  );
  assert.match(helper.message, /\(288px, from line 2\)/);
});

test("a factor is a count, named or written in place; a sum's named number and a unit's number are lengths", () => {
  assert.deepEqual(
    reports("no-style-design-value", [
      // A count times a token-derived or a measured length (review p15).
      'import { tokenLiterals } from "@ledger/design-system"; const ROW = Number.parseFloat(tokenLiterals["dimension.control.medium"]); const VISIBLE_ROWS = 8; export const L = () => <div style={{ maxHeight: VISIBLE_ROWS * ROW }} />;',
      "const DAYS = 7; export const C = ({ cell }) => <div style={{ width: DAYS * cell }} />;",
      "export const C = ({ depth }) => <div style={{ paddingInlineStart: depth * 16 }} />;",
      "const INDENT = 16; export const C = ({ depth }) => <div style={{ paddingInlineStart: depth * INDENT }} />;",
      // Every factor written: a literal.
      "const DAYS = 7; const CELL = 32; export const C = () => <div style={{ width: DAYS * CELL }} />;",
      // A number before a unit, in a template, a concatenation or through a helper.
      "const W = 288; export const P = () => <div style={{ width: `${W}px` }} />;",
      'export const P = () => <div style={{ width: 288 + "px" }} />;',
      "const px = (n) => `${n}px`; export const P = () => <div style={{ width: px(288) }} />;",
      // A sum's named number, and one written in it.
      "const GAP = 8; export const P = ({ top }) => <div style={{ top: top + GAP }} />;",
      "export const P = ({ top }) => <div style={{ top: top - 8 }} />;",
    ]),
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  );
});

test("each part token names its part and the files that draw it, and the kit reads it nowhere else", () => {
  const partTokens = Object.keys(tokens).filter((name) => name.startsWith("dimension.part."));
  assert.deepEqual(Object.keys(PART_TOKENS).sort(), partTokens.sort());
  const src = path.join(here, "../src");
  const files = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? ["generated", "stories"].includes(entry.name)
            ? []
            : files(path.join(dir, entry.name))
          : /\.tsx?$/.test(entry.name)
            ? [path.join(dir, entry.name)]
            : [],
      );
  const readers = new Map(partTokens.map((name) => [name, new Set()]));
  for (const file of files(src)) {
    const text = fs.readFileSync(file, "utf8");
    for (const [, name] of text.matchAll(/token(?:Value)?\("(dimension\.part\.\w+)"\)/g))
      readers.get(name)?.add(path.relative(src, file).split(path.sep).join("/"));
  }
  for (const [name, { part, files: homes }] of Object.entries(PART_TOKENS)) {
    assert.ok(part, `${name} names its part`);
    for (const home of homes) assert.ok(fs.existsSync(path.join(src, home)), `${home} exists`);
    assert.deepEqual(
      [...readers.get(name)].sort(),
      [...homes].sort(),
      `${name} is read in its files`,
    );
  }
});

test("a kit overlay sized by its own part token passes overlay-width-preset in that part's file only", () => {
  const command =
    'import { DialogContent } from "./dialog"; import { token } from "../generated/tokens"; export const A = () => <DialogContent style={{ maxWidth: token("dimension.part.command") }} />;';
  assert.deepEqual(kitFindings("components/command.tsx", "overlay-width-preset", command), []);
  // Another part's file, another token, or a part token outside the kit, is a width like any other.
  assert.equal(kitFindings("patterns/example.tsx", "overlay-width-preset", command).length, 1);
  assert.equal(
    kitFindings(
      "components/command.tsx",
      "overlay-width-preset",
      command.replace("dimension.part.command", "dimension.part.popover"),
    ).length,
    1,
  );
  // The part's own size prop falling back to its token: PreviewSheet's today.
  assert.deepEqual(kitFindings("patterns/preview-sheet.tsx", "overlay-width-preset"), []);
  assert.deepEqual(
    reports("overlay-width-preset", [
      'import { DialogContent, token } from "@ledger/design-system"; <DialogContent style={{ maxWidth: token("dimension.part.command") }} />',
    ]),
    [1],
  );
});

test("no-raw-colour runs in both presets and in the kit's stories; a <style> element is reported in both", () => {
  const recommended = Object.assign({}, ...ledger.configs.recommended.map((c) => c.rules));
  assert.equal(recommended["ledger/no-raw-colour"], "error");
  assert.equal(ledger.configs.package[0].rules["ledger/no-raw-colour"], "error");
  for (const entry of ledger.configs.package.slice(1))
    assert.equal(entry.rules?.["ledger/no-raw-colour"], undefined, `${entry.files} turns it off`);
  assert.equal(recommended["ledger/no-style-design-value"], "error");
  assert.ok(ledger.configs.package[0].rules["ledger/no-style-design-value"]);
  assert.deepEqual(
    reports("no-raw-colour", [
      '<svg><rect fill="#f00" /></svg>',
      'import { Bar } from "recharts"; <Bar dataKey="v" fill="rebeccapurple" />',
      'const COLORS = ["#0088FE", "#00C49F"];',
      '<rect fill={token("color.chart.brand")} stroke="currentColor" />',
      "<DataTable fill={fill} />",
      'const hues = ["blue", "teal"];',
    ]),
    [1, 1, 1, 0, 0, 0],
  );
});

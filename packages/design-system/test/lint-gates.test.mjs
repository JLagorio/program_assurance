import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import ledger from "../eslint-plugin/index.js";

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

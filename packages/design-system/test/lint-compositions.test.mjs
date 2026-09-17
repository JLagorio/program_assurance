import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import ledger from "../eslint-plugin/index.js";

function lint(source, name) {
  return new Linter().verify(source, {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { ledger },
    rules: { [`ledger/${name}`]: "error" },
  });
}

test("native confirmation is rejected while domain commands named confirm remain valid", () => {
  for (const source of [
    'window.confirm("Discard?")',
    'globalThis["confirm"]("Discard?")',
    'confirm("Discard?")',
    'self.confirm("Discard?")',
  ])
    assert.equal(lint(source, "no-native-confirm").length, 1, source);
  for (const source of [
    "async function confirm() {} confirm();",
    "const confirm = async () => true; confirm();",
    "function act(confirm) { return confirm(); }",
    "workflow.confirm();",
  ])
    assert.deepEqual(lint(source, "no-native-confirm"), [], source);
});

test("TextLink accepts anchors and router adapters, not action elements", () => {
  for (const source of [
    "<TextLink render={<button onClick={open} />}>Open</TextLink>",
    'import { TextLink as Navigation } from "@ledger/design-system"; <Navigation render={<span />}>Open</Navigation>',
    'import * as Kit from "@ledger/design-system"; <Kit.TextLink render={<Kit.Button />}>Open</Kit.TextLink>',
  ])
    assert.equal(lint(source, "text-link-navigation").length, 1, source);
  for (const source of [
    '<TextLink render={<a href="/records" />}>Records</TextLink>',
    '<TextLink render={<Link to="/records" />}>Records</TextLink>',
    "<TextLink render={<AppRecordLink record={record} />}>Record</TextLink>",
    '<Button variant="link" onClick={open}>Preview</Button>',
  ])
    assert.deepEqual(lint(source, "text-link-navigation"), [], source);
});

test("dialog footer keeps Cancel before the primary, including fragments and imported aliases", () => {
  for (const source of [
    '<DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></DialogFooter>',
    'import { DialogFooter as Footer } from "@ledger/design-system"; <Footer><><Button variant="primary">Create task</Button>{canCancel && <Button>Cancel</Button>}</></Footer>',
  ])
    assert.equal(lint(source, "dialog-footer-order").length, 1, source);
  for (const source of [
    '<DialogFooter><Button>Cancel</Button><Button variant="primary">Create task</Button></DialogFooter>',
    '<DialogFooter><Button variant="primary">Done</Button></DialogFooter>',
    '<DialogFooter>{readOnly ? <Button variant="primary">Close</Button> : <Button>Cancel</Button>}</DialogFooter>',
    '<Inline><Button variant="primary">Create task</Button><Button>Cancel</Button></Inline>',
  ])
    assert.deepEqual(lint(source, "dialog-footer-order"), [], source);
});

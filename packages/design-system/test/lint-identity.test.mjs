// Which kit part a tag is (eslint-plugin/identity.js), asked directly: the strict identity the
// class-policy rules use, the name the behaviour rules judge by, and the part the classes on an
// element land on through `render`. Each snippet is linted with a probe rule that records the
// answers for every JSX element, in source order.
import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import {
  classOwnerOf,
  jsxTag,
  kitBindingOf,
  kitPartOf,
  partNameOf,
} from "../eslint-plugin/identity.js";
import { KIT, KIT_SETTINGS, PRODUCT, REPO, STORY } from "./lint-helpers.mjs";

/** Every JSX element's answers, and every member expression's kit part, for one snippet. */
function ask(code, { filename = PRODUCT, settings, sources } = {}) {
  const elements = [];
  const members = [];
  const probe = {
    meta: { schema: [] },
    create: (context) => ({
      JSXOpeningElement(node) {
        elements.push({
          tag: jsxTag(node.name),
          part: kitPartOf(context, node.name),
          name: partNameOf(context, node.name),
          bound: kitBindingOf(context, node.name, { sources }),
          owner: classOwnerOf(context, node),
        });
      },
      "MemberExpression:exit"(node) {
        if (node.parent.type !== "MemberExpression")
          members.push({ part: kitPartOf(context, node), name: partNameOf(context, node) });
      },
    }),
  };
  const messages = new Linter({ cwd: REPO }).verify(
    code,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { identity: { rules: { probe } } },
      rules: { "identity/probe": "error" },
      ...(settings && { settings }),
    },
    { filename },
  );
  const fatal = messages.find((message) => message.fatal);
  if (fatal) throw new Error(`${fatal.message} in ${code}`);
  return { elements, members };
}
const parts = (code, options) => ask(code, options).elements.map(({ part }) => part);
const names = (code, options) => ask(code, options).elements.map(({ name }) => name);
const owners = (code, options) => ask(code, options).elements.map(({ owner }) => owner);

const KIT_IMPORT = 'from "@ledger/design-system";';

test("a product's part is an import from exactly the package, aliases and namespaces resolved", () => {
  assert.deepEqual(
    parts(
      `import { Table as T, Id as Code, Shell } ${KIT_IMPORT} import * as L ${KIT_IMPORT} <><T.Cell /><Code /><L.Table.Cell /><L.Id /><Shell.TopNav.Item /><L.Shell.SideNav.Section /></>;`,
    ),
    ["Table.Cell", "Id", "Table.Cell", "Id", "Shell.TopNav.Item", "Shell.SideNav.Section"],
  );
  // A namespace alone, or a member the package does not export, is no part.
  assert.deepEqual(parts(`import * as L ${KIT_IMPORT} <><L /><L.Nope /><L.cn /></>;`), [
    "",
    "",
    "",
  ]);
  // Another source, a subpath of the package and a relative file are the product's own.
  assert.deepEqual(
    parts(
      'import { Table } from "other-kit"; import { Button } from "./button"; import { Id } from "@ledger/design-system/cn"; <><Table.Cell /><Button /><Id /></>;',
    ),
    ["", "", ""],
  );
});

test("a type-only import, a look-alike, a parameter and a lowercase tag are no kit part", () => {
  assert.deepEqual(
    parts(
      `import type { Button } ${KIT_IMPORT} import { type IconButton } ${KIT_IMPORT} <><Button /><IconButton /></>;`,
    ),
    ["", ""],
  );
  assert.deepEqual(
    parts(
      `import { Button, Table } ${KIT_IMPORT} function Local(Button) { return <Button />; } function Table2() { const Table = {}; return <Table.Cell />; } <><Button /><button /></>;`,
    ),
    ["", "", "Button", ""],
  );
  assert.deepEqual(
    parts('function Table() { return null; } export const B = () => <Table.Cell className="x" />;'),
    [""],
  );
});

test("a behaviour rule's name keeps a look-alike's and drops a parameter or a shadowing local", () => {
  assert.deepEqual(
    names(
      `import { Button as Action } ${KIT_IMPORT} import { Dialog } from "other-kit"; function A(Action, a) { function Inner() { const DialogContent = x; return <DialogContent />; } return <><Action /><a /></>; } const DialogContent = () => null; <><Action /><Dialog.Popup /><DialogContent /><Undeclared.Part /></>;`,
    ),
    // Inner's DialogContent shadows the module's; A's Action is a parameter; `a` is the element.
    ["", "", "a", "Button", "Dialog.Popup", "DialogContent", "Undeclared.Part"],
  );
  // A local in a function that shadows nothing keeps its name.
  assert.deepEqual(names("function A() { const Dialog = x; return <Dialog />; }"), ["Dialog"]);
  // An import from the kit of a name it no longer exports resolves to that name.
  assert.deepEqual(
    names(`import { Tiles as T } ${KIT_IMPORT} import * as K ${KIT_IMPORT} <><T /><K.Tiles /></>;`),
    ["Tiles", "Tiles"],
  );
});

test("a type of a part's name hides no part: a type parameter, a local type alias or interface", () => {
  const code = `import { Id, Table, Button, DialogContent } ${KIT_IMPORT} export function A<Id extends string, DialogContent>() { type Table = number; interface Button { x: 1 } return <><Id /><Table.Cell /><Button /><DialogContent /></>; }`;
  assert.deepEqual(parts(code), ["Id", "Table.Cell", "Button", "DialogContent"]);
  assert.deepEqual(names(code), ["Id", "Table.Cell", "Button", "DialogContent"]);
  // A local value of the name still shadows the import, and an outer type does not make an inner
  // value a shadow.
  assert.deepEqual(
    names(
      `import { Button } ${KIT_IMPORT} export function A() { const Button = x; return <Button />; }`,
    ),
    [""],
  );
  assert.deepEqual(
    names("type Dialog = string; export function A() { const Dialog = x; return <Dialog />; }"),
    ["Dialog"],
  );
});

test("a behaviour rule judges another package's part by the name it imports", () => {
  assert.deepEqual(
    names(
      'import { DialogContent as Content } from "@/components/ui/dialog"; import * as UI from "@/components/ui/dialog"; import { Button as Btn } from "other-kit"; import Sheet from "other-kit/sheet"; <><Content /><UI.DialogContent /><Btn /><Sheet.Content /><UI /></>;',
    ),
    ["DialogContent", "DialogContent", "Button", "Sheet.Content", ""],
  );
  // The class-policy identity stays the kit's alone.
  assert.deepEqual(
    parts('import { DialogContent as Content } from "@/components/ui/dialog"; <Content />;'),
    [""],
  );
});

test("kitBindingOf holds only for a binding to the kit or a named source", () => {
  const code =
    'import { Shell } from "@/components/app/shell"; import { Shell as Kit } from "@ledger/design-system"; const Local = {}; <><Shell.NavItem /><Kit.NavItem /><Local.NavItem /></>;';
  assert.deepEqual(
    ask(code).elements.map(({ bound }) => bound),
    ["", "Shell.NavItem", ""],
  );
  assert.deepEqual(
    ask(code, { sources: /\/shell$/ }).elements.map(({ bound }) => bound),
    ["Shell.NavItem", "Shell.NavItem", ""],
  );
});

test("a member chain resolves as a tag does", () => {
  const { members } = ask(
    `import * as Kit ${KIT_IMPORT} import { Shell as S } ${KIT_IMPORT} const a = Kit.Shell.Sidebar; const b = S.TopBar; const c = props.Shell.Sidebar; const d = Kit["Shell"].Sidebar;`,
  );
  assert.deepEqual(
    members.map(({ part }) => part),
    ["Shell.Sidebar", "Shell.TopBar", "", ""],
  );
  assert.deepEqual(members.at(2).name, "props.Shell.Sidebar");
});

/* ---------- the kit's own source ---------- */

const COMPONENT = KIT; // packages/design-system/src/components/example.tsx
const kit = (code, filename = COMPONENT) => parts(code, { filename, settings: KIT_SETTINGS });

test("inside the kit, a relative import into its src is the part, by every shape the kit uses", () => {
  assert.deepEqual(
    kit(
      'import { Button } from "./button"; import { Stack as Column } from "../primitives/stack"; import { DataTable } from "../patterns"; import { Shell } from "../layout/shell"; <><Button /><Column /><DataTable /><Shell.TopNav.Item /></>;',
    ),
    ["Button", "Stack", "DataTable", "Shell.TopNav.Item"],
  );
  // A story imports the barrels and the package's index.
  assert.deepEqual(
    kit(
      'import { Button } from "../../components"; import { Stack } from "../../primitives"; import { Table } from "../.."; import * as Kit from "../../components"; <><Button /><Stack /><Table.Cell /><Kit.Id /></>;',
      STORY.replace("Example.stories.tsx", "components/Example.stories.tsx"),
    ),
    ["Button", "Stack", "Table.Cell", "Id"],
  );
});

test("inside the kit, stories/, lib/, a file outside src and an unknown name are no part", () => {
  assert.deepEqual(
    kit(
      'import { Pair } from "../_lib/pair"; import { Button } from "../../stories/button"; import { Table } from "../lib/table"; import { Id } from "../../../../src/components/id"; import { Helper } from "./helper"; <><Pair /><Button /><Table.Cell /><Id /><Helper /></>;',
      STORY.replace("Example.stories.tsx", "components/Example.stories.tsx"),
    ),
    ["", "", "", "", ""],
  );
  // Without the package preset's settings the same file is a product's.
  assert.deepEqual(
    parts('import { Button } from "./button"; <Button />;', { filename: COMPONENT }),
    [""],
  );
});

test("inside the kit, a top-level declaration of the file is the part it is named for", () => {
  assert.deepEqual(
    kit(
      "export function Table() { return null; } const Stack = forwardRef(() => null); function Local() { return null; } function Wrap() { const Button = x; return <Button />; } <><Table.Cell /><Stack /><Local /></>;",
    ),
    ["", "Table.Cell", "Stack", ""],
  );
  // The same file linted as a product's has no part of its own.
  assert.deepEqual(parts("function Table() { return null; } <Table.Cell />;"), [""]);
  // A story's or a helper's own component of a part's name is no part: stories/, lib/ and any
  // *.stories file declare look-alikes.
  const declared =
    "function Button() { return null; } function TextLink() { return null; } <><Button /><TextLink /></>;";
  for (const file of [
    STORY,
    STORY.replace("Example.stories.tsx", "components/Example.stories.tsx"),
    path.join(REPO, "packages/design-system/src/lib/announce.tsx"),
    path.join(REPO, "packages/design-system/src/components/button.stories.tsx"),
  ])
    assert.deepEqual(kit(declared, file), ["", ""], file);
});

test("the kit is the src folder the file sits in, wherever it is checked out", () => {
  // Another checkout of the kit, not the one the plugin was loaded from.
  const elsewhere = path.join(REPO, "checkout/ledger/src/patterns/probe.tsx");
  assert.deepEqual(
    kit('import { DialogContent } from "../components/dialog"; <DialogContent />;', elsewhere),
    ["DialogContent"],
  );
});

/* ---------- render ---------- */

test("the classes on an element land on what its render puts in its place", () => {
  const imports = `import { Button, DialogTrigger, DialogTrigger as Trigger } ${KIT_IMPORT}`;
  const owner = (element) => owners(`${imports} ${element};`)[0];
  const button = (wrapper) => ({ part: "Button", via: "render", wrapper });
  const self = (part) => ({ part, via: "self", wrapper: "" });
  assert.deepEqual(
    owner('<DialogTrigger render={<Button />} className="bg-danger-bold" />'),
    button("DialogTrigger"),
  );
  assert.deepEqual(
    owner("<DialogTrigger render={(props) => <Button {...props} />} />"),
    button("DialogTrigger"),
  );
  assert.deepEqual(
    owner("<DialogTrigger render={(props) => { return <Button {...props} />; }} />"),
    button("DialogTrigger"),
  );
  assert.deepEqual(
    owner("<DialogTrigger render={({ children, ...rest }) => <Button {...rest} />} />"),
    button("DialogTrigger"),
  );
  // The wrapper is named as the kit names it, or as written.
  assert.deepEqual(owner("<Trigger render={<Button />} />"), button("DialogTrigger"));
  assert.deepEqual(owner("<Slot render={<Button />} />"), button("Slot"));
  // A function that does not hand its props on, one that takes className out of them, and a
  // render element that is no kit part leave the classes on the element itself.
  assert.deepEqual(owner("<DialogTrigger render={(item) => <Button />} />"), self("DialogTrigger"));
  assert.deepEqual(
    owner("<DialogTrigger render={({ className, ...rest }) => <Button {...rest} />} />"),
    self("DialogTrigger"),
  );
  assert.deepEqual(owner('<Button render={<a href="/x" />} />'), self("Button"));
  assert.deepEqual(owner("<Slot render={<span />} />"), self(""));
});

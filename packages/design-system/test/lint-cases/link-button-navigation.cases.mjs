// ledger/link-button-navigation: navigation that looks like a button is LinkButton or
// LinkIconButton, not a Button that renders a link or only navigates.
import { kitImport } from "../lint-helpers.mjs";

const kit = kitImport("Button", "IconButton");
const button = { part: "Button", replacement: "LinkButton" };
const iconButton = { part: "IconButton", replacement: "LinkIconButton" };

export default {
  valid: [
    { code: '<LinkButton render={<Link to="/programs" />}>Programs</LinkButton>' },
    {
      code: `${kit} <Button onClick={() => { save(); navigate({ to: "/work" }); }}>Save and close</Button>`,
    },
    { code: `${kit} <Button onClick={open}>Open</Button>` },
    { code: `${kit} <Button render={<span />}>Label</Button>` },
    // Not a button part.
    { code: '<Chip onClick={() => navigate({ to: "/x" })}>Local chip</Chip>' },
    // A parameter that shadows the import is no Button at all.
    {
      code: `${kit} export function Row(Button) { return <Button render={<Link to="/x" />}>Open</Button>; }`,
    },
  ],
  invalid: [
    {
      code: `${kit} <Button render={<Link to="/programs" />}>Programs</Button>`,
      errors: [{ messageId: "rendersLink", data: { ...button, tag: "Link" }, line: 1, column: 69 }],
    },
    {
      code: `${kit} <IconButton render={<a href="/x" />} label="Open" />`,
      errors: [{ messageId: "rendersLink", data: { ...iconButton, tag: "a" } }],
    },
    {
      // An element with a destination is a link, whatever its name.
      code: `${kit} <Button render={<AppLink to="/x" />}>Open</Button>`,
      errors: [{ messageId: "rendersLink", data: { ...button, tag: "AppLink" } }],
    },
    {
      code: `${kit} <IconButton render={(props) => <Link {...props} to="/x" />} label="Open" />`,
      errors: [{ messageId: "rendersLink", data: { ...iconButton, tag: "Link" } }],
    },
    {
      // A behaviour rule judges any Button: a look-alike has the same defect.
      code: '<Button render={<a href="/x" />}>Open</Button>',
      errors: [{ messageId: "rendersLink", data: { ...button, tag: "a" } }],
    },
    {
      // A namespace is the kit's Button, and the message names the rendered part as the kit does.
      code: 'import * as Kit from "@ledger/design-system"; <Kit.Button render={<Kit.TextLink href="/x" />}>Open</Kit.Button>',
      errors: [{ messageId: "rendersLink", data: { ...button, tag: "TextLink" } }],
    },
    {
      // A lowercase tag is the element, whatever a parameter is called.
      code: `${kit} export function Row(a) { return <Button render={<a href="/x" />}>Open</Button>; }`,
      errors: [{ messageId: "rendersLink", data: { ...button, tag: "a" } }],
    },
    {
      code: 'import { Button as Action } from "@ledger/design-system"; <Action onClick={() => navigate({ to: "/work" })}>Open</Action>',
      errors: [{ messageId: "navigates", data: button, line: 1, column: 67 }],
    },
    {
      code: `${kit} <Button onClick={() => { void router.navigate({ to: "/work" }); }}>Open</Button>`,
      errors: [{ messageId: "navigates", data: button }],
    },
    {
      code: `${kit} const go = () => window.location.assign("/x"); <Button onClick={go}>Open</Button>`,
      errors: [{ messageId: "navigates", data: button }],
    },
    {
      code: `${kit} <IconButton label="Open" onClick={() => (window.location.href = "/x")} />`,
      errors: [{ messageId: "navigates", data: iconButton }],
    },
    {
      // Another package's Button under another name is judged by the name it imports.
      code: 'import { Button as Btn } from "@/components/ui/button"; <Btn render={<a href="/x" />}>Open</Btn>',
      errors: [{ messageId: "rendersLink" }],
    },
  ],
};

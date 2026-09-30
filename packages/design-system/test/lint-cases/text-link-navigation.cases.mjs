// ledger/text-link-navigation: TextLink navigates, to an href or a router link in render; an action
// is a Button.
import { kitImport } from "../lint-helpers.mjs";

export default {
  valid: [
    { code: '<TextLink href="/x">Open</TextLink>' },
    { code: '<TextLink render={<a href="/records" />}>Records</TextLink>' },
    { code: '<TextLink render={<Link to="/records" />}>Records</TextLink>' },
    // A router adapter's anchor is checked in the browser.
    { code: "<TextLink render={<AppRecordLink record={record} />}>Record</TextLink>" },
    // A spread may carry the destination.
    { code: "<TextLink {...link}>Open</TextLink>" },
    { code: '<Button variant="link" onClick={open}>Preview</Button>' },
    // A parameter that shadows the import is no TextLink at all.
    {
      code: `${kitImport("TextLink")} export function Row(TextLink) { return <TextLink>Open</TextLink>; }`,
    },
    // A lowercase tag is the element, whatever a parameter is called.
    {
      code: `${kitImport("TextLink")} export function Row(a) { return <TextLink render={<a href="/x" />}>Open</TextLink>; }`,
    },
  ],
  invalid: [
    {
      code: "<TextLink>Open</TextLink>",
      errors: [{ messageId: "destination", line: 1, column: 1 }],
    },
    {
      code: "<TextLink render={<button onClick={open} />}>Open</TextLink>",
      errors: [{ messageId: "anchor", line: 1, column: 11 }],
    },
    {
      code: 'import { TextLink as Navigation } from "@ledger/design-system"; <Navigation render={<span />}>Open</Navigation>',
      errors: [{ messageId: "anchor" }],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.TextLink render={<Kit.Button />}>Open</Kit.TextLink>',
      errors: [{ messageId: "anchor" }],
    },
    {
      // A behaviour rule judges any TextLink: another package's has the same defect.
      code: 'import { TextLink } from "other-kit"; <TextLink>Open</TextLink>',
      errors: [{ messageId: "destination" }],
    },
    {
      code: 'import { Button as Action, TextLink } from "@ledger/design-system"; <TextLink render={<Action />}>Open</TextLink>',
      errors: [{ messageId: "anchor" }],
    },
    {
      code: "<TextLink onClick={open}>Open</TextLink>",
      options: [{ note: "A record's name is RecordLink." }],
      errors: [{ messageId: "destination", data: { note: " A record's name is RecordLink." } }],
    },
    {
      // Another package's TextLink under another name is judged by the name it imports.
      code: 'import { TextLink as Go } from "other-kit"; <Go render={<button />}>Open</Go>',
      errors: [{ messageId: "anchor" }],
    },
  ],
};

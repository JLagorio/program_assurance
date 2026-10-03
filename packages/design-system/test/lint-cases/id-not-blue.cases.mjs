// ledger/id-not-blue: an Id is blue only inside a link or a button.
import { kitImport } from "../lint-helpers.mjs";

const kit = kitImport("Id", "TextLink");

export default {
  valid: [
    { code: `${kit} <Id>REQ-001</Id>` },
    { code: `${kit} <TextLink href="/x"><Id className="text-brand">REQ-001</Id></TextLink>` },
    { code: '<Link to="/x"><span><Id className="text-brand">REQ-001</Id></span></Link>' },
    { code: `${kit} <Id className="text-subtle">REQ-001</Id>` },
    // The link resolves through an alias too.
    {
      code: 'import { Id, TextLink as Go } from "@ledger/design-system"; <Go href="/x"><Id className="text-brand">REQ-001</Id></Go>',
    },
    // A link or a button that renders the Id is the Id's link.
    {
      code: `${kit} <TextLink href="/x" render={<Id />} className="text-brand">REQ-001</TextLink>`,
    },
    // Not the kit's Id: a local look-alike, another package's, a parameter.
    { code: 'const Id = (props) => <span {...props} />; <Id className="text-brand">X-1</Id>' },
    { code: 'import { Id } from "other-kit"; <Id className="text-brand">X-1</Id>' },
    { code: `${kit} export function Row(Id) { return <Id className="text-brand">X-1</Id>; }` },
    // The Id's classes through a const: a muted one is fine.
    { code: `${kit} const muted = "text-subtle"; <Id className={muted}>REQ-001</Id>` },
    // A trigger whose render puts a Button or a link in its place holds its children there, and
    // the kit's LinkButton and LinkIconButton are links.
    {
      code: 'import { DialogTrigger, Button, Id } from "@ledger/design-system"; <DialogTrigger render={<Button />}><Id className="text-brand">X-1</Id></DialogTrigger>',
    },
    {
      code: 'import { DropdownMenuTrigger, Id } from "@ledger/design-system"; <DropdownMenuTrigger render={<a href="/x" />}><Id className="text-brand">X-1</Id></DropdownMenuTrigger>',
    },
    {
      code: 'import { LinkButton, Id } from "@ledger/design-system"; <LinkButton render={<a href="/x" />}><Id className="text-brand">X-1</Id></LinkButton>',
    },
    // A type parameter or a local type named Id hides no value: this Id is still the kit's, and
    // inside a link it may be blue.
    {
      code: `${kit} export function Ids<Id extends string>({ ids }: { ids: Id[] }) { return <TextLink href="/x">{ids.map((i) => <Id key={i} className="text-brand">{i}</Id>)}</TextLink>; }`,
      only: "ts",
    },
    // A colour on the elements inside is not the Id's own (no-restyle reports it).
    { code: `${kit} <Id className="[&_span]:text-brand">REQ-1</Id>` },
    // A component of this file whose Id is the text of a link.
    {
      code: `${kit} function Code({ className }) { return <TextLink href="/r"><Id className={className}>REQ-1</Id></TextLink>; } export const A = () => <Code className="text-brand" />;`,
    },
  ],
  invalid: [
    {
      code: `${kit} <Id className="text-brand">REQ-001</Id>`,
      errors: [{ messageId: "blue", line: 1, column: 59 }],
    },
    {
      code: `${kit} <Stack><Id className={cn("text-brand", muted && "opacity-disabled")}>REQ-001</Id></Stack>`,
      errors: [{ messageId: "blue" }],
    },
    {
      // An alias and a namespace are the kit's Id.
      code: 'import { Id as Code } from "@ledger/design-system"; <Code className="text-brand">X-1</Code>',
      errors: [{ messageId: "blue" }],
    },
    {
      code: 'import * as L from "@ledger/design-system"; <L.Id className="text-brand">X-2</L.Id>',
      errors: [{ messageId: "blue" }],
    },
    {
      // A Button that is not the kit's is no button to the rule, which knows the kit's by import.
      code: 'import { Id } from "@ledger/design-system"; import { Button } from "other-kit"; <Button><Id className="text-brand">X-1</Id></Button>',
      errors: [{ messageId: "blue" }],
    },
    {
      // A type parameter, a local type alias or a local interface named Id is a type: the tag is
      // still the kit's Id.
      code: `${kit} export function Ids<Id extends string>({ ids }: { ids: Id[] }) { return <>{ids.map((i) => <Id key={i} className="text-brand">{i}</Id>)}</>; }`,
      only: "ts",
      errors: [{ messageId: "blue" }],
    },
    {
      code: `${kit} export function A() { type Id = string; interface TextLink { href: string } return <Id className="text-brand">X-1</Id>; }`,
      only: "ts",
      errors: [{ messageId: "blue" }],
    },
    {
      // A trigger that renders something other than a link or a button is no link.
      code: 'import { DialogTrigger, Badge, Id } from "@ledger/design-system"; <DialogTrigger render={<Badge />}><Id className="text-brand">X-1</Id></DialogTrigger>',
      errors: [{ messageId: "blue" }],
    },
    {
      // A render prop puts the kit's Id in the element's place, so the classes land on it.
      code: `${kit} <Badge render={<Id />} className="text-brand">X-1</Badge>`,
      errors: [{ messageId: "rendered", data: { wrapper: "Badge" } }],
    },
    {
      // A const, a map entry and a spread carry the classes as a literal does.
      code: `${kit} const blue = "text-brand"; const tones = { link: "text-brand" }; <><Id className={blue}>X-1</Id><Id className={tones[tone]}>X-2</Id><Id {...{ className: "text-brand" }}>X-3</Id></>`,
      errors: [{ messageId: "blue" }, { messageId: "blue" }, { messageId: "blue" }],
    },
    {
      // At a breakpoint, the Id is still blue.
      code: `${kit} <Id className="md:text-brand">REQ-1</Id>`,
      errors: [{ messageId: "blue", data: { tag: "Id" } }],
    },
    {
      // A component of this file that hands its className on to an Id with no link around it.
      code: `${kit} function Code({ className }) { return <Id className={className}>REQ-1</Id>; } export const A = () => <Code className="text-brand" />;`,
      errors: [{ messageId: "forwarded", data: { wrapper: "Code" } }],
    },
  ],
};

// ledger/button-icon-slot: an icon sized by hand inside a Button or an IconButton, which size their
// own icon slots.
import { KIT, KIT_SETTINGS, STORY, kitImport } from "../lint-helpers.mjs";

const kit = kitImport("Button", "IconButton");

export default {
  valid: [
    { code: `${kit} <Button iconBefore={<PlusIcon />}>Create task</Button>` },
    { code: `${kit} <IconButton icon={<PlusIcon />} label="Add requirement" />` },
    // A class that is not an icon size, and an icon size outside a button.
    { code: `${kit} <Button><PlusIcon className="text-subtle" />Create task</Button>` },
    { code: '<Inline><PlusIcon className="size-icon-small" />Create task</Inline>' },
    // A class-policy rule judges the kit's own Button only: a Button that is not bound to the kit's
    // import (another file's, another package's, a local look-alike, a parameter) is not reported.
    {
      code: 'import { Button } from "./local-button"; <Button><Icon className="size-icon-small" /></Button>',
    },
    {
      code: 'import { Button } from "other-kit"; <Button><Icon className="size-icon-small" /></Button>',
    },
    {
      code: 'const Button = (props) => <button {...props} />; <Button><Icon className="size-icon-small" /></Button>',
    },
    {
      code: `${kit} export function Row(Button) { return <Button><Icon className="size-icon-small" /></Button>; }`,
    },
    // Without the package preset's settings a file is a product's, whose relative import is its
    // own file, wherever it lies.
    {
      code: 'import { Button } from "./button"; <Button><Icon className="size-icon-small" /></Button>',
      filename: KIT,
    },
    // An icon class that is no size, through a const.
    {
      code: `${kit} const tone = "text-subtle"; <Button><PlusIcon className={tone} />Create task</Button>`,
    },
    // A trigger that renders something other than a button holds its icon as it likes.
    {
      code: 'import { DialogTrigger, Badge } from "@ledger/design-system"; <DialogTrigger render={<Badge />}><PlusIcon className="size-icon-small" />Open</DialogTrigger>',
    },
    {
      code: 'import { DialogTrigger } from "@ledger/design-system"; import { Button } from "other-kit"; <DialogTrigger render={<Button />}><PlusIcon className="size-icon-small" />Open</DialogTrigger>',
    },
    // In the kit, a story's own component named Button is no part, even at the top of the file.
    {
      code: 'function Button(props) { return <button {...props} />; } export const X = () => <Button><Icon className="size-icon-small" /></Button>;',
      filename: STORY,
      settings: KIT_SETTINGS,
    },
    // A component of this file that hands no children on to its Button leaves them its own.
    {
      code: `${kit} const Go = ({ label }) => <Button>{label}</Button>; export const A = () => <Go><PlusIcon className="size-icon-small" /></Go>;`,
    },
  ],
  invalid: [
    {
      code: `${kit} <Button><PlusIcon className="size-icon-small" />Create task</Button>`,
      errors: [{ messageId: "button", line: 1, column: 69 }],
    },
    {
      code: `${kit} <IconButton label="Add"><PlusIcon className={cn("size-icon-medium", open && "rotate-45")} /></IconButton>`,
      errors: [{ messageId: "iconButton" }],
    },
    {
      // An alias and a namespace are the kit's Button.
      code: 'import { Button as Action } from "@ledger/design-system"; <Action><Icon className="size-icon-small" /></Action>',
      errors: [{ messageId: "button" }],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.IconButton label="Add"><Icon className="size-icon-small" /></Kit.IconButton>',
      errors: [{ messageId: "iconButton" }],
    },
    {
      // Inside the kit, a relative import of the part is the part, under an alias too.
      code: 'import { Button as Local } from "./button"; <Local><Icon className="size-icon-small" /></Local>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "button" }],
    },
    {
      // A render prop puts the kit's Button in the trigger's place, and the trigger's children in
      // it: the icon goes in that Button's slot.
      code: 'import { DialogTrigger, Button } from "@ledger/design-system"; <DialogTrigger render={<Button />}><PlusIcon className="size-icon-small" />Open</DialogTrigger>',
      errors: [
        {
          messageId: "renderedButton",
          data: { icon: "PlusIcon", cls: "size-icon-small", wrapper: "DialogTrigger" },
        },
      ],
    },
    {
      code: 'import { DropdownMenuTrigger, IconButton } from "@ledger/design-system"; <DropdownMenuTrigger render={(props) => <IconButton label="More" {...props} />}><MoreIcon className="size-icon-small" /></DropdownMenuTrigger>',
      errors: [
        {
          messageId: "renderedIconButton",
          data: { icon: "MoreIcon", cls: "size-icon-small", wrapper: "DropdownMenuTrigger" },
        },
      ],
    },
    {
      // A type parameter or a local interface named Button hides no value.
      code: `${kit} export function A<Button>() { interface IconButton {} return <Button><Icon className="size-icon-small" /></Button>; }`,
      only: "ts",
      errors: [{ messageId: "button" }],
    },
    {
      // In the kit, a top-level Button of a part's own file is the part.
      code: 'function Button(props) { return <button {...props} />; } export const X = () => <Button><Icon className="size-icon-small" /></Button>;',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "button" }],
    },
    {
      // The icon's classes are read through a const and a helper function, as a literal is.
      code: `${kit} const icon = "size-icon-small"; const sized = () => "size-icon-medium"; <><Button><PlusIcon className={icon} />Add</Button><Button><PlusIcon className={sized()} />Add</Button></>`,
      errors: [{ messageId: "button" }, { messageId: "button" }],
    },
    {
      // A component of this file that hands its children on to a Button renders that Button.
      code: `${kit} const Go = (props) => <Button {...props} />; export const A = () => <Go><PlusIcon className="size-icon-small" />Add</Go>;`,
      errors: [
        {
          messageId: "renderedButton",
          data: { icon: "PlusIcon", cls: "size-icon-small", wrapper: "Go" },
        },
      ],
    },
    {
      // At a breakpoint or important, the icon is still sized by hand.
      code: `${kit} export const A = () => <><Button><PlusIcon className="md:size-icon-small" />Add</Button><Button><PlusIcon className="!size-icon-small" />Add</Button></>;`,
      errors: [
        { messageId: "button", data: { icon: "PlusIcon", cls: "md:size-icon-small" } },
        { messageId: "button", data: { icon: "PlusIcon", cls: "!size-icon-small" } },
      ],
    },
  ],
};

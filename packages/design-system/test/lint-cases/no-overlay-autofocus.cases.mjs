// ledger/no-overlay-autofocus: no autoFocus inside overlay content, in the element or in a
// component of the same file that the content renders; initialFocus chooses the first field.
import { KIT, kitImport } from "../lint-helpers.mjs";

const kit = kitImport("DialogContent", "SheetContent");

export default {
  valid: [
    { code: "<Page><Input autoFocus /></Page>" },
    { code: `${kit} <DialogContent><Input autoFocus={false} /></DialogContent>` },
    { code: `${kit} <DialogContent initialFocus={ref}><Input ref={ref} /></DialogContent>` },
    {
      code: "function Body() { return <Input autoFocus />; } const A = () => <Page><Body /></Page>;",
    },
    {
      code: "function Page() { return <><Input autoFocus /><DialogContent><Other /></DialogContent></>; }",
    },
    // A parameter that shadows the import is no overlay at all.
    {
      code: `${kit} export function Body(DialogContent) { return <DialogContent><Input autoFocus /></DialogContent>; }`,
    },
    // A component of this file that hands its children on to no overlay.
    {
      code: "const Pane = (props) => <div {...props} />; export const A = () => <Pane><input autoFocus /></Pane>;",
    },
  ],
  invalid: [
    {
      code: `${kit} <DialogContent><Input autoFocus /></DialogContent>`,
      errors: [{ messageId: "autoFocus", line: 1, column: 92 }],
    },
    {
      code: `${kit} <DialogContent>{open && <Input autoFocus={true} />}</DialogContent>`,
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // A long component name keeps the words to the message limit: the whole name while it fits,
      // else its last part.
      code: `${kit} <DropdownMenuContent><RequirementAllocationSearchField autoFocus /></DropdownMenuContent>`,
      errors: [
        {
          messageId: "autoFocus",
          data: { tag: "RequirementAllocationSearchField", overlay: "DropdownMenuContent" },
        },
      ],
    },
    {
      code: `${kit} <DropdownMenuContent><Forms.Requirements.AllocationSearchField.WithSuggestions.AndRecentPicks autoFocus /></DropdownMenuContent>`,
      errors: [
        { messageId: "autoFocus", data: { tag: "AndRecentPicks", overlay: "DropdownMenuContent" } },
      ],
    },
    {
      code: "<SheetContent>{rows.map(() => <Input autoFocus />)}</SheetContent>",
      errors: [{ messageId: "autoFocus" }],
    },
    {
      code: 'import { PopoverContent as Pop } from "@ledger/design-system"; <Pop><Input autoFocus /></Pop>',
      errors: [{ messageId: "autoFocus" }],
    },
    {
      code: "<PickerSheet><TextField autoFocus /></PickerSheet>",
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // A namespace is the kit's content, and a behaviour rule judges another package's too.
      code: 'import * as Kit from "@ledger/design-system"; <Kit.SheetContent><Input autoFocus /></Kit.SheetContent>',
      errors: [{ messageId: "autoFocus" }],
    },
    {
      code: 'import { PopoverContent } from "other-kit"; <PopoverContent><Input autoFocus /></PopoverContent>',
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // A component the content renders, and one that component renders in turn.
      code: "function Fields() { return <Input autoFocus />; } function Form() { return <Fields />; } const A = () => <SheetContent><Form /></SheetContent>;",
      errors: [{ messageId: "autoFocus", line: 1, column: 35 }],
    },
    {
      code: "function Page() { function Inner() { return <Input autoFocus />; } return <DialogContent><Inner /></DialogContent>; }",
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // Inside the kit, a relative import of the overlay is the overlay.
      code: 'import { DialogContent } from "./dialog"; <DialogContent><Input autoFocus /></DialogContent>',
      filename: KIT,
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // The kit's date picker (src/components/date-picker.tsx), which its allowance counts.
      code: 'import { PopoverContent } from "./popover"; <PopoverContent finalFocus={returnTo} className="gap-0 p-0" style={{ width: "auto" }}><Calendar mode="single" autoFocus onSelect={onPick} /></PopoverContent>',
      filename: KIT,
      errors: [{ messageId: "autoFocus", line: 1, column: 155 }],
    },
    {
      // Another package's overlay under another name, or read from its namespace, is judged by
      // the name it imports; a type parameter of the name hides nothing.
      code: 'import { DialogContent as Content } from "@/components/ui/dialog"; import * as UI from "@/components/ui/dialog"; <><Content><input autoFocus /></Content><UI.SheetContent><input autoFocus /></UI.SheetContent></>',
      errors: [{ messageId: "autoFocus" }, { messageId: "autoFocus" }],
    },
    {
      code: `${kit} export function A<DialogContent>() { return <DialogContent><input autoFocus /></DialogContent>; }`,
      only: "ts",
      errors: [{ messageId: "autoFocus" }],
    },
    {
      // A component of this file that hands its children on to an overlay.
      code: `${kit} const Pane = (props) => <DialogContent {...props} />; export const A = () => <Pane><input autoFocus /></Pane>;`,
      errors: [
        {
          messageId: "forwarded",
          data: { tag: "input", overlay: "DialogContent", wrapper: "Pane" },
        },
      ],
    },
  ],
};

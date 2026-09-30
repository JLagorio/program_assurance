// ledger/dialog-footer-order: in a dialog, sheet or drawer footer, Cancel or the close part comes
// before the primary action.
import { KIT, KIT_SETTINGS, kitImport } from "../lint-helpers.mjs";

export default {
  valid: [
    {
      code: '<DialogFooter><Button>Cancel</Button><Button variant="primary">Create task</Button></DialogFooter>',
    },
    {
      code: '<DialogFooter><DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose><Button type="submit" variant="primary">Create task</Button></DialogFooter>',
    },
    {
      code: "<AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction>Discard</AlertDialogAction></AlertDialogFooter>",
    },
    { code: '<DialogFooter><Button variant="primary">Done</Button></DialogFooter>' },
    // Branches are exclusive, so no order holds across them.
    {
      code: '<DialogFooter>{readOnly ? <Button variant="primary">Close</Button> : <Button>Cancel</Button>}</DialogFooter>',
    },
    // Not a footer.
    {
      code: '<Inline><Button variant="primary">Create task</Button><Button>Cancel</Button></Inline>',
    },
    // A parameter that shadows the import is no footer at all.
    {
      code: `${kitImport("DialogFooter")} export function Actions(DialogFooter) { return <DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></DialogFooter>; }`,
    },
  ],
  invalid: [
    {
      code: '<DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></DialogFooter>',
      errors: [{ messageId: "order", line: 1, column: 61 }],
    },
    {
      code: 'import { DialogFooter as Footer } from "@ledger/design-system"; <Footer><><Button variant="primary">Create task</Button>{canCancel && <Button>Cancel</Button>}</></Footer>',
      errors: [{ messageId: "order" }],
    },
    {
      code: "<AlertDialogFooter><AlertDialogAction>Discard</AlertDialogAction><AlertDialogCancel>Keep editing</AlertDialogCancel></AlertDialogFooter>",
      errors: [{ messageId: "order" }],
    },
    {
      // A namespace is the kit's footer and buttons.
      code: 'import * as Kit from "@ledger/design-system"; <Kit.DialogFooter><Kit.Button variant="primary">Create task</Kit.Button><Kit.Button>Cancel</Kit.Button></Kit.DialogFooter>',
      errors: [{ messageId: "order" }],
    },
    {
      // A behaviour rule judges any footer of that name: another package's has the same order.
      code: 'import { DialogFooter } from "other-kit"; <DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></DialogFooter>',
      errors: [{ messageId: "order" }],
    },
    {
      // Inside the kit, a relative import of the footer is the footer, under an alias too.
      code: 'import { DialogFooter as Footer } from "./dialog"; <Footer><Button variant="primary">Create task</Button><Button>Cancel</Button></Footer>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "order" }],
    },
    {
      code: '<SheetFooter><Button variant="primary">Apply</Button><SheetClose render={<Button variant="subtle" />}>Cancel</SheetClose></SheetFooter>',
      errors: [{ messageId: "order" }],
    },
    {
      code: '<DialogFooter><DialogClose render={<Button variant="primary" />}>Done</DialogClose><DialogClose>Close</DialogClose></DialogFooter>',
      errors: [{ messageId: "order" }],
    },
    {
      // Another package's footer read from its namespace is judged by the name it imports.
      code: 'import * as UI from "@/components/ui/dialog"; <UI.DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></UI.DialogFooter>',
      errors: [{ messageId: "order" }],
    },
  ],
};

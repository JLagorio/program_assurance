// ledger/overlay-width-preset: Dialog, Sheet, AlertDialog and Drawer content take their width from
// a preset, not from style or a width class.
import path from "node:path";

import { KIT, KIT_SETTINGS, REPO, kitImport } from "../lint-helpers.mjs";

/** A kit file by its path under the kit's src. */
const kitFile = (file) => path.join(REPO, "packages/design-system/src", file);

const kit = kitImport("DialogContent", "SheetContent");
/** What a sized overlay takes instead: the step of its own map nearest the width written, or
    every step when the lint cannot read one; a drawer's steps are its tokens'. */
const TAIL = "the kit owns the steps and their narrowing to the window.";
const DIALOG =
  'Use width="small" (400px), width="medium" (520px), width="large" (760px), width="xlarge" (960px) or width="fullscreen"; ' +
  TAIL;
const SHEET =
  'Use width="small" (320px), width="medium" (420px), width="large" (760px), width="xlarge" (960px) or width="fullscreen"; ' +
  TAIL;
/** AlertDialog's steps: Dialog's `small` and `medium`, and `xsmall` below them. */
const ALERT =
  'Use width="xsmall" (320px), width="small" (400px) or width="medium" (520px); ' + TAIL;
/** Drawer's steps, from dimension.part.drawerSmall, .drawer and .drawerLarge. */
const DRAWER =
  'Use width="small" (320px), width="medium" (384px) or width="large" (760px); ' + TAIL;
const nearest = (step) => `Use ${step}, the nearest step; ${TAIL}`;
const same = (step) => `Use ${step}, the step of that width; ${TAIL}`;

export default {
  valid: [
    { code: `${kit} <DialogContent width="large" />` },
    {
      code: '<SheetContent width="small" style={{ maxHeight: "var(--ds-dimension-layout-sheet)" }} />',
    },
    { code: "<DialogContent style={{ maxWidth: undefined }} />" },
    { code: '<AlertDialogContent width="xsmall" />' },
    // A popover is not a sized overlay.
    { code: '<PopoverContent className="w-layout-rail" />' },
    // A parameter that shadows the import is no overlay at all.
    {
      code: `${kit} export function Body(DialogContent) { return <DialogContent className="max-w-layout-measure" />; }`,
    },
    // In the kit's own source a sized overlay of the kit takes its width from its own role token,
    // dimension.part.* (CommandDialog's in command.tsx): that is the kit's one place for it.
    {
      code: 'import { DialogContent } from "./dialog"; import { token } from "../generated/tokens"; const defaults = { maxWidth: token("dimension.part.command") }; export const A = ({ style }) => <DialogContent style={{ ...defaults, ...style }} />;',
      filename: kitFile("components/command.tsx"),
      settings: KIT_SETTINGS,
    },
    // So does a part's own size prop that falls back to its token (PreviewSheet's `width`).
    {
      code: 'import { SheetContent } from "../components/sheet"; import { token } from "../generated/tokens"; export const A = ({ width }) => <SheetContent style={{ maxWidth: width ?? token("dimension.part.previewSheet") }} />;',
      filename: kitFile("patterns/preview-sheet.tsx"),
      settings: KIT_SETTINGS,
    },
    // A component of this file whose rest no longer carries className hands it on to nothing.
    {
      code: `${kit} const Pane = ({ className, ...rest }) => <DialogContent {...rest} />; export const A = () => <Pane className="max-w-[480px]" />;`,
    },
  ],
  invalid: [
    {
      code: `${kit} <DialogContent style={{ maxWidth: 620 }} />`,
      errors: [
        {
          messageId: "style",
          data: {
            part: "DialogContent",
            property: "maxWidth",
            width: " (620px)",
            advice: nearest('width="medium" (520px)'),
          },
          line: 1,
          column: 94,
        },
      ],
    },
    {
      code: `${kit} <DialogContent style={{ width: "90vw", maxHeight: "90dvh" }} />`,
      errors: [
        {
          messageId: "style",
          data: { part: "DialogContent", property: "width", width: "", advice: DIALOG },
        },
      ],
    },
    {
      // A const style object is read where it is used.
      code: "const wide = { maxWidth: 960 }; <DialogContent style={wide} />",
      errors: [
        {
          messageId: "style",
          data: {
            part: "DialogContent",
            property: "maxWidth",
            width: " (960px)",
            advice: same('width="xlarge" (960px)'),
          },
          column: 16,
        },
      ],
    },
    {
      code: '<SheetContent className="sm:max-w-layout-measure" />',
      errors: [
        {
          messageId: "className",
          data: {
            part: "SheetContent",
            cls: "sm:max-w-layout-measure",
            width: " (720px)",
            advice: nearest('width="large" (760px)'),
          },
        },
      ],
    },
    {
      code: '<AlertDialogContent className={cn("w-full", open && "max-w-layout-rail")} />',
      errors: [
        {
          messageId: "className",
          data: { part: "AlertDialogContent", cls: "w-full", width: "", advice: ALERT },
        },
      ],
    },
    {
      // AlertDialog's steps are its own: 440px is nearest its small, and its xsmall is a step.
      code: "<AlertDialogContent style={{ maxWidth: 440 }} />",
      errors: [
        {
          messageId: "style",
          data: {
            part: "AlertDialogContent",
            property: "maxWidth",
            width: " (440px)",
            advice: nearest('width="small" (400px)'),
          },
        },
      ],
    },
    {
      code: '<AlertDialogContent className="max-w-[320px]" />',
      errors: [
        {
          messageId: "className",
          data: {
            part: "AlertDialogContent",
            cls: "max-w-[320px]",
            width: " (320px)",
            advice: same('width="xsmall" (320px)'),
          },
        },
      ],
    },
    {
      // A Drawer's steps are its tokens': the nearest, the one of that width, or every step.
      code: 'import { DrawerContent as Tray } from "@ledger/design-system"; <><Tray style={{ inlineSize: "40rem" }} /><Tray className="w-96" /><Tray className="w-full" /></>',
      errors: [
        {
          messageId: "style",
          data: {
            part: "DrawerContent",
            property: "inlineSize",
            width: " (640px)",
            advice: nearest('width="large" (760px)'),
          },
        },
        {
          messageId: "className",
          data: {
            part: "DrawerContent",
            cls: "w-96",
            width: " (384px)",
            advice: same('width="medium" (384px)'),
          },
        },
        {
          messageId: "className",
          data: { part: "DrawerContent", cls: "w-full", width: "", advice: DRAWER },
        },
      ],
    },
    {
      // A namespace is the kit's content, and a behaviour rule judges another package's too.
      code: 'import * as Kit from "@ledger/design-system"; <Kit.SheetContent className="w-96" />',
      errors: [
        {
          messageId: "className",
          data: {
            part: "SheetContent",
            cls: "w-96",
            width: " (384px)",
            advice: nearest('width="medium" (420px)'),
          },
        },
      ],
    },
    {
      code: 'import { DialogContent } from "other-kit"; <DialogContent className="max-w-layout-measure" />',
      errors: [
        {
          messageId: "className",
          data: {
            part: "DialogContent",
            cls: "max-w-layout-measure",
            width: " (720px)",
            advice: nearest('width="large" (760px)'),
          },
        },
      ],
    },
    {
      // Inside the kit, a relative import under an alias is the content it imports.
      code: 'import { DialogContent as Content } from "../components/dialog"; <Content style={{ width: 480 }} />',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "style",
          data: {
            part: "DialogContent",
            property: "width",
            width: " (480px)",
            advice: nearest('width="medium" (520px)'),
          },
        },
      ],
    },
    {
      // The kit's record browser (src/patterns/record-browser.tsx), which its allowance counts:
      // inside the kit, a relative import of the content is the content.
      code: 'import { DialogContent } from "../components/dialog"; <DialogContent ref={dialogRef} style={{ width: "90vw", maxWidth: "none", height: "90dvh", maxHeight: "90dvh" }} />',
      filename: KIT,
      errors: [
        {
          messageId: "style",
          data: { part: "DialogContent", property: "width", width: "", advice: DIALOG },
        },
        {
          messageId: "style",
          data: { part: "DialogContent", property: "maxWidth", width: "", advice: DIALOG },
        },
      ],
    },
    {
      // A width class through a const and a clsx key is read as a literal is.
      code: `${kit} const wide = "max-w-layout-measure"; <><DialogContent className={wide} /><SheetContent className={cn({ "w-400": wide })} /></>`,
      errors: [
        {
          messageId: "className",
          data: {
            part: "DialogContent",
            cls: "max-w-layout-measure",
            width: " (720px)",
            advice: nearest('width="large" (760px)'),
          },
        },
        {
          messageId: "className",
          data: {
            part: "SheetContent",
            cls: "w-400",
            width: " (32px)",
            advice: nearest('width="small" (320px)'),
          },
        },
      ],
    },
    {
      // The style is followed: a Base UI style callback, a spread of a const, useMemo, a branch.
      code: `${kit} import { useMemo } from "react"; const wide = { maxWidth: 960 }; export const A = ({ on, style }) => { const s = useMemo(() => ({ minWidth: 480 }), []); return <><DialogContent style={(state) => ({ ...wide, ...style })} /><SheetContent style={on ? s : { width: "30rem" }} /></>; };`,
      errors: [
        {
          messageId: "style",
          data: {
            part: "DialogContent",
            property: "maxWidth",
            width: " (960px)",
            advice: same('width="xlarge" (960px)'),
          },
          column: 118,
        },
        {
          messageId: "style",
          data: {
            part: "SheetContent",
            property: "minWidth",
            width: " (480px)",
            advice: nearest('width="medium" (420px)'),
          },
        },
        {
          messageId: "style",
          data: {
            part: "SheetContent",
            property: "width",
            width: " (480px)",
            advice: nearest('width="medium" (420px)'),
          },
        },
      ],
    },
    {
      // A part's role token is its own part's: another part's file, or the right file with
      // another part's token, sizes the overlay like any other width.
      code: 'import { DialogContent } from "../components/dialog"; import { token } from "../generated/tokens"; export const A = () => <DialogContent style={{ maxWidth: token("dimension.part.command") }} />;',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "style",
          data: { part: "DialogContent", property: "maxWidth", width: "", advice: DIALOG },
        },
      ],
    },
    {
      code: 'import { SheetContent } from "../components/sheet"; import { token } from "../generated/tokens"; export const A = ({ width }) => <SheetContent style={{ maxWidth: width ?? token("dimension.part.popover") }} />;',
      filename: kitFile("patterns/preview-sheet.tsx"),
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "style",
          data: { part: "SheetContent", property: "maxWidth", width: "", advice: SHEET },
        },
      ],
    },
    {
      // A part's role token is the kit's only in the kit's own source: a product's token() is a
      // width like any other.
      code: `${kit} import { token } from "@ledger/design-system"; <DialogContent style={{ maxWidth: token("dimension.part.command") }} />`,
      errors: [
        {
          messageId: "style",
          data: { part: "DialogContent", property: "maxWidth", width: "", advice: DIALOG },
        },
      ],
    },
    {
      // Another package's SheetContent under another name is judged by the name it imports.
      code: 'import { SheetContent as SC } from "@/components/ui/sheet"; <SC className="w-96" />',
      errors: [
        {
          messageId: "className",
          data: {
            part: "SheetContent",
            cls: "w-96",
            width: " (384px)",
            advice: nearest('width="medium" (420px)'),
          },
        },
      ],
    },
    {
      // A component of this file that hands its style or its className on to the content.
      code: `${kit} const Pane = (props) => <DialogContent {...props} />; export const A = () => <Pane style={{ maxWidth: 480 }} />;`,
      errors: [
        {
          messageId: "forwardedStyle",
          data: {
            part: "DialogContent",
            property: "maxWidth",
            wrapper: "Pane",
            width: " (480px)",
            advice:
              'Use width="medium" (520px), the nearest step; the kit owns the steps and their narrowing to the window.',
          },
        },
      ],
    },
    {
      code: `${kit} const Pane = ({ className, ...rest }) => <DialogContent className={className} {...rest} />; export const A = () => <Pane className="max-w-[480px]" />;`,
      errors: [
        {
          messageId: "forwardedClassName",
          data: {
            part: "DialogContent",
            cls: "max-w-[480px]",
            wrapper: "Pane",
            width: " (480px)",
            advice:
              'Use width="medium" (520px), the nearest step; the kit owns the steps and their narrowing to the window.',
          },
        },
      ],
    },
  ],
};

// ledger/readable-classes: a className on a kit part that the class rules cannot read.
import { KIT, KIT_SETTINGS, STORY, kitImport } from "../lint-helpers.mjs";

const kit = kitImport("Button", "Badge", "Box", "Id", "cn");
const BUTTON =
  "Use a Button prop (variant, size, isSelected); for layout the part leaves to its caller, write the classes here or in a map in this file.";
const BADGE =
  "Use a Badge prop (variant, size, tone); for layout the part leaves to its caller, write the classes here or in a map in this file.";
const BOX =
  "Use a Box prop (padding, paddingBlock, paddingInline); for layout the part leaves to its caller, write the classes here or in a map in this file.";
/** The advice when the element renders the part: the subject has named it. */
const RENDERED =
  "Use its prop (variant, size, isSelected), or write layout classes here or in a map in this file.";
const CALENDAR =
  "Use a Calendar prop (buttonVariant); for layout the part leaves to its caller, write the classes here or in a map in this file.";
const NO_PROPS = "Write the classes here, or in a map in this file.";

export default {
  valid: [
    // What the lint reads: a forwarded className, merged with the part's own classes.
    {
      code: `${kit} function Save({ className }) { return <Button className={cn("w-full", className)} /> }`,
    },
    {
      code: `${kit} function Save({ className = "w-full" }) { return <Button className={className} /> }`,
    },
    { code: `${kit} function Save(props) { return <Button className={props.className} /> }` },
    {
      code: `${kit} function Save({ labelClassName }) { return <Button className={labelClassName} /> }`,
    },
    // The rest of the props, and a className destructured from them in the body, are the caller's.
    {
      code: `${kit} function Save({ label, ...rest }) { return <Button className={rest.className}>{label}</Button>; }`,
    },
    {
      code: `${kit} function Save(props) { const { className } = props; return <Button className={className} />; }`,
    },
    // A Base UI className callback, whose returns are its classes.
    {
      code: `${kit} export const A = () => <Button className={(s) => (s.open ? "text-subtle" : undefined)} />;`,
    },
    // A map keyed by a typed prop reads every entry.
    {
      code: `${kit} const toneMap = { danger: "bg-danger", ok: "bg-success" }; export const A = ({ tone }) => <Badge className={toneMap[tone]} />;`,
    },
    // A same-file function, its call's arguments and its defaults.
    {
      code: `${kit} function place(last) { return last ? "self-end" : "self-start"; } export const A = ({ last }) => <Button className={place(last)} />;`,
    },
    {
      code: `${kit} function note(tone = "self-start") { return cn("min-w-0", tone); } export const A = () => <><Button className={note()} /><Badge className={note("self-end")} /></>;`,
    },
    // A cva recipe and a kit style function.
    {
      code: `${kit} import { cva } from "class-variance-authority"; const recipe = cva("self-start", { variants: { at: { end: "self-end" } } }); export const A = ({ at }) => <Button className={recipe({ at })} />;`,
    },
    {
      code: 'import { PopoverTrigger, buttonVariants } from "@ledger/design-system"; export const A = () => <PopoverTrigger className={buttonVariants({ variant: "secondary" })} />;',
    },
    // Another package's classes are its own, not Ledger's vocabulary, held in a const too.
    {
      code: `${kit} import { getDefaultClassNames } from "react-day-picker"; export const A = () => <Button className={cn("p-0", getDefaultClassNames().day_button)} />;`,
    },
    {
      code: `${kit} import { getDefaultClassNames } from "react-day-picker"; export function Day({ className }) { const base = getDefaultClassNames(); return <Button className={cn("size-400 p-0", base.day_button, className)} />; }`,
    },
    // A kit style function held in a const is still the kit's.
    {
      code: 'import { Button, buttonVariants } from "@ledger/design-system"; const v = buttonVariants; export const A = () => <Button className={v({ variant: "secondary" })} />;',
    },
    // A received className that is a Base UI callback, forwarded with the state.
    {
      code: `${kit} export function Mine({ className, ...props }) { return <Button {...props} className={(state) => cn("relative", typeof className === "function" ? className(state) : className)} />; }`,
    },
    // A same-file function read for its call: an argument the call leaves out, with no default, is
    // undefined; an object argument is read through a slot or the rest of a pattern.
    {
      code: `${kit} const sizes = { sm: "h-400", lg: "h-600" }; function classesFor(size, extra) { return cn(sizes[size], extra); } export const A = () => <Button className={classesFor("sm")} />;`,
    },
    {
      code: `${kit} function place(p) { const { tone } = p; return tone; } function rest({ a, ...others }) { return others.tone; } export const A = () => <><Button className={place({ tone: "self-end" })} /><Badge className={rest({ a: 1, tone: "self-start" })} /></>;`,
    },
    // A memoised className callback is the callback.
    {
      code: `${kit} import { useCallback } from "react"; export function A() { const f = useCallback((s) => (s.open ? "w-full" : "self-start"), []); return <Button className={f} />; }`,
    },
    // A class glued together at runtime by a join or a concat is no-non-token-class's.
    {
      code: `${kit} export const A = ({ tone }) => <><Badge className={["bg-", tone].join("")} /><Badge className={"bg-".concat(tone)} /></>;`,
    },
    // Not a kit part: a plain element (whose map values are still read by the token rules), a
    // local look-alike and another package's part.
    {
      code: 'const tones = { a: "bg-danger" }; export const A = ({ t, cls }) => <><div className={tones[t]} /><div className={cls} /></>;',
    },
    {
      code: "const Button = (props) => <button {...props} />; export const A = ({ cls }) => <Button className={cls} />;",
    },
    {
      code: 'import { Button } from "other-kit"; export const A = ({ cls }) => <Button className={cls} />;',
    },
    // A class glued together at runtime is no-non-token-class's.
    { code: `${kit} export const A = ({ tone }) => <Badge className={\`bg-\${tone}-500\`} />;` },
    // In the kit's own source, a relative import that stays in src is the kit.
    {
      code: 'import { Button } from "./button"; import { fieldControl, fieldControlHeight } from "./controls"; export const A = ({ size }) => <Button className={[fieldControl, fieldControlHeight[size]].join(" ")} />;',
      filename: KIT,
      settings: KIT_SETTINGS,
    },
    // A story's own relative import of a kit style function.
    {
      code: 'import { PopoverTrigger } from "../components/popover"; import { buttonVariants } from "../components/button"; export const A = () => <PopoverTrigger className={buttonVariants({ variant: "secondary" })} />;',
      filename: STORY,
      settings: KIT_SETTINGS,
    },
    // A component of this file whose rest no longer carries className hands it on to nothing.
    {
      code: `${kit} import { k } from "./k"; const Go = ({ className, ...rest }) => <Button {...rest} />; export const A = () => <Go className={k}>Go</Go>;`,
    },
  ],
  invalid: [
    {
      code: `${kit} function Save({ cls }) { return <Button className={cls}>Go</Button> }`,
      errors: [
        {
          messageId: "prop",
          data: { subject: "<Button> className", prop: "cls", advice: BUTTON },
          line: 1,
          column: 120,
        },
      ],
    },
    {
      // A parameter with a default is still a prop: a caller gives it any other value.
      code: `${kit} function Block({ w = "w-800" }) { return <Box className={\`rounded-small \${w}\`} />; }`,
      errors: [{ messageId: "prop", data: { subject: "<Box> className", prop: "w", advice: BOX } }],
    },
    {
      code: `${kit} function Tag({ tone: t }) { return <Badge className={t} />; }`,
      errors: [
        { messageId: "prop", data: { subject: "<Badge> className", prop: "tone", advice: BADGE } },
      ],
    },
    {
      code: `${kit} function Save(props) { return <Button className={props.cls} />; }`,
      errors: [
        { messageId: "prop", data: { subject: "<Button> className", prop: "cls", advice: BUTTON } },
      ],
    },
    {
      code: `${kit} function Save({ label, ...rest }) { return <Button className={rest.tone}>{label}</Button>; }`,
      errors: [
        {
          messageId: "prop",
          data: { subject: "<Button> className", prop: "tone", advice: BUTTON },
        },
      ],
    },
    {
      code: `${kit} function Save(props) { const { tone = "self-end" } = props; return <Button className={tone} />; }`,
      errors: [
        {
          messageId: "prop",
          data: { subject: "<Button> className", prop: "tone", advice: BUTTON },
        },
      ],
    },
    {
      code: `${kit} function Save({ extra }) { return <Button className={cn("w-full", extra)} />; }`,
      errors: [{ messageId: "prop" }],
    },
    {
      code: `${kit} import { theme } from "./theme"; export const A = () => <Button className={theme.className} />;`,
      errors: [
        {
          messageId: "imported",
          data: { subject: "<Button> className", source: "./theme", advice: BUTTON },
        },
      ],
    },
    {
      code: `${kit} import { tones } from "@/lib/tones"; export const A = ({ t }) => <Badge className={tones[t]} />;`,
      errors: [
        {
          messageId: "imported",
          data: { subject: "<Badge> className", source: "@/lib/tones", advice: BADGE },
        },
      ],
    },
    {
      code: `${kit} import { statusClass } from "./status"; export const A = ({ s }) => <Badge className={statusClass(s)} />;`,
      errors: [
        {
          messageId: "importedCall",
          data: { subject: "<Badge> className", source: "./status", advice: BADGE },
        },
      ],
    },
    {
      code: `${kit} export const A = ({ row }) => <Button className={row.classFor()} />;`,
      errors: [{ messageId: "call" }],
    },
    {
      code: `${kit} declare function build(): string; function Save({ className = build() }) { return <Button className={className} />; }`,
      only: "ts",
      errors: [{ messageId: "call" }],
    },
    {
      code: `${kit} function Save({ className }) { className ??= "w-full"; return <Button className={className} />; }`,
      errors: [{ messageId: "reassigned" }],
    },
    {
      code: `${kit} const tones = { a: "bg-danger" }; export const A = () => <Badge className={tones.b} />;`,
      errors: [{ messageId: "member" }],
    },
    {
      code: `${kit} const tones = { ...shared, a: "bg-danger" }; export const A = () => <Badge className={tones.b} />;`,
      errors: [{ messageId: "spread" }],
    },
    {
      // A part with no styling props of its own gets the second half of the advice.
      code: `${kit} export const A = () => <Id className={globalClasses}>X-1</Id>;`,
      errors: [
        {
          messageId: "expression",
          data: {
            subject: "<Id> className",
            advice: "Write the classes here, or in a map in this file.",
          },
        },
      ],
    },
    {
      // A render prop puts the Button in the trigger's place, and its className on it.
      code: 'import { DialogTrigger, Button } from "@ledger/design-system"; export const A = ({ cls }) => <DialogTrigger render={<Button />} className={cls} />;',
      errors: [
        {
          messageId: "prop",
          data: {
            subject: "<DialogTrigger> renders <Button>, whose className",
            prop: "cls",
            advice: RENDERED,
          },
        },
      ],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; export const A = ({ cls }) => <Kit.Button className={cls} />;',
      errors: [
        { messageId: "prop", data: { subject: "<Button> className", prop: "cls", advice: BUTTON } },
      ],
    },
    {
      // A value two class attributes read is reported once, at the first.
      code: `${kit} function Pair({ extra }) { const k = cn("w-full", extra); return <><Button className={k} /><Badge className={k} /></>; }`,
      errors: [
        {
          messageId: "prop",
          data: { subject: "<Button> className", prop: "extra", advice: BUTTON },
        },
      ],
    },
    {
      // An import held in a const is still that import, named by its source; another package's
      // function given the file's own values is no longer another package's classes.
      code: `${kit} import { useContext } from "react"; import { theme } from "./theme"; import { join } from "lodash"; export function A({ cls }) { const t = theme; const c = useContext(Ctx); return <><Button className={t.cls} /><Badge className={c.cls} /><Box className={join(["w-full", cls], " ")} /></>; }`,
      errors: [
        {
          messageId: "imported",
          data: { subject: "<Button> className", source: "./theme", advice: BUTTON },
        },
        {
          messageId: "importedCall",
          data: { subject: "<Badge> className", source: "react", advice: BADGE },
        },
        {
          messageId: "importedCall",
          data: { subject: "<Box> className", source: "lodash", advice: BOX },
        },
      ],
    },
    {
      // A memoised className callback is read as the callback, so a prop in it is a prop.
      code: `${kit} import { useCallback } from "react"; export function A({ cls }) { const f = useCallback((s) => (s.open ? cls : "w-full"), [cls]); return <Button className={f} />; }`,
      errors: [
        { messageId: "prop", data: { subject: "<Button> className", prop: "cls", advice: BUTTON } },
      ],
    },
    {
      // A className in an object spread onto the part, and a slot map it is given.
      code: `${kitImport("Button", "Calendar")} export function A({ cls, day }) { return <><Button {...{ className: cls }} /><Calendar classNames={{ day }} /></>; }`,
      errors: [
        { messageId: "prop", data: { subject: "<Button> className", prop: "cls", advice: BUTTON } },
        {
          messageId: "prop",
          data: { subject: "<Calendar> classNames", prop: "day", advice: CALENDAR },
        },
      ],
    },
    {
      // A class a kit recipe is handed lands on the part with the recipe's own.
      code: 'import { PopoverTrigger, buttonVariants } from "@ledger/design-system"; export const A = ({ cls }) => <PopoverTrigger className={buttonVariants({ variant: "secondary", className: cls })} />;',
      errors: [
        {
          messageId: "prop",
          data: { subject: "<PopoverTrigger> className", prop: "cls", advice: NO_PROPS },
        },
      ],
    },
    {
      // A list changed in place is written again.
      code: `${kit} const list = ["w-full"]; export function A({ cls }) { list.push(cls); return <Button className={list.join(" ")} />; }`,
      errors: [{ messageId: "reassigned" }],
    },
    {
      // The prop is named as the caller writes it.
      code: `${kit} export function A(props) { const { cls: c } = props; return <><Button className={c} /><Badge className={props["tone"]} /><Box className={props.classNames.root} /></>; }`,
      errors: [
        { messageId: "prop", data: { subject: "<Button> className", prop: "cls", advice: BUTTON } },
        { messageId: "prop", data: { subject: "<Badge> className", prop: "tone", advice: BADGE } },
        {
          messageId: "prop",
          data: { subject: "<Box> className", prop: "classNames", advice: BOX },
        },
      ],
    },
    {
      // In the kit, an import from outside src is not the kit.
      code: 'import { Button } from "./button"; import { theme } from "../../../../scripts/theme"; export const A = () => <Button className={theme.cls} />;',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "imported" }],
    },
    {
      // A story builds its block's class from a parameter.
      code: 'import { Box } from "../primitives"; function Block({ w = "w-800" }) { return <Box className={`rounded-small ${w}`} />; } export const A = () => <Block />;',
      filename: STORY,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "prop", data: { subject: "<Box> className", prop: "w", advice: BOX } }],
    },
    {
      // A component of this file that hands its className on to a Button.
      code: `${kit} import { k } from "./k"; const Go = (props) => <Button {...props} />; export const A = () => <Go className={k}>Go</Go>;`,
      errors: [
        {
          messageId: "imported",
          data: {
            subject: "<Go> forwards className to <Button>, whose className",
            source: "./k",
            advice: RENDERED,
          },
        },
      ],
    },
  ],
};

// ledger/no-non-token-class: a class that is neither a token utility nor a documented structural
// one. Also the rule the class reader is tried on: helpers, cva, slot maps, settings, and the
// fit-noise review's probes, which later batches change.

/** An editor suggestion's result, as RuleTester checks it. */
const replace = (output) => ({ messageId: "replace", output });
/** The editor suggestion that writes the token class of the same value. */
const same = (output) => ({ messageId: "sameValue", output });

/** A stock Tailwind class, as nearest.js names it and the tokens of its role nearest it. */
const STOCK = {
  "bg-red-500": [
    "palette colour red-500",
    "Red is bg-danger-bold (a vibrant background for critical information…) or bg-accent-red-bolder (a red fill that carries no meaning, for…).",
  ],
  "text-red-500": [
    "palette colour red-500",
    "Red is text-danger (critical text, such as input field error…) or text-accent-red (text on color.background.accent.red.subtler).",
  ],
  "bg-zinc-100": [
    "palette colour zinc-100",
    "Grey is bg-neutral (the default background for neutral elements…) or bg-surface-sunken (a secondary background for the UI commonly…).",
  ],
  "text-zinc-600": [
    "palette colour zinc-600",
    "Grey is text-subtle (secondary text, such as navigation, subtle…).",
  ],
};
/** A stock class's report. */
const stock = (cls, what = STOCK[cls][0], advice = STOCK[cls][1]) => ({
  messageId: "stock",
  data: { cls, what, advice },
});

const recipe = `const recipe = cva("inline-flex", {
  variants: { variant: { default: "bg-unknown!", secondary: "!text-unknown" } },
  compoundVariants: [{ variant: "secondary", className: "hover:bg-unknown" }],
});`;

export default {
  valid: [
    { code: '<div className="bg-surface text-default p-200" />' },
    // Two of shadcn's theme names are Ledger's own tokens too, a field's border and background.
    { code: '<input className="border-input bg-input" />' },
    { code: '<p className="wrap-anywhere wrap-break-word wrap-normal" />' },
    { code: '<text className="recharts-cartesian-axis-tick-value">x</text>' },
    // Batch 6: every admitted spelling generates CSS (test/lint-tailwind.test.mjs). A minus where
    // Tailwind negates the utility, the alignment values each property takes, and the one float
    // side that only clear takes.
    {
      code: '<div className="-inset-x-100 -translate-y-full indent-200 -indent-200 items-center-safe justify-evenly clear-both order-0" />',
    },
    // The name markers and the chart library's tick class generate no CSS and are admitted by
    // name; the kit's @utility names come from its CSS (lint.json).
    { code: '<span className="group/row peer recharts-cartesian-axis-tick-value" />' },
    { code: '<div className="page-header stat-grid-3 touch-target-block-after shell-panel" />' },
    {
      // A cva recipe's classes are read; its variant names are not classes.
      code: `const recipe = cva("inline-flex [&>svg]:size-150!", {
  variants: { variant: { default: "bg-brand-bold", secondary: "bg-neutral" } },
  defaultVariants: { variant: "default" },
  compoundVariants: [{ variant: "secondary", class: "text-subtle", className: "font-medium" }],
});
const element = <span className={cn(recipe(), "!text-default")} />;`,
    },
    // Conditions, slot keys and prose are not classes.
    {
      code: 'const pinned = sticky ? "start" : false; const A = () => <td className={cn("px-100", pinned && "sticky")} />;',
    },
    { code: 'const A = () => <DayPicker classNames={{ root: "font-body", months: "flex" }} />;' },
    { code: 'export const label = "Open the record"; export const status = "draft";' },
    // A helper the settings do not name is not read.
    { code: 'export const c = mergeClasses("bg-red-500");' },
    // A `class` key on a data object whose value is not shaped like classes is data, not a class
    // site: an OSCAL control's class.
    { code: 'export const control = { id: "ac-1", class: "SP800-53", title: "Access Control" };' },
    // A received className is the caller's, and stays opaque.
    {
      code: 'export function Save({ className }) { return <div className={cn("flex", className)} />; }',
    },
    // A member call on an object that is no helper module's namespace is not a helper.
    { code: 'export const c = styles.cn("bg-red-500");' },
    // A cva config's variant names and defaultVariants are names, not classes.
    {
      code: 'const v = cva("flex", { variants: { tone: { brand: "bg-brand-bold" } }, defaultVariants: { tone: "brand" } });',
    },
    // Batch 1: a destructured const is one slot of its initialiser, so the labels beside the class
    // are not read as classes. Before batch 1 this probe read as five reports across the rules.
    {
      code: 'export const A = ({ ok }) => { const [dot, text, cls] = ok ? ["var(--ok)", "Connected", "items-center"] : ["var(--muted)", "Needs setup", "items-start"]; return <span className={cls}>{text}</span>; };',
    },
    // A class map's data is no class: a record's tone, a list of view names or display keywords.
    {
      code: 'export const SEVERITY = { critical: { tone: "danger", dot: "bg-danger", text: "text-danger" }, high: { tone: "warning", dot: "bg-warning", text: "text-warning" } };',
    },
    { code: 'export const DISPLAYS = ["block", "inline-block", "flex", "grid", "none"];' },
    // A list of HTML attribute names is data, though `hidden` is also a class: too few of its
    // strings read as classes for a class list (overlay.tsx's `reachability`).
    {
      code: 'const reachability = ["disabled", "tabindex", "href", "contenteditable", "hidden"]; export const watched = reachability;',
    },
    // A bare word is no evidence either way ("flex" is also a CSS value, "hidden" an attribute and
    // "table" a view), so a style object, an attribute list, a view list or a route's search
    // defaults is no class map, and its dashed values are not read as classes.
    {
      code: 'export const toolbarStyle = { position: "sticky", top: 0, display: "flex", justifyContent: "space-between" };',
    },
    {
      code: 'const HIDING = ["hidden", "inert", "aria-hidden"]; export const isHidden = (el) => HIDING.some((a) => el.hasAttribute(a));',
    },
    { code: 'export const VIEWS = ["table", "grid", "list-detail"] as const;', only: "ts" },
    {
      code: 'export const defaultSearch = { view: "table", layout: "grid", sort: "updated-desc" };',
    },
    // A classNames string is react-transition-group's prefix, and OSCAL's lowercase class is data.
    {
      code: 'export const A = ({ show, dir }) => <><CSSTransition in={show} classNames="fade" /><CSSTransition in={show} classNames={`slide-${dir}`} /></>;',
    },
    { code: 'export const prop = { name: "label", class: "sp800-53a", value: "AC-1" };' },
    // A tv config's keys are names, with or without a base; a same-file cx is not the helper.
    {
      code: 'import { tv } from "tailwind-variants"; import { button } from "./button"; export const small = tv({ extend: button, defaultVariants: { size: "sm" } });',
    },
    {
      code: 'const cx = (key) => (key === "revenue" ? 10 : 20); export const Dot = () => <circle cx={cx("revenue")} />;',
    },
    // A hole that brings its own whitespace glues nothing.
    { code: 'export const A = ({ on }) => <div className={`flex${on ? " gap-100" : ""}`} />;' },
    // A class has one owner (classify in classes.js), and these are other rules': a margin at any
    // key, a dark: class, an arbitrary value or a variable shorthand, alpha on a token, a stock
    // design value and a deprecated token. None is a token utility; each is reported once.
    {
      code: '<div className="mt-4 mt-[13px] dark:bg-red-500 w-[1px] bg-brand/[0.5] bg-(--brand) w-(--rail) bg-brand-bold/50 bg-white disabled:opacity-50 rounded fill-chart-categorical-8" />',
    },
    // The structural admissions that read a variable: Grid's columns and a panel's height.
    { code: '<div className="grid-cols-(--ds-grid-md) h-(--accordion-panel-height)" />' },
  ],
  invalid: [
    {
      code: '<div className="bg-red-500" />',
      errors: [{ ...stock("bg-red-500"), line: 1, column: 16 }],
    },
    {
      // A minus on a utility Tailwind does not negate generates no CSS: padding and gap, which
      // Bleed pulls outward, and a size.
      code: '<div className="-p-200 md:-size-full -gap-x-100 -scroll-pt-200" />',
      errors: [
        {
          messageId: "negative",
          data: { cls: "-p-200", property: "padding" },
          line: 1,
          column: 16,
        },
        {
          messageId: "negativeLength",
          data: { cls: "md:-size-full", property: "width and height" },
        },
        { messageId: "negative", data: { cls: "-gap-x-100", property: "column-gap" } },
        {
          messageId: "negativeLength",
          data: { cls: "-scroll-pt-200", property: "scroll-padding-top" },
        },
      ],
    },
    {
      // On a utility whose values are not all lengths, the property a minus would negate is not
      // the class's own (a border's colour, a stroke's colour, a composed outline, line-clamp), so
      // the class is only unknown.
      code: '<div className="-border-default -stroke-chart-categorical-1 -outline-focused -line-clamp-2" />',
      errors: [
        "-border-default",
        "-stroke-chart-categorical-1",
        "-outline-focused",
        "-line-clamp-2",
      ].map((cls) => ({ messageId: "unknown", data: { cls } })),
    },
    {
      // Spellings the structural list admitted before batch 6, which generate no CSS: an alignment
      // value another property takes, an attribute, auto with a minus, a grid of no tracks, a float
      // on both sides, size-screen, a chart library class other than the tick's, and a kit
      // utility the CSS does not declare.
      code: '<div className="items-between inert -mt-auto -inset-auto grid-cols-0 float-both size-screen recharts-foo stat-grid-7" />',
      errors: [
        "items-between",
        "inert",
        "-mt-auto",
        "-inset-auto",
        "grid-cols-0",
        "float-both",
        "size-screen",
        "recharts-foo",
        "stat-grid-7",
      ].map((cls) => ({ messageId: "unknown", data: { cls } })),
    },
    {
      code: '<div className="grid-cols-main-rail" />',
      errors: [{ messageId: "unknown", data: { cls: "grid-cols-main-rail" } }],
    },
    {
      // Alpha on a Tailwind palette colour is this rule's, not no-alpha-token's: the colour is no
      // token either, so a state token alone would not fix it. It names the roles of the colour as
      // it shows over each mode's page (decision 8). On a shadcn theme name it names the colour
      // (below); on another word it is unknown.
      code: '<div className="bg-red-500/50 hover:text-white/70 border-t-zinc-900/10 bg-muted/50 bg-unknown/50" />',
      errors: [
        {
          messageId: "paletteAlpha",
          data: {
            cls: "bg-red-500/50",
            advice:
              "Red is bg-danger-subtle (non-interactive critical information fill…) or bg-accent-red-subtler (a red tint that carries no meaning: an avatar…).",
          },
          line: 1,
          column: 16,
        },
        {
          messageId: "paletteAlpha",
          data: {
            cls: "hover:text-white/70",
            advice: "Grey is text-inverse (text on bold backgrounds).",
          },
        },
        {
          messageId: "paletteAlpha",
          data: {
            cls: "border-t-zinc-900/10",
            advice:
              "Grey is border-default (use to visually group or separate UI elements…) or border-inverse (borders on bold backgrounds).",
          },
        },
        {
          messageId: "vocabularyAlpha",
          data: {
            cls: "bg-muted/50",
            means: "muted background",
            use: "bg-neutral (a neutral fill) or bg-surface-sunken (a recessed region)",
            aside: "",
          },
        },
        { messageId: "unknown", data: { cls: "bg-unknown/50" } },
      ],
    },
    {
      // A shadcn theme name (build/vocabulary-aliases.json) is named as the Ledger class for its
      // job, and that class, under the class's variants and important modifier, is an editor
      // suggestion, one for each when there are two; never a fix.
      code: '<p className="text-muted-foreground hover:!bg-accent bg-muted" />',
      errors: [
        {
          messageId: "vocabulary",
          data: {
            cls: "text-muted-foreground",
            means: "secondary text colour",
            use: "text-subtle",
            aside: "",
          },
          line: 1,
          column: 14,
          suggestions: [replace('<p className="text-subtle hover:!bg-accent bg-muted" />')],
        },
        {
          // bg-accent says what Ledger's accent-* colours are, since the name reads as one.
          messageId: "vocabulary",
          data: {
            cls: "hover:!bg-accent",
            means: "hover background",
            use: "bg-neutral-subtle-hovered",
            aside: " Ledger's accent-* colours are hues with no meaning.",
          },
          suggestions: [
            replace(
              '<p className="text-muted-foreground hover:!bg-neutral-subtle-hovered bg-muted" />',
            ),
          ],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "bg-muted",
            means: "muted background",
            use: "bg-neutral (a neutral fill) or bg-surface-sunken (a recessed region)",
            aside: "",
          },
          suggestions: [
            replace('<p className="text-muted-foreground hover:!bg-accent bg-neutral" />'),
            replace('<p className="text-muted-foreground hover:!bg-accent bg-surface-sunken" />'),
          ],
        },
      ],
    },
    {
      // With alpha, the colour is named bare and nothing is suggested: a shade is a state token,
      // and dropping the alpha would change the look. A name whose Ledger class does another job
      // (a fill that is a border colour) is named and never suggested.
      code: 'export const A = () => <p className={cn("aria-invalid:ring-destructive/20 hover:bg-primary/90", "bg-border")} />;',
      errors: [
        {
          messageId: "vocabularyAlpha",
          data: {
            cls: "aria-invalid:ring-destructive/20",
            means: "invalid ring colour",
            use: "outline-danger (a control) or outline-field-danger (a field)",
            aside: "",
          },
          suggestions: [],
        },
        {
          messageId: "vocabularyAlpha",
          data: {
            cls: "hover:bg-primary/90",
            means: "primary background",
            use: "bg-brand-bold",
            aside: "",
          },
          suggestions: [],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "bg-border",
            means: "border colour as a fill",
            use: "border-default",
            aside: " A line between items is Separator, or a border side such as border-t.",
          },
          suggestions: [],
        },
      ],
    },
    {
      // A class written in a template is named, and not rewritten in place.
      code: 'export const A = ({ on }) => <p className={`text-muted-foreground ${on ? "flex" : ""}`} />;',
      errors: [
        {
          messageId: "vocabulary",
          data: {
            cls: "text-muted-foreground",
            means: "secondary text colour",
            use: "text-subtle",
            aside: "",
          },
          suggestions: [],
        },
      ],
    },
    {
      code: recipe,
      errors: [
        { messageId: "unknown", data: { cls: "bg-unknown!" }, line: 2 },
        { messageId: "unknown", data: { cls: "!text-unknown" }, line: 2 },
        { messageId: "unknown", data: { cls: "hover:bg-unknown" }, line: 3 },
      ],
    },
    {
      // A nested cva recipe and a clsx map passed to cn.
      code: 'const value = cn(cva("bg-unknown", { variants: { variant: { default: "text-unknown" } } }), { "hover:bg-missing!": true });',
      errors: [
        { messageId: "unknown", data: { cls: "bg-unknown" } },
        { messageId: "unknown", data: { cls: "text-unknown" } },
        { messageId: "unknown", data: { cls: "hover:bg-missing!" } },
      ],
    },
    {
      code: 'const A = () => <DayPicker classNames={{ root: "text-red-500" }} />;',
      errors: [stock("text-red-500")],
    },
    {
      // A helper named in the settings is read like cn.
      code: 'export const c = mergeClasses("bg-red-500");',
      settings: { ledger: { classFunctions: "mergeClasses" } },
      errors: [{ ...stock("bg-red-500"), line: 1, column: 31 }],
    },
    {
      // A template that glues a value to a word builds a class at runtime: one finding at the
      // template, and neither the fragment "bg-" nor the const "x" it glues.
      code: 'export const A = () => { const tone = "x"; return <p className={`bg-${tone}`} />; };',
      errors: [{ messageId: "runtime", data: { built: "bg-${tone}" }, line: 1, column: 65 }],
    },
    {
      // The whole classes beside it are still read, and so is a hole set apart by spaces.
      code: 'export const A = ({ t, on }) => <p className={`bg-${t}-500 ${on ? "text-unknown" : ""} flex`} />;',
      errors: [
        { messageId: "runtime", data: { built: "bg-${t}-500" } },
        { messageId: "unknown", data: { cls: "text-unknown" } },
      ],
    },
    {
      // A concatenation is read as a template is: "w-full " is a class, "bg-" + tone is glued.
      code: 'export const A = ({ tone }) => <p className={"w-full bg-unknown " + "bg-" + tone} />;',
      errors: [
        { messageId: "unknown", data: { cls: "bg-unknown" } },
        { messageId: "runtime", data: { built: "bg-${tone}" } },
      ],
    },
    {
      // A slot map is read by its values at every depth, through a const too, never by its keys.
      code: 'const slots = { root: "bg-red-500", day: { inner: "text-red-500" } }; export const A = () => <DayPicker classNames={slots} />;',
      errors: [stock("bg-red-500"), stock("text-red-500")],
    },
    {
      // cx, twJoin and classNames are class helpers, and so is an alias or a namespace member of a
      // helper module's export.
      code: 'import { cx } from "class-variance-authority"; import { twJoin } from "tailwind-merge"; import names from "classnames"; import { cn as merge } from "@ledger/design-system"; import * as u from "@ledger/design-system/cn"; export const c = [cx("bg-a1"), twJoin("bg-a2"), names("bg-a3"), merge("bg-a4"), u.cn("bg-a5")];',
      errors: ["bg-a1", "bg-a2", "bg-a3", "bg-a4", "bg-a5"].map((cls) => ({
        messageId: "unknown",
        data: { cls },
      })),
    },
    {
      // tv reads its config's values: base, slots and variants; defaultVariants and
      // responsiveVariants are names.
      code: 'import { tv } from "tailwind-variants"; export const box = tv({ base: "bg-unknown", slots: { icon: "text-unknown" }, variants: { size: { sm: "gap-unknown" } }, responsiveVariants: ["sm"], defaultVariants: { size: "sm" } });',
      errors: [
        { messageId: "unknown", data: { cls: "bg-unknown" } },
        { messageId: "unknown", data: { cls: "text-unknown" } },
        { messageId: "unknown", data: { cls: "gap-unknown" } },
      ],
    },
    {
      // A helper named in settings.ledger.variantFunctions reads its config as tv does.
      code: 'export const v = variants({ base: "bg-red-500", defaultVariants: { size: "unrelated-value" } });',
      settings: { ledger: { variantFunctions: ["variants"] } },
      errors: [stock("bg-red-500")],
    },
    {
      // A const read at two sites is one finding, where it is written.
      code: 'const k = "bg-red-500"; export const A = () => <><div className={k} /><p className={k} /></>;',
      errors: [{ ...stock("bg-red-500"), line: 1, column: 11 }],
    },
    {
      // A map lookup reads the entry, and a key known only at runtime reads every entry.
      code: 'const tones = { a: "bg-unknown", b: { fill: "text-unknown" } }; export const A = ({ t }) => <p className={cn(tones.a, tones[t].fill)} />;',
      errors: [
        { messageId: "unknown", data: { cls: "bg-unknown" } },
        { messageId: "unknown", data: { cls: "text-unknown" } },
      ],
    },
    {
      // The default a component gives its className is written here, and read.
      code: 'export function Save({ className = "bg-red-500" }) { return <div className={className} />; }',
      errors: [stock("bg-red-500")],
    },
    {
      // The hole is read, and every run of a concatenation is too.
      code: 'export const A = ({ on, t }) => <div className={`flex${on ? " bg-red-500" : ""} ${"bg-" + "zinc-100 " + t + " text-" + "zinc-600"}`} />;',
      errors: [stock("bg-red-500"), stock("bg-zinc-100"), stock("text-zinc-600")],
    },
    {
      // The kit's idiom for joining classes, a trim, a helper's spread argument and a map's values.
      code: 'import { cn } from "@ledger/design-system"; const parts = { a: "text-zinc-600" }; export const A = ({ on, x }) => <><div className={["flex", on && "bg-red-500"].filter(Boolean).join(" ")} /><div className={`bg-zinc-100 ${x}`.trim()} /><div className={cn(...["grid", on && "text-red-500"])} /><div className={Object.values(parts).join(" ")} /></>;',
      errors: [
        stock("text-zinc-600"),
        stock("bg-red-500"),
        stock("bg-zinc-100"),
        stock("text-red-500"),
      ],
    },
    {
      // A let written again gives every value it is assigned.
      code: 'export const A = ({ on }) => { let cls = "flex"; if (on) cls = "bg-red-500"; return <div className={cls} />; };',
      errors: [stock("bg-red-500")],
    },
    {
      // A stock value names the Ledger token nearest it in the family its utility's role names
      // (nearest.js): space for padding, inset and translate, type, a weight, a radius, a shadow
      // and a colour in its state; one class of the same value is an editor suggestion, never a
      // fix, and a value between two steps names both. On an element use-primitives does not read,
      // the class is the answer.
      code: '<button className="p-4 text-sm -top-4 translate-y-1 shadow-lg font-bold rounded-md hover:bg-blue-600" />',
      errors: [
        {
          ...stock("p-4", "spacing step 4 (16px)", "16px is p-200 (space.200)."),
          line: 1,
          column: 19,
          suggestions: [
            same(
              '<button className="p-200 text-sm -top-4 translate-y-1 shadow-lg font-bold rounded-md hover:bg-blue-600" />',
            ),
          ],
        },
        stock(
          "text-sm",
          "text size sm (14px)",
          "Nearest: font-body (13px, controls, cells, tabs, inputs, menu items) or font-body-large (15px, reading text and dialog body).",
        ),
        {
          ...stock("-top-4", "spacing step 4 (16px)", "16px is -top-200 (space.200)."),
          suggestions: [
            same(
              '<button className="p-4 text-sm -top-200 translate-y-1 shadow-lg font-bold rounded-md hover:bg-blue-600" />',
            ),
          ],
        },
        {
          ...stock("translate-y-1", "spacing step 1 (4px)", "4px is translate-y-050 (space.050)."),
          suggestions: [
            same(
              '<button className="p-4 text-sm -top-4 translate-y-050 shadow-lg font-bold rounded-md hover:bg-blue-600" />',
            ),
          ],
        },
        stock(
          "shadow-lg",
          "shadow lg",
          "Nearest: shadow-overlay (box shadow of elements that sit on top of the…) or shadow-raised (box shadow of raised card elements, such as…).",
        ),
        stock(
          "font-bold",
          "font weight bold (700)",
          "Nearest: font-semibold (600, titles…) or font-medium (500, labels, UI headings, emphasis inside body text).",
        ),
        stock(
          "rounded-md",
          "radius md (6px)",
          "Nearest: rounded-medium (5px, buttons, inputs, chips, tooltips, menu items) or rounded-large (7px, cards, popovers, hover cards, menus and…).",
        ),
        stock(
          "hover:bg-blue-600",
          "palette colour blue-600",
          "Blue is bg-information-bold-hovered (hovered state of the bold information or…) or bg-brand-bold-hovered (hovered state of the bold brand background).",
        ),
      ],
    },
    {
      // On an element use-primitives reads, in a product, a padding or a gap is its primitive's
      // prop, with no class suggestion; space-y is a Stack's space, which needs no margins. A size
      // whose type step sets a weight is named with it and never picked; an outline's width is on
      // the border width scale; an easing names its Ledger curve; a bracketed data attribute is its
      // state. A viewport length is Tailwind's own (min-h-dvw generates CSS), another utility
      // (w-row) or another emphasis (bg-danger-bolder) is never a misspelling.
      code: '<p className="p-4 gap-2 space-y-4 text-xl outline-2 ease-in-out data-[disabled]:bg-gray-100 min-h-dvw w-row bg-danger-bolder" />',
      errors: [
        stock("p-4", "spacing step 4 (16px)", '16px is space.200: padding="space.200" on a Box.'),
        stock("gap-2", "spacing step 2 (8px)", '8px is space.100: space="space.100" on a Stack.'),
        stock(
          "space-y-4",
          "spacing step 4 (16px)",
          '16px is space.200: space="space.200" on a Stack, which spaces its children without margins.',
        ),
        stock(
          "text-xl",
          "text size xl (20px)",
          "20px is font-heading-small (weight 500, a section heading set with Heading; at…).",
        ),
        stock(
          "outline-2",
          "outline width 2 (2px)",
          "2px is border.width.selected (the width used to indicate a selected element…) or border.width.focused (the width used for the focus ring on…). A focus outline is outline-focused, which sets its width.",
        ),
        stock(
          "ease-in-out",
          "easing in-out",
          "Its Ledger curve is ease-standard (for what stays on screen throughout: colour, a…); ease-enter and ease-exit are for other motion.",
        ),
        stock(
          "data-[disabled]:bg-gray-100",
          "palette colour gray-100",
          "Grey is bg-disabled (backgrounds of elements in a disabled state).",
        ),
        { messageId: "unknown", data: { cls: "min-h-dvw" } },
        { messageId: "unknown", data: { cls: "w-row" } },
        { messageId: "unknown", data: { cls: "bg-danger-bolder" } },
      ],
    },
    {
      // A negative space-x overlaps the children with margins, a part's own layout; an outline of
      // no width is outline-none.
      code: '<span className="-space-x-2 outline-0" />',
      errors: [
        stock(
          "-space-x-2",
          "spacing step 2 (8px)",
          "A negative space overlaps the children with margins; an overlap is a part's own layout, as AvatarGroup's is.",
        ),
        stock("outline-0", "outline width 0 (0px)", "An outline of no width is outline-none."),
      ],
    },
    {
      // A theme name under a state variant its entry keys takes the class for that state; cmdk's
      // data-[selected=true] is the highlighted item, so it keeps the hover background.
      code: '<div className="data-[state=on]:bg-accent data-[selected=true]:bg-accent placeholder:text-muted-foreground data-[state=selected]:bg-muted bg-sidebar-border fill-foreground" />',
      errors: [
        {
          messageId: "vocabulary",
          data: {
            cls: "data-[state=on]:bg-accent",
            means: "hover background",
            use: "bg-selected (a selected, checked or pressed item)",
            aside: " Ledger's accent-* colours are hues with no meaning.",
          },
          suggestions: [
            replace(
              '<div className="data-[state=on]:bg-selected data-[selected=true]:bg-accent placeholder:text-muted-foreground data-[state=selected]:bg-muted bg-sidebar-border fill-foreground" />',
            ),
          ],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "data-[selected=true]:bg-accent",
            means: "hover background",
            use: "bg-neutral-subtle-hovered",
            aside: " Ledger's accent-* colours are hues with no meaning.",
          },
          suggestions: [
            replace(
              '<div className="data-[state=on]:bg-accent data-[selected=true]:bg-neutral-subtle-hovered placeholder:text-muted-foreground data-[state=selected]:bg-muted bg-sidebar-border fill-foreground" />',
            ),
          ],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "placeholder:text-muted-foreground",
            means: "secondary text colour",
            use: "text-subtlest (a placeholder)",
            aside: "",
          },
          suggestions: [
            replace(
              '<div className="data-[state=on]:bg-accent data-[selected=true]:bg-accent placeholder:text-subtlest data-[state=selected]:bg-muted bg-sidebar-border fill-foreground" />',
            ),
          ],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "data-[state=selected]:bg-muted",
            means: "muted background",
            use: "bg-selected (a selected, checked or pressed item)",
            aside: "",
          },
          suggestions: [
            replace(
              '<div className="data-[state=on]:bg-accent data-[selected=true]:bg-accent placeholder:text-muted-foreground data-[state=selected]:bg-selected bg-sidebar-border fill-foreground" />',
            ),
          ],
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "bg-sidebar-border",
            means: "sidebar border colour as a fill",
            use: "border-default",
            aside: " A line between items is Separator, or a border side such as border-t.",
          },
        },
        {
          messageId: "vocabulary",
          data: {
            cls: "fill-foreground",
            means: "text colour as an SVG fill",
            use: "text-default",
            aside: " An SVG takes its text colour through fill-current, beside a text-* token.",
          },
        },
      ],
    },
    {
      // A width or a height is a layout part's, a preset's or computed: no token is named. A
      // Ledger-shaped key that is no key names the keys either side; a step past a numbered series
      // names its range; a misspelt token class names the class, as an editor suggestion.
      code: '<div className="w-4 max-w-md p-210 fill-chart-categorical-9 bg-surfce hover:!bg-surfce" />',
      errors: [
        {
          messageId: "size",
          data: {
            cls: "w-4",
            what: "width step 4 (16px)",
            advice:
              "A width is a layout part's, a part's preset or computed from its container (w-full, a grid track).",
          },
          line: 1,
          column: 16,
        },
        {
          messageId: "size",
          data: {
            cls: "max-w-md",
            what: "width md",
            advice:
              "A width is a layout part's, a part's preset or computed from its container (w-full, a grid track).",
          },
        },
        {
          messageId: "spaceKey",
          data: { cls: "p-210", advice: "210 falls between p-200 (16px) and p-250 (20px)." },
        },
        {
          messageId: "series",
          data: {
            cls: "fill-chart-categorical-9",
            series: "fill-chart-categorical-*",
            range: "1 to 7",
          },
        },
        {
          messageId: "typo",
          data: { cls: "bg-surfce", meant: "bg-surface" },
          suggestions: [
            replace(
              '<div className="w-4 max-w-md p-210 fill-chart-categorical-9 bg-surface hover:!bg-surfce" />',
            ),
          ],
        },
        {
          messageId: "typo",
          data: { cls: "hover:!bg-surfce", meant: "hover:!bg-surface" },
          suggestions: [
            replace(
              '<div className="w-4 max-w-md p-210 fill-chart-categorical-9 bg-surfce hover:!bg-surface" />',
            ),
          ],
        },
      ],
    },
    {
      // A colour and its dark: twin on the site are one colour in two modes (decision 8), ranked
      // together; the twin is no-dark-variant's. Neither pair is within ΔE 0.02 of one token in
      // both modes, so the roles are named and nothing is picked.
      code: '<div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" />',
      errors: [
        stock(
          "bg-gray-50",
          "palette colour gray-50",
          'With "dark:bg-gray-900", grey is bg-surface-raised (background of raised cards, with…) or bg-surface (primary background for the UI).',
        ),
        stock(
          "text-gray-900",
          "palette colour gray-900",
          'With "dark:text-gray-100", grey is text-default (primary text, such as body copy, sentence case…).',
        ),
      ],
    },
  ],
};

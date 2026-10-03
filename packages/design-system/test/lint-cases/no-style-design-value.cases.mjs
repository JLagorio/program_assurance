// ledger/no-style-design-value: style carries computed values only; a literal length, colour,
// weight, family or margin is a token. The rule follows the value: a branch, a const, a map's
// entry, a spread, a Base UI style callback, useMemo and useCallback, a same-file helper and the
// arguments its call gives it, Object.assign, a named number in a sum, a number written before a
// unit in a template or a concatenation, a product of written numbers, a string in a template's
// hole or a concatenation, a var() fallback, a props spread, recharts' style props and a module's
// const typed as a style. A const style object is reported once, where it is written.
import path from "node:path";

import { KIT, KIT_SETTINGS, REPO } from "../lint-helpers.mjs";

/** A kit file by its path under the kit's src. */
const kitFile = (file) => path.join(REPO, "packages/design-system/src", file);
/** What a width's or a height's finding ends with: no token names one (nearest.js). */
const SIZE = (dimension) =>
  ` A ${dimension} is a layout part's, a part's preset or computed from its container.`;
const SIZES = /^(width|height|(min|max)(Width|Height)|flexBasis)$/;
const sizeOf = (property) =>
  SIZES.test(property) ? SIZE(/eight/.test(property) ? "height" : "width") : "";
/** The data every length finding renders: where it came from and the token of its role nearest
    it, when any; a width or a height says it is a layout part's. */
const length = (
  property,
  value,
  { from = "", token = sizeOf(property), attribute = "style" } = {},
) => ({
  messageId: "length",
  data: { attribute, property, value, from, token },
});
/** A padding's or a gap's length written whole at a space step: its utility and prop, and no
    token (advice.js's styleSpaceUse). */
const spaceLength = (property, value, use, { from = "", attribute = "style" } = {}) => ({
  messageId: "spaceLength",
  data: { attribute, property, value, from, use },
});
/** A colour finding, with the roles its hue plays for the property, when any (decision 8). */
const colour = (property, value, { from = "", attribute = "style", token = "" } = {}) => ({
  messageId: "colour",
  data: { attribute, property, value, from, token },
});
/** Red, as a text colour's roles name it. */
const RED_TEXT = ' Red is token("color.text.danger") or token("color.text.accent.red").';
const named = (messageId, property) => ({ messageId, data: { attribute: "style", property } });
const custom = (messageId, property, value, from = "") => ({
  messageId,
  data: { attribute: "style", property, value, from },
});
const part = (property, token, owner) => ({
  messageId: "partToken",
  data: { attribute: "style", property, token, part: owner },
});

// The kit's Dialog preset map, as dialog.tsx writes it.
const dialogWidths =
  'import type { CSSProperties } from "react"; const dialogWidths: Record<"small" | "medium", CSSProperties> = { small: { maxWidth: 400 }, medium: { maxWidth: 520 } }; export const A = ({ width }) => <div style={{ ...dialogWidths[width] }} />;';
// The kit's Sheet preset map, as sheet.tsx writes it: numbers, read as a style's maxWidth.
const sheetWidths =
  'const sheetWidths: Record<"small" | "medium", number> = { small: 320, medium: 420 }; export const A = ({ width }) => <div style={{ maxWidth: sheetWidths[width ?? "medium"] }} />;';

export default {
  valid: [
    { code: "<div style={{ width: measured }} />" },
    { code: "<div style={{ width: `${percent}%` }} />" },
    { code: '<div style={{ height: "var(--ds-space-200)" }} />' },
    { code: '<div style={{ maxWidth: "calc(100% - var(--ds-space-400))" }} />' },
    {
      code: '<div style={{ width: "100%", flex: 1, lineHeight: 1.2, zIndex: 2, opacity: 0.5 }} />',
    },
    { code: "<div style={{ margin: 0, padding: 0, width: 0 }} />" },
    { code: '<div style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} />' },
    { code: "<div style={{ color: token('color.text.subtle') }} />" },
    { code: '<rect style={{ fill: "url(#hatch-red)" }} />' },
    // A viewport length is the window's own size, structure rather than a design value, and so
    // is a fraction of it inside min().
    { code: "<div style={{ maxHeight: `calc(100dvh - ${top} - var(--ds-space-200))` }} />" },
    {
      code: '<div style={{ width: "90vw", height: "90dvh", top: "min(var(--ds-space-1000), 10dvh)", minHeight: "100svh" }} />',
    },
    // What the value is at runtime passes: a memoised measurement, a forwarded style, a caller's
    // callback, a parameter in arithmetic, a number written in the arithmetic itself.
    {
      code: 'import { useMemo } from "react"; const s = useMemo(() => ({ width: measured }), [measured]); <div style={s} />;',
    },
    { code: "function P({ style }) { return <div style={{ ...style }} />; }" },
    {
      code: "function P({ style }) { return <div style={(state) => ({ ...style(state) })} />; }",
    },
    { code: "<div style={{ paddingInlineStart: depth * gap, top: offset - 1, width: n * 2 }} />" },
    // A factor of a product is a count or a ratio whichever side it is on, named or written in
    // place, and a number written in a sum is an offset the file computes with.
    {
      code: "const INDENT = 16;\nexport const A = ({ depth }) => <div style={{ paddingInlineStart: depth * INDENT, width: `${digits + 1.5}ch` }} />;",
    },
    // Zero is zero in any unit, and relative colour syntax builds on the token after `from`.
    {
      code: '<div style={{ padding: "0px", inset: "0rem", flexBasis: `${0}px`, backgroundColor: "oklch(from var(--ds-color-background-brand) l c h / 0.5)" }} />',
    },
    // A custom property carries any computed value, and a colour name never matches inside a word
    // or a file name.
    {
      code: '<div style={{ "--shell-panel-width": `${width}px`, "--wrap": "white-space", "--icon": "url(/icons/red.svg)", "--gap": token("space.100") }} />',
    },
    // A colour in a module's list of colours is no-raw-colour's, reported where the list is.
    {
      code: 'const tones = { danger: "#e11d48", ok: "#16a34a" }; export const A = ({ tone }) => <i style={{ color: tones[tone] }} />;',
    },
    // A helper's argument the call leaves out, with no default, is undefined.
    { code: "const box = (w) => ({ width: w }); export const A = () => <i style={box()} />;" },
    {
      code: '<div style={{ "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-raised)" }} />',
    },
    { code: '<div style={{ whiteSpace: "nowrap", background: "url(/img/red.png) no-repeat" }} />' },
    // A style prop of a part that is not recharts', and a string that holds a <style>.
    { code: "<Tooltip contentStyle={{ borderRadius: 8 }} />" },
    { code: "const html = `<style>.x { color: red }</style>`;" },
    // A const typed as a style inside a component is judged where it is used, and one that is
    // not typed as a style is no style.
    { code: "export const sizes = { width: 128, height: 84 };" },
    // A kit part's own size, in the file that draws that part.
    {
      code: 'import { token } from "../generated/tokens"; export const P = () => <div style={{ width: token("dimension.part.popover") }} />;',
      filename: kitFile("components/popover.tsx"),
      settings: KIT_SETTINGS,
    },
    // The kit's preset maps are the one place its Dialog and Sheet steps are written.
    {
      code: dialogWidths,
      filename: kitFile("components/dialog.tsx"),
      settings: KIT_SETTINGS,
      only: "ts",
    },
    {
      code: sheetWidths,
      filename: kitFile("components/sheet.tsx"),
      settings: KIT_SETTINGS,
      only: "ts",
    },
  ],
  invalid: [
    {
      code: "<div style={{ width: 240 }} />",
      errors: [{ ...length("width", "240px"), line: 1, column: 15 }],
    },
    {
      code: '<div style={{ color: "#e00", marginTop: 8, fontWeight: 600, fontFamily: "Inter, sans-serif", maxWidth: "620px" }} />',
      errors: [
        colour("color", "#e00", { token: RED_TEXT }),
        named("margin", "marginTop"),
        named("fontWeight", "fontWeight"),
        named("fontFamily", "fontFamily"),
        length("maxWidth", "620px"),
      ],
    },
    {
      code: '<div style={{ margin: "0 auto 4px", fontWeight: "600", marginTop: -4 }} />',
      errors: [
        named("margin", "margin"),
        named("fontWeight", "fontWeight"),
        named("margin", "marginTop"),
      ],
    },
    {
      // A colour function is quoted whole, var() and nested calls included (batch 2).
      code: '<div style={{ background: "rgb(0 0 0 / 0.5)", backgroundColor: "hsl(0 0% 0%)", color: "rgb(var(--x))", borderColor: "hsl(calc(1 + 2) 50% 50%)" }} />',
      errors: [
        // A translucent colour is judged as it shows over the page.
        colour("background", "rgb(0 0 0 / 0.5)", {
          token:
            ' Grey is token("color.background.inverse.subtle") or token("color.background.neutral").',
        }),
        colour("backgroundColor", "hsl(0 0% 0%)", {
          token:
            ' Grey is token("color.background.neutral.bold") (a vibrant background option for neutral UI…).',
        }),
        colour("color", "rgb(var(--x))"),
        colour("borderColor", "hsl(calc(1 + 2) 50% 50%)"),
      ],
    },
    {
      // The call quoted is the one that was reported, as written: at any depth, a template's
      // holes as the code writes them, never a colour inside a url() the check reads past, and a
      // call that never closes by its name.
      code: '<div style={{ background: "hsl(calc(var(--hue) + 180) 80% 50%)", color: `hsl(${hue} 80% 50%)`, borderColor: `rgb(${r} ${g} ${b})`, backgroundImage: "url(\\"data:image/svg+xml,<svg fill=\'rgb(0,0,0)\'/>\\") no-repeat, hsl(0 0% 100%)", outlineColor: "rgb(0 0 0" }} />',
      errors: [
        colour("background", "hsl(calc(var(--hue) + 180) 80% 50%)"),
        colour("color", "hsl(${hue} 80% 50%)"),
        colour("borderColor", "rgb(${r} ${g} ${b})"),
        colour("backgroundImage", "hsl(0 0% 100%)"),
        colour("outlineColor", "rgb"),
      ],
    },
    {
      // Any of the 148 CSS colour names, as a whole word.
      code: '<div style={{ color: "tomato", border: "solid rebeccapurple" }} />',
      errors: [colour("color", "tomato", { token: RED_TEXT }), colour("border", "rebeccapurple")],
    },
    {
      // A viewport length passes, and the design value beside it does not.
      code: '<div style={{ maxHeight: "calc(100dvh - 2rem)", gridTemplateColumns: "minmax(12rem, 1fr)" }} />',
      // A length inside a larger value names no token: it is part of a computation.
      errors: [length("maxHeight", "2rem", { token: "" }), length("gridTemplateColumns", "12rem")],
    },
    {
      // A const style object used twice is reported once, where it is written.
      code: "const box = { height: 84 }; <><div style={box} /><div style={box} /></>;",
      errors: [{ ...length("height", "84px"), line: 1, column: 15 }],
    },
    {
      code: "<div style={{ width: wide ? 320 : undefined }} />",
      errors: [length("width", "320px")],
    },
    {
      code: "<div style={{ width: 240 as number, height: (48 satisfies number) }} />",
      only: "ts",
      errors: [length("width", "240px"), length("height", "48px")],
    },
    {
      // A spread of a const is read where the const is written; the forwarded style is the
      // caller's.
      code: "const defaults = { width: 288 }; function P({ style }) { return <div style={{ ...defaults, ...style }} />; }",
      errors: [{ ...length("width", "288px"), column: 20 }],
    },
    {
      // Base UI's style callback, beside the static style, both spreading the defaults: once.
      code: 'const defaults = { width: 288 }; function P({ style }) { return <div style={typeof style === "function" ? (s) => ({ ...defaults, ...style(s) }) : { ...defaults, ...style }} />; }',
      errors: [{ ...length("width", "288px"), column: 20 }],
    },
    {
      code: '<div style={two ? { flexBasis: "100%" } : { maxWidth: 240 }} />',
      errors: [length("maxWidth", "240px")],
    },
    {
      // A named number in a sum of lengths is that length, said where it came from, with the
      // token of its role when one has exactly its value.
      code: "const INDENT = 16;\nexport const A = ({ offset }) => <div style={{ paddingInlineStart: offset + INDENT }} />;",
      errors: [
        length("paddingInlineStart", "16px", {
          from: ", from INDENT on line 1",
          token: ' On the spacing scale 16px is space.200: token("space.200").',
        }),
      ],
    },
    {
      // A number written before a length unit is that length: a template's hole, a written
      // number in one, a concatenation, and a product whose every factor the file writes.
      code: 'const W = 288;\nconst LABEL = 104;\nexport const A = ({ top }) => <><i style={{ width: `${W}px` }} /><b style={{ height: `${48}px` }} /><u style={{ minWidth: W + "px" }} /><s style={{ flexBasis: `${LABEL / 16}rem` }} /><em style={{ maxHeight: "calc(100dvh - 64px - " + top + "px)" }} /></>;',
      errors: [
        length("width", "288px", { from: ", from W on line 1" }),
        length("height", "48px"),
        length("minWidth", "288px", { from: ", from W on line 1" }),
        length("flexBasis", "6.5rem", { from: ", from LABEL on line 2" }),
        length("maxHeight", "64px", { token: "" }),
      ],
    },
    {
      // A string in a concatenation or a template's hole, and a var()'s fallback, which the page
      // shows wherever the variable is not set.
      code: 'const GUTTER = "24px";\nexport const A = () => <><i style={{ width: "calc(100% - " + GUTTER + ")" }} /><b style={{ height: "var(--h, 40px)", color: "var(--c, #f00)" }} /></>;',
      errors: [
        length("width", "24px", { from: ", from GUTTER on line 1" }),
        length("height", "40px", { token: "" }),
        colour("color", "#f00", { token: RED_TEXT }),
      ],
    },
    {
      // A same-file helper reads what its call gives it; Object.assign merges what it is handed;
      // a memoised style callback is the callback.
      code: 'import { useCallback } from "react";\nconst box = (w) => ({ width: w });\nconst px = (n) => `${n}px`;\nconst base = { minWidth: 96 };\nexport function A({ style }) { const s = useCallback(() => ({ maxWidth: 480 }), []); return <><i style={box(288)} /><b style={{ height: px(40) }} /><u style={Object.assign({}, base, style)} /><s style={s} /></>; }',
      errors: [
        // At box's property, where the style is written, said where the call gave it.
        { ...length("width", "288px", { from: ", from line 5" }), line: 2 },
        { ...length("minWidth", "96px"), line: 4 },
        { ...length("maxWidth", "480px"), line: 5 },
        { ...length("height", "40px"), line: 5 },
      ],
    },
    {
      // Every *Color, the logical border shorthands, a filter and a text decoration hold colours.
      code: '<div style={{ borderInlineStart: "3px solid var(--ds-color-border)", borderBlockEndColor: "red", stopColor: "#f00", filter: "drop-shadow(0 0 4px var(--ds-shadow))", textDecoration: "underline wavy tomato" }} />',
      errors: [
        length("borderInlineStart", "3px"),
        colour("borderBlockEndColor", "red", {
          token:
            ' Red is token("color.border.danger") (borders communicating critical information).',
        }),
        colour("stopColor", "#f00"),
        length("filter", "4px"),
        colour("textDecoration", "tomato"),
      ],
    },
    {
      // A custom property set to a length written whole is a token under another name.
      code: '<div style={{ "--indent": "12px", "--ds-space-200": "13px" }} />',
      errors: [
        custom("customLength", "--indent", "12px"),
        custom("customLength", "--ds-space-200", "13px"),
      ],
    },
    {
      // A part's own size is that part's: a product sizes the part through its props.
      code: 'import { token } from "@ledger/design-system"; export const A = () => <><i style={{ width: token("dimension.part.popover") }} /><b style={{ maxWidth: "var(--ds-dimension-part-key-value-label)" }} /></>;',
      errors: [
        part("width", "dimension.part.popover", "Popover"),
        part("maxWidth", "dimension.part.keyValueLabel", "KeyValue"),
      ],
    },
    {
      // In the kit, another part's file does not read it either.
      code: 'import { token } from "../generated/tokens"; export const P = () => <div style={{ width: token("dimension.part.popover") }} />;',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [part("width", "dimension.part.popover", "Popover")],
    },
    {
      // A named string in a template's hole, and flex's basis as a string.
      code: 'const MIN = "8rem"; export const A = () => <dd style={{ flex: `999 1 ${MIN}` }} />;',
      errors: [length("flex", "8rem", { from: ", from MIN on line 1" })],
    },
    {
      // A member of a map, a same-file helper's return, and the objects a helper is handed.
      code: "const sizes = { sm: { width: 24 } }; function sized(base, style) { return { ...base, ...style }; } const pad = () => ({ padding: 12 }); export const A = ({ style }) => <><i style={sizes.sm} /><b style={sized({ minWidth: 96 }, style)} /><u style={pad()} /></>;",
      errors: [
        length("width", "24px"),
        // <u> is no element use-primitives reads: the prop leads, and the utility follows.
        spaceLength("padding", "12px", 'Use padding="space.150" on a Box, or p-150'),
        length("minWidth", "96px"),
      ],
    },
    {
      // In a product, a plain layout element's or a layout primitive's padding or gap is its
      // primitive's prop alone, since use-primitives reports the utility there; a Box has no gap,
      // so a Stack or an Inline goes in its place. A negative offset keeps its sign, and a pill's
      // radius is radius.full.
      code: 'import { Box, Stack } from "@ledger/design-system"; export const A = () => <><div style={{ padding: 12 }} /><Box style={{ gap: 8, paddingInline: 16 }} /><Stack style={{ rowGap: 16 }} /><div style={{ top: -8, borderRadius: 9999 }} /></>;',
      errors: [
        spaceLength("padding", "12px", 'Use padding="space.150" on a Box'),
        spaceLength(
          "gap",
          "8px",
          'Use space="space.100" on a Stack or an Inline in the Box\'s place',
        ),
        spaceLength("paddingInline", "16px", 'Use paddingInline="space.200"'),
        spaceLength("rowGap", "16px", 'Use space="space.200"'),
        length("top", "-8px", { token: " On the spacing scale -8px is -top-100 (space.100)." }),
        length("borderRadius", "9999px", {
          token: ' On the radius scale 9999px is radius.full: token("radius.full").',
        }),
      ],
    },
    {
      // The widths and radii the scales hold, named by role only: a width has none.
      code: 'import type { CSSProperties } from "react"; export const card: CSSProperties = { width: 128, borderWidth: 1, borderRadius: "5px", outlineWidth: 2 };',
      only: "ts",
      errors: [
        length("width", "128px"),
        length("borderWidth", "1px", {
          token: ' On the border width scale 1px is border.width: token("border.width").',
        }),
        length("borderRadius", "5px", {
          token: ' On the radius scale 5px is radius.medium: token("radius.medium").',
        }),
        // Two tokens hold 2px, border.width.selected and .focused: the role decides, not the value.
        length("outlineWidth", "2px", {
          token:
            ' On the border width scale 2px is token("border.width.selected") or token("border.width.focused").',
        }),
      ],
    },
    {
      // A map of styles, typed as one, is judged entry by entry where it is written.
      code: 'import type { CSSProperties } from "react"; const steps: Record<"a" | "b", CSSProperties> = { a: { maxWidth: 400 }, b: { minHeight: "3rem" } };',
      only: "ts",
      errors: [length("maxWidth", "400px"), length("minHeight", "3rem")],
    },
    {
      // A props object spread onto the element carries its style.
      code: "const props = { role: 'img', style: { width: 240 } }; export const A = () => <div {...props} />;",
      errors: [length("width", "240px")],
    },
    {
      // Recharts' style props are style, named as written.
      code: 'import { Tooltip } from "recharts"; export const A = () => <Tooltip contentStyle={{ borderRadius: 8, color: "#333" }} />;',
      errors: [
        // A length off the scale names the two nearest, and a grey its nearest roles.
        length("borderRadius", "8px", {
          attribute: "contentStyle",
          token:
            ' Nearest on the radius scale: token("radius.large") (7px) or token("radius.xlarge") (9px).',
        }),
        colour("color", "#333", {
          attribute: "contentStyle",
          token: ' Grey is token("color.text") or token("color.text.subtle").',
        }),
      ],
    },
    {
      // A literal colour in a custom property is the one thing it may not carry.
      code: 'const glow = "rgba(59, 130, 246, 0.15)";\nexport const A = () => <div style={{ "--x": "#f00", "--glow": glow, "--paint": "linear-gradient(red, blue)" }} />;',
      errors: [
        {
          messageId: "customColour",
          data: { attribute: "style", property: "--x", value: "#f00", from: "" },
        },
        {
          messageId: "customColour",
          data: {
            attribute: "style",
            property: "--glow",
            value: "rgba(59, 130, 246, 0.15)",
            from: ", from glow on line 1",
          },
        },
        {
          messageId: "customColour",
          data: { attribute: "style", property: "--paint", value: "red", from: "" },
        },
      ],
    },
    {
      code: 'export const A = () => <><style>{".glow { box-shadow: 0 0 40px rgba(59, 130, 246, 0.3) }"}</style><div className="glow" /></>;',
      errors: [{ messageId: "styleElement", data: {} }],
    },
    {
      // The kit's record browser before its widths became viewport lengths: a pixel width in the
      // kit's source is reported as anywhere else.
      code: '<DialogContent style={{ width: "90vw", maxWidth: 1200, height: "90dvh" }} />',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [length("maxWidth", "1200px")],
    },
    {
      // A preset map's widths and heights are its steps; anything else written in it is read.
      code: 'import type { CSSProperties } from "react"; const dialogWidths: Record<"small", CSSProperties> = { small: { maxWidth: 400, height: "calc(100dvh - 2rem)", color: "#f00", padding: 24 } }; export const A = () => <div style={dialogWidths.small} />;',
      filename: kitFile("components/dialog.tsx"),
      settings: KIT_SETTINGS,
      only: "ts",
      errors: [
        colour("color", "#f00", { token: RED_TEXT }),
        spaceLength("padding", "24px", 'Use p-300, or padding="space.300" on a Box'),
      ],
    },
    {
      // A preset map is exempt only in its own kit file, by its own name.
      code: dialogWidths,
      filename: kitFile("components/popover.tsx"),
      settings: KIT_SETTINGS,
      only: "ts",
      errors: [length("maxWidth", "400px"), length("maxWidth", "520px")],
    },
    {
      code: sheetWidths,
      only: "ts",
      errors: [length("maxWidth", "320px", { from: ", from sheetWidths on line 1" })],
    },
    {
      // A length names only its role's family (nearest.js): the nearest two spaces for padding, a
      // type class for a font size, never a container or breakpoint threshold for a width.
      code: "<div style={{ padding: 10, fontSize: 14, lineHeight: 1.4, letterSpacing: 1, width: 288 }} />",
      errors: [
        length("padding", "10px", {
          token:
            ' Nearest on the spacing scale: token("space.100") (8px) or token("space.150") (12px).',
        }),
        length("fontSize", "14px", {
          token: " Nearest on the type scale: font-body (13px) or font-body-large (15px).",
        }),
        length("letterSpacing", "1px"),
        length("width", "288px"),
      ],
    },
    {
      // A component of the file hands its style on to a part other than the one its className
      // reaches: the advice is for where the style lands, the <div>, or the Stack inside it.
      code: 'import { Stack } from "@ledger/design-system"; function W({ className, style }) { return <div style={style}><Stack className={className}>x</Stack></div>; } function V({ className, style }) { return <div className={className}><Stack style={style}>x</Stack></div>; } export const A = () => <><W className="min-w-0" style={{ gap: 16 }} /><V className="min-w-0" style={{ gap: 16 }} /></>;',
      errors: [
        spaceLength("gap", "16px", 'Use space="space.200" on a Stack or an Inline, or gap-200'),
        spaceLength("gap", "16px", 'For the <Stack> inside <V>, use space="space.200"'),
      ],
    },
  ],
};

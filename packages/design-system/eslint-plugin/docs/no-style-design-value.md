# ledger/no-style-design-value

Reports a literal length, colour, font weight, font family or margin written in a `style` object, a literal colour or length in a custom property, a part's own size read by anything but that part, and a `<style>` element.

## Reports

Each property of a style object whose value is one of these:

- a margin: any `margin*` property other than `0`, `0px` or `auto`, a negative number included (`style.marginTop is a margin.`);
- a literal length on a size, padding, gap, inset, radius, border width, outline, font size, letter spacing, flex basis, `containIntrinsic*Size`, `scroll(Padding|Margin)*` or grid template property, as a number (`padding: 12` reads as 12px) or with a unit (`width: "18rem"`), and on `flex` as a string (`flex: "1 1 12rem"`; a number is its grow factor): `style.padding is a literal length (12px).` A length inside a colour property's value is one too, so a border shorthand (`borderLeft` or `borderInlineStart`), an `outline`, a shadow, a `filter` or a gradient's stops are reported for their length even when the colour is a token: `boxShadow: "0 1px 2px var(--ds-shadow)"` gives `style.boxShadow is a literal length (1px).`;
- a literal colour on a colour property (`color`, `background`, `backgroundImage`, every `*Color` such as `borderInlineStartColor`, `stopColor` or `scrollbarColor`, the border shorthands, physical and logical, `outline`, `fill`, `stroke`, the shadows, `filter`, `textDecoration` and `columnRule`): a hex value, a colour function (`rgb()`, `hsl()`, `oklch()` and their kin), quoted whole as written (`(hsl(0 0% 100%))`), or any of the 148 CSS colour names as a whole word (`tomato`, `rebeccapurple`), never inside another word or a file name (`white-space`, `url(/icons/red.svg)`);
- a literal font weight (`fontWeight: 600`), or a `fontFamily` string of any kind, a `var(--…)` included;
- in a custom property (`"--glow"`), a literal colour, and a literal length written whole rather than built around a value the page computes: `style["--glow"] is a literal colour (#ec4899).`, `style["--indent"] is a literal length (12px).` A custom property set from a template with a hole (`` `${width}px` ``), a `var()` or `token()` carries a computed value and passes;
- a part's own size, `token("dimension.part.…")` or `var(--ds-dimension-part-…)`, read anywhere but the part that keeps it: `style.width reads dimension.part.popover, the size Popover keeps for itself.` A product sizes that part through its props; in the kit, each part token is read only in the file that draws its part.

A `<style>` element is reported where it opens: `<style> writes CSS that no token rule reads.`

The rule follows the value to where it is written, in the same file: a branch of a condition, both sides of `||` and `??` and the right of `&&`; a `const`, a `let` never written again, a map's entry (every entry for a key known only at runtime) and a component's default for a prop; an object spread into the style, where the object is a const of the file (a received `style` is the caller's and is skipped), and the objects `Object.assign` merges; a Base UI style callback, `style={(state) => ({ … })}`, a function declared in the file and passed as the style, and one `useCallback` memoises; what a same-file function returns and what `useMemo(() => …)` memoises, with each parameter read as the call gives it (`box(288)` gives `w` 288, and an argument the call leaves out is its default), and the objects handed to a same-file helper that merges them (`sized(defaults, style)`). It reads what a value is built from: the strings of a template's holes and of a concatenation's operands (`` `999 1 ${MIN}` ``, `"calc(100% - " + GUTTER + ")"`); a number written straight before a length unit, a name's or one written in place (`` `${W}px` ``, `W + "px"`); a named number in a sum of lengths (`offset + GAP` is GAP's); and a product whose every factor the file writes (`WIDTH / 16` of a 104 is 6.5, before `rem`). It reads the `style` of a props object spread onto the element (`<div {...props} />`), recharts' style props (`contentStyle`, `wrapperStyle`, `labelStyle` and `itemStyle` on a part imported from `recharts`, named as written: `contentStyle.borderRadius is a literal length (8px).`), and a module's `const` typed as a style (`CSSProperties`, alone, in a union or asserted with `as` or `satisfies`) or as a map of them (`Record<…, CSSProperties>`), judged where it is written whether or not the file renders it.

When the literal is written somewhere else, the finding says where: `style.paddingInlineStart is a literal length (16px, from INDENT on line 12).`, or `(288px, from line 30)` for a call's argument. When the literal is the whole value and the property's role has a token scale, the finding names the token of that scale with the literal's value, or the two nearest: a padding, a gap or an inset on the spacing scale (`space.*`), a border or outline width on the border width scale (`border.width.*`), a radius on the radius scale (`radius.*`) and a font size on the type scale, as its class: `On the spacing scale 16px is space.200: token("space.200").`, `Nearest on the radius scale: token("radius.large") (7px) or token("radius.xlarge") (9px).` A value two tokens hold names both. A width or a height names no token, since its role is not the property's (a popup, a measure, a control height and a container size can share a value): `A width is a layout part's, a part's preset or computed from its container.` A literal colour names the roles its hue plays for the property, as tokens: `style.color is a literal colour (#e00). … Red is token("color.text.danger") or token("color.text.accent.red").` A length inside a larger value (`calc(100dvh - 2rem)`) names none.

A padding or a gap whose literal is its whole value, written in the style itself, at a space step exactly names the prop that takes that step and its utility. In a product, on a plain layout element or a layout primitive, it names the prop alone, since [`ledger/use-primitives`](use-primitives.md) reports the utility there: `style.padding is a literal length (16px). Use padding="space.200" on a Box; style is for computed values (a measured size, a CSS variable).`; a gap on a Box names a Stack or an Inline in the Box's place, since a Box has no gap. Through a component of the file that hands its `style` to a layout primitive, the advice is for that primitive, wherever the component's `className` goes: `For the <Stack> inside <Pane>, use space="space.200"`. On any other element the prop leads and the utility follows (`Use padding="space.200" on a Box, or p-200`), and in the kit's own source the utility leads (`Use p-200, or padding="space.200" on a Box`). `gap` names `space` on a Stack or an Inline, `rowGap` a Stack's, `columnGap` an Inline's. A negative offset keeps its sign (`top: -8` is `-top-100`), and a radius of 9999 or `50%` is `radius.full`. Every other message says: `Use a token utility or a primitive prop; style is for computed values (a measured size, a CSS variable).` A `var(--…)` reference and a `url(…)` are taken out of the value before it is read, but a `var()`'s fallback is read, since it is what the page shows wherever the variable is not set (`var(--w, 288px)` gives 288px). Zero is never reported, in any unit (`0`, `"0px"`, `"0rem"`), and neither is relative colour syntax built on a token (`oklch(from var(--ds-color-background-brand) l c h / 0.5)`). A style object used by several elements, or reached twice, is reported once, where it is written, and a colour in a module's list of colours is [`ledger/no-raw-colour`](no-raw-colour.md)'s, reported once where the list is.

A viewport length is not a design value: `100dvh`, `90vw`, a fraction such as `10dvh` inside `min()`, and every other viewport unit (`vh`, `vw`, `dvh`, `dvw`, `svh`, `svw`, `lvh`, `lvw`, `vi`, `vb`, `vmin`, `vmax`) are the window's own size, structure the way `100%` is, so `calc(100dvh - 2rem)` is reported for its `2rem` only. In the kit's own source, the widths and heights of the Dialog and Sheet preset maps (`dialogWidths` in `components/dialog.tsx`, `sheetWidths` in `components/sheet.tsx`) are not read: each map is the kit's one place for its width steps, which `width="small" | … | "fullscreen"` chooses. Anything else written in one, a colour, a padding or a radius, is read as anywhere else, and a map of the same name elsewhere is reported as any other.

## Why

A design value written in `style` is a copy of a token that no longer follows it: it does not flip in dark mode, it does not change when the scale does, and no class-based rule can see it. A literal colour in a custom property is the same copy under another name, and a `<style>` element is CSS that no rule reads at all. Ledger keeps design values in tokens and the props that take them, and leaves `style` for what only the running page knows: a measured width, a percentage, a position, the window's size, or a CSS variable. The Which token page gives the token for each job ([Which token](../../src/stories/docs/WhichToken.mdx)).

## Instead

A token utility in `className`, or a primitive's prop. For example `p-200`, `gap-100`, `text-subtle` or `rounded-medium`, and `<Box padding="space.200">` or `<Stack space="space.100">`; a value computed at runtime stays in `style`, and a token it needs comes through `token("space.200")`. A part's own size is the part's prop (a Popover's `style` where its page says so, a CodeBlock's `maxHeight`); a custom property takes `token("color.…")`; and a rule for a stylesheet belongs in the kit's own CSS, on tokens, through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function Legend() {
  return (
    <Box style={{ padding: 12 }}>
      <Text>Coverage by control family</Text>
    </Box>
  );
}
```

```tsx reported
export function Hint({ children }: { children: string }) {
  return <p style={{ color: "#6b7280" }}>{children}</p>;
}
```

```tsx reported
const heading = { fontWeight: 600, marginBottom: 8 };
const GUTTER = 16;

export function GroupHeading({ children, offset }: { children: string; offset: number }) {
  return <h3 style={{ ...heading, paddingInlineStart: offset + GUTTER }}>{children}</h3>;
}
```

```tsx reported
const glow = "rgba(59, 130, 246, 0.15)";

export function Highlight({ children }: { children: string }) {
  return (
    <>
      <style>{"mark { box-shadow: 0 0 0 4px var(--glow) }"}</style>
      <mark style={{ ["--glow" as string]: glow }}>{children}</mark>
    </>
  );
}
```

### Allowed

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function Legend() {
  return (
    <Box padding="space.200">
      <Text color="color.text.subtle">Coverage by control family</Text>
    </Box>
  );
}
```

```tsx allowed
export function ResizeGuide({ offset, share }: { offset: number; share: number }) {
  return <div aria-hidden style={{ insetInlineStart: offset, inlineSize: `${share}%` }} />;
}
```

```tsx allowed
import { Box, Text, token } from "@ledger/design-system";

export function TreeLabel({ depth, label }: { depth: number; label: string }) {
  return (
    <Box
      backgroundColor="color.background.accent.blue.subtler"
      style={{ paddingInlineStart: `calc(${depth} * ${token("space.200")})` }}
    >
      <Text>{label}</Text>
    </Box>
  );
}
```

```tsx allowed
export function Backdrop({ top }: { top: string }) {
  return <div aria-hidden style={{ maxHeight: `calc(100dvh - ${top})`, inlineSize: "90vw" }} />;
}
```

## Suggestions and fixes

Neither. A literal in style becomes a token utility, a primitive prop or a `token()` call, which rewrites more than the value, and the token that replaces it is a choice of role, so the rule offers no `--fix` and no editor suggestion; the message names the token of the property's role nearest the value.

## Allowances

The rule takes the plugin's `allow` option, a count of reports per file that may only shrink. It runs in both presets; `configs.package` turns it off in the kit's stories, where a Don't story shows the mistake on purpose. Neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails: a part's own size in the kit reads its role token, `token("dimension.part.…")`, and a drawing is on a token's steps (`calc(n * token("space.025"))`). A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A value written in another file is not read: an imported constant or style, what an imported function returns (`style={withStyle(base, style)}`), and the values a prop is given where a parent renders the part.
- A value only the running page knows passes: a parameter, a call the file cannot follow, `token()` and `var()`. A template literal is read by its fixed parts and what its holes give, so `` `${size}px` `` passes when `size` is a prop.
- A factor of a product is a count or a ratio, whichever side it is on, so a product with a factor the page computes is not read, a name's number or one written in place alike (`depth * INDENT`, `rows * ROW`, `n * 16`); write the length as a token (`` `calc(${depth} * ${token("space.200")})` ``). A number written in a sum itself (`offset - 1`, `digits + 1.5`) is an offset the file computes with and is not read either; a named one is.
- `lineHeight` is not read, a number on `flex` is its grow factor, and a custom property's length is read only when it is written whole.
- A 1px length is reported in a style as any other (a hairline is `border.width`), where the kit's stylesheets take 1px as the hairline.
- A design value in a stylesheet is outside the rule: the kit's own CSS is held to its tokens by `test/css-tokens.test.mjs`. A colour in an SVG attribute such as `fill="#fff"` is [`ledger/no-raw-colour`](no-raw-colour.md)'s.

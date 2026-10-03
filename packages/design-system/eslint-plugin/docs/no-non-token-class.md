# ledger/no-non-token-class

Reports a class that is neither a token utility nor a documented structural utility.

## Reports

- A class from Tailwind's stock theme that Ledger does not use: a palette colour (`bg-red-500`, `text-zinc-600`) or a stock scale (`p-4`, `text-sm`, `font-bold`, `rounded-md`, `shadow-lg`). It names the Ledger token nearest the value, only from the family the utility's role names: a space for padding, gap, inset and translate (`"p-4" is Tailwind's spacing step 4 (16px), which Ledger's tokens replace. 16px is p-200 (space.200).`), a type style for a text size, then a weight, a radius and a drop shadow. A value between two steps names both, and one off the scale the scale's range. A colour names the roles its hue plays, each with its purpose (`Red is bg-danger-bold (a vibrant background for critical information…) or bg-accent-red-bolder (a red fill that carries no meaning, for…).`), in the state its variant asks for (a hovered token under `hover:`, a disabled one under `disabled:`); a colour and its `dark:` twin on the same site are ranked together, in both modes (`With "dark:bg-gray-900", grey is bg-surface-raised … or bg-surface …`). A stock width or height names no token: `"w-4" is Tailwind's width step 4 (16px). A width is a layout part's, a part's preset or computed from its container (w-full, a grid track).` (a height's example is `h-full`, a size's `size-full`). On an element [`ledger/use-primitives`](use-primitives.md) reads, in a product (a plain layout element or a layout primitive), a padding or a gap is named as its primitive's prop instead, since that rule reports the class there: `16px is space.200: padding="space.200" on a Box.` `space-x-*` and `space-y-*` set margins on the children, so they name the parent's space (`space="space.200" on a Stack, which spaces its children without margins`). A text size whose type style also sets a weight names it (`20px is font-heading-page (weight 600, …)`; a type step the tokens mark replaced is never named), an outline's width the border widths and `outline-focused`, and `ease-in-out`, `ease-out` and `ease-in` their Ledger curves (`ease-standard`, `ease-enter`, `ease-exit`). A stacking order past a part's own steps (`z-30`, `z-50`; a part keeps `z-0`, `z-10` and `z-20` inside itself) names the layers that stack the page's regions, and the layer of its number where there is one (`"z-50" is Tailwind's z-index 50, which Ledger's tokens replace. Use z-overlay, the layer at 50.`). A grey's roles differ by elevation, not by value, so a grey pair names two roles unless the site names its role with a token twin, and a pale tint written as a colour is its hue's (`#fef2f2` is red), not a grey's.
- A misspelt token class, named when one token class of the same utility is nearest (one edit under six letters, else two): `"bg-surfce" is "bg-surface" misspelt, so it generates no CSS.` Another utility is another property, so `w-row` is never `h-row` nor `border-w-bold` `border-bold`; another emphasis or state of one token (`bg-danger-bolder`, `bg-brand-subtle`) is a value, not a slip; and a class that ends in a Tailwind value keyword is never respelled: a sizing utility at a viewport length (`min-h-dvw`, which generates `min-height: 100dvw`) is Tailwind's own, and reported as unknown. A Ledger-shaped space key that is no key names the keys either side of it (`"p-210" names no key on Ledger's space scale, so it generates no CSS. 210 falls between p-200 (16px) and p-250 (20px).`), and a step past a numbered series its range (`"fill-chart-categorical-9" steps past fill-chart-categorical-*, which runs 1 to 7, so it generates no CSS.`). Any other word in a class position is reported as unknown.
- The same class under a variant or with `!`: `hover:bg-gray-100`, `!bg-red-500`.
- A class that names a physical side, whose logical twin is a class Ledger has: `text-left`, `pl-200`, `-right-100`, `border-l`, `rounded-tr-large`. A physical side holds when the page reads right to left, so a right-aligned figure ends up at the start and a leading inset at the end; the twin mirrors with the page: `"text-left" names a physical side, which holds when the page reads right to left. Use "text-start", which mirrors with it.` Under a variant that names a side or a direction (`data-[side=left]:-right-025`, a drawer's `data-[swipe-direction=right]:`, `rtl:`, `ltr:`) the physical side is the meaning and passes, and so does a half inset (`left-1/2` with `-translate-x-1/2`), which centres the same either way. A stock step's advice names its twin's token too (`"pl-4" … 16px is ps-200`).
- A Tailwind palette colour with an opacity modifier, with its own message, which names the roles its hue plays as the colour shows over each mode's page: `"bg-red-500/50" is a Tailwind palette colour with alpha; neither is on the tokens. Red is bg-danger-subtle (…) or bg-accent-red-subtler (…).` A prefix with no colour tokens (`ring-black/10`) is told to use the token for its role. Alpha on a shadcn theme name (`bg-muted/50`) is named as below; on any other word that is no token (`bg-unknown/50`), it is reported as unknown.
- A shadcn theme name, which generates no CSS in Ledger, named as the Ledger class for its job: `"text-muted-foreground" is shadcn's secondary text colour, which generates no CSS in Ledger. Use text-subtle.` Where the job has two classes it names both and when each fits (`bg-muted`: `bg-neutral` for a neutral fill, `bg-surface-sunken` for a recessed region), and `bg-accent` adds that Ledger's `accent-*` colours are hues with no meaning. Under a state variant its entry keys, the name takes that state's class: a selected, checked or pressed item (`data-[state=on]:bg-accent`, `aria-selected:`, `data-[state=selected]:bg-muted`) is `bg-selected` or `text-selected`, and a placeholder (`placeholder:text-muted-foreground`) `text-subtlest`; cmdk's `data-[selected=true]` marks the highlighted item, so it keeps the hover background. With alpha it names the colour and leaves the shade to a state token: `"bg-muted/50" is shadcn's muted background with alpha, …; a shade of it is a state token, never alpha.` The names and their classes are one table, `build/vocabulary-aliases.json`, which the token build checks (each name generates no CSS and is no Ledger class, and each class is one the allowlist lists) and the [Coming from shadcn](../../src/stories/docs/FromShadcn.mdx) page shows. `border-input` and `bg-input` are Ledger's own tokens too, and pass.
- A leading minus on a padding, gap or size, which Tailwind does not negate, so the class generates no CSS, with its own message: `"-p-200" generates no CSS: padding cannot be negative. Drop the minus, or pull the content outward with Bleed.` A size says only to drop the minus (`"-size-full" generates no CSS: width and height cannot be negative. Drop the minus.`). A minus on any other utility Tailwind does not negate (`-border-default`, `-line-clamp-2`) is reported as unknown, and a minus where Tailwind negates the utility (`-inset-x-100`, `-translate-y-full`, `-indent-200`) passes.
- A spelling Tailwind generates no CSS for, though it looks like structure: an alignment value another property takes (`items-between`), `inert` (an attribute, not a class), `-mt-auto`, `grid-cols-0`, `float-both`, `size-screen`, a chart library class other than the one the kit's chart reads, and a kit utility its CSS does not declare (`stat-grid-7`).
- A layout rule the kit keeps inside one of its parts, which generates no CSS as a class, with the part that owns it and what to write instead: `sticky-rail` is StickyRail's (`"lg:sticky-rail" is StickyRail's own layout, kept inside the part, so the class generates no CSS. Wrap the column in <StickyRail from="lg">.`), the `shell-*` regions and `grid-cols-main-rail` the Shell's (compose its parts; the rail is Shell.Aside beside Main), `min-h-work` and `grid-cols-list-detail` WorkPane's (a WorkPane, or `min-h-dvh` for a region as tall as the window), and `sticky-bar` ActionBar's (a record's actions go in PageHeader.Actions).
- A class built at runtime: a template or a concatenation that glues a value to a word, reported once where it is written, whatever element it reaches: `"bg-${tone}" builds a class name at runtime, which Tailwind cannot generate and the lint cannot check.` Its fragments (`bg-`) and the value it glues are not reported as classes, and only the glued words are quoted; the whole classes beside it are read as usual. A hole whose every value brings its own space, or is empty (`` `flex${on ? " gap-100" : ""}` ``), glues nothing: the word beside it and the hole's classes are read.
- Stale lint data, once per file at line 1, whichever of this rule, [`ledger/no-arbitrary-value`](no-arbitrary-value.md) and [`ledger/no-unknown-variant`](no-unknown-variant.md) runs first on the file: `"src/generated/lint.json" is stale: src/styles/layout.css has changed since the token build wrote it. Run npm run build:tokens in @ledger/design-system.` In the kit's checkout the data is stale when an input it was built from (the allowlist, the token docs or a stylesheet) has changed since; anywhere, when `lint-values.json` comes from another build than `lint.json`. The finding is about the package's build, not the file, and the rules still judge the file. The Lint rules page says what the lint data holds, under "What the lint knows of Tailwind".

It reads every place the lint reads classes: `className`, `class` (a `class` value that reads as no classes, such as OSCAL's `"sp800-53a"`, is data), any `*ClassName` attribute or object key, any `*Class` attribute of an element (`containerClass`, `iconClass`) for the strings in it that read as classes or are each a class Tailwind places (a word no class is spelt like is the prop's data: `impactClass="high"`, react-scroll's `activeClass="active"`), a slot map (a `classNames` object, by its values at any depth; a `classNames` string is a prefix), a readable object spread onto an element, the class helpers (`cn`, `clsx`, `twMerge` and `classes`; `cx`, `twJoin` and `classNames` where the file imports them; `cva`, and `tv` where imported, by their configs; the names in `settings.ledger.classFunctions` and `settings.ledger.variantFunctions`; a known helper imported under another name or read from a namespace; and a const that holds a helper, `const merge = cn`), a className callback, and what a class site reads in the same file: a `const`; a `let` or `var` with each value assigned to it, and text appended after a space; a destructured slot; the defaults a component gives its props; an entry of a map, a list, an enum or an `Object.freeze` (every entry, for a key known only at runtime); a key a helper's object computes from a same-file value (`cn({ [active]: on })`); each entry of a list a `.map` callback walks; what a function, a `useMemo`, a `useCallback` or a `useState` gives, and what each call gives a same-file function's parameter (`note("text-danger")`); a `[…].join(" ")`, `.filter(Boolean)`, `.trim()`, `.concat()`, `Object.values()` or a spread argument; a template hole that brings its own space (`` `flex${on ? " gap-100" : ""}` ``); and a DOM element's classes, written to `className` (`el.className = "…"`, `+=`) or given to `classList.add` and `classList.toggle`. A module-level string or map whose strings read as classes is reported where it is declared, through an `Object.freeze`, a same-file spread, each branch of a condition, a template's own text and the values of `Object.fromEntries` or `new Map`, but not its data: a bare word no rule knows (`"danger"`, `"none"`), or a key whose values across its records are mostly not classes. A bare word is no evidence that a map holds classes (`"flex"` is also a CSS value, `"hidden"` an attribute), so a style object, a list of attributes or a list of views is no class map. A class the lint can say no more of: `"items-between" is neither a token utility nor a documented structural utility.`

A class has one owner, so it is reported once. This rule reports a class no other class rule owns; the others come first, in this order: a `dark:` class is [`ledger/no-dark-variant`](no-dark-variant.md)'s, any other margin at any key (`mt-4`, `mt-[13px]`) [`ledger/no-margin`](no-margin.md)'s, any other class under a variant Tailwind does not generate (`hovr:bg-red-500`, `tablet:truncate`) [`ledger/no-unknown-variant`](no-unknown-variant.md)'s, an arbitrary value or a variable shorthand (`w-[240px]`, `w-(--rail)`) [`ledger/no-arbitrary-value`](no-arbitrary-value.md)'s, alpha on a token (`bg-brand-bold/50`) [`ledger/no-alpha-token`](no-alpha-token.md)'s, a stock class that fixes a design value (`rounded`, `opacity-50`, `bg-white`) [`ledger/no-static-design-value`](no-static-design-value.md)'s, which names the token that owns it, and a deprecated token [`ledger/no-deprecated-token`](no-deprecated-token.md)'s. The owner is the rule whose fix takes the whole class away or rewrites it.

## Why

The allowlist is written by the token build (`src/generated/utilities.json`), so a class the lint accepts is one the design owns: a colour that follows the mode, a space on the scale, a style from the type ramp. A stock class looks right in one mode and at one size, and drifts from everything around it when a token changes. Structural utilities carry no design value (display, position, alignment, overflow, text flow and interaction), so they are allowed as written; the [Lint rules](../../src/stories/docs/Lint.mdx) page lists them under "What counts as structural", and `structural` in [classes.js](../classes.js) holds every pattern of Tailwind's own. The kit's own `@utility` names come from its CSS: the token build reads them into `src/generated/lint.json`, so a utility the kit declares passes with no edit to the lint, and one it removes fails. Every spelling the lint admits generates CSS, which `test/lint-tailwind.test.mjs` asks Tailwind.

## Instead

The token utility for the job; [Which token](../../src/stories/docs/WhichToken.mdx) is the short answer by job.

- A colour: the role's token, such as `text-subtle`, `bg-danger-subtle` or `border-default`. A palette colour with alpha is one of these too: a tone's subtle emphasis (`bg-danger-subtle`) or a surface (`bg-surface-sunken`), never a colour with a modifier. Text takes it as `color` (`color="color.text.danger"`) and a Box as `backgroundColor`; a Heading's `color` is only the text colour or its inverse on a bold fill, since a tone is for a word, not a title.
- Space and size: the space scale's key on any spacing or sizing property (`p-200`, `gap-100`, `w-400`), or a primitive's prop (`space="space.200"`, `padding="space.200"`).
- A side: the logical one, which mirrors when the page reads right to left: `text-start` and `text-end`, `ps-` and `pe-`, `start-` and `end-`, `border-s` and `border-e`, `rounded-s`, `rounded-e`, `rounded-ss`, `rounded-se`, `rounded-es` and `rounded-ee`.
- Type: `font-body`, `font-body-small` or `font-heading-page`, or Text's `size` and `weight`; a title is a Heading.
- Radius and shadow: `rounded-xsmall` to `rounded-full`, `shadow-raised`, `shadow-overlay`.
- A shadcn theme name: the Ledger class its message names, from the Coming from shadcn page's table (`text-muted-foreground` is `text-subtle`, `bg-background` is `bg-surface`).
- A class that depends on a value: a map from each value to its whole class (`{ danger: "bg-danger-subtle", success: "bg-success-subtle" }`, read as `background[tone]`), which Tailwind generates and the rule checks entry by entry, or the part's own prop where it has one, such as a Badge's `tone`.
- A value no token covers is a kit change, made through `/ledger-add-part`.

## Examples

### Reported

```tsx reported
import { Text } from "@ledger/design-system";

export function OverdueLabel() {
  return (
    <Text>
      <Text className="text-red-600">Overdue</Text>{" "}
      <Text className="text-muted-foreground">since Monday</Text>
    </Text>
  );
}
```

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function SummaryCard({ children }: { children: string }) {
  return (
    <Box padding="space.200" className="rounded-md bg-zinc-900/5 shadow-lg">
      <Text>{children}</Text>
    </Box>
  );
}
```

```tsx reported
import { Text } from "@ledger/design-system";

export function ControlRow({ selected, name }: { selected: boolean; name: string }) {
  return (
    <div className={selected ? "bg-selected" : "bg-surfce"}>
      <Text>{name}</Text>
    </div>
  );
}
```

```tsx reported
import { Box, Text } from "@ledger/design-system";

export function Callout({ tone, children }: { tone: "danger" | "success"; children: string }) {
  return (
    <Box padding="space.200" className={`bg-${tone}-subtle`}>
      <Text>{children}</Text>
    </Box>
  );
}
```

### Allowed

```tsx allowed
import { Text } from "@ledger/design-system";

export function OverdueLabel() {
  return (
    <Text>
      <Text color="color.text.danger">Overdue</Text>{" "}
      <Text color="color.text.subtle">since Monday</Text>
    </Text>
  );
}
```

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function SummaryCard({ children }: { children: string }) {
  return (
    <Box
      padding="space.200"
      backgroundColor="elevation.surface.raised"
      className="overflow-hidden rounded-large shadow-raised"
    >
      <Text>{children}</Text>
    </Box>
  );
}
```

```tsx allowed
import { Box, Text } from "@ledger/design-system";

export function ControlRow({ selected, name }: { selected: boolean; name: string }) {
  return (
    <Box
      padding="space.100"
      backgroundColor={selected ? "color.background.selected" : "elevation.surface"}
    >
      <Text maxLines={1}>{name}</Text>
    </Box>
  );
}
```

```tsx allowed
import { Text } from "@ledger/design-system";

const background = { danger: "bg-danger-subtle", success: "bg-success-subtle" } as const;

export function Callout({ tone, children }: { tone: keyof typeof background; children: string }) {
  return (
    <div className={background[tone]}>
      <Text>{children}</Text>
    </div>
  );
}
```

## Suggestions and fixes

No fix. An editor suggestion only where one class stands for the class: a misspelt token class's respelling (`bg-surfce` offers `bg-surface`, under the same variants and `!`), a physical side's logical twin (`hover:pl-200` offers `hover:ps-200`), and the token of a stock value's role that holds exactly its value (`p-4` offers `p-200`, `text-xs` `font-body-small`, `rounded-xl` `rounded-xxlarge`, `z-50` `z-overlay`). A colour is offered only when one role of its hue holds it within ΔE 0.02 in both modes, which a palette colour alone never is, since no token keeps one colour in both; with its `dark:` twin, the pair can be. When two roles hold it, both are named and neither is offered, and a grey pair is offered only where the site names its role with a token twin (`bg-white dark:bg-surface`), since a white page is the surface and a grey as pale is sunken or raised. A padding or a gap named as a primitive's prop is never offered as a class. A value between two steps, a value two tokens hold, a shadow, a width and a colour's roles are named, never offered, since which one is right depends on the role.

A shadcn theme name names its job, so its Ledger class is an editor suggestion, one for each class when the table names two (`bg-muted` offers `bg-neutral` and `bg-surface-sunken`), under the same variants and `!`. None is offered with alpha, since dropping the alpha changes the look; for a class written in a template, which a suggestion does not rewrite; or for a name whose Ledger class does another job (`bg-border`, a line drawn as a fill, which is `border-default` on a border or a Separator). A suggestion never runs under `--fix`, and it writes only a class no Ledger rule reports.

## Allowances

The rule takes the plugin's `allow` option: a count of reports per file that may only shrink. A file with more reports than its count fails, and one with fewer fails until the count is lowered. The rule is an error in the kit's stories too, so the parts a story demonstrates stay on the tokens, and neither the kit's `test/lint-allow.json` nor this repository's `scripts/lint-allow.json` has an entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- Only the class after the last `:` is checked here. Its variants are [`ledger/no-unknown-variant`](no-unknown-variant.md)'s, which reports a class under one Tailwind does not generate (`hovr:bg-surface`, `tablet:truncate`) whatever its base.
- A class is checked against the allowlist, not against Tailwind at lint time. Every spelling the allowlist admits generates CSS in the Tailwind release the lint data reflects (the Lint rules page names it); on another release a spelling may generate none, and a class Tailwind generates that the allowlist leaves out is reported.
- A class built at runtime is reported as one, not read: which class it makes depends on the value, so the rule cannot say whether that class is a token.
- A class the lint cannot follow is not seen: one passed in through a prop (a received `className` is the caller's), imported from another file, returned by a function from another file, or held in a variable changed other than by assigning it (`k++`, `k.a = …`, text appended with no space before it). A module-level string is checked where it is declared only when at least half of its words are classes the lint knows, or when each word is one it knows or one no data is spelt like and one at least is the latter (a bracketed value, a class with alpha or a Tailwind palette colour, on a utility Tailwind places: `export const width = "w-[240px]"`, but not the identifiers `"sp-800-53/5"` or `"items-[0]"`), and a module-level map only when most of its strings other than bare words are, so a string of other stock classes exported for another file passes (`"p-4 shadow-md"`), and so does a map a call builds (`(() => ({ … }))()`, a function that returns one) that no class site in the file reads. A `Map` read with `.get`, and a pair destructured from `Object.entries(…)`, are not followed to their values.
- The nearest token comes from the lint data (`lint-values.json`). While the data is stale, a stock class is reported as unknown, since stale data is no guide to what the CSS generates today.
- A class in a stylesheet or in `@apply` is outside the lint; a value in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s.

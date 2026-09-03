# Design system architecture: tokens, primitives, enforcement

Proposal v2, 2026-09-02. Supersedes v1 of the same day, which framed this as a refactor of the prototype's kit. Josef reframed it: the system is the product's, it will be a large project outside the prototype, and it should sit close to Atlassian's grammar and enforcement. The prototype is the first consumer, not the thing being polished.

## Decisions taken (2026-09-02)

- Dark mode is v1.
- Atlassian's token grammar, tiering and enforcement model. The shadcn names are retired.
- A palette of ramps replaces hand-tuned values. Semantic tokens reference ramp steps only.
- The system is its own package with a token build. Product code lays out through typed primitives. The prototype is a consumer of the package and the package can be installed by any other project. Josef, later the same day: "I want the design system self-contained and the prototype is our consumer of that system, then I can port this design system elsewhere."
- Mode: match the system by default, a three-state control (light, dark, match system) in the user menu, preference behind one storage function, a before-paint script.
- The name stays Ledger; the package is `@ledger/design-system` at `packages/design-system` in this repository as an npm workspace.
- Source format is DTCG JSON. The build is Style Dictionary 5 (5.5.2 today, Node 22+; DTCG support since v4), replaced by a custom script only if its output needs more fighting than it saves.
- One design: Linear-refined light with Nightwatch as its dark. The ramps are drawn from those two sheets. No design attribute until a second design exists.
- Product code: token utilities legal, primitives preferred, `no-margin` an error, `use-primitives` a warning at first.

## Where we are

Measured on 2026-09-02 across the current kit (`src/ds`, 62 files) and the app. Colour is semantic: zero raw palette classes anywhere. Everything else is literal utilities. Type has 147 font-size sites in the kit and 853 in the app, most arbitrary and 21 kit sites on half-pixel sizes. Control heights, paddings, weights and icon sizes are baked utilities in about 20 primitives. Bare `rounded` is a fixed 0.25rem outside the radius ladder in 22 places. Interaction states are improvised with alpha modifiers, 13 focus rings at `ring-ring/35`, a scrim at `bg-foreground/25` that turns white in dark. Sticky table headers paint the page background wherever they sit. The Linear-refined overlay needs 12 selector rules that are not variable assignments. `nightwatch.css` drafts control-height tokens nothing reads.

FitBodyFusion has the Atlassian taxonomy and the primitives layer, and its own docs say the design-system rules were relaxed and a raw flex div is acceptable. That is the lesson: the names do not hold without enforcement.

## What Atlassian does, and what we take

Take all of it, translated to a Tailwind stack:

- **Tiers.** Palette → semantic → typography, space, shape → component. Each tier references only the one below.
- **Grammar.** `property.role.emphasis.state`: `color.background.brand.bold.hovered`. Every interactive background carries hovered and pressed. Every colour role has background, text, icon and border members. A state is a token, never alpha on a base token.
- **Ramps.** Fixed palettes, with a separate dark neutral ramp. Light and dark map each semantic token to a ramp step. We adopt Atlassian's step names and their semantic-to-step mapping outright. Only the ramps are ours to draw.
- **Composite typography.** A type token is a `font` shorthand. Weight, family and letter-spacing are separate tokens for overrides.
- **Metadata and generation.** Tokens are authored with description, per-theme value, introduced and deprecated. CSS, types, docs and Figma output are built from them.
- **Axes.** Colour mode, typography, spacing and shape are separately loadable themes.
- **Primitives.** Layout in product code goes through Box, Stack, Inline, Flex, Grid, Bleed, Text and Heading with token-typed props. Margin does not exist.
- **Lint that blocks.** Non-token values are errors, not suggestions.

Leave: the `token()` accessor for CSS-in-JS, since the generated utility set plays that role here; the ten-hue accent matrix, until a screen needs a coloured label; and `discovery`, until a screen needs it.

## Tiers

### Tier 0 · Palette

Six ramps in oklch, drawn from Linear-refined light and Nightwatch dark (decided):

| Ramp        | Steps                                                       | Notes                                                                  |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Neutral     | 0 · 100 · 200 · 300 · 400 · 500 · 600 · 700 · 800 · 900 · 1000 · 1100, plus alpha 100A–500A | Light surfaces, text and hairlines. Alpha steps are the hover fills.    |
| DarkNeutral | same steps and alphas                                       | Its own tint, violet-grey per Nightwatch. This is Atlassian's structure and it settles the dark-hue question at the ramp. |
| Blue        | 100 · 200 · 250 · 300 · 400 · 500 · 600 · 700 · 800 · 850 · 900 · 1000 | Brand, selected, information, focus, links.                            |
| Green       | same                                                        | Success.                                                               |
| Orange      | same                                                        | Warning.                                                               |
| Red         | same                                                        | Danger.                                                                |

Same step names as Atlassian, so their published mapping table applies line for line: `color.background.brand.bold` is Blue700 in light and Blue400 in dark, `color.text.subtlest` is Neutral700 and DarkNeutral700, and so on. Tuning happens at a ramp step and moves every token that references it. A token never has a bespoke value.

### Tier 1 · Semantic colour and elevation

Atlassian's set, minus accents and discovery:

- `color.background` × roles `neutral · brand · selected · danger · warning · success · information · disabled · inverse · input` × emphasis `subtlest · subtler · subtle · (default) · bold · bolder` × state `(rest) · hovered · pressed`, where the role defines which emphases exist.
- `color.text` × `(default) · subtle · subtlest · disabled · inverse · selected · brand · danger · warning · warning.inverse · success · information`, plus `.bolder` for text on subtle status fills.
- `color.icon` mirrors text.
- `color.border` × `(default) · bold · subtle · disabled · focused · input · inverse · selected · brand · danger · warning · success · information`.
- `elevation.surface` × `(default) · sunken · raised · overlay`, with hovered and pressed on raised and overlay. `elevation.shadow` × `raised · overflow · overlay`. `utility.elevation.surface.current`, set by every surface-owning component and read by sticky and masking children.
- `opacity.disabled`, `opacity.loading`.

Every one of these is a ramp step per mode. The ten sites that paint selection with the soft blue become the `selected` role; the Command cursor becomes `neutral.subtle.hovered`; the scrim becomes `color.blanket`; the focus ring becomes `color.border.focused` at `border.width.focused`.

### Tier 2 · Typography

Composite `font` shorthands. Grammar is Atlassian's; the step count is ours because the kit genuinely uses three body sizes:

| Token                  | Value            | Use                                            |
| ---------------------- | ---------------- | ---------------------------------------------- |
| `font.body.large`      | 400 15px / 22px  | Reading text, dialog body                      |
| `font.body`            | 400 13px / 18px  | Controls, cells, tabs, inputs, menu items      |
| `font.body.small`      | 400 12px / 16px  | Table headers, field labels, badges, KeyValue  |
| `font.body.xsmall`     | 400 11px / 14px  | Eyebrow, counts, metadata                      |
| `font.heading.medium`  | 600 22px / 28px  | Page and record titles                         |
| `font.heading.small`   | 500 20px / 26px  | Section headings                               |
| `font.heading.xsmall`  | 500 15px / 22px  | Dialog and card titles                         |
| `font.code`            | 400 0.875em      | Code blocks only                               |
| `font.weight.*`        | regular 400 · medium 500 · semibold 600 | Overrides on a body token, e.g. a label |
| `font.family.*`        | body · heading · code | Body and heading are the same face today   |
| `font.letterSpacing.*` | per size         | Tightens as size grows                         |

Labels are `font.body.small` plus `font.weight.medium`, not a size of their own. 12.5 and 11.5 snap to the nearest step and the lint keeps them out.

### Tier 3 · Space

`space.0 · 025 · 050 · 075 · 100 · 150 · 200 · 250 · 300 · 400 · 500 · 600 · 800 · 1000` = 0 / 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80, plus `space.negative.*` for Bleed. Space is consumed through primitive props. Inside the package, Tailwind's numeric spacing is reset and regenerated from these tokens so `p-100` exists and `p-4` does not.

### Tier 4 · Shape

`radius.xsmall 2 · small 4 · medium 6 · large 8 · xlarge 12 · xxlarge 16 · full`. `border.width 1 · border.width.selected 2 · border.width.focused 2`. Absolute steps per theme, not derived from one base. Badge small, controls medium, cards large, dialogs xlarge. Bare `rounded` is banned by lint because it is a static utility no reset can remove; its 22 sites become `radius.small`, and the five pasted count chips become a Badge size.

### Tier 5 · Dimension and motion (our extension)

Atlassian leaves control heights to components. This system needs them as a themed axis, so it carries a small family with its own documented grammar: `dimension.control.xsmall 24 · small 28 · medium 32 · large 36`, `dimension.row.compact 36 · default 40 · header 32 · menu 28`, `dimension.icon.small 14 · medium 16`. Motion: `motion.duration.fast 120ms · medium 180ms`, `motion.easing.standard`.

### Component tokens

Only on demand: a component token exists when a theme has had to reach into that component. None at the start.

## Axes and modes

- `data-color-mode` = `light` | `dark`. Default follows the system; the user can pin either. A before-paint inline script in the document head sets the attribute from the stored preference or the OS so server-rendered pages do not flash. `color-scheme` follows the attribute so native scrollbars and controls match.
- One design, Linear-refined. Linear-refined and Nova retire as overlays and Ledger's current light values retire with them; Linear-refined's values seed the ramps. A `data-theme` attribute appears only when a second design exists.
- Typography, spacing and shape are partitioned blocks in the emitted CSS so a later `data-density="compact"` is a block, not a refactor. No attribute until a screen asks.
- Storybook toolbar: Design × Mode. Every story is signed off in both modes.
- The mode control is three-state, light · dark · match system, in the user menu. Storage sits behind one function: localStorage in the prototype, the account in the product.

## Source and build

- **Source of truth:** `tokens/` in the DTCG (W3C Design Tokens) JSON format (decided), one file per group, each token carrying `$value` per mode, `$type`, `$description`, and `$extensions` for introduced, deprecated and replacement. Figma and Tokens Studio read this format directly.
- **Build tool:** Style Dictionary 5 (5.5.2 today, Node 22+; DTCG support since v4) (decided), which reads DTCG natively; custom formats for the Tailwind mapping, the per-token utilities and the tailwind-merge config.
- **Build** emits, from that source:
  - `tokens.css`: the palette and the light block on `:root`, the dark block on `[data-color-mode="dark"]`, and the Tailwind mapping. Tailwind's default `--color-*`, `--text-*`, `--font-weight-*`, `--radius-*`, `--shadow-*` and `--spacing` namespaces are reset so `bg-blue-500`, `text-sm`, `font-medium`, `rounded-md` and `p-4` cease to exist.
  - One `@utility` per token, on its own property only: `bg-brand-bold` from `color.background.brand.bold`, `text-subtle` from `color.text.subtle`, `border-input` from `color.border.input`, `icon-danger` from `color.icon.danger`, `font-body-small` from the composite, `rounded-small`, `p-150`, `shadow-overlay`. Tailwind's shared colour namespace would otherwise let `text-` reach a background token; per-property utilities are the allowlist.
  - `tokens.ts`: the name union, `token(name)` returning the variable, `tokenValue(name)` reading the computed value for canvas and SVG.
  - The tailwind-merge class-group config for the generated utilities. Unregistered custom utilities collide in `cn()`; this is the trap that already bit the type ladder.
  - Storybook token tables: name, description, light value, dark value, introduced. The table Josef pasted, generated.
  - `tokens.json` for Figma.
- **Tests on the source:** a contrast test for every text-on-background pairing the mapping declares, in both modes; a snapshot of the emitted CSS so a token change shows as a reviewable diff.

## Primitives

Layer 1 of the package, modelled on `@atlaskit/primitives`. FitBodyFusion's `system/primitives` is the port source; its API is already Atlassian's, with one deletion.

| Primitive | Props (token-typed)                                                                           | Note                                                                |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Box`     | `as`, `padding`, `paddingBlock`, `paddingInline` and the four sides, `backgroundColor` (surface and background tokens), `className` | No margin props. FitBodyFusion's Box has them; Atlassian bans margin, spacing comes from Stack, Inline and Bleed. Sets `surface.current` when given a surface. |
| `Stack`   | `space`, `alignBlock`, `alignInline`, `spread`, `grow`                                        | Vertical.                                                           |
| `Inline`  | `space`, `rowSpace`, `alignBlock`, `alignInline`, `spread`, `shouldWrap`, `separator`, `grow` | Horizontal. FitBodyFusion's Flex becomes Inline plus Flex.          |
| `Flex`    | `direction`, `gap`, `alignItems`, `justifyContent`, `wrap`                                    | The escape hatch when Stack and Inline do not fit.                  |
| `Grid`    | `templateColumns`, `templateRows`, `templateAreas`, `gap`, `alignItems`, `justifyContent`     | Template strings stay strings; gaps are tokens.                     |
| `Bleed`   | `block`, `inline`, `all` in negative space tokens                                             | The only sanctioned negative spacing.                               |
| `Text`    | `as`, `size` (body tokens), `weight`, `color` (text tokens), `align`, `maxLines`              | The kit's own components render text through this.                 |
| `Heading` | `as`, `size` (heading tokens), `color`                                                        |                                                                     |
| `Pressable`, `Anchor` | Box with interaction states via tokens                                            | Later, when a component needs an unstyled interactive box.          |

Token utilities stay legal in product code, because the namespace reset already guarantees their values: `gap-100` is a token whether it is written as a class or as `space="space.100"`. The primitives are the preferred grammar, not the only one. `no-margin` is an error from day one; `use-primitives` starts as a warning and is turned up once the team is fluent. What the primitives add beyond values is structure: no margins, one alignment API, `surface.current` set for free, and markup that reads as layout rather than as a class list. That is the one Atlassian-ism that cuts against utility-first, so it is a dial, not a wall.

Layer 2 is the component families the kit already has, Button, Badge and Indicator, the controls, Table, Tabs, the overlays, rebuilt in the package on Layer 1 and the new tokens. The current kit is the reference for look and API; the names inside change because the tokens do.

## Enforcement

Atlassian's ESLint plugin checks their accessor and their primitives, so it is not reusable. The package ships its own plugin, seeded from the three `ledger/*` rules and the layer boundaries that already exist:

| Rule                     | Scope       | What it rejects                                                                   |
| ------------------------ | ----------- | --------------------------------------------------------------------------------- |
| `no-non-token-class`     | package, product | Any class outside the generated allowlist plus the documented non-token utilities |
| `no-arbitrary-value`     | package, product | `text-[13px]`, `w-[240px]` and friends; grid templates are the listed exception   |
| `no-alpha-token`         | package     | `/NN` on a colour utility; the state has a token                                  |
| `no-dark-variant`        | package     | `dark:`; a token is missing                                                       |
| `no-margin`              | product     | Margin utilities and props; use Stack, Inline, Bleed                              |
| `use-primitives`         | product     | A raw element carrying layout or spacing classes; use Box, Stack, Inline. Warning first: values are already enforced, this buys structure |
| `no-deprecated-token`    | package, product | From `$extensions.deprecated`, with the replacement as the fix                    |
| `no-kit-shadow`, layer boundaries | package, product | Already exist; carried over                                              |

Plus typed props on every primitive, the contrast and snapshot tests on the source, and the story-coverage check that already ratchets.

## Package

`packages/design-system`, package name `@ledger/design-system`, in this repository as an npm workspace (decided), extracted to its own repository when a second consumer appears. Contents: `tokens/` source, `build/`, `src/generated/`, `src/styles/`, `src/lib/`, `src/primitives`, `src/components`, `src/patterns`, `src/shapes`, `eslint-plugin/`, `.storybook/`.

What self-contained and portable mean, each of them checkable:

- **No imports from outside the package.** No `@/` alias, no reach into the prototype's `src`. Files import each other relatively; the package has its own `cn` built on the generated merge config. Lint: `no-restricted-imports` on `@/*` and `../../src`.
- **No router dependency.** Tabs, Breadcrumb, RecordHeader and the shell currently import TanStack Router's `Link`. In the package a link is a slot: the component renders whatever element the consumer passes (`asChild` on a Radix Slot), so any router works. React and Tailwind are the only peers; Radix, cmdk, vaul, sonner, react-day-picker and react-resizable-panels are the package's own dependencies.
- **One CSS import for a consumer.** `@import "@ledger/design-system/ledger.css"` after Tailwind brings the variables in both modes, the theme mapping, the per-token utilities, and an `@source` that points Tailwind at the package's own components so their classes are generated. `base.css` (document defaults) and `reset.css` (Tailwind's default namespaces removed) are separate imports a consumer adds when its own code uses only token utilities. `reset.css` goes before `ledger.css`: a Tailwind namespace reset wipes everything defined in that namespace so far, the mappings included. The package's Storybook imports all four and is the first fully migrated consumer.
- **Its own Storybook** is the system's documentation: token sheets, primitives, components. The prototype's Storybook keeps only prototype-specific stories until those retire.
- **Its own lint preset**, exported from the package, which the prototype adopts at cutover.
- **Installable.** The proof is `npm pack` and a throwaway Vite app that installs the tarball, imports the CSS entry and renders a Button in both modes. This runs once the first family lands and again before any release. A `dist` build with type declarations for non-Vite consumers is a later step; `exports` can point there without consumers changing.

**The prototype during migration.** The kit's barrels (`src/ds/primitives/index.ts` and siblings) become a façade: a migrated family is re-exported from the package, an unmigrated one from its local file. The prototype's 76 importing files do not change until cutover, and the standing rule about prototype edits holds. The prototype's stylesheet imports `ledger.css` alongside its current tokens so migrated components have their utilities; `base.css` and `reset.css` come at cutover, when the old tokens file is deleted and the imports are codemodded to the package. Two transitional collisions to handle at the family that hits them: the prototype's own `shadow-*` utilities and the `text-11…20` ladder share names with generated ones until they are removed.

## Sequence

One commit each; Josef signs off in the package's Storybook, in both modes from step 1 on.

0. **Foundation.** Package, DTCG source for every tier, the build and its outputs, the CSS entries, `cn`, the token sheets, the Design × Mode toolbar. Landed 2026-09-02.
1. **Ramps.** Tune the six draft ramps on the Palette sheet. Contrast test wired. Contrast test landed 2026-09-02 (162 pairings, both modes, all passing after the neutral ramps were re-spaced); the visual sign-off on the Palette sheet is still Josef's.
2. **Semantic colour and elevation.** Atlassian's mapping on our ramps, both modes. Sign-off on the Color sheets.
3. **Type, space, shape, dimension, motion.** Sign-off on the specimen and sheets. Snap the half-pixel sizes here.
4. **Primitives.** Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading ported from FitBodyFusion onto the tokens, with stories. Landed 2026-09-02.
5. **Lint plugin, portability check.** The package's ESLint preset; `npm pack` into a throwaway app renders in both modes. Landed 2026-09-02: eight rules, two presets, the package lints clean; the tarball installs into a plain Vite + Tailwind app, its classes generate from node_modules, and a server render shows them.
6. **Families migrate.** Landed 2026-09-02: every family in `src/ds` has its equivalent in the package (`src/components`: Button, Badge/Count/Dot/Indicator, the controls, Tabs, Tooltip, the overlays, the pickers, Table with Toolbar and Pagination, the lists, the status surfaces, Command, Editable, CodeBlock, Resizable, ScrollArea, Toaster and the small parts; `src/patterns`, `src/shapes`, `src/shell`). Each moved in with its class strings rewritten onto token utilities, relative imports and the package `cn`, a story and an MDX docs page, and a light and dark check. Links are slots (`asChild`, or a link element for Item and RecordHeader). API renames on the way in: `tone="info"` → `information`, `active`/`selected` → `isActive`/`isSelected`, `xs`/`sm`/`md` → `xsmall`/`small`/`medium`, Button `ghost` → `subtle`, `Toaster` file, `Tiles` and `Stat.Grid`. The prototype façade is the first cutover step and still needs a go.
7. **Mode switch.** Provider, three-state control, storage function, and the before-paint script as a snippet consumers paste into their document head.
8. **Prototype cutover.** Landed in full 2026-09-02, in two steps. Step one: `src/ds` became a façade over the package with adapters for the old link dialects, the old kit and its stories were deleted, `styles.css` imported `ledger.css`, the root pinned `data-color-mode="light"`, and a codemod renamed the kit props. Step two (Josef: "do all of it"): the adapter call sites were rewritten onto the package's slots (Tabs.Tab with `count`, Breadcrumb.Item `asChild`, Item `link`, RecordHeader `back`) and the adapters deleted; a second codemod (scratchpad `burndown.mjs`) mapped the old classes onto the token utilities (about 6,300 findings across 79 files: colour keys to semantic tokens, the px type ladder to the composite `font-*` utilities, the 4px scale to space tokens, margins to padding on undecorated elements and to a `Box` around decorated ones, `leading`/`tracking` dropped because the composite tokens carry them, `uppercase` micro-labels to `font-heading-xxsmall`), turned 850 layout elements into Box/Stack/Inline/Grid, moved table column widths to `Table.Header width` and other pixel widths to inline style, and moved every import from `@/ds/*` to `@ledger/design-system`; the last 130 sites were hand fixes. `src/ds` is gone; the product shell is `src/components/app/shell.tsx`; `styles.css` is three package imports (reset, ledger, base) plus the scoped shadcn reference theme; the root ESLint config extends the package preset for product code and keeps the three assembly rules (`kit/cell-plain`, `kit/id-not-blue`, `kit/no-kit-shadow`) with the reference kits ignored. Package additions the cutover needed: `Tabs.Tab count`, `Table.Header`/`Table.Cell width`, `Table.Row isStatic`, `Select width`, `Grid templateColumns` per breakpoint through CSS variables (`grid-cols-(--ds-grid-lg)`), `Inline display="inline-flex"`, `font.heading.large` (28/34) for displayed numbers, `dimension.layout.measure` (720px, `max-w-layout-measure`) for prose, and lint allowances for `table-fixed`, `opacity-0/100`, `bg/border-transparent`, `fill/stroke-none|current` and `divide-*-0`. Compromises to review with Josef: margins became padding where the element had no paint (hit areas grow by the old margin); `border-l-2` quote rules are one pixel; `opacity-60/70` dims are `opacity-disabled`; a 30–34px stat is `font-heading-large` at 28px; the ring charts in control-workspace take their track colour from `token("elevation.surface")` inline. `use-primitives` stays a warning per the resolved decision and is at zero.

8a. **Coverage batch.** Landed 2026-09-02 after Josef asked why the package had fewer stories than the old kit (77 exports → 86, but 132 stories → 71). (1) `scripts/ds-check.mjs` reads the package instead of `src/ds`, demands a story per export and a `*Matrix` story per family (a story file that references the family's export and exports a name ending in Matrix), and runs in front of `npm run build`; the allowlist is empty. (2) Every family has a matrix story rendered light beside dark through the `bothModes` decorator in `src/stories/_lib/matrix.tsx` (each half is its own `data-color-mode` scope; tokens.css now emits an explicit `[data-color-mode="light"]` block so a nested light region inside a dark page reads light). 134 stories, 60 matrices, 23 docs pages. (3) The Status vocabulary sheet (every tone map in `src/lib`, generated) and the control-board shape stories are back in the prototype's Storybook under `Product/`, because they are product knowledge; the package's Shapes stories gained ActionBar, Block, Inspector and WorkPane matrices. (4) A Chart family on `color.chart.*` tokens (status tones, brand, neutral, track, categorical 1–8 on two chart-only hues, teal and purple) with `fill-chart-*`, `stroke-chart-*` and `bg-chart-*` utilities from a new `svg` build kind; `Chart.Bar` (stacked, horizontal), `Chart.Line`, `Chart.Area`, `Chart.Donut`, `Chart.Sparkline`, `Chart.Legend` on recharts 3, no animation, axes and tooltip on the tokens. The control workspace's bespoke rings and fan now paint from the chart tokens (they had been on the deleted `legacy-*` fills and rendered black); adopting `Chart` on a screen is a per-screen decision for Josef, the candidates being the program dashboard's coverage by family and the home page's framework coverage.

9. **Publishable build** with type declarations, when the second project appears.

## Resolved (2026-09-02)

1. Name: Ledger stays; Josef does not mind.
2. Package: workspace folder in this repository.
3. Source: DTCG JSON.
4. Product-code strictness: token utilities legal, primitives preferred, `no-margin` error, `use-primitives` warning.
5. Ramp seed: Linear-refined light with Nightwatch dark, the one design.
6. Build: Style Dictionary 5 (5.5.2 today, Node 22+; DTCG support since v4), with the custom-script escape clause.

## Then

On a go: step 0 lands first as a skeleton with nothing drawn; steps 1 to 3 are the visual decisions and each waits for a sign-off; 4 and 5 are mechanical; 6 is the long tail and runs family by family; 7 and 8 are app-facing and get their own go. Type-check, lint, the contrast and snapshot tests, `ds:check` and Storybook stay green after each.

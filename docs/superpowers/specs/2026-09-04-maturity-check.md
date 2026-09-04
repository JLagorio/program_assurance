# Maturity check, before publishing

What a published component page carries in Base Web, Atlassian and Carbon; where Ledger's Button stands against that; where every other family stands; the bar for shipping 0.2.0; and the order for walking the rest of the system, one family at a time.

Sources: Carbon's Button usage, style and accessibility pages and Base Web's Button page, read on 2026-09-04. Atlassian's Button tabs (examples, code, usage, accessibility) render client-side and could not be fetched; the structure below is their published one, which the kit already models. Ledger's side is read from the package: `src/components/button.tsx`, `src/stories/components/Button.{mdx,stories.tsx}`, the built docgen output, and the prototype's 130 Button call sites.

## 1. What a mature page carries

The three differ in format. Carbon splits a component into Usage, Style, Code and Accessibility tabs. Atlassian splits it into Examples, Code, Usage and Accessibility. Base Web is one long page of examples with an API section under it. The content converges on fourteen things.

| #   | Section                                                                                  | Base Web | Atlassian | Carbon | It answers                             |
| --- | ---------------------------------------------------------------------------------------- | -------- | --------- | ------ | -------------------------------------- |
| 1   | Purpose, one line, and what the part is not                                              | ✓        | ✓         | ✓      | Is this the part I want                |
| 2   | When to use and when not to, naming the neighbour to use instead                         | ~        | ✓         | ✓      | Button, link, toggle or menu           |
| 3   | Anatomy: the parts, named                                                                | –        | ✓         | ✓      | What the parts are called              |
| 4   | Variants, each with a use rule and an emphasis rule (how many per screen, what pairs)    | ✓        | ✓         | ✓✓     | Which one, and how many                |
| 5   | Sizes, each with the context it belongs to                                               | ✓        | ✓         | ✓✓     | Which size where                       |
| 6   | States, shown and named: hover, pressed, focus, disabled, selected, loading              | ✓        | ✓         | ✓      | What it does under the hand            |
| 7   | Modifiers: icon before and after, icon-only, full width, groups, as a link, split        | ✓        | ✓         | ✓      | What can be added                      |
| 8   | Content: casing, verb + noun, length, overflow, icon consistency, the universal labels   | –        | ✓         | ✓✓     | What to write on it                    |
| 9   | Style spec: the token for each variant × state, heights, padding, icon size, gap, type   | ~        | –         | ✓✓     | What it is made of                     |
| 10  | Accessibility: keyboard, ARIA, the icon-only name, the disabled policy, loading, contrast | ~        | ✓✓        | ✓      | Whether everyone can use it            |
| 11  | API: every prop with type, default and description, generated from source                | ✓        | ✓         | ✓      | How to call it                         |
| 12  | Do and don't, in pairs                                                                   | –        | ✓         | ✓✓     | The mistakes people make               |
| 13  | Related parts, linked                                                                    | ✓        | ✓         | ✓      | Where else to look                     |
| 14  | Lifecycle: status, since, changelog, deprecations                                        | ~        | ✓         | ✓      | Whether to rely on it                  |

✓✓ the reference standard · ✓ present · ~ partial · – absent. Carbon is the most complete (its Style tab is the one nobody else has). Atlassian is the most careful on accessibility and content. Base Web is the thinnest: examples and an API, little guidance.

## 2. Button against the three

| #   | Section    | Ledger | Evidence                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Purpose    | ✓      | "A button starts an action", the recipe and the look in two sentences.                                                                                                                                                                                                                                                                                                                                    |
| 2   | When / not | ~      | The variant table carries a use rule each; TextLink against `variant="link"` is written. No rule up front that navigation is a link; no pointer to Toggle, ToggleGroup, DropdownMenu or AlertDialog.                                                                                                                                                                                                      |
| 3   | Anatomy    | –      | The word does not appear in the package.                                                                                                                                                                                                                                                                                                                                                                  |
| 4   | Variants   | ✓      | Six, each with a use rule; "at most one primary per view". Prototype use: secondary 75 (51 named, 24 by default), primary 34, subtle 25, link 16, danger 1, warning 0. `warning` has no home. `danger` has no low-emphasis form, so a destructive action in a row or a menu has nowhere to go (Carbon has three danger levels). No pairing rules: what sits beside a primary, what never does.                |
| 5   | Sizes      | ✓      | Three, with pixels and a context each. Prototype: medium by default, small 49, xsmall 6. No large; a productive product does not need one yet.                                                                                                                                                                                                                                                             |
| 6   | States     | ~      | Hover, pressed, focus, disabled and selected are in the recipe; the matrix shows disabled and selected. Hover, pressed and focus are not shown as specimens. **No loading state**: AlertDialog hand-rolls a Spinner into its confirm button and the prototype does it once by hand. All three references make it a prop.                                                                                  |
| 7   | Modifiers  | ~      | An icon is a freeform child with a size class the caller picks (`size-icon-small`), so icon size and gap are not the button's. No `iconBefore` or `iconAfter`. IconButton is right (label required, the reference rule) but its tooltip is the native `title`, not the kit's Tooltip. `asChild` covers the link button. No full width. ButtonGroup is the joined, segmented kind; the "actions with a gap" group is Inline by unwritten convention. No split button; none needed so far. |
| 8   | Content    | –      | Nothing written. The prototype's labels are sentence case and verb-first by habit ("Schedule assessment", "Record AO decision", "Export briefing deck"); nothing keeps a second product on that.                                                                                                                                                                                                             |
| 9   | Style      | ~      | The token for each variant and state lives in the class string in source and nowhere a designer reads. No table of heights (24, 28, 32), padding, icon size, gap or type per size. The tokens themselves are 100% described and contrast-tested in both modes, so the table is a listing, not new work.                                                                                                     |
| 10  | A11y       | ~      | Focus outline, `aria-pressed`, `type="button"` by default, IconButton's name. Nothing written on keyboard, on loading, or on disabled. The kit's disabled policy (the primary stays enabled; `useRequired` marks the field) is Atlassian's exact recommendation and lives on the Controls page, unnamed here. The a11y addon runs in the Storybook UI and gates nothing.                                     |
| 11  | API        | ~      | `<Controls>` renders, on the default docgen: `variant` and `size` show as `keyof typeof variants` with no values and no description, so no select and no help; the component description is empty because the file comment is `/*`, not `/**`. IconButton comes through. No table for TextLink or ButtonGroup.                                                                                            |
| 12  | Do / don't | –      | None on any page in the package.                                                                                                                                                                                                                                                                                                                                                                          |
| 13  | Related    | ~      | TextLink in prose; no links.                                                                                                                                                                                                                                                                                                                                                                              |
| 14  | Lifecycle  | ~      | The changelog names the story for each change; the deprecation lint exists. No status or "since" on the page.                                                                                                                                                                                                                                                                                             |

Four solid, seven partial, three absent. The component is sound and the page is thin. Base Web is the closest peer; Atlassian and Carbon are a level above on guidance, and Carbon two levels above on style.

## 3. The rest of the system

Read from headings and content of the 24 MDX pages, 30 story files and 79 source files. `n/a` where the section does not apply.

| Family          | Purpose | When / not | Variants + rules | States | Content | Style | A11y | API (Controls) | Do / don't | Related |
| --------------- | ------- | ---------- | ---------------- | ------ | ------- | ----- | ---- | -------------- | ---------- | ------- |
| Button          | ✓       | ~          | ✓                | ~      | –       | ~     | ~    | ~              | –          | ~       |
| Badge           | ✓       | ✓          | ✓                | n/a    | –       | ~     | –    | ~              | –          | –       |
| Controls        | ✓       | ~          | ~                | ✓      | –       | ~     | ✓    | –              | –          | –       |
| Table           | ✓       | ~          | ✓                | ~      | –       | ✓     | ✓    | ✓ (by hand)    | –          | ~       |
| Tabs            | ✓       | ~          | ~                | ~      | –       | ✓     | ✓    | –              | –          | –       |
| Overlays        | ✓       | ✓✓         | ✓                | ~      | ~       | ✓     | ✓    | –              | ✓ (rules)  | ✓       |
| Status          | ✓       | ✓          | ✓                | ~      | –       | ~     | ~    | –              | ✓          | –       |
| Lists           | ~       | ~          | ~                | –      | –       | –     | ~    | –              | –          | –       |
| Pickers         | ~       | ✓          | ~                | –      | –       | ~     | –    | –              | –          | –       |
| Disclosure      | ✓       | ✓          | ~                | –      | –       | –     | ~    | –              | –          | –       |
| Parts           | ~       | ~          | ~                | –      | –       | –     | –    | –              | –          | –       |
| Surfaces        | ~       | ~          | –                | –      | –       | –     | ~    | –              | –          | –       |
| Command         | ~       | –          | –                | –      | –       | ~     | ~    | –              | –          | –       |
| Editable        | –       | –          | –                | –      | –       | –     | –    | –              | –          | –       |
| Chart           | ✓       | ✓          | ✓                | n/a    | –       | ✓     | –    | ~              | ~          | –       |
| Mode            | ✓       | ~          | ✓                | –      | –       | ~     | –    | ~              | ✓          | –       |
| Patterns, Pages | ✓       | ✓✓         | ✓                | –      | –       | –     | ~    | –              | ✓          | ✓       |
| Shapes          | ~       | ✓          | –                | –      | –       | –     | –    | –              | –          | –       |
| Shell           | ✓       | ✓          | ✓                | ✓      | ✓       | ✓     | ✓✓   | ~              | ~          | ✓       |
| Primitives      | ✓       | ✓          | ✓                | n/a    | –       | ~     | –    | ~              | ~          | –       |
| Tokens          | ✓       | ✓          | n/a              | n/a    | –       | ✓✓    | ✓    | n/a            | –          | –       |

Three tiers fall out. Shell, Overlays, Patterns, Table, Status, Badge, Chart and Button have real pages with the guidance in prose. Controls, Tabs, Lists, Pickers, Disclosure, Parts, Surfaces, Mode and Command have a page with a paragraph or two. Editable (eleven lines), Shapes (no headings, no props types), the five primitive story files and the six token sheets (no prose at all) are stubs.

What cuts across every family, ranked by how much it costs a second product:

1. **No machine-readable API.** No autodocs, no `argTypes`, no `react-docgen-typescript`; `<Controls>` on 2 of 24 pages; 5 of 30 story files set `component`. Patterns and shapes export one props type across 20 files, so those layers have no API surface at all. A product engineer has to read source.
2. **No structural sections by name.** Anatomy 0, when-not-to 0, do/don't 0. Content guidance exists in one place, the Shell's rule for a panel's label. The intent is in the prose (Overlays' "Which one", the Patterns hover ladder) but a reader cannot find it by heading.
3. **No accessibility section on most pages.** Chart has none at all. The a11y addon is installed and gates nothing. The one test in the repo is token contrast.
4. **No style spec per component.** Tokens are described and tested; which token a part uses in which state is in class strings only.
5. **Four drifts.** `Guidance/Lint rules` documents 10 of 14 rules (`cell-plain`, `id-not-blue`, `no-kit-shadow` missing). The package README points to `src/styles.css`, which does not exist, and calls the stories token sheets. `docs/guides/status-vocabulary.md` points to `src/ds`, which is gone, and calls the tone `info`. The four token guides under `docs/guides/` duplicate `Guidance/Token grammar` and the token sheets with no link either way.
6. **The ratchet checks stories, not pages.** That is why story coverage is 100% and Editable is eleven lines.

## 4. The bar for publishing

Not Carbon's fourteen; that is years. A page template every family fills, with the ratchet holding it, and Button as the first page that fills it. Atlassian's four tabs fold into one MDX with fixed H2s:

> Overview (what, what not, the neighbour) · Anatomy · Variants (a use rule and a count rule each) · Sizes · States · Modifiers · Content · Style (a token × state table; a measures table) · Accessibility · Props (generated) · Related · Don't (paired canvases)

Before 0.2.0 ships:

1. **Generated props.** `react-docgen-typescript` in `.storybook/main.ts`; `component` on every family story; `/**` on every file comment; a JSDoc line on every prop; unions written out (`"primary" | "secondary" | …`) so `variant` gets a select; `<Controls>` on every family page. About a day.
2. **The ratchet learns the template.** Each family MDX carries the H2 set, or an explicit "n/a" line under a heading; a family without a page fails; the same allow-list mechanics so the bar only rises.
3. **Button fills the template**, as the page every other family copies. Kit additions it needs: `isLoading` (which also replaces AlertDialog's hand-rolled spinner) and `isFullWidth`; `iconBefore` and `iconAfter` sized by the button, with the lint reporting a raw `size-icon-*` inside a Button; IconButton's tooltip on the kit's Tooltip.
4. **The four drifts fixed.** Lint page, README, status vocabulary, guide cross-links.
5. **Accessibility written, then gated.** A section on every page; the addon run against the Matrix stories in CI. The gate is a decision (below); the section is not.

Then the walk, one family per sitting, each to the template, ordered by how often the prototype touches it and how early a second product will:

Button → Controls → Table → Overlays → Status → Badge and Lists → Tabs, Disclosure, Parts → Pickers → Chart → Patterns → Shapes → Shell → Primitives → Tokens.

## 5. Decisions

- **`warning`.** Atlassian keeps it; Carbon and Base Web do not; the prototype has never used it. Drop it, or name the case that needs it.
- **Subtle danger.** A destructive action in a row or a menu: a `danger` on the subtle recipe, or the rule that it goes through the menu item's tone and an AlertDialog. Recommendation: the rule, and no new variant, until a screen proves otherwise.
- **`isLoading` and `isFullWidth`.** Recommendation: both, now; they are the two affordances all three references share that the kit lacks.
- **Icon slots.** `iconBefore` and `iconAfter` in place of freeform children. Recommendation: slots; the button owns icon size and gap, and the lint can hold it.
- **IconButton's tooltip.** Native `title` or the kit's Tooltip, with a way to turn it off where a label is visible. Recommendation: Tooltip.
- **Content rules.** Sentence case, a verb first, no punctuation, three words where possible, and the universal labels (Cancel, Close, Delete, Save, Done, Add, Remove, Export). Recommendation: write them; they are what the prototype already does.
- **The disabled policy.** Atlassian's rule, "avoid disabled; keep the primary enabled and say what is missing", is already the kit's behaviour. Recommendation: write it on the Button page and on Controls.
- **Gating.** The docs ratchet (2) and the a11y run in CI (5). Both are cheap; both change what "done" means for a part.
- **The token guides.** Fold `docs/guides/{colors,typography,spacing-layout,elevation-motion}.md` into the token sheets and the grammar page, or keep them and cross-link. Recommendation: fold; one place.

## 6. What landed, 2026-09-04

Josef took every recommendation in section 5 the same day, and the walk continues one family per sitting.

- **Button is on the template.** `Components/Button` carries the twelve sections; `Pair` in the stories library lays out a do beside a don't. `warning` is gone; subtle danger is a rule, not a variant; `iconBefore`, `iconAfter`, `isLoading` and `isFullWidth` are props; IconButton takes `icon`, carries the kit's Tooltip and `isTooltipDisabled`; AlertDialog's confirm is on `isLoading`. The content rules and the disabled policy are written on the page. `ledger/button-icon-slot` keeps hand-sized icons out of buttons; 81 call sites in the prototype and the package moved to the slots by codemod.
- **Props tables are generated.** `react-docgen-typescript` in the Storybook config; unions are selects, JSDoc lines are descriptions, defaults come from the signature. Every file comment in the kit is a JSDoc block.
- **The ratchet holds the template.** `scripts/ds-check.mjs` lists the headings each family page is missing; 202 gaps across the other families are grandfathered in `scripts/ds-check.allow` and the list only shrinks. `docs/next.md` carries the walk order.
- **The accessibility gate.** `npm run test:a11y` runs axe on every `*Matrix` story in headless Chromium and fails on a violation; CI runs it. Its first run found nine kit defects, all fixed: KeyValue and the Inspector row are their own definition lists; Command.Separator is presentational; a Calendar range's middle days read in the default text colour; a Stepper's marker button is named; CodeBlock and ScrollArea scroll regions take focus; PageSkeleton is a status region; Popover, Progress and CodeBlock take `label` (a Progress without one is decorative and hidden, the number beside it carries the value).
- **The drifts are fixed.** The Lint page lists all fifteen rules; the README is a true map; the status vocabulary points at the package; the four token guides are folded into six Tokens pages (Color, Typography, Space, Shape, Metrics, Motion). Four small drifts the fold found are on Josef's list.
- **0.3.0** in the changelog, with the breaking changes named.

## 7. One page per part, and Input

Josef's second call the same day: the references document one page per component, so the Storybook moved from one page per family to one page per part. The rule, written into the guide: one page per part a product imports by name; compound parts stay with their parent; a family that is a choice keeps an overview (Forms, Overlays, Pages, Shapes, Primitives). The split is mechanical, prose moved not rewritten, so every part page carries what its family page said about it plus a generated props table, and the ratchet lists the template headings it still lacks. The sidebar gained Patterns, Shapes and Shell sections.

Input was walked first, against Carbon's Text input (usage, style, accessibility), Base Web's Input and Atlassian's Text field. What it changed in the kit: `Field` renders the hint or the error outside the `<label>` and wires it as the control's description (`aria-describedby`), sets `aria-invalid` and `aria-required` on the control; before, the message was part of the control's accessible name. `Input` has a read-only look. The contrast test covers the field's borders against the input surface. Not taken, and said on the page: no small Input, no password or masked input, no clear button; the width is the layout's. Field is on the template beside Input, since the label, hint and error are the input's anatomy in every reference.

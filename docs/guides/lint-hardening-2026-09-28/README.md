# Lint hardening from @shadcn/lint, 28 September 2026

[@shadcn/lint](https://github.com/shadcn-ui/lint) 0.2.0 is a linter for Tailwind design systems, written for agents. This plan takes its techniques into Ledger's own ESLint plugin ([packages/design-system/eslint-plugin](../../../packages/design-system/eslint-plugin/)); it does not install the package. The package was first run against the app, the kit and 36 probe files, and 20 claims about it were checked by an adversarial pass. Six agents then studied it area by area and mapped each technique onto Ledger: where it reads classes, its restyle rule, its Tailwind oracle, its messages, its inline-style and colour checks, and its tests and evals. Each agent prototyped and measured its area against this repo. One agent merged their 69 techniques into 40 items. Two reviewers then challenged every item: one for Ledger fit and noise, measured on the repo, and one for feasibility and duplication. They revised 42 of the 80 verdicts and dropped one item. This page reflects their revisions.

[catalogue.json](catalogue.json) holds each item's full record:

- its design, with the files and functions to change;
- its draft message and its test cases;
- the live measurement;
- both reviews.

The prototypes and measurement scripts it cites sit under `docs/examples/lint-hardening-2026-09-28/`. That directory is gitignored, so it is on this machine only. Line numbers are from the working tree on 28 September; a parallel session was editing `eslint-plugin/index.js` at the time.

## What we take

- **One class reader for every rule.** Ledger has four separate class walkers and three kit-part identity functions, and they disagree.
  - The kit keeps 273 class strings in variant, size and tone maps (Button's variants, Badge tones, primitive token maps), and no rule reads them. A `bg-red-500 p-[13px]` planted in 10 of those maps passed the package lint.
  - Ledger also reads labels as classes ("Needs", "Connected", OSCAL's "SP800-53"), and reports template fragments as `bg-` and `-500`.
  - The prototype reader reaches all 273 map strings and closes 23 probe gaps. It adds 0 findings on today's code and catches all 11 planted mistakes.
  - From shadcn it takes per-file sharing, the unreadable channel, static member lookups, and treating a destructured binding as its own slot. Ledger keeps what it already does better: className callbacks, config keys, and checking a module constant where it is declared.
- **`ledger/no-restyle`**, on Ledger's own data.
  - A class→category map generated from the token build classifies 1,213 of the 1,214 classes in use. shadcn's grammar leaves 146 unclassified on this theme.
  - Per-part ownership comes from the kit's own props, and the advice names the real prop: `tone="warning"`, `space`, `numeric`.
  - It was scored against the 58 verified shadcn findings in the app. It keeps all 24 true positives and none of the 31 false ones.
- **Tailwind asked once, at token-build time, never at lint time.** A build step writes `src/generated/lint.json`, 42 KB in 0.9 s.
  - The lint then checks that every class Ledger admits produces CSS, which closes 412 admitted spellings that generate nothing.
  - It checks variants against a generated grammar, which catches `hovr:` and `tablet:`.
  - It costs 89 ms of rule time, against 536 ms for a lint-time oracle, and has no worker, timeout or fallback mode.
- **Messages as data.** This means `meta.messages` with ids, a page per rule, and a docs URL on every finding. Suggestions go through a source-preserving fixer with a closure check: a replacement may not fail another Ledger rule. Nearest-token hints are chosen by value, but only within the token family that matches the property's role.
- **The inline-style and colour checks shadcn has and Ledger lacks**, built on the shared reader:
  - `no-style-design-value` follows constants and ternaries, which finds 24 more kit literals (about 21 real, 0 false);
  - a raw-colour rule for SVG and chart props (0 today; it catches 13 of 14 probes);
  - colours hidden in CSS custom properties;
  - a readable-classes rule for kit parts (1 kit site, against shadcn's 20).
- **shadcn's robustness infrastructure, fitted to Ledger's shrink-only ratchet:**
  - per-rule RuleTester case files (8 of the 26 rules have no test today);
  - a fix-safety suite;
  - a red-team matrix of evasions per rule, whose escapes may only shrink;
  - a clean corpus and a stock-Tailwind corpus;
  - metadata parity tests;
  - linting through the packed tarball.

What we leave, and why, is under [Not taken](#not-taken). In short: theme discovery from CSS, a lint-time Tailwind oracle, consumer-authored contracts and message overrides, and advice that sends readers to declare a token or add a variant.

## Decisions

These are yours to make. Each has the reviewers' recommendation.

1. **How a new rule lands.** `check-allow-lists` rejects any new key, so every new or tightened rule must land at zero findings ([check-allow-lists.mjs:61-64](../../../scripts/check-allow-lists.mjs#L61-L64)). Recommended: a key under a rule with no row in the base ref's `Lint.mdx` counts as the rule landing. This blocks batches 5, 6 and 8, so settle it in batch 1. **Taken (batch 1),** narrowed in review: the rule must also be absent from the plugin at the base ref, so a misspelt key or a rule that existed without a row counts as growth.
2. **Warnings fail CI.** Stories run `no-non-token-class` at warn ([index.js:1170](../../../packages/design-system/eslint-plugin/index.js#L1170)), and neither lint script has `--max-warnings`, so a new story with `bg-red-500` passes CI. There are 0 ledger warnings today. Recommended: error, or `--max-warnings 0`. **Taken (batch 1):** stories at error; no global `--max-warnings`, because the react-refresh and react-hooks warnings are not the lint's.
3. **Prettier out of ESLint.** Prettier is about 90% of product lint time: roughly 3.9 s, against 148 ms for every ledger rule. Recommended: `prettier --check` as its own step. CLAUDE.md's "ESLint runs Prettier as a rule" would change. **Taken:** moved out on 29 September. `npm run format:check` checks the same 261 files ESLint formatted (the root configs, `src/` and `scripts/`, without the reference kits), CI runs it in the app job, and ESLint keeps `eslint-config-prettier` only to switch off rules that would fight it. The app lint went from about 5.5 s to 3.3 s. The kit's own source was never format-checked; bringing `packages/design-system` and the Markdown docs under Prettier is a separate sweep.
4. **Kit literals that `no-style-design-value` will surface.** Only three have a matching token: pagination, the data-table indent and the avatar ring. The rest need a role token or a named kit constant:
   - popover 288;
   - hover-card 256;
   - Empty's measure 400;
   - skeleton 32 and 96;
   - menu minimum widths 96, 128 and 9rem;
   - stepper and timeline 420;
   - toolbar search 240;
   - command 560;
   - tooltip 320;
   - key-value 8rem.

   Also decide whether a viewport fraction such as `10dvh` counts as structure. A value-equal token is the wrong answer for several of these: popover 288 equals a container-query threshold. The Dialog and Sheet preset maps stay the kit's one place for their numbers. **Taken:** role tokens. A small dimension family for popup and control widths (tooltip, hover card, popover, command, menu minimum, search field, stepper and timeline, skeleton, measure, key-value label) with today's values, so nothing looks different and the lint can name them; batch 5 adds them through `/ledger-add-part` before `no-style-design-value` follows constants.

5. **Breakpoints.** `reset.css` does not reset `--breakpoint-*`, so Tailwind's stock `2xl` (96rem) survives, and `xl` equals `panel` (80rem). Should `xl:` and `2xl:` leave the variant grammar? **Taken:** keep `xl` (the documented alias of `panel` behind Grid's `xl` column count); drop `2xl` by resetting `--breakpoint-*` in the generated reset before Ledger's breakpoints are set (batch 6).
6. **Space under line tabs, in the kit.** 10 of the 15 product restyles, plus 4 `use-primitives` sites, are `pt-200` on `TabsContent` or `gap-150` on `Tabs`. They patch space the kit does not specify. Recommended: decide it in Tabs through `/ledger-add-part` before `no-restyle` lands, then drop the classes in the same change. **Taken:** 12px (`space.150`) between a line tab strip and its panel, owned by the kit; the 8 `pt-200` and 2 `gap-150` overrides go in the same change (batch 8a).
7. **no-restyle policy.**
   - Is a border on a layout primitive the caller's choice or a restyle? It occurs at 3 sites, including [program-wizard.tsx:470](../../../src/components/app/program-wizard.tsx#L470) and [library-controls.tsx:296](../../../src/components/prototype/library-controls.tsx#L296).
   - Is RadioGroup's `divide-y` shape a component default?
   - Recommended: the rule runs on product code only, never on the kit's own components or patterns, and lands at error with the remaining sites fixed. **Taken:** a part owns only what it sets itself, so a border on a layout primitive passes and RadioGroup's `gap-0` is flagged while `divide-y` passes; product code only, at error.
8. **Colour suggestions.** Recommended: always the role list, and a single replacement only when the colour is within ΔE 0.02 in both modes and has the same role. Picks by value alone land on the wrong role; `#eee` came out nearest to `chart.diverging.midpoint`. **Taken:** as recommended.
9. **A paid agent eval.** This means paired runs with and without lint feedback, as shadcn's evals do. The free substitutes are executed docs examples, the message snapshot and the red-team matrix. Recommended: the free substitutes now, and an eval later if the messages still miss. **Taken (1 October):** the harness is in the repo as `npm run eval:lint` ([`evals/`](../../../evals/README.md)). A small paired run cost $35.37: 10 tasks, with and without the lint, one run each. No agent left a ledger finding or took an escape route in either condition, so the lint changed no outcome at n=1. See [the eval](eval-2026-10-01.md).
10. **The docs URL target.** If the Storybook is hosted, `meta.docs.url` can point at its Lint anchors. Otherwise it is a file URL to the shipped page. **Taken:** the file URL.

## Batches

Each batch keeps CI green on its own: tokens, ds-check, package tests and lint, the API baseline, the app lint and `test:app`. Every batch that adds a rule also adds its `Lint.mdx` row, a rebuilt `llms.txt`, a CHANGELOG entry and, from batch 2 on, a case file and a docs page. Effort is the reviewers' corrected size.

### 1. Fix what is broken and close the bypasses

Landed on 28 September, with decisions 1 and 2 taken as recommended (stories at error, no global `--max-warnings`), red-team matrix included; see [docs/next.md](../../next.md).

No new data. It lands at 0 findings.

- **Source-preserving fixes** (M).
  - Four autofixes corrupt code today. `no-deprecated-token --fix` turns a real newline into `\n` and quotes into a parse error, and substring-replaces longer classes ([index.js:818-825](../../../packages/design-system/eslint-plugin/index.js#L818-L825)).
  - `no-deprecated-name` leaves an aliased `Shell` unbound and writes duplicate props ([index.js:900-903](../../../packages/design-system/eslint-plugin/index.js#L900-L903)).
  - Port shadcn's in-literal replacement: keep quotes and entities, replace whole classes only, and offer no fix rather than a wrong one. Pull the class predicates out into `eslint-plugin/classes.js` so every suggestion passes the closure check.
- **Destructured bindings** (S). `constInitOf` returns the whole initializer for a destructured binding ([index.js:41-49](../../../packages/design-system/eslint-plugin/index.js#L41-L49)); make it return nothing, which stops the misread labels.
- **Settings validation** (S). A string `classFunctions` is split into characters ([index.js:25-26](../../../packages/design-system/eslint-plugin/index.js#L25-L26)). In a file with an allowance, the allowance proxy blanks the rule's options ([gate-rules.js:96](../../../packages/design-system/eslint-plugin/gate-rules.js#L96)); it should pass them minus `allow`.
- **Escape routes** (M).
  - A new `ledger/no-inline-config` rule reports any `/* eslint ledger/x: "off" */` comment, and any disable without a `-- reason`.
  - `check-allow-lists` fails when a root `eslint-suppressions.json` exists or when any suppressions file carries a ledger rule.
  - Decision 2.
  - Add `src/components/examples` to `REFERENCE_KITS`: it is lint-ignored but importable.
  - Admit length-free arbitrary grid templates (`grid-cols-[auto_1fr]`), which retires 3 of the 5 kit disables.
  - Decision 1.
- **Red-team matrix** (M). Every rule against every way a class can reach it: aliases, namespaces, spreads, render props, maps, constants, helpers, inline config and suppressions. The escapes are committed as a list that may only shrink. Controls are split by rule family: class-policy rules stay silent on look-alikes, while behaviour rules still report another package's overlay.
- **Packed-plugin smoke** (S). Lint through `@ledger/design-system/eslint` from the packed tarball in the consumer smoke.
- **Error-page colours** (S). Add `src/lib/error-page.test.ts`, holding the 27 hand-copied oklch literals equal to their tokens.

### 2. Messages become data

Landed on 29 September, with per-rule notes in the root product block and no global note, `meta.docs.url` a file URL to the shipped page, and the lazy-load harness moved to batch 6; see [docs/next.md](../../next.md).

No finding changes. Land the items in this order:

1. **Message contract** (M): `meta.messages` with ids and one report helper (`withAllowance` already keeps `fix` and `suggest` and renders an id's text). The length cap is measured before the note.
2. **A page per rule** (M), generated as MDX so Storybook, the Storybook MCP and `llms.txt` carry it. `meta.docs.url` points at it. Examples are chosen so exactly one rule reports each, until batch 4b.
3. **Per-rule case files** (L): RuleTester by message id, data, location and fix output. This closes the 8 untested rules.
4. **Metadata and message tests** (M).
   - Every rule gets a message snapshot, balanced punctuation and the length cap.
   - Subject-first wording and banned phrases are checked for a set of rules that grows as batch 7 rewrites them. `no-inline-config`'s subject is the comment, so its messages start "This comment".
   - A changelog gate.
5. **Per-rule notes** in the root product block, such as `no-native-confirm` → `useConfirmation`. No global note.
6. **What the lint cannot see**: one section on the Lint page and one line in the package's AGENTS.md. It covers cross-file values, unreadable spreads, descendant selectors, plain CSS, and the rules switched off in stories and `bleed.tsx`.

### 3. Baselines

Landed on 29 September, as the reviews revised it: the clean corpus under each scope's real config, the stock corpus keeping the passing names with an `admitted` list, the digest a flag of `scripts/lint-corpus.mjs`, and the standalone bench and `--large` moved to batch 9; see [docs/next.md](../../next.md).

Commit today's numbers so later batches show up as falling counts.

- **Corpus ratchets** (M).
  - A clean corpus is linted with the real per-scope configs, and its false-positive counts may only fall.
  - A stock-Tailwind corpus stores the names that pass. A newly passing name must be admitted in the same change.
  - A `--digest` flag hashes every finding, which proves that a refactor changes nothing.
  - The `no-deprecated-name` prefilter ships with a digest-equality test; it is the costliest ledger rule.

### 4a. One reader, one identity

Landed on 29 September at +0 findings (the corpus digest unchanged, 5,985 findings), as the reviews revised it; the reader also brought forward 4b's module-level maps, member lookups, same-file returns and joins, which the 11 planted mistakes needed, and `no-deprecated-name` does not read prop renames in the kit's own source; see [docs/next.md](../../next.md).

Measured at +0 findings.

- **Part identity** (L).
  - Class-policy rules use strict import-bound identity: `cell-plain`, `id-not-blue`, `button-icon-slot`, `use-primitives` and `prefer-text-link`.
  - Behaviour rules resolve aliases and namespaces but keep a name fallback.
  - Inside the kit, identity means any relative import into `src/` whose root name is in `components.json`.
  - It adds render-prop ownership.
  - Kit allowance counts must be identical before and after.
- **Shared reader** (L): the prototype `class-sites.js` from the local folder, with a per-file cache, the unreadable channel, and a fast bail on `/class/i` or a configured helper name.
- **Class helpers** (S).
  - Keep matching by name: the built-ins, `classes()` and settings.
  - Also resolve aliases and namespaces of the kit's `cn`, clsx, tailwind-merge, cva and tailwind-variants.
  - Complete the helper list (`cx`, `twJoin`, `classNames`, `tv`), which escape every rule today.
- **Binding resolution, the rest** (S): never-reassigned `let`, parameter defaults, and a forwarded `className`.
- **Site precision** (S). A glued template is one unreadable value, not fragments. Slot maps are read by value. A `class` data key is not a class site.

### 4b. Reach and ownership

Landed on 29 September, as the reviews revised it: the shorthand is `no-arbitrary-value`'s (`x-(--ds-…)` as an arbitrary value until batch 6 writes its token, any other `x-(--var)` with its own message), the structural variable admissions stay, the pinned limits are named on the Lint page (with the waiver a line disable or an allowance of a class's owner gives, and `no-dark-variant` ahead of `no-margin` so a `dark:` class stays reported), the `reachability` list is a valid case and there is no `ClassList` type; the stock corpus's 523 doubly reported classes fell to 0 (5,449 findings); the reader follows a same-file function's arguments, a DOM element's `className` and `classList`, and more of a module-level map, and no longer reads a style object or an attribute list as classes; ledger rule time is 13 to 17% under its level after 4a and 17 to 28% over its level before it (medians of seven runs, each in its own process); see [docs/next.md](../../next.md).

- **Read the kit's maps** (M): the 273 strings, via static member lookups, same-file helper returns, joins and exported maps. 0 new findings today.
- **One owner per class** (M). Each class gets one finding with a cause-specific message; today 80 of 414 stock tokens are reported two or three times. Tailwind 4's `x-(--var)` shorthand gets an owner.

### 5. Rules on the reader

Landed on 29 September, as the reviews revised it, with decision 4's role tokens: `dimension.part.*` holds nineteen part sizes at today's values and units (decision 4's thirteen with its KeyValue label, and five prop defaults the style rule found once it read defaults), and the three mechanical swaps landed; `no-style-design-value` follows a style through the file, a helper's arguments and what a value is built from, says where a literal was written, and reads a part's own size as that part's alone, with viewport lengths as structure and the widths and heights of the Dialog and Sheet preset maps exempt by name, and `overlay-width-preset` reads the same objects; `no-raw-colour` and `readable-classes` are errors in both presets and in stories, at 0 findings, the latter's advice from each part's styling props in `components.json`; the kit's CSS is held to its tokens by `test/css-tokens.test.mjs`, with twelve literals in a shrink-only list; the kit's style allowance fell from 39 to 34 sites, its overlay allowance from 4 to 3, and the red-team escapes from 60 to 52 (5,443 findings); see [docs/next.md](../../next.md).

- **`ledger/readable-classes`** (M): a `className` on a kit part must be readable. The advice leads with the part's props.
- **`ledger/no-raw-colour`** (S): literal colours in SVG and recharts colour props.
- **Style colours** (S): colours in custom properties, the full CSS named-colour list (Ledger knows 14), and `<style>` elements.
- **A token check for the kit's plain CSS** (S). Add a node test over `src/styles/*.css`; no rule reads it today.
- **`no-style-design-value` follows the value** (M). Re-measure with the full design first. Gated on decision 4.

### 6. Tailwind asked once, at build time

Landed on 30 September, as the reviews revised it, with decision 5 taken: the lint data is two files, `lint.json` with the facts a file may need (the `@utility` names, the utilities a minus negates, the variant grammar, the ARIA names, Tailwind 4.3.3 and the hash of each file it was built from) and `lint-values.json` with the values only a finding needs, each read through `eslint-plugin/data.js` on first use; stale data (an input changed since the build, in the kit's checkout, or the two files from different builds) is one finding at line 1 of each file from whichever data rule runs first, and a missing file an error; `ledger.css` keeps both files out of Tailwind's scan; the kit's `@utility` names come from its CSS and every structural spelling generates CSS, 412 dead spellings fewer and none in use; the canonical-class rule is dropped and its `var()` fix is `no-arbitrary-value`'s `--fix`; `no-unknown-variant` lands at 0 findings, its breakpoint message naming the container sizes first, and the closure check includes variants; `2xl` is gone and `xl` stays; the stock corpus reports `size-screen` and gives `2xl:text-5xl` to the new rule (5,444 findings); ledger rule time rises about 5% in the product and 6% in the kit, 142 to 149 ms and 283 to 300 ms (medians of 18 runs, each in its own process), and the review's wider stale check adds about 1.5 ms; see [docs/next.md](../../next.md).

- **Lint data** (M). `build/lint-data.mjs` writes `src/generated/lint.json`.
  - Facts every file needs load eagerly: `@utility` names and the variant grammar. Values load lazily: token values, stock scales and aliases.
  - Record the Tailwind version the data reflects, or narrow the `tailwindcss` peer range.
  - Stale data becomes a readable finding, not a crash.
  - A lazy-load test lands here.
- **Allowlist parity** (M). Kit `@utility` names are read from the CSS. The structural regexes are tightened so every admitted class produces CSS, which removes 412 dead spellings, none in use. A parity test holds them to Tailwind.
- **`ledger/no-unknown-variant`** (M): a generated variant grammar, with ARIA names checked. The breakpoint message names container queries first. Decision 5.
- **The `var()` fix** (S). `bg-[var(--ds-…)]` and `bg-(--ds-…)` get an exact fix to their token class; this is salvaged from the dropped canonical-class rule.

### 7. Messages that name the fix

Landed on 30 September, as the reviews revised it, with decision 8 taken: no finding moved (5,444, the same by file, rule, line and column), only their words and suggestions; `eslint-plugin/nearest.js` names a value only from the family its property's role takes (`space.*`, `font.*`, `radius.*`, `border.width.*`, `motion.duration.*`, the opacities and the shadows) and never a container, breakpoint, layout or part token, a width or a height getting a sentence instead; a colour always gets the roles its hue plays, one token only when one role holds it within ΔE 0.02 in both modes and a grey only where a token twin names its role, and a `dark:` colour is ranked with its light twin on the same site; an editor suggestion only where one class stands for the class and holds in its element, never under `--fix`; 39 of shadcn's theme names in `build/vocabulary-aliases.json`, checked by the token build and written onto Coming from shadcn; every rule keeps the message contract (`AWAITING_REWRITE` and `OVER_LIMIT` empty), with `use-primitives`, `no-alpha-token`, `no-dark-variant`, `no-margin` and `overlay-width-preset` computing their advice, the overlay steps read from each part's own map into `components.json` with no new tokens; the review's 27 findings fixed before it landed; ledger rule time is level in the product and 1 to 3% up in the kit, 311 to 315 ms at integration and 303 to 310 ms after the review (medians of 11 and 9 runs, each in its own process); see [docs/next.md](../../next.md).

- **Nearest token** (L). Suggest by value, but only from the family that matches the property: `space.*` for padding, gap and inset; `border.width.*`; `radius.*`; `font.*`. Never suggest container or breakpoint thresholds. A `dark:` colour is ranked together with its light sibling. Suggestions appear in the editor and never run under `--fix`. Decision 8.
- **Vocabulary aliases** (S). A table maps the shadcn and Tailwind names agents reach for (`bg-primary`, `text-muted-foreground`, `bg-accent`) to Ledger's. It lives in `build/vocabulary-aliases.json`, not in the tokens, and is written into `FromShadcn.mdx` between markers at build time.
- **Every message rewritten** (M). Each message says what broke, why, and the Ledger mechanism to use.
  - `no-alpha-token` picks a state by the alpha.
  - `no-dark-variant` is pair-aware.
  - `use-primitives` names Inline, Stack or Grid from the classes.
- **Prop-value advice** (S). Name the prop and its value. Overlay widths name the nearest preset from each part's own map, with no new tokens.

### 8. Kit first, then no-restyle

Landed on 30 September, as the reviews revised it, with decisions 6 and 7 taken: under a horizontal strip, line or filled, TabsContent starts its content `space.150` (12px) below the strip as its own padding and Tabs keeps `space.100` only beside a vertical strip, and the eight `pt-200`, the two `gap-150` and the panels that added the same space themselves left the application in the same change (on the 19 tabbed screens checked at 1440 and 390px the gap under the strip was 16 to 40px and is 12px, 18px where a Prose label's own padding follows and 20px over the system preview's Details disclosure, whose trigger pads itself); the stories that taught `Table.Header text-end` and `Text tabular-nums` use `align="end"` and `numeric`; the class categories are tailwind-merge's grammar merged with the kit's merge config, which the token build writes into `lint.json` (28 to 134 KB) and the plugin reads as data; `eslint-plugin/parts.json`, which `npm run build:lint` writes with the lint's own reader and the type checker, holds what each of 446 parts and members sets by root, prop and value, Button through `buttonVariants` included, and a freshness test fails on a Button or Tabs change made without the build; eight parts carry an `@accepts` contract, checked when the data is built, and a focus target keeps its outline classes; `ledger/no-restyle` is an error in `recommended` only, a part owning only what it sets itself (a border on a Stack and RadioGroup's `divide-y` pass, its `gap-0` does not), names the prop or the owning part and never a workaround, says `Cells are one style` inside a cell renderer, and reports a descendant variant on a kit part or an element that holds one, which closes the red-team's descendant escape; the application lands at 0 after four one-line fixes, `program-systems-tree.tsx`'s Baseline cell among them, and `use-primitives` keeps five overlaps, four having gone with the tab space; `no-restyle` adds no finding to either corpus (5,430 findings); ledger rule time in the product went from 182.5 to 213.3 ms, `no-restyle` 25.3 ms of it, and the kit's did not move, the rule being off there (medians of nine runs, each in its own process, on a loaded machine); see [docs/next.md](../../next.md). Its CI run and reviews, cut off by a usage limit, run with batch 9's and the remaining allowances'.

- **Kit** (8a).
  - Decide the space under line tabs (decision 6).
  - Clean the stories and examples that teach restyles through `llms.txt`: `Table.Header text-end` instead of `align="end"`, and `Text tabular-nums` instead of `numeric`.
- **Class categories** (M): computed at build time into `lint.json` from the kit's merge config. Nothing is resolved at lint time.
- **Part ownership** (L+).
  - For primitives, ownership comes from `tokens.mjs`'s space and class tables.
  - For components, the batch-4 reader follows the prop maps. The type checker is used only where syntax fails.
  - A stale-data test includes a Button fixture.
- **Kit-authored className contracts** (S): an `@accepts` tag next to the part, such as Id's `text-subtle` in a row's id column, plus a built-in exception for `outline-none` on a `tabIndex={-1}` focus target. There are no consumer contracts.
- **`ledger/no-restyle`** (M), in the recommended preset only, at error. Decision 7.
  - The advice names the prop or the owning part and never a workaround: "Drop `pt-200`; Tabs spaces its list and panel."
  - Inside a table cell the advice is that cells are one style.
  - Fix [program-systems-tree.tsx:333](../../../src/components/prototype/program-systems-tree.tsx#L333) in the same change, because it is a reference file.
- **Descendant-selector restyles** (S). `*:` and `[&_button]:` variants in product code reach into parts the product does not own. There are 0 today.

### 9. Optional

Landed on 1 October, as the reviews revised it, with decision 9 taken (the harness and a small paired eval) and the remaining allowances cleared beside it under decision 4 (twenty more `dimension.part.*` tokens at today's values and `dimension.query.*` for the stylesheets' two conditions; the kit's `test/lint-allow.json` empty, its `eslint-suppressions.json` gone, `test/css-token-allow.json` down to touch.css's `max(1rem, 16px)`, and the application's list down to one `prefer-text-link` site that is Josef's call): a component of the same file that forwards a prop to a kit part takes on that part's contract for twelve rules, and 36 of the red-team's 55 escapes close, the 19 left being an imported constant or style object, since reading across files stays rejected, and a bare word exported alone; the bench is `npm run bench:lint`, outside CI; the read-only API is `eslint-plugin/api.js`; the eval harness is `evals/` (`npm run eval:lint`), and the small run is written up in [eval-2026-10-01.md](eval-2026-10-01.md); no finding moved but the allowances' falls (5,430 to 5,382 findings); see [docs/next.md](../../next.md).

- Local wrappers that forward `className` to a kit part inherit its contract. Landed on 1 October (`identity.js`'s `forwardedTo`, for twelve rules), with the red-team's variant, `!`, descendant, `*Class` attribute, exported-constant and shadowing-parameter escapes; an imported constant stays unread, as rejected; see [docs/next.md](../../next.md).
- An agent eval (decision 9).
- A standalone benchmark. Landed on 1 October as `npm run bench:lint` (`scripts/lint-bench.mjs`), outside CI; see [docs/next.md](../../next.md).
- A read-only API: `classify`, `suggestClass`, `kitPartOf` and the token lookups as named exports of `@ledger/design-system/eslint`, so a tool can ask "which token is 16px?" without running ESLint. Landed on 1 October (`eslint-plugin/api.js`), with `kitPartOf` taking a name and an import source; see [docs/next.md](../../next.md).

## Defects in today's lint

These were found along the way. Batches 1 and 4 fix most of them. The rest are listed where the fix lives.

- Four autofixes can corrupt code (batch 1).
- `no-deprecated-name`'s member-expression report drops its note ([index.js:916](../../../packages/design-system/eslint-plugin/index.js#L916)).
- `use-primitives`, `button-icon-slot` and `prefer-text-link` read classes without following constants ([index.js:648](../../../packages/design-system/eslint-plugin/index.js#L648), [:695](../../../packages/design-system/eslint-plugin/index.js#L695), [:1012](../../../packages/design-system/eslint-plugin/index.js#L1012)).
- `id-not-blue` does not follow constants either, so `const blue = "text-brand"; <Id className={blue} />` passes.
- `withAllowance` skips any rule that has a schema ([gate-rules.js:83-84](../../../packages/design-system/eslint-plugin/gate-rules.js#L83-L84)), and would break a rule that reports by message id.
- `no-style-design-value` prints an unbalanced `(hsl(` and knows only 14 named colours ([gate-rules.js:211-212](../../../packages/design-system/eslint-plugin/gate-rules.js#L211-L212)).
- `no-alpha-token` calls a palette colour "a token" ([index.js:744-750](../../../packages/design-system/eslint-plugin/index.js#L744-L750)).
- `no-static-design-value`'s duration hint names the wrong neighbours ([index.js:787-788](../../../packages/design-system/eslint-plugin/index.js#L787-L788)).
- The `recharts-[a-z-]+` wildcard admits any name and makes the disable at `_marks.tsx:100` unused.
- Five kit disables of ledger rules go uncounted, and two give no reason ([card.tsx:122](../../../packages/design-system/src/components/card.tsx#L122), [empty.tsx:71](../../../packages/design-system/src/components/empty.tsx#L71)).
- The `Lint.mdx` row for `use-primitives` is stale.
- `FromShadcn.mdx:13` says `border-input` does not exist, but it does.
- No rule declares `meta.messages` or `meta.docs.url`.
- `error-page.ts` holds 27 hand-copied colour literals with no link to their tokens; none has drifted yet.
- The data-table indent is `16` in [data-table.tsx:387](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L387), while [table.tsx:969](../../../packages/design-system/src/components/table.tsx#L969) uses `token("space.200")` for the same space.

## Not taken

- **A lint-time Tailwind oracle, and its grammar fallback.** It is slower (536 ms against 89 ms), found only one thing (a false positive), and brings timeouts and a weaker silent mode.
- **Theme discovery from CSS.** In this repo it picked the look-only shadcn `components.json`, read `tailwindcss/dist/lib.mjs` as CSS, and resolved the kit to `dist/`. Ledger's vocabulary is generated and committed.
- **Consumer policy knobs:** allow and deny globs, per-component contracts that replace rather than merge, and the per-rule `message` option. The kit owns the policy, and per-file allowances shrink where an allow list never would.
- **Advice to declare a colour or an `@utility`, add a variant, or use a margin.** In Ledger each of these is a kit change or a violation of another rule.
- **Picking one colour by distance alone** (shadcn's 0.12 threshold). Ledger colours are roles, and their modes differ.
- **Variant discovery from `cva` and literal unions only.** Ledger's props are `tone`, `appearance`, `space`, `numeric` and `align`, which that discovery never sees.
- **`scanAllStrings`.** The reader catches every planted mistake without it, and it gives 1,797 false hits.
- **Canonical Tailwind spellings.** That would be a 166-site sweep with no gain to readers or policy; only the `var()` fix is kept.
- **shadcn's property ban on inline styles.** Ledger's contract is value-based: computed values pass. The ban gives 209 kit sites, 132 of them legitimate.
- **The rest:** Vue, Svelte and Astro readers; Oxlint parity; a Node and Windows matrix; Changesets publishing; a fetched registry corpus; a screenshot judge. `catalogue.json` lists each with its reason.

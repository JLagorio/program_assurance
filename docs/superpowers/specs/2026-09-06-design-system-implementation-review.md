# Design-system implementation review

The latest API closeout is on the existing branch. This task has not staged, committed, published or deployed changes. The index changed concurrently during the closeout; that staging was preserved, and subsequent edits remain unstaged.

This document consolidates the first and second audit passes into one review path. The second pass's DS identifiers are the implementation checklist; the original reports remain evidence and context, not competing implementation plans.

**Completion scope:** This is an implementation-coverage map, not confirmation that every acceptance criterion in either audit has been independently certified. First-pass blanket prop renames, universal standard props and publishing changes were superseded or rejected by the second pass. The missing DS-22 matrix and DS-24 declaration baseline now exist and are checked in CI. The matrix now covers all 204 callable component/compound APIs with source-reviewed DOM/ref targets, controlled/uncontrolled ownership, runtime-default summaries, and meaning/migration decisions for every tracked axis. CI rejects missing review entries and stale/orphaned policies. Parameter-default extraction remains separate from reviewed body/context/dependency defaults. This completes the component API inventory review; it does not certify every browser or assistive-technology behavior.

The user reports that the reviewed visuals look good; no particular viewport, assistive-technology or cross-browser coverage was specified. Following their approval, Activity/Task compositions and their workflow stories now live in the application. Event taxonomy, task states, product log-bar behavior and mention serialization no longer belong to the package API; neutral Composer and TaskRow presentation remains shared. Shared Timeline, Item, Avatar, Checkbox and other building blocks remain in Ledger.

## Review entry points

- [Package Storybook](http://localhost:6007/): Guidance/Quality contract and the component/pattern stories.
- Package regression stories: Components/Forms, DatePicker, Editable, Button, Dialog, Tree, and Tokens/Motion.
- [Application Storybook](http://localhost:6006/?path=/story/product-action-outcomes--draft-reopens): Product/Action outcomes uses the actual create-risk dialog.
- Shared patterns: [Composer](http://localhost:6007/?path=/docs/patterns-composer--docs), [TaskRow](http://localhost:6007/?path=/docs/patterns-taskrow--docs), and [Timeline feed composition](http://localhost:6007/?path=/story/components-timeline--feed-composition).
- Product workflows: [Activity](http://localhost:6006/?path=/docs/product-workflows-activity--docs) and [Task](http://localhost:6006/?path=/docs/product-workflows-task--docs).
- [Public prop and axis matrix](../../guides/design-system-api-matrix.md): generated types/default evidence and reviewed semantic exceptions.
- [Application](http://127.0.0.1:8083/risks): Risks (create, draft, treatment), Programs (archive, restore, schedule, export), global search, and filtered-empty recovery.

Localization/Arabic demos, the writing-direction toolbar, and the package reference workflow were removed at the user’s request. Keyboard resize and saved-view regressions now live under Patterns/Data table with English content. The shared formatting/provider API remains available. Automated package contracts run in light and dark modes; dark mode enables reduced motion. The narrow project was removed with its only workflow fixture. Product risk workflows explicitly save to this browser.

## Audit-to-implementation map

| Finding | Implemented result | Review evidence |
| --- | --- | --- |
| DS-01 | Explicit public `Toast` adapter preserves generic promise typing and permits declaration emission. | Package build and isolated consumer typecheck. |
| DS-02 | TypeScript emitter resolves relative ESM imports for JavaScript and declarations with source maps. | Packed Node import, SSR, NodeNext declaration check, Vite/Tailwind consumer build. |
| DS-03 | DatePicker's named value stays outside the portal, supports external forms, reset, disabled omission and trigger focus refs. | NativeFormContract and FocusIntegrationContract. |
| DS-04 | Inline saves serialize; failures cannot roll back a newer external value, and unmounted operations cannot update the editor. Immediate rejection also rolls back correctly. | SerializedSaveContract. |
| DS-05 | Risk create/draft/treatment and program archive/schedule persist before claiming success. Fake generic assessment/CDR paths open the existing authoritative workflows. Exports produce the records their labels promise. | App command tests; Product/Action outcomes; app evidence below. |
| DS-06 | Persisted table views validate every state slice, reconcile columns/bounds, isolate changing keys and restore author defaults. | Storage unit tests and StoredViewsMatrix. |
| DS-07 | Controlled overlays capture their opener and accept an explicit replacement focus ref; removed targets have a fallback. | Nested Dialog contract; component overlay implementations. |
| DS-08 | Disabled/loading slotted buttons block child and wrapper activation, including keyboard activation. Native/slotted ref and event targets are typed explicitly. | SlottedActivationContract. |
| DS-09 | Reduced-motion rules live inside animation utilities, including state-qualified variants; spinners keep a named status without rotation. | Motion.PreferenceContract in normal and reduced preference contexts. |
| DS-10 | Explicit contract tags select tests independently of display names. | Light/dark browser projects and AST coverage check. |
| DS-11 | Removed nested anchor/button compositions and inline Chip block markup. | App source fixes and the console-error browser gate. |
| DS-12 | App filter/icon names identify purpose and row context; column resize separators expose bounds and keyboard operation. | Action inventory; KeyboardResizeMatrix. |
| DS-13 | Tree owns one tab stop, restores focus after removal, supports typeahead and exposes hierarchy/sibling position. | Tree interaction contracts. |
| DS-14 | Compiler-resolved public inventory, executable story-reference checks, explicit tags, complete family templates, zero grandfathered gaps, and a committed-baseline exception gate. | `scripts/ds-check.mjs`, `scripts/ds-public-api.mjs`, CI. |
| DS-15 | Field context reaches wrapped/fragment controls without duplicate IDs; custom controls use the exported binding hook. | Forms wrapper, fragment, custom-control and label-focus assertions. |
| DS-16 | Required validation reports all errors, clears repaired client errors, supports touched format rules/server errors, and focuses a scoped invalid control. | Forms contracts. |
| DS-17 | Enumerated every app action instance, implemented supported commands/navigation, removed redundant inert controls, and visibly explained unavailable integrations. | 269-item action census; zero unclassified missing handlers. |
| DS-18 | Filtered-empty states explain the result and expose clear-filter recovery; catalog failure exposes retry. | Controls, findings, POA&M and risks. |
| DS-19 | Scoped locale/direction/message provider, deterministic number/date/plural formatting, calendar-day semantics and explicit portal direction. | Formatting unit tests and chart/table fixtures. Localization demos are out of scope. |
| DS-20 | Form grids collapse, fixed control widths respect their container, and focused controls get scroll margins for sticky furniture. Dense tables keep legitimate internal overflow. | App source changes. Full zoom/page-family visual review remains manual. |
| DS-21 | Documented web target criteria and exceptions; dense Button targets are measured and focus-obscuration review is explicit. | Button.TargetSizeContract; Quality contract guidance. |
| DS-22 | Generated per-component/compound prop matrix with types, literal values, branch requiredness, JSDoc, parameter defaults, and curated axis/behavior/migration decisions. All 204 APIs have explicit DOM/state/default reviews and every tracked axis has meaning/migration rationale; missing reviews fail CI. | `scripts/ds-api-matrix.mjs`, `api/axis-policy.json`, readable matrix and complete JSON; fixture test and CI freshness check. |
| DS-23 | Every public component/compound records its supported DOM/ref target or intentional closed boundary. Fixed dropped styles, widths, pinning offsets, labels and slotted callbacks; custom bindings name their target. | Reviewed matrix; CompositeControlContract, DatePicker focus/form, and API closeout contracts below. |
| DS-24 | Compiler-emitted declaration snapshot checks public signatures and reachable dependency declarations against an explicit baseline. CI reports base-revision differences; intentional changes require a reviewed baseline update. | `scripts/ds-api-check.mjs`, `api/public-api.json`, mutation fixture test, npm commands and CI. Signature drift detection does not prove behavioral compatibility. |
| DS-25 | Versioned `ledger-css-v1` source retains compatibility; independent light/dark DTCG 2025.10 exports validate schema, aliases and semantic conversion. | DTCG tests and generated interchange files. Design-tool import is out of scope by user decision (2026-09-06); schema/semantic export validation remains supported. |
| DS-26 | Correct sRGB alpha compositing and 376 declared contrast pairs; repaired selected/pressed colors and resting input boundaries meeting 3:1. | Contrast suite and Color documentation. |
| DS-27 | Self-contained installation/CSS/SSR instructions, lifecycle and migration guidance, and a real packed external consumer gate. | README, changelog, consumer smoke script and CI. |
| DS-28 | Real app dialog regressions; package reference workflow removed at user request. | Product/Action outcomes. |

## Compatibility notes

- Activity, Task, their types and `parseMentions` are removed from the unreleased package API. Application consumers import `@/components/app/activity`, `@/components/app/task`, and `@/lib/mentions`. Their existing appearance and interaction are preserved; workflow stories use the app contract suite.

- Field no longer relies on cloning arbitrary custom components. Custom controls call `useFieldControl(props)` and spread its result onto their focusable element; a native control may be associated explicitly with `controlId`. This fixes wrapper/fragment ambiguity and duplicate IDs.
- Controlled DatePicker/Combobox values remain controlled during native reset. Callers own their reset state. Slotted Button children must forward their DOM props/ref.
- Locale defaults are explicit `en-US` and UTC. Applications supply translated message catalogs and consistent server/client options. Date-only calendar values use a different formatter from timestamps.
- Resting input borders and several pressed/selected colors are intentionally stronger. Review both modes against realistic content.
- The legacy token export remains available. DTCG conversion preserves CSS-specific information in a namespaced extension where there is no direct interchange type.
- This is an unpublished working-tree implementation, not a release or a claim that all package APIs are stable.

## API closeout · 2026-09-06

Three delegated source reviews and the primitive/display review cover all 204 callable component/compound APIs. The canonical policy records implementation source paths, DOM/ref destinations, state ownership, body/context/dependency defaults, and axis-specific meaning/migration rules. Intentional differences remain documented: family-relative size scales, chart geometry, display identifiers versus DOM ids, native events versus value callbacks, and deprecated adapters. This does not add universal DOM props to closed compositions or rename established axes indiscriminately.

Confirmed defects repaired in this closeout:

- Select preserves caller style; Combobox width reaches its trigger and its popup has an accessible name; Drawer omits a dangling description relationship.
- Table.Selection forwards pinned-column offset/edge; DataTable labels its scroll region; Shell.Main labels its landmark; Shell.AppLogo preserves slotted activation and a name at narrow widths.
- A controlled, read-only ModeSwitch no longer mutates surrounding provider state.
- Panel renders a subheader independently; CommandPalette uses command identity rather than repeated labels; PickerSheet names its search input.
- Text exposes `htmlFor` for its advertised label element; Inline omits separators between list items; Spinner handles a pending delay changing to zero; interactive Progress segments have a key fallback for their accessible name.
- Direction-sensitive Radix roots receive Ledger locale direction unless the caller supplies an explicit override. Command.Dialog guidance now correctly leaves closing-on-selection to the caller.

The matrix freshness check now also enforces complete review metadata and axis decisions; a fixture verifies that missing components, defaults, state/DOM reviews and migration rationale fail. The declaration baseline records the additive Text.htmlFor prop and explicit dir overrides on Tabs, ToggleGroup, DropdownMenu and ScrollArea. Design-tool token import is excluded from this scope; existing validated interchange exports remain available.

Historical verification for the API closeout, before the Storybook scope reduction above:

| Check | Result |
| --- | --- |
| Component API review | **204/204** APIs have DOM/state/default review; **620/620** tracked axes have meaning/migration decisions. **626** explicit prop policies also cover reviewed non-axis integration/compatibility props. No unreviewed component fields or tracked axes remain. |
| Matrix and declaration gates | Fresh matrix with **2,372** shared inherited definitions; declaration check has **0 drift** after reviewed baseline update. Root/subpath exports remain unchanged; five additive props are recorded. |
| Package browser contracts | **279 passed**, including light/dark contracts and the narrow workflow; **14 new contract stories** add 28 light/dark checks. Selection intentionally excludes untagged gallery stories. |
| Unit/tooling tests | Package **13 passed**; API tooling **2 passed**; application **7 passed**. |
| Application browser contracts | **8 passed**. |
| Types and lint | Package and application typechecks pass; package lint passes; root lint has **0 errors / 41 existing warnings**. |
| Builds | Production package/application and both Storybooks build successfully. |
| Packed external consumer | Offline temporary tarball install, ESM import, SSR, NodeNext declarations, Vite and Tailwind pass. JSX consumes Text.htmlFor and all four new direction overrides. No publication occurs. |
| Public coverage | **425 root symbols**, **107/107** components with stories, **78/78** family matrices, **105/105** family templates, **573 stories in 114 files**, zero exceptions. |

Reproduce with `npm run ds:api:check`, `npm run ds:api:matrix:check`, `npm run ds:check`, `npm test -w packages/design-system`, `npm run test:api`, and `npm run test:a11y -w packages/design-system`. The packed consumer runs after the package build via `npm run test:consumer -w packages/design-system -- --offline` when dependencies are cached. Runtime defaults are manually reviewed prose; CI enforces presence/freshness, not automatic proof of behavioral compatibility.

## Shared-pattern extraction

Following the approved refinement, Ledger now exports experimental `Composer` and `TaskRow` patterns. Activity and Task remain application wrappers. The reusable feed item already exists as `Timeline.Item`; a neutral feed example documents that composition without creating a duplicate API.

| Shared contract | Application responsibility |
| --- | --- |
| Composer: textarea, optional suggestions, keyboard/pointer selection, pending submission and retry | Suggestion lookup, stable identities, exact insertion text, people data, mention parsing and persistence |
| TaskRow: controlled completion, row layout, independent title/actions, owner/date/status slots | Open/waiting/blocked/done mapping, badges, full-name owners, overdue decisions and store mutations |
| Timeline.Item: marker, icon/tone, sentence, timestamps, body and footer | Event kinds, event labels, actor mapping, feed filtering and log actions |

Composer retains rejected drafts, prevents duplicate sends, respects IME composition, and preserves a newer controlled draft when an older submission completes. Submission may return void or Promise<void>. Suggestion adapters are synchronous and return replacement offsets plus exact insertion text; no reference serialization format is built in. TaskRow renders a list item inside Item.Group, keeps completion separate from navigation, and includes accessible completed-state text for rows without a checkbox.

Verification for this extraction:

- **12 new package browser checks passed**, covering both light and dark modes: suggestions, save rejection/retry, duplicate submission, synchronous/asynchronous draft replacement, and completion/navigation separation.
- **8 application browser checks passed**, including the product's existing mention format, posting a note, and completing/reopening a task.
- Package unit suite **12 passed**; app unit suite **7 passed**; API tooling fixtures **2 passed**. The new tooling fixture covers snapshots larger than 1 MiB and invalid base revisions; large reads no longer masquerade as missing baselines.
- Package and application typechecks pass. Root lint reports **0 errors and the same 41 existing warnings**.
- Declaration baseline and matrix freshness pass. Six exports were added (Composer and its three types; TaskRow and its props); no existing exports changed or were removed.
- Production application/package and both Storybooks build successfully. The isolated tarball consumer renders Composer and TaskRow on the server and typechecks their JSX, along with ESM, Vite and Tailwind checks. Both live Storybook indexes expose the intended shared/product review pages.
- Current inventory: **425 root symbols**, **204 callable component/compound APIs**, **107/107 public components with stories**, **78/78 family matrices**, **105/105 family templates**, **559 package stories in 114 files**, zero coverage exceptions. The declaration baseline also includes the `./cn` subpath (426 exports across both entries).

All extraction changes remain unstaged. The index captured at the start of this extraction was preserved byte-for-byte. Earlier verification below records the preceding boundary change, before the shared patterns were extracted.

## Earlier boundary and API follow-up verification

This follow-up moves product code and supplies API review tooling. All changes made in this follow-up remain unstaged; the existing index is preserved (SHA-256 `9571b4a09e628eb9ba5bd65e2fd83ffca4b4f7cb47c72128218907c654224c57`).

- Application browser suite: **7 passed**, including posting an activity note and completing/reopening a task.
- Package unit suite: **12 passed**; app unit suite: **7 passed**, including mention serialization.
- API declaration mutation fixture: **1 passed**. Current declarations match the new baseline; base `HEAD` predates its adoption. Zero-SHA initial adoption succeeds, invalid nonzero revisions fail.
- Prop matrix freshness passes: **202 component/compound entries**, **2,375 shared inherited definitions**, and **25 curated API policies** (corrected historical count). The deprecated Accordion default is explicitly distinguished from Collapsible.Group.
- Public coverage: **419 root symbols**, **105/105 components with stories**, **76/76 family contracts**, **103/103 family templates**, **548 package stories in 112 files**, zero coverage exceptions. The declaration baseline separately includes the `./cn` entry (420 exports across both entries).
- Production application/package and both Storybooks build successfully. Built indexes contain all 12 workflow stories and their docs in the application, with no Activity/Task family in the package. The packed external consumer passes ESM, SSR, declarations, Vite and Tailwind checks, including absence of product workflow exports.
- Root lint has **0 errors and the same 41 existing warnings**. Application typecheck passes after the move.
- Package browser suite: **239 passed** across light, dark/reduced motion and narrow layouts. An initial rerun was stopped during local disk/memory pressure; the subsequent run with `--maxWorkers=1` completed successfully.
- Both live Storybook indexes respond successfully after restarting stale watchers: application port 6006 has the 12 workflow stories plus two docs pages; package port 6007 has neither workflow family.

## Earlier implementation verification

Verified locally with Node 26.3.1; CI is configured for Node 22. No production deployment occurred.

| Check | Result |
| --- | --- |
| Package browser contracts | **243 passed**, light, dark/reduced motion and the selected narrow workflow; no unexpected console errors. Untagged specimens are excluded intentionally. The workflow also passes an explicit 320-pixel viewport and no-page-overflow assertion after configuring Storybook’s own viewport override. |
| App browser contracts | **3 passed** using the actual risk dialog. |
| Package unit suite | **11 passed**, including **376 contrast pairs**, alpha compositing, DTCG conversion, locale and storage validation. |
| App command suite | **5 passed**, including failed-write atomicity and persisted outcomes. |
| Public coverage | **435 public value/type symbols**, 107 public components with executable story use, 78/78 family contracts, 105/105 family templates, 560 stories in 114 files, **zero coverage exceptions**. |
| Types and lint | Package and application typechecks pass; package lint passes; root lint has **0 errors and 41 existing warnings**. |
| Builds | Production application/package and both Storybooks build successfully. App Storybook now builds its package dependency first, so a clean checkout does not require a pre-existing dist. |
| Packed consumer | Fresh external install, Node ESM import, React SSR, NodeNext declarations, Vite bundle and Tailwind token/component CSS pass. |
| Generated tokens | Regeneration reproduces the existing generated files byte-for-byte: 391 tokens, 188 dark values, 351 utilities. |
| Working tree | Diff whitespace check passes. The original staged patch SHA-256 remains `0590c15649387069760804ffb58e9801e2ebcca1e6288bcb2c0bc9907d98d67e`; implementation changes are unstaged. |
| Review servers | Both Storybook indexes and the application risks route respond successfully. |

Tests that inspect real persistence, keyboard behavior, rejected saves and consumer boundaries are the regression evidence. A source-reference census alone is not behavioral proof. Full public export inventory: [compiler output](audit-evidence/2026-09-06-public-api.json).

During integration, disk exhaustion interrupted one run. Task-generated crawl downloads and temporary consumer fixtures were removed; source integrity was checked and affected verification rerun with limited browser workers. An existing Storybook process had a stale, duplicated case-sensitive story index; restarting this project's review servers resolved it.

## Remaining human and external validation

No visual browser was connected to the supported review runtime. Automated Chromium tests execute real interactions and accessibility checks; they do not constitute visual sign-off, full browser zoom/reflow certification, screen-reader review, Firefox/WebKit review, or fluent translation review. The DTCG boundary has schema and semantic tests. Figma/design-tool token import is explicitly out of scope by user decision; it is not an open release requirement, and no tool-import compatibility claim is made.

Supported new persistence is local to this browser. Existing control-work/task/activity prototype stores remain session-based; this change does not create a backend or connect scanners, uploads, access administration, signing, or other unavailable integrations. Those actions carry visible explanations instead of success claims.

Further evidence: [app outcomes](audit-evidence/2026-09-06-app-action-outcomes.md), [action census](audit-evidence/2026-09-06-action-inventory.json), and the original [second-pass audit](2026-09-05-design-system-audit-second-pass.md).

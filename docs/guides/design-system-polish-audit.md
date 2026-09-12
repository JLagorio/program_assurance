# Design-system polish audit

Date: 2026-09-10. Scope: the imported ReUI and shadcn sources against
`packages/design-system`, with a spot inspection of the running Ledger Storybook.
This is an audit and implementation shortlist; no component changes are included.
Layout primitives and the concurrent page/panel/preview work are outside this pass.

Implementation update, 2026-09-11: font delivery is aligned; button icon insets and popup-open paint are refined; searchable Editable.Select retains custom rendering; Select/Combobox share growing choice rows and separate selection/highlight states. Layout/Pages/Record demonstrates these together. The findings below describe the original audit; radius, broader form/surface treatment and other catalog decisions remain proposals.

Form/surface update, 2026-09-11: Field labels reflect invalid/disabled state, choice cards have enabled hover and quiet disabled paint, and labeled separators no longer mask the parent surface. InputGroup follows the input/textarea rather than disabled addon actions and matches focused-invalid Input treatment. Card now uses shared vertical spacing with explicit header/footer dividers where needed. Existing Field, Card and InputGroup examples demonstrate these decisions. Global radius/type-size changes and optional catalog additions remain proposals.

## Recommendation

Keep Ledger's Base UI foundation, semantic tokens, compact density and existing
component families. Improve the details inside those families, then use a small
set of ReUI examples to refine complete interactions. Much of the capability is
already present: rich Combobox composition, table filtering and persisted view
state, attachment lifecycle presentation, activity feeds, and split buttons.

ReUI's value here is its treatment of content and state: recognizable options,
balanced icons, persistent open states, useful secondary text, and clear action
hierarchy. A bigger component inventory by itself will not deliver those qualities.

## What is actually in the import

- `registry-reui/bases/base/components/`: 1,105 distinct `c-*` examples across
  74 categories. The Radix tree repeats the same example IDs, producing 2,210
  source files in total. 817 pairs are identical after normalizing base/radix imports.
- `registry-reui/bases/base/reui/`: ReUI's additional implementations.
- `registry/bases/base/ui/`: the foundational component implementations.
- `registry/styles/`: eight style sheets. Style variants are additional treatments
  of the same components, not additional pattern identities.
- The README's separate Pro block catalog is not present in this example tree.

## Foundation pass comes first

The basic controls and surfaces need a visual refinement pass before expanding the
pattern catalog. Base UI supplies interaction behavior; Ledger's tokens and component
styles determine the visible result. Migrating the behavior and composition contracts
does not reproduce shadcn or ReUI's visual treatment automatically.

| Area | Current Ledger evidence | Refinement to evaluate |
| --- | --- | --- |
| Font delivery | [Font tokens](../../packages/design-system/tokens/font.json) prefer Geist. [Storybook](../../packages/design-system/.storybook/preview-head.html) requests Geist, while the [app root](../../src/routes/__root.tsx) requests Inter and JetBrains Mono instead. | Make the app and catalog load the intended fonts consistently before judging component typography. Actual fallback depends on available fonts. |
| Control proportions | Ledger's body text is 13px/18px; [controls](../../packages/design-system/src/components/controls.tsx) use 8px horizontal padding. Imported Nova uses 14px desktop control text and 10px input padding. Both use 32px default control height. | Compare text, icon and inset proportions at the existing compact heights. Evaluate 14px for standard controls while retaining deliberately dense table/metadata treatments. |
| Corner relationships | [Shape tokens](../../packages/design-system/tokens/shape.json) assign 5px to controls, 7px to cards/popovers and 9px to dialogs. | Compare a coordinated radius family on controls, nested menu items, surfaces and dialogs. Decide from the assembled result, not isolated radius swatches. |
| Surface hierarchy | Cards always divide header/body/footer; inputs use explicit border/background state changes; secondary buttons use the raised shadow. | Balance border weight, surface tint, dividers and elevation together so forms, cards and floating surfaces have distinct roles. |
| State hierarchy | Controls use a focused border plus outline; buttons lack popup-open paint; Select and Combobox use different highlight recipes. | Review hover, keyboard highlight, selection, expansion, focus, invalid and disabled states as one visual system. |

Use a representative comparison specimen containing Button, Input/InputGroup,
Select/Combobox, Checkbox/Radio/Switch, Badge, Tabs, Card and DropdownMenu. Compare
Ledger's current treatment with one chosen reference style using the same content,
control sizes and states. Refine existing tokens and component recipes, then apply
the agreed treatment across families and check it in a real application screen.
The interaction improvements below follow that foundation work.

## Component and interaction follow-through

### 1. Preserve rich rendering when inline selection becomes searchable

In [Editable.Select](../../packages/design-system/src/patterns/editable.tsx),
`render` formats both the closed value and short Select option lists. Above eight
options, the searchable Combobox branch renders the raw option string instead.
This makes status and person choices lose their visual identity when search appears.

Apply the same presentation contract to both branches while keeping search text,
accessible option names, commit behavior and failure recovery explicit. Use the
status/member examples below as visual references. This is an existing-pattern
improvement, not a reason to add another picker primitive.

### 2. Refine Button spacing and popup-open state

[Button](../../packages/design-system/src/components/button.tsx) already annotates
leading/trailing icons with `data-icon`, but its size recipes do not adjust padding
around those icons. Icon size and gap are also fixed across its density choices.
Its variants paint hover, pressed and disabled states without a treatment for
`aria-expanded` on popup triggers.

Compare [ReUI Nova's button recipes](../examples/reui-main/registry/styles/style-nova.css)
with the [shadcn counterpart](../examples/shadcn-main/apps/v4/registry/styles/style-nova.css).
Tune Ledger's existing sizes and tokens; demonstrate text-only, icon-leading,
icon-trailing, loading, split-action and open-menu states together. Preserve the
focus-preserving loading behavior and avoid treating expanded state as toggle state.

### 3. Make rich floating-list content intentional

[Select, DropdownMenu and Command's shared row recipe](../../packages/design-system/src/components/menu.ts)
uses a fixed row height. [ComboboxItem](../../packages/design-system/src/components/combobox.tsx)
already uses minimum height and supports richer content; its Groups story includes
descriptions. Establish how icons, avatars, descriptions, shortcuts and selection
indicators align across these families. Keep compact action menus compact, while
letting descriptive choices wrap without height overrides scattered through callers.

### 4. Review form and surface treatments against concrete examples

[Field](../../packages/design-system/src/components/field.tsx) provides checked and
focus treatment for choice cards, but no enabled hover treatment. Its labels remain
subtle when invalid; controls and error messages carry the error styling. Compare
the whole field's default, hover, focus, invalid and disabled presentation, and make
intentional choices about which parts change. This is a visual design choice, not
evidence that the existing native associations or validation behavior are broken.

[Card](../../packages/design-system/src/components/card.tsx) always separates its
header and footer with borders. Review compact settings, metric and media examples
before making those separators optional or introducing another treatment. Preserve
the package's restrained appearance; do not change global radii or type sizes merely
to match an arbitrary ReUI theme.

## Curated ReUI references

| Reference | What to study | Where it belongs in Ledger |
| --- | --- | --- |
| [Status picker, c-combobox-21](../examples/reui-main/registry-reui/bases/base/components/combobox/c-combobox-21.tsx) | Consistent status glyph in trigger and results; empty state and popup proportions. | Refine Combobox/Editable examples using existing Badge and Indicator. |
| [Member picker, c-combobox-24](../examples/reui-main/registry-reui/bases/base/components/combobox/c-combobox-24.tsx) | Avatar summary, overflow count, clear selection and readable option identities. | Existing Combobox multiple API and Avatar; a focused reviewer-selection recipe. |
| [Decision actions, c-button-group-47](../examples/reui-main/registry-reui/bases/base/components/button-group/c-button-group-47.tsx) | One primary action with clearly differentiated alternatives. | Existing ButtonGroup + DropdownMenu. App supplies decisions and callbacks. |
| [File rows, c-item-6](../examples/reui-main/registry-reui/bases/base/components/item/c-item-6.tsx) | Filename, type, metadata, state and explicit action hierarchy. | Refine Item/Attachment compositions, preserving separate row and action targets. |
| [Upload queue, c-file-upload-5](../examples/reui-main/registry-reui/bases/base/components/file-upload/c-file-upload-5.tsx) | Dropzone constraints, per-file progress, retry and aggregate errors. | Potential queue pattern over Attachment's existing lifecycle states. Transport remains caller-owned. |
| [Activity, c-timeline-11](../examples/reui-main/registry-reui/bases/base/components/timeline/c-timeline-11.tsx) | Actor/action/target sentence hierarchy, quiet timestamps and wrapping. | Refine existing Timeline activity stories; no second feed component. |
| [Remote filters, c-filters-4](../examples/reui-main/registry-reui/bases/base/components/filters/c-filters-4.tsx) | Paged option search and restoring readable labels for saved IDs. | A separately scoped extension to DataTable facets and view state. |
| [Nested filters, c-filters-10](../examples/reui-main/registry-reui/bases/base/components/filters/c-filters-10.tsx) | Boolean groups, editable rules and condition summaries. | New query-builder capability only when a product workflow needs it. |
| [Date selection, c-date-selector-2](../examples/reui-main/registry-reui/bases/base/components/date-selector/c-date-selector-2.tsx) | Draft versus committed range, Apply/Cancel and trigger summary. | Reporting-period pattern; DatePicker currently commits one ISO day. |
| [Hierarchy selection, c-cascader-3](../examples/reui-main/registry-reui/bases/base/components/cascader/c-cascader-3.tsx) | Search results with paths and unambiguous nested selection. | Evaluate against Tree/RecordPicker when a real hierarchy-selection flow requires it. |

The first six are primarily composition references using capabilities Ledger already
owns. Several existing stories already cover parts of these interactions; refine
those stories instead of duplicating them. The final four warrant separate product
requirements. ReUI's full Filters implementation spans 14 files and roughly 10,000
lines; Cascader spans 11 files and roughly 8,500 lines.

## Adoption and review

Port ideas from the Base UI tree into existing families with package-relative
imports, Ledger tokens and Ledger icons. ReUI uses `cn-*` style hooks resolved by
its style sheets and catalog-only `IconPlaceholder` imports; copying TSX alone
does not reproduce its appearance. Both systems already use TanStack Table v9;
replacing Ledger's table adapter is unnecessary for this pass.

The upload and remote-filter examples simulate services. Retain Ledger's separation
between presentation and real persistence, and keep product event names, approval
rules and people lookup in the application.

Review the first pass in existing Storybook family pages at compact/default density,
light/dark mode and narrow width, with long content and keyboard interaction. For
Editable's behavior change, cover rich rendering on either side of the search
threshold and failed-save recovery. Run the package's relevant type, lint and story
checks; update public API documentation only if the contract actually changes.

Audit evidence is source comparison plus a spot inspection of the current Data table
Register, Forms Fields and Item Lists stories. Those previews can run their play
functions; the spot inspection is not a visual regression suite or an exhaustive
accessibility assessment. No component implementation or test suite was changed.

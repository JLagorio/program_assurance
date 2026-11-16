Ledger is the design system of Program Assurance, an RMF and GRC platform for system security engineers, assessors, ISSMs and authorizing officials. It is dense, quiet and exact: the colour belongs to statuses, the numbers carry the meaning, and every screen reads in one register.

## Using this system

- Every part is a CSS class in `components/bundle.css`, under one root: wrap a screen in `<div class="lx">`. Ledger's own parts are `k-…`; parts the November 2026 UX proposal adds are `nx-…` and are marked Proposed on their cards.
- The cards are static renditions of Ledger's React parts as the proposal's mocks draw them. The React components themselves (`@ledger/design-system`, 159 story families) are not bundled here.
- Set the theme on the root element: `data-theme="light"`, `"dark"`, `"light-contrast"` or `"dark-contrast"`. Never style a colour for one theme only.

## Content fundamentals

- Sentence case everywhere: titles, buttons, columns, tabs. No emoji, no exclamation marks.
- A button says the operation and its noun, the same words on the trigger, the dialog title and the primary: Create task, Assign owner, Take version 2, Offer to owner. Never OK, Submit or Save alone.
- Create makes a new record. Add or Link connects one that exists. Map a requirement, Allocate requirements, Link evidence.
- Numbers over prose. Write a count as a number out of its whole, "42 of 61", "176 of 560 satisfied", "3 of 26 objectives". A tray's heading is its count, "43 open issues".
- One line a row, and no second line inside a table cell.
- A missing value is never a zero, a dash or blank. It reads Not recorded, Not available, No due date or Could not load.
- RMF's words, exactly: Satisfied, Partially satisfied, Other than satisfied, Not assessed, No evidence, No requirement. An Assessment finding is not an Operational issue. Owner, never Lead. Control baseline, never "the controls".
- Real records in every example: WS-X90 Sentinel Mission System, AC-2 Account Management, CVE-2024-6387, Mission Computer 2, Priya Raghavan. No placeholder text.

## Visual foundations

**Grounds.** The page and the work area are `ds-elevation-surface`. The side nav, a canvas behind cards and the space around a phone are `ds-elevation-surface-sunken`. A card or tray is `ds-elevation-surface-raised` with `ds-elevation-shadow-raised`. A dialog, sheet, menu or popover is `ds-elevation-surface-overlay` with `ds-elevation-shadow-overlay`, over the blanket `ds-color-blanket`. A tray holding counted lines is `ds-elevation-surface-tray`.

**Text.** Body copy and names are `ds-color-text`. Labels, column heads and secondary facts are `ds-color-text-subtle`. `ds-color-text-subtlest` is for meta only (a timestamp, a unit) and never for anything a reader must act on. Text on a bold fill is `ds-color-text-inverse`. A status word takes its tone's `-bolder` text: `ds-color-text-success-bolder`, `ds-color-text-warning-bolder`, `ds-color-text-danger-bolder`, `ds-color-text-information-bolder`.

**Colour is for status.** Neutral first: a record's name is `ds-color-text` at weight 500, never a coloured link. A status badge is its tone's `-subtler` background with its `-bolder` text (`ds-color-background-success-subtler` + `ds-color-text-success-bolder`). Bold fills (`ds-color-background-danger-bold`, `ds-color-background-neutral-bold`) are for the one loud mark on a screen. The brand blue, `ds-color-background-brand-bold`, is the one primary button and nothing else.

**Charts and marks** use `ds-color-chart-success`, `ds-color-chart-warning`, `ds-color-chart-danger`, `ds-color-chart-information` and `ds-color-chart-neutral`, with their `-hovered` steps. A control's status mark: Satisfied success, Partially satisfied warning, Other than satisfied danger, Not assessed neutral, No evidence and No requirement as hollow or faint neutral. Late is told by shape as well as colour.

**Borders.** Hairlines and row rules are `ds-color-border` at `ds-border-width` (1px). A control's outline is `ds-color-border-input`, a selected one `ds-color-border-selected` at `ds-border-width-selected`. Focus is a solid 2px ring in `ds-color-border-focused` (`ds-border-width-focused`), never removed.

**Type.** Geist and Geist Mono (`--font-sans`, `--font-mono`), letter-spacing a hair under zero.

| Style | Size | Use |
| --- | --- | --- |
| `ds-font-heading-display` | 32/40, 600 | The one loud figure on a screen: "42 of 61" |
| `ds-font-heading-page` | 24/30, 600 | A page or record's h1 |
| `ds-font-heading-overlay` | 17/24, 600 | A dialog or sheet title |
| `ds-font-heading-section` | 15/22, 600 | A section's h2 |
| `ds-font-body` | 13/18, 400 | Everything else: rows, fields, buttons (500) |
| `ds-font-body-small` | 12/16, 400 | Column heads, badges, meta |
| `ds-font-heading-xxsmall` | 11/14, 500 | Caps labels, letter-spaced |
| `ds-font-code` | 12/18, mono | Identifiers when set apart, versions, hashes |

The Deprecated headings group (`ds-font-heading-large`, `-medium`, `-small`, `-xsmall`) is kept for old screens; do not use it in new work.

**Spacing.** Only the scale: `ds-space-025` 2px, `-050` 4, `-075` 6, `-100` 8, `-150` 12, `-200` 16, `-250` 20, `-300` 24, `-400` 32, `-500` 40, `-600` 48, `-800` 64, `-1000` 80. The work area pads 16px top and 24px sides (16px on a phone) and stacks its blocks `ds-space-200` apart; a section's heading sits `ds-space-100` above its content. Lay out with `gap`, never margins.

**Radius.** `ds-radius-small` 3px for small marks and the app mark; `ds-radius-medium` 6px for buttons, fields, chips, toggles and alerts; `ds-radius-large` 10px for cards and menus; `ds-radius-xlarge` 12px for trays and dialogs; `ds-radius-full` for badges, states and avatars.

**Density.** Table header rows 32px, body rows 40px and one line each. Buttons 24, 28 (default), 32 and 36px (the record header's action slot). Fields and chips 28px. A tab strip is 32px with an underline across the content width.

**Layers.** `ds-layer-chrome` for the top bar, `ds-layer-blanket`, `ds-layer-overlay`, `ds-layer-toast`, `ds-layer-tooltip`, in that order. `ds-opacity-disabled` dims what cannot run, which still says why on hover.

**Themes.** Light and dark are designed separately; increased contrast is `light-contrast` and `dark-contrast`, which raise the 18 tokens Ledger's contrast mode raises. Every pair Ledger declares meets 4.5:1 for text and 3:1 for marks in all four themes (2,640 pairs measured).

## Iconography

Lucide icons at their own 2px stroke, in `currentColor`, 16px by default and 12, 14, 20 or 24 where a part asks. Few icons: one beside a navigation destination, inside an icon-only button (which carries an `aria-label`) or before a status where shape must say what colour says. None in table rows and none as decoration.

## Layout

- **Shell** (`k-app`): a 48px top bar holding the app mark, Search and the reader; a 228px side nav that folds to an icon rail; the work area beside it. The organization scope (Home, Portfolio, Programs, Library) and the work scope (Overview to Authorization, under a product or a system) share one side nav.
- **Register**: a page header with the name alone, then one frameless table that fills the work area, with its toolbar (search first, saved views, filters, one small primary) above it.
- **Record**: a trail, the name as h1, one primary or an Actions menu, then tabs. Details sit in a 296px rail on Overview and fold above the body when the frame is narrow.
- **Overview**: counted trays side by side, worst first, each heading opening what it counts.
- **Overlays**: a dialog is 560px (`k-dialog`) or 760px (`s-lg`); a sheet docks to the end edge at 520 or 720px. Cancel is subtle and comes before the primary.

## Not in this system

- Ledger's React components and their behaviour (focus management, keyboard, responsive tables): the cards are static renditions.
- Motion tokens: Ledger moves on short fades and slides and honours reduced motion; this system carries no motion values.
- The `ds-font-…` shorthands and family stacks are declared in `components/bundle.css`, since a token here holds one value.

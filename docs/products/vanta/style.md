# Vanta's look, and Ledger pushed toward it

Researched 2026-11-17 from 71 Vanta screenshots in this folder (now under `images/ux/`, grouped by area: see `images/README.md`) and 8 recent Program Assurance screens. Every Vanta colour below is estimated by eye from compressed screenshots and marked (est.). Image paths are relative to this folder; the app's screens are in the session scratchpad, `shots/w9/` and `shots/w10/`. Vanta's images are third-party and stay on this machine (the folder is gitignored).

**Two eras show in the set.** The older screens (search as a "Help… ⌘+K" pill in the nav) use a violet accent for primaries, the current nav item and tab underlines. The newest ones (an AI search field in the top bar, late 2025–2026) take violet back out: ink primaries, ink underlines, grey current items. The direction below follows the newest era, which is also the one furthest from a brand colour.

## 1. Vanta's visual language

### Canvas, surfaces and the nav

- The canvas is pure white #FFFFFF on every page, behind cards and tables alike; there is no grey page background. [images/ux/frameworks/frameworks-page--01.png, images/ux/controls/controls-page--01.png, help-center/images/ux/controls/managing-common-controls--01.png]
- The side nav is a very light grey with no border against the page: older ≈ #F6F5F7 (est.), newest ≈ #F7F7F9 (est., oklch 0.977 0.003 286). The fill is the edge. [images/ux/home/home-page--01.png, images/ux/settings/interface-settings--01.png]
- The nav is ≈ 215–240px wide (214px at 1x), its items ≈ 36–38px tall: 14px regular ink text after a 16–18px outline icon. [images/ux/audits/how-will-your-auditor-use-vanta--01.png, images/ux/settings/interface-settings--01.png]
- Hairline dividers group it, not labels: Home, My work, Tests, Reports · Compliance to Personnel (each expandable, chevron at the right, children indented as text without icons) · Integrations · the reader's own tasks. [images/ux/my-work/my-work-page--01.png, images/ux/settings/interface-settings--01.png]
- Older current item: a radius-6 grey fill ≈ #EBEAEE (est.) with violet text and icon, and a 3px violet bar on the nav's outer edge beside the open group. [images/ux/frameworks/frameworks-page--01.png, images/ux/documents/documents-page--01.png]
- Newest current item: the same grey fill with ink text, and a 4px ink bar at the edge. No violet. [images/ux/workspaces/getting-started-with-workspaces--07.png, help-center/images/ux/controls/managing-common-controls--01.png]
- Collapsed, the nav is a ≈ 56px icon rail on the same grey, with the search as a round icon and the expand control "|→" at its foot. The current icon is violet with an edge bar. [help-center/images/ux/issues/issue-management-in-vanta--01.png, images/ux/tests/automated-test-history--01.png]
- The top bar is white, ≈ 56–64px tall, with a hairline under it, and it runs the full width above the nav: the plum wordmark, a bordered workspace switcher with its logo, a centred AI search field ≈ 480px wide (✦, ⌘K), then 20px grey outline icons and a 32px avatar. [images/ux/settings/interface-settings--01.png, help-center/images/ux/workspaces/vanta-workspaces--01.png]

### Brand and accent

- The brand plum ≈ #2B0B45 (est.) appears only in the wordmark, the audit band and the default Trust Center hero, which carries a tone-on-tone icon pattern ≈ #4A1E78 (est.). [images/ux/audits/how-will-your-auditor-use-vanta--01.png, help-center/images/ux/trust-center/managing-your-trust-center--01.png]
- The older accent violet ≈ #7B2FE0 (est.) covers primaries, links ("View all frameworks →"), the current nav text, checkboxes, switches, applied filters and the tab underline. [images/ux/home/home-page--01.png, images/ux/documents/documents-page--01.png, images/ux/frameworks/adaptive-framework-scoping--01.png]
- The newest screens use ink ≈ #16151B (est.) for primaries, tab underlines, switches and radios. [images/ux/risk/managing-risks-and-risk-registers--01.png, images/ux/access/access-reviews--01.png, images/ux/settings/interface-settings--01.png, help-center/images/ux/settings/risk-scoring--02.png]
- A lavender tint ≈ #F2EAFD (est.) marks things quietly: the chosen quick view, the current category, the In audit pill, the avatar fills and AI suggestion strips. A lavender gradient heads the AI cards. [images/ux/vendors/adding-and-managing-vendors--01.png, images/ux/tests/the-tests-page--01.png, images/ux/access/access-reviews--04.png]
- The accent is used sparingly: a typical register holds one primary, the applied filters and perhaps one link, a small fraction of its pixels. [images/ux/policies/creating-policies-with-policy-builder--04.png, images/ux/risk/managing-risks-and-risk-registers--01.png]

### Type

- The face is a neutral grotesque close to Inter (est.), normally tracked, in ink ≈ #16151B (est.). [images/ux/policies/creating-policies-with-policy-builder--04.png]
- Body and table text is 14px regular; names are 14px medium. Secondary text is 13px grey ≈ #5F5D68 (est.) and tertiary ≈ #8C8A95 (est.). [images/ux/policies/creating-policies-with-policy-builder--04.png, images/ux/controls/controls-page--01.png]
- Page titles are ≈ 26–28px semibold, section headings ≈ 20–22px ("Compliance progress", "Risk scenarios") and card titles ≈ 18–20px. [images/ux/home/home-page--01.png, images/ux/risk/managing-risks-and-risk-registers--02.png]
- Big numbers are 32–36px semibold (18%, 1%, 201): after the title, the largest type on the page. [images/ux/frameworks/framework-details-page--02.png, images/ux/controls/controls-page--01.png, images/ux/access/access-reviews--01.png]
- Newer table headers are 13px medium grey in sentence case; older ones are 12px uppercase and tracked. [images/ux/policies/creating-policies-with-policy-builder--04.png, images/ux/vulnerabilities/the-vulnerabilities-page--01.png, images/ux/devices/computers-page--01.png]
- Record titles stay large even when long, wrapping onto a second line at ≈ 28px. [images/ux/risk/completing-risk-assessments--02.png, images/ux/tests/automated-test-history--01.png]

### Density, radius, borders and shadows

- Rows are ≈ 56–60px at 1x even when they hold one line. Table headers are ≈ 40px, controls ≈ 32px and pills ≈ 22px. [images/ux/policies/creating-policies-with-policy-builder--04.png, images/ux/audits/how-will-your-auditor-use-vanta--01.png]
- The page gutter is ≈ 40px, with ≈ 24px between the header, the cards and the table, and ≈ 24px of padding inside a card. [images/ux/controls/controls-page--01.png, images/ux/access/access-reviews--01.png]
- Radii: buttons and inputs ≈ 6px, cards and table frames ≈ 8px, modals ≈ 12px, tags ≈ 4px. Pills, avatars and progress bars are fully round. [images/ux/controls/controls-page--06.png, images/ux/policies/creating-policies-with-policy-builder--04.png]
- Borders take the place of shadows: every card, table and secondary button has a 1px hairline ≈ #E4E3E8 (est.), and none of them casts a shadow. [images/ux/controls/controls-page--01.png, images/ux/frameworks/frameworks-page--01.png]
- Shadows are kept for what floats: menus, popovers and the comments inbox (≈ 0 8px 24px at 12%, est.), and the side panel's leading edge. [images/ux/notifications/comments-in-vanta--02.png, images/ux/integrations/integrations-page--04.png]

### Cards and summary cards

- Summary cards come in pairs, half the width each: white, bordered, radius 8 and padded 24, a completion card beside a Needs attention card or an assignment card. [images/ux/tests/the-tests-page--01.png, images/ux/controls/controls-page--01.png]
- The completion card holds a title, a 32–36px percentage, an 8px pill bar with "8 controls … 44 total" under it, and at its right two grey mini-tiles, each with its own bar (Test 93/182 51%, Document 8/34 24%). [images/ux/frameworks/framework-details-page--02.png, images/ux/controls/controls-page--05.png]
- The Needs attention card puts its total at the right of the title, at the same weight. Below come rows of glyph, label and count: a red square-✕ for Overdue 183, an orange clock for Due soon 24, a red diamond-! for Needs remediation 2787. [images/ux/tests/the-tests-page--01.png, images/ux/vulnerabilities/the-vulnerabilities-page--01.png]
- Home shows one card a framework: its name at 20px, the % at 36px, a green bar, "14 controls complete … 78 total" and a chevron. A "View all frameworks →" link follows. [images/ux/home/home-page--01.png]
- A callout is a full-width grey box ≈ #F7F6F8 (est.): an orange triangle or a red square glyph, a bold line over a grey line, and one bordered button at the right. [images/ux/home/home-page--01.png, images/ux/integrations/integrations-page--01.png, images/ux/policies/creating-uploading-and-renewing-a-policy--10.png]
- The older framework tiles have a lavender gradient top with a ghosted seal, and a white foot holding a ring, the % and Snooze. [images/ux/frameworks/bringing-your-current-compliance-program-into-vanta--09.png]

### Progress, rings and donuts

- Bars are 8px and fully round: one green fill (older ≈ #5DB878, newest ≈ #14966A, est.) on a grey track ≈ #E3E2E7 (est.). [images/ux/home/home-page--01.png, images/ux/controls/controls-page--01.png]
- Rings sit in cells at 16px: a thin green arc for a percentage, a filled green check-circle at 100% and a dashed grey ring for none. [images/ux/frameworks/frameworks-page--01.png, help-center/images/ux/questionnaires/collaborating-on-questionnaires--01.png]
- Donuts have a thick stroke, about 8% of the diameter, with a 32px figure and a grey label at the centre. The legend sits at the right, with 10px square swatches and counts aligned right. [images/ux/controls/controls-page--01.png, images/ux/access/access-reviews--01.png, images/ux/access/access-reviews--03.png]
- Trackers are 6px stacked bars with round ends and segments that touch, under an inline legend ("■ Not ready: 4"). [images/ux/audits/how-will-your-auditor-use-vanta--01.png, help-center/images/ux/audits/managing-an-information-request-list-irl--01.png]

### Pills, badges and tags

- Status pills are fully round, ≈ 22px tall, 12–13px medium, with a 12px glyph in front and a tinted fill (all est.): green ≈ #E5F5EA / #227A45, red ≈ #FDEBEC / #C52F3A, amber ≈ #FEF1E1 / #B2540F, blue ≈ #E8F0FD / #2160D9, grey ≈ #F0EFF2 / #4F4D57. [images/ux/policies/creating-policies-with-policy-builder--04.png, help-center/images/ux/issues/issue-management-in-vanta--01.png]
- The glyphs keep one meaning each: a filled check is done, a dashed ring is not started or no evidence, a clock is pending, a diamond-! needs remediation, a square-✕ is overdue and a triangle is due soon. [images/ux/policies/the-policies-page--03.png, images/ux/documents/documents-page--01.png]
- Some statuses drop the pill for a glyph and a word in ink (Overdue, OK), so the glyph carries the colour. [images/ux/documents/documents-page--01.png, images/ux/policies/the-policies-page--01.png]
- Severity is a dot and a word: a filled 12px circle (critical dark red, high red, medium orange, low green, unscored grey) before the word in ink. [images/ux/vendors/adding-and-managing-vendors--01.png]
- Risk scores are solid round chips with white numerals (red 15, orange 12, green 4) and a grey "?" for none. [images/ux/risk/managing-risks-and-risk-registers--01.png]
- Tags (frameworks, domains, codes) are square at ≈ 4px radius, with a grey fill ≈ #F1F0F3 (est.), 13px grey-ink text and no border. Overflow reads "+5". [images/ux/frameworks/frameworks-page--01.png, images/ux/controls/controls-page--04.png]
- A header's tags are outlined pills (HIPAA, ISO 27001:2022). [help-center/images/ux/policies/approving-a-policy--01.png]

### Tables

- A table sits in a bordered, radius-8 frame. Its header is a grey band ≈ #F9F8FA (est.), and its rows are divided by hairlines, with no zebra. [images/ux/frameworks/frameworks-page--01.png, images/ux/policies/creating-policies-with-policy-builder--04.png]
- Hover and selection are grey: ≈ #F7F7F9 hovered, ≈ #EBEBEE chosen (est.). They are never tinted with the accent. [images/ux/controls/controls-page--05.png, images/ux/policies/creating-uploading-and-renewing-a-policy--10.png]
- The first column holds the name at 14px medium in ink, often over a second grey line (a description, a source or an email). [images/ux/controls/controls-page--01.png, images/ux/access/access-reviews--01.png]
- An owner is a 24–28px initials avatar with the name; nobody is a dashed person glyph. [images/ux/risk/managing-risks-and-risk-registers--01.png, help-center/images/ux/controls/managing-common-controls--01.png]
- Logos and file icons lead the rows of integrations, vendors and documents. [images/ux/vendors/adding-and-managing-vendors--01.png, help-center/images/ux/questionnaires/managing-your-knowledge-base--01.png]
- Each row ends in "⋯". While rows are chosen, the toolbar becomes "5 selected · Deselect · Assign owner · Deactivate". [images/ux/controls/controls-page--05.png, images/ux/risk/managing-risks-and-risk-registers--03.png]
- The footer reads "1 to 10 of 13 results", with a Show per page select and a joined previous/next pair. [images/ux/vendors/adding-and-managing-vendors--01.png]

### Side panels and modals

- The side panel runs the full height under the top bar and takes about a third of the window (≈ 440–560px, est.). It is white, with a hairline and a soft shadow on its leading edge and no scrim, so the register stays in view. [images/ux/audits/how-will-your-auditor-use-vanta--03.png, images/ux/integrations/integrations-page--04.png, images/ux/frameworks/bringing-your-current-compliance-program-into-vanta--16.png]
- Inside a panel come, in order: ⋯ and ✕ top right, a 16–18px title over a grey description, label/value rows (a ≈ 100px grey label column), line tabs, then bordered sub-cards, each with its header and a "+". [images/ux/frameworks/bringing-your-current-compliance-program-into-vanta--16.png]
- A review sheet docks right, with the page dimmed behind it and a footer primary ("Publish 2 changes"). [help-center/images/ux/trust-center/managing-your-trust-center--03.png]
- Modals are white at ≈ 12px radius, padded ≈ 24–32px: a 20–24px semibold title with ✕ at the right, grey body text, and Cancel (outlined) before the primary or the danger at the footer's right. The scrim is a light grey at ≈ 20–30% (est.). [images/ux/controls/controls-page--06.png, images/ux/vendors/adding-and-managing-vendors--03.png, help-center/images/ux/vendors/conducting-vendor-security-assessments--05.png]
- The picker modal has two panes: a list under a grey search band on the left, the detail with one full-width primary "Add" on the right. [images/ux/tests/creating-custom-tests--10.png]

### Tabs, filters and toolbars

- Tabs are line tabs at 14–15px. The current one is ink medium over a 2px underline (violet in the older screens, ink in the newest), and counts are grey round chips ("Updates 0"). [images/ux/frameworks/frameworks-page--01.png, images/ux/risk/completing-risk-assessments--02.png]
- Quick views sit above the toolbar as grey-filled chips with counts (Procurement 63 · Active 160 · Archived 53 · All 276). The current one is lavender with violet text. [images/ux/vendors/adding-and-managing-vendors--01.png, help-center/images/ux/issues/issue-management-in-vanta--01.png]
- The toolbar starts with a bordered search (≈ 32px tall, ≈ 300px wide). Filters follow as borderless text triggers ("Status ⌄"), and an applied one turns violet with a count chip. Then come "+ Add filter" and "Reset", with a bordered sliders icon at the far right. [images/ux/risk/managing-risks-and-risk-registers--01.png, help-center/images/ux/questionnaires/collaborating-on-questionnaires--01.png]
- A category rail can stand left of the cards: an uppercase grey label over rows with counts at the right, the counts red when they count problems. [images/ux/tests/the-tests-page--01.png, help-center/images/ux/controls/managing-common-controls--01.png]

### Buttons

- The primary is solid, violet in the older screens and ink in the newest, with white 14px medium text, ≈ 32–36px tall at radius 6. A split primary adds a chevron segment. [images/ux/documents/documents-page--01.png, images/ux/risk/managing-risks-and-risk-registers--05.png]
- The secondary is white with a 1px grey border and ink text, and may lead with an icon ("+ Add framework", "⤓ Export all"). [images/ux/frameworks/frameworks-page--01.png, images/ux/documents/documents-page--01.png]
- Icon buttons are bordered squares of 32–36px (⋯, sliders, people). [images/ux/risk/managing-risks-and-risk-registers--01.png]
- Text actions are in the accent ("Deselect", "View all frameworks →"), and danger items are red in menus. [images/ux/controls/controls-page--05.png, images/ux/frameworks/framework-details-page--01.png, images/ux/policies/creating-uploading-and-renewing-a-policy--10.png]
- Decision buttons fill solid once chosen: Approve green, Deny red, Change roles orange. [images/ux/access/access-reviews--04.png]

### Empty states and illustration

- First run sets a large solid plum llama beside a 24px headline, grey body text, a violet primary and an outlined secondary. [images/ux/home/bringing-your-current-compliance-program-into-vanta--01.png]
- A setup page centres an outline glyph in a 56px circle over a 24px headline and grey text, then step cards with dashed-ring markers. [images/ux/personnel/adding-and-managing-personnel--01.png]
- An empty section is one grey centred line inside its bordered card ("No tests associated with this control"), or a title, a line and a primary ("No related controls", "Add control →"). [images/ux/frameworks/bringing-your-current-compliance-program-into-vanta--16.png, images/ux/tests/creating-custom-tests--09.png]
- Feature tiles carry pastel 48px circles with tinted outline icons. [images/ux/integrations/integrations-page--03.png]

### Charts

- In a heatmap every cell is tinted by its zone (pale red ≈ #FCEDEE, amber ≈ #FEF6E6, green ≈ #EDF6EF, est.). The cells that hold records are filled solid (amber ≈ #FBBF24, green ≈ #4DB66B), with the count centred. The gutters are 2px, the corners square, and the legend is square swatches. [help-center/images/ux/risk/risk-snapshots-and-reports--01.png, help-center/images/ux/risk/risk-snapshots-and-reports--03.png]
- Donuts and bars have no gridlines and no axes: the numbers carry the chart. [images/ux/access/access-reviews--01.png, images/ux/controls/controls-page--01.png]
- Explanatory diagrams are flat greys with hatched deltas. [help-center/images/ux/settings/risk-scoring--02.png]

### Iconography, modes and dark

- Icons are outlines of ≈ 1.5px stroke with round joins, 16–18px, in ink-grey across the nav and the buttons. [images/ux/settings/interface-settings--01.png]
- The only colour in the chrome comes from small filled status glyphs. [images/ux/tests/the-tests-page--01.png]
- Third-party logos lead rows and cards in full colour at 20–24px. [images/ux/integrations/integrations-page--04.png]
- An audit replaces the top bar with a ≈ 74px plum band ≈ #23083D (est.): the framework seal, the audit's name, an outlined white pill (Awaiting report), the window, and the auditor's avatar at the right. [images/ux/audits/how-will-your-auditor-use-vanta--01.png, images/ux/audits/how-will-your-auditor-use-vanta--03.png]
- Dark mode is generally available (System, Light, Dark under Settings › Interface), but no screenshot in the set shows it, so nothing here describes its values. [images/ux/settings/interface-settings--01.png, help-center/articles/product-updates.md]

## 2. Program Assurance today vs Vanta

From `shots/w9/01-portfolio-tree.png`, `02-components-register.png`, `04-component-assessment.png`, `14-phone-portfolio.png` and `shots/w10/01-controls-status.png`, `03-publish-ssp-prompt.png`, `04-si2-implementation.png`, `08-si2-add-evidence.png`:

1. Much is already shared: a white canvas, a light grey nav, line tabs with an ink underline, ⌘K search, outline icons and Geist close to Vanta's grotesque. The gap is in proportion and accent, not in kind.
2. The brand sits in the side nav's header (a blue tile, "Program Assurance", the workspace), and the top bar holds only a search at its left and icons (w10/01). Vanta's top bar spans the full width, with the wordmark, the switcher and a centred search.
3. The current nav item is a blue tint with blue text and a blue bar (w10/01 Controls). Vanta's is grey with ink text.
4. Blue runs everywhere: the primaries, record names and numbers in link blue (Air Defense, REQ-064, an underlined "176 of 560"), the chosen quick view outlined in blue (w9/01, w10/01, w10/04). Vanta keeps the text ink and the accent rare.
5. The type is a size smaller: 13px body and ≈ 30px nav rows against 14px and ≈ 38px, and a 24px page title against ≈ 28px.
6. Tables are frameless on white, with no header band and no frame, at 40px rows (w9/02, w10/01). Vanta frames each table, puts its header in a grey band and runs 48–60px rows.
7. Statuses are small square-cornered tinted labels without glyphs (w10/01 Satisfied, w9/04 Other than satisfied). Vanta's are round pills, each with its glyph.
8. Summaries are strips: an inline legend strip in a tray ("61 controls ███ satisfied 42 …", w9/04), a band of bordered KPI cells (w10/03), a bare "176 of 560" headline (w10/01). Vanta uses discrete white cards with a title, a big % and a green pill bar, beside a Needs attention card.
9. Facts run together in header lines ("Owner Priya Raghavan Business line Air Defense Type Hardware Component set …", w9/04; w10/04). Vanta sets them as labels over values, or as a meta line led by icons.
10. Filters are dashed-border "+ Control status" chips beside bordered Sort and Columns buttons (w10/01). Vanta's filters are borderless "Status ⌄" triggers that take the accent and a count once applied.
11. Progress is thin multi-status stacked bars with square ends and white "remaining" boxes (w10/01, w9/01). Vanta's is a single green pill bar on a grey track, with rings in the cells.
12. Summary numbers are small: a 20px figure (38, 144 in w10/03) against Vanta's 32–36px.
13. Dialogs are radius 16 over a 50% blanket (w10/03, w10/08). Vanta's are ≈ 12 over a light ≈ 25% scrim.
14. The phone layout is ours and good (w9/14). Vanta's set shows no phone screens, so nothing there needs to move.

## 3. The direction: Ledger, pushed toward Vanta

### What "Ledger's feel" is, and stays

From `packages/design-system/README.md`, the Storybook Introduction and the tokens:

- **Every value is a token named for its role**, states are tokens of their own, and dark mode is a mechanical flip. Each proposal below is a token or a part's treatment, and none of them is a one-off on a screen.
- **Geist and Geist Mono**, self-hosted, set in rem so a reader's text size scales everything.
- **Quiet neutrals, colour kept for meaning.** A status is a word with a tone, never a colour alone. The contrast tests hold in both modes, at increased contrast and in forced colours.
- **Dense and data-first.** Registers keep more rows on screen than Vanta (48px against 60px), and a cell holds one line.
- **Numbers over prose**, and Ledger's own visual forms (TileMap, Tally, PhaseBar, Trace, Ladder) drawn in its tokens.
- **Blue is Ledger's.** It stays the brand, the focus ring and the mark of selection. It only stops doing the work of ink.

### (a) Token changes

The values are written as Ledger authors them (oklch, light value with its dark beside it), with hex for reading. A token not listed keeps its value. Each change goes through `npm run build:tokens`, the contrast suite, the API baseline and a CHANGELOG entry (`/ledger-add-part`).

| Token | Today (light · dark) | Proposed (light · dark) | Why |
|---|---|---|---|
| **Canvas and surfaces** | | | |
| `elevation.surface.default` | `neutral.0` #FFFFFF · `darkNeutral.100` | unchanged | Vanta's canvas is pure white everywhere, as Ledger's already is. |
| `color.neutral.*` (light ramp) | hue 258, chroma 0.002–0.024 (blue-steel) | hue 285, chroma 0.002–0.014: 100 #FAFAFB, 200 #F5F5F8, 300 #E7E7EC, 400 #BDBDC3, 500 #8E8E96, 600 #7F7F88, 700 #6F6F78, 720 #696972, 800 #51525A, 900 #2D2D34, 1000 #18181D, 1100 #0B0B0E (lightness steps unchanged) | Vanta's greys sit at hue ≈ 286 with almost no chroma (nav #F7F7F9 = oklch 0.977 0.003 286). Ledger's dark ramp is already hue 285, so both modes share one hue. |
| `color.neutral.*A` (alphas) | `oklch(0.22 0.024 258 / x)` | `oklch(0.21 0.010 285 / x)`, same x | The ink the overlays mix from follows the ramp. |
| `elevation.surface.nav` (new) | the nav reads `surface.sunken` = `neutral.100` #F9FAFB · `darkNeutral.-100` | `neutral.200` #F5F5F8 · `darkNeutral.-100` | The nav has to read as its own panel once its border goes. |
| `elevation.surface.header` (new) | none | `neutral.100` #FAFAFB · `darkNeutral.200` | The table's header band, a card's mini-tiles and the callout fill. |
| `elevation.surface.tray` | `neutral.200` #F4F6F8 · `darkNeutral.-100` | follows the ramp: #F5F5F8 | No change of role. |
| **Nav and shell** | | | |
| `dimension.layout.sidenav` | 228px | 240px | Room for 14px labels and 16px icons at Vanta's ≈ 240. |
| `dimension.layout.topnav` | 48px | 56px | The top bar takes the brand and the program switcher across the full width. |
| `dimension.row.nav` (new) | items use `row.menu` 28px | 2.25rem (36px) | Vanta's nav rows are ≈ 36–38px; Ledger's 28–30 read cramped beside them. |
| Shell current item (role) | `background.selected` #EBF6FF, `text.selected` #005CC5, a 2px `selected.bold` bar | `background.current` (ink 6%), `text.default` medium, a 3px `border.current` (ink) bar | Ink current, as Vanta's newest; all three tokens exist already. |
| **Accent** | | | |
| `color.background.brand.bold.default` | `blue.700` #006CD8 · `blue.400` | unchanged value. The Button primary stops reading it. | Blue stays Ledger's brand: the brand tile, a chosen checkbox and switch, the selected chip. |
| `color.background.neutral.bold.default` | `neutral.1000` #141B26 · `darkNeutral.1000` #ECECF2 | `neutral.1000` #18181D (via the ramp) · unchanged | The fill of the primary action, as Vanta's ink primary. |
| `color.background.mode.default` (new) | none | `blue.1100` #011630 · `blue.1000` #002D5E | Ledger's own dark band for an assessment or authorization mode, in Ledger's blue rather than Vanta's plum. |
| `color.text.brand` | `blue.725` #0067D3 · `blue.400` | unchanged, now used for links in prose, "View all →" and the label of an applied filter | Where Vanta used violet, Ledger uses blue, and as rarely. |
| `color.background.selected.default` | `blue.100` #EBF6FF · `blue.1000` | unchanged, now only the chosen quick view and an applied filter's count | A row chosen in a table moves to grey, as in Vanta. |
| **Status tones** | | | |
| `color.background.{success,danger,warning,information}.default` | 100 steps: #E8F8EF, #FFEFEC, #FFF3DF, #EBF6FF | unchanged | They already match Vanta's pill fills (est. #E5F5EA …); what changes is the shape, a round pill with a glyph. |
| `color.icon.danger` | `red.700` #BE2F2E · `red.500` | `red.600` #D33B39 · `red.500` | Status glyphs carry the colour at 12px, so they need Vanta's brighter red; the text tokens keep 4.5:1. |
| `color.icon.success`, `icon.warning` | `green.600` #0B9163, `orange.600` #C87600 | unchanged | Already at Vanta's glyph strength. |
| **Text** | | | |
| `color.text.default` | `neutral.1000` #141B26 | #18181D via the ramp | Ink without the blue cast (Vanta ≈ #16151B). |
| `color.text.subtle` | `neutral.800` #4C535E | #51525A | As above. |
| `color.text.subtlest` | `neutral.720` #646B75 | #696972 | Still above 4.5:1 on #FFFFFF and on the nav's #F5F5F8; the contrast suite confirms. |
| **Radius** | | | |
| `radius.small` | 3px | 4px | Tags and count chips, as Vanta's square ≈ 4px tags. |
| `radius.large` | 10px | 8px | Cards, table frames, popovers and menus at Vanta's ≈ 8. |
| `radius.xxlarge` | 16px | 12px | Dialogs at Vanta's ≈ 12; Ledger's 16 reads soft. |
| `radius.medium`, `radius.full` | 6px, 9999px | unchanged | Buttons, inputs, pills and avatars already match. |
| **Borders and elevation** | | | |
| `color.border.default` | `neutral.300A` (10% ink, ≈ #E7E8EA) | the same alpha on the new ink, ≈ #E8E8EB | Vanta's hairline ≈ #E4E3E8. It now does the work the shadows did. |
| `elevation.shadow.raised` | `0 0 0 1px …/0.08, 0 1px 2px …/0.06` | `0 0 0 1px oklch(0.21 0.01 285 / 0.12)` · `0 0 0 1px oklch(1 0 0 / 0.08)` | Cards and secondary buttons are bordered and flat; the 1px drop goes. |
| `elevation.shadow.overlay` | `0 0 0 1px …/0.08, 0 7px 32px …/0.14` | `0 0 0 1px oklch(0.21 0.01 285 / 0.08), 0 8px 24px -4px oklch(0.21 0.01 285 / 0.14)` · dark unchanged | Tighter, as Vanta's menus and popovers. |
| `elevation.shadow.panel` (new) | the panel uses a border | `0 0 0 1px oklch(0.21 0.01 285 / 0.08), -16px 0 32px -16px oklch(0.21 0.01 285 / 0.16)` · `0 0 0 1px oklch(1 0 0 / 0.07), -16px 0 32px -16px oklch(0 0 0 / 0.6)` | The panel floats over the register without a blanket, as Vanta's does. |
| `color.blanket` | `oklch(0.22 0.024 258 / 0.5)` · `/ 0.6` | `oklch(0.21 0.01 285 / 0.28)` · `oklch(0.1 0.01 285 / 0.5)` | Vanta dims lightly (≈ 25%), and the page behind stays readable. |
| **Spacing and density** | | | |
| `dimension.row.default` | 2.5rem (40px) | 3rem (48px) | Halfway to Vanta's 56–60: airier, still denser than Vanta. |
| `dimension.row.header` | 2rem (32px) | 2.5rem (40px) | Vanta's header band is ≈ 40px. |
| `dimension.row.menu` | 1.75rem (28px) | 2rem (32px) | Menus at the new body size. |
| `dimension.layout.panel` | 320px | 440px | Vanta's panel is ≈ 440–560px; at 320 a record preview is a list of truncations. |
| Space in use (the scale is unchanged) | Main inline padding `space.300` (24), Page gap `space.200` (16), Card padding `space.200` | `space.500` (40), `space.300` (24), `space.300` (24) | Vanta's gutters are ≈ 40, with 24 between blocks and inside cards. |
| `dimension.control.*` | small 28, medium 32, large 36 | unchanged; the page header's actions take `control.large` | Header actions at Vanta's ≈ 36. |
| **Type** | | | |
| `font.family.*` | Geist, Geist Mono | unchanged | Vanta's face is a neutral grotesque close to Inter (est.). The difference is size and weight, not family, and Geist is part of Ledger. |
| `font.body.default` | 0.8125rem / 1.125rem (13/18), `letterSpacing.200` (−0.008em) | 0.875rem / 1.25rem (14/20), `letterSpacing.100` (−0.004em) | Vanta reads at 14px with normal tracking. |
| `font.body.large` | 0.9375rem / 1.375rem (15/22) | 1rem / 1.5rem (16/24) | One step above the new body. |
| `font.label.default` (new) | none | 0.8125rem / 1.125rem (13/18), medium, `letterSpacing.100` | Table headers, KeyValue labels and filter triggers: the old body size, kept for the chrome. |
| `font.heading.page` | 1.5rem / 1.875rem (24/30), −0.015em | 1.75rem / 2.25rem (28/36), `letterSpacing.400` (−0.02em) | Vanta's titles are ≈ 26–28px. |
| `font.heading.section` | 0.9375rem / 1.375rem (15/22) | 1.125rem / 1.625rem (18/26) | Card and section titles at ≈ 18–20px. |
| `font.heading.overlay` | 1.0625rem / 1.5rem (17/24) | 1.25rem / 1.75rem (20/28) | Modal titles at ≈ 20–24px. |
| `font.figure.default` | 1.25rem / 1.625rem (20/26) | 1.5rem / 2rem (24/32) | Stat tiles. |
| `font.figure.large` (new) | none | 2.25rem / 2.75rem (36/44), semibold, −0.02em | The completion card's percentage, Vanta's biggest type. |
| **Charts and progress** | | | |
| `color.chart.track` | `neutral.200` #F4F6F8 · `darkNeutral.300` | `neutral.300` #E7E7EC · `darkNeutral.400` | Vanta's 8px track is a visible grey, not a whisper. |
| Progress fill for completion (role) | `chart.brand` (blue) | `chart.success.default` `green.600` #0B9163 | Completion reads green, as Vanta's; blue goes back to meaning "selected". |
| `color.chart.zone.{danger,warning,success}` (new) | none | `red.100` #FFEFEC, `orange.100` #FFF3DF, `green.100` #E8F8EF · `red.1000`, `orange.1000`, `green.1000` | The heatmap's zone tints behind the counted cells. |

### (b) Component treatments

- **Shell and nav:** the top bar runs the full width at 56px, with the brand tile and program switcher at the left, the ⌘K search centred at ≈ 480px and the icons and avatar at the right. Under it the side nav is 240px on `surface.nav` with no border: 36px items, 14px labels, 16px icons, groups split by hairlines, and the current item grey with ink text and an ink edge bar. Collapsed, it is a 56px rail. The blue brand tile is the one large blue on the screen.
- **Mode band:** while a reader works inside an assessment campaign or an authorization package, a 56px band in `background.mode` replaces the top bar, with inverse text: the campaign, an outlined status pill, its window and the assessor. It is Ledger's version of Vanta's audit band.
- **Page header:** the title at 28px. The count chip beside it goes, since counts live in the cards and tabs. Actions sit at the right at `control.large`: one ink primary, outlined secondaries and a bordered ⋯. Header facts are set as labels over values, never as one run-on line.
- **Summary cards:** a white `Card` with a 1px border, radius 8, padded 24. Its title is 18px with the total at the right, then `figure.large`, an 8px round bar (green fill on the 300 track) and "N controls … M total" in subtle text. Mini-tiles on `surface.header` may sit at its right, each with its own bar.
- **Needs attention card:** the same card. Each row is 40px: a 16px status glyph, the label, and the count at the right in 16px medium. The rows go by when (Overdue, Due soon, No owner, Not assessed), each a link to the register on that question, and a zero is muted. It is a `Tray` and `Stat.List` treatment, not a new family.
- **Tables and rows:** the DataTable sits in a bordered radius-8 frame. Its header is a 40px `surface.header` band in `font.label`, subtle and in sentence case. Rows are 48px, divided by hairlines, with no zebra; hovered and chosen rows are grey. A name is 14px medium ink on one line. An owner is a 24px avatar with the name, a tag is a square radius-4 chip, and ⋯ ends the row. The footer reads "1–25 of 560", then the page size and the pager.
- **Pills and badges:** every status is a round pill, ≈ 22px tall, in `body.small` medium, with a 12px glyph in front over its tone's 100 fill: a filled check for done, a dashed ring for nothing yet, a clock for pending, a diamond-! to fix, a square-✕ for overdue. Severity is a dot and a word. Tags (family, framework, code) are square, neutral and unbordered.
- **Tabs:** line tabs at 14px, the current one ink medium over a 2px ink underline, the others `text.subtle`, with a count as a neutral chip after the label. Quick views are a row of filled chips: neutral, and the current one `background.selected` with `text.brand`.
- **Side panel:** `Shell.Panel` at 440px over the register, white with `shadow.panel` and no blanket. The outer header keeps Back, the pager and ✕. The inner record header is 18px, KeyValue rows sit at 14px with subtle labels, and each section inside is a bordered radius-8 card with its header and its add action.
- **Modals:** radius 12, padded 24, a 20px title with ✕, and the footer at the right: Cancel (a bordered secondary), then the ink primary or the danger. The blanket drops to 28%.
- **Filters and toolbar:** the search comes first, bordered and 32px. Filters are borderless text triggers ("Control status ⌄") instead of dashed boxes. An applied filter takes `text.brand` and a count chip ("Control status 2"); then "+ Add filter" and "Reset" as subtle buttons, and Columns and Settings as bordered icon buttons at the far right.
- **Buttons:** the primary is an ink fill (`neutral.bold`) with white text. The secondary is white with a 1px ring (`shadow.raised`) and ink text; subtle is text alone, link is `text.brand`, and a split primary is ink with a hairline divider. Danger is for confirmations only.
- **Empty states:** a register or section that is empty shows a 16px glyph in a 56px circle (`surface.header`, 1px border) over a 20px title, one subtle line and the ink primary. Inside a card, an empty is one centred subtle line. The EmptyIllustration scenes stay for first run only.
- **Progress and meters:** `Progress` is 8px and round, with a green fill when it counts completion, on the 300 track. A cell can show a 16px ring with a 2px stroke beside its %, and a dashed ring when there is nothing yet. The multi-status Tally keeps its segments, but with round ends and segments that touch.
- **Charts:** a donut is a ring with a ≈ 12px stroke, a centre `figure.large` with its label, and a legend at the right with square swatches and counts aligned right. A tracker is an 8px stacked bar with round ends and an inline legend ("■ Not ready 4"). The heatmap uses the `chart.zone` tints, with solid cells that carry their counts. No gridlines.

### (c) Three signature moves

1. **Ink and white, with blue only where it means something.** Primaries, tab underlines, the current nav bar and record names go to ink, on white and a grey nav with no border. Blue stays in the brand tile, the focus ring, links in prose, applied filters and selection. That takes blue out of most of the places it shows today, and it is the single change that makes the app read like current Vanta.
2. **A pair of cards over every register.** A completion card (a 36px %, an 8px green bar, N of M) sits beside a Needs attention card (Overdue, Due soon, No owner, each a link), then comes the framed table. Every register opens the same way.
3. **Framed tables with pills that carry glyphs.** Each table has a grey header band in a radius-8 frame and 48px rows of 14px text, and every status is a round pill with its glyph. The dashed ring becomes Ledger's one mark for "nothing yet", in pills, cells, steps and empty states.

These touch the product pattern contract, which says a standalone register is a PageHeader and a frameless DataTable with nothing between them, and statuses go through the one map in `src/lib/status.ts`. Moves 2 and 3 amend its Registers section and the Badge treatment. That amendment is a decision for Josef before anything is built.

### (d) What not to copy

- Vanta's colours as ours: its violet (≈ #7B2FE0), its plum (≈ #2B0B45), the lavender tints and the AI gradient. Ledger keeps its blue for the accent and ink for action.
- Its wordmark, its llama and other illustrations, the icon-pattern hero of the Trust Center, its framework seals and its product names ("Vanta Agent"), and any of its copy word for word.
- Second lines of description in table cells, and 60px rows. Ledger keeps one line a cell and denser rows (numbers over prose).
- Input borders at ≈ 1.5:1. Ledger's contrast suite keeps its borders and text where they are.
- The uppercase, tracked headers and labels of the older screens. Ledger's are sentence case.

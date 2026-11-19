import json, sys
D = sys.argv[1]
S = D + "/shots/"
V = "/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/vanta/"
U = V + "images/ux/"
F = []
def f(id, screens, routes, kind, we, va, sev, fix, ours, vanta, judgment):
    F.append(dict(id=id, screens=screens, routes=routes, kind=kind, we_do=we, vanta_does=va, severity=sev, fix=fix, ours=ours, vanta=vanta, judgment=judgment))

f("A1", ["WS-X90 › Overview"], ["overview"], "drift: page shape",
  "Nine blocks on the program's front page: a title with two status pills, a prose description, a facts row, a completion card (31%, a six-colour bar with a six-item legend, three mini tiles), Open work, an assessments timeline of four lanes, an SSP card, a setup card, and a right rail of Team (7 roles), Details and Recent activity.",
  "Home opens with banners and one completion card per framework (a %, one green bar, N of M); a framework's page has one completion card with two mini tiles, then the list. Nothing else competes above the fold.",
  "high", "cut the Overview to one completion card (one green bar, N of M) and Open work above the fold; move Team and Details to a Details rail, and the SSP, setup and assessments cards to links",
  [S+"1440-overview.png", S+"i-overview-tall.png"], [U+"home/home-page--01.png", U+"frameworks/framework-details-page--02.png"], False)

f("A2", ["Controls", "Evidence", "Findings", "Risks", "POA&M", "Checks", "People", "Review queue", "Inventory", "Schedule", "Assessments › campaign"],
  ["controls", "evidence", "findings", "risks", "poam", "checks", "people", "review-queue", "inventory", "schedule", "campaign"], "drift: first sight",
  "Eleven registers open with two or three rows already ticked, so on first sight the selection bar (n selected · Deselect · verbs) stands where the filter row should be; the filters only appear after Deselect.",
  "The toolbar is a search and borderless filter triggers; it becomes 'n selected · Deselect · Assign owner' only while the reader has chosen rows.",
  "medium", "cut the pre-ticked rows so every register opens on its filter row",
  [S+"1440-controls.png", S+"1440-evidence.png", S+"1440-risks.png", S+"i-controls-deselected.png"], [U+"controls/controls-page--01.png", U+"risk/managing-risks-and-risk-registers--01.png"], False)

f("A3", ["Findings", "POA&M", "Risks", "Controls", "Requirements", "Checks", "Policies", "Suppliers", "Review queue", "Schedule"],
  ["findings", "poam", "risks", "controls", "requirements", "checks", "policies", "suppliers", "review-queue", "schedule"], "drift: repeated counts",
  "A facts line under the title (19 pages carry one, 16 of them with numbers) repeats counts that the tabs, cards and quick views say again: on Findings '44' appears six times above the table (facts, tab, two cards, the big figure, All 44); on POA&M 'Items 41' is in the facts, the tab and All 41; on Risks 'Open 40' is in the facts, Register 40 and All 40.",
  "A register's title stands alone or over one plain description line ('Manage risks for Privacy'); a count appears once, on the tab or the chip.",
  "medium", "cut the facts line under register titles; keep a count only on its tab or chip",
  [S+"1440-findings.png", S+"1440-poam.png", S+"1440-risks.png"], [U+"risk/managing-risks-and-risk-registers--01.png", U+"vendors/adding-and-managing-vendors--01.png", U+"frameworks/frameworks-page--01.png"], False)

f("A4", ["Home", "Evidence", "Policies", "People", "Products", "Components", "Data calls", "Baseline", "Inventory", "STIG checklists", "Evidence sources", "ITCSC", "Threats", "Posture", "Cyber resiliency", "Security engineering", "Inheritance", "Continuous monitoring", "Cyber T&E"],
  ["home", "evidence", "policies", "people", "products", "components", "data-calls", "baseline", "inventory", "stigs", "sources", "itcsc", "threats", "posture", "resiliency", "sse", "inheritance", "conmon", "cyber-te"], "drift: colour",
  "Banners are filled amber (warn) or red (bad) bars; Home stacks two, one amber and one red. They appear on about 20 pages and are the largest tinted areas on screen.",
  "A callout is a full-width light-grey box; the colour lives only in a small glyph (orange triangle, red square), with a bold line and one bordered button at the right.",
  "medium", "restyle banners as grey callouts with the tone carried by the glyph (one rule for the warn and bad banner fills)",
  [S+"1440-home.png", S+"1440-evidence.png", S+"1440-policies.png", S+"1440-people.png"], [U+"home/home-page--01.png", U+"workspaces/getting-started-with-workspaces--07.png", V+"style.md §1 Cards and summary cards (callout)"], False)

f("A5", ["Risks", "POA&M", "Checks", "Policies", "Requirements", "Evidence", "Assessments › campaign"],
  ["risks", "poam", "checks", "policies", "requirements", "evidence", "campaign"], "drift: table width and columns",
  "At 1440 seven of fourteen sampled tables are wider than their frame and lose their right edge (Requirements 120px, Checks 56, POA&M 54, Risks 45, Policies 42, Evidence 24, campaign 12): Owner reads 'No owne', Start reads 'St'. Several columns read the same in every row: Risks' Assessment 'Reassess by Dec 12', Acceptance 'Not requested' and Owner 'No owner' on all 25 rows; Evidence's Status 'No renewal set', Latest version 'Pending review' and Renew by 'Not set'; Policies' Acknowledged '0 of 23'; People's Last reminded 'Never'; the campaign's Team 'Ready'.",
  "Tables fit their frame with five to seven columns; an empty value is a dash or the dashed person glyph alone, not a pill or a word in every row.",
  "high", "cut or quiet the columns that read the same in every row and show nothing as a dash, so each table fits at 1440",
  [S+"1440-risks.png", S+"1440-poam.png", S+"1440-policies.png", S+"1440-checks.png", S+"1440-evidence.png"], [U+"risk/managing-risks-and-risk-registers--01.png", U+"frameworks/framework-details-page--01.png", U+"documents/documents-page--01.png"], False)

f("A6", ["WS-X90 › Controls › SI-2"], ["control-si2"], "drift: record page shape",
  "Between the facts row and the eight tabs sit two cards: Where it stands (0%, two mini tiles, five counts) and Next step (a callout with its own ink 'Open assessment campaign' button, then a red CVE callout). The page carries two ink primaries (Add evidence, Open assessment campaign).",
  "A record page (a test, a risk scenario) is breadcrumb, a large title, a meta or labelled-facts row, counted tabs, then the body with a Details rail at the right; nothing stands between the facts and the tabs, and the header has at most one primary.",
  "medium", "move Where it stands and Next step under the tabs (the first tab or a Details rail) and make Next step's button a secondary",
  [S+"1440-control-si2.png"], [U+"tests/automated-test-history--01.png", U+"risk/completing-risk-assessments--02.png"], False)

f("A7", ["Settings › Deadlines"], ["deadlines"], "drift: settings shape",
  "Settings opens on Deadlines, drawn as a register: a strip of seven settings pages above the title, a prose subtitle, two summary cards (Deadline status with Overdue 21…, Imports that set deadlines with a red failure callout), five counted tabs and a table with Example tags and 'Proposed' pills.",
  "Settings is one page behind the gear: a left list of sections (Company, My account), each section a title, line tabs, and bordered setting cards that hold a title, one line and a control. No summary cards and no registers.",
  "medium", "rebuild Settings as a left list of sections with plain setting cards; keep the deadline numbers on Findings",
  [S+"1440-deadlines.png"], [U+"settings/configure-idle-session-timeout--01.png", U+"settings/interface-settings--01.png"], False)

f("A8", ["Shell (every program page)"], ["overview", "controls"], "drift: colour in the chrome",
  "The rail marks the current place in blue (blue text on a light-blue tile) while the program menu marks it in ink on grey; the program switcher at the top of the menu is a blue-bordered box with blue text, so the strongest colour on a calm page is in the navigation.",
  "The newest nav marks the current item with a grey fill, ink text and an ink edge bar; the workspace switcher is a neutral bordered button in the top bar beside the wordmark.",
  "medium", "restyle the rail's current item like the menu's (ink on grey) and the switcher as a neutral bordered button",
  [S+"1440-controls.png", S+"1440-overview.png"], [U+"settings/interface-settings--01.png", U+"workspaces/getting-started-with-workspaces--07.png"], False)

f("A9", ["Shell: program menu"], ["overview"], "drift: navigation weight",
  "The program menu lists 25 destinations under 7 group labels, five of them open by default, with an icon on every child; it is 1,420px tall in an 844px frame, so Authorize, Monitor and People sit below the fold. Groups fold one by one; the menu itself has no control to fold away.",
  "One nav of about 12 domains; a group opens with a chevron, its children are indented text without icons, and sections can auto-collapse.",
  "medium", "restyle the program menu's children as text without icons and collapse every group but the current one",
  [S+"i-overview-tall.png", S+"1440-controls.png"], [U+"my-work/my-work-page--01.png", U+"settings/interface-settings--01.png"], False)

f("A10", ["Shell (every program page)"], ["overview"], "on purpose: two navs",
  "A 64px icon rail plus a 240px program menu: 304px of navigation before the content (chosen in v9, option 3).",
  "One 240px nav, collapsible to a 56px rail; the workspace switcher is in the top bar.",
  "low", "keep the two navs (Josef's choice) but win the width back through A5 and A9",
  [S+"1440-overview.png"], [U+"settings/interface-settings--01.png"], True)

f("A11", ["Review queue"], ["review-queue"], "drift: page shape",
  "Seven framed tables stacked on one page, one per kind (Evidence to accept 96, Discussions to resolve 40…), each with its own View all link; the first opens with two rows ticked. The page is 2,331px tall.",
  "No separate queue: approvals are My work's 'Needs my approval' filter, read as sentence rows ('Review 9 policies pending your approval') that open the register already filtered.",
  "medium", "merge the seven tables into one table with a Kind column and filter, or into sentence rows grouped by kind",
  [S+"1440-review-queue.png"], [U+"my-work/my-work-page--01.png"], False)

f("A12", ["My work"], ["my-work"], "bug: layout",
  "The second Urgent row, 'Resolve 16 more operational issues past their remediation date', is squeezed into a 20px column and wraps over eight lines at 1440, the first thing a collaborator sees.",
  "Every row is one line: icon, sentence, grey meta, avatars.",
  "high", "rebuild that row's layout so the sentence takes the row's width",
  [S+"1440-my-work.png"], [U+"my-work/my-work-page--01.png"], False)

f("A13", ["My work"], ["my-work"], "drift: row style",
  "Each row is its own bordered box, and rows add chips and colour: a Jira key with its status, severity, 'due Nov 9' and a red '8d late'.",
  "Rows sit in one list divided by hairlines; the meta after the sentence is plain grey text ('2 Draft · 2 Not started').",
  "low", "restyle the rows as one hairline list with grey meta; keep the Jira key as plain text",
  [S+"1440-my-work.png"], [U+"my-work/my-work-page--01.png"], False)

f("A14", ["Programs"], ["portfolio"], "drift: register detail",
  "A prose subtitle and a quick-view row sit over the table; rows group by business line (on purpose), and Next gate cells are two lines in red or amber with flag icons, beside '+2 controls' and '1 behind' pills.",
  "Frameworks: counted tabs, one filter row, one table; completion as two rings with a %; Audit ends is a plain date, and nothing is a dash.",
  "low", "cut the subtitle and restyle Next gate as one plain date with a glyph only when late",
  [S+"1440-portfolio.png"], [U+"frameworks/frameworks-page--01.png"], False)

f("A15", ["WS-X90 › Assessments › Expanded Control Set Assessment"], ["campaign"], "drift: mode navigation",
  "In assessment mode the navy band replaces the top bar (on purpose: Ledger's blue, not Vanta's plum), but the rail and the full program menu stay. The request tracker counts 368 requests while the table's All chip reads 14.",
  "The audit band replaces the top bar and the nav changes to the audit's own pages (Evidence, Controls, Framework, then the domains); the tracker and the counted tabs add up to the same total.",
  "medium", "move the campaign's pages (Requests, Findings, Controls) into the menu while in mode, and make the tracker and the chips count the same set",
  [S+"1440-campaign.png"], [U+"audits/how-will-your-auditor-use-vanta--01.png"], True)

f("A16", ["WS-X90 › Plans › SSP editor"], ["ssp"], "on purpose: document editor",
  "A full-window editor that leaves the shell: a header bar with presence avatars, Share, Editing and Submit for review; a formatting toolbar; a Contents outline with rings and counts; a canvas with a 'Live · synced · Open record · History · Detach' bar on every record table; a comments rail. About 110 pills on the page.",
  "The policy builder keeps the app shell (a collapsed rail) and works one section at a time: guidance ('What's required', related controls) on the left, the live document on the right, and a footer 'All changes saved · Section 5 of 17 · Back · Next'.",
  "low", "keep the editor; cut the per-table sync bars to one line in the section header and borrow the per-section guidance",
  [S+"1440-ssp.png"], [U+"policies/creating-policies-with-policy-builder--02.png", U+"policies/commenting-in-the-policy-editor--03.png"], True)

f("A17", ["Create program"], ["program-new"], "on purpose: wizard length",
  "A six-step full-window wizard: a stepper at the left, option cards, a product list, and a third column 'What you're creating' summary; the footer reads Cancel · Next: Program · Continue.",
  "Creation flows are three-step modals ('Add a new audit': Step 1 of 3, Back, Next) whose last step reviews what will be made.",
  "low", "keep six steps but cut the summary column; let the Review step carry it",
  [S+"1440-program-new.png"], [V+"help-center/notes/grc-core.md §2.19 Add a new audit (3-step modal)", U+"audits/creating-an-audit--02.png"], True)

f("A18", ["Controls › control preview", "Risks › risk preview", "Findings › operational issue preview"], ["controls", "risks", "findings"], "drift: panel content",
  "The 440px panel matches Vanta's shape, but puts an ink primary under the title, and the control preview's cards summarise counts (objectives mapped, with evidence, assessed) instead of listing the linked requirements, evidence, findings and risks each with an add. The risk preview offers Start reassessment twice.",
  "The control panel: ⋯ and ✕, title, label/value rows, two tabs, then one bordered sub-card per linked kind (Tests, Documents, Frameworks, Risk scenarios), each with '+' and an empty line.",
  "low", "restyle the panel's action as a secondary and make the control preview's sections the linked records, each with its add",
  [S+"i-controls-panel.png", S+"i-risks-panel.png", S+"i-findings-panel.png"], [U+"frameworks/bringing-your-current-compliance-program-into-vanta--16.png"], False)

f("A19", ["Shell: ⌘K"], ["controls"], "no equivalent",
  "The launcher finds pages, records and commands; a question ('which controls lack evidence?') returns No results.",
  "The newest top bar's search is a question field (✦ 'What is the purpose of these evidence requests?', ⌘K) answered by the agent.",
  "low", "add question answering to the launcher, or say in it where AI agents answer questions",
  [S+"i-cmdk.png"], [U+"settings/interface-settings--01.png", U+"workspaces/getting-started-with-workspaces--07.png"], False)

f("A20", ["Library › Frameworks & overlays", "Library › Integrations", "Products › Suppliers", "Settings"], ["frameworks", "integrations", "suppliers", "deadlines"], "on purpose: area tabs",
  "Library, Products and Settings put their pages in a tab strip above the title (Library · Frameworks & overlays · Integrations · Data calls · Reports & exports), so Suppliers stacks area tabs, page tabs, chips and filters: four rows before its table.",
  "Areas are nav children (Compliance › Frameworks, Controls, Policies, Documents, Audits); a page has at most its own tabs and chips.",
  "low", "keep the strip (the rail has no room for children) but drop the page's own tabs where the strip already splits it",
  [S+"1440-suppliers.png", S+"1440-frameworks.png", S+"1440-integrations.png"], [U+"vendors/adding-and-managing-vendors--01.png", U+"documents/documents-page--01.png"], True)

f("A21", ["Library › Integrations"], ["integrations"], "drift: card detail",
  "Every connector card carries the same green uppercase 'IN THE APP' tag and a two-letter monogram tile.",
  "Connector cards lead with the product's logo and end in View details and Connect; a tag appears only where it tells cards apart.",
  "low", "cut the repeated IN THE APP tag (the Available tab already says it)",
  [S+"1440-integrations.png"], [V+"style.md §1 Iconography (logos lead rows and cards)"], True)

f("A22", ["Risks › risk preview", "Findings › operational issue preview", "Controls › control preview (AC-1)", "POA&M › item preview"],
  ["risks", "findings", "controls", "poam"], "bug: dead control",
  "The preview's ↗ 'Open the full record' button does nothing on Risks, Findings, Controls (AC-1) and POA&M: the address and the panel stay as they were. Only Evidence opens a page (evidence-page-e1); only SI-2 has a control page.",
  "Records with their own work open as pages with counted tabs and a Details rail (a test, a risk scenario, a policy, a vendor); the panel's controls are ⋯ and ✕ and each one acts.",
  "high", "rebuild ↗ to open the record's page, or cut it where no page exists",
  [S+"i-risks-expanded.png", S+"i-findings-panel.png"], [U+"risk/completing-risk-assessments--02.png", U+"frameworks/bringing-your-current-compliance-program-into-vanta--16.png"], False)

families = [
 {"family": "Home", "routes": ["home"], "score": 4.5, "line": "Vanta's Home part for part: title and View my work, banners, a card per program with %, bar and N of M.",
  "differences": [["Banners filled amber and red; Vanta's are grey with a coloured glyph", "drift"], ["Other programs list under the cards (five programs at 0%)", "on purpose"], ["No View all link and no Monitoring block", "drift"]]},
 {"family": "My work", "routes": ["my-work"], "score": 4, "line": "Same filter chips, Type menu and urgency groups as Vanta's My work.",
  "differences": [["A row squeezed into a 20px column, wrapping over eight lines", "drift"], ["Rows are separate boxes with chips and red 'late' text, not one hairline list", "drift"], ["Jira keys on rows", "on purpose"]]},
 {"family": "Review queue", "routes": ["review-queue"], "score": 3, "line": "Seven stacked tables, one per kind; Vanta keeps approvals as a My work filter.",
  "differences": [["A workspace-wide reviewer queue (SCA, AO, ISSM roles)", "on purpose"], ["Seven tables on one 2,331px page", "drift"], ["Rows pre-ticked on first sight", "drift"]]},
 {"family": "Programs (index)", "routes": ["portfolio"], "score": 3.5, "line": "Vanta's Frameworks register plus group rows, a subtitle, chips and coloured dates.",
  "differences": [["Rows grouped by business line", "on purpose"], ["Two-line red and amber Next gate cells, extra pills", "drift"], ["Prose subtitle and quick-view row", "drift"]]},
 {"family": "WS-X90 Overview", "routes": ["overview"], "score": 2.5, "line": "A dashboard of nine blocks where Vanta shows one completion card and a list.",
  "differences": [["Nine blocks, three of them in a right rail", "drift"], ["Completion as a six-colour bar with a six-item legend and three minis", "drift"], ["ATO status, RMF roles, assessments and SSP state", "on purpose"]]},
 {"family": "Registers (Controls, Evidence, Findings, Risks, POA&M, Checks, Policies, Suppliers, People, Integrations, Frameworks)", "routes": ["controls", "evidence", "findings", "risks", "poam", "checks", "policies", "suppliers", "people", "integrations", "frameworks"], "score": 4,
  "line": "One Vanta register shape everywhere; Checks, Controls, Suppliers and Frameworks are near copies (4.5), Risks and POA&M the furthest (3.5).",
  "per_register": {"controls": 4.5, "checks": 4.5, "suppliers": 4.5, "frameworks": 4.5, "evidence": 4, "findings": 4, "policies": 4, "people": 4, "integrations": 4, "risks": 3.5, "poam": 3.5},
  "differences": [["A facts line repeating counts under every title", "drift"], ["Rows pre-ticked, so the selection bar hides the filters", "drift"], ["Tables clipped at 1440 by same-in-every-row pill columns", "drift"]]},
 {"family": "Record page (SI-2; risks and findings open as panels)", "routes": ["control-si2"], "score": 3, "line": "Header and facts as Vanta's, then two cards before eight tabs; risks and findings have no page, and the preview's ↗ does nothing.",
  "differences": [["Two cards between the facts and the tabs", "drift"], ["Two ink primaries on one page", "drift"], ["Eight tabs (Checks, Assessment, STIG rules)", "on purpose"]]},
 {"family": "Side panel", "routes": ["controls", "risks", "findings"], "score": 4.5, "line": "Vanta's panel: 440px, no scrim, title, label/value rows, tabs, bordered sub-cards.",
  "differences": [["An ink primary under the title", "drift"], ["Control preview summarises counts instead of listing linked records with '+'", "drift"], ["Start reassessment offered twice in the risk preview", "drift"]]},
 {"family": "SSP editor", "routes": ["ssp"], "score": 2.5, "line": "A full-window document editor; Vanta's nearest, the policy builder, keeps the shell and goes section by section.",
  "differences": [["Leaves the shell for deep work on a long SSP", "on purpose"], ["Whole document with live record tables, not guided sections", "on purpose"], ["Two toolbars, a sync bar on every table, about 110 pills", "drift"]]},
 {"family": "Create program", "routes": ["program-new"], "score": 3, "line": "A six-step full-window wizard where Vanta uses three-step modals.",
  "differences": [["Six steps from a product, an ITCSC or an SSP import", "on purpose"], ["A third column summary beside the form", "drift"], ["Option cards with icons and prose (close to Vanta's setup cards)", "on purpose"]]},
 {"family": "Assessment mode (campaign)", "routes": ["campaign"], "score": 4, "line": "Vanta's audit view: a dark band, a request tracker, auditor statuses on the requests.",
  "differences": [["Navy band, not plum", "on purpose"], ["The full program menu stays; Vanta swaps the nav to the audit's pages", "drift"], ["Three status columns per request; the tracker (368) and All (14) disagree", "on purpose"]]},
 {"family": "Settings", "routes": ["deadlines"], "score": 2, "line": "Register-shaped pages with a card pair under a seven-tab strip; Vanta's settings are a left section list with setting cards.",
  "differences": [["Summary cards and a register on a settings page", "drift"], ["A horizontal strip of seven sections, not a left list", "drift"], ["Event log and roles under Settings", "on purpose"]]},
 {"family": "Shell (rail, program menu, top bar, ⌘K)", "routes": ["home", "overview", "controls"], "score": 3.5, "line": "Vanta's newest top bar (centred 480px search, ⌘K); two navs where Vanta has one.",
  "differences": [["Icon rail plus a 240px program menu (304px)", "on purpose"], ["Blue current item in the rail and a blue-bordered switcher in the menu, not the top bar", "drift"], ["25 menu items in 7 groups (5 open), an icon on every child, past the fold", "drift"]]},
]

extras = {
 "families": families,
 "overall_score": 3.4,
 "vanta_page_shape": "README 'One page shape everywhere': header (title, one primary, More) → one or two summary cards → a category rail with counts → one filter row → the table → a selection bar while rows are chosen. Records open as a side panel; records with their own work get a page: breadcrumb, large title, a meta or facts row, counted tabs, body with a Details rail.",
 "stat_cards_check": {
   "answer": "No longer on every register. Summary cards sit on 3 registers, the same three where Vanta has them (Controls ~ Vanta Controls, Checks ~ Tests, Findings ~ Vulnerabilities), plus Settings › Deadlines, the control record, the Overview, Assessments (campaign cards, as Vanta's Audits page) and Package room. Evidence, Risks, POA&M, Policies, Suppliers, People, Programs, Requirements, Integrations and the Review queue have none.",
   "with_cards": ["controls", "checks", "findings", "deadlines", "control-si2", "overview", "assessments", "package-room", "schedule (two gate cards)"],
   "what_took_their_place": "a facts line under the title (most registers), a quick-view chip row (22 pages), an amber or red banner (about 20 pages) and a pre-ticked selection bar (11 registers)"
 },
 "same_pattern_check": {
   "answer": "Partly still true, but now in the right place: the registers share Vanta's register shape, as Vanta's do. The pattern is still applied where it does not belong: Settings › Deadlines and the Review queue are drawn as registers, and the Overview and the control record stack cards before their content. The parts repeated everywhere are now the facts line, the chip row, the banner and the pre-ticked selection, not the stat cards.",
   "evidence": "survey.json (DOM survey of all 53 nav routes at 1440)"
 },
 "cheapest_wins": [
   {"rank": 1, "change": "Open every register unselected (11 registers)", "work": "one line of data per screen", "closes": "first sight becomes Vanta's title → chips → filters → table", "finding": "A2"},
   {"rank": 2, "change": "Cut the facts line under register titles", "work": "delete one line per screen (about 15)", "closes": "one tier fewer above every table; a count said once", "finding": "A3"},
   {"rank": 3, "change": "Restyle banners grey with the glyph carrying the tone, and the rail's current item and the program switcher in ink and neutral", "work": "three CSS rules", "closes": "removes the largest tinted areas and the blue chrome on about 20 pages and every program page", "finding": "A4, A8"},
   {"rank": 4, "change": "Cut or quiet columns that read the same in every row; a dash for nothing", "work": "column lists on 7 registers", "closes": "tables fit at 1440 (7 of 14 clipped today); fewer pills per row", "finding": "A5"},
   {"rank": 5, "change": "Cut the Overview to one completion card with one green bar plus Open work; the rest to a Details rail or links", "work": "one screen", "closes": "the furthest high-traffic page (2.5) moves toward Vanta's Home and framework page", "finding": "A1"}
 ],
 "next_after_the_five": ["A6 control record: nothing between facts and tabs", "A7 Settings as a section list", "A9 program menu children as text, groups collapsed", "A11 one Review queue table"],
 "vanta_has_we_lack": [
   "A question answered in the top-bar search (newest Vanta); our ⌘K returns No results to a question (A19)",
   "The workspace switcher in the top bar; ours is inside the program menu (A8)",
   "Audit mode swaps the nav to the audit's own pages; ours keeps the program menu (A15)",
   "Per-section guidance beside the document editor ('What's required', related controls) (A16)",
   "Folding the nav to a rail with one control (Vanta's |← at the nav's foot); our program menu has group toggles but no control to fold it away",
   "Employee-facing items (My security tasks, My access requests, vendor intake form, training, background checks, computers): no equivalent, out of RMF's core (README 'Policies, Computers, Access reviews, Personnel … Leave out, or later')"
 ],
 "not_checked": [
   "Phone widths (Vanta's set shows none)",
   "Dark mode",
   "Every program page beyond the 10 registers sampled; survey.json lists counts for all 53",
   "Clicks through the flows (section B covers them); this section judged first sight and the panels"
 ],
 "budget": {"our_screenshots": 34, "vanta_images": 23}
}
out = {"findings": F}; out.update(extras)
json.dump(out, open(D + "/findings.json", "w"), indent=1, ensure_ascii=False)
print(len(F), "findings")

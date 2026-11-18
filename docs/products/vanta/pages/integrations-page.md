# Integrations page

Source: https://help.vanta.com/en/articles/11345761-integrations-page
Fetched: 2026-11-17

## Purpose

- One place to see the tools connected to Vanta, fix the ones failing to fetch data, and add new ones from a directory.
- Connected tools automate evidence collection and continuous monitoring; an integration "Automates 2 tests and 25 controls" (detail panel).

## Layout

- Page header: title "Integrations"; sentence "Manage your integrations and connect tools to automate evidence collection and continuous monitoring. Vanta scans your tools from a known IP address you can add to your allowlist."; primary Add integration at the end.
- Tabs (line) with counts: Connected (32), Errors (8).
- Alert band: red x, "Some integrations need immediate attention", "8 integrations are not properly fetching data.", View errors.
- Toolbar: Search connected integrations; Capability, Category, Creator, Status, Type; Apply user scope (gear).
- Connected list, one card per integration: logo, name, a green "Connected" badge, capability chips (Access, Task creation, Task tracking, Vendor procurement, Inventory, Vulnerabilities); at the end Configure scope and Manage.
- Add integrations (directory) page: "← Back to integrations"; title "Add integrations"; "Request integration" (external link) at the end; search "Search by keyword, category, or capability".
  - "Featured integrations": four cards with an icon, title and one sentence: Start-up essentials, Enterprise ready, Most popular, Just added.
  - Category rows with a count and "See all": Recommended for you 6, Manage and review system access 315, Integrations built by your team 2.
  - Integration card: logo, name, "By Vanta" / "By Partner", one-line description (cut), capability list with a bolt icon ("Access • Document upload • Vulnerabilities"), bookmark icon.
- Integration detail panel (opens at the right over the directory): logo, name, "Built by Vanta", capability chip (Access), Connect, Close; sections Overview, Automation ("Automates 2 tests and 25 controls", a link), Categories, Permissions ("Vanta makes read-only API requests to the 1Password SCIM API."), Resources ("1Password Account").
- Left nav in this build: My program, My work, Roadmap, Vanta Agent, Tests, Reports; Compliance; Customer trust (Overview, Accounts, Trust Center, Questionnaires, Commitments, Knowledge base, Activity); Risk; Vendors; Privacy; Assets; Personnel; Integrations; My security tasks; My access requests.

## How you get here / where it leads

- → Integrations in the left nav.
- → Add integration → Add integrations directory → a card → detail panel → Connect → setup prompts (per-integration help article).
- → View errors / Errors tab → integrations not fetching data.
- → Manage (edit an integration); Configure scope (mark resources in or out of scope).
- → detail panel "2 tests and 25 controls" → the tests and controls it automates (inferred).
- → Integrations help collection (12575285).
- → Vendors: connected integrations are added to the vendor list (from the Vendors article).

## Actions

- Add integration; Connect; Request integration; See all; bookmark an integration.
- View errors; Manage; Configure scope; Apply user scope.
- Search; filter by Capability, Category, Creator, Status, Type.

## States and numbers

- Connected (32); Errors (8): "8 integrations are not properly fetching data."
- Status badge: Connected.
- Category counts: Recommended for you 6, Manage and review system access 315, Integrations built by your team 2.
- Automation per integration: "2 tests and 25 controls" (1Password).
- Card shows whether already connected, and a FedRAMP badge where applicable (article).

## Vocabulary

- Integration, connected, errors, integration directory, curated collections, capability, category, creator, type.
- Scope, Configure scope, Apply user scope, resources.
- Automation, tests, controls, permissions (read-only API), By Vanta / By Partner, built by your team.

## Screenshots

- `integrations-page-01.png`: Integrations header, Connected (32) / Errors (8), attention alert, filters.
- `integrations-page-02.png`: Add integrations directory with featured collections and category rows, full left nav.
- `integrations-page-03.png`: Featured integrations cards alone.
- `integrations-page-04.png`: 1Password detail panel over the directory: Connect, "Automates 2 tests and 25 controls".
- `integrations-page-05.png`: Connected list cards with capability chips, Configure scope and Manage.

## For Program Assurance

- An error count in the tab and a one-line alert with View errors put broken evidence feeds ahead of the list; fits evidence sources and imported scans.
- "Automates N tests and M controls" on a source's panel is the chain told in one line: which controls a feed supports.
- Scope per source (Configure scope) maps to which systems or boundary an evidence source covers.

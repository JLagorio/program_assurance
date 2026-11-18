# Computers page

Source: https://help.vanta.com/en/articles/11345380-computers-page
Fetched: 2026-11-17

## Purpose

- Overview of the company's computers monitored by the Vanta Device Monitor or a supported MDM, with one pass/fail mark per security setting.

## Layout

- Left nav (this screenshot): Home, Tests, Reports; Compliance, Customer Trust, Risk, Vendors, Assets (collapsed groups); Personnel open with People, Computers, Access, Settings; Integrations at the foot.
- Page header: title "Computers" and one sentence: "Use a MDM to track all computers within your organization and ensure that security-relevant settings are configured promptly."
- Tabs (line): Monitored, Unmonitored.
- Monitored toolbar: Search; Monitored by, Status, Operating System, Owner, Frameworks (dropdowns); checkbox "Show only outdated agents"; at the end Send bulk reminder and Export.
- Monitored table: checkbox, DEVICE (name, serial number under it), OWNER (sortable, arrow shown; name link and email under it, or "—"), OS VERSION (OS logo + version), MONITORING (source logo + name; a device with two sources shows two stacked sub-rows), PW, HD, AV, SL (icon headers, one mark per cell), LAST CHECK (relative: "2 years", "11 months", "a day ago"), FRAMEWORK SCOPE (info icon; chip "All frameworks"), row "⋯".
- Unmonitored toolbar: Search; View setup instructions, Send bulk reminder, Export (disabled while loading).
- Unmonitored table: OWNER, COMPUTERS, OS VERSION, STATUS, HOW TO FIX (shown here as skeleton rows while loading).
- Older layout (export screenshot): Search, "Filter by" Status, Send reminder, Export; table starts at OWNER.

## How you get here / where it leads

- → Personnel > Computers in the left nav (article: "Computers from the left-hand navigation panel").
- → a user name → the person's page: onboarding status, access, offboarding status, computer information.
- → person page > Computers tab > Monitored By dropdown → Reassign Owner / Remove Computer.
- → Export → .csv download.
- → Unmonitored tab → View setup instructions; the MDM install script ("Use your MDM system to install the Vanta Device Monitor").

## Actions

- Search, filter, Show only outdated agents.
- Send bulk reminder (older: Send reminder).
- Export.
- Owner cell: hover the dash → pencil → Assign dropdown → pick a user.
- Reassign Owner; Remove Computer.
- View setup instructions.

## States and numbers

- Each security cell: green check (met), black x (not met), grey clock (pending, inferred), "—" (not reported).
- Columns: PW password manager, HD hard drive encrypted, AV anti-virus installed, SL screen lock enabled.
- LAST CHECK values seen: 2 years, 11 months, 4 years, 1 year, 3 months, 1 month, a day ago, 7 months ago.
- Monitoring sources seen: Addigy, Microsoft Endpoint, Jamf, JumpCloud, NinjaOne, Rippling, Vanta Agent.
- Loading: skeleton bars in every column of the Unmonitored table.

## Vocabulary

- Computer, device, asset, owner, Monitored, Unmonitored.
- Vanta Device Monitor (agent), MDM, Monitored by, outdated agents.
- Last Check, Framework scope, reminder, setup instructions, How to fix.

## Screenshots

- `computers-page-01.png`: Monitored tab, filters and PW/HD/AV/SL marks per device; Personnel > Computers highlighted.
- `computers-page-02.png`: Close crop of rows with serials under device names and owner names as links.
- `computers-page-03.png`: Pencil appearing beside the "—" in the Owner column.
- `computers-page-04.png`: Owner cell turned into an "Assign" dropdown.
- `computers-page-05.png`: Older Computers layout with Export highlighted.
- `computers-page-06.png`: Unmonitored tab with View setup instructions, loading skeleton rows.

## For Program Assurance

- A grid of narrow pass/fail columns per setting (icon header, one mark per cell) reads faster than a status sentence; fits per-objective or per-system coverage marks.
- Owner assigned in place from the dash (hover → pencil → Assign) is the low-friction way to fill a missing owner.
- A second tab for what is not yet covered, with "How to fix" as a column, turns gaps into a work list.

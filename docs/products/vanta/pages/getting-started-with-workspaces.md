# Getting started with workspaces

Source: https://help.vanta.com/en/articles/11345360-getting-started-with-workspaces
Fetched: 2026-11-17

**Purpose**: run several Vanta instances (business units, subsidiaries, separate compliance environments) under one account, each with its own integrations, policies, users and frameworks, and switch between them without logging out.

## The steps

1. Request: contact the Customer Success Manager; Vanta turns Workspaces on. The requester becomes the first admin and is added to the **Workspace Console**.
2. Log out and back in with the magic link; a **workspace selector** appears top left.
3. Switch: hover the current instance in the selector → pick a workspace (Company → Workspace submenu, then "Workspace console" at the end).
4. Per workspace, **Settings → Information**: company details → **Update information**.
5. Per workspace, provision separately: connect integrations, write or assign policies, create user groups.
6. Workspace Console → **Home**: Program health table and Framework progress charts across workspaces.
7. Per workspace, **Integrations** → Identity Provider → connect and authorize; users sync in. Then **Users** page → open a user's drawer → assign a role and workspace access. Each workspace connects its IdP (and SCIM) on its own.
8. Workspace Console → **Users** → **Add user**: first name, last name, email, workspaces, a role per workspace, default workspace → Save.
9. Users page → select two profiles of the same person in different domains → **Link users** (or **Review** the banner's suggested link).
10. Change a role: the Role dropdown in the row, or in the user drawer.
11. User drawer → **Default Workspace** dropdown sets where the user lands at login.
12. User drawer → tick a workspace the user lacks → "Grant Workspace access?" confirmation → **Grant access**. An IdP-provisioned user must be removed in that workspace, not from the Console.

## Layout

getting-started-with-workspaces-01 (selector menu): button "Tiger Labs App" with chevron; menu heading "Company"; items secvanta.com, Tiger Labs App (chevron to its workspaces), Vanta, VelocirAPPtor.

getting-started-with-workspaces-02 (GIF, Home → Settings → Information):
- Top bar: Vanta mark, workspace selector "Tiger Labs App", icons help, announcements, settings gear, avatar "JH".
- Left nav: "Help... ⌘K" search; Home; Starter guide "56%"; Tests; Reports; Compliance >; Customer Trust >; Risk >; Vendors >; Assets >; Personnel >; Integrations; collapse control at bottom.
- Home: title "Home", "View tasks" button; two warning banners ("connection error with one or more of your integrations … Integrations page", "trouble getting information for some of your resources … Inventory page"), each "View details".
- Home "Compliance progress" ("Last updated 4 minutes ago"): cards SOC 2 73% "116 controls complete / 159 total", ISO 27001:2022 17% "22 / 128", HIPAA 14% "10 / 73"; link "View all frameworks"; next section "Monitoring".
- Settings sub-nav: COMPANY (Notifications, User permissions, Roles, Teams, Information, Login and security, Billing ↗, Frameworks, Language, Developer console, Tags, Advanced); MY ACCOUNT (Notifications, GraphQL API tokens, Language, Interface).
- Information form: "Provide general information about your business and its physical location to inform policies and satisfy compliance requirements." Fields Display name, Legal name, "Incorporated in the United States" checkbox, URL, Mailing address, Telephone, Company information URL, Company logo; primary "Update information".

getting-started-with-workspaces-03 (GIF, switching to the Console): selector open — Company list (Tiger Labs App >, Vanta) and Workspace list (Amalgamated Widgets, Tiger Labs App, VelocirAPPtor, Vendor Guard, then "Workspace console"); "Redirecting you..." spinner; Console Home with only Home and Users in the nav, "Program health" and "Framework progress".

getting-started-with-workspaces-04 (GIF, Console Home):
- "Program health" card "Control and evidence status" with filter icon; columns WORKSPACE, CONTROLS, TESTS, DOCUMENTS. Rows: Amalgamated Widgets 47% (+0% since last week), tests 37% "107 of 291", documents 99% "2381 of 2397"; Tiger Labs App 64% (+2%), 45% "199 of 447", 99% "3009 of 3051"; VelocirAPPtor 46% (+1%), 47% "98 of 209", 99% "172 of 173"; Vendor Guard 0%, 28% "13 of 47", 0% "0 of 1".
- Hover card on a controls cell, "Tiger Labs App controls +2% since last week", "In the last week": Controls moved to "OK" 99; Controls moved to "Not passing" 259; Controls added 25; Controls removed 261; button "View full breakdown".
- "Framework progress": one line chart per framework (SOC 2, ISO 27001:2022, HIPAA, GDPR, ISO/IEC 42001:2023, HITRUST), y "Percent complete" 0–100%, x dates Mar 24 – Apr 14, one line per workspace, legend, filter icon per card.

getting-started-with-workspaces-05 (GIF, IdP sync): Home → Integrations. Integrations page: title + info, "Review your integrations and enable new connections to activate automated evidence collection and monitoring…", link "Missing an integration? Let us know!"; tabs Available (345), Connected (28), Errors (1); toolbar Search available integrations, Category, Creator, Status, Clear; "Recommended for you" with bookmarked systems; cards (logo, name, bookmark, capability chips such as Access, Groups, People, Single sign-on, Vendor discovery; buttons View details + Connect, or Manage when connected); Category menu checks "Identity providers" → Entra (Office 365), JumpCloud, Okta (Manage), OneLogin, PingOne ("Coming soon": Learn more, Notify me), and a "Missing an integration? Request an integration" card.

getting-started-with-workspaces-06 (GIF, Add user modal on Console Users):
- Behind: Users page with "View linking suggestions" and "+ Add user"; table NAME, WORKSPACE, EMAIL, ROLE (dropdown per row), row menu.
- Modal "Add user", "Add users who are not already in Vanta through an identity provider integration."
- "Essential information": First name, Last name, Email.
- "Access": one card per workspace (Amalgamated Widgets, Tiger Labs App, VelocirAPPtor, Vendor Guard, Workspace console) with checkbox; ticking one reveals "Role" dropdown (Employee, Admin).
- "Default Workspace — Choose the default Workspace after login." dropdown.
- Footer: Cancel, Save (enabled once valid).

getting-started-with-workspaces-07 (Users page, linking):
- Top bar: "Select" selector; AI search "Show me employees with missing background checks. ⌘K"; "STABLE" dropdown; icons incl. a bell.
- Nav: Home, Users. Title "Users", "+ Add user"; description "This page shows people internal to your organization who have access to Vanta and lets you manage their access to Workspaces."
- Warning banner: "1 account should be linked — Link accounts so that users can navigate between Workspaces." with Dismiss and Review.
- Selection bar: Search people, "2 selected", Deselect, "Link users".
- Table: checkbox, NAME, WORKSPACE (domain or "Workspace console"), EMAIL, ROLE (Admin dropdown), row menu; a person spans several workspace rows; pager Previous / Next.

getting-started-with-workspaces-08 (GIF, role change): Users toolbar Search people, Workspace, Role filters; Role dropdown open: Admin (checked), Editor, Employee, View-only Admin, Trust Collaborator, Trust Admin, Policy Contributor, QA Test - Bry, Vendor Write, Manager, … ; a row then reads Employee.

getting-started-with-workspaces-09 (GIF, default workspace): user drawer "A.J. Forkner": "Default Workspace" (info) dropdown "Tiger Labs App" with options, "Expand All"; one card per workspace with checkbox, "Default" badge on one; expanded card shows the email, Login and Sources provider icons.

getting-started-with-workspaces-10 (GIF, grant access): drawer "Accounts Payable"; ticking VelocirAPPtor opens "Grant Workspace access?" — "Granting access to this Workspace will create an account for Accounts Payable using accounting@tigerlabs.app that allows for viewing, editing, or admin permissions, depending on the role you assign." Cancel / Grant access.

## Flow edges

- any page → workspace selector → another workspace (or Workspace console, via "Redirecting you...")
- Home → Settings → Information → Update information
- Home → Integrations → Identity providers → Connect → Users
- Workspace console Home ↔ Users
- Users → Add user modal → Save → Users
- Users → banner Review / Link users → Users
- Users → user drawer → Default Workspace / Grant Workspace access? → Users
- Console Home controls cell → hover card → View full breakdown

## Actions

Request access (CSM) · switch workspace · Update information · Connect integrations · Write or assign policies · Create user groups · Connect / Manage (integration) · Add user · Save · Link users · Review · Dismiss · Deselect · change Role · Default Workspace · Grant access · Expand All · View full breakdown · View linking suggestions · Request an integration · Notify me

## Vocabulary

Workspaces · workspace selector / workspace switcher / Workspace picker · Workspace Console · Workspaces Dashboard · Program health · Control and evidence status · Framework progress · Company · Information · Identity Provider (IdP) · SCIM · Users page · user drawer · role · default workspace · linking user accounts · domain · Starter guide · Compliance progress · controls complete · Monitoring

## Screenshots

- getting-started-with-workspaces-01.png: workspace selector menu listing companies/workspaces.
- getting-started-with-workspaces-02.gif: Home with framework progress cards, then Settings → Information form.
- getting-started-with-workspaces-03.gif: selector to Workspace console; console Home loading.
- getting-started-with-workspaces-04.gif: Console Home, per-workspace controls/tests/documents with weekly deltas and framework trend charts.
- getting-started-with-workspaces-05.gif: Integrations page filtered to Identity providers, Connect/Manage cards.
- getting-started-with-workspaces-06.gif: Add user modal with per-workspace access, role and default workspace.
- getting-started-with-workspaces-07.png: Users page, link suggestion banner, two profiles selected, Link users.
- getting-started-with-workspaces-08.gif: changing a user's role from the row dropdown (roles list).
- getting-started-with-workspaces-09.gif: user drawer, Default Workspace dropdown, per-workspace cards.
- getting-started-with-workspaces-10.gif: user drawer, Grant Workspace access? confirmation.

## For Program Assurance

- A portfolio view is one table: a row per program, Controls / Tests / Documents as "% (N of M)" with "+N% since last week", and a hover card of what moved (moved to OK, moved to not passing, added, removed).
- Framework progress over time is a line chart per baseline with a line per program; the Home cards are "% · N controls complete · M total".
- Access is per program with a role per program and a default landing program; one person's several accounts are linked rather than duplicated (inferred: applies to multi-tenant RMF orgs).

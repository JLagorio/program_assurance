# Individual personnel onboarding page

Source: https://help.vanta.com/en/articles/11345598-individual-personnel-onboarding-page
Fetched: 2026-11-17

## Purpose

- How a person is onboarded: tasks assigned to their group trigger an email; they log in to complete only their tasks; the People page shows their Task status.
- Kept as the People register's page tour (the screenshots show the People table the other personnel article only describes).

## Layout

- Reminder email: subject "Reminder: Complete your security tasks by February 12th, 2025 for Trust Labs LLC"; body names the company and the deadline; "Security tasks" list (Accept policies, Install Vanta agent, Complete 1 security training); button "Click here to complete your tasks".
- People page:
  - Left nav: Home, Starter guide (10%), Tests, Reports; Compliance, Trust Center, Risk, Vendor, Assets; Personnel open with People (selected), Computers, Access; Integrations.
  - Header: title "People"; line "Monitor and manage tasks for your personnel. Learn more".
  - Tabs (line): People, Groups, Background checks.
  - Warning band: "You don't have personnel reminders scheduled — Sending reminders to employees ensures they complete their security tasks and that you're compliant." with Schedule reminders.
  - Toolbar: Search; Status, Task status, Group, Audit window; primary "Import from identity provider"; "⋯"; table settings.
  - Table: checkbox, Name (avatar, name, email under it), Employment status (Current), Start date, End date ("—"), Task status (amber "Tasks due so…"), Source (Vanta), Last… (cut), row "⋯".
- Row "⋯" menu: Send reminder, Edit details, Set as service account, Set leave, Edit groups.
- Settings > Company > Notifications: left menu (COMPANY: Notifications, User permissions, Roles, Information, Login and security, Billing, Frameworks, Language, Developer console, Tags, Advanced; MY ACCOUNT: Notifications, GraphQL API tokens, Language, Interface); card "Schedule — Configure when Test, Document, and Control owners should be notified about failures." with Allow notifications: Anytime / Every day between 9am and 6pm in [GMT-5 America/New York]; card "Personnel reminders — Send personnel a digest of their incomplete security tasks." with a toggle (off), Frequency Every Monday / Every weekday, channel Email; "External notifications" below.

## How you get here / where it leads

- → Personnel > People.
- → task assigned to a personnel group (article 11345836) → email → person logs in → their tasks only.
- → task completed → Task status on the People page updates.
- → row "⋯" > Send reminder (resend the email).
- → Schedule reminders / Settings (gear) > Notifications.
- → Adding and managing personnel (article 11345379).

## Actions

- Import from identity provider; Schedule reminders.
- Row: Send reminder, Edit details, Set as service account, Set leave, Edit groups.
- Settings: Allow notifications window; Personnel reminders toggle, frequency and channel.

## States and numbers

- Task status seen: "Tasks due soon" (amber, cut to "Tasks due so…").
- Employment status: Current.
- Start dates Apr 15–Jun 10, 2024; End date "—".
- Starter guide progress 10%.
- Email lists 3 task kinds; deadline February 12th, 2025.

## Vocabulary

- Personnel, personnel group, security tasks, Task status, Employment status, Source.
- Accept policies, Install Vanta agent, security training, Background checks.
- Send reminder, personnel reminders, digest, service account, leave, Audit window.

## Screenshots

- `individual-personnel-onboarding-page-01.png`: Reminder email listing three security tasks and a button to complete them.
- `individual-personnel-onboarding-page-02.png`: People register with the reminders warning and Task status column highlighted.
- `individual-personnel-onboarding-page-03.png`: Row "⋯" menu: Send reminder, Edit details, Set as service account, Set leave, Edit groups.
- `individual-personnel-onboarding-page-04.png`: Settings > Notifications: failure-notice schedule and Personnel reminders.

## For Program Assurance

- An "Audit window" filter on the people register scopes who counts for an assessment period; fits role holders over a program's authorization period.
- A warning band that names a missing setup and its one fix (Schedule reminders) keeps gaps actionable without prose in the table.
- Per-person Task status in the register (due soon, overdue, complete) mirrors owner-level accountability for controls and POA&M items.

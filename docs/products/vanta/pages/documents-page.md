# Documents page

Source: https://help.vanta.com/en/articles/11345376-documents-page
Fetched: 2026-11-17

## Purpose

- One register of every evidence file the audit needs: files submitted directly and files attached to document tests on the Monitors page.
- Each row is one required piece of evidence the auditor will review (SOC 2, ISO 27001, HIPAA and so on).

## Layout

- Global top bar: Vanta mark, workspace switcher ("no probllama"), then help, announcements, settings and the account avatar at the end.
- Left nav: Help search (⌘+K), Home, Tests, Reports; Compliance group (Frameworks, Controls, Policies, Documents, Audits, Settings); Customer Trust group (Overview, Trust Center, Questionnaires, Knowledge base, Activity, Settings); Risk group; a collapse arrow at the foot.
- Page header: title "Documents"; at the end View deactivated, Export all, and the primary Add document (a split/dropdown button).
- Filter row 1: Search all documents; dropdown filters Overall status, Latest status, Category, Subcategory, Frequency, Framework, Priority, Owner; a column-settings icon button at the end.
- Filter row 2: Time Sensitivity, Rollout status, and a checkbox "Requires my approval".
- Table columns: checkbox, Name, Frameworks (chips, two shown then "+N"), Category (two lines: category over subcategory, e.g. Engineering / Logging), Owner (avatar initials, an empty-person icon, or a warning icon), Overall status, Renew by (calendar icon + date, red when past), Latest version status (badge).

## How you get here / where it leads

- → Compliance > Documents in the left nav.
- → Monitors page: the related document tests open the same documents; an update in either view shows in both.
- → Audit: each document is evidence an auditor reviews (the article says so; no link drawn).

## Actions

- Add document (primary, with a dropdown).
- Export all.
- View deactivated.
- Search all documents.
- Filter; Requires my approval.
- Upload a file (satisfies the related test).
- Mark Not Relevant (the related test is then excluded) (the article names the status; the control that sets it is not shown).

## States and numbers

- Document status (article): Need Document (a test waits for an upload), OK (passed; current and approved), Needs Update (test failing or overdue; file outdated or expiring soon), Not Relevant (out of scope; test excluded).
- Overall status in the screenshot: Overdue, with a red x icon, on all 9 rows shown.
- Latest version status in the screenshot: Draft (pencil, grey) and Expired (red diamond).
- Renew by dates in red when past: Aug 6, 2022 to Mar 6, 2024.
- Frameworks chips overflow as "+1", "+2", "+5".
- Owner unset: a dashed person icon; owner problem: an amber warning icon (inferred: owner missing or no longer valid).

## Vocabulary

- Document, evidence, document test, test, Monitors page.
- Overall status, Latest status / Latest version status, Renew by.
- Category, Subcategory (Engineering / Logging, Human resources / People, Engineering / Vulnerability management, Custom / Custom).
- Frequency, Framework / Standard, Priority, Owner, Time Sensitivity, Rollout status.
- Sections: Human resources, Information technology, Policy, Engineering, Risks.

## Screenshots

- `documents-page-01.png`: Documents register with two filter rows and nine Overdue rows; Documents highlighted in the left nav.

## For Program Assurance

- Evidence as a register of what is owed, not only what was uploaded: one row per required artifact with Owner, Renew by and two statuses (overall, latest version).
- A "Requires my approval" checkbox beside the filters is a cheap personal lens on a shared register.
- The same artifact reachable from its test and from the register, with edits shown in both, maps to evidence reachable from a requirement and from the evidence register.

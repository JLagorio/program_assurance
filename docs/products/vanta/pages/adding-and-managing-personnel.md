# Adding and managing personnel

Source: https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel
Fetched: 2026-11-17

## Purpose

- The People page: add and manage the personnel tracked for compliance; an identity provider (IdP) keeps the roster in sync, an HRIS adds employment data, and a provisioning setting decides who can log in to Vanta.

## Layout

- First-time setup (one page): people icon; heading "Ensure your personnel meet your compliance requirements"; line "Set up your workforce to monitor policy acceptance, security training, and application access."; three cards, each with a dashed status ring:
  - "Select personnel source" (Source —).
  - "Add employment data" (Source —).
  - "Manage personnel access to Vanta": question "How will personnel complete compliance requirements?" with two radio cards, Using Vanta ("Personnel will complete some or all requirements using Vanta.") and Using other systems ("Personnel will complete requirements in other tools."); Complete setup (disabled until chosen).
- People page (after setup; described, not shown in this article): search, filter and sort above the table; table-settings icon for columns and density; "⋯" above the table with Add a personnel record and Manage HR data; a row opens the personnel record.
- Manage HR data: Unlinked and Linked tabs; link a record to a Vanta person, or Clear; Save.
- Personnel record: editable Start date, End date, Leave status (when no HRIS).

## How you get here / where it leads

- → Personnel > People (left nav).
- → first visit → setup wizard (import personnel → add employment data → manage access) → People page.
- → Settings > Personnel > Setup tab: manage the IdP integration; "⋯" > IdP precedence.
- → Identity Providers and HR Systems help collections (integration setup).
- → Settings > Login and security: user provisioning setting.
- → a row → personnel record.
- → related articles: service accounts, scoping out, duplicates, leave, groups, tasks, reminders, offboarding.

## Actions

- Connect an IdP; connect multiple IdPs and set IdP precedence; configure scope.
- Connect an HRIS; Manage HR data (link, Clear, Save).
- Add a personnel record (name, email, Add).
- Choose provisioning: Using Vanta > Automatically manage / Use SCIM / Manually manage; Using other systems.
- Per person: mark as service account (Not a person), scope out, merge duplicates, mark on leave, add to groups, assign tasks, send reminders, offboard.

## States and numbers

- Source of a record: IdP (edit in the IdP), multiple IdPs (highest precedence wins), manual (edit in Vanta).
- Employment data: from HRIS (edit there) or manual.
- Provisioning: personnel auto-provisioning (Employee role; deactivated on termination, out of scope or service account), SCIM, manual (monitored only; offboarding does not deactivate the account).
- Same person in two IdPs: same email → one record plus a fetch error; different emails → duplicate records.
- Setup step state: dashed ring (not done); Complete setup disabled until a choice is made.

## Vocabulary

- Personnel, personnel record, People page, roster, user account.
- Identity provider (IdP), IdP precedence, HRIS, employment data, start date, end date, leave status.
- User provisioning, auto-provisioning, SCIM, Employee role, service account ("Not a person"), scoped out, offboarding, groups, tasks, reminders.

## Screenshots

- `adding-and-managing-personnel-01.png`: First-time People setup with three steps and the Using Vanta / Using other systems choice.

## For Program Assurance

- A short first-run page of three cards, each saying its source and done state, is a model for program setup prerequisites (people, systems, baseline) before the register opens.
- Every record says where it comes from (IdP, HRIS, manual) and therefore where it is edited; fits reference data vs authored records.
- "Monitored only" vs "can log in" separates people the program tracks (role holders, owners) from people who use the tool.

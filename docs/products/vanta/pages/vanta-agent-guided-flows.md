# Vanta Agent guided flows

Source: https://help.vanta.com/en/articles/16055560-vanta-agent-guided-flows
Fetched: 2026-11-17

**Purpose**: structured conversations with the Vanta Agent that onboard, set up or implement one part of the program: the agent asks for what it needs, acts after confirmation, and points to the right page when a step happens elsewhere. Needs Vanta AI enabled; what the agent can read or write follows the user's role. No screenshots in the article.

## The steps

Four guided flows, each with its eligibility:

| Flow | Eligibility |
| --- | --- |
| Compliance program import | custom controls, policies, frameworks; custom fields and frameworks if on the plan |
| Common controls | Vanta Control Framework (VCF) enabled |
| SOC 2 guide | "SOC 2 guide" shows in the navigation |
| Trust Center setup | no Trust Center created yet |

1. Compliance program import (Vanta Agent): ask "help me import my compliance program" → upload files → the agent classifies each file and proposes a plan, asking approval before creating anything:
   1. create a custom framework from a framework file, or when a control file names a framework not enabled;
   2. create custom controls, map them to the file's frameworks, match columns to control fields, suggest custom fields for the rest;
   3. choose whether imported controls replace Vanta's defaults or sit alongside;
   4. create custom policies and map them to controls;
   5. map imported controls to tests and documents.
   It creates new items only, never overwrites. Afterwards: ask it to suggest evidence for a control, map controls, or update owners.
2. Common controls (Vanta Agent): first setup maps controls to the VCF; auto-maps default controls and suggests mappings for custom ones on VCF-supported frameworks; others are mapped by hand later.
3. SOC 2 guide (navigation item): a SOC 2 task list; some tasks are done on Vanta pages, others open an agent conversation:
   1. Getting started: review business information, invite the team by connecting an IdP, connect a collaboration tool.
   2. Trust Center setup: create a basic Trust Center ready to share.
   3. Cloud setup: connect AWS, GCP or Azure, review cloud SOC 2 tests, remediate failures.
   4. Policies: review the required SOC 2 policies to approve them.
   5. Risk: recommended risk scenarios added to the register.
   6. Vendors: identify vendors, review vendor risk, documentation for high- and critical-risk vendors.
4. Trust Center setup (Vanta Agent): review title, description, security contact email, privacy policy link → the agent creates it, adds an engagement letter when available, makes it public after confirmation (or confirms it is live and shares the link). Further edits on the Trust Center page.

## Layout

No screenshots. Surfaces named: Vanta Agent conversation, SOC 2 guide (task list in navigation), Controls page (custom fields), Trust Center page. (interface-settings-01.png shows "Vanta Agent" as a left-nav item and "SOC 2 guide" in the profile menu.)

## Flow edges

- Vanta Agent → upload files → plan → approve → Controls / Frameworks / Policies (created)
- Vanta Agent → VCF mapping → Controls
- SOC 2 guide task → Vanta page, or → Vanta Agent conversation
- Vanta Agent → Trust Center (created / public) → Trust Center page for edits

## Actions

help me import my compliance program · upload files · approve plan · replace or add alongside default controls · create custom fields · map controls to tests and documents · suggest evidence · map controls · update owners · auto-map to VCF · connect IdP / cloud / collaboration tool · approve policies · add risk scenarios · review vendors · create Trust Center · make Trust Center public

## Vocabulary

Vanta Agent · guided flows · Compliance program import · custom controls / policies / frameworks · custom fields · Common controls · Vanta Control Framework (VCF) · SOC 2 guide · task list · Trust Center · engagement letter · user role / product permissions / object assignments

## Screenshots

None in the article.

## For Program Assurance

- An import assistant should classify each uploaded file, show the plan of what it will create (frameworks, controls, mappings, policies) and wait for approval before writing; it creates and never overwrites.
- A framework-specific guide as a task list where each task is either a link to the page that does it or a guided conversation fits an RMF step list (a "Moderate baseline guide", inferred).
- A common control set mapped once to several frameworks is the same idea as one control baseline counted against several overlays (inferred).

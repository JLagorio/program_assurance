# Vanta's help-center images, grouped

Every image of the 753 help-center articles fetched on 2026-11-17: 2597 unique files (292 byte-identical copies were removed). Each was looked at and sorted on 2026-11-17. These are third-party images, committed with the notes so every link in them opens.

| Folder | Images | What is in it |
|---|---:|---|
| `ux/<area>/` | 1424 | Screens Vanta itself draws: app pages, dialogs, menus, drawers, its emails and Slack messages, the employee portal, the public Trust Center, the auditor's view. One folder per product area. |
| `integrations/<integration>/` | 1119 | Everything specific to connecting one integration: the other company's console screens and Vanta's own connect steps for it, in the guide's order. One folder per integration (160). |
| `documentation/` | 53 | Neither product's UI: diagrams, tables, code and JSON, OS settings, spreadsheets. |
| `not-product/` | 1 | Unrelated to the product: logos, photos, banners. |

## Product areas (`ux/`)

| Area | Images | Shows |
|---|---:|---|
| `integrations` | 426 | Vanta's Integrations page: the gallery, connected list, errors, an integration's drawer; and connect steps whose guide names no single integration |
| `personnel` | 119 | People, groups, onboarding and offboarding tasks, training, background checks, the employee portal |
| `settings` | 115 | Workspace settings, users and roles, notification and reminder settings |
| `tests` | 97 | Tests list, a test's page, history, remediation, deactivation |
| `policies` | 86 | Policies list, editor, approval, acceptance, renewal |
| `trust-center` | 63 | Trust Center: builder, public page, access requests, NDAs |
| `documents` | 59 | Documents (evidence) list, a document's page, uploads, renewals |
| `vendors` | 50 | Vendors list, a vendor's page, security reviews |
| `frameworks` | 46 | Frameworks list, a framework's page, scoping |
| `audits` | 41 | Audits, the auditor's view, requests (IRL), audit evidence |
| `vulnerabilities` | 38 | Vulnerabilities, findings by asset, SLAs |
| `inventory` | 34 | Asset inventory |
| `questionnaires` | 32 | Security questionnaires and the knowledge base |
| `access` | 31 | Access accounts, access reviews, access requests |
| `devices` | 28 | Computers and the Vanta Agent |
| `ai` | 25 | Vanta AI and agent screens, AI governance |
| `risk` | 23 | Risk register, scenarios, assessments |
| `notifications` | 21 | Vanta's emails and its Slack or Teams messages |
| `controls` | 17 | Controls list and a control's page |
| `customer-commitments` | 15 | Customer commitments |
| `other` | 12 | Anything else Vanta draws |
| `home` | 10 | Home and getting-started checklists |
| `workspaces` | 9 | Multiple workspaces |
| `reports` | 9 | Reports and exports |
| `issues` | 6 | Issues |
| `my-work` | 5 | My work: what's assigned to you or waiting on your approval |
| `insurance` | 4 | Cyber insurance (Vouch) inside Vanta |
| `privacy` | 2 | Privacy |
| `code-changes` | 1 | Code changes |

## Integrations (`integrations/`)

The largest: `aws` 105, `azure` 89, `okta` 57, `jira` 42, `google-workspace` 39, `jumpcloud` 32, `servicenow` 23, `microsoft` 22, `gcp` 21, `github` 18, `splunk` 15, `tenable` 15, `hibob` 13, `salesforce` 13, `pingone` 13. The rest hold one to eight images each.

## Finding things

- A file is named after its article and its place in it: `the-tests-page--03.png` is image 3 of [The Tests Page](https://help.vanta.com/en/articles/11345374-the-tests-page). The article's text, with each image's link, is `../help-center/articles/<article>.md`.
- `index.json` lists every image: its folder, the article's title and address, its number in the article, its size, what it shows (`screen`), its patterns (`patterns`, such as list, drawer, comments, approval, stat-cards), whether it shows a whole page (`whole_page`), and its old paths (`path`, `dups`).
- Every article and note under this folder links its images at their new paths.

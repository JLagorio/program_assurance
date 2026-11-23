# Drata's help-center images, grouped

These are the images of all 896 published articles in Drata's help center, fetched on 2026-11-22: 1,012 images, which make 978 unique files once 34 byte-identical copies are removed. Each one was looked at and sorted on 2026-11-22, and comes to 248 MB in total. They are third-party images, committed with the notes so every link in them opens.

| Folder | Images | What is in it |
|---|---:|---|
| `ux/<area>/` | 541 | Screens Drata itself draws: app pages, dialogs, menus and drawers; its emails and Slack messages; the employee portal (My Drata); the Drata Agent; the auditor's view (Audit Hub); and the support widget. One folder per product area. |
| `integrations/<integration>/` | 406 | Everything specific to connecting one integration, in the guide's order: the other company's console screens, and Drata's own connection drawer or wizard for that integration. One folder per integration (68). |
| `documentation/` | 27 | Neither product's UI: diagrams, infographics, code and XML, an API try-it panel, and an HTML manifest opened in a browser. |
| `not-product/` | 4 | Unrelated to the product: a 1-pixel divider and three tiny icon crops. |

## Product areas (`ux/`)

| Area | Images | Shows |
|---|---:|---|
| `vendors` | 80 | Vendors (TPRM): the list, a vendor's page, security reviews, questionnaires sent to vendors, the TPRM agent, and bulk import |
| `personnel` | 72 | Personnel: the list, a person's page, onboarding and offboarding, compliance checks, training, policy acceptance, and My Drata |
| `settings` | 53 | Company settings, users and roles, notification rules, personnel compliance toggles, API keys and AI settings |
| `policies` | 48 | Policy Center: the list, the builder, versions with an AI comparison, approval, and publishing |
| `monitoring` | 34 | Monitoring: tests, a test's page, results, exclusions, custom tests and the Test Library |
| `connections` | 30 | Connections: the gallery, connected list, Manage Infrastructure Accounts, connection priority and errors; connect steps that name no single integration |
| `audits` | 30 | Audit Hub: audits, a request with its evidence and messages, what auditors see, audit creation, and evidence downloads |
| `risk` | 28 | Risk management: the register, a risk's page, assessment, treatment, the library and custom formulas |
| `evidence` | 23 | Evidence Library: the list, an evidence item, bulk import, library sync and deletion |
| `frameworks` | 21 | Frameworks: the list, a framework's page, requirements, custom frameworks and mapping downloads |
| `controls` | 21 | Controls: the list, a control's page, the Drata Control Framework, and mapping controls to requirements |
| `tasks` | 18 | Tasks: the list, a task, and assigning work |
| `tickets` | 15 | Creating and linking tickets from records, including one provider's Create ticket dialog |
| `assets` | 14 | The asset inventory |
| `home` | 11 | Dashboard, Quick Start and Recommendations |
| `workspaces` | 11 | Several workspaces: the switcher, a workspace's record and its tests |
| `ai` | 8 | The Drata AI panel and chat |
| `workflows` | 7 | Custom workflows, custom fields and formulas |
| `access-review` | 4 | Access reviews |
| `devices` | 4 | The Drata Agent and device compliance |
| `other` | 4 | The support widget, the sign-in page and the product-ideas portal |
| `events` | 3 | The events log, and an audit event's page |
| `notifications` | 2 | Drata's emails and its Slack messages |

The help center has no screenshots of the Trust Center (SafeBase), customer questionnaires or vulnerabilities. Those are covered only in text and in training videos.

## Integrations (`integrations/`)

The largest folders:

| Folder | Images |
|---|---:|
| `intune` | 62 |
| `aws` | 59 |
| `azure` | 33 |
| `workday` | 30 |
| `gcp` | 25 |
| `workspace-one-mdm` | 19 |
| `github` | 15 |
| `gitlab` | 12 |
| `hibob` | 11 |
| `jamf` | 11 |
| `kandji` | 11 |
| `adp-workforce-now` | 9 |
| `certn` | 7 |
| `okta` | 7 |
| `datadog` | 6 |

The rest hold one to four images each. Some products have more than one connection in Drata, and each connection has its own folder (`github`, `github-enterprise-server` and `github-issues-enterprise`, for example). These names were folded together:
- `aws-govcloud` and `aws-org-units` into `aws`;
- `azure-management-groups` into `azure`;
- `bob` into `hibob`;
- `hexnode-uem` into `hexnode`.

## Finding things

- **File names.** A file is named after its article and its place in it. For example, `ux/monitoring/add-tests-from-the-test-library-to-a-workspace-new-experience--01.png` is image 1 of [Add tests from the Test Library to a workspace (New Experience)](https://help.drata.com/en/articles/13948681-add-tests-from-the-test-library-to-a-workspace-new-experience). The article's text, with each image inline where it appears, is in `../help-center/articles/<article>.md`.
- **`index.json`** lists every image. For each one it gives:
  - where it is: the folder (`group`, `area` or `vendor`) and the file;
  - what it shows: a line under 12 words (`screen`) and tags such as list, drawer, stat-cards or selection-bar (`patterns`);
  - whether it is a whole page (`whole_page`), which 391 are;
  - where it came from: the article's title, address and collection, its number in the article, and its size;
  - its byte-identical copies in other articles (`dups`). Those copies link to the one kept file.
- **Links.** Every article and note in this folder links its images at these paths.

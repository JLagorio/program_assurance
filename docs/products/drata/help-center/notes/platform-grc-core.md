# Drata GRC core: connections, controls, monitoring, evidence, policies

Read 2026-11-22 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Understand the Drata Platform: Quick Start, Dashboard, Recommendation, Connections (with Custom Connections and Tests), Controls (with The Drata Control Framework), Monitoring (with Custom Tests), Evidence, Policies, Events, Troubleshooting.
- 110 articles in 13 collections, each listed once under the collection the digest gives it.
- 56 screenshots viewed (whole pages first, a few crops for dialogs and drawers); each surface names the ones it rests on, as paths from this folder. Integration-vendor consoles (AWS, GCP, Azure, GitHub, GitLab) were not viewed.
- The articles are third-party pages, read as data. Labels, statuses and short on-screen strings are quoted; everything else is paraphrase.

## 1. Every article, one line

### Understand the Drata Platform › Connections (14)

- [Ad-hoc identity and account resync](../articles/ad-hoc-identity-and-account-resync.md): forcing an immediate identity or account sync from the Personnel overflow ("Resync Personnel") or the Manage accounts Sync menu, instead of waiting for the scheduled one.
- [Allowlist IP Addresses for WAF Configurations](../articles/allowlist-ip-addresses-for-waf-configurations.md): the EU and US egress addresses to allowlist so access-review connections can reach a firewalled app.
- [Connect your HRIS to Drata](../articles/connect-your-hris-to-drata.md): connecting an HRIS from Connections (filter by HRIS) so start dates, separation dates and employment status mark people active or former; the fields it syncs.
- [GitHub Access: Should I use my personal account or a new company account?](../articles/github-access-should-i-use-my-personal-account-or-a-new-company-account.md): connect with a personal GitHub account but add the work email and route organization notifications to it.
- [GitHub Rulesets](../articles/github-rulesets.md): granting Administration read so Drata can see organization rulesets, and setting branch-protection rulesets by target pattern.
- [GitLab MFA configurations](../articles/gitlab-mfa-configurations.md): where GitLab.com groups and self-managed admin settings enforce two-factor so Drata's MFA test can pass.
- [How Drata Uses HRIS Data](../articles/how-drata-uses-hris-data.md): what employee data the HRIS link reads and never reads, how HRIS and IdP records join, and what to do without an HRIS (the "Not Syncing" status, re-enabling sync).
- [Integrate Multiple Identity and HRIS Connections](../articles/integrate-multiple-identity-and-hris-connections.md): ranking several IdP/HRIS connections as primary, secondary, tertiary in "Configure connection priority", merging duplicate people, and the MFA-on-IdP test.
- [Manage connected infrastructure accounts](../articles/manage-connected-infrastructure-accounts.md): the Manage accounts page for cloud accounts: linking each to a person, the access-change trail, and the MFA, Database and Admin access indicators.
- [Manage connected version control](../articles/manage-connected-version-control.md): the same page for VCS accounts, with Write Access, Merge to default branch and MFA indicators.
- [Map accounts to personnel in Drata (New Experience)](../articles/map-accounts-to-personnel-in-drata-new-experience.md): linking an unlinked account to a person, and marking service or system accounts out of scope from the row menu.
- [Multiple MDM Support (New Experience)](../articles/multiple-mdm-support-new-experience.md): connecting several MDMs at once, how each device's data is merged and which source wins.
- [Partner Connections: Expanding Compliance with External Tools](../articles/partner-connections-expanding-compliance-with-external-tools.md): partner-built integrations that push evidence through a scoped Drata API key but get no automated tests (Swif as the example).
- [Understanding Connections in Drata](../articles/understanding-connections-in-drata.md): the All Connections page (Available and Active tabs, categories), the connection detail page, and Healthy/Unhealthy health with an AI failure summary.

### Understand the Drata Platform › Connections › Custom Connections and Tests (4)

- [Custom Device Connections](../articles/custom-device-connections.md): a narrower custom connection that takes device JSON from any MDM or inventory tool against a fixed schema, pre-mapped to the Device tests.
- [Part 1: Custom Connections and Tests](../articles/part-1-custom-connections-and-tests.md): creating a custom connection and data source, then pushing a first dataset by API (curl samples on the Manage tab) and viewing the records received.
- [Part 2: Automate Evidence Submission](../articles/part-2-automate-evidence-submission.md): keeping a custom connection fed by a no-code platform, a scheduled script or a cloud function.
- [Part 3: Create, Run, and Map a Custom Test](../articles/part-3-create-run-and-map-a-custom-test.md): building a test over the pushed data, publishing and running it, reading results and exclusions, and mapping it to controls.

### Understand the Drata Platform › Controls (13)

- [Annotate a Control](../articles/annotate-a-control.md): the Internal notes panel on a control page, beside tickets and tasks.
- [Apply Default Mappings for Controls](../articles/apply-default-mappings-for-controls.md): restoring Drata's shipped requirement and test mappings on one control after local edits.
- [Assess and Manage Individual Controls](../articles/assess-and-manage-individual-controls.md): the control page tab by tab: Overview, Evidence, Monitoring, Policies, Frameworks, Risks, plus notes, tasks and tickets.
- [Controls and Tests Updated Between January 2024 and October 2025](../articles/controls-and-tests-updated-between-january-2024-and-october-2025.md): a 34,000-word change log of DCF controls and tests revised over that period.
- [Create, Edit, and Manage Controls](../articles/create-edit-and-manage-controls.md): creating a custom control, editing its info, assigning owners singly or in bulk, and why controls are scoped out rather than deleted.
- [Export Control-to-Requirement Mappings](../articles/export-control-to-requirement-mappings.md): the framework page's Download menu for control-to-requirement mapping CSVs and what each option contains.
- [Import Controls in Bulk (New Experience)](../articles/import-controls-in-bulk-new-experience.md): creating or updating many controls from a CSV template, with column mapping and validation.
- [Manage Notifications for Required Approvals and Control Updates](../articles/manage-notifications-for-required-approvals-and-control-updates.md): email, Teams and Slack notices for control owners and approvers when approvals are due or controls change.
- [Manage Required Approval and Control Readiness](../articles/manage-required-approval-and-control-readiness.md): setting approvers on a control (singly or from the selection bar), the approval stages, and how an approval gates readiness.
- [Manage Scope and Exclusions in Drata](../articles/manage-scope-and-exclusions-in-drata.md): marking controls out of scope with a reason, and excluding people from personnel tests.
- [Map evidence and policies to controls (New Experience)](../articles/map-evidence-and-policies-to-controls-new-experience.md): linking Evidence Library items and policies to a control from its Evidence and Policies tabs.
- [Mark Controls In or Out of Scope](../articles/mark-controls-in-or-out-of-scope.md): the bulk "Mark out of scope" verb, the reason it asks for, and what changes for readiness and audits afterwards.
- [Revert a Control to Drata's Latest DCF Template](../articles/revert-a-control-to-drata-s-latest-dcf-template.md): "View latest template" and the field-by-field compare dialog that applies or rejects Drata's newer control text.

### Understand the Drata Platform › Controls › The Drata Control Framework (4)

- [DCF Library Updates on 1/18/2024](../articles/dcf-library-updates-on-1-18-2024.md): a table of 203 DCF controls reworded on that date, with code, name, framework and associated policies.
- [Introduction to the Drata Control Framework (DCF)](../articles/introduction-to-the-drata-control-framework-dcf.md): Drata's own framework-neutral control catalog (DCF-n codes) that every supported framework's requirements map onto.
- [The Drata Control Framework & Requirement Relationship](../articles/the-drata-control-framework-requirement-relationship.md): requirement versus control versus DCF, and why several DCF controls can stand behind one requirement.
- [Understand the Difference: Terms of Service (DCF-63) vs. Master Service Agreements (DCF-66)](../articles/understand-the-difference-terms-of-service-dcf-63-vs-master-service-agreements-dcf-66.md): a two-column comparison of the two contract controls and which evidence satisfies each.

### Understand the Drata Platform › Dashboard (1)

- [Dashboard overview](../articles/dashboard-overview.md): the Dashboard's cards: readiness by framework, notifications, test trends with a failing-tests drawer, policy status, vendor risk, connections, personnel and tasks.

### Understand the Drata Platform › Events (2)

- [Annotate an event](../articles/annotate-an-event.md): adding internal notes to an audit event, which then travel with the event as audit evidence.
- [Events Overview](../articles/events-overview.md): the Events log (filters by category, type and user) and the event page with its raw JSON evidence.

### Understand the Drata Platform › Evidence (12)

- [Add Jira Tickets as Evidence](../articles/add-jira-tickets-as-evidence.md): attaching a Jira ticket as an evidence artifact and keeping it current.
- [Bulk Import Evidence](../articles/bulk-import-evidence.md): the spreadsheet-style "Import or Update Evidences" dialog: CSV upload, file attachment per row, renewal columns, cell validation, create versus update.
- [Create Evidence](../articles/create-evidence.md): adding evidence (file, URL or ticket) to the Evidence Library or straight from a control, and the accepted file types.
- [Delete Evidence (New Experience)](../articles/delete-evidence-new-experience.md): what to check before deleting evidence, and the bulk Delete evidence verb with its confirmation.
- [Drata Evidence Library Sync](../articles/drata-evidence-library-sync.md): pushing evidence to the SafeBase trust center from the list, the item page or the create form, with a Trust Library status column.
- [Evidence Library: Multiple Artifacts & Multi-File Upload (New Experience)](../articles/evidence-library-multiple-artifacts-multi-file-upload-new-experience.md): one evidence item holding several artifacts and files, opted in from Settings › New features.
- [Evidence Overview](../articles/evidence-overview.md): the Evidence page, evidence statuses and how they move control readiness, evidence sources, and the default owner on artifact templates.
- [Evidence Renewal Date](../articles/evidence-renewal-date.md): renewal dates on evidence, how an expired item drops readiness, and the filters that find them.
- [Example Evidence for Not Monitored Controls Linked to Policies](../articles/example-evidence-for-not-monitored-controls-linked-to-policies.md): a long table of controls that read Ready on a policy alone, with the extra evidence an auditor will still ask for.
- [Link to Evidence from Audit Hub Requests](../articles/link-to-evidence-from-audit-hub-requests.md): answering an auditor's request from its message panel by attaching library evidence, creating new evidence or uploading a one-off file.
- [Manually Export Evidence Data from Drata](../articles/manually-export-evidence-data-from-drata.md): every manual download path: Evidence Library, a control, event tracking and Audit Hub.
- [New File Format Support](../articles/new-file-format-support.md): the file types and size limits accepted in evidence, controls and risk, zip handling, and files held for a malware scan.

### Understand the Drata Platform › Monitoring (24)

- [Add tests from the Test Library to a workspace (New Experience)](../articles/add-tests-from-the-test-library-to-a-workspace-new-experience.md): "Add to program" from the library list or a template page, choosing workspaces and Draft or Published, and why legacy tests cannot be added.
- [Conditions That Affect 'Fix Now' and 'Test Now' Button Visibility](../articles/conditions-that-affect-fix-now-and-test-now-button-visibility.md): when a test offers Fix Now (a remediation link exists) and Test Now (the connection and role allow a rerun).
- [Disable a Test](../articles/disable-a-test.md): turning a test off when it does not apply or is monitored elsewhere, with a reason, and turning it back on.
- [Download Audit Evidence for a Custom Test (New Experience)](../articles/download-audit-evidence-for-a-custom-test-new-experience.md): downloading a custom test's run as a PDF or its raw JSON from the audit event page.
- [Dratabot](../articles/dratabot.md): how to verify Drata's crawler by user agent and reverse DNS.
- [Enable AI Summaries for Tests](../articles/enable-ai-summaries-for-tests.md): turning on AI summaries of custom-test failures, generating one on a failed result, and exporting findings to CSV.
- [Exclude Findings from Tests](../articles/exclude-findings-from-tests.md): excluding one failing item from a test with a reason, re-including it, and finding tests that hold exclusions.
- [Excluding Infrastructure resources](../articles/excluding-infrastructure-resources.md): resource-level exclusions by provider tag versus finding-level exclusions in Drata, and their limits.
- [Exclusion labels within GCP](../articles/exclusion-labels-within-gcp.md): adding the drataexclude label to buckets, VMs, clusters, Cloud SQL and projects in the GCP console.
- [Exclusion tags within AWS](../articles/exclusion-tags-within-aws.md): adding the DrataExclude tag to RDS, EKS, EC2, S3, SQS, IAM, ECS, ElastiCache, DynamoDB and OpenSearch resources.
- [Exclusion tags within Azure](../articles/exclusion-tags-within-azure.md): adding the DrataExclude tag to container instances, storage accounts, AKS and VMs in Azure.
- [Exclusions vs. Disabling a Test (Concept Guide)](../articles/exclusions-vs-disabling-a-test-concept-guide.md): exclude an item when one resource is out of scope; disable the test when the whole check is.
- [Filter and search tests in Monitoring (New Experience)](../articles/filter-and-search-tests-in-monitoring-new-experience.md): Monitoring's search and filters (result, status, framework, control, connection and more) and its column set.
- [Identify and Add Missing AWS Permissions for Drata](../articles/identify-and-add-missing-aws-permissions-for-drata.md): reading a permissions failure and adding the missing IAM actions to Drata's role.
- [Identify and Add Missing Azure Permissions for Drata](../articles/identify-and-add-missing-azure-permissions-for-drata.md): the Graph API and RBAC permissions Azure tests need, and how to grant them.
- [Identify and Add Missing GCP Permissions for Drata](../articles/identify-and-add-missing-gcp-permissions-for-drata.md): the GCP roles and APIs Drata's tests need, and how to verify them.
- [Manage Tests in Monitoring Page](../articles/manage-tests-in-monitoring-page.md): bulk test verbs from the selection bar, the row menu, and the actions on a test's own page.
- [Manually Running a Control Test](../articles/manually-running-a-control-test.md): tests run nightly (Pacific time); "Test now" in the row menu reruns one at once.
- [Map Tests to Controls](../articles/map-tests-to-controls.md): mapping and unmapping tests from either side (a control's Monitoring tab or a test's Controls tab), and how it moves readiness.
- [Monitoring Overview](../articles/monitoring-overview.md): the Monitoring page's Production and Codebase tabs, its summary cards, the test table and mapped versus unmapped tests.
- [Resolve SSL/TLS Compliance Testing Issues in Drata](../articles/resolve-ssl-tls-compliance-testing-issues-in-drata.md): a six-step checklist (DNS, redirect, firewall/CDN, reachability) for a failing SSL/TLS test.
- [Test Library (New experience)](../articles/test-library-new-experience.md): the catalog of test templates with usage counts and filters, and a template's page (Info, Mappings, tests using it, instructions).
- [Understanding Test Provisioning and the Test Library (New Experience)](../articles/understanding-test-provisioning-and-the-test-library-new-experience.md): how templates become workspace tests automatically when a connection or framework calls for them, or by hand.
- [View and Manage Test Details (New Experience)](../articles/view-and-manage-test-details-new-experience.md): the test page's Overview, Findings, Exclusions, Controls and History tabs, and notes, tasks and tickets on a test.

### Understand the Drata Platform › Monitoring › Custom Tests (6)

- [Advanced Editor in the Test Builder](../articles/advanced-editor-in-the-test-builder.md): writing test logic as JSON for nested properties and arrays the Builder tab cannot express.
- [AWS Resource Permissions](../articles/aws-resource-permissions.md): the AWS resource types a custom test can query and the permission each needs.
- [Common use cases for custom test](../articles/common-use-cases-for-custom-test.md): worked examples of custom tests mapped to DCF controls for security and compliance checks.
- [Create and Publish Custom Tests](../articles/create-and-publish-custom-tests.md): the Create test builder (condition groups, filtering criteria, resource guide), Save as draft, Publish and what runs next.
- [Edit a Custom Test](../articles/edit-a-custom-test.md): changing a published test through a draft version that is then published over it.
- [Resource Guide for custom tests](../articles/resource-guide-for-custom-tests.md): the side panel's attribute dictionary for a resource's data structure, and when to switch to the Advanced editor.

### Understand the Drata Platform › Policies (25)

- [Add comments in your policy](../articles/add-comments-in-your-policy.md): commenting on selected text in a draft policy, who may comment or edit during review, and how comments are kept.
- [AI-powered control suggestions for policies](../articles/ai-powered-control-suggestions-for-policies.md): AI-suggested controls on a policy's Controls tab, accepting or dismissing them, and the suggestion statuses.
- [Archive and restore policies](../articles/archive-and-restore-policies.md): archiving from the row menu, which policies cannot be archived, and restoring from the "Archived and replaced" tab.
- [Assigning Policies to Specific Groups](../articles/assigning-policies-to-specific-groups.md): Applicable personnel (all, specific IdP groups, none), checking groups are synced, and how assignment drives the acknowledgement test.
- [Common Policy Management Issues in Drata (and How to Resolve Them)](../articles/common-policy-management-issues-in-drata-and-how-to-resolve-them.md): symptom, cause and fix for policy problems, such as Create missing when an external policy source is connected.
- [Compare Policy Versions with AI](../articles/compare-policy-versions-with-ai.md): an AI change summary between versions (executive summary and change log) for approvers and for the personnel notice, and how stale summaries refresh.
- [Configure Policies to Support Compliance Test Completion in Drata](../articles/configure-policies-to-support-compliance-test-completion-in-drata.md): why archived, replaced or custom policies make policy tests fail, and how to fix the template link.
- [Create a policy](../articles/create-a-policy.md): the four-step Create policy wizard (Source, Details, Personnel groups, Replace default policies) ending in a draft.
- [Create and manage policy translations](../articles/create-and-manage-policy-translations.md): enabling policy languages in Settings, adding a translation to a draft, default-language rules and acknowledging in one's own language.
- [Creating an SLA for Employee Onboarding Completion](../articles/creating-an-sla-for-employee-onboarding-completion.md): the onboarding grace period before personnel tests count a new hire, and the policies that carry it (the SLA column).
- [Delete a Policy Draft](../articles/delete-a-policy-draft.md): deleting a Draft version from the row menu, and which policies and versions allow it.
- [Download your Policies](../articles/download-your-policies.md): Download all as a zip, a published or draft PDF from the row menu, and PDF preview from a draft's overflow.
- [External Policy: Use BambooHR to manage your policies](../articles/external-policy-use-bamboohr-to-manage-your-policies.md): importing BambooHR policies as Drata's record for controls while acknowledgement stays in BambooHR.
- [External Policy: Use Confluence or Notion to manage your policies](../articles/external-policy-use-confluence-or-notion-to-manage-your-policies.md): importing policy pages from Confluence or Notion, editing at the source, and what happens on disconnect.
- [General AI Policy](../articles/general-ai-policy.md): a lightweight AI-use policy template added to the set, mapped to no framework by default.
- [Linking directly to specific employee security policies](../articles/linking-directly-to-specific-employee-security-policies.md): deep links to a policy in the employee portal for use in other tools.
- [Manage and Configure Policy Controls in Drata](../articles/manage-and-configure-policy-controls-in-drata.md): fixes for policy-backed controls stuck "Not Ready" after a passing test, renewal messages and approval workflow snags.
- [Manage policy renewals](../articles/manage-policy-renewals.md): renewal dates on policies, "Renewal past due", updating an overdue date, and the renewal tasks and tests it drives.
- [Managing Policies Synced from Confluence in Drata](../articles/managing-policies-synced-from-confluence-in-drata.md): Confluence-synced policies are read-only in Drata; what cannot be done there and how to archive at the source.
- [Map policies to controls in Drata](../articles/map-policies-to-controls-in-drata.md): mapping from a policy's Controls tab ("Map Controls") or a control's Policies tab ("Map policies").
- [Policy Center Overview](../articles/policy-center-overview.md): the policy lifecycle (draft, approval, publish, acknowledge, renew), material versus non-material changes, roles, and archived or replaced policies.
- [Policy Owner Notifications](../articles/policy-owner-notifications.md): the Policies toggles in notification settings for owners.
- [Troubleshoot Blank Version History in Downloaded Policy PDFs](../articles/troubleshoot-blank-version-history-in-downloaded-policy-pdfs.md): republishing a policy (Edit, finalize without changes, classify, publish) to regenerate a PDF whose version-history table downloads blank.
- [Understanding the Approval Process](../articles/understanding-the-approval-process.md): approval settings (approvers, tiers), reviewing, cancelling and overriding approval, and who may edit and publish.
- [View and edit a policy](../articles/view-and-edit-a-policy.md): the policy page and header, the four-step edit (start, update, finalize and classify, explain), Version history, and acknowledging in My Drata.

### Understand the Drata Platform › Quick Start (2)

- [Complete the Provide Basic Info task in Quick Start](../articles/complete-the-provide-basic-info-task-in-quick-start.md): the task completes only when every editable field on Settings › Organization Details › Org info is filled, optional ones included.
- [Quick Start Guide](../articles/quick-start-guide.md): the onboarding checklist page: its tasks, progress percentage and where each task leads.

### Understand the Drata Platform › Recommendation (1)

- [AI-Assisted Custom Control Mapping to GRC Objects](../articles/ai-assisted-custom-control-mapping-to-grc-objects.md): the Recommendations page where an agent proposes requirements, policies, evidence and tests for custom controls, each with a confidence, to map or dismiss.

### Understand the Drata Platform › Troubleshooting (2)

- [Resolving Drata Agent Startup, Auto-Update, and Permission Errors](../articles/resolving-drata-agent-startup-auto-update-and-permission-errors.md): fixing the device agent's crashes and hourly failed auto-updates caused by wrong file permissions on macOS and Windows.
- [Troubleshooting Identity Sync Issues in Drata](../articles/troubleshooting-identity-sync-issues-in-drata.md): missing or stale people, wrong or duplicated names (Workday), and people shown as Unknown, Former or Future Hire.

## 2. Product surfaces

The shell, as these screenshots show it: a left nav with "Workspace" over Quick Start, Dashboard, Recommendations (expanding to Controls, Requirements), Tasks; a group with Compliance (expanding to Controls, Frameworks, Monitoring, Evidence, Audits), Risk, Vendors, Governance (Personnel), Events; and Connections pinned at the bottom. Collapsed, it is an icon rail. Top bar: the DRATA wordmark, collapse and expand toggles, a search icon and the user avatar. A page is a pale grey canvas with a white header band holding the h1 and the page's one outlined or filled button at top right. Filters live in a left side panel ("Clear all filters", a toggle between side panel and inline) beside a table or card list with a "Filters" button and a wide Search box. Many controls and tests pages share one register shape: a selection bar replaces the toolbar once rows are ticked.

### 2.1 Quick Start

Layout:
- Header: h1 "Quick Start"; a link "Get started with Help Center ↗" at top right; no primary.
- One line of encouragement over a thin yellow progress bar and "47% completed".
- Section cards that collapse: "Provide basic info" with its subtitle, a blue bar and "1 of 2 completed".
- Inside, task rows that also collapse, each with a ring that becomes a filled check when done: "Complete the welcome questionnaire" (done), "Enter your company info" (open).
- An open task shows one sentence and an outlined button that leaves for the place the work happens: "Go to Company Info settings".
- Sections, in order: Provide Basic Info; Make Connections to Power Automation (Identity, Infrastructure, Version control, Ticketing); Establish Continuous Compliance for Your Frameworks (Assign roles, Scope your framework requirements, Review gaps and plan remediation action); Ensure Your Personnel Stays Compliant (HRIS, employment status, internal security settings, background checks); Set Up Your Policies ("Go to Policy Center").
- The article states the intended order outright: requirements define what applies → controls map to them → tests and evidence judge the controls → failures and gaps show → actions close them.
- A task counts as done only when every editable field on the target page is filled, optional ones included; the bar reads "100% completion" at the end.

Flow edges:
- → nav Quick Start (admins only) → expand a section → task → its button → the settings page, Frameworks page, Controls page, Personnel page or Policies page.
- → return any time; the checklist resumes where it was.

Images: `../../images/ux/home/complete-the-provide-basic-info-task-in-quick-start--01.png`.

### 2.2 Dashboard

Layout:
- Header: h1 "Dashboard"; line tabs "Insights" | "All workspaces" with a "Beta" pill. The page is per workspace.
- Readiness overview: one card per framework (logo disc, name, a green or orange bar, "Framework readiness"), facts "Ready controls 100%", "Requirements 229", "Controls 1"; paged "1-3 of 42" with first/previous/next/last arrows. A framework at 0% is not drawn.
- Notifications card: rows "Active audit" over the framework name (SOC 2 Type 2, ISO 27001:2022, HIPAA) with an orange comment-count chip (16, 5, 7, 2) and a chevron.
- Test trends: "Total failing tests" 117 in red with "↗149%"; a table Category | Failing tests (Infrastructure 68 "↗2167%", Custom 2 "↗100%", Observability 9 "↗50%", Policy 27 "0%", In Drata 6, Device 3, Identity Provider 2, Ticketing 0, Version Control 0), every row with a chevron. The percentage compares with the previous seven days.
- Policies: a donut with 746 Policies; legend Active 440, Needs approval 108, Renews soon 52, Past due 78, Ready to publish 68.
- Vendor risk levels: a donut with 467 Vendors; High 58, Moderate 20, Low 49, None 340.
- Connections: "Failed" 8 in red, "Out of 84 total". Personnel: "Noncompliant" 4, "Out of 480 total".
- Task forecast: a month bar chart (Dec to Mar, axis to 1350) with an outlined "View all tasks"; then "Upcoming Tasks · Within the next 6 months" grouped by kind (General, Control Approval, Misc. Evidence), each row with "⚠ Past due 6 months ago" in red.
- Failing tests drawer (from a category row): "3 of 9" with Previous ↑ / Next ↓ and Close; a trend chip "↗50%"; title "Failing tests: Observability"; a list of test links, each with the date it began failing, newest first.

Flow edges:
- → framework card → Controls, filtered to In scope and that framework.
- → notification row → the audit or Trust Center item.
- → Test trends category → failing tests drawer → test link → the test record (2.14).
- → Policies, Vendor risk, Connections or Personnel card → that register.
- → task row → the item that owes the work; → View all tasks → Tasks.

Images: `../../images/ux/home/dashboard-overview--01.png`, `../../images/ux/home/dashboard-overview--03.png`.

### 2.3 Recommendations (AI control mapping)

Layout:
- Nav: Recommendations expands to "Controls" and "Requirements". Header: h1 "Recommendations"; outlined "Import controls" at top right.
- A gradient-bordered AI banner with a sparkle disc: "Improve your compliance posture with these recommendations", then a count of controls with suggestions and a note that accepted mappings apply at once; dismissible.
- Stat row with icon discs: Controls to Review 3, Requirements 251, Tests 6, Evidence 1, Policies 5, Risks 13.
- Left filter panel: Confidence (High, Medium), Object type (Test, Policy, Requirement, Evidence, Risk), Framework (a "Search frameworks" combobox).
- One card per control: a mono ID chip ("CCOA-2", "CC-IR-003"), the control name in bold and its description; "Recommendations" with one row per object type: a blue type chip (Requirements, Monitoring, Policies, Risks) and a grey count chip ("130 requirements", "4 tests", "2 policies", "4 risks"), an ⓘ, then "Dismiss" (text) and "Map" (outlined) at the row's end.
- Card footer: "Review" (filled), "Map all" (outlined), "Dismiss" (text).
- The ⓘ popover lists the suggested items with their confidence ("A1.1 Confidence: High", "CC7.1", "164.308(a)(8)") and "View all".
- Review drawer: "1 of 3", Previous ↑ / Next ↓, Close; the control's name with "Map all objects"; "Custom control description"; a section per type ("Policies" with a "⋯" offering "Map all Policies", "Dismiss all Policies"); each suggestion a card with the linked name, "Confidence: Medium ⓘ", its text, a "Rationale" paragraph naming the DCF control it came from, then "Map policy" (outlined) and "Dismiss policy".
- Nothing maps without a click; there is no map-everything-in-the-queue verb.

Flow edges:
- → Import controls (CSV or manual) → recommendations generated for the new controls.
- → Controls register → tick custom controls → selection bar "Recommend objects" → they join the queue (DCF controls are ignored; the verb hides if only DCF rows are ticked).
- → card Map / Dismiss per type, or Map all → mappings appear on the control at once.
- → Review → drawer → per item or per section → Next through the queue.

Images: `../../images/ux/home/ai-assisted-custom-control-mapping-to-grc-objects--04.png`, `../../images/ux/home/ai-assisted-custom-control-mapping-to-grc-objects--05.png`, `../../images/ux/home/ai-assisted-custom-control-mapping-to-grc-objects--06.png`.

### 2.4 All Connections

Layout:
- A second-level nav inside Connections: "All Connections"; heading "Manage accounts" over Access Reviews, Background Checks, Infrastructure, Observability, Version Control.
- Header: h1 "All Connections"; outlined "Custom connection" at top right (the Active tab). Line tabs "Active" | "Available".
- Available: Filters and Search over a three-column card gallery. Each card: logo, name (with a sub-name, "& AWS Organizational Units"), "Categories" with grey chips (CSPM, Automation tools, Ticketing, User access review, Infrastructure), and an outlined "View and connect".
- Active: the side filter panel with "Operational status" (Healthy, Unhealthy, as radios) and "Category" checkboxes (Access Review, Audits, Automation tools, Background check, Codebase, …); cards carry a health chip ("Healthy", pale blue), the category chips, "Sync duration - 79 ms" and a "View details" link.
- About two dozen categories, from Automation tools to Vulnerability; the suggested connection order is identity, infrastructure, version control, ticketing.
- Health: Healthy when every sync step finished; Unhealthy when any step erred. Not live; the page must be refreshed.

Flow edges:
- → Available card → View and connect → the vendor's setup drawer or guide → the card moves to Active.
- → Active card → View details → connection record (2.5).
- → Operational status Unhealthy → the connections to fix.
- → Custom connection → 2.7.

Images: `../../images/ux/connections/understanding-connections-in-drata--01.png`, `../../images/ux/connections/understanding-connections-in-drata--02.png`.

### 2.5 Connection record and connection priority

Layout:
- Trail "← All Connections"; logo and h1 (Atlassian, Google Cloud Platform); "Delete connection" in red with a bin icon at top right.
- Facts row: Status (chip "Healthy" pale blue, or "Unhealthy" pale red), Account alias with a pencil, Created by, Account ID.
- Line tabs: Overview | Manage.
- Overview, "Sync status" card: one row per sync step, a check disc and the step name ("Access Review App Users"), expandable.
- When Unhealthy, an AI card with a gradient border inside Sync status: "Understand your Google Cloud Platform sync failures", an Overview paragraph on the cause and its compliance effect, the steps, "Generated May 15, 2026 at 3:07pm", "Refresh summary", thumbs up/down and copy. New sync data invalidates it and "Generate summary" returns.
- "Setup Details" card: a line on how to reauthorise and an outlined "Update Connection".
- Right rail "Benefits": expandable count cards: 4 Impact areas, 23 Controls, 19 Tests (what this connection feeds).
- On an IdP or HRIS record, "Configure connection priority" opens a dialog: a short explanation (the top-ranked source wins name and email; HRIS decides employment status when one is connected), a warning that reordering may move compliance status, then a drag list with rank discs "1 Okta", "2 CSV"; "Cancel" and filled "Save Changes".

Flow edges:
- → All Connections → View details → here.
- → Unhealthy → AI card → fix permissions at the provider → Refresh summary.
- → Update Connection → vendor install page → back, reconfirmed.
- → Configure connection priority → reorder → Save Changes → attributes re-resolve within 24 hours → Personnel to mark duplicates "Out of scope (ignore)".
- → Benefits › Controls or Tests → what the connection feeds.

Images: `../../images/ux/connections/understanding-connections-in-drata--03.png`, `../../images/ux/connections/understanding-connections-in-drata--04.png`, `../../images/ux/connections/integrate-multiple-identity-and-hris-connections--03.png`.

### 2.6 Manage accounts (infrastructure and version control)

Layout:
- Same second-level nav; h1 "Manage Infrastructure Accounts" (or the Version Control, Access Reviews, Background Checks, Observability equivalents).
- Header buttons, both outlined: "Sync ⌄" (resync now, per provider) and "Download ⌄".
- Toolbar: Filters, a column-settings gear, "Search by username or email…".
- Columns, each header with a "⋯" menu: Source (provider logo and account type, "AWS - IAM"), Status, Personnel, Account ID, Client alias, Access revoked (a date), Database access, Admin access, MFA. Version control swaps in Write Access and Merge to default branch, as checkboxes that record what access is intended (they change nothing at the provider).
- A red left edge marks rows that need attention; status chip "Not linked" (pale red); the Personnel cell is an outlined "Link personnel" picker.
- Row "⋯" menu: "Mark out of scope", which asks for a rationale; later the same menu shows the rationale or marks it back in scope, or unlinks a person.
- An account deleted at the provider stays, with an Access revoked date, as the audit trail for removal SLAs.

Flow edges:
- → Connections › Manage accounts › Infrastructure → row → Link personnel → pick a person → linked.
- → row ⋯ → Mark out of scope → rationale → excluded from tests, kept for audit.
- → Sync ⌄ → choose provider → resync now, instead of waiting for the nightly run.
- → an MFA column failure → the MFA test's guide.

Images: `../../images/ux/connections/manage-connected-infrastructure-accounts--01.png`, `../../images/ux/connections/map-accounts-to-personnel-in-drata-new-experience--02.png`.

### 2.7 Custom connection

Layout (an older screen, under a "Settings › Connections › Password Policy" trail):
- h1 the connection's name; "Delete connection" in red; facts Status ("Active", pale green) and "Connection made by" with avatar.
- Line tabs: Overview | Manage | Monitoring.
- Manage: a table Last updated (sortable, "Feb 05, 2025 @ 10:24:32 PM") | Record ID | Display Name | Resource name, each row with "View Data" and a bin; "10 per page" and "1-1 of 1" pagers. A collapsible right panel lists the API calls (curl samples for upload).
- Creation: name, description, workspace; then a data source with a JSON Schema or a sample payload ("Validate" or "Generate"), a display-name field, and an API key (new, or existing with the right scopes).
- Push rules: one top-level string or number field becomes the record's display name; 5 MB per body; 500 requests a minute; 201 on create, 200 on update by id.

Flow edges:
- → All Connections → Custom connection → name, schema, API key → push JSON → Manage shows records → View Data.
- → Monitoring tab or Monitoring › Create test → a custom test over this data (2.17) → map to controls.

Images: `../../images/ux/connections/part-1-custom-connections-and-tests--02.png`.

### 2.8 Controls register

Layout:
- Header: h1 "Controls"; outlined "Create control ⌄" (Create a single control, Create/Update in bulk).
- Left filter panel: Status (In scope, Out of scope), Framework (a search combobox), Readiness (Ready, Not ready), Monitoring, owner and approval filters (No approvers assigned; the approval stages).
- Toolbar: Filters, a column-settings gear, "Search controls by name, description, code or requirements…", "Download ⌄" (CSV, owners included). Under it, "Filters applied:" with removable blue chips ("In scope ×", "Ready ×") and "Clear all".
- Columns, each with a "⋯" menu: a checkbox, a small blue count badge (a diamond icon and a number: the control's open items), Control code, Name (bold, with two lines of description beneath), Owners (avatars, or an "Assign owners ⌄" picker in the cell), Frameworks (grey chips "SOC 2", "CCPA", "ISO 27001:2022", "+2"), a chevron.
- The Control code is itself the status: a mono chip, green with a check when Ready ("DCF-665"), red with a crossed icon when Not ready ("DCF-37").
- Selection bar, floating at the bottom: "10 Selected", "Select all 363", "Mark out of scope", "Mark in scope", "Assign/remove control owners", "Add approvals" (or "Delete approvals"), and "Recommend objects" when custom controls are ticked.
- No delete: a control is marked out of scope instead, and scope applies to every framework it maps to.

Flow edges:
- → Dashboard framework card → here, filtered In scope and the framework.
- → Create control → Create control form (Name, Code, Description required; then requirements, tests, evidence, policies) → Save.
- → Create/Update in bulk → upload CSV → map Incoming fields to Destination fields → map values → validate (red invalid, yellow warning cells) → Submit.
- → tick rows → selection bar verb → modal (owners, approvers and deadline, or scope reason) → Save.
- → row → control record (2.9).

Images: `../../images/ux/controls/manage-required-approval-and-control-readiness--06.png`, `../../images/ux/controls/create-edit-and-manage-controls--01.png`.

### 2.9 Control record

Layout:
- Trail "Controls /"; the code chip in status colour ("DCF-879", red when Not ready) beside the h1 name; "⋯" and, when approvals are set up, a filled "Send to approvers" at top right.
- Facts row: Owner (avatars, "+3 more", pencil), Frameworks (chips, "+2 more", pencil), Linked workspaces (chips, pencil).
- Line tabs: Overview | Evidence | Monitoring | Policies | Frameworks | Risks | Workflows; a pale red count badge on a tab that holds problems ("Monitoring 1", "Policies 3").
- Overview, Readiness card: one bar with "6 of 11"; its tooltip: Evidence 4/4 ready, Monitoring 1/2 tests passing, Policies 1/4 published, Approvals 0/1 approved. Progress counts ready over ready plus not ready, leaving out what is not factored or out of scope.
- Four readiness cards: Evidence, Monitoring, Policies, Approvals. Each a state ("Ready" with a check disc, "Not ready" with a crossed red disc, or "Not factored" in plain text), then a small legend with counts:
  - Evidence: Ready 4, Not factored 3.
  - Monitoring: Failing 1, Passing 1, Error 2, Not factored 1.
  - Policies: Not published 3, Published 1.
  - Approvals: Needs approval 1.
- An empty card offers its first verb instead: Evidence "Add evidence", Monitoring "Map tests", Approvals "Set up approvals".
- Not factored (counted neither way): tests that are inactive, not tested or disabled, non-production or erroring.
- Info card with Edit: Name, Code (editable on custom controls only), Description, Short text, Question, Activities. Edit mode ends in "View latest template" on a DCF control (2.11).
- Owners card with "Assign"; empty: "No owners assigned".
- Review and approval card (2.10).
- Policies tab, a table: Name, Version ("Draft"), Status ("New"), Renewal date (with "⚠ Renewal past due" in red under it), Owner, Linked workspaces; the toolbar has Download, "Compare to defaults" and outlined "Map policies".
- Monitoring and Frameworks tabs carry "Compare to defaults" too: a modal of current against default mappings, "Keep current configuration" or "Apply defaults" (DCF controls only).
- Evidence tab: link library evidence, or create miscellaneous evidence that lives only on this control (file or URL, with creation and renewal dates).
- Right utility rail (comment, ticket, flag icons; "»" expands it): "Internal notes", a 191-character note box with Save, and "No notes yet". Notes are not shared with auditors; owners and approvers get an email.

Flow edges:
- → Controls row → here.
- → a readiness card → the matching tab.
- → Map tests / Map policies / Add evidence → a picker modal → mapped → the card recounts.
- → Info Edit → Save → "See all updates" → Events (2.22).
- → utility rail → note, ticket (Jira and others) or task.

Images: `../../images/ux/controls/manage-required-approval-and-control-readiness--01.png`, `../../images/ux/controls/create-edit-and-manage-controls--03.png`, `../../images/ux/controls/annotate-a-control--01.png`, `../../images/ux/controls/map-policies-to-controls-in-drata--02.png`.

### 2.10 Required approval on a control

Layout:
- Before set-up, the Approvals readiness card reads one line on what approval does and offers "Set up approvals"; the Review and approval card offers "Set up" over a "Required approvals" explainer.
- Set-up refuses a control with no owner (a banner and an Owners "Assign"); then approvers (any one of them suffices) and an approval deadline; Save.
- Once set up: a bin (red outline) and "Edit"; facts "Stage" and "Approval deadline" ("October 31, 2025"); the approvers listed with avatar and name; a filled "Send to approvers".
- Stages, as chips: "Prepare for approvers" (pale orange), "Needs approval" (pale orange), "Changes requested", "Approved".
- Readiness turns Ready only when the other cards are ready and the approval is given.
- 14 days before the deadline an Approved control returns to Needs approval; mapping a new policy resets it to Prepare for approvers; adding evidence asks "Send to approvers" or "Still working".
- Changes requested writes the request into Internal notes and makes a task.
- With every approver gone, a banner asks for a new one.

Flow edges:
- → Set up → owners check → approvers, deadline → Save → Send to approvers → approver's task → Approve or Request changes.
- → Controls selection bar → Add approvals (the error names any control without an owner) or Delete approvals (history kept).

Images: `../../images/ux/controls/manage-required-approval-and-control-readiness--01.png`, `../../images/ux/controls/manage-required-approval-and-control-readiness--02.png`.

### 2.11 Compare with Drata's template

Layout (a modal):
- Title "Compare with Drata's template"; a short explanation and a "Learn about Drata's control templates ↗" link.
- Three columns: "Current control" | "Drata's template" | "Selections".
- Rows per field, in monospace: Control name, Control code ("DCF-489"), Control description, Control question; the current side tinted red where it differs, the template side tinted green.
- Selections: an "Apply all" checkbox, then a dropdown per changed field, "Apply" or "Reject".
- Footer: "Cancel" (outlined), "Confirm selections" (filled).
- With no difference, a message says so instead.
- Applying writes the event "Drata's templated control language applied".

Flow edges:
- → DCF control → Info Edit → View latest template → this modal → per field Apply or Reject → Confirm selections → control updated and an event logged.

Images: `../../images/ux/controls/revert-a-control-to-drata-s-latest-dcf-template--02.png`.

### 2.12 Framework requirements and the mapping export

Layout:
- Header: a framework logo disc and h1 "CCM v4"; "⋯" at top right.
- Facts with ring gauges: "Readiness (by controls)" 13%, "Requirements ready" 0/186, "Controls ready" 31/258; "Description" with "Read more".
- Left filter panel: Scope (In Scope, Out of Scope), Readiness (Ready, Not Ready), Domain (Audit and Assurance, Application and Interface, …).
- Toolbar: Filters, gear, Search, "Download ⌄"; "Filters applied: In Scope ×".
- Columns: checkbox, row "⋯", Status (chip "Not Ready", pale red with a crossed icon), Code ("A&A-01"), Title, Controls (a count, 20), Scope ("In scope"), chevron.
- Download menu in two groups: "Download all requirements" › Requirements to controls, Controls to requirements; "Download filtered view" › the same two. CSV; out-of-scope controls are left out.

Flow edges:
- → Compliance › Frameworks → a framework → here → requirement row → its mapped controls.
- → Download → one of four CSVs for the auditor.

Images: `../../images/ux/frameworks/export-control-to-requirement-mappings--01.png`.

### 2.13 Monitoring (tests register)

Layout:
- Header: h1 "Monitoring tests"; line tabs "Production" | "Codebase".
- Production summary, two cards:
  - "Daily activity", which can be empty: an illustration, "No insights to show" and one line saying no failing test meets the insight bar.
  - "Result summary": a donut "27% Passed" with Passed 64, Failed 142, Error 33; beside it "Mean time to remediation" 6 days with "↘-16% in the last 7 days" in green. Draft tests are left out of these numbers.
- Codebase summary instead: Repositories monitored, Failed tests, Passed tests (infrastructure-as-code scans).
- Toolbar: Filters, gear, Search, and an outlined "Create test" at the toolbar's end (not in the header). "Filters applied: Failed ×", "Clear all".
- Columns, each with "⋯": checkbox, row "⋯", Name (with a grey "Draft" chip before custom drafts, "New" for 45 days on new Drata tests), Result, Findings (a grey count pill, 421, 1000, 3, or "—"), Status, Category, Active connections (provider logos, "+7"), chevron.
- Result chips: "Passed" (pale green), "Failed" (pale red), "Error" (pale orange), "—" while running.
- Status cell: a two-way segmented toggle "Enabled | Disabled" in the row, or a grey "Testing…" chip while a run is under way. Status words in filters: Enabled, Disabled, Unused (a missing connection or no policy draft), Testing.
- Filters: New, Result, Status, Category (Device, Identity Provider, Infrastructure, Observability, Policy, Version Control, Ticketing, In Drata), Type (Drata, Custom draft, Custom published), Has exclusions, Connection, Control, Framework, Tickets (In progress, Done).
- Selection bar: "10 Selected", "Select all 179", "Test now", "Enable", "Disable", "More" (Publish for drafts, Download CSV).
- Row "⋯": "Test now", or stop a running test.
- Disabling asks for a business rationale, which stays visible. Tests run nightly on their own ("Autopilot").
- Mapped tests move readiness; unmapped ones only inform.

Flow edges:
- → Compliance › Monitoring, or a Dashboard failing-test link → here.
- → row → test record (2.14).
- → toggle Disabled → rationale → saved; the control's Monitoring card stops counting it.
- → Create test → custom test builder (2.17).
- → tick drafts → More › Publish → they start counting.

Images: `../../images/ux/monitoring/monitoring-overview--01.png`, `../../images/ux/monitoring/monitoring-overview--03.png`, `../../images/ux/monitoring/manage-tests-in-monitoring-page--01.png`.

### 2.14 Test record

Layout:
- Trail "Monitoring /"; h1 the test name ("Terminated Version Control Accounts Removed"); at top right a text link "Go to evidence" and an outlined "Test now". No filled primary.
- Facts row: Latest test result (chip "Error", "Failed" or "Passed"), Latest test run ("Jan 13, 2026 at 9:51pm"), Test lifecycle ("Production"), Category ("Version Control").
- Line tabs: Overview | Findings | Exclusions | Controls | History.
- Overview, Next steps card, three tiles:
  - Track: "Days erroring" or "Days failed" with a big number in red or orange beside a warning or calendar disc (1, 52), then "since Jan 13, 2026 at 9:50pm".
  - Fix: "Failing resources" with a big red number and a red ✕ disc (250) and "View findings"; or, on an error, one line on where to look and "View history".
  - Manage: "Tickets in progress" (1 or 0) with "View tickets", "Create ticket".
- Details card with "View instructions" (outlined): Description, Test type ("Drata", "Drata custom"), Status as the Enabled | Disabled toggle, "View help article ↗".
- Latest result card: a status chip, "Tested a few seconds ago", and a sentence on why; on a failed custom test, the AI card (2.15).
- Supported connections card: each provider with a green "✓ Connected" chip and "View"; a provider in error carries an orange "⚠ Error" chip; an info line ("Bitbucket is not enabled for this workspace"); an "Unused connections" accordion.
- Historical results card: "Download", outlined "View history"; a monthly grouped bar chart of runs (Passed, Failed, Error), twelve months.
- Custom tests add a Test logic section.
- Findings tab: Filter, gear, Search, "Download findings" (a ZIP of a remediation PDF and a CSV, prepared in the background with a toast). Columns: checkbox, Resource name, Region, Connection (logo and name), Account ID / alias, chevron; personnel tests show Applicable personnel and Email instead. Tick findings → "Exclude" → rationale → Submit.
- Exclusions tab: "Download exclusions"; columns Resource name, Region, Connection, Connection ID / alias, Account name / ID, Group, Excluded by (avatar, "Drata Support" for system exclusions), Date excluded, Reason. Selection bar: "8 Selected", "Update reason", "Remove exclusions". "N/A" marks an exclusion whose resource has left the results.
- Controls tab: mapped controls, map or unmap, "View details" for each control's readiness.
- History tab: every run, newest first; a run opens its event with raw JSON.
- Right utility rail: notes, tasks, tickets.

Flow edges:
- → Monitoring row, a control's Monitoring tab, or the Dashboard drawer → here.
- → Test now → "Testing…" → a new result.
- → View findings → Findings → a row → finding drawer (2.15).
- → Create ticket → a ticket in the connected tool, counted under Manage.
- → Go to evidence → the run's audit event (2.22).
- → Controls › map → the control's Monitoring card recounts.

Images: `../../images/ux/monitoring/view-and-manage-test-details-new-experience--02.png`, `../../images/ux/monitoring/view-and-manage-test-details-new-experience--03.png`, `../../images/ux/monitoring/view-and-manage-test-details-new-experience--06.png`.

### 2.15 Test finding drawer and AI failure summary

Layout:
- Finding drawer over the test page: "1 of 10", Previous ↑ / Next ↓, Close; title the person or resource ("Adam …").
- "Take action" card: one line on what the fix does (email the person instructions to enable MFA) and a filled "Fix finding". Where Drata cannot fix it, "Learn More" takes its place; on a passing test neither shows.
- Below: a line on how the test checks; facts Test lifecycle, Date created, Connection (logo, "Okta"); then "Finding details".
- AI summary, on a failed custom test only, inside Latest result: a gradient-bordered card with a sparkle disc, "Summary of test failures", one line of what it lists, and an outlined "✧ Generate summary" in magenta. It writes a CSV of each failed resource (provider, account, resource name and ID, explanation). Admins switch it on in Settings › AI settings.

Flow edges:
- → Findings row → drawer → Fix finding → reminder email → Next to the following finding.
- → Generate summary → CSV download → share with engineering.

Images: `../../images/ux/monitoring/integrate-multiple-identity-and-hris-connections--04.png`, `../../images/ux/monitoring/enable-ai-summaries-for-tests--01.png`.

### 2.16 Test Library and template page

Layout:
- Nav: a "Library" group at the bottom with "Tests". Header: h1 "Test library"; "Give feedback" link at top right; facts "Total tests 1227", "In use 233", "Not in use 994".
- Left filters: Usage (In use, Not in use, New), Rating (Essential, Recommended), Categories, Frameworks, Connections (search comboboxes; active and inactive connections labelled), then Resources once an infrastructure connection is picked.
- Toolbar: Filters, gear, "Search by name or description". Columns: checkbox, a row "⋯" only on templates already in use, Template name, Description (cut), Category, Rating, Last updated. Footer "50 per page", "651-700 of 1227".
- Selection bar: "Add to program".
- Template page: "← Back to Test Library"; h1; filled "Add to program" at top right; facts Categories, Rating ("Essential"), Last updated; tabs Overview | Mappings.
  - Info card with "View instructions" (outlined): Name, Description, Categories, Rating, Last updated.
  - "Tests using template" card: a table Name | Workspace with an outlined "Manage" on each row, "1-10 of 16".
  - Mappings card with "View all": "Associated frameworks (3 of 27)" with logo discs (CCM, CCPA, CCPA (2026)), "Mapped controls (3 of 3)" with DCF chips.
- "View instructions" drawer: a gradient AI notice ("This content was pre-generated by AI. Please review carefully.") with "Send feedback", then the setup steps ("Permissions:").
- "Add to program" modal: "ⓘ You are adding 4 tests", "Choose workspaces" (only workspaces that hold the needed connection; empty: "No results for "". Try another criteria."), a note that drafts do not move readiness, "Select state" Draft | Published, "Cancel" and "Add". Tests that cannot be added (no connection, legacy) are named in a follow-up modal.
- A legacy test's page reads "This test cannot be managed in Drata Library" and greys out Add to program.
- "Program" here means everything the tenant manages: controls, risks, policies, frameworks, connections, tests.

Flow edges:
- → Library › Tests → filter → tick → Add to program → workspaces, Draft or Published → Add → the tests appear in Monitoring.
- → template row → template page → Manage on a copy → that test's record.
- → enabling a framework provisions its Drata tests on its own; the 1,000-odd AI-written tests are only ever added by hand.

Images: `../../images/ux/monitoring/test-library-new-experience--01.png`, `../../images/ux/monitoring/test-library-new-experience--03.png`, `../../images/ux/monitoring/test-library-new-experience--05.png`, `../../images/ux/monitoring/add-tests-from-the-test-library-to-a-workspace-new-experience--02.png`.

### 2.17 Custom test builder

Layout:
- A full page: "← Back to Monitoring"; h1 "Create test"; sections Details (Test name, Description, both shown to auditors) and Logic.
- Logic: "Evaluation threshold" with a sentence that restates the choice ("This test will pass if all results meet the conditions below"); the choices are All results must pass, At least one result must pass, Only one result may fail. Then Category, Provider and accounts.
- "Condition Group": Service and Resource selects; an "Advanced editor" toggle (JSON for nested properties and arrays); a box of rows Attribute | Operator | Value with "+ Add condition".
- "Filtering criteria", deletable: an "Exclude | Include" segmented toggle and the same Attribute | Operator | Value rows ("project").
- More condition groups for other resource types; a service once used drops out of the next group's list. Changing service or resource after setting conditions may reset them.
- Right panel "Resource guide", opened from an ⓘ in the rail: Provider ("Filter by provider"), Service, Resource ("Choose a resource"); empty: "Select a provider to get started" and one line. Once chosen, an attribute dictionary of the resource's fields.
- Save creates a draft: it runs and shows results, but does not move readiness and is not shown to auditors (its runs log as "Autopilot Draft Test"). Publish removes the Draft chip, allows mapping and tickets, and starts audit evidence; editing a published test opens a new draft over it.

Flow edges:
- → Monitoring › Create test → details → logic → condition groups → Save → draft in Monitoring.
- → draft record → Publish (or bulk from Monitoring) → map to controls → counts toward readiness.
- → custom connection (2.7) → a test over its pushed records.

Images: `../../images/ux/monitoring/create-and-publish-custom-tests--01.png`, `../../images/ux/monitoring/create-and-publish-custom-tests--02.png`.

### 2.18 Evidence Library

Layout:
- Header: h1 "Evidence"; a filled "Create evidence ⌄" (Create a single evidence; Bulk import, "Import evidence from CSV").
- Left filters: Status (Needs artifact, Needs renewal, Upcoming renewal, Ready, Error), Source (File, URL, Ticket, Test), Evidence owner (search), Framework (SOC 2, ISO 27001:2013, …).
- Toolbar: Filters, gear, "Search evidence by name or control".
- Columns: checkbox, row "⋯", Name, Status, Renewal date, Source, Controls, and in the older layout Linked workspaces, Owner (avatar and name) and "SafeBase Trust Library Status" ("In progress", "Synced", or "—" where not eligible).
- Status in the row: "⚠ Needs artifact" in red text with an icon; "Ready" in plain text. Source: "File - Local", or "—".
- Controls cell: a red ring around a controls icon, with Ready and Not ready counts beside it; in the older layout, control chips "✕ DCF-531" in red or "✓ DCF-96" in green.
- Older layout row actions: a filled "Update" on items that need an artifact, a download icon, or an outlined "View file".
- Footer: "50 per page", "1-50 of 207".
- Selection bar: "9 Selected", "Select all 118", "Assign evidence owner", "Delete evidence", "Sync to Trust Library".
- Delete confirmation: "Are you sure"; permanent, and it unlinks every control. Test evidence cannot be deleted; fix or disable its test instead.
- Statuses and their weight on readiness: Needs artifact (hurts), Needs renewal (hurts: past its renewal date), Upcoming renewal (still helps: renewal within two months), Ready (helps), Error (counts neither way: its test erred).
- An evidence owner is separate from the control owner.

Flow edges:
- → Compliance › Evidence, or a control's Evidence card → here.
- → Status Needs artifact → row → evidence record → Add new artifact.
- → Create a single evidence → name, description, implementation guidance → source (File, URL, Ticket provider, or No Artifact) → creation and renewal dates → map controls → Save.
- → Bulk import → 2.20.
- → tick → Delete evidence → confirm.

Images: `../../images/ux/evidence/bulk-import-evidence--01.jpg`, `../../images/ux/evidence/drata-evidence-library-sync--02.png`.

### 2.19 Evidence record

Layout (the screenshot is the older layout, trail "Evidence Library › …"):
- h1 the evidence name; "⋯" at top right.
- Facts row: Status (chip "◇ Needs Artifact" in red), Evidence owner, Workspaces (chip), Source, SafeBase Trust Library Status.
- A full-width pale red banner when the artifact is missing: "This evidence needs an artifact", one line that linked controls may read not ready, and a filled "Add new artifact".
- Line tabs: Details | SafeBase Trust Library.
- Overview card with "Edit": Name, Description, Implementation guidance, Evidence Owner.
- Linked controls card with "Link Controls": each control as an expandable row with its code chip in status colour ("✕ DCF-531").
- "Current artifact" section: view the artifact, add a new one, change creation or renewal date. With multiple artifacts switched on, one item holds several files and URLs.

Flow edges:
- → Evidence row → here.
- → Add new artifact → file, URL or ticket → dates → saved → status turns Ready → linked controls recount.
- → Link Controls → pick → linked.

Images: `../../images/ux/evidence/drata-evidence-library-sync--06.png`.

### 2.20 Import or Update Evidences

Layout (a near-full-screen modal over the Evidence page):
- Left rail: the Drata mark, "Import or Update Evidences", "Upload Artifact Files Here", and under "START HERE" a sheet entry "Evidence" with a red dot and its count.
- The sheet: a tab "Evidence"; toolbar Filter, search, "Actions ⌄"; "1 Records"; a segmented "All | Valid | Invalid 1" in red.
- Header right: "Download validation results" (outlined), "Submit" (disabled until no red cell remains).
- Columns: Name, Description, Implementation Guidance, Steps to Reproduce, Owner, Controls, Renewal Date, Renewal Schedule, Sync to SafeBase, Collected Date, Artifacts (Files), Artifacts (URLs). Owner, Controls and Renewal Schedule are dropdowns filled from the workspace.
- Red cells are errors; yellow cells are warnings ("an item with this name exists", so the row will update it). Hovering a header shows its rules.
- Files tab: an "Add files" drop zone; a ZIP is expanded; a CSV artifact needs "Attach as evidence artifact" from its row menu, confirmed by an "Artifact Attached" dialog with Continue.
- Submit shows a confirmation with the totals; "Import evidence" runs it.

Flow edges:
- → Create evidence ⌄ › Bulk import → upload files → upload CSV or "Manually enter data" → map fields → map values → fix red cells → Submit → Import evidence → the library refreshes.

Images: `../../images/ux/evidence/bulk-import-evidence--08.jpg`.

### 2.21 Audit Hub request: attach evidence

Layout:
- Trail "Audits / SOC 2 Type 2 /"; a grey ID chip "AR7" and h1 "Code Change Population"; a filled status menu "New ⌄" at top right.
- Facts: Status ("○ New"), Framework ("SOC 2"). A blue info banner that auditors can open audit pages too, with "Learn about audit pages ↗".
- Line tabs: Overview | Evidence | Controls. A right rail with a messages icon.
- In the message panel, "Add attachment" offers "Attach from Evidence", "Create evidence", "Attach file only".
- "Attach from Evidence" modal:
  - "Choose evidence": only Ready or Upcoming renewal items not already on the request; one dated after the audit's end is added to the comment only.
  - "Map control": limited to the request's controls.
  - Footer: "Create evidence" (outlined, left), "Cancel", "Attach evidence" (filled).
- "Create evidence" from a message: three steps (Add artifact, Select source, Map controls), then Finish; the message draft waits beside the form.
- "Attach file only" keeps a one-off file in the audit's messages, never in the library.

Flow edges:
- → Compliance › Audits → audit → request → messages → Add attachment → Attach from Evidence → pick and map → Attach evidence → Save → the auditor sees it on the request and its controls.

Images: `../../images/ux/audits/link-to-evidence-from-audit-hub-requests--01.png`, `../../images/ux/audits/link-to-evidence-from-audit-hub-requests--03.png`.

### 2.22 Events log and event record

Layout:
- Nav: Events, in the Workspace group. Header: h1 "Events"; no button.
- Left filters: Category, Type, User (each a search combobox).
- Toolbar: Filter, gear. Columns: User (a person, or "Autopilot"), Timestamp, Category, Connection, Account ID / alias, Result, Type, Description.
- Events are read-only and cannot be deleted.
- Event record: trail "Events /"; h1 "Audit event"; a Details card; a "Raw event JSON" card with "Download" (outlined) and "Copy". Download offers a PDF (JSON plus context and notes) or TXT (JSON only); a toast says when the file is ready.
- Right rail "Internal notes": one line that notes are not shared with auditors; a Note box (0/5000), "Add attachment", "Save". Notes go into the event PDF; with attachments, the download becomes a ZIP.
- A custom test's event PDF holds its logic, the resources judged, the exclusions with reasons, and the raw responses.

Flow edges:
- → Events → filter → row → event record → Download PDF for the auditor.
- → a control Info save → "See all updates" → here.
- → a test's "Go to evidence" or a History run → its event.

Images: `../../images/ux/events/events-overview--01.png`, `../../images/ux/events/annotate-an-event--01.png`.

### 2.23 Policies register

Layout:
- Nav: Governance › Policies (beside Personnel, Access Review). Header: h1 "Policies"; filled "Create policy" (with an external policy source connected, "Import external policy" takes its place and creation is off).
- A dismissible blue info banner on renewal dates: yearly acknowledgement is common; tasks and tests run off the date; the default is a year from approval or creation.
- Line tabs: "Active" | "Archived and replaced".
- Four stat cards: Renewal required soon 48, Renewal past due 105, Needs approval 122, Ready to publish 81.
- Toolbar: Filter, gear, "Search by name…", "Download all" (a ZIP, ready-toast); "Filters applied: All statuses ×, All renewal statuses ×".
- Columns: row "⋯", Name, Version (a grey chip "V4.5"), Status (chip "Approved", pale yellow), Created on (with "Authored custom" under the date), Approved date, Published on ("—" if never), Renewal date (with "⚠ Renewal past due" in red where it applies), SLA ("monitored by Drata" on policies that carry an onboarding SLA).
- Row "⋯": Edit policy, Archive policy, Delete draft (Draft versions only), Download published version PDF, Download draft version PDF.
- Empty filter result: the stat cards stay; the table shows an empty-results state.
- Lifecycle words: Draft (header chip) / New (status before finalizing), Needs approval, Changes requested, Approved, Ready to publish, Published, Archived.
- Archiving removes the policy from evidence and disables its mapped tests; some core templates cannot be archived and are replaced instead. Restore lists the tests it will re-enable.

Flow edges:
- → Dashboard Policies card → here.
- → stat card → the register filtered to that state (inferred from the card's shape).
- → row → policy record (2.25); → Create policy → wizard (2.24).
- → ⋯ Archive policy → confirmation → Archived and replaced tab → ⋯ Restore.

Images: `../../images/ux/policies/archive-and-restore-policies--02.png`.

### 2.24 Create policy wizard

Layout (a full page, "← Back to Policies", h1 "Create policy"):
- Left stepper: 1 Source, 2 Details, 3 Personnel groups, 4 Replace policies; done steps become dark discs with a check.
- Step 1, "What is the source of the policy content?": two radio cards, "Upload existing policy file" and "Author policy in Drata". Upload shows source tabs (Upload from computer, Google Drive, OneDrive, SharePoint, Box, Dropbox), "Select Policy File", 25 MB, a dashed drop zone with "Upload a file" and the accepted types.
- Step 2, Details: Policy name, Description, Renewal date, Owner, Disclaimer (optional).
- Step 3, Personnel groups: All personnel (the test fails if anyone has not acknowledged), Specific groups (IdP groups; new members are added at the next sync, with an option to notify them), or none (stored and tracked, never shown for acknowledgement; its acknowledgement test must then be disabled).
- Step 4, "Should this policy replace any Drata default policies? (optional)": a list of what replacing does (moves control and test mappings and SLAs, archives the default), then "Yes, replace default policies" / "No, keep as separate policy".
- Footers: "Cancel" or "Go back" (outlined, left), "Continue" or "Finish" (filled, right).
- Replacing applies at once, even before the new policy is published, so the mapped controls may read Not ready until it is.

Flow edges:
- → Create policy → Source → Details → Personnel groups → Replace policies → Finish → the draft's Policy tab → write or check content → Finalize draft.

Images: `../../images/ux/policies/create-a-policy--02.png`, `../../images/ux/policies/create-a-policy--05.png`.

### 2.25 Policy record

Layout:
- Trail "Policies /"; before the h1, a "Draft" chip (yellow) on a draft or a version chip ("V1.2", "V80.3") once published.
- The header's buttons change with the status:
  - Draft: "⋯" and filled "Finalize draft".
  - Needs approval, for an approver: "⋯", outlined "Request changes", filled "Approve".
  - Approved: "Publish".
  - Published: outlined "Renew without updates" and filled "Edit policy ⌄".
- Facts row: Status ("New", "Needs approval" pale red, "Published" pale blue), Created on, Approved on ("No approval required" or "-"), Published on, Owner (avatar and name).
- On a draft of a published policy, a blue banner: "This is a draft version" with "View latest published version".
- Line tabs: Overview | Policy | Controls | Version history | Workflows.
- Overview:
  - Details card with Edit: Policy name, Renewal date (when close or past, a warning icon and one dark line telling the owner to update and renew), Description, "Assigned to" (All personnel, Specific groups, None).
  - Approval card with "Edit approval settings". Empty: an illustration, "No approvals configured", and a line that the owner becomes the default approver. Set: a chip "Approved", each approver with "Approved" and the date.
  - Owner card with Edit.
- Policy tab: a rich-text editor (heading style, type size, bold, italic, strike, link, lists, indent, align, rule, quote, table, undo/redo, comment, resolve, image) with "Status: Saved" under it; or the uploaded PDF in a viewer. Select text → Comment → "Write a comment…", "Comment"/"Cancel" in a side bubble. Comments are allowed only while it is a draft.
- Controls tab:
  - An AI card "5 suggestions" (gradient border, collapsible) with "Select workspace" and a "⋯" (Map all, Ignore all, Regenerate). Each suggestion row: a DCF code chip, the control name, "Ignore" (text), "Map" (outlined). Thumbs up/down.
  - Below it, the mapped controls table: Search, outlined "Map Controls"; columns Control code (status chip, "DCF-922" red), Name, Workspace, Description, Owners.
  - Suggestions appear only on an approved or published policy in English of 450 words or more; their states are "Generating suggestions", "Suggestions available", "No suggestions found".
- Version history tab: gear and an AI-styled "✧ Compare to latest" (gradient outline, magenta text). Columns: row "⋯" (Download; "✧ Compare to latest"), Version (chip), Explanation of changes, Owner, Created on, Approved on, Published on.
- An overdue renewal date blocks finalizing, approving, saving an approved policy and publishing until it is moved.

Flow edges:
- → Policies row → here.
- → Edit policy → a new draft (the published one stays live) → edit → Finalize draft → "Material" (new major version, approval and re-acknowledgement) or "Non-material" (new minor version, owner may publish at once, acknowledgement optional) → Explanation of changes.
- → Renew without updates → new date → acknowledgement Yes (Notify personnel) or No.
- → Controls › Map on a suggestion, or Map Controls → mapped → the control's Policies card recounts.
- → Version history › Compare to latest → AI change summary between that version and the latest.

Images: `../../images/ux/policies/view-and-edit-a-policy--07.png`, `../../images/ux/policies/manage-policy-renewals--02.png`, `../../images/ux/policies/add-comments-in-your-policy--01.png`, `../../images/ux/policies/map-policies-to-controls-in-drata--01.png`, `../../images/ux/policies/compare-policy-versions-with-ai--03.png`.

### 2.26 Policy approval, publish and the AI change summary

Layout:
- Approval settings: approvers, "all must approve" or "any one", up to six named tiers (each with its approvers, rule and days to approve). Changes apply to the next cycle, not the running one.
- Stages: New (not started), Needs approval, Changes requested (other approvers in the tier are blocked), Approved, then Published. Owner verbs in "⋯": "Cancel Approval" (back to Draft) and override (this tier or the whole cycle, recorded in history).
- On a policy under review, the Policy tab shows an AI banner "Speed up your review" with "Get started", which generates a change summary against the published version: Executive Summary, Detailed Change Log, Risk/Compliance Notes; it goes stale and asks to regenerate when the draft changes.
- "Notify personnel" modal (on Publish):
  - Radio cards "I'll send it out myself" / "Send now through Drata".
  - "Change summary (optional)", a text box whose text appears at acknowledgement and in the email.
  - Under it, an AI "Change summary" card (gradient border) with bullet points, "Dismiss" and "Insert" (which copies them into the box), thumbs up/down.
  - Footer "Cancel" / "Confirm".
- Toasts while generating ("may take a few minutes") and when ready.
- The employee sees the summary on a "Change summary" tab of the acknowledgement dialog in My Drata.

Flow edges:
- → Finalize draft (material) → Needs approval → tier 1 approvers notified → Approve or Request changes → next tier → Approved → Publish → Notify personnel → Confirm → My Drata acknowledgement tasks → the acknowledgement test counts.
- → Version history → Compare to latest → summary panel.

Images: `../../images/ux/policies/compare-policy-versions-with-ai--01.png`, `../../images/ux/policies/compare-policy-versions-with-ai--13.png`.

### 2.27 Policy translations

Layout:
- Settings › Organization › Policy languages: off by default; when on, a list of supported languages as chips with one marked default.
- On a draft's Policy tab, above the editor: "Language" with a searchable select ("English (Default)").
- A yellow warning under it: "2 languages have no content yet", naming them, and saying readers of those languages see the default.
- Only drafts take translations; each translation matches the version's format (authored or uploaded).
- In My Drata, a language selector beside the policy title appears when the published version holds more than one language; acknowledging records the language used.

Flow edges:
- → Settings › Organization › Policy languages › Edit → add languages, set default → Save.
- → policy → Policy tab → start a draft → Language → add content per language → Finalize draft → publish.

Images: `../../images/ux/policies/create-and-manage-policy-translations--03.png`.

## 3. The data model as the UI shows it

### 3.1 The chain

- connection (identity, HRIS, infrastructure, version control, MDM, ticketing, custom) → synced records (people, accounts, devices, resources, pushed JSON) → test (an instance of a Test Library template) → findings and exclusions → control (DCF or custom) → requirement → framework.
- Beside tests, two more kinds of support hang off a control: evidence (a library item holding artifacts: File, URL, Ticket, or Test, the last made by a test run) and policies (versioned, approved, published, acknowledged by personnel).
- Required approvals sit on controls and on policies; internal notes, tasks and tickets sit on controls, tests and events.
- Risks map to controls (a control's Risks tab, with impact and likelihood); audit requests map to controls and gather evidence; events record every run, sync and edit, and serve as evidence.
- The DCF is Drata's own control catalog that every framework's requirements map onto; one requirement often has several DCF controls, and one control serves many frameworks. Drata ships default mappings (control to requirement, control to test) that a customer can change and compare back to ("Compare to defaults"), and default control text that can drift and be compared back ("Compare with Drata's template").
- Scope works at two levels: a control in or out of scope (global, across frameworks), and a requirement in or out of scope (per framework). A framework counts in-scope controls mapped to in-scope requirements.
- Workspaces split one tenant; controls, evidence and policies can be linked to several ("Linked workspaces").

### 3.2 What each record shows of the others

- Dashboard framework card: ready controls %, requirements count, controls count.
- Framework page: readiness by controls %, requirements ready n/m, controls ready n/m; each requirement row: status, controls count, scope.
- Controls row: code chip coloured by readiness, a count badge of open items, owners, framework chips.
- Control record: readiness bar n of m, with a tooltip per kind (Evidence 4/4 ready, Monitoring 1/2 tests passing, Policies 1/4 published, Approvals 0/1 approved); four cards with counts; owners, frameworks, linked workspaces; tab badges counting problems; policies with version, status and renewal date; approval stage and deadline.
- Test record: latest result, last run, lifecycle, category; days in this state; failing resources; tickets in progress; supported connections and their health; twelve months of runs; mapped controls; a link to its evidence events.
- Connection record: health, sync steps; Benefits: impact areas, controls and tests it feeds.
- Evidence row and record: status, owner, workspaces, source, renewal date, linked controls with their status chips, Trust Library sync state.
- Policy record: version, status, created, approved and published dates, owner, assigned personnel, approvers, mapped controls (and AI suggestions), versions with explanations.
- Event: user or Autopilot, timestamp, category, connection, account, result, type; raw JSON; notes.
- Recommendation card: per custom control, counts of suggested requirements, tests, policies, evidence and risks, each item with a confidence and a rationale naming the DCF control it came from.

### 3.3 Statuses and their words

- Connection: Healthy, Unhealthy (custom connections: Active).
- Account: Not linked; out of scope with a rationale; Access revoked date.
- Test result: Passed, Failed, Error, "—" while running. Test status: Enabled, Disabled, Unused, Testing…. Labels: Draft, New. Type: Drata, Drata custom, Custom draft, Custom published.
- Control: Ready, Not ready; In scope, Out of scope. Card states: Ready, Not ready, Not factored. Card legends: Ready, Failing, Passing, Error, Published, Not published, Needs approval.
- Control approval: Prepare for approvers, Needs approval, Changes requested, Approved.
- Requirement: Ready, Not Ready; In scope, Out of Scope.
- Evidence: Needs artifact, Needs renewal, Upcoming renewal, Ready, Error.
- Policy: Draft (chip) and New (status), Needs approval, Changes requested, Approved, Ready to publish, Published, Archived; renewal: Renews soon, Renewal required soon, Renewal past due.
- Recommendation confidence: High, Medium. AI control suggestions: Generating suggestions, Suggestions available, No suggestions found.
- Audit request: New.

### 3.4 Numbers seen, for scale

- 42 frameworks on one Dashboard; CCM v4 with 186 requirements and 258 controls (31 ready, 13%); a COBIT card with 229 requirements.
- 363 in-scope controls in one register; a control with 11 readiness items.
- 179 failed tests in one filtered Monitoring view; in another tenant 239 with a result (64 passed, 142 failed, 33 errored, 27% passed); 117 failing; mean time to remediation 6 days; findings per test up to 1,000.
- 1,227 test templates in the library, 233 in use; about 1,000 of them AI-written.
- 84 connections (8 failed); 480 personnel (4 noncompliant).
- 207 evidence items; 746 policies (440 active, 108 needs approval, 78 past due); 467 vendors.
- One custom control drew 251 suggested requirement mappings across 3 controls; one card held 130.

### 3.5 Readiness, as the articles define it

- A control is Ready when everything that counts is ready: current evidence (an artifact, not past its renewal date), mapped tests passing, mapped policies published, and the approval given where one is required.
- Not factored, counted neither way: tests that are disabled, inactive, erroring or non-production; evidence whose test erred; anything out of scope.
- Progress is ready items over ready plus not-ready items.
- Approval sits on top: a control that meets everything else stays Not ready until approved, and an approved control slips back 14 days before its deadline.

### 3.6 Two inconsistencies worth knowing

- The event page's note panel says notes are not shared with auditors, yet the article says notes are printed in the event PDF that goes to auditors.
- The Evidence Library sync screens, the evidence record and the custom connection page are an older layout (top-bar breadcrumbs, a "LIVE" badge, different chips) beside the new experience's shell; the help center mixes both.

## 4. For Program Assurance

- **Control readiness cards, with "Not factored".** The control record's Evidence / Monitoring / Policies / Approvals cards and its "6 of 11" bar fit PA's control record and preview. Each card shows a state and a small legend of counts, and offers its first verb when empty ("Add evidence", "Map tests"). Borrow the shape and, above all, the "Not factored" bucket. PA should show what does not count and why (an erroring evidence source, an objective judged by inheritance) instead of quietly leaving it out. Leave the binary Ready / Not ready: RMF needs the derived ladder (No requirement → No evidence → Not assessed → an assessor's determination), not an automated pass.
- **Next steps as three numbers.** The test record's Track ("Days failed 52, since …"), Fix ("Failing resources 250 → View findings") and Manage ("Tickets in progress 0 → Create ticket") is the right head for PA's finding and operational issue records. Days open, affected items, and POA&M milestones in progress fit Josef's "numbers over prose", and each number opens the place where the work happens. Borrow.
- **Exclusions with a reason, listed where they live.** Excluding a finding, disabling a test and scoping out a control or account all require a rationale. An Exclusions tab then lists Excluded by, Date excluded and Reason, and "N/A" once the resource is gone. Controls are never deleted, only scoped out. This is PA's tailoring and risk acceptance: keep tailored-out controls visible in the baseline with their rationale, and give accepted findings a tab of their own, not a filter.
- **Evidence that expires.** Needs artifact / Needs renewal / Upcoming renewal (within two months) / Ready, driven by a renewal date, is continuous monitoring by assessment frequency. Borrow it for PA's evidence versions. Borrow too the audit-request picker's rule: it offers only evidence current inside the audit window and maps it to the request's controls. That rule belongs in an assessment campaign's evidence picker.
- **Approval stages that reset on change.** Prepare for approvers → Needs approval → Changes requested → Approved, sent back to review when a new policy is mapped or a deadline nears, fits the ISSO/ISSM review of an implementation statement before the SSP is submitted. Take the stage words and the reset rule into PA's Review queue. Leave per-control approver lists: PA already holds RMF roles at program level (`program_roles`), and a Sign action belongs to its role.
- **Material versus non-material is RMF's significant change.** Finalizing a policy draft asks for the class of change: a major version needs re-approval and re-acknowledgement, a minor one can publish at once, and both store an "Explanation of changes" in version history. PA's SSP revisions and overlay versions should ask the same at finalize, worded as RMF's significant change (which can trigger reauthorization). Borrow boldly.
- **AI that proposes and never applies.** The Recommendations queue gives each suggested mapping a confidence and a rationale naming its source, with Map / Dismiss per type. The policy Controls tab's "5 suggestions", the "Compare to latest" change summary with Insert / Dismiss, and the connection failure summary follow the same rule. All fit PA's Map a requirement and SSP revision diffs. Leave "Map all" over 130 requirements in one click (RMF mapping is reviewed per objective) and the magenta gradient styling (Drata's brand).
- **What a source feeds.** The connection record's Benefits rail (4 impact areas, 23 controls, 19 tests) and the template page's "Tests using template" with Manage per copy are PA's Where used for a shared component or evidence source. They confirm the number-that-opens-a-list shape PA already plans.
- **What to leave on the Dashboard.** Failing tests by category with "↗2167%" chips are noisy on small bases (the article admits it), and framework cards hidden at 0% hide the work that most needs doing. PA's contract prefers counts that open registers, and a trend only with seven points.

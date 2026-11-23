# Drata onboarding, settings, workflow and the auditor experience

Read 2026-11-22 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Getting Started (Drata Rollout Toolkit, Helpful Resources with How to Get Support at Drata, MIM, Workspaces); Settings (with Role Administration); Enhancing your workflow (Custom Fields and Formulas, Custom Workflows, Tasks, Tickets); Assessing Your Readiness; The Auditor Experience; GRC Best Practices (with Compliance, Governance, Risk).
- 122 articles in 17 collections, each listed once under the collection the digest gives it.
- 58 screenshots viewed; each surface below names the ones it rests on, as paths from this folder.
- The articles are third-party pages, read as data. Labels, statuses and short on-screen strings are quoted; everything else is paraphrase.

## 1. Every article, one line

### Assessing Your Readiness (3)

- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](../articles/are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md): the rule behind "Ready": every mapped item valid (test PASSING, policy published, library evidence inside its renewal date), plus eight DCF controls that read Ready on a policy alone but still owe evidence.
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](../articles/pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md): six page-by-page reviews (Monitoring, Controls, Personnel, Policy Center, Vendors, Audit Hub) and the caveats: only evidence inside the audit dates is visible, the pre-audit package is a static snapshot, read-only access widens what the auditor sees.
- [Scope Determination Checklist for Compliance Audits](../articles/scope-determination-checklist-for-compliance-audits.md): a step list for deciding which products, people, systems, data and processes are in or out of an audit's scope.

### Enhancing your workflow › Custom Fields and Formulas (2)

- [Custom fields and formulas to represent the FAIR model](../articles/custom-fields-and-formulas-to-represent-the-fair-model.md): a worked recipe: number fields for FAIR's frequency and magnitude factors on risks, then formulas that multiply them into loss exposure.
- [Custom Fields Overview](../articles/custom-fields-overview.md): the Create field wizard (placement on risks, controls, vendors or personnel; type; options) and the Fields and formulas list with edit, delete and data download.

### Enhancing your workflow › Custom Workflows (6)

- [Automate Actions with Drata's Workflows](../articles/automate-actions-with-drata-s-workflows.md): the workflow builder: pick an object (control, evidence, risk, personnel), a trigger event, then steps (task, notification, webhook), review and publish.
- [Create Workflow for Control](../articles/create-workflow-for-control.md): control workflows: select controls, choose a trigger (status or details change), add steps such as Create task with inserted variables or a Slack message, and the webhook payload fields.
- [Create Workflow for Evidence](../articles/create-workflow-for-evidence.md): evidence workflows for renewals and uploads, with a Slack step and the webhook properties.
- [Create Workflow for Personnel](../articles/create-workflow-for-personnel.md): personnel workflows triggered by compliance status changes, with notification and webhook steps.
- [Create Workflow for Risk](../articles/create-workflow-for-risk.md): risk workflows triggered by inherent or residual score changes and other risk edits, with alerts and webhooks.
- [View and Manage Workflows](../articles/view-and-manage-workflows.md): the Workflows table (filters, published version, run log) and the row actions to edit, duplicate, unpublish or delete.

### Enhancing your workflow › Tasks (5)

- [Bulk Import Custom Tasks](../articles/bulk-import-custom-tasks.md): Create tasks in bulk: upload a CSV, map columns and values, fix rows in a Valid / Invalid grid, download validation results, submit with an optional email to assignees; recurring-task columns.
- [Manage Risk Tasks in Drata (New Experience)](../articles/manage-risk-tasks-in-drata-new-experience.md): risk tasks on the Tasks page and in a risk's Tasks side panel; Create task with Map risk; who sees them.
- [Manage tasks in Drata](../articles/manage-tasks-in-drata.md): the Tasks page: status filters, tasks grouped by month with counts, automated tasks (renewals, reviews) beside custom ones, complete, edit, delete.
- [Task notifications](../articles/task-notifications.md): the ownership email on assignment, upcoming and past-due reminders, and where each is switched off.
- [Tasks and Workspaces](../articles/tasks-and-workspaces.md): which tasks belong to one workspace, which are company-wide, and how roles limit what a user sees.

### Enhancing your workflow › Tickets (2)

- [Create and Manage Tickets in Drata](../articles/create-and-manage-tickets-in-drata.md): tickets created from a control, test or other record into a connected ticketing tool, opened from the record's utilities rail; a per-tool notes table.
- [Jira security tickets: Label vs JQL](../articles/jira-security-tickets-label-vs-jql.md): how the security-ticket test finds Jira issues, by a label or by a JQL query, and how to switch between the two.

### GRC Best Practices (1)

- [What should be included in the annual BCP/DR test and Incident Response test?](../articles/what-should-be-included-in-the-annual-bcp-dr-test-and-incident-response-test.md): what the meeting notes uploaded as evidence of each annual exercise should record (attendees, date, scenario, lessons learned).

### GRC Best Practices › Compliance (3)

- [Annual Compliance Review](../articles/annual-compliance-review.md): the yearly tasks (policy renewal and re-acceptance, access review, risk assessment, training) and the reminder email sent 9 months after the first policy approval.
- [Disaster Recovery Checklist: Simple Steps for Business Resilience](../articles/disaster-recovery-checklist-simple-steps-for-business-resilience.md): a checklist for planning, running and documenting the annual DR test.
- [The backup policy and version control](../articles/the-backup-policy-and-version-control.md): a hosted VCS's own backups usually suffice; review its SOC 2 report under vendor management.

### GRC Best Practices › Governance (3)

- [Are we required to have an independent Board of Directors?](../articles/are-we-required-to-have-an-independent-board-of-directors.md): SOC 2 CC1.2 and the AICPA's allowance for small companies without an independent board.
- [Do cloud-hosted systems need Contingency Plans?](../articles/do-cloud-hosted-systems-need-contingency-plans.md): yes: BCP, DR and IR plans are still owed and tested yearly even on a highly available cloud.
- [How to Adjust Controls When You Don't Have a Board of Directors](../articles/how-to-adjust-controls-when-you-don-t-have-a-board-of-directors.md): which board-related controls to edit (to a leadership or advisory body) when there is no board, and what to put on Key Personnel.

### GRC Best Practices › Risk (2)

- [How to Determine Key Vendors to include in Drata?](../articles/how-to-determine-key-vendors-to-include-in-drata.md): questions that make a vendor "key" (customer data, infrastructure, critical service) and so owed a yearly report review.
- [What Is a Subprocessor?](../articles/what-is-a-subprocessor.md): the term across privacy frameworks, and the vendor page's subprocessor checkbox.

### Getting Started › Drata Rollout Toolkit (11)

- [Section 1: Drata Rollout Toolkit Overview](../articles/section-1-drata-rollout-toolkit-overview.md): the champion's eight-step plan (stakeholders, executive sponsor, integration owners, kickoff, roadmap, Sales and staff briefings, metrics) and a running checklist.
- [Section 2: GRC Roles & Responsibilities](../articles/section-2-grc-roles-responsibilities.md): nine functions with their compliance duties, and a matrix from each function to a typical Drata role (Primary Admin, Control Owner, End User, Viewer).
- [Section 3: Change Management Guide](../articles/section-3-change-management-guide.md): ADKAR applied to the rollout, the champion's role, communication practice and per-persona engagement.
- [Section 4: Team Briefs & Email Templates](../articles/section-4-team-briefs-email-templates.md): one-pagers and emails for executives, GRC, IT, Engineering, HR, Sales and all staff.
- [Section 5: Control Owners](../articles/section-5-control-owners.md): what a control owner does in Drata, which personal notifications to switch on, and four first actions (Controls filtered to Owner = you, Monitoring, Tasks).
- [Section 5: Drata for Auditors](../articles/section-5-drata-for-auditors.md): the Audit Portal from the auditor's side: audit overview, requests (New, Prepared, Completed, Deleted), the two packages and messages.
- [Section 5: Evidence Owners](../articles/section-5-evidence-owners.md): the Evidence Library as the home of manual evidence, renewal dates and linking evidence to controls.
- [Section 5: Policy Owners](../articles/section-5-policy-owners.md): policy owner notifications, sign-in, first actions (draft, approve, publish, track acceptance) and enablement links.
- [Section 6: Implementation Roadmap + Success Metrics](../articles/section-6-implementation-roadmap-success-metrics.md): five phases over weeks 0 to 14+, the integration order (IdP first), a four-part scorecard and a weekly / monthly / quarterly cadence.
- [Section 7: Common Adoption Blockers Guide](../articles/section-7-common-adoption-blockers-guide.md): common objections (bandwidth, IT's security worries, leadership, other teams) and how a champion answers each.
- [Section 8: Key Resources](../articles/section-8-key-resources.md): links to the slide decks, the project plan template and integration guides for each owner.

### Getting Started › Helpful Resources (16)

- [Access Drata as an auditor (New Experience)](../articles/access-drata-as-an-auditor-new-experience.md): accepting the email invitation, what an auditor can do once in, and what to try when the invite fails.
- [Compliance Program Migration Best Practices](../articles/compliance-program-migration-best-practices.md): five steps for moving from another tool or spreadsheets: prepare, begin, import and configure controls, manage controls and policies, align with the auditor.
- [Getting Started with Drata: Key Resources](../articles/getting-started-with-drata-key-resources.md): links to the help center, live onboarding sessions and training.
- [Getting Started with the Drata Academy](../articles/getting-started-with-the-drata-academy.md): the self-serve course site, who can use it and how to reach courses and live training.
- [How to Allowlist Drata Email Domains and IP Addresses](../articles/how-to-allowlist-drata-email-domains-and-ip-addresses.md): the sending domain and addresses to allow on a mail gateway.
- [Introducing the New Drata Experience](../articles/introducing-the-new-drata-experience.md): the unified interface: new tables with column menus and selection, record pages with a preview panel and Previous / Next, and a utilities rail for notes, tickets and tasks.
- [My Drata Overview: Complete Your Personal Compliance Tasks (New Experience)](../articles/my-drata-overview-complete-your-personal-compliance-tasks-new-experience.md): the employee's My Drata: policy review, background check, MFA, the Drata Agent, devices, and security, HIPAA and AI training.
- [Navigate the Drata Help Center](../articles/navigate-the-drata-help-center.md): how the help center is organised and how to give feedback.
- [SafeBase Acquisition](../articles/safebase-acquisition.md): a customer FAQ on SafeBase joining Drata (Trust Center, billing, upgrades).
- [Signing In to Drata (New Experience)](../articles/signing-in-to-drata-new-experience.md): sign-in by email and verification code, by SSO, and the employee login to My Drata; troubleshooting codes and IdP group gaps.
- [Supported Internet Browsers](../articles/supported-internet-browsers.md): the four supported browsers.
- [The JSON Web Token (JWT) Security Standard](../articles/the-json-web-token-jwt-security-standard.md): how Drata uses JWTs to secure traffic between its server and the web app.
- [Use Markdown formatting in supported text areas](../articles/use-markdown-formatting-in-supported-text-areas.md): which long-text fields render Markdown (custom Long answer fields, risk details), with read and edit views.
- [Using AI Features in Drata](../articles/using-ai-features-in-drata.md): Drata's AI principles and where an admin switches AI features on or off.
- [Welcome to Drata](../articles/welcome-to-drata.md): what Drata does, the teams behind a customer (education, success, support) and where to learn.
- [Working with an MSSP (Managed Security Service Provider)](../articles/working-with-an-mssp-managed-security-service-provider.md): Drata's partner network of managed security providers and what they add.

### Getting Started › Helpful Resources › How to Get Support at Drata (5)

- [Drata Support: Conversations vs. Tickets](../articles/drata-support-conversations-vs-tickets.md): an in-app chat stays a conversation until it needs follow-up, then becomes a ticket tracked in the Tickets portal.
- [Get support from Drata](../articles/get-support-from-drata.md): support hours, the in-app help widget (AI agent first, then a person), email, tracking requests, and granting remote access.
- [Grant remote access to Drata Support](../articles/grant-remote-access-to-drata-support.md): Settings › Account access: a time-limited grant to Support at a chosen access level, revoked after troubleshooting.
- [Observed Holidays](../articles/observed-holidays.md): the 2026 US holidays on which support is reduced.
- [Submitting a Feature Request](../articles/submitting-a-feature-request.md): the help widget's Product Roadmap with Ideas, Releases and Submit Idea.

### Getting Started › MIM (2)

- [Introducing the updated Multi-instance Management Portal](../articles/introducing-the-updated-multi-instance-management-portal.md): the refreshed portal for parent organisations: an accounts table, opening an account and returning; light and dark appearance.
- [MIM Dashboard](../articles/mim-dashboard.md): compliance health metrics across managed accounts, at account and workspace level.

### Getting Started › Workspaces (9)

- [Configure Workspace Details, Frameworks, and Connections](../articles/configure-workspace-details-frameworks-and-connections.md): Settings › Workspaces list, the workspace page (details, URL, managers, frameworks) and assigning connections to workspaces.
- [Create and Manage Workspace Tickets](../articles/create-and-manage-workspace-tickets.md): tickets from a control or test inside a workspace, the workspace picker, and the workspace named in the ticket.
- [Create and Manage Workspaces](../articles/create-and-manage-workspaces.md): creating and deleting a workspace, adding frameworks and connections, the workspace picker and the workspace section of the nav.
- [Identify What Can Be Shared Workspace Resources](../articles/identify-what-can-be-shared-workspace-resources.md): what stays in one workspace (controls, monitoring, evidence state), what can be linked across workspaces (control info, policies, evidence) and what is account-wide (personnel, vendors, settings).
- [Map Controls, Policies, and Evidence Across Workspaces](../articles/map-controls-policies-and-evidence-across-workspaces.md): mapping the same control code across workspaces so description, owners, policies and evidence are shared, and what stays independent (status, tests, scope).
- [Navigate the Workspaces Dashboard (Beta)](../articles/navigate-the-workspaces-dashboard-beta.md): one account's workspaces side by side with their compliance health metrics.
- [Scope personnel to a Workspace](../articles/scope-personnel-to-a-workspace.md): limiting a workspace's personnel by IdP groups, copying groups from another workspace, exports and IdP sync behaviour.
- [Track Workspace-Aware Events](../articles/track-workspace-aware-events.md): which events are logged per workspace and which per organisation.
- [Understand Accounts, Workspaces, and MIM](../articles/understand-accounts-workspaces-and-mim.md): the three levels (MIM portal, account, workspace) and a decision guide for one workspace versus several.

### Settings (16)

- [Change your company's email domain](../articles/change-your-company-s-email-domain.md): a seven-step wizard that moves people to a new email domain: before you start, verify, who moves, email format, review, reconnect sign-in, done.
- [Drata AI: Technical & Security Details](../articles/drata-ai-technical-security-details.md): an FAQ on Drata AI: no training on customer data, tenant isolation, opting out, subprocessors.
- [Drata Compliance as Code](../articles/drata-compliance-as-code.md): a separate product that checks infrastructure-as-code for compliance gaps before deployment.
- [Drata MCP — Setup & Usage Guide](../articles/drata-mcp-setup-usage-guide.md): enabling Drata's MCP server, its scopes and roles, connecting a client, adding scopes, example prompts and troubleshooting.
- [Find your Account ID](../articles/find-your-account-id.md): where the Account ID sits on Organization Details › Org info.
- [Microsoft Copilot MCP Integration Guide](../articles/microsoft-copilot-mcp-integration-guide.md): connecting Drata's MCP server to Copilot Studio.
- [Multi-Domain Support](../articles/multi-domain-support.md): syncing users from every domain in the IdP, and limiting the sync by group.
- [Organization settings: Human Resources Settings (New Experience)](../articles/organization-settings-human-resources-settings-new-experience.md): Personnel compliance › Human Resources: background check rules, automated offboarding evidence, the careers URL and required documents.
- [Organization settings: Internal Security](../articles/organization-settings-internal-security.md): Personnel compliance › Internal Security: how workstation configuration evidence is gathered and office visitor logs.
- [Organization settings: Key Personnel Information (New Experience)](../articles/organization-settings-key-personnel-information-new-experience.md): Organization Details › Key personnel: the named leadership and accountability roles auditors ask for.
- [Organization settings: Notifications rules](../articles/organization-settings-notifications-rules.md): rules that post compliance updates to Slack or Teams channels or as direct messages, their triggers and frequency, and the Active / Disabled switch.
- [Organization settings: Organization Details (New Experience)](../articles/organization-settings-organization-details-new-experience.md): company information, Account ID, compliance and public URLs, and product information used in audits.
- [Organization settings: Security awareness, HIPAA, and AI training](../articles/organization-settings-security-awareness-hipaa-and-ai-training.md): Personnel compliance › Training: the method for each training (Drata's own, a connected provider, uploaded proof) and how completion counts.
- [Personal settings: Notifications (New Experience)](../articles/personal-settings-notifications-new-experience.md): each user's email notifications by area, with on/off toggles and a digest frequency.
- [Settings Page](../articles/settings-page.md): the Settings menu in three groups: Personal, Organization and Configuration.
- [Your Drata Domain](../articles/your-drata-domain.md): why the account's email domain governs sign-in, IdP sync and ownership, and what to tell Drata before it changes.

### Settings › Role Administration (20)

- [Access reviewer overview](../articles/access-reviewer-overview.md): the role that runs assigned access reviews and nothing else.
- [Add guest administrators with a different domain](../articles/add-guest-administrators-with-a-different-domain.md): what to do when a guest admin's email domain is unverified.
- [Admins overview](../articles/admins-overview.md): the Admin role: full access, how it combines with other roles, and the actions only an Admin can take.
- [Checklist: Before the Admin Leaves (New Experience)](../articles/checklist-before-the-admin-leaves-new-experience.md): reassigning a departing admin's responsibilities (controls, policies, risks, tasks) from the person's Responsibilities card.
- [Control managers overview](../articles/control-managers-overview.md): what a control manager can do, with its Read-only and Restricted-view versions.
- [DevOps engineer overview](../articles/devops-engineer-overview.md): the DevOps engineer role's access to compliance, settings and help.
- [Information security leads overview](../articles/information-security-leads-overview.md): the information security lead role: broad access short of Admin.
- [Manage guest administrators](../articles/manage-guest-administrators.md): Role administration › Guests: inviting an outside administrator (a consultant), approving the domain, signing in and removing access.
- [Manage user roles in Drata](../articles/manage-user-roles-in-drata.md): Role administration › Users: Assign role, a user's Assigned roles panel, Change user role and Remove role.
- [Map IdP Groups to Drata Roles](../articles/map-idp-groups-to-drata-roles.md): Role administration › IdP Group Mappings: Create mapping (IdP group → roles), the mapping preview, edit, and how sync assigns roles.
- [Personnel compliance managers overview](../articles/personnel-compliance-managers-overview.md): the role that manages personnel compliance (people, devices, training).
- [Policy managers overview](../articles/policy-managers-overview.md): the role that manages policies.
- [Read-Only and Restricted-View Roles](../articles/read-only-and-restricted-view-roles.md): most roles come as base, Read-only and Restricted-view, each a separately assigned role; which exist and what each limits.
- [Resolve Authorization Errors in Drata](../articles/resolve-authorization-errors-in-drata.md): fixing "You are not authorized": browser state, assigned roles, magic-link email, escalation.
- [Risk managers overview](../articles/risk-managers-overview.md): the risk manager role and its Read-only and Restricted-view versions.
- [Role Administration & RBAC](../articles/role-administration-rbac.md): finding one's roles, every role described, a permission table and role combinations to avoid.
- [Roles and permissions overview (New Experience)](../articles/roles-and-permissions-overview-new-experience.md): the roles in the new experience, which to assign for what, and combinations to avoid.
- [Trust Center Managers](../articles/trust-center-managers.md): the Trust Center manager role's Editor, Requests, Insights and Settings tabs.
- [Trust Center Reviewers](../articles/trust-center-reviewers.md): the role that only processes Trust Center document requests.
- [Workspace Manager overview](../articles/workspace-manager-overview.md): assigning a manager to a workspace from its Managers card, and the Read-only version.

### The Auditor Experience (16)

- [Auditor API Key Self Service](../articles/auditor-api-key-self-service.md): audit firms generate and revoke their own Auditor API keys to pull controls, requests and evidence into their tools.
- [Audits page overview (New Experience)](../articles/audits-page-overview-new-experience.md): the Audits list (cards with status and auditors), opening an audit, its request summary and requests table, and package downloads.
- [Create and add auditors to an audit](../articles/create-and-add-auditors-to-an-audit.md): the Add auditor dialog (name, email, firm, read-only access and download permissions), editing or deleting an auditor, and why an auditor may not get in.
- [How audit date ranges and evidence sampling affect auditor access](../articles/how-audit-date-ranges-and-evidence-sampling-affect-auditor-access.md): the auditor sees only evidence inside the audit's date range and in its sample, both set by the customer.
- [Internal audits in Drata (New Experience)](../articles/internal-audits-in-drata-new-experience.md): creating an audit of type Internal audit, conducted in Drata, and who may manage it.
- [Map audit requests to DCF controls with AI](../articles/map-audit-requests-to-dcf-controls-with-ai.md): AI recommendations that map each auditor request to Drata controls: set up during audit creation, reviewed per request (Map Control, Dismiss) or in bulk.
- [Mark messages as read or unread in your audits (New Experience)](../articles/mark-messages-as-read-or-unread-in-your-audits-new-experience.md): the Unread messages filter on an audit's requests and marking a thread read.
- [Pre-audit evidence packages in Drata (New Experience)](../articles/pre-audit-evidence-packages-in-drata-new-experience.md): choosing what the pre-audit package holds when creating an audit or afterwards, and when Drata regenerates it.
- [Set up the Drata + Fieldguide integration in Audit Hub](../articles/set-up-the-drata-fieldguide-integration-in-audit-hub.md): a token from Fieldguide, a connection in Drata, a connected audit chosen in the Create audit wizard, then mapping requests to controls.
- [Understanding the Drata + Fieldguide Integration](../articles/understanding-the-drata-fieldguide-integration.md): what syncs between the two tools in a connected audit and what to settle first.
- [Using the Drata Audit Portal (New Experience)](../articles/using-the-drata-audit-portal-new-experience.md): the external auditor's guide: login, client list, audit page, packages, requests and messages, asking for and adjusting evidence.
- [Using the Drata Evidence Package and Manifest File](../articles/using-the-drata-evidence-package-and-manifest-file.md): the evidence ZIP's folders and its HTML manifest that maps each file to its control and requirement.
- [View and Open Evidence from the Audits page (New Experience)](../articles/view-and-open-evidence-from-the-audits-page-new-experience.md): opening a request's Evidence tab from the audit page to see what is mapped.
- [What auditors can see in Audit Portal](../articles/what-auditors-can-see-in-audit-portal.md): the auditor's client list, client page and audit overview compared with the customer's view; why requirements can be missing.
- [What auditors need to do for the Drata + Fieldguide integration](../articles/what-auditors-need-to-do-for-the-drata-fieldguide-integration.md): the auditor's five steps to connect a client's Drata to a Fieldguide engagement, and what to tell clients.
- [Work in a Fieldguide-connected audit in Audit Hub](../articles/work-in-a-fieldguide-connected-audit-in-audit-hub.md): recognising a connected audit, its request statuses and sync, adding evidence, comments and connection health states.

## 2. Product surfaces

### 2.1 Sign in

Layout:
- A split page at auth.drata.com: the left half holds the logo, "Welcome", one "Email address" field and a small "Sign in" button; the right half is a dark marketing panel (customer quote, mock "Policy status" donut and a "SOC 2" readiness card: Ready 61%, Requirements 190, Controls 251).
- Under the form: "Are you an auditor? Go to the auditor login" (a separate door for auditors), "Use previous Drata sign-in", "Email our support team".
- After the email: either a one-time code sent by email, or a hand-off to the company's IdP (Okta, Microsoft, Google, OneLogin); people with several organisations or regions pick one from an account selector.
- Employees arrive from their invitation link and land straight in My Drata (2.3).

Flow edges:
- → email → Continue → code or IdP → (account selector) → the app; employees → My Drata.
- → "Go to the auditor login" → the Audit Portal (2.28).
- → no code or "You are not authorized" → allowlist, roles, magic-link checks (Resolve Authorization Errors).

Images: `../../images/ux/other/signing-in-to-drata-new-experience--01.png`.

### 2.2 Quick Start, the help widget and the Tickets portal

Layout:
- Quick Start is the first item of the nav's Workspace group (Quick start, Dashboard, Tasks, Compliance, Events; then Organization: Risk, Vendors, Governance, Trust; then Connections, Library, Settings at the foot). A workspace picker ("Drata ⌄") sits in the top bar beside the logo.
- Title "Quick Start", a link "Get started with Help Center ↗", one overall progress bar ("80% completed").
- One card per section, each with a title, a one-line purpose, a thin multicoloured progress bar and "N of M completed": "Provide basic info" (0 of 1), "Make connections to power automation" (4 of 4), "Establish continuous compliance for your frameworks" (3 of 3), "Ensure your personnel stays compliant" (5 of 5), and "Set up your policies".
- Each activity sends the reader to the page that does the work ("Go to Company Info", "Set up", "Go to Policy Center"); nothing is done inside Quick Start. It may be finished over several sessions and ends at "100% completion". Admins only.
- The help widget opens from a "?" button at the bottom right: a blue panel "Hi … How can we help?", "Send us a message", product-update cards, and Home / Messages tabs; an AI agent ("Dratanaut") answers first and hands over to a person when asked ("talk to a human"). The widget also holds the Product Roadmap with Ideas, Releases and "Submit Idea".
- The Tickets portal (help-center side) lists requests with a Conversations / Tickets selector and All / Created by me tabs; a conversation becomes a ticket only when it needs multi-day follow-up.

Flow edges:
- → first sign-in as Admin → Quick Start → each activity → Organization details, Connections, Role administration, Frameworks, Controls, Personnel, Personnel compliance tabs, Policies.
- → "?" → widget → AI answer → "talk to a human" → support inbox → Tickets portal.

Images: `../../images/ux/home/get-support-from-drata--02.png`.

### 2.3 My Drata: the employee's Compliance Hub

Layout:
- Reached from the avatar menu (My Drata, Academy ↗, Community ↗, Appearance › Light / Dark / System, Sign out); people with few permissions open on it.
- Heading "Hi Jane! Welcome to the Drata Compliance Hub." over one short paragraph.
- A vertical stack of collapsible task cards, each with a round status mark (dashed ring = not done, filled check = done), a title and a cadence line: Policy Review ("done annually"), Background Check, Install and setup the Drata Agent ("reports daily"), Configure your devices, Complete Security Awareness Training, HIPAA Training, AI Training, MFA.
- Policy Review expands into one card per policy: name, Status chip "Not Accepted" (red, with a warning glyph) or the acceptance date, Last updated, and a "View" button that opens the policy to accept.
- Training expands into numbered steps with "Go to training ↗"; a device check that cannot be verified asks for an uploaded screenshot.

Flow edges:
- → invitation email → sign in → My Drata → View → accept → the card's status becomes the date.
- → Settings › Personnel compliance › Training choice → decides whether the training step appears here at all (2.7).

Images: `../../images/ux/personnel/my-drata-overview-complete-your-personal-compliance-tasks-new-experience--02.png`, `../../images/ux/personnel/organization-settings-security-awareness-hipaa-and-ai-training--02.png`.

### 2.4 The new experience: tables, record preview and the utilities rail

Layout:
- Tables: every column header carries a "⋯" menu; a gear sets columns; a left filter pane with "Clear all filters" folds away with two layout buttons; selected rows raise a selection bar ("2 selected", "Add to program" on the test library).
- Record preview: opening a row from a record's tab (a control's Evidence tab, with count tabs Overview, Evidence 3, Monitoring 2) slides a panel over the right half: "2 of 10" with "Previous ↑" and "Next ↓", "Close", a status chip ("Needs renewal"), the title, "Open" to go full page, then Overview fields (Name, Description, Implementation guidance, Owner).
- A control's header shows Owner avatars ("+3 more") and Frameworks chips ("PCI", "NIST80053", "+4 more"), each with an edit pencil.
- Utilities rail: a thin strip of three icons on the record's right edge, Notes, Tickets and Tasks, each opening a side panel. Internal notes: a 191-character box, "Save", the empty state "No notes yet"; owners and approvers are emailed and notes are hidden from auditors.

Flow edges:
- → any row in a record tab → preview → Previous / Next walks the list → Open → the full record.
- → rail icon → Notes / Tickets (2.22) / Tasks panel, without leaving the record.

Images: `../../images/ux/controls/introducing-the-new-drata-experience--02.png`, `../../images/ux/controls/introducing-the-new-drata-experience--03.png`.

### 2.5 Settings menu

Layout:
- Settings is the last nav item; it opens a second column of links in three labelled groups:
  - Personal: Language, Notifications.
  - Organization: Account access, Language, Organization details, Notification rules, Personnel compliance, Plan and usage, Role administration, Workspaces.
  - Configuration: AI settings, API keys, OAuth Applications, MCP Configuration, Compliance as Code, Fields and formulas, Ticket automation, Workflows.
  - Account Maintenance (seen in one account): Domain Change.
- Organization settings are Admin-only, with named exceptions (Workflows for Workspace Managers, Human Resources for Personnel Compliance Managers, Ticket automation for DevOps Engineers).
- The older layout (2024 screenshots) was a page of icon tiles under "My Settings" and "Company Settings" (Company Info, Key Personnel Info, Role Administration, Human Resources, Internal Security, Notifications, Ticket Automation, Vendor Questionnaires, API Keys), with a dark navy nav grouped Trust / Risk / Governance.

Flow edges:
- → Settings → any link → its page in the right pane, the link column staying put.

Images: `../../images/ux/settings/settings-page--01.png`, `../../images/ux/settings/information-security-leads-overview--01.png`.

### 2.6 Organization details

Layout:
- Title "Organization Details"; line tabs Org info | Key personnel.
- Org info, card "Organization information": Email domain (read-only), Full legal name (optional), Common name, Incorporation/Founding year (optional), Phone Number (optional), Company description (optional, "402/30000"), Company address (optional), Account ID and SafeBase Organization ID (read-only), Data residency location.
- Further cards: compliance and public URLs (Privacy policy, Terms of use, Support / Help URL, Security / Compliance email) and Product information (a sample MSA upload). Several fields feed tests: the privacy URL feeds "Privacy Policy Publicly Available", the MSA feeds DCF-64.
- Key personnel: cards such as "Team leads" listing roles (Chief Executive Officer "—") with an "Edit" button per card.
- Quick Start's "Provide basic info" counts as done only when every field, optional ones included, is filled.

Flow edges:
- → Quick Start › Go to Company Info → Org info.
- → a field edit → Save → the linked test re-evaluates on its next run.

Images: `../../images/ux/settings/find-your-account-id--01.png`, `../../images/ux/settings/organization-settings-key-personnel-information-new-experience--01.png`.

### 2.7 Personnel compliance settings

Layout:
- Title "Personnel Compliance"; line tabs Internal Security | Training | Human Resources; each tab is a stack of white cards with "Save changes" and "Cancel" at the foot.
- Internal Security, card "Automation", "Workstation configuration monitoring": a checkbox per source (Automated via Intune MDM, 1Password Device Trust (Kolide), Kandji, JumpCloud, Workspace ONE, NinjaOne, Drata Agent, "Manually via personnel uploading their evidence in My Drata"); below, "Documentation" (office visitor logs).
- Training, card "Security awareness training": radios for KnowBe4, Drata's embedded training, ESET, outside Drata with personnel uploading in My Drata, or outside Drata with an admin uploading (which removes the step from My Drata); a toggle "Schedule recurring training resets" with "Reset 12 months after each personnel's last completion date" or "Reset on the same date each year for all personnel". HIPAA and AI training cards appear when enabled.
- Human Resources, card "Automation": Background checks radios (a partner provider run by personnel during onboarding in My Drata, or checks uploaded per employee / automated by a connection); "Automate offboarding evidence collection" with an "Enable offboarding automation" toggle (Jira tickets as evidence); card "Public URLs" with Careers website (optional).

Flow edges:
- → Quick Start › personnel activities "Set up" → the matching tab.
- → a training or device choice → what My Drata asks each employee (2.3) and which personnel tests run.

Images: `../../images/ux/settings/organization-settings-internal-security--01.png`, `../../images/ux/settings/organization-settings-security-awareness-hipaa-and-ai-training--01.png`, `../../images/ux/settings/organization-settings-human-resources-settings-new-experience--01.png`.

### 2.8 Personal notifications

Layout:
- Title "Notifications"; a master toggle "Email notifications" under "Allow notifications".
- Groups of toggles, each with an optional one-line hint: Audits (New messages, Status updates for requests); Controls (Evidence updates on controls, Approval updates on controls, Internal note added to a control, Status change for controls assigned to me, with a Frequency select "Weekly" or daily); further groups by the text: Monitoring (evidence collection errors, automated test error), Evidence (assigned to me), Policies (comment replies, updates to my policies), Risk (new owner), Tasks (upcoming in 7 days, the annual task reminder on the 15th, past due twice a week), Vulnerabilities (missed or upcoming SLA), Workflows (published or deactivated).
- Personal settings never change the organisation's channel rules (2.9).

Flow edges:
- → avatar or Settings › Personal › Notifications → toggles save in place.

Images: `../../images/ux/settings/personal-settings-notifications-new-experience--01.png`.

### 2.9 Organization notification rules

Layout:
- Title "Notification rules"; primary "Create notification rule" at top right.
- Left filter pane: "Clear all filters", Delivery method (Slack, Microsoft Teams).
- Table: Type (with a count line, "Control readiness · 1 control"), Status (a segmented switch Disabled | Active), Delivery method (Slack logo, workspace), Destination ("#testchannel"), Frequency ("Daily - 06:00am PT"), a row chevron.
- Create form "Notification": Trigger radios, each with a hint: Personnel with pending actions, Tests with an "error" result, Required approvals, Control evidence updates, Controls not ready (pick the controls), Workflow updates; Options: "Send a direct message to personnel (optional)"; Frequency: Daily (6:00 AM PT, weekends included) or Weekly (Mondays).
- A Slack or Teams connection is required first; private Slack channels need the app invited; Teams cannot post to private channels.

Flow edges:
- → Settings › Notification rules → Create notification rule → trigger, target, frequency → Save → a row, Active.
- → Status switch → Disabled (kept) or Active; row → delete (cannot be undone).

Images: `../../images/ux/settings/organization-settings-notifications-rules--01.png`, `../../images/ux/settings/organization-settings-notifications-rules--02.png`.

### 2.10 Change email domain (wizard)

Layout:
- A full page under Settings › Account Maintenance › Domain Change, entered from a "Change email domain" card with a warning banner and "Start"; a "← Back to Account maintenance" link above the title "Change email domain".
- A vertical stepper of eight numbered steps on the left (Before you start, Verify the new domain, Who should move, Choose the email format, Review and confirm, Making the change, Reconnect, All done); done steps turn to a filled check.
- Before you start: a big-number card "People on your current domain 159"; the sign-in connections that will be cut (Okta, chips Identity and Access Review); a yellow warning "Sign-in through your identity provider stops during the change" (sessions last up to 8 hours); a blue "What to expect" note (about a minute; auditors and guests keep their address; HR and other connections stay; nobody is emailed).
- Verify: an address on the new domain, "Send code", a 6-digit code valid 10 minutes.
- Who should move: checkboxes with counts; Current employee (147) and Current contractor (0) ticked and locked ("Required"), then Future hire, Former employee (2), Former contractor (2), the manually added variants, Out of scope (ignore), Out of scope (service account), Unknown, "No employment status, such as pending invites (4)"; a Summary of two big-number cards, Moving 147 and Not moving 12.
- Choose the email format: keep the current format or build from names (jane.doe, jdoe), with a preview table.
- Review and confirm: "Moving to newco.com 147", "Not moving 12", a Summary card (New domain, Email format "Keep current format", Who moves), the connections to reconnect, then "Change domain".
- Reconnect: Okta reads "Disconnected" (red chip) with "Reconnect", or "Reconnect later".
- All done: a blue banner "Sign out and sign back in to finish" with "Sign out" and "Start over"; Sign-in connections; Summary cards Moved 147 / Not moved 12, each listing its groups with counts.
- All or nothing: a failure puts everything back; errors are short sentences with a Reference ID for Support.

Flow edges:
- → Settings › Domain Change → Start → steps 1–5 → Change domain → Making the change → Reconnect (or later, from Connections) → All done → Sign out → sign in with the new address.

Images: `../../images/ux/settings/change-your-company-s-email-domain--03.png`, `../../images/ux/settings/change-your-company-s-email-domain--05.png`, `../../images/ux/settings/change-your-company-s-email-domain--07.png`, `../../images/ux/settings/change-your-company-s-email-domain--09.png`.

### 2.11 Account access: remote access for Support

Layout:
- Title "Account access"; section "Grant Drata Support remote access" with one line on automatic revocation.
- Radios: No Access, View-only access, "Allowed to make changes ⓘ"; "Access expiration date (optional)" (a date with ✕); "Submit".
- A footer line "Access granted on Feb 14, 2026 at 5:50pm" (a link).
- Admin-only (the roles article also allows Information Security Leads and Workspace Managers).

Flow edges:
- → Get support → remote access link → Account access → level, expiry → Submit → access until the date → set back to No Access after troubleshooting.

Images: `../../images/ux/settings/grant-remote-access-to-drata-support--01.png`.

### 2.12 Role administration: Users and Guests

Layout:
- Title "Role administration", "Learn about Role Administration ↗"; line tabs Users | Guests | IdP Group Mappings; primary "Assign role".
- Users: left filter pane (Role, …), Filters, gear, search; one row a person with their roles.
- A user's panel: name as title; "Assigned Roles 1" with "Remove all" (red), "Go to role mapping", "Add role"; each role shows its name, a one-line description ("unrestricted access to the entire application") and its origin ("Manually assigned" or from an IdP group), with "Remove and reassign" and "Remove role" (red).
- "Change user role?" dialog: a warning that a new role drops the person's responsibilities by default unless kept, "New role" select, "Cancel" / "Confirm role change". Objects the person owned move to the Admin who made the change.
- Guests: search, "Invite guest" (secondary), table Email account, Date added, Last login ("—"), Responsibilities, row chevron. A guest is an outside administrator on a different domain, which Drata must approve.
- The roles: Admin, Access Reviewer, Control Manager, DevOps Engineer, Information Security Lead, Knowledge Base, Personnel Compliance Manager, Policy Manager, Risk Manager, Risk Register Owner, Workspace Manager (alone in its workspace), Internal Auditor, Trust User, Trust Center Manager and Reviewer. Most exist as base, Read-only (view, filter, download) and, for Control and Risk Managers, Restricted-view (only what they own or are assigned); roles add up.

Flow edges:
- → Assign role → person + role → confirm.
- → user → Remove and reassign → Change user role? → Confirm role change.
- → Guests → Invite guest → email → the guest signs in; → row → remove.
- → Go to role mapping → IdP Group Mappings (2.13).

Images: `../../images/ux/settings/manage-user-roles-in-drata--01.png`, `../../images/ux/settings/manage-user-roles-in-drata--02.png`, `../../images/ux/settings/manage-guest-administrators--01.png`.

### 2.13 Role administration: IdP group mappings

Layout:
- A one-line explanation with a "Connections" link.
- Empty state: a card with a gear illustration, "Create a mapping", one line, primary "+ Create mapping".
- Create mapping form: IdP group (from the SCIM sync) and Assign roles (several), with "Create another mapping on save".
- Mapping preview panel: "1 of 2", Previous / Next, Close; the role as title ("Admin"), "Edit mapping"; "IdP groups 2" listing each group with its members ("Unknown" avatars).
- Joining or leaving a mapped group grants or revokes the roles; manual roles sit beside them independently; a Workspace Manager in the target workspace loses that role, behind a warning and a confirmation.

Flow edges:
- → IdP Group Mappings → Create mapping → group + roles → Save → a row.
- → row → preview → Edit mapping → add or remove groups → Save.

Images: `../../images/ux/settings/map-idp-groups-to-drata-roles--01.png`, `../../images/ux/settings/map-idp-groups-to-drata-roles--03.png`.

### 2.14 Workspaces list and workspace record

Layout:
- Settings › Workspaces: title "Workspaces", "Add workspace" (secondary, top right); gear and "Search workspaces"; table Name (icon, name, "Primary workspace" under it), Managers (avatar stack), Frameworks (chips "SOC 2", "ISO 27001:2013", "CCPA", "+73"), row chevron; "50 per page" and first / previous / next / last.
- The workspace record: breadcrumb "Workspaces /", the workspace icon and name as title; a two-column grid of cards, each with its own "Edit":
  - "Workspace details": Workspace icon, Name, URL, Description ("—"), "How does this workspace work?" ("—").
  - "Managers": "3 managers assigned" and the list.
  - "Frameworks": "Assigned frameworks" as chips (SOC 2, ISO 27001:2013, CCPA, GDPR, PCI DSS v3.2.1, NIST SP 800-53, NIST CSF, CMMC 2.0, NIST SP 800-171 Rev. 2, Microsoft SSPA, FFIEC, COBIT, SOX ITGC …).
  - "Personnel scoping": a count "90 / 90" beside the title; when not configured, an empty state with "Edit"; editing shows "IdP groups" (search) and "Copy groups from workspace (optional)", Save / Cancel.
- With personnel scoping on, the nav's Workspace group gains a "Personnel" item for that workspace; the account-wide list stays under Organization › Governance › All Personnel.
- A connection is assigned to workspaces in step 1 of its connect wizard ("Assign workspaces for this connection").
- Deciding rules from the articles: one workspace unless audit scope, ownership, access, systems or cadence truly differ; MIM only for separate accounts.

Flow edges:
- → Settings › Workspaces → Add workspace → name, frameworks → a row.
- → row → workspace record → Edit on a card → inline form → Save.
- → Personnel scoping › Edit → IdP groups → Save → the workspace's personnel and tests narrow to those people.

Images: `../../images/ux/workspaces/configure-workspace-details-frameworks-and-connections--01.png`, `../../images/ux/workspaces/configure-workspace-details-frameworks-and-connections--02.png`, `../../images/ux/workspaces/scope-personnel-to-a-workspace--01.png`.

### 2.15 Workspace picker and workspace-aware records

Layout:
- The picker sits in the top bar, always visible: the current workspace's icon and name with "⌄"; open, it lists the current one with a "Primary" chip, then "Other workspaces".
- What follows the picker: controls, tests, monitoring results, evidence state, workspace tasks, and workspace-aware events (tests, monitoring, audit activity); what does not: policies, vendors, personnel by default, organisation events (policy changes, auditor logins), risk tasks (primary workspace only).
- Workflows on controls or evidence name the workspace they run in; tickets from a non-primary workspace carry its name.

Flow edges:
- → picker → another workspace → the same page reloads in that workspace.

Images: `../../images/ux/workspaces/create-and-manage-workspace-tickets--01.png`.

### 2.16 Mapping a control, policy or evidence across workspaces

Layout:
- The control record (new layout), seen here at full width: a code chip with a status glyph ("DCF-73", red for not ready), the name as title, "⋯" at top right.
- A fact row under the title: Progress "4 of 5", Owner "—" (pencil), Frameworks chips "+12 more" (pencil), "Mapped workspaces" chips "Drata", "Tiny Tech Inc" (pencil).
- Line tabs: Overview, Evidence, Monitoring, Policies (count chip 1, red), Frameworks, Risks, Workflows.
- Overview: a "Readiness" bar "4 of 5", then four summary cards in a row:
  - Evidence: "Not factored", legend "Not factored 1".
  - Monitoring: "Not factored 4".
  - Policies: "Not ready", "Not published 1", "Published 4".
  - Approvals: one line and "Set up approvals".
- Below, an Info card (Name, Code, Description; Edit), Owners ("No owners assigned"; Assign), "Review and approval" (Set up; an inner "Required approvals" note), and "Mapped workspaces" (one line, "Learn more", chips, "Manage").
- The card shows only when a control with the same code exists in another workspace. Mapping shares control info, owners (unless "Control owners are unique per workspace" is ticked), policies and Evidence Library items; test instances and monitoring stay per workspace.
- "Map Evidence" dialog: "0 evidence selected" under the title, "Select evidence" (search), "Map to additional workspaces (optional)" with "Current workspace is automatically mapped" and a "Current workspace" chip; footer "Create evidence" at left, "Cancel" / "Save" at right.

Flow edges:
- → control → Mapped workspaces › Manage → pick workspaces with the same code → Save → later edits to info, owners, policies, evidence apply to all.
- → Evidence tab › Add evidence › map existing → Map Evidence → evidence + workspaces → Save.
- → chip ✕ → unmap → the control becomes independent in that workspace.

Images: `../../images/ux/controls/map-controls-policies-and-evidence-across-workspaces--02.png`, `../../images/ux/evidence/map-controls-policies-and-evidence-across-workspaces--06.png`.

### 2.17 Multi-instance Management portal and dashboards

Layout:
- MIM portal (for MSSPs, vCISOs, parent companies): a table of accounts, each row the account's logo, name as an external link and its domain, plus a "Trust By SafeBase" column ("Get started with SafeBase ↗", "SafeBase Single Sign-On ↗"); opening an account enters it, and a way back returns to the portal.
- MIM Dashboard (text only): searchable, sortable sections at three levels.
  - Account: Active connections, Approved policies, Tests passing %, Tests failing %, Onboarding completion %, Risk assessment completion %.
  - Workspace: Non-ready controls, Control readiness %, passing / failing counts per test category (Infrastructure, Identity, Version control, Ticketing, Observability, Policy, In Drata, Agent).
  - Framework.
- Workspaces Dashboard (Beta, text only): from the Dashboard page, one row per workspace with Non-ready controls, Control Readiness, Tests passing, Tests failing (errors excluded) and each framework's readiness; data refreshed hourly with a banner giving the time.
- The avatar menu's Appearance submenu offers Light, Dark, System.

Flow edges:
- → MIM portal → account link → that account's app → back to the portal.
- → Dashboard → Workspaces dashboard → a workspace row (inferred: opens that workspace).

Images: `../../images/ux/workspaces/introducing-the-updated-multi-instance-management-portal--01.png`.

### 2.18 Custom fields and formulas

Layout:
- Settings › Fields and formulas: line tabs Fields | Formulas; Filters, gear, search; table Field Name (with a description line), Type (Number, Currency, Short answer, Long answer, Dropdown (alphanumeric), Dropdown (numbers), Date, URL), Status chip (Visible blue / Hidden grey), Placement ("Assets > Details", "Controls > Info", "Risks > Treatment"), row chevron; "1-50 of 56".
- Field record: breadcrumb, name as title, "Delete field" (red, trash icon); cards Details (Name, Description), Placement ("This custom field does not have any assigned locations"), Field (Type, Currency type, Required False, Status Visible), each with Edit.
- "Create field": "← Back to fields", a three-part segmented progress bar (Details ✓, Placement half-filled, Field dashed); step Placement asks "Where do you want your field to appear?" with Location and Section selects, "Remove" (red), "Add placement"; footer "Go back" / "Save placement".
- Placements: Assets › Details, Controls › Info, Framework requirements › Overview, Personnel › Personnel Details, Policies › Details, Risks › Details / Assessment / Treatment, Vendors › Vendor Details / Internal details. Limits: 500 fields, 50 with placements; type and currency lock after save.
- Long answer fields render Markdown in their read view (the risk Details title shows raw characters while editing).
- Formulas combine number fields (the FAIR recipe multiplies frequency by magnitude into loss exposure on risks).

Flow edges:
- → Create field → Details → Placement → Field → Save → a row; the field appears in that section of each record and as a column in that page's CSV.
- → row → field record → Edit on a card, or Delete field (removes all data, cannot be undone).

Images: `../../images/ux/workflows/custom-fields-overview--01.png`, `../../images/ux/workflows/custom-fields-overview--02.png`.

### 2.19 Workflows

Layout:
- Settings › Workflows: tabs Active | Archived; "Create Workflow"; table Name, Type (Control, Risk, Evidence, Personnel), Version ("V1", "Draft"), Status (Published / Unpublished), Run errors, Created by, Workspace, Last updated; filter by status, search.
- Create opens a modal (name, target object type, workspace for controls and evidence), then a builder page with three parts: Start (all controls, or selected ones), Trigger (one), Steps (several, run in parallel, each retried up to three times).
- Control triggers: details updated; readiness changed to "Not ready" or "Ready"; evidence, policy, test or requirement linked or unlinked; mapped test passing or failing; owner updated; marked in-scope or out-of-scope. Risk: inherent or residual score crosses a set condition, treatment changes. Evidence: renewal N days ahead, upload. Personnel: out of compliance for N days in chosen categories.
- Steps: Create task (controls and risks only), Send email, Send Slack message, Send Microsoft Teams message, Send webhook.
- Create task step: Title with variable chips ("Review new evidence linked to [Control Name]") and "‹› Insert variable"; "Assign the task" by Individual, Role or Responsibility (chip "Control owner ✕", "Remove All"); Description (Optional) with variables ("[Evidence Name] … [Control Code] … [Linked By]"); "Resolution timeline": "15 Days after task creation".
- Slack step: channel, message with variables; the posted message has a "Go to control" button.
- Workflow page: Actions menu (Edit draft, View published version, Publish changes, Unpublish, Duplicate; for drafts Publish, Archive, Delete) and a run history (time, object id, version, status).

Flow edges:
- → Create Workflow → modal → builder → Save as draft or Publish → a row.
- → trigger fires → steps run → a task appears on Tasks / a message posts → run history logs it.

Images: `../../images/ux/workflows/create-workflow-for-control--01.png`.

### 2.20 Tasks page and Create task

Layout:
- Title "Tasks"; primary "Create task" with a "▾" (Create tasks in bulk).
- Left filter pane: "Clear all filters", Status checkboxes (Past due, Incomplete, Completed), Type ("All types"), Owner ("All owners"), Year ("2026 (9944 tasks)"), then a month list with counts, months holding overdue work in red pills (January 4369, February 3534) and the rest in grey (March 185 … July 201).
- The main column, headed by the month ("February 2026"), groups tasks by type in collapsible cards, each one line: "Evidence renewals 65 open tasks including 8 past due, 9 due soon"; General 108 (29, 30); Controls 3,308 (1589, 1715); Risk management 16 (4, 5); Required policy approvals 19 (7, 5); Policy renewals 10 (1, 1); Required control approvals 2 (1 past due). "Past due" is red, "due soon" amber.
- An expanded task shows either "Review in Risk Management" (or the object's own page) or "Mark complete".
- Create task dialog: Title, Description (0/30000), Task owner (search personnel), Due date, a toggle "Make this a recurring task", a grey "Mapped object" box ("Track tasks for a specific risk", "Map risk"); footer Close / Save.
- Automated tasks (policy renewals, control approvals, evidence renewals, vendor reviews) are made by Drata; custom tasks are general, risk or control tasks. Reminder emails: 7 days ahead, past due twice a week, annual tasks on the 15th.

Flow edges:
- → Create task → fields (+ Map risk / control) → Save → the task in its month and type group; also listed in the record's Tasks rail panel.
- → task ▾ → Review in … → the record → finishing the work completes the task; or Mark complete.

Images: `../../images/ux/tasks/manage-tasks-in-drata--01.png`, `../../images/ux/tasks/manage-risk-tasks-in-drata-new-experience--03.png`.

### 2.21 Bulk import custom tasks

Layout:
- A full-window import tool (a third-party style spreadsheet), ✕ at top right. Left rail: title "Import or Update Custom Tasks", "Additional Supporting Documents (Optional)", HELP › Quick guide, START HERE › "Task list" with a row count (a red dot when rows are invalid).
- Top bar: "Download validations results", "Submit" (disabled until no errors). Tab "Task list"; Filter, search, Actions; "N Records" with a segmented All / Valid 3 / Invalid 2.
- Empty grid: "Drag and drop or upload a file to get started", "Upload file", "Manually enter data".
- Map fields: "Review and confirm each mapping choice"; INCOMING FIELDS (12 of 12) → DESTINATION FIELDS (12 of 12) with a reset; each row a monospace source name, an arrow and a select (Title, Description, Due Date, Task Type, Assignee Email, Control ID, Risk ID, Repeat Every …); a "Data preview for title" card on the right; Exit / Back / Continue. Then Map field values for fixed lists.
- The grid: columns Title, Description, Due Date, Task Type, Assignee Email, then schedule columns Repeat Every, Schedule Type (Week, Month, Year chips), End Date, Days of Week (MO, FR), Day of Month (07, 15, "Last day"); red cells are errors, yellow warnings; header hovers give each column's rules.
- Submit opens "Import tasks?" with "Send email notifications to the task owners" (unchecked by default). Finished files are listed under Files › Available downloads.

Flow edges:
- → Tasks › Create task ▾ › Create tasks in bulk → upload → Map fields → Map values → grid → fix Invalid → Submit → Import tasks? → tasks created.

Images: `../../images/ux/tasks/bulk-import-custom-tasks--02.png`, `../../images/ux/tasks/bulk-import-custom-tasks--03.png`, `../../images/ux/tasks/bulk-import-custom-tasks--10.png`.

### 2.22 Tickets from a control or test

Layout:
- On a control (here DCF-134, code chip with a green check; Owner "Jose"; Frameworks "ISO 27001:2013", "HIPAA", "+4 more"; tabs Overview, Evidence, Monitoring, Policies, Frameworks, Workflows), the rail's ticket icon opens a "Tickets" panel: "There are 0 tickets in progress associated with this control", an illustrated empty card "Coordinate with other teams" and "Create ticket".
- The Overview's cards here read Evidence (one line and a button), Monitoring ("Map tests"), Policies "Ready" with "Published 1", Approvals.
- "Ticket Details" dialog: Destination (the connected tool, "GITLAB ISSUES"), Project, Ticket type ("Issue"), Summary prefilled as "Drata | <workspace> | <control code> | <control name>", then the tool's own fields; Cancel / "Create Ticket".
- Tickets need a ticketing connection with write access; only tickets made or linked from Drata appear; risk tickets and Jira automation stay account-wide.

Flow edges:
- → control or test → Tickets rail → Create ticket → Ticket Details → Create Ticket → listed in the panel, open in the external tool.

Images: `../../images/ux/tickets/create-and-manage-workspace-tickets--02.png`, `../../images/ux/tickets/create-and-manage-workspace-tickets--03.png`.

### 2.23 Audits page (Audit Hub)

Layout:
- Nav: Compliance › Audits (beside Controls, Frameworks, Monitoring, Evidence). Title "Audits"; primary "Create Audit"; line tabs All audits | Auditors.
- Left filter pane: Status (Active, Completed); Filter and Search above the grid.
- A grid of audit cards, three across: the framework badge (AICPA SOC 2), the name ("SOC 2 Type 1 - Drata"), the type line ("External audit" / "Internal audit"), a status chip at top right ("Completed" grey, "Active" light blue); then "Audit period" (one date for Type 1, a range for Type 2) and "Auditors" (avatars, "+3 more", or "Download only" when the audit is run outside Drata).
- Admins and Workspace Managers see it; Internal Auditors see only the internal audits they are assigned.

Flow edges:
- → Create Audit → the wizard (2.24) → a new card.
- → card → the audit page (2.25).
- → Auditors tab → "+ Add auditor" (2.27).

Images: `../../images/ux/audits/audits-page-overview-new-experience--01.png`.

### 2.24 Create audit (wizard)

Layout:
- A full page, "← Back to audits", title "Create Audit", a vertical numbered stepper at left: Audit type, Audit details, Assign auditors, Review (three steps when auditors come from a connected tool). Footer Cancel / Continue.
- Audit type: radio cards External audit / Internal audit; "Conduct audit": "Conduct audit in Drata" (with the logo; the auditor runs the audit end to end inside), "Connected audit tool" (sync with an outside tool, then "Configure connected audit tool": Tool "Fieldguide - FIELDGUIDE" and that tool's audit), "Download only" (only download material).
- Audit details: Framework ("SOC 2"), Audit period (a date range with a calendar), toggle "Include pre-audit package" (once on at creation it stays on), "Pre-audit package data" as removable chips: Assets, Company info, Connections, Control mapping, Evidence library, Infrastructure accounts, Personnel, Policies, "+3", "Clear all".
- Assign auditors: pick existing auditors or add new; for an internal audit, only IdP-synced people.
- Review: type, framework, period, auditors; Continue creates the audit.
- The auditor's own start wizard ("Start ISO 27001:2022 audit": Set samples, Customize evidence, Review): "Don't use custom evidence request list" (organise by the framework's requirements) or "Use custom evidence request list" (Download template, upload a CSV; a blank "Mapped DCF control" lets Drata suggest controls); "Control mapping review": "Auto-apply high-confidence mappings" or "Review all mappings".

Flow edges:
- → Audits › Create Audit → type → details → auditors → Review → Continue → a card on All audits; assigned auditors get an email link.
- → auditor › Start audit → samples → evidence list → Continue → the requests table fills.

Images: `../../images/ux/audits/internal-audits-in-drata-new-experience--02.png`, `../../images/ux/audits/pre-audit-evidence-packages-in-drata-new-experience--01.png`, `../../images/integrations/fieldguide/set-up-the-drata-fieldguide-integration-in-audit-hub--01.png`, `../../images/ux/audits/map-audit-requests-to-dcf-controls-with-ai--01.png`.

### 2.25 Audit page: request summary and requests table

Layout:
- Breadcrumb "Audits /"; the framework badge and audit name as title; "⋯", "Package downloads ⌄" and the primary at top right: "Complete audit" on an active audit, "Mark as active" on a completed one.
- Facts: Audit type "External", Audit period (pencil; only the tenant admin edits it).
- A blue banner "Audit pages can also be accessed by assigned auditors" with a link; elsewhere a banner says regenerating the package reflects updated data.
- Card "Assigned auditors" (Edit): each auditor's avatar, name and email; empty when none, with "no matching requests" in the table.
- Card "Request Summary": a donut "0% complete" with a legend Completed 0, Prepared 59, New 1 (and "Changes Requested" in red on another audit: Completed 0, Prepared 0, New 84).
- AI banner (yellow, when recommendations are on): "14 requests need your review", moderate-confidence mappings to confirm and 23 applied automatically, "Filter to review".
- Requests table: left pane (Messages: Unread; Status: Completed, Prepared, New; Request owners: Owners assigned / No owners assigned; Filter by request owner), Filters, gear, search, "Add Request ⌄"; columns Message (row "⋯" and an unread mark), Status chip ("Prepared" amber half-circle, "New" open circle), Recommendations ("Generating…", "3 need review"), ID (CC1.1, A1.3, PI1.1), Title (the criterion text, truncated), Controls (DCF chips, "+2"), Owners ("—"), row chevron; "1-50 of 60".
- Selecting rows raises a selection bar with "Generate recommendations" and "Accept recommendations".
- Package downloads menu: "Pre audit package ›" (Request package, Control Mapping, Connections, Vendors, Assets, Infrastructure access, Version control, "Evidence library — Manual evidence only", and Edit package), "Request control evidence", "View past downloads".

Flow edges:
- → card on Audits → this page.
- → row → the request page (2.26).
- → Package downloads → a ZIP built in the background → email link → View past downloads.
- → Complete audit → the card moves to Completed.

Images: `../../images/ux/audits/audits-page-overview-new-experience--02.png`, `../../images/ux/audits/audits-page-overview-new-experience--03.png`, `../../images/ux/audits/map-audit-requests-to-dcf-controls-with-ai--02.png`.

### 2.26 Audit request page and AI recommendations

Layout:
- Breadcrumb "Audits / <framework> /" (customer) or "Client List / <client> / <framework> /" (auditor); the request ID in a mono chip ("3.1.1", "A1.1", "P4.3.2") and its title; facts Status (chip) and Framework ("NIST 800-171r2", "SOC 2").
- The primary is a status dropdown carrying the current value ("Prepared ⌄", "New ⌄"): the customer moves New → Prepared, the auditor moves to Completed or back with changes requested. Evidence reaches the auditor only once the request is Prepared.
- Line tabs Overview | Evidence | Controls. Overview card (Edit): ID, Owners, Title, Description (the criterion or the auditor's ask).
- Recommendations card ("Regenerate" with a sparkle): settled rows "Mapped DCF-540 …" (blue) and "Dismissed DCF-549 …" (grey), each with "Undo"; an open card with a confidence chip ("Moderate confidence"), the control name and DCF code, its description, a grey AI rationale line, and "Map Control" / "Dismiss".
- A Messages panel on the right rail (the chat icon carries a red dot when unread): "Message" box (0/30000), "Add attachments", "Save", then the thread or "No messages yet". System messages note new evidence and status changes; threads can be marked read or unread.

Flow edges:
- → requests table row → this page → Evidence tab → the mapped evidence (opens in the evidence preview).
- → status dropdown → Prepared → evidence shared, auditor notified; auditor → Completed / Changes Requested → customer notified.
- → Map Control → the control's evidence joins the request.

Images: `../../images/ux/audits/map-audit-requests-to-dcf-controls-with-ai--04.png`, `../../images/ux/audits/view-and-open-evidence-from-the-audits-page-new-experience--02.png`, `../../images/ux/audits/using-the-drata-audit-portal-new-experience--05.png`.

### 2.27 Auditors on an audit

Layout:
- "Add auditor" dialog (from Audits › Auditors › "+ Add auditor"): First name, Last name, Email (a work domain; personal mail and the tenant's own domain refused), Firm, checkbox "Grant read-only access to the application" (see data beyond the audit), checkbox "Allow test, control, and requirement downloads" (needs read-only access), "Learn more about the auditor experience"; Close / Save.
- "Edit auditor details" dialog adds "Delete auditor".
- Being on the Auditors list grants nothing; assigning the auditor to an audit (Assigned auditors › Edit) sends the magic-link invitation.
- Firms generate and revoke their own Auditor API keys for their tools.

Flow edges:
- → Auditors › Add auditor → Save → on the list → audit › Assigned auditors › Edit → add → email invitation → the auditor's portal (2.28).

Images: `../../images/ux/audits/create-and-add-auditors-to-an-audit--01.png`.

### 2.28 The auditor's Audit Portal

Layout:
- Reached by "Go to the auditor login" on the sign-in page or the invitation link; the top bar reads "Audit Hub".
- Client list: one row per client the auditor serves (search).
- Client page: "← Back to Clients", the client's logo and name, "Admins" avatars, "View in read-only mode ↗" at top right (only with read-only access); left pane Status (Active, Completed), "Filters applied: Active ✕ Clear all"; audit cards as on the customer side ("SOC 2 Type 1", External audit / Internal audit, "Active", Audit period, Auditors) with "Open audit ›"; "50 per page".
- The audit page and request page match the customer's (2.25, 2.26): Request Summary donut, the requests table, Package downloads, Messages. The auditor can also add and delete requests, set and change evidence samples, and mark requests Completed.
- Same data both sides: packages are built from the same source; the difference is only in what each role may do.

Flow edges:
- → invitation → sign in → Client list → client → Open audit → requests → a request → messages, status.
- → Change evidence sample → new snapshot → regenerate the control evidence package.

Images: `../../images/ux/audits/what-auditors-can-see-in-audit-portal--02.png`, `../../images/ux/audits/using-the-drata-audit-portal-new-experience--04.png`, `../../images/ux/audits/using-the-drata-audit-portal-new-experience--05.png`.

### 2.29 Evidence package and manifest

Layout:
- The control evidence ZIP holds ControlEvidence/, AuditInfo.txt, Controls-to-Requirements.csv, Evidence/ (short random filenames) and evidence_manifest.html.
- The manifest is a plain HTML page titled "<framework> - Evidence Manifest": "Search Evidence", "Showing 1-10 of 279 records", "Page 1 of 28" with Previous / Next; table Requirement ("1798.100"), Control ("DCF536-…"), Original Path (mono, or "No evidence from selected samples.txt"), Abbreviated Filename (a link, "94.pdf").
- Two snapshots: the pre-audit package freezes at audit creation; the control evidence package freezes when samples are set. New evidence enters only after re-sampling (and, for the pre-audit package, only in a new audit or by regenerating after an edit).

Flow edges:
- → Package downloads › Request control evidence → email → unzip → open the manifest → click a filename → the file.

Images: `../../images/documentation/using-the-drata-evidence-package-and-manifest-file--01.png`.

### 2.30 Fieldguide-connected audit

Layout:
- Created with "Connected audit tool" in the wizard (2.24), after a Fieldguide connection is made in Connections with a token the auditor's client generates.
- The audit header names Fieldguide and a connection state: Connected, Disconnected or Error.
- Requests are created and their statuses governed in Fieldguide; evidence lives in Drata. Moving a request New → Prepared hands it over as "Ready for Review" in Fieldguide; a send-back syncs as changes requested. Evidence can be excluded from the hand-off. New comments sync both ways.
- The requests toolbar adds "Download" and "Update request" (an "Update requests in bulk" dialog with a CSV upload).
- AI recommendations run on synced requests and auto-apply high-confidence mappings, with no toggle.

Flow edges:
- → auditor sets up the engagement and invites the client → client token → Connections › Fieldguide → Create Audit › Connected audit tool → pick the engagement → requests sync → map to controls → attach evidence → Prepared → Fieldguide.

Images: `../../images/integrations/fieldguide/set-up-the-drata-fieldguide-integration-in-audit-hub--01.png`.

58 screenshots viewed in all.

## 3. The data model as the UI shows it

### 3.1 The chain

- connection (identity, HRIS, infrastructure, version control, ticketing, MDM, the Drata Agent) → test (Monitoring) → control (DCF code or custom) → framework requirement → framework. Policies and Evidence Library items attach to controls beside the tests; a control is Ready only when everything mapped to it is valid.
- personnel (from the IdP, enriched by the HRIS) → My Drata tasks (policy acceptance, training, background check, device, MFA) → personnel tests → personnel controls.
- control → tasks, tickets, internal notes (the utilities rail), workflows, approvals, risks.
- audit (framework, type, period, auditors, how conducted) → requests (an auditor's ask, an ID such as CC1.1) → mapped controls → their evidence, cut to the period and the sample → packages (pre-audit snapshot, control evidence ZIP with its manifest).
- Containers: MIM portal → account (personnel, policies, vendors, settings, roles) → workspace (frameworks, controls, tests, connections, managers, optional personnel scope). The same control code in two workspaces can be mapped so its info, owners, policies and library evidence are shared while tests and status stay apart.
- Access: user → roles (additive; base, Read-only, Restricted-view), each manual or granted by an IdP group mapping; guests and auditors are outside identities with their own doors.

### 3.2 What each record shows of the others

- Control: code chip with readiness glyph, Progress "4 of 5", Owner, Frameworks chips (+N more), Mapped workspaces; count tabs Evidence 3, Monitoring 2, Policies 1; Readiness bar over four cards (Evidence, Monitoring, Policies, Approvals); Info, Owners, Review and approval, Mapped workspaces; rail panels Notes, Tickets ("0 tickets in progress"), Tasks.
- Workspace: icon, name, URL, description, "3 managers assigned", framework chips, "Personnel scoping 90 / 90".
- Audit card: framework badge, name, External / Internal, status, period, auditors or "Download only".
- Audit: type, period, assigned auditors, request summary by status, an AI review banner, each request's status, recommendations, ID, title, controls, owners, unread messages.
- Request: ID, status, framework, owners, description, recommendations with confidence and rationale, Evidence and Controls tabs, a message thread with system messages.
- Task group (per month): type, open count, past due, due soon; a task's owner, due date, recurrence, mapped risk or control.
- User: assigned roles with their description and origin ("Manually assigned" or an IdP group); guest: date added, last login, responsibilities.
- Custom field: type, Visible / Hidden, placement, required.
- Workflow: type, version, status, run errors, workspace, run history.

### 3.3 Statuses and their words

- Control readiness: Ready / Not ready. Card states: "Not factored" (Evidence, Monitoring), Policies "Not ready" with Not published / Published counts. Evidence item: "Needs renewal". Valid evidence: test PASSING, policy published, library item inside its renewal date.
- Test: passing, failing, and "error" (could not decide; excluded from failing counts).
- My Drata: dashed ring (to do) / check (done); policy "Not Accepted" or the acceptance date.
- Task: Past due / Incomplete / Completed; group lines say "past due" (red) and "due soon" (amber).
- Audit: Active / Completed; External audit / Internal audit; conducted in Drata, through a connected audit tool, or download only.
- Request: New → Prepared (the customer) → Completed or Changes Requested (the auditor); Deleted (auditor). The auditor guide also says "In progress".
- Recommendation: "Generating…", "N need review"; High / Moderate confidence; Mapped / Dismissed (with Undo).
- Fieldguide connection: Connected / Disconnected / Error. A sign-in connection after a domain change: Disconnected.
- Notification rule: Active / Disabled. Workflow: Published / Unpublished, version "Draft" / "V1", tabs Active / Archived. Custom field: Visible / Hidden.
- Remote access: No Access / View-only access / Allowed to make changes.
- Employment groups (domain wizard): Current employee, Current contractor, Future hire, Former employee, Former contractor (each also "manually added"), Out of scope (ignore), Out of scope (service account), Unknown, No employment status.

### 3.4 Numbers seen, for scale

- Tasks in one account: 9,944 in 2026; January 4,369 and February 3,534; February's Controls group 3,308 open, 1,589 past due, 1,715 due soon; Evidence renewals 65 (8, 9).
- Audits: a SOC 2 Type 1 with 60 requests (59 Prepared, 1 New, 0% complete); another with 84 New, 14 needing AI review and 23 auto-applied.
- Evidence manifest: 279 records over 28 pages.
- A workspace with 76 frameworks (3 chips + 73) and personnel scoped 90 / 90; a control in 14 frameworks.
- Domain change: 159 people, 147 moving, 12 not.
- Custom fields: 56 defined; limits 500 fields, 50 with placements.
- Quick Start at 80%: sections 0 of 1, 4 of 4, 3 of 3, 5 of 5.
- Rollout: five phases over weeks 0 to 14+; seven integrations in order, IdP first.

## 4. For Program Assurance

- **A setup checklist that only points.** Quick Start's sections ("N of M completed", one overall %) each send the reader to the page that does the work and do nothing themselves. A program's first month in PA could work the same way, as a short list on the program's Overview: categorise, baseline, allocate requirements, assign RMF roles, link first evidence, plan the first assessment. Each item opens the existing screen. Keep the counts and drop the rainbow bars. Never let the checklist become a second place to edit.
- **Release evidence by status.** An auditor sees a request's evidence only after the team moves it New → Prepared, and only the auditor moves it to Completed or Changes Requested. PA's assessment objectives and Review queue can use the same handshake, with the assessor's verbs kept to the assessor (the held-to-acts rule already in `program_role_assignments`). Take the request page's message rail with system messages ("new evidence attached", "status changed") as the conversation record for an objective.
- **Freeze what the assessor saw.** Drata cuts evidence to the audit period and freezes it when samples are set; the manifest lists requirement, control, original path and file, with "No evidence from selected samples" written out. PA's published assessment results and SSP revisions are already immutable. An authorization package export should carry the same manifest, and absent evidence should appear as a loud row, never as a missing one.
- **AI mapping with a confidence chip and a rationale.** Request → control recommendations show a confidence chip, the control, a one-line rationale and Map Control / Dismiss with Undo. The threshold (auto-apply high, or review all) is chosen before generation, and each action is logged to Events. This fits Map a requirement and the customer requirements import. Keep review the default for RMF: a mapping decides coverage on every boundary, so nothing should apply silently.
- **Show what moves before a risky command.** The Change email domain wizard is the model for any PA command that moves many records: counts first ("People on your current domain 159"), required groups ticked and locked, Moving 147 / Not moving 12, a consequences banner, all-or-nothing, a Reference ID on failure. Use it for Edit overlays, Take version, and publishing results, inside PA's Flow page type (one decision, the footer's primary).
- **One line per group, with past due in warning words.** The Tasks page's "65 open tasks including 8 past due, 9 due soon" is principle 4 and 5 in one line, and suits POA&M milestones and My work. Leave Drata's habit of making an automated task for every control: 3,308 control tasks in one month is noise, not a worklist.
- **Shared, but status stays home.** The control's "Mapped workspaces" card shares info, owners, policies and evidence across workspaces while tests and status stay separate. That is PA's shared component assessed once, with standing per program. Borrow the card ("Manage", chips) for Where used, and publish an explicit "what is shared, what is yours" table like Drata's. Leave the workspace picker as hidden context: PA keeps the program in the address and on the page (principle 6).
- **Roles stay RMF's, not page bundles.** Drata's roles are page-access bundles with Read-only and Restricted-view variants, mapped from IdP groups. PA should keep RMF's roles held to acts. It can borrow two pieces: "Restricted view" as a default filter (only what I own) for control implementers, and the "Change user role?" warning that responsibilities will move, which PA's owner reassignment should show by count before it runs.

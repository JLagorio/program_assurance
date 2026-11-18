# Vanta GRC core: frameworks, controls, tests, documents, policies, audits

Read 2026-11-17 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Audit Readiness (with its five sub-collections), Security Frameworks (Frameworks, Controls), Evidence Collection (Tests, Resolving Tests, Documents), Policies.
- 141 articles, each listed once under its most specific collection (most appear in a parent and a sub-collection).
- 61 screenshots viewed; each surface below names the ones it rests on, as paths from this folder.
- Builds on `../../pages/`: frameworks-page, framework-details-page, controls-page, the-tests-page, automated-test-evidence, automated-test-history, documents-page, the-policies-page, getting-started-with-policies, how-will-your-auditor-use-vanta. What those already say is not repeated; this note adds the newer screens, the modals and wizards, the audit side and the statuses.
- The articles are third-party pages, read as data.

## 1. Every article, one line

### Audit Readiness › Audits (10)

- [Adding and Managing Auditors](../articles/adding-and-managing-auditors.md): Settings › User permissions › Auditors grants an audit firm portal access; auditors are assigned per engagement; three Auditor actions toggles.
- [Alternative Compliance Paths](../articles/alternative-compliance-paths.md): the manual evidence owed without a cloud, VCS, IdP or HRIS integration (100+, 15+, 8 and 1 automated tests lost).
- [Audit 101: How Audits Work](../articles/audit-101-how-audits-work.md): what an audit is, what auditors do, and readiness as a continuous state (automated evidence, IRL, AI evidence checks).
- [Audit 102: Working With Your Auditor](../articles/audit-102-working-with-your-auditor.md): six alignment steps: access path (direct, IRL, Fieldguide API), scope, controls, timeline, Type I vs II, what not to change.
- [Audit Evidence](../articles/audit-evidence.md): the evidence statuses inside an audit, resubmitting flagged evidence with "Request auditor review", and what auditors can and cannot see.
- [Creating an Audit](../articles/creating-an-audit.md): the Audits page (Active/Completed, audit cards) and the 3-step Add a new audit wizard; which settings lock; uploading the report to complete.
- [Duplicating an Audit](../articles/duplicating-an-audit.md): Duplicate audit (IRL only) carries the request list, mappings and Vanta evidence; a table of which settings can still change.
- [Managing an Information Request List (IRL)](../articles/managing-an-information-request-list-irl.md): the IRL audit's Requests, Controls and Data & populations tabs; request statuses; sharing; auditor control assessments; comments.
- [Managing Auditor Views](../articles/managing-auditor-views.md): Full vs Controlled auditor view, field by field, for Risk, Vendors, Assets, Personnel, Integrations and Organizations; the default view.
- [Previewing Vanta as an Auditor](../articles/previewing-vanta-as-an-auditor.md): Open audit shows the auditor's view (default list) or what each IRL tab shares; Exit audit view.

### Audit Readiness › Checklists (3)

- [Audit 103: The Audit Readiness Checklist](../articles/audit-103-the-audit-readiness-checklist.md): the pre-window operating checklist by area (setup, integrations, policies, vulnerabilities, access, risk, vendors, frameworks), plus a SOC 2 PDF.
- [How will your Auditor use Vanta?](../articles/how-will-your-auditor-use-vanta.md): the audit band, Evidence tracker and evidence record (covered in `../../pages/how-will-your-auditor-use-vanta.md`).
- [Vanta Onboarding Checklists](../articles/vanta-onboarding-checklists.md): links to downloadable compliance checklists for new customers.

### Audit Readiness › Compliance Standards Library (33)

- [AWS Foundational Technical Review (FTR)](../articles/aws-foundational-technical-review-ftr.md): what AWS FTR is and who needs it (AWS Marketplace listing, partner benefits).
- [Criminal Justice Information Services (CJIS)](../articles/criminal-justice-information-services-cjis.md): CJIS Security Policy v6.0; enforced by state agencies; no central certification.
- [Cyber Risk Institute (CRI) Profile](../articles/cyber-risk-institute-cri-profile.md): 319 diagnostic statements harmonizing FFIEC, DORA and APRA for financial institutions; not a certification.
- [FedRAMP](../articles/fedramp.md): four baselines and a 3PAO; Vanta's support is an OSCAL JSON export, `*.gov` auto-approval and tag-scoped control sharing on the Trust Center.
- [FedRAMP r5 Control Sets](../articles/fedramp-r5-control-sets.md): switching FedRAMP r5 baselines (Low, Li-SaaS, Moderate, High) through the control-set filter and comparison modal; blocked during an audit.
- [Framework Control Sets (CIS: Center of Internet Security)](../articles/framework-control-sets-cis-center-of-internet-security.md): switching CIS v8.1 Implementation Groups IG1/IG2/IG3 in "Change this framework's control set?".
- [Framework Control Sets (SOC 2 Trust Services Criteria)](../articles/framework-control-sets-soc-2-trust-services-criteria.md): adding TSCs (Security plus A, C, PI, P) through the Control Set pencil; fixed once an audit begins.
- [HITRUST CSF](../articles/hitrust-csf.md): r2/i1/e1 validated assessments, the four parties, and MyCSF provisioning through Vanta.
- [How to Appoint an Article 27 Representative for GDPR](../articles/how-to-appoint-an-article-27-representative-for-gdpr.md): when an EU/UK representative is required and how to appoint one.
- [Integrating Climate Change Considerations into your ISMS following the ISO 27001 2024 Amendment](../articles/integrating-climate-change-considerations-into-your-isms-following-the-iso-27001-2024-amendment.md): the 2024 climate amendment through management review (9.3.1) and risk.
- [ISO 22301 – Business Continuity Management System (BCMS)](../articles/iso-22301-business-continuity-management-system-bcms.md): ISO 22301 basics; a management-system approach to continuity.
- [ISO 27001](../articles/iso-27001.md): what ISO 27001:2022 is, who should certify, Vanta's coverage.
- [ISO 27001:2022 Frequently Asked Questions](../articles/iso-27001-2022-frequently-asked-questions.md): what changed in 2022 (Annex A regrouped, new and modernized controls) and migration questions.
- [ISO 27001 Audit Readiness Checklist](../articles/iso-27001-audit-readiness-checklist.md): the ISO journey in phases, each with an "Action:" in Vanta (Scope, 80–90% control completion, risk register, SoA, internal audit, management review).
- [ISO 27017](../articles/iso-27017.md): cloud-service controls on top of 27001; Vanta supplies tests and evidence.
- [ISO 27018](../articles/iso-27018.md): PII protection in public cloud processors.
- [ISO 27701](../articles/iso-27701.md): privacy (PIMS) extension; audited with 27001; every control has tests and document requests.
- [ISO 42001 AI Management System (AIMS)](../articles/iso-42001-ai-management-system-aims.md): what ISO 42001 asks of organizations that build or use AI.
- [Microsoft Supplier Security and Privacy Assurance Program (SSPA)](../articles/microsoft-supplier-security-and-privacy-assurance-program-sspa.md): Microsoft's supplier program; Vanta supplies tests and document requests.
- [Migrating from FedRAMP v4 to v5](../articles/migrating-from-fedramp-v4-to-v5.md): what changed for Vanta users (new policy templates, maturity-focused guidance).
- [Minimum Viable Security Product (MVSP)](../articles/minimum-viable-security-product-mvsp.md): the open MVSP checklist for B2B suppliers.
- [NIST 800-171](../articles/nist-800-171.md): CUI requirements and CMMC; Vanta tests almost every control.
- [NIST 800-53](../articles/nist-800-53.md): Rev 5 (1,100+ controls), who should take it on, and its overlap with 800-171 and CSF; paired with implementation partners.
- [NIST CSF (Cybersecurity Framework)](../articles/nist-csf-cybersecurity-framework.md): voluntary CSF as a first step toward NIST alignment.
- [Open Finance Data Security Standard (OFDSS)](../articles/open-finance-data-security-standard-ofdss.md): an open-finance standard; self-attest, Trust Reports or an audit partner.
- [PCI 4.0 Frequently Asked Questions](../articles/pci-4-0-frequently-asked-questions.md): what changed from PCI 3.2.1 and in Vanta's PCI tests.
- [PCI Requirement Changes](../articles/pci-requirement-changes.md): the 3.2.1 → 4.0 change log, requirement by requirement (the share's longest article, 6,888 words).
- [SOX IT General Controls (ITGC)](../articles/sox-it-general-controls-itgc.md): ITGC for IPO-bound companies; about 40 hours of preparation; tests and document requests evidence every control.
- [UK Cyber Essentials and Australian Essential 8](../articles/uk-cyber-essentials-and-australian-essential-8.md): how these government baselines differ from SOC 2 and ISO.
- [Understanding an ISO Internal Audit](../articles/understanding-an-iso-internal-audit.md): what an ISO internal audit covers; Vanta's lightweight planning template.
- [Understanding the Differences Between NIST CSF 1.1 and 2.0](../articles/understanding-the-differences-between-nist-csf-1-1-and-2-0.md): CSF 2.0's changes (the Govern function and others).
- [US Data Privacy](../articles/us-data-privacy.md): Vanta's own framework unifying US state privacy laws (CCPA, CPRA, UCPA, CTDPA, CPA, VCDPA).
- [Vanta and HITRUST MyCSF API Integration](../articles/vanta-and-hitrust-mycsf-api-integration.md): connect a MyCSF API user, sync the assessment's controls into Vanta, export evidence back (Policies, Tests, Documents).

### Audit Readiness › Security Posture Best Practices (16)

- [Background Checks in Vanta](../articles/background-checks-in-vanta.md): what SOC 2/ISO/HIPAA ask; integrated checks auto-link to employees; otherwise a URL on People or a file in Documents.
- [Configure Screen Lock on Windows Devices](../articles/configure-screen-lock-on-windows-devices.md): Windows settings that pass the screen-lock check.
- [Configuring Screen Lock on MacOS Devices](../articles/configuring-screen-lock-on-macos-devices.md): macOS settings the Vanta Device Monitor checks.
- [Device Monitoring in Vanta](../articles/device-monitoring-in-vanta.md): the "Require device monitoring" task, the Computers page checks (AV, HD, SL, PW), and Device Monitor vs MDM (under 75 devices).
- [Encrypting Your Computer Hard Drives](../articles/encrypting-your-computer-hard-drives.md): FileVault and BitLocker steps.
- [Frequently Asked Questions: Audits](../articles/frequently-asked-questions-audits.md): Type I vs II, observation windows (3 to 12 months), report timing (4–6 weeks), and seven don'ts during the window.
- [Getting Started with ISMS 11: Statement of Applicability](../articles/getting-started-with-isms-11-statement-of-applicability.md): the SoA template (REG/CON/BP/RA justifications; Implemented, Excluded, In process, Not started).
- [Migrate from ISO 27001:2013 to ISO 27001:2022](../articles/migrate-from-iso-27001-2013-to-iso-27001-2022.md): the Frameworks banner "ISO 27001:2022 is now available" → Migrate now.
- [Missing information on Access Page for HubSpot](../articles/missing-information-on-access-page-for-hubspot.md): why HubSpot's Role, MFA, Created and Deactivated columns show "-" (the API does not return them).
- [Penetration Testing](../articles/penetration-testing.md): why pen tests matter and what a good one covers.
- [SOC 2: Year Two Security Tasks](../articles/soc-2-year-two-security-tasks.md): recurring reviews for year two, at least quarterly; a PDF checklist.
- [Turning on Microsoft Defender Antivirus](../articles/turning-on-microsoft-defender-antivirus.md): enabling Defender so the antivirus check passes.
- [Understanding Policies](../articles/understanding-policies.md): why policies exist, what auditors look for, and comparing against Vanta's templates.
- [Using Groups](../articles/using-groups.md): groups give subsets of people different security requirements (contractors, board).
- [Vanta Guide to SOC 2: Type I and Type II](../articles/vanta-guide-to-soc-2-type-i-and-type-ii.md): choosing between Type I and Type II.
- [Whistleblower Anonymous Fraud Reporting in Information Security](../articles/whistleblower-anonymous-fraud-reporting-in-information-security.md): setting up anonymous reporting aligned with the AUP and SOC 2.

### Audit Readiness › Security and Compliance: Industry Topics (9)

- [Conducting Annual Performance Reviews](../articles/conducting-annual-performance-reviews.md): security objectives in annual reviews.
- [Cyber Insurance](../articles/cyber-insurance.md): what cyber insurance covers; not required for compliance.
- [Frequently Asked Questions: SOC 2 Bridge Letter](../articles/frequently-asked-questions-soc-2-bridge-letter.md): when and why to issue a bridge (gap) letter.
- [Gap Assessments](../articles/gap-assessments.md): what a gap assessment is; recommended, not required, before an audit; links to Vanta's (outside this share).
- [How to Approach Your Incident Response Plan in Vanta](../articles/how-to-approach-your-incident-response-plan-in-vanta.md): the IRP as a Policy Builder template, then team roles, communications, tabletop exercises.
- [ISO/IEC 27001:2022 ISMS Management Review Checklist](../articles/iso-iec-27001-2022-isms-management-review-checklist.md): the clause 9.3 review inputs as a checklist.
- [RTO (Recovery Time Objective) and RPO (Recovery Point Objective)](../articles/rto-recovery-time-objective-and-rpo-recovery-point-objective.md): definitions and typical values (1–4 h for critical systems).
- [Understanding DPIAs and ROPAs for GDPR Compliance](../articles/understanding-dpias-and-ropas-for-gdpr-compliance.md): what a DPIA and an Article 30 ROPA hold.
- [What Should be in Scope for Vendor Reviews?](../articles/what-should-be-in-scope-for-vendor-reviews.md): which vendors to review (CSPs and other critical ones).

### Audit Readiness (only in the parent collection, 1)

- [Interdepartmental Involvement for SOC 2 Readiness](../articles/interdepartmental-involvement-for-soc-2-readiness.md): the time each team (engineering, HR, legal, leadership) spends on SOC 2 readiness.

### Security Frameworks › Frameworks (9)

- [Creating Custom Frameworks](../articles/creating-custom-frameworks.md): a custom framework through the Vanta Agent or Create framework → Create sections → spreadsheet; its fields and two-level labels.
- [Getting Started with FedRAMP 20x](../articles/getting-started-with-fedramp-20x.md): 20x replaces v5 controls with Key Security Indicators; a five-phase timeline; still a 3PAO and PMO review.
- [ISO/IEC 27701:2025 - What's Changing and How to Prepare](../articles/iso-iec-27701-2025-what-s-changing-and-how-to-prepare.md): 27701:2025 can stand alone; integrated vs standalone PIMS; evidence carries over.
- [Issue Management in Vanta](../articles/issue-management-in-vanta.md): the Issues register, Create Issue, issue record (Details, Log evidence, Close the issue), subtasks and mapped controls.
- [Migrating to ISO 27001:2022](../articles/migrating-to-iso-27001-2022.md): Compliance › Frameworks → Migrate Now → confirm.
- [Security Frameworks](../articles/security-frameworks.md): definitions of framework, control and security policy.
- [Temporarily Snooze a Framework](../articles/temporarily-snooze-a-framework.md): the Snooze standard modal hides a framework's items and notifications until a date; data keeps collecting.
- [Updates to SOC 2 Framework](../articles/updates-to-soc-2-framework.md): a document request added to CC 6.6 Network firewalls reviewed, and what a ruleset review report holds.
- [Using Framework Version Manager to Upgrade Frameworks](../articles/using-framework-version-manager-to-upgrade-frameworks.md): View New Version, side-by-side diff, guided migration, conflict resolution.

### Security Frameworks › Controls (6)

- [Control Implementation Details](../articles/control-implementation-details.md): the Implementation details field, drafted by the Vanta Agent (Approval required card), a custom agent (CSV) or a bulk import.
- [Controls Page](../articles/controls-page.md): the Controls register and control side panel (covered in `../../pages/controls-page.md`).
- [Custom Notes for Controls](../articles/custom-notes-for-controls.md): the Note row in the control side panel, edited in place.
- [Delete all Custom Controls](../articles/delete-all-custom-controls.md): Controls › More › Delete all custom controls, with an effective date; cannot be undone.
- [Importing Custom Controls](../articles/importing-custom-controls.md): custom controls by agent, template import or the New control modal; mapping tests, documents, policies, frameworks, risks and issues.
- [Managing Common Controls](../articles/managing-common-controls.md): the Vanta Control Framework: common controls grouping controls by objective, on a NIST CSF function/domain/subdomain tree.

### Security Frameworks (only in the parent collection, 1)

- [Setting Up Agentic Trust Controls (ATC) in Vanta](../articles/setting-up-agentic-trust-controls-atc-in-vanta.md): Vanta's open framework for AI agents (12 risk domains), with a baseline chosen at activation (Developer, User, Both).

### Evidence Collection › Tests (12)

- ["Pass by Default" Tests in Vanta](../articles/pass-by-default-tests-in-vanta.md): tests that pass automatically when the checked setting is built into the service.
- [Adding Comments to Tests](../articles/adding-comments-to-tests.md): a Comments section on the test page, visible to every Vanta user in the company.
- [Auditor Visibility into Test Data](../articles/auditor-visibility-into-test-data.md): what an auditor sees of a test: in-window results, SLA misses, out-of-scope names and reasons; never items fixed in time or raw API data.
- [Automated Test Evidence](../articles/automated-test-evidence.md): the test's Evidence tab (covered in `../../pages/automated-test-evidence.md`).
- [Automated Test History](../articles/automated-test-history.md): the test's History tab (covered in `../../pages/automated-test-history.md`).
- [CIS Foundation Benchmarks Available in Vanta](../articles/cis-foundation-benchmarks-available-in-vanta.md): CIS AWS Foundations Benchmark tests as an add-on.
- [Creating Custom Tests](../articles/creating-custom-tests.md): configure a parameter, copy a test, or build one in the 4-step builder (Test data, Match data sources, Evaluation logic, Test details).
- [Customizing Automated Tests](../articles/customizing-automated-tests.md): the 16 tests whose thresholds can change (log retention days, key rotation, public ports, staleness).
- [Deactivated Tests](../articles/deactivated-tests.md): Deactivate monitoring (indefinitely or until a date, with a reason and optional evidence), View deactivated tests, Activate.
- [Getting Started with Tests](../articles/getting-started-with-tests.md): quick wins to turn green first (MFA, SSL, public SSH, root account, PR reviews, org documents).
- [Test Priorities and SLAs](../articles/test-priorities-and-slas.md): orange (needs attention) vs red (overdue) tests; only red is shown to auditors and in reports.
- [What is an "Upcoming" Test?](../articles/what-is-an-upcoming-test.md): new or changed tests carry a rollout date; no history, SLA or auditor visibility until it passes.

### Evidence Collection › Tests › Resolving Tests in Vanta (19)

- [Application Changes Reviewed Test (GitHub)](../articles/application-changes-reviewed-test-github.md): branch protection settings, and finding the checked branch from the test's exported data.
- [CIS Benchmark Tests for Kubernetes](../articles/cis-benchmark-tests-for-kubernetes.md): the EKS CIS benchmark tests Vanta automates.
- [Error: "The Azure credentials are invalid. Check the correct values are being used"](../articles/error-the-azure-credentials-are-invalid-check-the-correct-values-are-being-used.md): an invalid Azure client secret causes 401s; how to fix it.
- [Remediating Cloud Tests with Terraform](../articles/remediating-cloud-tests-with-terraform.md): Remediate → How to remediate panel → Terraform (Beta, AI-generated) or General; regenerate.
- [Resolve AWS Config is enabled correctly in all regions. (Internal)](../articles/resolve-aws-config-is-enabled-correctly-in-all-regions-internal.md): enabling AWS Config in every in-scope region (14 screenshots of AWS).
- [Resolve 'Azure integration has active Activity Log Alerts' test](../articles/resolve-azure-integration-has-active-activity-log-alerts-test.md): creating an activity log alert rule in Azure Monitor.
- [Resolve 'Azure integration has active Log Alerts' test](../articles/resolve-azure-integration-has-active-log-alerts-test.md): creating a log alert on an Azure resource.
- [Resolve 'Company has a version control system'](../articles/resolve-company-has-a-version-control-system.md): passes when any connected repository was updated in the last 30 days.
- [Resolve 'Inventory items have active owners' Test](../articles/resolve-inventory-items-have-active-owners-test.md): failing resources link to their inventory item; filter by No owner or Former employee.
- [Resolve 'Inventory list tracks resources that contain user data' test](../articles/resolve-inventory-list-tracks-resources-that-contain-user-data-test.md): mark at least one inventory resource as containing user data (PII).
- [Resolve 'Load balancer used (Azure)' test](../articles/resolve-load-balancer-used-azure-test.md): needs at least one active Azure load balancer.
- [Resolve 'Logs retained for 365 days (GCP)' test](../articles/resolve-logs-retained-for-365-days-gcp-test.md): bucket retention, with the bucket in scope on the integrations page.
- [Resolve 'MFA on Google Workspace' Test](../articles/resolve-mfa-on-google-workspace-test.md): enforcing 2-step verification in the Google admin console.
- [Resolve 'MFA on Office 365' test](../articles/resolve-mfa-on-office-365-test.md): Vanta reads `isMfaRegistered` from Microsoft Graph; service accounts with logins can still fail.
- [Resolve 'Security impact considered in merge requests (AzureDevops)' test](../articles/resolve-security-impact-considered-in-merge-requests-azuredevops-test.md): a default PR template that asks for security impact.
- [Resolve 'Storage Accounts health monitored (Azure)' test](../articles/resolve-storage-accounts-health-monitored-azure-test.md): health alerts on Azure storage accounts.
- [Resolve 'Subscription Activity Logs are being archived to a storage account (Azure)' test](../articles/resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test.md): a diagnostic setting to an in-scope storage account.
- [Resolve 'Vendors list maintained' test](../articles/resolve-vendors-list-maintained-test.md): adding non-integrated vendors on the Vendors page.
- [Sunsetting Server Vulnerability Scanning](../articles/sunsetting-server-vulnerability-scanning.md): the 2022 retirement of the Server Agent in favor of scanner integrations.

### Evidence Collection › Documents (10)

- [Adding Custom Evidence](../articles/adding-custom-evidence.md): Add document → Create document → Add document to control modal → Upload or Add Link with an effective date.
- [Assignment and Ownership for Tests, Policies, and Documents](../articles/assignment-and-ownership-for-tests-policies-and-documents.md): assigning owners in the Owner column, owner alerts, and up to ten test subscribers.
- [Automated Ticket Creation for Documents](../articles/automated-ticket-creation-for-documents.md): one global "Task creation at renewal" workflow opens a Jira issue when a document turns Due soon or Needs remediation.
- [Collecting Screenshot Evidence with the Vanta Agent](../articles/collecting-screenshot-evidence-with-the-vanta-agent.md): "Collect a screenshot" sends the agent through a live, read-only browser; you approve the captures before upload.
- [Document Renewal Settings](../articles/document-renewal-settings.md): Recurrence, a custom renewal date, reminder days; Due soon/Expiring soon and Overdue/Expired.
- [Managing Documents](../articles/managing-documents.md): the document status table across pages, bulk import template, document page, draft → Mark as complete, history, sensitive files, approval workflow.
- [Marking Custom Documents as Sensitive](../articles/marking-custom-documents-as-sensitive.md): "This is a sensitive document" limits a custom document to owners, Admins and auditors.
- [Preferred Documents](../articles/preferred-documents.md): an auditor's scoped-down document list, with OK counts per category.
- [System Description Generator](../articles/system-description-generator.md): a SOC 2 system description template, prefilled from Vanta, that generates a DOCX draft.
- [Uploading Document Evidence from a Task Tracker](../articles/uploading-document-evidence-from-a-task-tracker.md): attachments on a linked Jira/Linear/ClickUp/Asana task sync into the document's Recommended files.

### Policies (12)

- [Add a Company Logo to your Policies: Policy Editor](../articles/add-a-company-logo-to-your-policies-policy-editor.md): policy editor ⋯ › Add company logo, on drafts only.
- [Adding Custom Notes to Policies](../articles/adding-custom-notes-to-policies.md): a note field on the policy for internal context.
- [Bulk Update Policies](../articles/bulk-update-policies.md): a 2-step search-and-replace across policy-editor policies, optionally drafts only.
- [Commenting in the Policy Editor](../articles/commenting-in-the-policy-editor.md): highlight text → comment thread with replies, edit and delete; never printed in the approved PDF.
- [Creating Policies with Policy Builder](../articles/creating-policies-with-policy-builder.md): section-by-section questions with a live preview, framework editing guidance, then Review & finalize.
- [Creating, Uploading, and Renewing a Policy](../articles/creating-uploading-and-renewing-a-policy.md): Start from template, upload or sync a file, Submit for approval, Create new version, Renew, Delete and restore.
- [Importing Custom Policies](../articles/importing-custom-policies.md): import by agent or 30 files at once with AI extraction; two auto-created tests per policy (approved, accepted).
- [Policies in Multiple Languages](../articles/policies-in-multiple-languages.md): language drafts under one version (7 languages), and the employee's Preferred language at acceptance.
- [Policy Writing Resources](../articles/policy-writing-resources.md): a workshop, Vanta Academy training and other policy-writing resources.
- [Renewing Policies](../articles/renewing-policies.md): renewal cadence, Update policy and renew vs Renew without updates, and the reacceptance question.
- [V2 Policy Migration](../articles/v2-policy-migration.md): the pre-2021 migration packet (approved PDFs, acceptances, approvals, v1→v2 mapping, v2 templates).
- [Vanta Agent: Policy Search & AI Insights](../articles/vanta-agent-policy-search-ai-insights.md): ask questions of your policies with cited sources, and three AI Insights actions.

## 2. Product surfaces

### 2.1 Framework record, newer layout (SOC 2, CIS)

Layout:
- Breadcrumb Frameworks; title (SOC 2); at the end "⋯" and the primary "+ Add control".
- Fact line under the title: an "In audit" chip, then "Control Set: Security" with a pencil.
- Line tabs: Overview, Controls, Tests, Updates 4, Scope.
- Controls tab, above the table: a "Segment:" select ("SOC 2 for TigerLabs") where business units exist; Search…, Control status, Owner; "✎ Edit system description" at the end (SOC 2 built by Vanta only).
- Left rail "REQUIREMENT CATEGORIES" with a collapse button: CC 1.0 Control Environment … CC 9.0 Risk Mitigation, A 1, C 1, PI 1, P 4.0, P 6.0.
- "Controls" card: "85%", "Of controls have passing evidence ⓘ"; a bar from "93 controls" to "109 total"; mini cards "Automated tests 44/64, 69%" and "Documents 7/32, 22%".
- Requirement card: "CC 1.1 COSO Principle 1: Integrity and ethical values →" with "Add control".
- Card table columns: CONTROL (name over its text), EVIDENCE READINESS (ring, 0/2), OWNER (Unassigned), CONTROL SET (chips Security, or IG1 IG2 IG3), and an unlink icon at the row end.
- Older SOC 2 layout: buttons "System description", "More ⌄", "+ Create new control"; an "Audit timeline" card with "Observation completed", "🎉 Congratulations!" and "View audits".
- That screenshot's left nav carries "Roadmap 29%" under Home, and "Issues Preview" under Compliance.
- CIS variant: a "Control set: IG1 ⌄" button beside the title; Compl(etion) 16%, 9 controls of 56 total; Test 65/112 58%; Document 3/41 7%.
- Frameworks page banner: "ISO 27001:2022 is now available", with Learn more and Migrate now (primary) and a close ✕; the header there has only "View audits".

Flow edges:
- → Frameworks › framework row → this page.
- → Control Set pencil or "Control set" button → a list of sets → "Change this framework's control set?" (2.2).
- → Edit system description → the system description document (2.24).
- → requirement title arrow → the requirement (inferred).
- → More → Change control set, the exports (2.31).
- → Frameworks banner → Migrate now → confirm modal → 27001:2022.
- → View New Version (Framework Version Manager) → side-by-side compare → guided upgrade → conflict resolution (text only).

Images: `../../images/ux/frameworks/system-description-generator--01.png`, `../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--04.png`, `../../images/ux/frameworks/framework-control-sets-cis-center-of-internet-security--03.png`, `../../images/ux/frameworks/migrate-from-iso-27001-2013-to-iso-27001-2022--02.png`.

### 2.2 Change control set, snooze, version upgrade (modals)

Layout:
- "Change this framework's control set?": "The total number of controls in your security program will adjust based on your selection."
- Its grey box has three rows: Framework | CIS Critical Security Controls v8.1; Change from | IG1, 56 controls; Change to | IG2, 130 controls.
- SOC 2's version: Change from Security, 80 controls; Change to Security, Availability, Confidentiality, 87 controls.
- Under the box: "Important: Changes to a framework control set are not allowed during an active audit."; Cancel and "Change control set" (primary).
- The FedRAMP r5 version shows the current baseline, the new one and a comparison of the controls added and removed (text only); Admins only; a change does not deactivate or add controls by itself.
- "Snooze standard": three paragraphs (what hides; "We strongly recommend…" not snoozing near an audit; data keeps collecting); a bold billing note.
- Then "The standard will become active on:" with "Pre-selected future date ⌄ OR Custom date"; Cancel and Save (disabled until a date).
- Framework Version Manager carries Owners, Notes, Comments, Control history, Custom fields, Custom mappings and Risk scenario mappings.
- Its conflicts: owners or fields of a many-to-one merge, and custom controls on deprecated sections (remap or discard). The old version stays until it is deprecated.

Flow edges:
- → Frameworks row ⋯ → Snooze… → Snooze standard → Save → the framework's items are hidden until the date.
- → control set chip → choose a set → modal → Change control set → the counts change; refused during an active audit.

Images: `../../images/ux/frameworks/framework-control-sets-cis-center-of-internet-security--03.png`, `../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--04.png`, `../../images/ux/frameworks/temporarily-snooze-a-framework--02.png`.

### 2.3 Custom framework creation

Layout:
- Manual path: Frameworks → Create framework → framework details (Framework Name, Description, Short Name, Parent Section Label, Child Section Label).
- Then Create sections → upload a spreadsheet (template in the modal) → review flagged rows → Import.
- Section columns: Section ID, Section Name, Section Description, Section Type (P/C), Parent Section ID, Control IDs (comma-separated).
- The two levels default to "Requirement Category" and "Requirement" and can be renamed, so a framework can say "Family" and "Control" (inferred use).
- Agent path: the Vanta Agent chat takes up to 30 files (50 MB), proposes details and sections in a table, and is corrected in chat before it saves.
- A control file that names a framework not enabled can create it as a custom framework.

Flow edges:
- → Frameworks → Create framework → details → Create sections → upload → Import → the framework, with sections mapped to existing Control IDs.
- → Vanta Agent "Help me import my compliance program" → controls, frameworks and policies in one chat.

Images: none (text only).

### 2.4 Controls register additions and the New control modal

Layout (builds on `../../pages/controls-page.md`):
- Tabs Common controls | Controls; joined scope selects "All business units ⌄ | All frameworks ⌄".
- Assignment card: 6% Assigned donut; "Updated 2m ago" with refresh; "10502 total"; Automated tests 150/302, 50%; Documents 883/3868, 23%.
- Toolbar: "⋯", "Add control ⌄" (primary), column settings.
- Rows from a Japanese standard (1-1-1-1 with bulleted text; Frameworks chip Japan-SCS; Business unit TigerLabs).
- Rows from NIST: "AC-1 Policy and Procedures", whose cut text keeps the placeholder "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]…".
- "New control" modal fields:
  - Description, with an example placeholder and a 0/5000 counter.
  - Framework code (Optional), placeholder "ISO 27001:2013 · C.4.1".
  - "✧ Generate details" (AI fills Domain, ID, name and implementation from the description).
  - Domain (Select); Control ID ("C-1"); Control name ⓘ (Optional).
  - Implementation details (Optional), a rich-text box (B, I, lists).
  - Effective date ⓘ (defaults to today: Oct 15, 2026).
  - Cancel; "Add control" (disabled until valid).
- Add control menu: Add custom control; Via import › Use template (Create new controls / Update existing controls) or Use Vanta Agent.
- The import maps columns, flags rows, and offers "Clear existing values for empty fields".
- More › Delete all custom controls → choose an effective date → Delete (cannot be undone).

Flow edges:
- → Add control → New control → Add control → the row → assign Owner in the column → open the panel to map.
- → Add control → Via import → template → map columns → fix flagged rows → import.
- → Vanta Agent → upload control files → review table → "replace Vanta default controls?" per framework → suggested test, document and policy mappings → keep or remove.

Images: `../../images/ux/controls/importing-custom-controls--01.png`.

### 2.5 Control side panel (detail beyond the earlier note)

Layout:
- Top: "⋯" and Close; the title "Data retention procedures established"; its text.
- Facts: ID AST-2 ⓘ, Source Vanta, Domain Asset Management, Owner (avatar, Admin Admin), Note ("Add a note…", edited in place with a pen, saved with Enter or ✓).
- Tabs: Mapped elements | History.
- Tests card: heading with a "0 / 1 OK" pill, then "+" and a pencil; each row a link ("Company has an approved Data Management Policy"), the owner's avatar and a status ring.
- Documents card: the same shape ("0 / 1 OK", "Toasty Test Recurrence Doc").
- Mapped frameworks, with Add (primary-outline); Risk scenarios; Linked issues (issues mapped from the issue side).
- Implementation details: a rich-text field on every control; not shareable with auditors yet.
- Agent drafting returns an "Approval required" card: "Review updates to 7 controls:", then each control ID (1-1-1-2) with "Implementation details" and the draft; Approve (primary), Reject.
- The agent works in batches of up to 20; under the chat box: "Vanta AI can make mistakes. Please verify responses."
- Its sources, in order of weight: mapped tests and documents, evidence evaluation findings, then approved policies and the system description.
- Custom agent template "Draft Control Implementation Details" (Manual / Schedule / Event Trigger) → a CSV per run → "update the first 10 controls in the CSV" → Approval required.

Flow edges:
- → control row → panel → "+" on Tests → search, or "Suggest by Vanta AI" toggle → Add.
- → panel → Documents "+" → search, or New document.
- → panel → Mapped frameworks Add → "Map control to framework requirements" (earlier note).
- → panel ⋯ → Deactivate (restorable) or Delete (custom only, permanent).
- → Vanta Agent "Add implementation details to controls I own" → Approval required → Approve → a summary whose control IDs open the controls.

Images: `../../images/ux/controls/custom-notes-for-controls--01.png`, `../../images/ux/ai/control-implementation-details--01.png`.

### 2.6 Common controls (Vanta Control Framework)

Layout:
- Controls › Common controls tab, with the subtitle "Manage your compliance with the Vanta Control Framework (VCF)."; "⋯" and "+ Add custom common control" (primary).
- Left tree, the NIST CSF functions, not editable: All; Govern (Governance, Risk Management, Audit and Assurance, Privacy and Data Protection); Identify; Protect; Detect; Respond; Recover.
- Card 1: "0%", "Of common controls are passing ⓘ", with rows Automated tests 0/7 and Documents 0/27.
- Card 2: "49%", "controls consolidated from 55 to 28", and "MAPPED FRAMEWORKS" chips (HIPAA).
- Toolbar: Search common controls; Owner, Status, Subdomain, Frameworks, Source; Reset; column settings.
- Table: ID ⓘ (gv-pd-cm-2), Name over its text, Owner (Unassigned), Status (Needs evide…), Evidence (ring 0/3), Frameworks (HIPAA, or "—"), row ⋯; "1 to 5 of 28 results".
- Common control page: "← Back to Common controls"; title; one-line text.
- Its facts: Status (Needs evidence), Subdomain (Consent Management), ID, Owner; "Manage access" and "⋯" at the end.
- Its cards: "0% Of mapped evidence is passing" (Automated tests 0/0, Documents 0/3); "75% controls consolidated from 4 to 1" and HIPAA.
- Its tabs: Controls, Evidence, Policies, Risks, Comments, and Issues where enabled.
- Its Controls tab: Search, Frameworks, Status, Owner, "Add control" (primary); checkbox, ID (PRI-333), Name, Owner, Status, Evidence 0/1, Frameworks, unlink.
- ⋯ menus: Edit (Title, Description), Edit VCF settings, View inactive controls, Export all (CSV), Deactivate, Delete (custom only).
- An auto-mapped common control becomes "protected" once edited: disabling a framework no longer removes its mappings.

Flow edges:
- → Common controls → Get started → Vanta Agent setup → choose frameworks → scan → confirm or skip suggestions.
- → a common control → Add control → ⊕/⊗ per control → refresh.
- → a control row → the control's panel.
- → ⋯ → Edit VCF settings → enable or disable frameworks; auto-maps are added or removed.

Images: `../../images/ux/controls/managing-common-controls--01.png`, `../../images/ux/controls/managing-common-controls--02.png`.

### 2.7 Issues (findings and remediation)

Layout:
- Compliance › Issues (Preview); title "Issues", subtitle "Track and fix compliance gaps in one place."; "Create issue ⌄" (primary), "Submit feedback".
- A banner: "Preview release: AI bulk import for issues … Go to Create issue → Import issues"; close ✕.
- Line tabs: Issues | Tasks (New).
- Count chips: All 15, Open 13, Closed 2, Owned by me 0; another account: All 248, Open 217, Closed 31.
- Filters: Search, Status, Severity (2, active), Source, Owner, Template, Due date, "+ Add filter", "Reset view"; download and column-settings icons.
- Table: Issue, Status ↓, Severity, Due date, Controls, Owner (avatar), row ⋯; "1 to 10 of 12 results".
  - Status chips: ✓ Closed (green), In progress (blue), Not started (dashed).
  - Severity: High (red ring), Critical (red square).
  - Controls chips: GOV-89, CC-OPS-4, IAC-579, MAT 1.3 + CRY-2, 01.00aPCIOrganizational.1, or "—".
- Second layout: Issue (title over description), Owner, Due date ↓, Tasks (a bar, "75%" and "3/4 closed").
- Create Issue is a full page: breadcrumb Issues.
  - Fields: Title, Description; Priority, Due date ("Select due date"), Issue owner (Unassigned), Source and Type ⓘ, each Optional.
  - "Create another issue" checkbox; Create Issue (primary), Cancel.
- The article's vocabulary for Create Issue: Priority Critical/High/Medium/Low; Source = which framework; Type = Exception, Major nonconformity, Minor nonconformity, Opportunity for improvement, Process for improvement.
- Issue record tabs: Overview | Mapped elements.
  - Card "Details — Description and root cause": Description, Root cause ("—").
  - Card "Log evidence — Add remediation or corrective action evidence to document that the issue has been resolved.": "Type your own", "Tip: you can add multiple responses".
  - Card "Close the issue — When an issue is closed, it can no longer be modified or reopened", with "Close issue" (primary).
- Closing asks for a reason and comments; issue subtasks also appear in My work.

Flow edges:
- → Create issue → page → Create Issue → the issue record.
- → Mapped elements "+" → search controls → the control's panel lists the issue under Linked issues.
- → Log evidence → Close issue → reason → Close → read-only.
- → a common control's Issues tab; the audit's Data & populations "Issues — Snapshots of tracked issues".

Images: `../../images/ux/issues/issue-management-in-vanta--01.png`, `../../images/ux/issues/issue-management-in-vanta--02.png`, `../../images/ux/issues/issue-management-in-vanta--03.png`, `../../images/ux/issues/issue-management-in-vanta--04.png`.

### 2.8 Tests register (newer) and the SLA states

Layout (builds on `../../pages/the-tests-page.md`):
- Newer header: "Tests" with a single "⋯".
- Card "Tests passing ⓘ" with a count chip (54): "100%", "54 of 54 passing", a bar; mini rows "Automated tests 26 / 26 passing 100%", "Documents 28 / 28".
- Card "Tests that need attention 54", with three counted lines; the last is "(no SLA assigned) 0".
- Filters: Search, Category, Framework, …, Status (1), Rollout, Clear.
- Rows: the name over chips (Engineering, Automated); Frameworks chips ("CJIS Security…", "ISO 27…", "+2"); Type "Automated test"; row ⋯.
- Older "Tests: All": CATEGORY rail All 340, HR 34, IT 69, Policy 149, Engineering 75, Risks 4, Custom 9; DEACTIVATED: All deactivated.
- Older cards: OK 184 (35%, 184 OK of 524 total); Needs attention 340 (Overdue 168, Due soon 32, Needs remediation (no SLA assigned) 140).
- Older table: Name, Category, Owner, Type, Status ↑, Due date (red "Dec 5, 2022"), Frameworks; status chip "Overdue".
- Icon colour: orange = needs attention, not overdue; red = overdue. Only red reaches reports and the auditor.
- Upcoming tests carry a rollout date: no history, no SLA clock and no auditor visibility until then.
- "Pass by default" tests pass when the setting is built into the service.

Flow edges:
- → a row → the test page (2.9).
- → row ⋯ → Deactivate → Deactivate monitoring modal (2.10).
- → ⋯ → View deactivated tests.
- → + Create custom test → the builder (2.11).
- → Edit SLAs → SLA settings (earlier note).

Images: `../../images/ux/tests/deactivated-tests--04.png`, `../../images/ux/tests/test-priorities-and-slas--01.png`.

### 2.9 Test page: Results and How to remediate

Layout:
- Breadcrumb Tests; title "SQL database I/O monitored (Azure)"; one-line description.
- Meta line: owner (DB David Bosson) · integration (Azure) · "Last refreshed 6 hours ago" with refresh. Other tests add "SLA: 14 days" and a category.
- "⋯" at the end; a deactivated test shows "Activate" (primary) and a people icon instead.
- Tabs: Results, Source data (now Evidence), History, Tasks (0), Controls (4), Audits, Notes (or Comments 0).
- Results: a "Frameworks ⌄" filter.
- Then a header bar: red diamond "3 items need attention", "Create task ⌄", "How to remediate →" (primary).
- "Select all"; each failing item a checkbox row: name • resource id: group, a chip "All frameworks", row ⋯.
- "How to remediate" opens a side panel on the right ("How to remediate", ✕), with two cards and a footer line.
  - Card: sparkle "Terraform (Beta) — Utilizes AI to generate Terraform instructions ›".
  - Card: toolbox "General — Vanta written instructions for general remediation ›".
  - Footer: "Looking for something else?".
- The Terraform card exists only for cloud tests (AWS, Azure, DigitalOcean, GCP, Heroku, Netlify, Supabase, Vercel) and has Regenerate.
- Test ⋯: Manage subscribers (up to ten emails, batched every four hours); customizable tests' parameters; Copy test.

Flow edges:
- → How to remediate → Terraform → code → regenerate.
- → Create task ⌄ → a task in Jira and others; test-level automation opens an issue when the test fails, without duplicates (from the documents article).
- → Controls (4) → the mapped controls.
- → History → Remediation history (earlier note).

Images: `../../images/ux/tests/remediating-cloud-tests-with-terraform--01.png`, `../../images/ux/tests/remediating-cloud-tests-with-terraform--02.png`.

### 2.10 Deactivating and reactivating a test

Layout:
- Modal "Deactivate monitoring for 1 test": "Monitoring this test will be paused. You can reactivate it at any time."
- Radios: Indefinitely / Until specified date.
- "Reason for deactivation", with the hint "Help your teammates and auditors understand why this test is deactivated", and a text area.
- "Evidence" (Optional): a drop zone with Upload.
- Cancel; Deactivate (disabled until a reason is given).
- The deactivated test page: meta chip "Deactivated indefinitely"; clicking it opens a "Reason for deactivation" popover (the reason, author MM Mira Munro, Jan 23, 2026).
- Header primary: Activate. Reactivating drops the old reason.
- The article says the reason is not shown to the auditor; share it as an audit-portal comment.

Flow edges:
- → Tests row ⋯ → Deactivate → modal → Deactivate → the test leaves the failing list.
- → ⋯ → View deactivated tests → test → Activate.

Images: `../../images/ux/tests/deactivated-tests--04.png`, `../../images/ux/tests/deactivated-tests--02.png`.

### 2.11 Custom test builder

Layout:
- Page "Create Test", "Create a new test to map to your compliance program.": four stacked step cards, each with a check when done.
- 1. Test data, "Select an integration and resource type. Add conditions to define which resources are in scope for the test."
  - Per data source: logo, integration select (Asana), resource type select (Asana Account), the label "Primary", ⋯ and collapse.
  - Inside: "All resources are in scope", "+ Add condition", "Show available fields ⌄".
  - Under the sources: "+ Add data source" (disabled at two), Continue.
- 2. Match data sources: an equality join between one field of each source (type-strict; nulls never match).
- 3. Evaluation logic, "Define the criteria to determine whether the test passes.":
  - ① Test outcome: "This test passes if [All ⌄] [Asana Account] pass".
  - ② Resource outcome: "A [Asana Account] passes if [All ⌄] of the following are true." with nested "There is at least one matching [AWS VPC]" and "+ Add condition".
  - ③ Evaluation preview: "◆ This test will fail" with counts total 1, pass 0, fail 1, N/A 0; table Name, Type, Status (Fail chip), Related resources; Continue.
- 4. Test details, "Describe what this test evaluates and why it matters.": Test name; Description with "✦ Generate with AI" and 0/5000; Remediation instructions (Optional); Save test.
- Then, by hand: Tests › Custom tab → the test → Controls tab → Add control → choose → Add; assign an SLA category and an owner; deactivate the test it replaces.
- Custom tests cannot be edited after creation; a change means a new copy.

Flow edges:
- → Tests → + Create custom test → steps 1–4 → Save test → the Custom tab → Controls → Add control.
- → a test → Evidence tab → Copy test → edit the copy (no control mappings carried).

Images: `../../images/ux/tests/creating-custom-tests--04.png`, `../../images/ux/tests/creating-custom-tests--06.png`, `../../images/ux/tests/creating-custom-tests--07.png`.

### 2.12 Document record: drafts, approval, renewal

Layout (the register is in `../../pages/documents-page.md`):
- Breadcrumb Documents (or "← Back to Documents"); title "Clear Desk Policy" with a "🔧 Custom" chip; a one-line description.
- Meta: "Unassigned" (person picker) · "⇄ Renew annually" (opens renewal settings); "✎ Edit" and "⋯" at the end.
- Tabs: Evidence, Tasks (0), Controls (0), Audits, Notes (or Comments 0).
- The Evidence card's header changes with state:
  - "Get started — Add files to start a draft", with ⋯ and Submit (disabled).
  - "Draft — 1 file", with "Submit for approval" (primary), or "Mark as complete", or "Ready for audit" for an IRL request.
  - "Start renewal" / Renew when due.
- Card toolbar: Upload, Add URL, Import; a drop zone: "Add documents, screenshots, and links as supporting evidence. Tip: You can drag files here to upload. Upload files up to 50 MB of selected file types ⓘ".
- File row: thumbnail; name; "Expires on Mar 7, 2026 • PDF • Added by Shannon D."; replace, edit and delete icons.
- "Show approval" link under the files.
- "Recommended files (2)" (collapsible): each a checked row "Evidence 1.png • January 6, 2026 • Jira TEST-78"; footer "2 selected", "Unselect all", Add.
- History card: "No prior versions — Previously completed versions will show up here"; expired files move here, grouped by upload date.
- "Collect a screenshot" sits in the Get started, Start renewal or Draft card and opens the Vanta Agent with a live browser view.
- "Edit document renewal settings" modal:
  - Recurrence: Annually, Bi-annually, Quarterly, Monthly, Weekly, Never.
  - Custom renewal date (only after evidence was submitted once).
  - "Remind me this number of days before".
  - Save changes. Bulk "Edit renewal dates" applies to selected rows on the register.
- Add document modal: name, description, "This is a sensitive document"; Create document.
- Then "Add document to control": Search controls, Framework ⌄; a CONTROLS list on the left and an empty detail pane on the right; Add.
- Documents › Add document › Import documents: Excel template with Name, Description, Restricted, Cadence, Time Sensitivity (Anytime / During audit window), Control IDs; Import; validated row by row.

Flow edges:
- → register row → document → Upload → Draft → Mark as complete (or Submit for approval → approvers → approved) → the current version → the linked test turns OK → auditors see it.
- → Tasks tab → Create task → link a Jira/Linear/ClickUp/Asana task → attachments sync every 30 minutes → Recommended files → Add → submit.
- → "⇄ Renew annually" → renewal settings → Save changes.
- → ⋯ → Add control → Add document to control → Add.
- → ⋯ → Delete; the test fails until a new version is uploaded.

Images: `../../images/ux/documents/managing-documents--04.png`, `../../images/ux/documents/managing-documents--15.png`, `../../images/ux/documents/uploading-document-evidence-from-a-task-tracker--02.png`, `../../images/ux/documents/adding-custom-evidence--03.png`.

### 2.13 Compliance settings: approval workflow, custom fields, auditor actions, ticketing

Layout:
- "Compliance settings — Customize settings for your data and processes in Vanta related to compliance."
- Card "Document approval" with an "✓ Enabled" chip and Disable at the end.
  - "How it works": approvers review evidence before auditors see it; the workflow applies to all documents.
  - "Approvers": a row with a pencil.
  - Up to 3 approvers per step and up to 5 steps; everyone in a step approves before the next.
- Card "Custom fields for controls" with Add (primary): Field name, Data type, Auditor visibility ("Shared with auditor" / "Private to your team").
- Card "Auditor actions", three toggles, each with a one-line description:
  - "Auditors can modify control mappings" (from the evidence drawer).
  - "Auditors can add new audits".
  - "Auditors can add others to existing engagements".
- "Audit visibility": Default audit view (Full / Controlled), saved on change.
- Workflows › "Task creation at renewal" (toggle): "Automatically create Jira tasks when documents become due soon."
  - Connection (the Jira site); Space; Work type (Task).
  - Summary, fixed: "[Vanta] Document renewal — {Document Name}".
  - Assignee (Document owner, with the hint "For team owners, we will assign the Team Admin") and Fallback assignee.
  - Due date (Optional): On document renewal date / N days before / Do not set due date. Saved as you type.

Flow edges:
- → Settings gear → Features › Compliance → these cards.
- → a document → Evidence → Submit for approval → approvers' email → approved → the related test turns OK.

Images: `../../images/ux/settings/managing-documents--14.png`, `../../images/ux/settings/adding-and-managing-auditors--08.png`, `../../images/ux/documents/automated-ticket-creation-for-documents--01.png`.

### 2.14 Preferred documents and the SoA

Layout:
- Documents filtered by framework show category cards. Each heading carries a ring chip: "Human Resources — 2 / 8 OK"; "Information Technology — 0 / 1 OK"; "Policy — 0 / 7 OK".
- Under each, collapsible subcategory rows with status chips: "Employees — 4 Need documents · 1 Not relevant · 1 OK"; "Account Setup — 1 Needs document · 1 OK"; "Computers — 1 Needs document"; "Policies — 7 Need documents".
- The Statement of Applicability is a spreadsheet template, not a screen.
  - Legend for Control Inclusion: REG (regulatory or certification), CON (contractual), BP (best practice), RA (risk assessment).
  - Columns: Clause, Sec, Control Objective/Control, Justification for exclusion, Justification for control inclusion (REG, CON, BP, RA as Yes cells), Status (Implemented, In Process).
- The ISO checklist says the SoA is generated "from the Standards page" (inferred to be a framework action).

Flow edges:
- → Documents → Framework filter → a category → a document → upload.

Images: `../../images/ux/documents/preferred-documents--03.png`, `../../images/documentation/getting-started-with-isms-11-statement-of-applicability--01.png`.

### 2.15 Policy record: versions, approval, renewal, languages

Layout (the register is in `../../pages/the-policies-page.md`):
- Breadcrumb Policies; the title with a status chip ("✓ OK", or "◆ Needs remediation"); a description.
- Meta: "DORA +11 more" (frameworks) · "⇄ Renew annually"; "✎ Edit details" and "⋯".
- Tabs: Policy versions, Controls (88), Audits, Notes; the older layout has Mapped elements.
- Renewal card: "Renew before Sep 3 2025", "Update your policy to reflect changes in your security program or renew it with no changes", with "Update policy and renew" and "Renew without updates".
- Draft card: "Draft version — Created in Vanta", with "Assign approver and submit" (disabled until ready) and ⋯.
- One row per language: "English — Last edited by Hannah …" [Edit][🗑]; "Español (Spanish) — Not started" [Edit][🗑]; footer "Approval not started".
- An empty state shows a lone "Create new version" button over a timeline line.
- "Assign an approver" (Step 2 of 2): guidance ("often the person responsible for this policy's enforcement…"); an Approver select; a note that they get an email and must cancel the request to change it; Back, "Assign approver".
- Renew, step 2 of 2: "Do you want employees to reaccept Risk Management Policy after it is renewed?"
  - Two radio cards: "Yes, ask employees to reaccept this policy" / "No, don't ask employees to reaccept this policy", each with a one-line consequence.
  - "Groups subject to acceptance of this policy:" with the list of groups; Back, Renew (primary).
- Mapped elements › Map control: an AI-suggested tab (accept or reject each) and an All tab.
- Each custom policy gets two tests, "Company has an approved [policy]" and the employee acceptance test.
- Add policy menu: Add from policy library / Create new policy / Import policies (30 PDF/DOCX files, AI extraction, duplicate-title choices).
- Create new policy → title and description → "Draft it in Vanta" / "Upload a file" / "Sync a file" (Confluence, Google Drive, SharePoint).

Flow edges:
- → Policies → row → policy → Update policy and renew → the editor or builder → Submit → Assign an approver → email → Approved → the policy test OK.
- → Renew without updates → approver → reaccept? → Renew.
- → ⋯ → Add new language (before approval), or Renew → choose languages → Get started (after approval).
- → ⋯ → Download Template → choose a language.

Images: `../../images/ux/policies/language-support-across-vanta--04.png`, `../../images/ux/policies/renewing-policies--04.png`, `../../images/ux/policies/renewing-policies--06.png`, `../../images/ux/policies/creating-uploading-and-renewing-a-policy--04.png`, `../../images/ux/policies/creating-uploading-and-renewing-a-policy--06.png`.

### 2.16 Policy Builder and policy editor

Layout:
- Builder: breadcrumb "Policies / Data Management Policy / Policy Builder", ⋯ at the end; two panes.
- Left pane:
  - The section title (Data classification) and its purpose line.
  - A collapsible "Need to make edits? View guidance for this section" → per framework, "SOC 2 editing guidance": "WHAT'S REQUIRED?" text and "RELATED CONTROLS" links (Data classification policy established ↗). "ISO 27001:2022 editing guidance" is collapsed below.
  - A "Section customized — To reset this section to the original template, discard your custom edits" card with "Discard edits".
  - A "Review and edit section" empty prompt with Edit; question fields elsewhere.
- Left footer: "✓ All changes saved", "Section 5 of 17", a "Skip no input needed" checkbox, Back, Next (primary).
- Right pane: a live preview of the whole policy.
  - Header: the policy title with a "✓ 2/2 completed" chip; Policy Owner, Effective Date "[Approval date]".
  - Each section a heading with a state chip: "✓ No input needed", "⚙ Edited", "Review needed", and an "✎ Edit" link.
- Last step: Review & finalize → confirm the approver → submit; other language drafts open in the editor.
- "Convert to policy editor" in ⋯ is one-way.
- Policy editor: highlight text → comment icon → yellow highlight → a thread popover (avatar, name, time, ✎ and 🗑 per comment, a "Reply…" box).
  - Deleting the top comment deletes the thread. Comments never print in the approved PDF.
- Editor ⋯: Add company logo, Delete and Reset.
- Bulk update policies (Step 1 of 2): Text to replace; "Use company name", "Case insensitive" and "Match whole word" checkboxes; New text; "Only include draft policies" (otherwise creates drafts of approved policies); Next → count of replacements → Update.
- Policies page AI Insights strip (Preview): "Fix SLA inconsistencies", "Fix policy contradictions", "Remove offboarded employees from policies"; ✕.
- The Vanta Agent chat cites its sources (book icon).

Flow edges:
- → Policies → policy → Start → Policy Builder → Next × 17 → Review & finalize → approver → Submit for approval.
- → ⋯ → Convert to policy editor → full editor (no way back).
- → More → Bulk update policies → Next → Update.

Images: `../../images/ux/policies/creating-policies-with-policy-builder--01.png`, `../../images/ux/policies/creating-policies-with-policy-builder--02.png`, `../../images/ux/policies/commenting-in-the-policy-editor--03.png`, `../../images/ux/policies/bulk-update-policies--02.png`, `../../images/ux/policies/vanta-agent-policy-search-ai-insights--05.png`.

### 2.17 System description generator (SSP-like authoring)

Layout:
- A full-screen editor: ✕ | "System description" | "Read instructions"; at the end "Saved now" and "Generate Draft" (primary).
- Warning card: "Review draft before sharing with your auditor — This draft system description will be generated from your inputs and selections…".
- Collapsible sections, each with a completion chip: Company Information "1 / 2 completed" (blue, partial); Service description, Service commitments, System components "3 / 3 completed" (green ✓).
- Field pattern: a label (Company name), a one-line instruction ("Enter your company's legal name."), the input.
- Some fields are prefilled from Vanta (system components, SLAs); autosaved; Generate Draft refuses while required fields are blank.
- The output is a DOCX; unsupported entries become `<table-input>` placeholders; the user uploads it back as evidence.

Flow edges:
- → SOC 2 framework → Controls → Edit system description → the system description document → Evidence → the generator → Generate Draft → DOCX → edit offline → Upload → Mark as complete.

Images: `../../images/ux/documents/system-description-generator--03.png`, `../../images/ux/frameworks/system-description-generator--01.png`.

### 2.18 Audits page and audit card (customer side)

Layout:
- Title "Audits"; "⋯" (Compliance settings, Upload audit report) and "Add audit ⌄" (primary; menu has Duplicate from prior audit).
- Line tabs: Active | Completed.
- Filters: Search, Audit firm, Framework, Status, Audit type, Assigned to me; Business units where configured.
- One card per audit:
  - The framework logo and the title ("Audit", "Audit: SOC 2 Type II", "Audit: ISO 27001:2022").
  - Chips: status (Upcoming / In audit / Awaiting report / ✓ Completed), "External" (eye icon), the framework or "2 TSCs", "Public preview audit ex…".
  - The firm's domain with a briefcase icon (deloitte.com, Moneky Audit co) and the auditor's avatar.
  - "Open audit", "⋯".
- Card "Timeline": eye "Auditor gets access May 31, 2026" → hourglass "Audit starts September 30, 2026" → check "Audit ends October 2, 2026" (dashed while ahead).
- Card "Request tracker" (IRL) or "Evidence tracker" (default list): one stacked bar.
  - Legend: Not ready 153, Internal review 1, Audit ready 0, Flagged 0, Accepted 0.
  - A completed ISO card: Not ready 3, Internal review 1, Audit ready 2, Flagged 1, Accepted 1.
- Footer row: "📄 No reports available yet", or the report.
- Card ⋯ menu:
  - "Audit settings": Edit auditors, Edit owner permissions, Duplicate audit.
  - "Audit documents": ⤓ Download report.
  - "Delete audit" (red).
  - Also "Upload report & complete" and "Assign to audit firm" (from the text).
- Upload report & complete: a PDF of 50 MB at most, plus a Completion date → Completed tab.
- Upload audit report (outside Vanta): "This audit is completed outside of Vanta", Standard, Audit firm, date, PDF/DOCX.
- An audit without a report stays Active as "Awaiting report" even after its window.

Flow edges:
- → Frameworks "View audits" / nav Audits → this page.
- → Add audit → Add a new audit (2.19).
- → Open audit → the audit (default list: the auditor-view workspace; IRL: 2.20).
- → ⋯ → Duplicate audit → name, firm, auditors, window, early access → Create audit → requests start Internal review (Vanta evidence found) or Not ready.
- → ⋯ → Upload report & complete → Completed.

Images: `../../images/ux/audits/creating-an-audit--03.png`, `../../images/ux/audits/creating-an-audit--05.png`, `../../images/ux/audits/duplicating-an-audit--01.png`, `../../images/ux/audits/managing-auditor-views--01.png`.

### 2.19 Add a new audit (3-step modal)

Layout:
- Title "Add a new audit", ✕.
- Step 1, "Define audit scope", warns: "Your audit's framework, visibility and auditor cannot be edited once the audit is created. Make sure to discuss with your auditor first."
- Step 1 fields:
  - Frameworks: "Select frameworks", or a segment.
  - Audit name: auto-filled, 255 characters.
  - Audit type ⓘ: External / Internal radios.
  - Audit firm ⓘ (Optional), with "Don't see your auditor? Invite them to Vanta".
  - Auditor ⓘ: disabled until a firm is chosen, or lists internal users for an internal audit without a firm.
- Collapsible "Advanced options" (only with IRL):
  - Request list ⓘ: "Use Vanta's default request list" / "Import your own request list — Controlled audit view only. Full audit view requires 'Vanta's default request list'."
  - Auditor view ⓘ with "Learn more": "Full — Auditors see expanded population data, enabling a more automated and efficient audit." / "Controlled — Auditors see restricted population data, resulting in a more manual audit process." Full is disabled under IRL.
  - Owner permissions ⓘ: a toggle "Evidence owners can perform audit actions".
- Footer: "Step 1 of 3", Back, Next (disabled until valid).
- Steps 2–3 (text only): Audit window (start and end) or "Audit as of date"; Early access to data (between today and the start); Test evidence on/off (default list only); then review and confirm.
- Editable after creation: name, auditor, owner permissions, dates, early access.
- Locked after creation: framework, type, request list, auditor view, test evidence, and the firm once set.

Flow edges:
- → Audits → Add audit → step 1 → Next → dates → Next → review → Add audit → a card on Active; emails to admins on both sides.

Images: `../../images/ux/audits/creating-an-audit--04.png`, `../../images/ux/audits/creating-an-audit--01.png`, `../../images/ux/audits/managing-auditor-views--01.png`.

### 2.20 IRL audit: Requests, Controls, Data & populations

Layout:
- Breadcrumb Audits; title "IRL Audit"; "⋯" at the end.
- Facts row, label over value: Focus (External, or Internal with an eye-off icon), Status (In audit / Awaiting report), Frameworks (SOC 2), Due date (Apr 29th, 2027), Audit Firm (Demo Auditor / Unassigned), Auditors (VA avatar).
- Line tabs: Requests, Controls, Data & populations.

Requests tab:
- "Request tracker": one stacked bar; Not ready 4 (grey), Internal review 2 (orange), Audit ready 2 (blue), Flagged 0 (red), Accepted 0 (green).
- Warning card: "⚠ 1 request is not mapped to any control — We recommend mapping each request to a control to enable evidence recommendations." with a toggle "Show unmapped requests".
- Toolbar: Search requests; Type, Status, Owner, Due date status; "⤓ Export"; column settings.
- A line under the toolbar: "Your auditor manages which requests are part of this audit."
- Table: checkbox, Unique ID ↑ (1464105), Request name, Type (Point in time / Sample / Population), Owner (team chip "En Engineering Infrastructure" or a person), Status chip, Due date (calendar icon, orange when near), Capture date ("-" or Oct 21 2026), row ⋯.
- Footer: "1 to 5 of 8 results", "Show per page 5".
- Empty until a list is uploaded: Download (Example IRL, Framework codes) → Upload IRL → drop file → header row → map columns → warnings → Import (2,000 rows at most); all start as Needs evidence.

Request record:
- "← Information request list"; title ("Periodic Backup Data Restorations"); the auditor's request text.
- Facts: Approval status (Audit ready), Unique ID (1464111), Owner (T Taylor), Due date ("Due Dec 24, 2026"), Capture date ("Set capture date"), Request type (Point in time), Cadence (Annually), Framework codes (A 1.3).
- At the end: "Share evidence ⌄" with Evidence not ready / Share with internal team / Share with auditor ✓; a people icon.
- Tabs: Evidence, Controls, Activity, Auditor comments, Internal comments.
- Evidence tab:
  - "+ Evidence ⌄": Vanta evidence (with a Related toggle), Upload document, Add URL, Observation notes. A sparkle button runs the AI evidence check.
  - Card "Shared with your auditor 1 — Last shared by Nitty Syed on Feb 23, 2026" (collapsible).
  - "0 of 1 Selected"; row: link thumbnail, "Link to data restoration evidence", "Link • Added by Nitty Syed on Feb 23, 2026", open ↗, remove ✕.
  - Upload controls stay hidden until the capture date.
  - Adding automated-test evidence to an Audit ready request sends it back to Internal review.
  - Accepted requests take no new evidence.

Controls tab:
- "Control tracker": Not assessed 29, Not in place 0, Partial 0, In place 0. On an internal SOC 2 audit: Not assessed 292, Not in place 1, Partial 1, In place 2.
- Toolbar: Search controls; Owner, Domain, Source, (Program mapping), Auditor assessment; "⟳ Sync controls" or "⤓ Export"; column settings.
- Table: ID (GOV-2), Control (name over its text), Owner, (Program mapping "SOC 2 · CC 1.1"), Domain chip, Requests accepted (ring 0/1, 0/3), Auditor assessment chip, Justification ("—"), row ⋯.
- The auditor's assessment chip is a dropdown: Not assessed ✓, Not in place (red diamond), Partial (amber triangle), In place (green check). Changing it asks for a Justification in a confirmation modal.
- ⋯ menu: "+ Add control" (choose controls and Linked requests), "⤓ Export control activity" (comments, status changes and justifications as CSV).
- Control owners come from the Controls page. Sync controls refreshes names and text, then a banner asks for a reload.

Data & populations tab:
- The line "You currently have the 'Controlled audit view' selected in your audit settings. You can preview and customize the sections that you want your auditor to have view access to."
- "👁 Enable all sections", "Disable all sections".
- One collapsible row per section: icon, name, one-line scope, "👁 N/N shared with auditor", View.
  - Risk — Snapshots of the risk register — 1/1; expanded, its toggle row "Snapshots of the risk register".
  - Issues — Snapshots of tracked issues — 0/1.
  - Vendors — Managed vendors — 1/1.
  - Assets — Inventory and code changes — 2/2.
  - Personnel — People, groups, and account access — 3/3.
  - Integrations — Connected integrations — 1/1.
  - Info & agreements — Information and notifications — 2/2.
- An enabled section opens to the auditor at the window or at early access; disabling removes access at once.

Flow edges:
- → Audits → Open audit → Requests → a request → + Evidence → Share evidence → Share with internal team (Internal review) → Share with auditor (Audit ready) → the auditor Accepts or Flags → Flagged → fix → Share with auditor.
- → a request → Controls "+" → map a control. Mapped controls enable Related evidence recommendations.
- → Controls → Export / Export control activity.
- → Data & populations → toggles → View (the auditor's page, once the window opens).
- → Requests → Export → a ZIP: a CSV of requests, a folder per request (evidence, external comments, metadata). The auditor cannot export.

Images: `../../images/ux/audits/managing-an-information-request-list-irl--01.png`, `../../images/ux/audits/managing-an-information-request-list-irl--02.png`, `../../images/ux/audits/managing-an-information-request-list-irl--08.png`, `../../images/ux/audits/managing-an-information-request-list-irl--03.png`, `../../images/ux/audits/managing-an-information-request-list-irl--04.png`, `../../images/ux/audits/managing-an-information-request-list-irl--05.png`.

### 2.21 The auditor's side: portal, evidence drawer, request view

Layout:
- Auditor portal: Vanta mark; an icon rail (audits, a code icon, an external-link icon); "Audits" with "+ Add audit" (primary purple).
- Four stat cards: In audit 4, Upcoming 1, Awaiting report 277, Completed 23.
- Filters: Search, Company, Framework, Status, Audit type.
- Table columns:
  - COMPANY, AUDIT NAME.
  - FRAMEWORK: "SOC 2 Type II" over "4 TSCs".
  - STATUS chip.
  - AUDIT PROGRESS: "2% Ready for audit" over a stacked bar, "IRL to be uploaded", "2% Approved".
  - AUDIT WINDOW ("Feb 18, 2026 - Feb 21, 2026"); AUDITORS (avatars, or "NA ⓘ"); Open; ⋯.
- Footer: "1-5 of 305 results".
- Inside a default-list audit:
  - A dark audit band: "← Audit: hbtest_core.com, test", External, In audit, ISO 27001:2013, "February 18, 2026 - February 21, 2026".
  - Left nav: Evidence, Controls, Framework | Risk ›, Vendor, Assets ›, Personnel › | Integrations, Organization settings.
- Evidence page:
  - "Evidence tracker ⓘ": Not ready for audit 133, Flagged by auditor 0, Ready for audit 2, Accepted 0, Not applicable.
  - Search evidence; Type, Created by; tabs All (136), Not ready for audit (133), Flagged by auditor (0), Ready for audit (2), Accepted…
- Evidence drawer (right half, ^/v stepping, ✕):
  - Title "Company uses Vanta for continuous security monitoring"; Description "Automatically passes.".
  - Facts: Auditor assessment (Ready for audit), Type (Test), Category (Infrastructure), Owner (Unassigned).
  - Actions: "✓ Accept evidence" (primary), "⚑ Flag evidence", "Mark as not required".
  - Tabs: Details, Related controls, Audit activity, Comments, Test evidence.
  - Related controls card, with "+ Add control" when the auditor may change mappings: Framework (ISO 27001:2013), Section Code (A.18.2.1), Control (Independent review of information security), Owner, unlink.
- IRL request as the auditor sees it: "⚑ Flag evidence" and "Accept evidence" (disabled until Audit ready), ⋯.
  - Facts: Not ready, Unique ID CC.1.1.3, Unassigned, "Due May 31, 2026", Sample, "Set cadence", Framework codes CC 1.1, CC 1.4.
  - Tabs: Evidence, Controls, Activity, Comments.
  - Empty state: "Evidence added by your customer will appear here."
- Customer's in-audit view of the same list ("Audit progress ⓘ"): Not ready for audit 217, Flagged by auditor 5, Ready for audit 97, Accepted 1, Not applicable 23; tabs with counts; rows with "⚑ Flagged" chips and "↗ Update eviden…" buttons.
- The auditor sees in-window test results, SLA misses (even late fixes), out-of-scope and deactivated resource names with their reasons, and issues found and fixed in the window.
- The auditor never sees items fixed before their SLA, failures from before the window, SLAs that end after it, or raw API data.

Flow edges:
- → customer: Audits → Open audit → Flagged by auditor tab → Update evidence ↗ (the document or test) → fix → back → Comments → check "Request auditor review" → Ready for audit.
- → auditor: Audits → Open → Evidence → a row → drawer → Accept, Flag or Mark as not required → Audit activity logs "<actor> changed the evidence status to <badge>".
- → auditor: Controls → assessment chip → justification → the Control tracker moves.
- → access: Settings › User permissions › Auditors → Add Auditor → "Add your audit firm" → Grant access → assign to an audit → the portal shows it at the window, or at early access.

Images: `../../images/ux/audits/adding-and-managing-auditors--07.png`, `../../images/ux/audits/adding-and-managing-auditors--09.png`, `../../images/ux/audits/managing-an-information-request-list-irl--07.png`, `../../images/ux/audits/audit-evidence--02.png`.

### 2.22 Auditor access settings and auditor views

Layout:
- Settings › User permissions:
  - Left menu: COMPANY (Notifications, Information, Language, Developer console, Tags, Business units, AI), ACCESS (User permissions, Roles, Teams, Login and security), MONITORING (Frameworks, SLAs), MY ACCOUNT (Notifications, Language, Interface).
  - Tabs: Your organization | Auditors; a paragraph on what auditors see with a link to Compliance Settings; "+ Add Auditor".
  - An AUDIT FIRM table with "🗑 Remove acce…" per row; "1-10 of 21 results".
- "Add your audit firm" modal: "Adding an auditor to Vanta helps them plan effectively and avoid audit delays…"; "Which auditor should be granted access to Vanta?" with "Select an audit firm" (type four characters); a privacy note; "Don't see your auditor? Invite them to Vanta"; Cancel and "Grant access" (disabled until chosen).
- Auditor views, what the Controlled view shows:
  - Risk: ID, scenario, inherent and residual risk, treatment, approval, owner, categories, CIA, identified, visible custom fields.
  - Vendors: name, category, inherent risk, findings, last and next review.
  - Personnel: people, groups, account access, as static tables.
  - Integrations: name, tags, categories.
  - Organizations: identical in both views.
  - Nothing in the Controlled view is clickable.
- Full view: everything, clickable, including financial impact, security reviews, vulnerabilities, alarms, databases, networks and task drill-downs.

Flow edges:
- → Settings → User permissions → Auditors → Add Auditor → Grant access → the firm's contact gets an email → Audits → card ⋯ → Assign to audit firm / Edit auditors.

Images: `../../images/ux/settings/adding-and-managing-auditors--02.png`, `../../images/ux/settings/adding-and-managing-auditors--08.png`.

### 2.23 Gap assessments

Layout:
- The article defines a gap assessment and calls it recommended, not required; its Vanta how-to is a link outside this share.
- In the product it shows as Framework details › More › "Export gap assessment" (from `../../pages/framework-details-page.md`).
- Before an audit, the gap is read off the same numbers (Controls with passing evidence, Needs evidence, tests Needs attention) (inferred).
- The ISO checklist asks for 80–90% control completion in Vanta before the internal audit.

Flow edges:
- → framework → More → Export gap assessment → a file (format not stated).

Images: none.

### 2.24 Exports (every export the share names)

- Framework More: Export controls; Export all framework evidence; Export custom control history; Export gap assessment.
- FedRAMP: an OSCAL export of the framework's controls, tests and evidence as JSON, publishable as a synced Trust Center resource.
- HITRUST: Audit › Export › "HITRUST MyCSF Evidence Export". It says it will export the e1 validated-assessment evidence; a table of Evidence type (Policies, Tests, Documents) and Items to be exported; Cancel and "Export to MyCSF".
- IRL Requests: Export → a ZIP (a CSV of requests, a folder per request, external comments, metadata).
- IRL Controls: Export (CSV with assessments and justifications, no comments); Export control activity (CSV log).
- Common controls: ⋯ › Export all (CSV with mapped framework controls and evidence ids).
- Documents: Export all (a zip of every file); Export one (Download); test-run CSV and workpaper PDF per test (earlier note).
- Issues, Computers and the auditor's Evidence page each have a download or Export control.
- Risk snapshots: Export and Download files (earlier note).
- Completed audits: Download report.
- Policies: the V2 migration packet (approved PDFs, acceptance and approval CSVs, mapping doc, templates).
- System description: Generate Draft → DOCX.

Images: `../../images/ux/audits/vanta-and-hitrust-mycsf-api-integration--03.png`.

### 2.25 Device posture (from Security Posture Best Practices)

Layout:
- A newer global shell:
  - Top search "✦ Which of my controls are failing or out of date? ⌘K".
  - Nav: My program, My work, Vanta Agent, Tests, Reports; Compliance (Frameworks, Controls, Policies, Documents, Audits, Issues); Customer trust; Risk; Vendors; Privacy; Assets; Personnel (People, Computers, Access).
- Computers: tabs Monitored | Unmonitored; scopes All business units / All frameworks; filters Monitoring, Status, OS version, Owner; "✉ Send bulk reminder" (primary), Export.
- Columns: DEVICE, OWNER, OS VERSION, MONITORING (NinjaOne, Addigy, Microsoft Endpoint Manager, Iru), PW, HD, AV, SL (✓ / ✗ / — / clock), LAST CHECK ("2 years"), FRAMEWORK ("ADG Test Frame +45"), BUSINESS UNIT.

Images: `../../images/ux/devices/device-monitoring-in-vanta--04.png`.

## 3. The data model as the UI shows it

### 3.1 The chain

- framework → control set (baseline: Security; IG1/IG2/IG3; Low, Li-SaaS, Moderate, High) → requirement category → requirement → control → test / document / policy → evidence (resources, files, versions) → audit (requests or evidence items, auditor assessments).
- A control is many-to-many with frameworks ("SOC 2 · CC 6.1", "HIPAA · 164.308(a)(1)(i)") and carries a Control set column inside a framework.
- A common control groups controls of several frameworks by objective ("consolidated from 55 to 28"), on the CSF function → domain → subdomain tree.
- Issues hang off controls (Linked issues) and carry their own evidence ("Log evidence") and subtasks.
- Risk scenarios map to controls both ways.

### 3.2 What each record shows of the others

- Framework row: Evidence completion %, Control completion %, Audit ends, Status, Domain chips.
- Framework page: Controls % with passing evidence (93 of 109), split Automated tests 44/64 and Documents 7/32; requirement cards list their controls with evidence readiness (0/2), owner and control set.
- Control: Tests N/M OK, Documents N/M OK, Mapped frameworks chips, Risk scenarios, Linked issues, Implementation details, Note, History; Assignment state.
- Common control: % mapped evidence passing; controls consolidated (4 → 1); mapped frameworks; tabs of its controls' evidence, policies, risks, issues.
- Test: its owner, integration, SLA days, last refresh; items needing attention per framework; Controls (22), Tasks, Audits; per item detected, due and remediated dates.
- Document: owner, renewal cadence, Controls (8), Tasks (1), Audits; files with expiry, type and adder; versions history; recommended files from tickets.
- Policy: overall status, frameworks (+11 more), renewal, Controls (88), Audits; versions with approval and language drafts; personnel acceptance (0/23).
- Audit card: timeline (access, start, end), tracker counts, firm, auditor, report.
- IRL request: owner, due, capture date, type, cadence, framework codes, mapped controls, shared evidence (count, last shared by), activity, two comment threads.
- Audit control: Requests accepted 0/3, Program mapping, Auditor assessment, Justification.

### 3.3 Statuses and their words

- Framework: Active, In audit (and snoozed until a date, inferred as a state).
- Control: Ok / Needs evidence. Assignment: Unassigned / Assigned / Needs reassignment. Source: Vanta / Custom. Deactivated (restorable) vs deleted.
- Test:
  - The register: OK / Needs attention, split Overdue, Due soon, Needs remediation (no SLA assigned).
  - Lifecycle: Upcoming (rollout date), Deactivated indefinitely or until a date, Pass by default.
  - Per item: Within SLA / missed.
- Document status, by page:
  - OK (/docs, /tests), Passing (detail).
  - Needs update (/docs), Due soon (/tests), Passing (detail).
  - Needs document (/docs), Needs remediation or Overdue (/tests), Needs attention (detail); failing.
  - Not relevant (detail: Deactivated).
  - Upcoming (detail: Preview).
- Document renewal: Expiring soon / Expired. Workflow: Get started → Draft → Mark as complete or Submit for approval → current version.
- Policy overall: OK / Needs remediation / Renew soon / Expired.
- Policy version: Draft / Pending approval / Approved. Approval line: "Approval not started". Language rows: Not started / Last edited by.
- Audit: Upcoming / In audit / Awaiting report / Completed. External / Internal. Auditor view: Full / Controlled.
- Evidence in a default-list audit: Not ready for audit / Flagged by auditor / Ready for audit / Accepted (also "Approved") / Not applicable.
- IRL request: Not ready → Internal review → Audit ready (the team moves these) → Flagged / Accepted (only the auditor). Types: Point in time, Sample, Population. Cadence: Monthly, Quarterly, Biannually, Annually.
- Auditor control assessment, by framework:
  - Default: Not assessed, Not in place, Partial, In place.
  - NIST 800-53, FedRAMP and custom frameworks: Not assessed, Not satisfied, Other than satisfied, Satisfied.
  - ISO: Not assessed, Major non-conformity, Minor non-conformity, Conforming.
  - FedRAMP 20x: Not assessed, False, Partial, True.
- Issue: Not started / In progress / Closed (the article also says Started).
  - Severity or priority: Critical, High, Medium, Low.
  - Type: Exception, Major nonconformity, Minor nonconformity, Opportunity for improvement, Process for improvement.
  - Closed is final.

### 3.4 Numbers seen, for scale

- Controls in one account: 10,502 (6% assigned); tests 150/302; documents 883/3,868.
- Tests: 524 total, 184 OK (35%), 340 need attention (168 overdue, 32 due soon, 140 no SLA).
- One audit: 343 evidence items (217 not ready, 5 flagged, 97 ready, 1 accepted, 23 N/A).
- An IRL audit: 8 requests, 29 controls. An internal audit: 296 controls, 292 not assessed.
- The auditor portal: 305 audits (4 in audit, 1 upcoming, 277 awaiting report, 23 completed).
- Common controls: 28 consolidated from 55; Consent Documentation from 4 to 1.
- Control sets: SOC 2 Security 80 → +A +C 87 controls; CIS IG1 56 → IG2 130.

## 4. For Program Assurance

- Baseline: Vanta's "Change this framework's control set?" (Change from IG1 56 → Change to IG2 130; "not allowed during an active audit") is PA's Edit overlays. Adopt boldly: the from/to count box, and refusing a baseline change while an assessment campaign is open.
- Controls: the framework page's "% of controls have passing evidence" card split by Automated tests n/m and Documents n/m, over a requirement-category rail, is the program's Control status view. PA keeps its richer ladder (No requirement → No evidence → Not assessed → determination) instead of Vanta's binary Ok / Needs evidence.
- SSP implementation:
  - The control panel's Implementation details maps to the SSP narrative per control.
  - The agent's "Approval required — Review updates to 7 controls" card (Approve / Reject, batches of 20) is the right shape for drafting narratives, always with review.
  - The System description generator ("1 / 2 completed" sections, Generate Draft) is the SSP's system description chapter.
- Requirements and common controls: VCF's "controls consolidated from 55 to 28" on a CSF function rail mirrors PA's requirement → control mappings and inherited and common controls. Show consolidation as one number on the requirements register (inferred fit).
- Evidence: the document record (Get started → Draft → Mark as complete or Submit for approval; "Expires on …"; "No prior versions"; Recommended files from tickets; renewal settings with reminder days) is a near-exact pattern for evidence artifacts and versions. Adopt it whole, including the Jira "Task creation at renewal".
- Assessment campaigns and the SAR:
  - The IRL audit (Requests / Controls / Data & populations) is an assessment campaign.
  - A request is a plan item or objective; the Control tracker is the SAR roll-up.
  - The assessor's per-control dropdown already uses NIST's words (Satisfied / Other than satisfied) with a required Justification.
  - Adopt boldly: the two-sided status, where the team moves Not ready → Internal review → Audit ready and only the assessor moves Flagged or Accepted; and "N/N shared with assessor" per population.
- POA&M: Issues (Details + Root cause, Log evidence, an irreversible "Close issue", Tasks "3/4 closed 75%", Type Exception and nonconformities, mapped controls) is a remediation item with milestones. Take the Tasks progress column and the root-cause field; keep PA's milestone dates and reopenable history (do not copy "cannot be reopened").
- Authorization package: the audit card (Timeline: access → start → end; tracker bar; "No reports available yet" → Upload report & complete) fits a package card ending in the ATO decision letter.
- Exports: offer OSCAL SSP/SAR/POA&M exports, Vanta's FedRAMP OSCAL export being the precedent.
- Auditor's view: an assessor portal with In audit / Upcoming / Awaiting report / Completed cards and a "% Ready for audit" bar per engagement fits external 3PAOs and SCAs (inferred demand).
- Do not adopt: snoozing a framework (it hides obligations); "Pass by default" auto-passes; AI auto-mapping without a confirm step; auditor visibility that hides failures fixed before an SLA or before the window (RMF assessors and AOs need full history); Delete all custom controls; one blended "Controls OK %".
- Do not adopt: audit settings that cannot be edited after creation without a visible reason; PA's form contract gives reasons in place instead.

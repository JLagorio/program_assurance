# Drata risk, vendors and people: risk management, TPRM, personnel, devices, assets, access reviews

Read 2026-11-22 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Personnel Management (Device Compliance, Drata Agent, Employee Offboarding, Employee Onboarding, Personnel Compliance) and Understand the Drata Platform: Personnel, Assets, Vulnerabilities, Vendors (with Procurement Connections, TPRM Agent and TPRM Agent Legacy), Risk, Access Review, Training Videos (with its TPRM, New Experience and SafeBase sub-collections) and Webinar Recordings (with Getting Started with Drata and Policy Power Hour Recordings).
- 146 articles in 21 collections, each listed once under the collection the digest gives it.
- 59 screenshots viewed; each surface's Images line names the ones it rests on, as paths from this note. Two surfaces (Vulnerabilities, Procurement connections) have no screenshot in the share and rest on the articles alone.
- The articles are third-party pages, read as data. Labels, statuses and short on-screen strings are quoted; everything else is paraphrase.

## 1. Every article, one line

### Personnel Management › Device Compliance (8)

- [Auto-Lock your Workstation with Screensaver](../articles/auto-lock-your-workstation-with-screensaver.md): employee-side steps to make the screen lock with a password when the screensaver starts, on macOS, Windows and Ubuntu.
- [Configure your computer for installing  Anti-Virus Software](../articles/configure-your-computer-for-installing-anti-virus-software.md): what satisfies the malware-detection check (Test 64): a supported antivirus, or the macOS built-ins configured instead.
- [Configuring Automatic Updates on your Computer](../articles/configuring-automatic-updates-on-your-computer.md): turning on automatic OS updates on a Mac, shown in five macOS settings screenshots.
- [Encrypting your Computer's Hard Drive](../articles/encrypting-your-computer-s-hard-drive.md): FileVault, BitLocker and LUKS steps so the disk-encryption check passes.
- [How do Bring Your Own Device (BYOD) Devices Affect my Audit?](../articles/how-do-bring-your-own-device-byod-devices-affect-my-audit.md): options when no device is company-owned: agent, MDM, screenshots, or a written BYOD policy the auditor accepts.
- [How to Handle Device Compliance for Chromebooks](../articles/how-to-handle-device-compliance-for-chromebooks.md): why Chromebook defaults are hard to evidence and the vendor security paper used as proof instead.
- [Installing and Using a Password Manager](../articles/installing-and-using-a-password-manager.md): why staff should use a password manager and how the agent detects one.
- [Manual evidence uploads for personnel compliance checks](../articles/manual-evidence-uploads-for-personnel-compliance-checks.md): an employee without the agent uploads screenshots per check in My Drata; an admin setting allows manual upload.

### Personnel Management › Drata Agent (8)

- [Capture Agent Device Logs (macOS)](../articles/capture-agent-device-logs-macos.md): Option-click the agent's menu-bar icon, "Save Diagnostics", find the hidden log folder and send it to support.
- [Computer Configuration via Ubuntu Linux](../articles/computer-configuration-via-ubuntu-linux.md): Linux users meet each check by uploading evidence in My Drata (disk encryption, antivirus), then see "View Evidence".
- [Computer Configuration via Windows OS](../articles/computer-configuration-via-windows-os.md): the read-only Windows agent lists the checks still to fix; it runs daily.
- [Drata Agent Installation Link](../articles/drata-agent-installation-link.md): a direct download page for when the agent option is turned off in My Drata.
- [Drata Agent not reporting system updates](../articles/drata-agent-not-reporting-system-updates.md): why a fixed setting does not show yet ("Unable to get data"), macOS automation permissions, and contractor/IdP mismatches.
- [How does the Drata agent work?](../articles/how-does-the-drata-agent-work.md): the menu-bar agent, its checklist window and "Sync now", and how often it syncs.
- [Install the Drata Agent](../articles/install-the-drata-agent.md): installing from My Drata during onboarding, verifying it registered, and what it reads (and does not).
- [Multi-Device Support](../articles/multi-device-support.md): several devices per person, how each is tracked and which one carries compliance; a Kandji note.

### Personnel Management › Employee Offboarding (2)

- [Offboarding Checklist Guidance](../articles/offboarding-checklist-guidance.md): a recommended offboarding checklist (access revoked, equipment returned, accounts transferred).
- [Personnel Offboarding Evidence](../articles/personnel-offboarding-evidence.md): finding former employees in Personnel and attaching proof of access removal in the offboarding evidence drawer.

### Personnel Management › Employee Onboarding (6)

- [Background Check Management](../articles/background-check-management.md): the Manage Connected Background Check Accounts table that links provider checks to personnel; partner offers.
- [Certn Background Check Packages](../articles/certn-background-check-packages.md): which Certn package to pick, US, Canadian and international, shown as setup checklists.
- [Future Hire Personnel](../articles/future-hire-personnel.md): a "Future Hire" status by start date keeps new joiners out of compliance counts until they start; how syncs set it.
- [Manually map proof of a background check](../articles/manually-map-proof-of-a-background-check.md): uploading background-check evidence from a person's requirements table when the provider is not connected.
- [Review and Acknowledge Company Policies](../articles/review-and-acknowledge-company-policies.md): the employee's Policy Review task: open each policy, read it in a viewer, "Acknowledge".
- [Showing completion of Security Awareness Training](../articles/showing-completion-of-security-awareness-training.md): completing Drata's training in My Drata or uploading a certificate from another provider.

### Personnel Management › Personnel Compliance (3)

- [Are Contractors in Scope for my Audit?](../articles/are-contractors-in-scope-for-my-audit.md): framework by framework, when contractors are usually in an audit's population; the auditor decides.
- [Bulk Import Policy Acknowledgments](../articles/bulk-import-policy-acknowledgments.md): the guided spreadsheet import (upload, map fields and values, fix invalid cells, submit) for past acknowledgments.
- [Personnel: who should be accounted for in terms of your audit?](../articles/personnel-who-should-be-accounted-for-in-terms-of-your-audit.md): anyone with customer-data access or who builds or runs the platform is in scope.

### Understand the Drata Platform › Access Review (6)

- [Add an Application Manually for Access Reviews (New Experience)](../articles/add-an-application-manually-for-access-reviews-new-experience.md): Governance › Access Reviews › Applications › "Add application": URL and reviewer.
- [Download Access Review Evidence and Review Details](../articles/download-access-review-evidence-and-review-details.md): downloading a completed review's evidence from the row menu or the review page, and its internal notes.
- [Example Access Review Procedure](../articles/example-access-review-procedure.md): a template procedure (ticket, two review questions, sign-off) to adapt.
- [Run an Access Review](../articles/run-an-access-review.md): create a review period, review each application's accounts, complete it, handle account warnings, reopen.
- [Upload or Update Personnel Data for Access Reviews (New Experience)](../articles/upload-or-update-personnel-data-for-access-reviews-new-experience.md): CSV upload of account data, only for manually added applications.
- [User Access Reviews for Microsoft 365](../articles/user-access-reviews-for-microsoft-365.md): prerequisites: the apps come from Entra enterprise applications.

### Understand the Drata Platform › Assets (6)

- [Assets](../articles/assets.md): Risk › Assets, the inventory of in-scope assets, and adding one by hand.
- [Azure Virtual Asset](../articles/azure-virtual-asset.md): the twelve Azure services whose resources fill the inventory once Azure is connected.
- [Bulk Import Assets](../articles/bulk-import-assets.md): the guided spreadsheet import for custom assets, with integration-managed rows protected and duplicates warned.
- [GCP Virtual Assets](../articles/gcp-virtual-assets.md): GCP resources in the inventory, marking them out of scope, owner assignment, and the daily sync.
- [Understanding Device Linking, Removal, and Visibility in Drata](../articles/understanding-device-linking-removal-and-visibility-in-drata.md): what unlinking or removing a device does to compliance, and why a device may be missing.
- [Virtual Asset Population: AWS](../articles/virtual-asset-population-aws.md): which AWS resources populate the inventory automatically.

### Understand the Drata Platform › Personnel (13)

- [Bulk Import Personnel Background Checks (New Experience)](../articles/bulk-import-personnel-background-checks-new-experience.md): Personnel ⋯ › Bulk import › Background checks; required columns and how a row changes a person's status.
- [Bulk Import Personnel Training Records (New Experience)](../articles/bulk-import-personnel-training-records-new-experience.md): Personnel ⋯ › Bulk import › Trainings (Security, HIPAA and others) from CSV or Excel.
- [Confirm your personnel](../articles/confirm-your-personnel.md): check every person holds the right employment status before an audit, and change it.
- [Identity sync updates in Drata](../articles/identity-sync-updates-in-drata.md): when personnel, user and device changes from the IdP, HRIS and MDM appear.
- [Mark personnel as Out of Scope (New Experience)](../articles/mark-personnel-as-out-of-scope-new-experience.md): when and how to take a person out of compliance scope.
- [Personnel exclusions](../articles/personnel-exclusions.md): a five-step drawer to exempt a group from chosen checks for a period with a reason, kept in audit scope; shown on tests.
- [Personnel Overview](../articles/personnel-overview.md): the Personnel page: filters, search, the selection bar, downloads and reassigning a person's responsibilities.
- [Populating and Managing Personnel Data in Drata (Concept Guide)](../articles/populating-and-managing-personnel-data-in-drata-concept-guide.md): how IdP and HRIS data fill personnel and set employment status.
- [Reset recurring personnel trainings](../articles/reset-recurring-personnel-trainings.md): Settings › Personnel compliance › Training: schedule or run resets of yearly trainings.
- [Resume IdP and HRIS syncs for personnel](../articles/resume-idp-and-hris-syncs-for-personnel.md): a manual edit stops a person's sync; "Re-enable IdP/HRIS Sync" from the person or the selection bar.
- [Send reminder email to personnel](../articles/send-reminder-email-to-personnel.md): "Send reminder email" from the selection bar or a person's header for unfinished onboarding.
- [Troubleshoot employment status issues in Drata](../articles/troubleshoot-employment-status-issues-in-drata.md): why people show as "Unknown", "Former" or "Future Hire" wrongly, and Resync Personnel.
- [Why active employees may appear as former employees in Drata? (Concept Guide)](../articles/why-active-employees-may-appear-as-former-employees-in-drata-concept-guide.md): the source fields that decide current versus former status.

### Understand the Drata Platform › Risk (18)

- [Add and View Residual Risk in the Risk Register (New Experience)](../articles/add-and-view-residual-risk-in-the-risk-register-new-experience.md): scoring a risk's residual impact and likelihood after treatment and where the score shows.
- [Assess and Manage Individual Risks](../articles/assess-and-manage-individual-risks.md): the risk page: Overview fields, scoring, treatment, mitigating controls and internal notes.
- [Custom Formulas for Risks](../articles/custom-formulas-for-risks.md): a formula custom field that computes a risk score from other fields, placed in a risk section.
- [Drata's Risk Library (New Experience)](../articles/drata-s-risk-library-new-experience.md): the Library tab of prewritten risks: select, "Add to register"; removing a risk from the register.
- [Getting started with a risk assessment (Concept Guide)](../articles/getting-started-with-a-risk-assessment-concept-guide.md): identify, analyse, treat, plan, report, mapped onto Drata's Risk Management module.
- [Import Risk in Bulk (New Experience)](../articles/import-risk-in-bulk-new-experience.md): the guided import to add custom risks or update existing ones, column by column.
- [Integrating Fraud Risk into Your Risk Assessment (Concept Guide)](../articles/integrating-fraud-risk-into-your-risk-assessment-concept-guide.md): adding fraud scenarios to the ordinary risk assessment.
- [Manage multiple risk registers (New Experience)](../articles/manage-multiple-risk-registers-new-experience.md): All registers, create and configure a register, move risks between registers, library, insights, settings.
- [Manage Risk Across Workspaces](../articles/manage-risk-across-workspaces.md): tying a register to one or more workspaces and optionally to their controls.
- [Residual Risk in Security Reviews](../articles/residual-risk-in-security-reviews.md): how the TPRM Agent recommends a vendor's residual risk, the scoring breakdown, recalculating, and when it declines.
- [Risk categories in Drata](../articles/risk-categories-in-drata.md): Risk Settings › Categories: create custom categories and pick them in the Create risk wizard.
- [Risk insights overview](../articles/risk-insights-overview.md): the Risk insights dashboard, its filters, cards and charts, and downloads.
- [Risk management in Drata: An overview](../articles/risk-management-in-drata-an-overview.md): the Register tab, its filters, how scores are computed, bulk actions and reports.
- [Risk Treatment Plan Guidance](../articles/risk-treatment-plan-guidance.md): the Risk Assessment Report's two tables (results, treatment plan) and what each column should hold.
- [Streamlined Risk Register Set Up](../articles/streamlined-risk-register-set-up.md): "Help me build my register", a short survey that seeds an empty register from the library.
- [Terminology Updates: Inherent and Residual Risk in Vendor Risk Management](../articles/terminology-updates-inherent-and-residual-risk-in-vendor-risk-management.md): vendor "risk level" became inherent risk and the review's rating became residual risk; where each shows.
- [Understanding the Drata Risk Register](../articles/understanding-the-drata-risk-register.md): each Risk Register column explained; the library holds 200+ risks from NIST SP 800-30, ISO 27005 and OCR SRA.
- [Your First Risk Assessment: A Step-by-Step Guide (Concept Guide)](../articles/your-first-risk-assessment-a-step-by-step-guide-concept-guide.md): a beginner's checklist for a first assessment and where frameworks require one.

### Understand the Drata Platform › Training Videos (1)

- [Framework Mapping Agent Training Video](../articles/framework-mapping-agent-training-video.md): video: generating and reviewing control recommendations for a custom framework.

### Understand the Drata Platform › Training Videos › Third-Party Risk Management (TPRM) Training Videos (6)

- [Accelerate Vendor Risk Reviews with Drata’s Agentic Third-Party Risk Management](../articles/accelerate-vendor-risk-reviews-with-drata-s-agentic-third-party-risk-management.md): video: the agentic TPRM pitch, faster and more consistent reviews.
- [Training Video: Conducting an End-to-End Vendor Review with the Drata TPRM Agent (New Experience)](../articles/training-video-conducting-an-end-to-end-vendor-review-with-the-drata-tprm-agent-new-experience.md): video: a review from public documents, one with trust-center access, and reading the results.
- [Training Video: Optimizing TPRM Through Vendor Settings (New Experience)](../articles/training-video-optimizing-tprm-through-vendor-settings-new-experience.md): video: vendor types, risk levels and inherent-risk classification settings.
- [Training Video: Vendor Management Overview (New Experience)](../articles/training-video-vendor-management-overview-new-experience.md): video: the Vendors area and adding current vendors.
- [Training Videos: Add Prospective and Existing Vendors to Drata (New Experience)](../articles/training-videos-add-prospective-and-existing-vendors-to-drata-new-experience.md): videos: a prospective vendor, then current ones by connection, CSV, API or hand.
- [Training Videos: Review and Custom Vendor Criteria (New Experience)](../articles/training-videos-review-and-custom-vendor-criteria-new-experience.md): video: reviewing and editing the agent's evaluation criteria and inherent risk.

### Understand the Drata Platform › Training Videos › Training Videos (New Experience) (14)

- [AI-Assisted Custom Control Mapping Training Video](../articles/ai-assisted-custom-control-mapping-training-video.md): video: AI-suggested requirement mappings for a custom control, reviewed before saving.
- [Creating and Navigating an Audit in Drata Training Video](../articles/creating-and-navigating-an-audit-in-drata-training-video.md): video: creating an audit, inviting the auditor, requests, evidence and messages.
- [Drata Connections Training Video (New Experience)](../articles/drata-connections-training-video-new-experience.md): video: how connections feed automated tests.
- [Drata Controls (DCFs) Training Video (New Experience)](../articles/drata-controls-dcfs-training-video-new-experience.md): video: managing, monitoring and fixing controls.
- [Drata Platform Overview Training Video (New Experience)](../articles/drata-platform-overview-training-video-new-experience.md): video: the core workflows and audit readiness.
- [Frameworks in Drata: Understanding Requirements and Control Readiness Training Video (New Experience)](../articles/frameworks-in-drata-understanding-requirements-and-control-readiness-training-video-new-experience.md): video: how frameworks, requirements and controls relate and roll up to readiness.
- [Integrating an Okta Tenant with Drata Training Video](../articles/integrating-an-okta-tenant-with-drata-training-video.md): video: connecting Okta for user sync, SSO and monitoring.
- [Managing Evidence in Drata Training Video (New Experience)](../articles/managing-evidence-in-drata-training-video-new-experience.md): video: the evidence page.
- [Managing Personnel Compliance in Drata Training Video (New Experience)](../articles/managing-personnel-compliance-in-drata-training-video-new-experience.md): video: the Personnel page, onboarding prep and personnel exclusions.
- [Policy Management in Drata Training Video (New Experience)](../articles/policy-management-in-drata-training-video-new-experience.md): video: building, approving and publishing policies.
- [Risk Insights Training Video (New Experience)](../articles/risk-insights-training-video-new-experience.md): video: the Risk insights dashboard.
- [Risk Management Training Videos (New Experience)](../articles/risk-management-training-videos-new-experience.md): three videos: identifying, scoring and treating risks.
- [Set Up Enterprise SCIM Connection Training Video](../articles/set-up-enterprise-scim-connection-training-video.md): video: enterprise SCIM with Okta and syncing a new user.
- [Understanding Monitoring in Drata Training Video (New Experience)](../articles/understanding-monitoring-in-drata-training-video-new-experience.md): video: the Monitoring page and one test explained.

### Understand the Drata Platform › Training Videos › Training Videos (SafeBase) (6)

- [SafeBase Integrations Training Video](../articles/safebase-integrations-training-video.md): video: SafeBase integrations, API keys, partners, SSO and SCIM.
- [SafeBase Trust Center Access Levels Training Video](../articles/safebase-trust-center-access-levels-training-video.md): video: public, approved and permission-based visibility on a trust center.
- [SafeBase Trust Center Branding and URL Setup Training Video](../articles/safebase-trust-center-branding-and-url-setup-training-video.md): video: branding, legal links, email settings and a custom URL.
- [SafeBase Trust Center NDA Set up Training Video](../articles/safebase-trust-center-nda-set-up-training-video.md): video: clickwrap, DocuSign or Ironclad NDAs and bypass rules.
- [SafeBase Trust Library Documents Training Video](../articles/safebase-trust-library-documents-training-video.md): video: uploading, configuring and replacing trust-center documents.
- [SafeBase Trust Library Knowledge Base Management Training Video](../articles/safebase-trust-library-knowledge-base-management-training-video.md): video: governing reusable questionnaire answers.

### Understand the Drata Platform › Vendors (19)

- [Add a prospective vendor](../articles/add-a-prospective-vendor.md): the Prospective vendors list for third parties under evaluation, and activating one into Current.
- [Automate Recurring Vendor Reviews with the TPRM Agent](../articles/automate-recurring-vendor-reviews-with-the-tprm-agent.md): a setting lets the agent start each due review itself; what each vendor needs and when it stops for a person.
- [Bulk actions for Current Vendors (New Experience)](../articles/bulk-actions-for-current-vendors-new-experience.md): the selection bar's verbs: owners, review deadline, residual risk, type, questionnaire, archive.
- [Create and Manage Vendor Questionnaires](../articles/create-and-manage-vendor-questionnaires.md): the Questionnaires list, the question builder, the default email, and sending one.
- [Customize the vendor questionnaire email subject line (New Experience)](../articles/customize-the-vendor-questionnaire-email-subject-line-new-experience.md): the subject field in the "Send via Drata" dialog of a security review.
- [Customize vendor risk levels](../articles/customize-vendor-risk-levels.md): renaming, adding and removing inherent risk levels, and what each change touches.
- [Customize vendor types (New Experience)](../articles/customize-vendor-types-new-experience.md): Vendor settings › Types: edit the list and pick a type when adding a vendor.
- [Customizing Security Review Titles](../articles/customizing-security-review-titles.md): naming and renaming Security, SOC and Uploaded reviews; the review table's new columns.
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](../articles/hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md): evidence to gather from hosting vendors each audit period and where to keep it.
- [Internal Notes and Observations in Security Reviews (New Experience)](../articles/internal-notes-and-observations-in-security-reviews-new-experience.md): the review's side panel: private notes versus observations that can become register risks.
- [SafeBase Integration for TPRM Reviews](../articles/safebase-integration-for-tprm-reviews.md): adding a vendor's SafeBase trust center so the agent collects its documents.
- [SafeBase Trust Center integration in Drata TPRM](../articles/safebase-trust-center-integration-in-drata-tprm.md): trust-center URLs on a vendor, accepted formats, the Trust Center tab and use in reviews.
- [Security Questionnaire Automation (SQA) Beta  Sunset Notice](../articles/security-questionnaire-automation-sqa-beta-sunset-notice.md): the SQA beta ends 2026-04-30; its successor is AI questionnaire assistance in SafeBase.
- [Start and manage security reviews for your vendors](../articles/start-and-manage-security-reviews-for-your-vendors.md): review statuses, starting one, recurring schedules, deadline shifts and reminder emails.
- [Vendor Automated Impact Assessment](../articles/vendor-automated-impact-assessment.md): the profile's Impact assessment card, answered with AI help.
- [Vendor insights](../articles/vendor-insights.md): the Vendor insights dashboard: lifecycle counts, impact and risk charts, business units.
- [Vendor risks](../articles/vendor-risks.md): risks tied to a vendor, added from its Risks tab and gathered on a Vendor risks page.
- [Vendor suggestions](../articles/vendor-suggestions.md): vendors suggested from SSO apps, turned on in Vendor settings.
- [Vendors overview in Drata](../articles/vendors-overview-in-drata.md): the Vendors area, Current vendors, adding one vendor, and the bulk add or update import with its field list.

### Understand the Drata Platform › Vendors › Procurement Connections (4)

- [Integrate Zip with Drata Vendor Management](../articles/integrate-zip-with-drata-vendor-management.md): a Zip procurement request starts a Drata review whose decision flows back to Zip.
- [Ironclad Integration Guide (Procurement)](../articles/ironclad-integration-guide-procurement.md): signed Ironclad contracts add vendors to the registry; matching and setup.
- [Ramp Integration Guide](../articles/ramp-integration-guide.md): a Ramp purchase triggers a review, and the decision syncs back to approve or block it.
- [Tropic Integration Guide](../articles/tropic-integration-guide.md): Tropic suppliers sync into the registry on a schedule, matched to existing vendors.

### Understand the Drata Platform › Vendors › TPRM Agent (7)

- [Add a vendor or prospective vendor](../articles/add-a-vendor-or-prospective-vendor.md): the Add vendor wizard: name search with autofill, details, then an AI inherent-risk recommendation to accept or change.
- [Conducting a Security Review](../articles/conducting-a-security-review.md): a review run from the AI chat: confirm criteria, collect documents, assessment, residual risk, follow-up questionnaire, finalize and report.
- [Configuring inherent risk](../articles/configuring-inherent-risk.md): risk levels, written classification guidance (rules), previewing the result, and overriding a vendor's level.
- [Getting started with the TPRM Agent](../articles/getting-started-with-the-tprm-agent.md): the Drata AI chat panel over vendors: prompts, actions that ask approval, guardrails.
- [TPRM Agent Autonomy Settings](../articles/tprm-agent-autonomy-settings.md): how far the agent acts alone at each step and where it waits for approval.
- [TPRM Agent: Create a Criteria](../articles/tprm-agent-create-a-criteria.md): the Criteria list: inherent-risk mapping, severity, vendor type, bulk edit, generating from a questionnaire, confirming per review.
- [TPRM Agent: Trust Center Document Collection](../articles/tprm-agent-trust-center-document-collection.md): public trust-center documents taken at once, confidential ones after the vendor grants access; re-running.

### Understand the Drata Platform › Vendors › TPRM Agent Legacy (2)

- [(Legacy) TPRM Agent: Create a Criteria](../articles/legacy-tprm-agent-create-a-criteria.md): the older flow: AI settings toggle, criteria and the assessment table with its criterion drawer.
- [Conducting a Security Review (Legacy)](../articles/conducting-a-security-review-legacy.md): the older review: the agent's step panel beside the review, criteria confirmation, results, follow-up, finalize.

### Understand the Drata Platform › Vulnerabilities (1)

- [Vulnerabilities](../articles/vulnerabilities.md): scanner findings with SLA due dates by severity, notification schedules and the monitoring tests that watch them.

### Understand the Drata Platform › Webinar Recordings (5)

- [Drata Expert Series: Scaling your GRC Program Post-Audit](../articles/drata-expert-series-scaling-your-grc-program-post-audit.md): recording: keeping the programme running after the first audit.
- [Drata Pre-Audit Check Webinar Recording](../articles/drata-pre-audit-check-webinar-recording.md): recording: preparing for an audit in Drata.
- [From 0 to ISO 27001: The 5-Phase Blueprint Webinar Recording](../articles/from-0-to-iso-27001-the-5-phase-blueprint-webinar-recording.md): recording: five phases to an ISO 27001 audit.
- [SOC 2 Express Webinar Recording](../articles/soc-2-express-webinar-recording.md): recording: from setup to SOC 2 readiness.
- [The Hidden Cost of DIY Compliance Webinar Recording](../articles/the-hidden-cost-of-diy-compliance-webinar-recording.md): recording with a partner on running compliance in-house.

### Understand the Drata Platform › Webinar Recordings › Getting Started with Drata (3)

- [Drata Onboarding Webinar Recording](../articles/drata-onboarding-webinar-recording.md): recording: customer onboarding.
- [Getting Started with Drata: Controls & Monitoring - Webinar Recording](../articles/getting-started-with-drata-controls-monitoring-webinar-recording.md): recording: frameworks, control types, evidence, and the Controls and Monitoring pages.
- [Getting Started with Drata: Personnel - Webinar Recording](../articles/getting-started-with-drata-personnel-webinar-recording.md): recording: a demo of personnel compliance.

### Understand the Drata Platform › Webinar Recordings › Policy Power Hour Recordings (8)

- [Policy Power Hour Q&A: August 2024 Recap](../articles/policy-power-hour-q-a-august-2024-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Q&A: January 2025 Recap](../articles/policy-power-hour-q-a-january-2025-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Q&A: July 2024 Recap](../articles/policy-power-hour-q-a-july-2024-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Q&A: May 2024 Recap](../articles/policy-power-hour-q-a-may-2024-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Q&A: November 2024 Recap](../articles/policy-power-hour-q-a-november-2024-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Q&A: September 2024 Recap](../articles/policy-power-hour-q-a-september-2024-recap.md): video only: a live policy Q&A.
- [Policy Power Hour Recording: March 2026](../articles/policy-power-hour-recording-march-2026.md): recording: drafting and refining security policies.
- [Policy Power Hour Recording: October 2025](../articles/policy-power-hour-recording-october-2025.md): recording: drafting and refining security policies.

## 2. Product surfaces

### 2.1 Personnel register

Layout:
- Nav: Organization › Governance › Personnel (Governance also holds Policies and Access Review); the left rail's groups are Workspace (Quick start, Dashboard, Tasks, Compliance, Events), Organization (Risk, Vendors, Governance) and Connections, Library, Settings at the foot.
- Title "Personnel" with a help dot; "Create exclusion" (secondary, top right) is the only header action.
- Line tabs: "Personnel" with a red count (1284, 682, 5 in three accounts) | "Active exclusions" | "Archived exclusions". The older layout had "List" | "Exclusions".
- A filter rail on the left that collapses (two view toggles), "Clear all filters", then searchable selects: Employment status, Compliance (e.g. "Offboarding evidence missing"), Sync status ("Found in HRIS/IdP", "Not found in HRIS/IdP"), Groups (IdP groups, only with group sync), IDP Provider (checkbox per IdP). Chosen values sit as removable chips; "Filters applied:" repeats them above the table with "Clear all".
- Toolbar: "Filter", a column-settings gear, "Search personnel by name or job title", "⋯" (Bulk import › Policy acknowledgments, Background checks, Trainings; Resync Personnel), "Download ⌄" (Compliance Overview, Policy Acknowledgement, both CSV).
- Columns: checkbox, row "⋯", Name (avatar initials, name over email), Compliance status ("Compliant" with a check, "Not compliant" in a red pill, "—" for a future hire), Personnel status (an inline dropdown in each row), IDP provider, then one column per check when chosen (Offboarding evidence, Accepted Policies, Identity MFA, BG Check, Security Training, HIPAA Training, device checks), each a green check, red cross or grey dash. Hovering a dash says "Unable to get data", the last check time and the last known result.
- Personnel status words: "Current employee", "Former employee", "Current contractor", "Former contractor", "Out of scope (ignore)", "Out of scope (service account)", plus system-set "Future hire", "Unknown" and the manually added former statuses, which cannot be changed. Choosing Out of scope asks for a business rationale.
- Selection bar, floating at the foot: "1297 Selected", "Deselect all", "Send reminder email", "Change employment status", "Create Exclusion", "More" (Upload Evidence, Re-enable IdP/HRIS Sync, Reset Security Training, Reset HIPAA Training, Reset AI Awareness Training; the HIPAA and AI resets only with those frameworks).
- Pager: "50 per page".
- A manual status change pauses that person's IdP/HRIS sync; the Sync status column and filter show it.

Flow edges:
- → a row → the person record (2.2), as a full page; one screenshot shows it as a panel over the register.
- → Personnel status dropdown → new status (Out of scope asks a reason) → sync paused.
- → select → Send reminder email → an email pointing to My Drata (never to yourself).
- → select → Create Exclusion → the drawer (2.4), with the people prefilled.
- → ⋯ › Bulk import → the guided importer (2.5).
- → Compliance filter "Offboarding evidence missing" + Employment status "Former employee" → the offboarding queue → a person → 2.3.

Images: `../../images/ux/personnel/personnel-overview--01.png`, `../../images/ux/personnel/personnel-offboarding-evidence--01.png`, `../../images/ux/personnel/drata-agent-not-reporting-system-updates--01.png`.

### 2.2 Person record

Layout:
- Breadcrumb "Personnel /"; avatar and name as the title.
- Header right: "⋯" (Re-enable IdP/HR Sync and similar), the employment status as an outlined dropdown button ("Current employee ⌄", "Former employee"), and "Send reminder email" (primary) when items are open.
- A facts line under the title: Compliance status ("Not compliant" pill), Hire date, Separation date ("_" when none), IDP source (logo and tenant name), Sync status ("Not Syncing" with an icon).
- Tabs: Overview | Devices (with a red count when a device fails).
- Overview: card "Details" (Edit; Email, Hire date, Job Title, Separation date, custom fields such as "Values", "—" when empty); card "Devices" ("Device compliance 1/1 not compliant", or the empty state "No devices found" with a tag illustration and one line); card "Responsibilities" (Control owner 1, Policy owner 2, each a count with a chevron; the article adds Vendor, Evidence and Risk), shown for former staff too so work can be handed on.
- Requirements table below: Requirement, Status, Completed on, Last checked, a chevron per row, a "⋯" per row (Upload evidence, Create exclusion).
- Requirement rows: Acknowledged policies, Multi-factor authentication (MFA) on IdP, Background check, Security training, HIPAA training, AI awareness training, Offboarding evidence (former staff), plus device checks.
- Background check upload opens "Add background check": Background check URL, Completion Date, Save (a link to the file, never the file).
- Editing the start date into the future turns the person into "Future Hire", out of every check until the date passes.

Flow edges:
- → a requirement row → its drawer (2.3), stepping "6 of 6" through the person's requirements.
- → row ⋯ → Upload evidence → modal; → Create exclusion → 2.4.
- → Responsibilities › Control owner → the controls they own, to reassign.
- → Send reminder email → email.

Images: `../../images/ux/personnel/manually-map-proof-of-a-background-check--01.png`, `../../images/ux/personnel/personnel-overview--03.png`.

### 2.3 Offboarding evidence drawer

Layout:
- A right drawer over the person record; head: "6 of 6", "Previous ↑", "Next ↓", "Close ✕".
- Status pill on top ("Not compliant"), then the requirement's name as the drawer title.
- Facts: Last checked ("Jan 30, 2026 at 5:59am"), Completed on ("—").
- Section "Evidence": empty card "No evidence attached" with one line and "Upload evidence ⌄" (Upload File, Upload Ticket, the second a Jira URL).
- Section "Tickets".
- Footer: "Create exclusion" (secondary).
- Only people with a former status can take offboarding evidence; Jira tickets count only when resolved (by resolution date) or labelled `DrataAccept`.
- Settings › Personnel Compliance › Human Resources can automate it: a JQL search, matching by full name or email, five sample matches to check before Finish.

Flow edges:
- → Previous/Next → the person's other requirements in the same drawer.
- → Upload evidence → file or ticket → the row turns compliant on the next check.
- → Create exclusion → 2.4 for this check.

Images: `../../images/ux/personnel/personnel-offboarding-evidence--02.png`.

### 2.4 Personnel exclusions

Layout:
- Drawer "Create Personnel Exclusion" (✕), two sections.
  - "Applicable personnel": Personnel grouping ("Custom Personnel", "Status or group", "All personnel – all time"); Personnel selector (search, chosen people as chips).
  - "Settings": Compliance checks (search, chips such as "Identity MFA"; choices Acknowledged Policies, Antivirus, Auto Updates, Background Check, Disk Encrypted, HIPAA Training, Identity MFA, Lock Screen, AI Awareness Training, Offboarding Evidence, Password Manager, Security Training); Duration ("Indefinite" or "Custom" with a "Custom exclusion date range." of two date fields); a business rationale; a confirmation checkbox; Save.
- A status or group exclusion becomes one exclusion a person and follows people in and out of the group.
- "Active exclusions" tab: filter rail ("All Compliance checks"), Filters, gear, search; columns Applicable personnel, Compliance checks (a grey chip, "Background Check"), Duration ("Indefinite"), Excluded by, Date excluded, Reason; row ⋯; Actions › Archive in bulk.
- Archiving cannot be undone; a custom range archives itself at its end; "Archived exclusions" is its own tab.
- On the test that owns the check (Monitoring › "Test 86" chip, "MFA on Identity Provider"): tabs Overview | Findings | Exclusions | Controls | History; the Exclusions tab opens with a blue info banner "Personnel exclusions are view-only on this page" and a link back to Personnel Exclusions; its list shows who and for how long.
- The rationale travels into audit downloads when the person is sampled.

Flow edges:
- → Personnel "Create exclusion", or select → Create Exclusion, or a requirement drawer's Create exclusion → the drawer.
- → Save → applied on the next sync → the person stays in scope, the check stops counting.
- → Active exclusions → a row → a modal to edit checks, duration or reason; → Archive.
- → a test's Exclusions tab → link → Personnel Exclusions.

Images: `../../images/ux/personnel/personnel-exclusions--02.png`, `../../images/ux/personnel/personnel-exclusions--03.png`, `../../images/ux/monitoring/personnel-exclusions--04.png`.

### 2.5 Guided bulk import (the spreadsheet importer)

One embedded importer (Flatfile; its error file is named `flatfile-errors.xlsx`) serves policy acknowledgments, background checks, trainings, assets, vendors and risks. It fills the window over the page.

Layout:
- Left rail: the Drata mark; the import's name ("Import or Update Assets", "Import or Update Policy Acknowledgments"); "Additional Supporting Documents (Optional)"; HELP › "Quick guide"; START HERE › the sheet ("Asset list", "Policy Acknowledgment list") with a red dot and its row count (20, 2).
- First view: an empty sheet with "Upload file" and "Manually enter data".
- Map fields (after an upload): header "Map fields" with Exit, Back, Continue (primary); "Review and confirm each mapping choice"; two columns, INCOMING FIELDS (the file's headers as code chips, "3 of 3") → DESTINATION FIELDS (selects, required ones starred: "User Email *", "Policy Name *", "Acknowledgment Date *"; for assets Asset Name, Asset Type, Asset Class Types, Description, Unique ID, Owner Email, Notes), each with ✕ and a chevron; a reset icon; a right pane "Data preview for <field>" listing sample values.
- Map field values: each incoming value of a dropdown field (Asset Type, Asset Class Types, Owner Email) to a workspace value; optional.
- The sheet: tab with the sheet's name; toolbar Filter, search, "Actions"; right side "20 Records" and segment "All | Valid 18 | Invalid 2"; header buttons "Download validation results" and "Submit" (disabled while any red cell remains).
- Cells: dropdown cells as grey chips (Physical, Virtual; Database, Software, Hardware, Storage, Networking, Container, Document, Code, Compute); red-tinted cells are errors with a message under them ("Acknowledgment Date must be on or after 1900-01-01.", "Cannot overwrite integration-managed asset."); yellow-outlined cells are warnings ("Asset already exists. Record will be updated.").
- Files view: tabs "Uploaded files" | "Available downloads"; columns Name (an "xlsx" chip), Source sheet, Generated, Size; Delete, Download; row ⋮ (Delete, Download, Import).
- Confirm dialog: "Import assets?"; a list of what will happen ("19 new assets will be created", "1 existing asset will be updated", "No notifications will be sent to the user."); Cancel, "Import assets" (primary). The policy version says how many acknowledgments it will create or overwrite.
- Rules seen: a name matching an integration-managed record is blocked; a matching manual record updates; an owner must be active personnel ("Owner user not found.", "Owner inactive.").

Flow edges:
- → Assets "Create asset ⌄" › "Create/update assets in bulk"; Personnel ⋯ › Bulk import › Policy acknowledgments | Background checks | Trainings › Security, HIPAA…; Policies "Import policy acknowledgments"; Vendors' add or update in bulk; Risk's import → the importer.
- → Upload → Map fields → Map values → sheet → fix red cells (filter Invalid) → Submit → confirm → records written, the page refreshes.
- → Download validation results → an error workbook under Available downloads.

Images: `../../images/ux/assets/bulk-import-assets--01.png`, `../../images/ux/personnel/bulk-import-policy-acknowledgments--04.png`, `../../images/ux/personnel/bulk-import-policy-acknowledgments--07.png`, `../../images/ux/assets/bulk-import-assets--08.png`, `../../images/ux/personnel/bulk-import-policy-acknowledgments--12.png`, `../../images/ux/assets/bulk-import-assets--12.png`.

### 2.6 Background check management

Layout:
- Breadcrumb "Connections / Background Check Accounts"; title "Manage Connected Background Check Accounts".
- An amber banner with a warning icon: "Some personnel are missing linked background checks", and a line on sorting the Personnel column to find them.
- One plain line on what the list holds and that matches link automatically.
- Toolbar: "All Status" select, "Reset Filters", "Search by email…".
- Columns: Linked (a link icon, or a no-entry icon when unlinked), Status (green check valid, clock pending), Type (provider logo and name: Checkr, Karmacheck, Certn, or manually uploaded), Candidate (the check's email), Personnel (the linked person, or a "Select Personnel" dropdown), Created At, Updated At ("2 years ago"), Manual Upload Date, Manual Upload URL ("N/A"), then a row icon (unlink, which can lead to marking out of scope; a gear for an unlinked row).
- Matching runs nightly: personal email, then work email, then full name; some HRIS connections share no personal email.

Flow edges:
- → Select Personnel → the check links → that person's Background check requirement turns compliant.
- → unlink → the person is unlinked; mark out of scope if they should not count.

Images: `../../images/ux/personnel/background-check-management--01.png`.

### 2.7 Settings › Personnel compliance

Layout:
- Settings has its own second rail: Personal (Language, Notifications); Organization (Account access, Language, Organization details, Notification rules, Personnel compliance, Plan and usage, Role administration, Workspaces); Configuration (AI settings, API keys, MCP Configuration, Compliance as Code, Fields and formulas, Ticket automation, Workflows).
- "Personnel Compliance" with tabs: Internal Security | Training | Human Resources.
- Training: one card per training ("Security awareness training", "HIPAA Training", AI awareness). Each asks the method as radios: use Drata's embedded training; train elsewhere and personnel upload their own evidence in My Drata; train elsewhere and an admin uploads each person's evidence in Personnel (which removes the step from My Drata). HIPAA adds turning the requirement off.
- A toggle "Schedule recurring training resets" with radios "Reset 12 months after each personnel's last completion date" and "Reset on the same date each year for all personnel". Turning it on can reset overdue people at once; old completions stay in the history.
- Internal Security: card "Workstation Configuration Monitoring", three toggles: "Automated via MDM (MDM disconnected). Connect to MDM", "Automated via Drata Agent.", "Manually via personnel uploading evidence".
- Human Resources: "Automate offboarding evidence collection" with Configure (Jira JQL, match by name or email, five sample matches).

Flow edges:
- → Settings › Personnel compliance › Training → method and reset rule → My Drata shows or hides the step; Personnel ⋯ offers the matching reset verbs.
- → Internal Security → toggle manual upload → each My Drata device check gains "Upload Evidence".

Images: `../../images/ux/settings/reset-recurring-personnel-trainings--01.png`, `../../images/ux/settings/manual-evidence-uploads-for-personnel-compliance-checks--03.png`.

### 2.8 My Drata (the employee's hub) and the Drata Agent

Layout:
- Reached from the avatar menu: name, "My Drata", "Appearance › Light", "Sign out". A workspace picker sits top left.
- Title "Hi Jane! Welcome to the Drata Compliance Hub." and a two-line paragraph on why the steps matter.
- A stack of expandable task cards, each a progress glyph (dashed circle not started, half-filled in progress), a title and one line: "Policy Review" ("This is done annually here in Drata"), "Enable MFA on identity provider" (checked daily), "Install and setup the Drata Agent on your devices" ("The Drata Agent reports daily"), plus background check, security awareness training, HIPAA and AI training where set.
- The agent card opens into two halves: "Devices are registered with Drata:" ("No devices are registered with the Drata Agent") and "Add a device": numbered steps "1 Download and install the Drata Agent" ("Download Drata Agent ⌄", by OS) and "2 Register the Drata Agent" (button); registration is confirmed by email.
- Policy Review lists policies with "Not Accepted" and "View"; the reading dialog has the policy name and "Updated May 28, 2026", a progress bar "19 of 213 acknowledged", an embedded PDF viewer (thumbnails, page 1 / 8, zoom, download, print), and a footer Cancel | "← Previous", "Next →", "Acknowledge" (primary).
- "Configure your computer" (the older layout says the agent reports every 6 hours) lists one row a check: "Install the Company's Approved Password Manager", "Hard-Disk Encrypted", "Automatic Updates Enabled", "Install Anti-Virus/Malware Software", "Screen Saver Lock", each with an empty circle, two lines and a how-to link, "Last Checked: Feb 24, 2021 @ 9:35:02 AM", and "Upload Evidence" when manual upload is on. A met check turns green with a date and "View Evidence"; Linux users meet disk encryption only by upload ("Add Evidence Showing Your Hard-Disk is Encrypted").
- The agent's own window (menu-bar app): a dark header with the logo and "AGENT"; card "Configure your computer" with a split pill "4 | 5" and "Tasks completed"; collapsible cards "Incomplete" (red !) and "Completed" (green check); footer "Sync now" and "Last synced: Feb 24, 2025 @ 11:44:32 AM". It reads settings only, syncs on the first connection after power-on and 24 hours after the last sync; Option-click › "Save Diagnostics" for support.

Flow edges:
- → a reminder email or first sign-in → My Drata → each card → done; the person's Compliance status in Personnel follows.
- → Install card → download → register → email verification → the device appears on the person's Devices tab and the Assets inventory.
- → Policy Review → View → read → Acknowledge → Next → … → the Acknowledged policies requirement passes.
- → agent "Sync now" → fresh results; a stale one shows "Unable to get data" in Personnel.

Images: `../../images/ux/personnel/install-the-drata-agent--01.png`, `../../images/ux/personnel/review-and-acknowledge-company-policies--02.png`, `../../images/ux/personnel/manual-evidence-uploads-for-personnel-compliance-checks--01.jpg`, `../../images/ux/devices/how-does-the-drata-agent-work--02.png`.

### 2.9 Access Reviews

Layout:
- Governance › Access Review; title "Access Reviews"; tabs Applications | Active review | Completed reviews. An add-on on the lower plans.
- Applications: the latest synced accounts per application (refreshed nightly); "Add application" (Website URL for the logo, Reviewer, Save); a manually added application takes "Upload personnel" (a CSV template).
- "Create review period": start and end dates, the applications in it, a reviewer each (Access Reviewer or Admin role). One period active at a time; access is read as of the day of review, not frozen at the period's start.
- Active review › an application: its reviewer, a Personnel tab of accounts with Filters (Permissions › Admin), a Status column with "Link Personnel" for unlinked accounts, select-all across pages, and a bulk bar "Change status" → Status "Approved", "Rejected" (a required "Reason for rejection", up to 191 characters, saved to internal notes) or "Out of scope". Then "Complete review", optional evidence, Submit.
- Warnings on accounts: "Former personnel with access", "Missing MFA", "Unlinked users", "Service accounts" (information only), "Admin".
- Completed reviews: one collapsible card a period, "Review period: February 10, 2026 - May 14, 2026" with a check; inside, a table Application (logo and name), Review status ("Completed" pill), Warnings ("—"), Type ("Direct connection"), a chevron; row "⋯" › "Download evidence". "Re-open review" when no other period is active.
- Application review page: breadcrumb "Access Review /"; logo and name; "Download evidence" (a link-style button, top right); facts Status ("Completed"), Review period ("Aug 26, 2025 to Apr 3, 2026"), Type, Completed by; a blue info banner saying changes can be requested and reviewers will be notified; cards "Reviewers" (names) and "Linked evidence" (each file with "Created on …", "Approved on …" and a download icon).
- A right rail with a comment icon opens "Internal notes" (author, time, text such as an access confirmation); the rail collapses with "»".
- On completion every application's evidence is zipped (a folder each) and attached to "DCF-11: Annual Access Control Review" as evidence renewing in a year; only the primary workspace gets it.

Flow edges:
- → Create review period → Active review → an application → mark accounts → Complete review → Submit.
- → completing the period → a ZIP on control DCF-11 and in Evidence.
- → Completed reviews → row ⋯ › Download evidence, or → the application page → Download evidence or one file.
- → a warning "Unlinked users" → Link Personnel → the account maps to a person.

Images: `../../images/ux/access-review/download-access-review-evidence-and-review-details--01.png`, `../../images/ux/access-review/download-access-review-evidence-and-review-details--02.png`, `../../images/ux/access-review/download-access-review-evidence-and-review-details--03.png`.

### 2.10 Assets inventory

Layout:
- Top bar of the new shell: the DRATA wordmark, collapse and density toggles, a workspace picker ("Drata"), "Preview" (a megaphone, the new-experience switch), search, the avatar.
- Nav: Organization › Risk opens to Risk Insights, Assets, All Risks, Registers, Vulnerabilities, Settings, Vulnerabilities Settings; then Vendors.
- Title "Assets"; primary "Create asset ⌄" (Create a single asset; "Create/update assets in bulk — Import assets from csv").
- Filter rail: "Clear all filters", Class (select), Type (radios All types, Virtual, Physical), Source (select: Drata, AWS, Azure, GCP, MDMs and others), Owner (search), Owner status.
- Toolbar: Filters, gear, "Search by name or ID"; a download for the audit list.
- Columns: Name ↓, Class (Code, Personnel…), Type (Physical, Virtual), Account name; more by the gear.
- A row opens a drawer with the asset's Owner and "Asset Notes" for auditors.
- Class values: Hardware, Document, Personnel, Software, Code, Container, Compute, Networking, Database, Storage; Type values: Physical, Virtual.
- Cloud connections fill it: AWS and GCP resources daily, twelve Azure services; a GCP asset with several owners takes the first active one, else the first admin. Devices arrive from the agent or MDM and link to a person; an unlinked or removed device leaves both Assets and the person's Devices tab and stops counting.

Flow edges:
- → Create asset › single → a form → Save; › bulk → the importer (2.5).
- → a device row → drawer → Owner → fix a missing link.
- → a cloud asset → mark out of scope.

Images: `../../images/ux/assets/bulk-import-assets--01.png` (also in 2.5).

### 2.11 Risk register (Register tab)

Layout:
- Risk › Registers › a register (or "Risk Management" with one register). Breadcrumb "All registers /"; title the register's name; facts Related workspaces (a chip, "Drata"), Register owner, Description ("—" when empty).
- Header right: "Configure register" (a gear link) and "Create risk ⌄" (primary: create a single risk; create/update risks in bulk).
- Tabs: Register | Library.
- Two cards. "Assessment progress": a gauge with "6% scored" (0% on a new register, red when low). "Risk posture for active risks": selects "All ⌄" (internal, external) and "Residual ⌄" (or Inherent); a legend Low, Medium, High, Critical; one stacked bar of four blocks with the count under each (5, 3, 3, 5). A block filters the table. An empty register shows "No risk data available" and one line.
- Toolbar: Filter, gear, Search, "Download ⌄" (Risk Assessment Report, Risk Treatment CSV, All Risks CSV, Filtered View CSV). "Filters applied:" chips ("Active", "Scored") and "Clear all".
- Filters: Risk status (Active, Closed, Archived), Assessment (unscored), Treatment, Risks ("Needs attention" when a mapped control is not ready, Custom, Internal, External), Risk Owners (assigned or not), Owners, Categories.
- Columns: Risk ID (a grey code chip), Name, Description, Controls (a count bubble, or a sliders icon over "No controls"; mapped codes coloured green ready, red not ready, grey out of scope), Treatment (an inline select: "Untreated", "Accept", "Transfer", "Avoid", "Mitigate"), Inherent impact and Inherent likelihood (inline selects 1–5), Inherent score (a filled square with the number and the band word: red "9 Critical"), Residual impact, Residual likelihood, Residual score (green "4 Low"), Owner (avatars), Type, Status, Categories, Anticipated Completion Date, Completed Date, Reviewers.
- Bands by default: Low 1–4 (green), Medium 5–9 (yellow), High 10–19 (light orange), Critical 20–25 (orange); the Pro plan renames them and changes the scale. The screenshot nonetheless labels a 9 "Critical", so the thresholds there were customised.
- Selection bar: "1 Selected", "Add risk owners", "Assign risk category", "Move registers", "Update status", "Delete". Row ⋯: Move registers, Delete (delete is permanent; Archived or Closed is the reversible choice).
- Pager: "50 per page", "1-12 of 12" with first/prev/next/last.
- An empty register in the Standard plan offers "Help me build my register" (a seven-question survey on AI, physical sites, cloud, regulation, in-house software, devices in public, shipping devices, which seeds risks from the library) and "Teach me about Risk Management".

Flow edges:
- → a row → the risk record (2.13).
- → an inline select → score or treatment saved in place; the posture bar and gauge move.
- → a posture block → the table filtered to that band.
- → Create risk › single → the wizard (2.14); › bulk → the importer (2.5), where a known Risk ID shows yellow and updates.
- → select → Move registers → a modal "Target register" → Move risks; conflicting Risk IDs stay behind and download as CSV ("Duplicate risk found").
- → Download › Risk Assessment Report → fill the placeholders → upload it as evidence.

Images: `../../images/ux/risk/risk-management-in-drata-an-overview--01.png`, `../../images/ux/risk/risk-management-in-drata-an-overview--02.png`, `../../images/ux/risk/manage-multiple-risk-registers-new-experience--06.png`.

### 2.12 Risk library

Layout:
- The register's Library tab (the same header, "Create risk ⌄").
- Filter rail: Categories (search), Usage (radios "In use", "Not in use", "Clear").
- Toolbar: Filter, gear, "Search by name, description or risk id"; chip "Not in use".
- Columns: Name (theme – threat, e.g. "Critical System Dependencies - DoS"), In register ("—" when not), Description (two to five lines), Controls (a count bubble: 24, 34, 6, 11, 17), Categories ("Assessments & Audits"), a chevron.
- "1-50 of 210" risks; the article puts it at 200+ from NIST SP 800-30, ISO 27005 and OCR SRA. Library risks are read-only until copied; each copies into a register once.
- Selection bar: "50 Selected", "Add to register". Row ⋯: Add to register.

Flow edges:
- → select → Add to register → the risks appear in Register, with their control mappings, editable there.
- → a row chevron → the template's detail.

Images: `../../images/ux/risk/drata-s-risk-library-new-experience--01.png`.

### 2.13 Risk record

Layout:
- Breadcrumb "All registers / Default Risk Register /"; a code chip ("AC-04") and the title ("Password Management - Password Cracking"); "⋯" at the right.
- Facts line: Treatment ("Accepted"), Inherent score ("9 Critical" with a red square), Residual score ("—" in a grey box), Owner.
- Tabs: Overview | Mitigating controls.
- Overview cards, each with its own Edit: "Assessment" (Inherent impact 3, Inherent likelihood 3, Inherent score "9 Critical", "What does this score mean? ⓘ"); "Source and status" (Risk source "Internal risk", Status "Archived"); further cards per the article: "Current Treatment" (treatment; Mitigate or Transfer add Treatment Details, Anticipated Completion Date, Completed Date, Reviewer, Residual impact, Residual likelihood, Residual score; Accept or Avoid keep the inherent score as residual), "Detail" (Title, Description, Categories, Supporting Documents up to 10 files), "Owner"; custom fields and formula results sit in the section chosen for them.
- Mitigating controls: gear; "Map controls" (secondary); columns Control code (a chip with icon: green "DCF-233" ready, red "DCF-338" not ready), Name, Description, a chevron; row ⋯ and checkboxes to unmap.
- A right rail of three icons (notes, tickets, tasks/flag) and "»" to collapse. "Internal notes": a line that owners and reviewers get an email and that notes stay away from auditors; a "Note" box with "0/191"; Save; then the thread (author, "Sep 22, 2025 at 7:07pm", text).

Flow edges:
- → Edit on a card → inline form → save → the facts line updates.
- → Treatment Mitigate/Transfer → residual fields appear → residual score.
- → Map controls → pick controls from the register's workspaces → rows; a red control flags the risk under "Needs attention".
- → a control row → the control.
- → rail → note, ticket or task on this risk.

Images: `../../images/ux/risk/assess-and-manage-individual-risks--01.png`, `../../images/ux/risk/assess-and-manage-individual-risks--02.png`.

### 2.14 Create risk wizard, risk settings and custom formulas

Layout:
- "Create risk" is a full page: "← Back to register", the title, a vertical stepper (1 "Source and Status" ✓, 2 "Details", 3 "Assessment & Treatment", 4 "Controls").
- Details step, "Add your risk details": Title; Description ("Supports Markdown formatting. Learn more", a counter "0/30000"); "Risk identified date (optional)"; "Categories (optional)" (search, with "Create category" beside it); "Owners (optional)"; "Documents (optional)" as a dashed drop zone.
- Risk › Settings › Categories tab: "Create category", search, delete per row (Pro, Admin or Risk Manager). Stock categories include Access Control, Asset Management, Software Development, Privacy – Data Protection.
- Pro also sets the scale (e.g. 3×3 instead of 5×5) and the band names and thresholds; shrinking the scale clears scores that no longer fit.
- Custom formulas (Enterprise): Settings › Fields and formulas › Formulas › "Create formula", a wizard (Details, Placement with a Section dropdown, the expression of up to 35 terms over number, currency and numeric-dropdown fields, validated live); up to 50 a account; one formula may use another once, no deeper. The result shows in the risk's chosen section with the formula under the name and each term's value on hover.

Flow edges:
- → Create risk › single → steps 1–4 → the risk record.
- → Create category inside step 2 → the category exists and is applied.
- → Settings › Fields and formulas → a formula → appears on every risk.

Images: `../../images/ux/risk/risk-categories-in-drata--02.png`.

### 2.15 Multiple risk registers and workspaces

Layout:
- Risk › Registers: title "All registers"; Filter, gear, Search, "Create register" (primary).
- Columns: Register name, Owner, Assessment progress (a thin bar and a percentage: 0%, 24%; brown fill), Accepted, Mitigated ("—" when none), and Related Workspaces in a workspace-scoped view; row ⋯ › Configure register.
- "Create register" page: "← Back to register"; Title; "Description (optional)" ("A description of this register"); "Register owner (optional)" (search users; only holders of the Risk Register Owner role); checkbox "Associate controls to risks in this register." ("You can configure this anytime from the Register's settings."); "Related workspaces" ("Controls from these workspaces can be mapped to the risks in this register."); Cancel, "Save register".
- "Configure register" is the same form plus "Delete register" (only once the register is empty) and "Remove all workspaces".
- Up to 100 registers (Pro). A register links to zero, one or many workspaces; workspace managers get the registers of their workspace.

Flow edges:
- → Create register → Save register → its Register tab, empty.
- → a register row → the register (2.11).
- → row ⋯ › Configure register → edit owners and workspaces, or delete when empty.
- → Risk insights › Filters › Risk registers → one register's charts or all.

Images: `../../images/ux/risk/manage-risk-across-workspaces--02.png`, `../../images/ux/risk/manage-multiple-risk-registers-new-experience--06.png` (also in 2.11).

### 2.16 Risk insights

Layout:
- Risk › Risk Insights (Pro). Title "Risk Insights"; "Download insights" (secondary, a PDF of the whole dashboard with current filters).
- "Filters" opens a panel: Category, Owner, Risk registers, Type.
- Card "Assessment progress": gauge "7% Scored"; a download icon in the corner (every chart has one).
- Card "Treatment overview ⓘ": five tiles, "Needs treatment" with an amber warning glyph (26), Accepted 8, Avoided 1, Mitigate 4, Transferred 6. A tile opens All risks filtered to it.
- Section "Risk Scores" with a segment "Inherent | Residual" and the note that inherent shows where no residual exists.
  - "Posture ⓘ": legend Low, Medium, High; one stacked bar (20, 15, 5), here in teal, pale blue and red rather than the register's traffic-light colours.
  - "Risks over time": a line chart of the posture from 2024-01-03 on.
  - "Risk heatmap": likelihood by impact, a cell opening the matching risks.
  - "Category breakdown": categories by severity, each name and block opening All risks filtered.

Flow edges:
- → any tile, block or cell → Risk › All risks, filtered.
- → a chart's download → PNG; → Download insights → PDF.

Images: `../../images/ux/risk/risk-insights-overview--01.png`.

### 2.17 Current vendors register and its bulk actions

Layout:
- Nav: Organization › Vendors opens to Insights (or "Vendor insights"), Current, Prospective, Risks, Questionnaires, Criteria, Settings. A sparkle icon in the right rail opens Drata AI (2.24).
- Title "Current Vendors" with a help dot; "Add vendor ⌄" (primary: Add single vendor; Add/update in bulk).
- An action banner when the agent needs something: blue info, "Access details needed for upcoming security review", one line counting vendors, "Review vendors" (secondary). A row also carries an "Action Required" mark.
- Filter rail: Type, Status (Archived among them), Impact level or Inherent risk, Overall risk or Residual risk, Security review status, Next review deadline, Action required ("Yes"), Vendor tiering, Business unit, Security owner, custom fields (a currency range with a slider).
- Toolbar: Filter, gear, Search, "Download ⌄"; "Filters applied:" chips ("Up to date", "Yes"), "Clear all".
- Columns: checkbox, a review-status icon, Vendor (logo initials and name; a badge when a trust center is linked), Business unit, Security review status (a grey pill: "Up to date", "In progress"), Next review deadline (calendar icon and date; red "Overdue" with a diamond above the date), Last review date, Risks associated (a count bubble), Overall risk ("None", "Moderate", "High").
- Review status words: "Up to date", "Needs review", "In progress", "Completed", "No past reviews". Deadline words: "Due soon" (within 7 days), "Overdue", "Deadline not set".
- Selection bar at the foot: "50 Selected", "Select all 1379", "Add owners", "Update deadline" (Review deadline and Review schedule: 1 month, 2 months, 3 months, 6 months, 1 year, Custom, None), "Update residual risk" (None, Low, Moderate, High), "Update vendor type" (Vendor, Contractor, Partner, Other, Software), "Send questionnaire" (a page: recipients split into "Vendors with email address" and "Vendors without email address", each Include or Exclude; Security review name; Questionnaire(s) to send; Subject line; Email content), "Archive" (restorable from the vendor's ⋯).
- Pager "50 per page", "1-1 of 1".

Flow edges:
- → a row → the vendor profile (2.20).
- → Add vendor › single → the wizard (2.19); › bulk → the importer (2.5), seeded by downloading your own directory as `…-vendor-bulk-update-template.csv`.
- → banner "Review vendors" or a row's Action Required → the vendor's Trust Center tab → grant access → the recurring review continues.
- → select → Send questionnaire → one security review per vendor, emails out.

Images: `../../images/ux/vendors/start-and-manage-security-reviews-for-your-vendors--01.png`, `../../images/ux/vendors/automate-recurring-vendor-reviews-with-the-tprm-agent--02.png`, `../../images/ux/vendors/bulk-actions-for-current-vendors-new-experience--02.png`.

### 2.18 Prospective vendors

Layout:
- Vendors › Prospective vendors; title "Prospective Vendors"; "Add vendor" (primary).
- Filter rail: Impact levels ("All impact levels"), Security review status ("All statuses"), Data Storage Type, vendor data classification, Custom Field Currency (a 0–0 range with a slider).
- Toolbar: Filter, gear, Search, Download.
- Columns: row ⋯, Vendor, Business unit, Security review status, Review deadline, Request date, Impact level, Trust Center, custom value columns.
- A prospective vendor carries a request layer: Requester, Request date, Review deadline, Internal security owner (Admin, Information Security Lead or Workspace Manager).
- Adding one opens its security review at once; decisions are "Pending", "Approved", "Approved with conditions", "Rejected".

Flow edges:
- → Add vendor → the prospective wizard (three steps) → its security review (2.21).
- → review done → "Mark as active" → the vendor moves to Current with its history.

Images: `../../images/ux/vendors/add-a-prospective-vendor--01.png`.

### 2.19 Add vendor wizard

Layout:
- Full page: "← Back to current"; title "Add vendor"; a vertical stepper "Vendor details", "Internal details", "Risk details", "Inherent risk assessment" (checks fill as steps finish). The prospective flow has three steps: vendor information, request details, risk details.
- Vendor details: Vendor name (searches Drata's vendor catalog; picking one fills and locks the website and Trust Center URL; a listed vendor already in the account shows a tooltip "This vendor already exists in your account" and cannot be picked), Website URL, Provided services (Markdown), Password policy, Trust Center URL, Privacy policy URL, Terms of use URL, Vendor contact name, Vendor contact email addresses (up to 5).
- Internal details: Vendor status, Type, Business unit, Residual risk, Stored data, checkboxes "This vendor stores personally identifiable information (PII)" and "This vendor is our sub-processor", Integrations, Security owner, Vendor relationship contact, Annual contract value, Additional notes.
- Risk details: "Data accessed or processed" (multi-select: General, Public, Controlled Unclassified (CUI), Financial, Proprietary, Employee/Personnel, Cardholder Data (CHD), Personally Identifiable (PII), and more), "Operational impact" (None, Low, Normal, Important, Critical), "Access to environments" (No access, Read only, Read/write).
- Inherent risk assessment: "Generating AI analysis…" with a progress state, then a sentence asking to review and confirm the vendor's level; a card "Recommended inherent risk" with a select ("Insignificant") over a five-colour scale with a marker (teal to red); a card "Analysis summary" with a gradient AI border and sparkle icon, giving the rules applied and how many criteria a review would assess; "Complete".

Flow edges:
- → Current › Add vendor › Add single vendor → four steps → Complete → the vendor under Current with that inherent risk.
- → the recommendation comes from Vendor settings › Inherent risk classification (2.25), or Drata's defaults.

Images: `../../images/ux/vendors/add-a-vendor-or-prospective-vendor--03.png`.

### 2.20 Vendor profile

Layout:
- Breadcrumb "Vendors /" or "Current vendors /"; a logo tile (or a letter) and the vendor's name; "⋯" (Restore vendor when archived, Archive); "Manage recurring reviews" (secondary).
- Facts line of grey pills: Business unit ("None"), Inherent risk ("Critical", "Minor"; older label "Impact level"), Residual risk ("Moderate" in amber, "Unscored"; older label "Overall risk"), Risks associated ("0"), Security review window ("-").
- An agent banner with a gradient border, sparkle avatar and ✕: "TPRM Agent" (older "VRM Agent") with one line offering to review, and a link "Start review" or "Open review" when one is in progress.
- Tabs: Overview | Risks | Security reviews | Reports and documents | Trust Center (with the trust-center logo when one is linked).
- Overview cards, each with Edit: "Inherent risk level" (an Inherent risk select, Save, Cancel and "Evaluate inherent risk" with a sparkle, which re-runs the classification); "Vendor details" (Vendor name, Website URL, Provided services, Password policy, Trust Center URL, Privacy policy URL, Terms of use URL); "Internal details" (Vendor status/Status, Type, Business unit, Overall risk, Vendor is a subprocessor, Stored data, Stores PII); "Impact assessment" (Data accessed or processed "General", Operational impact "None", Access to environments "No access", Recommended impact level "Minor").
- Security reviews tab: gear; "Create review ⌄" (primary: Security review, SOC report review, Upload review report); columns Security review (a title, "April 18, 2026 security review" by default), Review type ("Manual security assessment"), Status ("In progress" pill), Created date ↓, Completion date, then Updated and Reviewer in the newer table; row ⋯ Rename, Delete (red); pager "1-1 of 1". "Add SOC Report" asks a review title, file source and "Select report".
- Risks tab: empty state with "Add risk"; added risks also appear in the risk register as external risks.

Flow edges:
- → banner Start review, or Create review › Security review → the review page (2.21); the AI panel can start it too (2.24).
- → Manage recurring reviews → a dialog: frequency, scheduled questionnaires, start date and deadline.
- → Evaluate inherent risk → a new recommendation to accept or override.
- → Risks › Add risk → a vendor risk (2.27).
- → Trust Center tab → documents and access status.

Images: `../../images/ux/vendors/customizing-security-review-titles--02.png`, `../../images/ux/vendors/configuring-inherent-risk--08.png`, `../../images/ux/vendors/vendor-automated-impact-assessment--01.png`.

### 2.21 Security review (new experience)

Layout:
- Breadcrumb "Vendors / <vendor> / Security reviews /"; title named by date ("September 8, 2026 security review"; renameable from ⋯ or the table); "⋯" (Rename, Delete review); "Finalize review" (primary) while open, "Re-open review" (secondary) once done.
- Facts as grey pills: Review status ("In progress", "Completed"), Inherent risk ("Moderate", "Unscored", with a pencil to change it; older label "Impact level"), Residual risk ("Insignificant"), Reviewer (avatar and name).
- With the agent the review has tabs Assessment | Reports and documents (2.22 shows the assessment). Without it, two cards:
  - "Reports and Documents" with "Add" (Upload Files); empty state "No reports or documents here yet" with a document-plus illustration and one line. A file row: name, "Ready for review", "View", download, delete (red bin).
  - "Questionnaires" with "Add ⌄" (Send via Drata, Upload response file); empty state "No questionnaires here yet".
- "Send via Drata" dialog: questionnaire(s), recipients, Subject line (editable per send), message.
- The Drata AI panel docks on the left in the newest screens (on the right in the legacy ones): "Thought for 12s ⌄", the approval it acted on, "Security review started.", time with thumbs up/down, a card "Security review in progress." with "Hide review", and a checklist "0/7 steps completed": Review and confirm criteria, Get access to trust center, Collect documents, Process documents, Assess vendor against criteria, Review residual risk, Finalize review and generate report. A composer with a send button and the footer "Drata AI can make mistakes. Please verify output."
- Criteria confirmation card in chat: the list filtered to the vendor's inherent risk ("Out of 45 total"), "Edit selection", "Confirm criteria", and with a trust center "Request trust center access" or "Assess public docs only".
- After processing, "Run assessment"; results stream in within a minute or so, and stopping cancels the run.
- Residual risk: a chat card "Recommended residual risk" (a select prefilled, "Save", "Review residual risk"). The dialog: a narrative summary, an expandable "Agent reasoning" with the band scale, a table Criterion, Severity, Status, Points, then Result, Total possible points, Share of possible points; "Cancel", "Save residual risk". Weights Low 1, Medium 2, High 3; Met 0%, Partially met 50%, Not met 100%, Inconclusive left out; the share maps to the levels evenly (five levels: Insignificant 0–20%, Minor 20–40%, Moderate 40–60%, Major 60–80%, Critical 80–100%). Too many inconclusive and it withholds a recommendation; a warning "Residual exceeds inherent risk" when it lands higher.
- Follow-up questionnaire: one question per unresolved requirement, in a builder (Questionnaire name, Question, Response type, Source criterion, "Mark question as required", reorder, duplicate).
- The right rail's book icon opens notes: tabs "Internal Note" | "Observation"; "New note" (0/30000); Context ("<review> (general)" or the criterion); Save; empty state "No internal notes yet". Internal notes stay inside the company; observations are visible to participants but never to the vendor.
- Completed view: a blue banner with a calendar-clock icon "Security review complete!" and "Set up recurring reviews"; cards "Observations" (each with Author, Date and "Add to risk register", current vendors only), "Decision" (a pill: "Pending", "Approved", "Approved with conditions", "Rejected"), Internal Notes, Review scope (documents, downloadable), the full criteria table.

Flow edges:
- → Vendor profile banner Start review, Create review, or a chat request → Confirm → the review opens beside the chat.
- → Add › Upload Files or Send via Drata → documents → Process documents → Run assessment → results.
- → Review residual risk → dialog → Save residual risk → the header's Residual risk fills.
- → Finalize review (or ask in chat) → a decision and rationale → Completed; an Executive Summary PDF with the agent's activity trail.
- → an observation's Add to risk register → a vendor risk in the register.
- → Re-open review → editable again.

Images: `../../images/ux/ai/conducting-a-security-review--03.png`, `../../images/ux/vendors/customize-the-vendor-questionnaire-email-subject-line-new-experience--03.png`, `../../images/ux/vendors/internal-notes-and-observations-in-security-reviews-new-experience--03.png`.

### 2.22 Security review assessment and criterion drawer (legacy)

Layout:
- Same header, then tabs Assessment | Reports and documents; "Finalize review" sits under the facts in one version.
- Four summary cards, each an icon, a count and "Out of 42 total": "Criteria met" (blue check, 0), "Criteria partially met" (half-moon, amber, 2), "Criteria not met" (red crossed circle, 0), "Criteria inconclusive" (grey circle-slash, 5).
- Criteria table: Filter, gear, "Search criteria", "Edit selection"; columns Criterion name, Status (pill: "Inconclusive" grey, "Partially met" amber), Analysis summary (three lines of the agent's prose), Severity, Source.
- Criterion drawer over the right half: "4 of 7", "Previous ↑", "Next ↓", "Close"; the criterion's name; "Status" (a select, overridable: "Partially met", "Inconclusive"); "Add internal note", "Add observation", "⋯" (Add to Risk Management); "Analysis Summary" (prose); "Criterion requirements": each requirement a status glyph and its question, the agent's paragraph under it, then "No sources" or "Sources (8) ›" opening the excerpts it quoted.
- The agent panel on the right: "TPRM Agent" with a sparkle; "2/6 steps completed" ring; steps Review and confirm criteria, Collect documents (dated), Process documents, Assess vendor against criteria, Review assessment, Finalize review and generate report; chat lines; a chip "Documents processed"; "Confirm criteria" (secondary) at the foot. A "Review and confirm criteria" dialog lists criteria with an "Unscored" filter and "45 selected".
- Statuses: "Met", "Not Met", "Partially Met", "Inconclusive".

Flow edges:
- → a criterion row → the drawer → override status, note, observation, or create a risk from a gap.
- → Previous/Next → step through criteria without closing.
- → Finalize Review → rationale and vendor status → Executive Summary PDF.

Images: `../../images/ux/vendors/legacy-tprm-agent-create-a-criteria--03.png`, `../../images/ux/vendors/conducting-a-security-review-legacy--05.png`, `../../images/ux/vendors/internal-notes-and-observations-in-security-reviews-new-experience--02.png`.

### 2.23 Criteria (TPRM Agent)

Layout:
- Vendors › Criteria; a TPRM Agent banner (gradient border) explains the list and, when empty, offers "Get started".
- Toolbar: Filter, gear, "Search criteria", "Restore criteria" (secondary, back to Drata's defaults), "Add criteria" (primary).
- Columns: Criteria (name), Vendor inherent risk (a comma list: "Critical, Major, Moderate, Minor, Insignificant", with "Unscored" as a catch-all), Severity (pill: amber "Medium", red "High", and Low), Vendor type ("All vendor types" when blank).
- Selection bar: "46 Selected", "Deselect all", "Assign inherent risk", "Assign severity", "Assign vendor type", "Delete". An inline mode shows the inherent-risk cells as selects with "Discard criteria" and "Save criteria".
- "Add criteria" page: "← Back to Criteria"; Criterion name (with an example hint), Expected response guideline (what a strong answer contains), Vendor inherent risk (chips, each removable), Severity (Low, Medium, High; required), "Vendor type (optional)"; "Add criterion" (another in the same form), Cancel, Save.
- Defaults derive from SIG Lite; their severities from NIST CSF 2.0 functions (Protect and Respond High; Govern, Identify, Detect Medium; scoping and disclosure Low). A criterion applies when it matches the vendor's inherent risk or its type.
- Criteria can also be generated from an uploaded questionnaire.

Flow edges:
- → Add criteria → Save → the list.
- → select → Assign severity → every residual-risk score from then on weighs them so.
- → a review's "Review and confirm criteria" → the filtered list, "Edit selection", Confirm.

Images: `../../images/ux/vendors/tprm-agent-create-a-criteria--01.png`, `../../images/ux/vendors/tprm-agent-create-a-criteria--04.png`.

### 2.24 Drata AI chat panel

Layout:
- Opens from the sparkle in the right rail; docks as a left column beside the page with a gradient outline. Head: "Drata AI", collapse "«", history, "+" new chat.
- Welcome: a sparkle avatar, "Hi there!" and "How can I help you with vendors today?", three suggestion buttons ("How many vendors do I have?", "Which vendors are high risk?", "Which vendors are missing a completed review?").
- Messages: the user's in a pale-blue bubble at the right with a time; the agent's as plain text with bold headings and bullets, each with time, copy, thumbs up, thumbs down. A collapsible "Thought for 17s" box lists the tool calls it ran ("Evaluate Inherent Risk Classification (vendor name: …)").
- Questions answer from live data; tasks end in an action card: one bold line naming the change ("Apply 11X | default's inherent risk: Critical.") and "Approve" (primary) | "Decline" (or "Confirm" | "Cancel"). Nothing changes before approval; the page may need a refresh after.
- Composer at the foot with a send button; "Drata AI can make mistakes. Please verify output."
- Behind it the page stays live: Current Vendors with a banner "3 new vendor suggestions from connections" and "Review suggestions"; rows with logos, Business unit, Security review status pills ("No past review" grey, "Needs review" amber, "Completed" blue), Assessment status; "1-50 of 557".

Flow edges:
- → sparkle → panel → a question → an answer with cited sources.
- → a task → action card → Approve → the record changes (risk created, inherent risk applied, review started).
- → "start a security review of …" → Confirm → the review opens beside the chat with its checklist (2.21).
- → Review suggestions → a modal: Add or Ignore each suggested vendor (from connections and Okta apps).

Images: `../../images/ux/ai/getting-started-with-the-tprm-agent--01.png`, `../../images/ux/ai/getting-started-with-the-tprm-agent--03.png`.

### 2.25 Vendor settings

Layout:
- Vendors › Settings (also Settings › Vendors: Vendor fields, Security reviews, Questionnaires). Title "Vendor settings"; tabs Vendor fields | Security reviews | Questionnaires | Single sign-on. Each tab is a column of cards, each card a title, label/value pairs and "Edit".
- Security reviews tab:
  - Card "TPRM Agent": Criteria preview before assessments ("Always ask for confirmation on criteria selected for each security review"; or automatic, or only the first time a vendor is reviewed); Public document collection ("Ask before collecting public documents" or "Automatically collect and assess"); Inherent risk recommended decision recording and Residual risk recommended decision recording ("Surface for confirmation before recording" or "Automatically record recommended decision"). Edit turns the values into radio groups. These are account-wide and apply to new reviews only.
  - Card "Recurring reviews": "Recurring reviews and questionnaire timeframe" ("30 days before the deadline"), "Automation" ("Standard (creates review, sends questionnaire)", or the agent running the review itself, which skips criteria confirmation).
- Vendor fields tab: cards "Types" (an editable list with delete icons and "Add vendor type"), "Risk levels", "Inherent risk classification".
  - "Edit risk levels" page: a "Risk levels" card (a line that the levels serve inherent and residual risk, up to 7) with "Unscored" fixed at top, then each level a colour swatch, a name field and a red bin, with "Insert risk level" between each; defaults Insignificant (dark teal), Minor (light blue), Moderate (yellow), Major (ochre), Critical (dark red). A "Preview risk levels" card counts vendors at each level for Inherent risk and Residual risk ("Unscored 5 vendors", "Critical 4 vendors"…).
  - "Edit inherent risk classification" page: left "Classification guidance" with an AI banner "Upload your risk classification policy" and "Upload risk classification file"; a sparkle heading with "Reset to defaults", "Copy prompt", an "MD | JSON" toggle; rule cards (drag handle, Rule name, Description with "378/1500", red bin), first match wins, up to 20; "Add rule"; an info line that changes affect only vendors added from now on; Save (disabled until changed), Cancel. Right "Preview classification": "Search vendors…", Reset, and the AI's level and reasoning for the chosen vendor.
- Questionnaires tab: reminders and the email and questionnaire appearance card (logo, colours, default email).
- Single sign-on tab: "Single sign-on suggestions" card, Enabled.

Flow edges:
- → Edit on TPRM Agent → radios → Save → future reviews follow.
- → Vendor fields › Risk levels › Edit → rename, insert, delete → every inherent and residual pill renames.
- → Inherent risk classification › Edit → upload a policy (one rule a tier) or write rules → Preview on a vendor → Save.

Images: `../../images/ux/vendors/start-and-manage-security-reviews-for-your-vendors--04.png`, `../../images/ux/vendors/configuring-inherent-risk--02.png`, `../../images/ux/vendors/configuring-inherent-risk--06.png`.

### 2.26 Questionnaires

Layout:
- Vendors › Questionnaires; title "Questionnaires"; "Create questionnaire ⌄" (primary: From scratch; Import questions, a CSV of up to 500 questions that overwrites the whole questionnaire).
- Filter rail: Status, Category, Risk level.
- Columns: Name, Status ("Active" blue pill, "Draft" grey), Categories (chips, "+1" overflow), Risk levels ("Low", "None", "High"), Last used ("January 21, 2026 at 9:59am"), a chevron.
- Builder: a Questions section, a "+" between questions and drag handles to reorder; response types Short answer (text, email, URL, phone), Long answer, Multiple choice and Checkboxes (each with an optional custom response), Yes / No, and more; conditional follow-ups; save as draft or active.
- The vendor's form (outside Drata's shell): the company's logo and name, "Vendor" (the vendor's name), "Progress" bar "10 of 11 answered"; "Save for later" and "Complete" (primary); numbered question cards with radios or text fields, "(optional)" in the question; footer "Questionnaire powered by Drata".

Flow edges:
- → Create questionnaire → builder → save Active → available to send.
- → a security review's Questionnaires › Add › Send via Drata (or the bulk Send questionnaire) → an email → the vendor's form → Complete → the response in the review, processed by the agent.

Images: `../../images/ux/vendors/create-and-manage-vendor-questionnaires--01.png`, `../../images/ux/vendors/create-and-manage-vendor-questionnaires--04.png`.

### 2.27 Vendor insights and Vendor risks

Layout (Vendor insights):
- Title "Vendor Insights"; read-only.
- Card "Lifecycle overview" with "Go to Current Vendors": six number tiles, Active vendors 693, Vendors under review 10, Vendors on hold 3, Reviews due soon 0, Reviews overdue 55, Flagged vendors 0. Each tile opens Current vendors filtered. Zeros are drawn.
- Donuts with a legend of counts: "Impact level" (Insignificant 2, Minor 9, Moderate 21, Major 23, Critical 113, Unscored 777), "Risk level" (High 65, Moderate 28, Low 462, None 390), "Type" (Vendor 446), "Password policy" (Username and password 23, Single sign-on 32), "PII storage" (Yes 103, No 842).
- Right column: "Lifecycle status" list (Total vendors 945; Active 693, None 196, Archived 40, Under review 10, On hold 3, Rejected 2, Approved 1, Flagged 0, Offboarded 0) and "Business units" (Total vendors 940; None 758, Engineering 63, Administrative 23, Security 21…).

Layout (Vendor risks, TPRM Pro):
- Title "Vendor risks"; cards "Assessment progress" (gauge "16% scored") and "Inherent risk scores for active risks" (Low, Medium, High; a stacked bar 14, 2, 1).
- Toolbar: Filters (status, impact, likelihood, risk score, owner, vendor), gear, Search, Download.
- Columns: Risk identified date, Risk name, Vendor name, Inherent impact and Inherent likelihood (inline selects), then score and treatment; "1-50 of 1151".
- A vendor risk is a register risk marked external, created from the vendor's Risks tab (internal or external, the vendor prefilled, status, title, description, identified date, category, owner, documents, impact and likelihood).

Flow edges:
- → a lifecycle tile → Current vendors filtered.
- → a vendor risk row → the risk record (2.13).
- → vendor profile › Risks › Add risk, or an observation's Add to risk register → a row here and in the risk register.

Images: `../../images/ux/vendors/vendor-insights--01.png`, `../../images/ux/vendors/vendor-risks--02.png`.

### 2.28 Vulnerabilities

No screenshot in the share; the layout is from the article.

Layout:
- Risk › Vulnerabilities; filled by a scanner connection (seventeen named: Aikido, Arnica, AWS Inspector, CrowdStrike, GitLab, Microsoft Defender, Orca, Qualys, Rapid7, Semgrep, SentinelOne, Snyk, Socket, Tenable, Upwind, Wiz, Wiz Code).
- Filters: connection, severity, due date, fix availability; search by vulnerability ID; "Resync"; download filtered or whole.
- Rows are findings (a vulnerability on one resource), so counts run higher than the scanner's own; columns include severity, status and "SLA Due Date".
- A finding's detail: CVSS score, Severity, SLA due date, Status and the source tool's fields.
- Default SLAs: Critical 7 days, High 30, Medium 90, Low 180, replaced by the vulnerability management policy's when one exists. Risk › Vulnerabilities settings › "SLA Settings" edits them and a warning period.
- Settings › Notifications › "Reminders for vulnerabilities with missed or upcoming SLAs", at a chosen cadence.
- Each connection creates two tests: "Critical Vulnerabilities Addressed – <Provider>" and "High Vulnerabilities Addressed – <Provider>", each failing while any such finding is open.

Flow edges:
- → connect a scanner → findings sync → SLA dates → the two tests pass or fail → the controls they map to.
- → a row → detail; remediation happens in the scanner, Drata only tracks.

Images: none.

### 2.29 Procurement connections

No screenshot in the share; four connector guides.

Layout:
- Connections › Available, filter "Procurement": Tropic and Ironclad Vendor are Drata-side connectors with steps Configure (workspaces), Webhook (Tropic: a URL to copy and a "Webhook Secret"), Connect (API Key, Domain, optional category or vendor-type filters, a workflow step name, "Dry Run Mode" on by default) and a health check.
- Zip and Ramp are configured on their side with Drata API keys (Settings › API Keys) or an OAuth application (new experience only).
- Matching to the existing registry: the source's record ID first, then name or website.

Flow edges:
- → a Zip intake or Ramp spend request for a new vendor → the vendor is created in Drata and a security review starts with an owner and deadline → the decision syncs back: "Approved" and "Approved with conditions" advance the request, "Rejected" stops it.
- → a signed Ironclad contract or a Tropic purchase request → the vendor added or updated on each sync (dry run first).

Images: none.

## 3. The data model as the UI shows it

Three chains run through this share, and all three end on controls in the primary workspace.

**People.** IdP/HRIS sync → person → requirement (one a compliance check) → evidence → test → control.
- A person carries an employment status (Current employee, Former employee, Current contractor, Former contractor, Out of scope (ignore), Out of scope (service account), Future hire, Unknown), a Compliance status (Compliant, Not compliant, or "—" when out of scope), Hire and Separation dates, IDP source and Sync status (Found or Not found in HRIS/IdP; a manual edit pauses it).
- Requirements on the person: Acknowledged policies, MFA on IdP, Background check, Security training, HIPAA training, AI awareness training, Offboarding evidence (former staff only), and per device Antivirus, Auto Updates, Disk Encrypted, Lock Screen, Password Manager. Each shows Status (Compliant, Not compliant), Completed on, Last checked.
- Each requirement feeds a monitoring test (e.g. "Test 86 MFA on Identity Provider"), whose Exclusions tab lists who is excused. An exclusion names people (or a status or group), checks, a duration and a reason; the person stays in the audit population.
- Devices come from the agent or MDM, one owner each, and appear both on the person and in Assets; background checks come from Checkr, Certn or Karmacheck, or a URL; trainings from Drata's own course, a connection or an upload, and reset on a yearly rule.
- The person shows the work they own: "Responsibilities" counts Control owner, Policy owner (and Vendor, Evidence, Risk).
- Scale seen: 1284, 682 and 5 people in three accounts; 1297 selected in one bulk action.

**Access.** connected application → accounts → review period → reviewer decision (Approved, Rejected with a reason, Out of scope) → a ZIP of evidence → control DCF-11 "Annual Access Control Review".
- Warnings tie it back to people: Former personnel with access, Missing MFA, Unlinked users, Service accounts, Admin.
- One active period at a time; completed periods keep reviewers, dates, notes and files.

**Risk.** library template (210 seen, NIST SP 800-30, ISO 27005, OCR SRA) → register → risk → mitigating controls (DCF codes, green ready, red not ready, grey out of scope) → workspace.
- A risk: Risk ID, title, description, categories, owners, reviewers, Risk source (Internal, External = tied to a vendor), Status (Active, Closed, Archived), Treatment (Untreated, Accept, Transfer, Avoid, Mitigate), inherent impact × likelihood = inherent score, residual impact × likelihood = residual score (Mitigate and Transfer only), anticipated and completed dates, documents, notes, tickets, tasks.
- Bands: Low 1–4, Medium 5–9, High 10–19, Critical 20–25 on a 5×5 scale; Pro changes the scale and names.
- A risk is "assessed" once it has an inherent score; the register shows the share scored (6%, 7%, 0%) and the count per band. "Needs attention" means a mapped control is not ready.
- Registers (up to 100) each name owners and the workspaces whose controls they may map. The Risk Assessment Report has two tables, Risk Assessment Results and Risk Treatment Plan, the second partly for the customer to fill.

**Vendors.** vendor (Current or Prospective) → inherent risk (from data, operational impact and environment access, by written rules) → criteria that match the inherent risk or type → security review → documents and questionnaire responses → criterion statuses (Met, Partially met, Not met, Inconclusive), each with an analysis and quoted sources → residual risk (weighted gap share mapped to the same levels) → decision (Pending, Approved, Approved with conditions, Rejected) → observations → vendor risks in the risk register.
- The vendor shows Business unit, Inherent risk, Residual risk, Risks associated, Security review window, review status (Up to date, Needs review, In progress, Completed, No past reviews) and the next deadline (Due soon, Overdue, Deadline not set).
- Risk levels are one list (Unscored plus up to seven; default Insignificant, Minor, Moderate, Major, Critical) shared by inherent and residual risk. The older names were "Impact level" and "Overall risk"; the bulk action still says None, Low, Moderate, High.
- Scale seen: 1379 and 557 current vendors; 945 in insights (693 active, 55 reviews overdue, 777 inherent unscored); 1151 vendor risks; 42 to 46 criteria in a review.

**Vulnerabilities.** scanner connection → findings (a CVE on a resource) with an SLA date by severity (7/30/90/180 days) → two tests a connection (critical and high addressed) → controls.

What each record shows of the others: a person shows owned controls and policies as counts; a risk shows its controls as coded chips coloured by readiness; a test shows the excluded people read-only and links back; a vendor shows its risks as a count and its reviews as a table; a security review shows its documents, questionnaires and criteria, and turns observations into risks. Nothing in the share links a vendor review or an access review to a framework requirement directly; both reach frameworks only through controls.

## 4. For Program Assurance

- **Borrow the status-plus-reason exclusion.** Drata's personnel exclusion keeps a person in the population while excusing named checks for a period with a written rationale, shown read-only on the test with a link home. That is the shape of an RMF risk acceptance or a tailored-out control on one system: the record stays in scope, the gap is excused, the reason and expiry travel to the assessor. Model it on the control (or objective) for one system, give it an end date that archives itself, and show it read-only wherever the control is read, with one home to edit it.
- **Borrow the weighted residual-risk breakdown, not the AI.** The security review's residual score is points a gap (severity weight × share by status, inconclusive left out), a share, and a band, with the table behind it and a refusal when too much is inconclusive. Program Assurance can derive a system's or a control family's residual standing the same way from assessment determinations (Satisfied, Other than satisfied, not assessed), and show the arithmetic in the record. The refusal rule matches our "a value that could not be read is never a zero".
- **Borrow criteria scoped by level.** Drata applies vendor criteria by inherent risk or type; that is a control baseline selected by impact level. The "Review and confirm criteria" step, filtered to the level with "Edit selection", is a good pattern for confirming which objectives an assessment plan holds before it runs, in our Plan an assessment flow.
- **Borrow the requirement row with Completed on and Last checked.** The person's requirements table (status, completed date, last checked, a drawer stepping "6 of 6") is a compact form for a control's objectives or a system's controls. "Last checked" is the freshness signal our evidence lacks on screen; the drawer's Previous/Next keeps an assessor in flow.
- **Borrow the risk record's two tabs and the control chips coloured by readiness.** Overview (assessment, treatment, source and status, each card with its own Edit) and Mitigating controls is close to what a POA&M-linked risk needs. Control codes as chips coloured by status, and a register filter "Needs attention" for risks whose controls are not ready, tie risk to control posture without a second screen. Keep our own words (RMF statuses), not traffic-light bands.
- **Leave the inline edit selects in register rows.** Drata puts treatment, impact and likelihood as dropdowns in every row. It is fast for one analyst but makes each cell a control, hides values behind chrome, and invites unreviewed edits. For an RMF record that needs an author and a revision, keep register cells read-only and edit in the record or a dialog.
- **Leave the parallel score vocabularies.** Drata runs three: risk bands (Low to Critical on 1–25), vendor levels (Insignificant to Critical, with Unscored), and an older None/Low/Moderate/High that still shows in bulk actions; one screenshot labels a 9 "Critical" against the stated table. Program Assurance should keep one ladder (FIPS 199 Low/Moderate/High for impact, RMF's own words for status) and never rename it per module.
- **Borrow the guided importer.** Upload, map fields with a data preview, map values, a sheet with All/Valid/Invalid counts, red errors and yellow "will be updated" warnings, then a confirm dialog counting creates and updates. That suits bringing in an existing SCTM, a POA&M spreadsheet or a requirements document. Block rows that would overwrite integration- or reference-owned records, as Drata does for integration-managed assets.
- **Treat the agent's approval card as the model, not the agent.** Every change the TPRM Agent proposes ends in one card naming the change, with Approve and Decline, and the autonomy settings say per step whether it records on its own. If Program Assurance ever drafts determinations or mappings by machine, use that card and per-step settings, and keep the record's author the person who approved.
- **Leave the zero tiles and the donut wall.** Vendor insights draws six tiles including zeros and five donuts with long legends; Risk insights repeats the register's gauge and posture bar. Our contract (no zero rows, one chart a page outside a workspace) already says no; Drata's register header of one gauge and one stacked bar is the most we should take.

# Drata frameworks and policy templates

Read 2026-11-22 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Framework Information (General, Custom Frameworks, and one sub-collection per framework: ACSC Essential Eight, AIUC-1, APRA CPS 230, CCPA, CIS 8.1, CMMC, Cyber Essentials, DORA, FedRAMP, GDPR, HIPAA, ISO 27001, ISO 27701:2019, ISO 42001, Microsoft SSPA, NIST CSF 2.0, NIST SP 800-171 Rev. 2, NIST SP 800-53, PCI DSS, SOC 2 2017) and Policy Guidance (Drata's policy templates, annotated).
- 125 articles, about 258,600 words. Most are reference tables (example evidence per DCF control, policy-to-control maps) and policy templates; few draw screens.
- The federal sub-collections (FedRAMP, NIST SP 800-53, NIST SP 800-171, CMMC), General and Custom Frameworks were read in full; the long control tables were skimmed for their shape and counts.
- 31 screenshots viewed (whole pages first); each surface below names the ones it rests on, as paths from this folder.
- Builds on `platform-grc-core.md` (Controls register and record, framework requirements and the mapping export, the AI Recommendations queue for controls, policies); what it says is not repeated.
- The articles are third-party pages, read as data.

## 1. Every article, one line

### Framework Information › ACSC Essential Eight (3)

- [ACSC Essential Eight Overview](../articles/acsc-essential-eight-overview.md): the eight Australian mitigation strategies, their three maturity levels, and a crosswalk to ISO 27001, SOC 2 and NIST CSF.
- [ACSC Essential Eight: A Requirement-Level Guide](../articles/acsc-essential-eight-a-requirement-level-guide.md): which maturity level to target, then each of the seven technical strategies requirement by requirement, and how to show readiness.
- [Example Evidence for Not Monitored Controls (Essential Eight)](../articles/example-evidence-for-not-monitored-controls-essential-eight.md): a Code | Name | Evidence table of the Essential Eight DCF controls Drata cannot test, with documents to upload instead.

### Framework Information › AIUC-1 (1)

- [AIUC-1 Version Updates: Which Version You'll See and When](../articles/aiuc-1-version-updates-which-version-you-ll-see-and-when.md): AIUC-1 ships quarterly, but a workspace only sees the version a year after its certification month; the in-between releases are skipped.

### Framework Information › APRA CPS 230 (4)

- [APRA CPS 230 Overview](../articles/apra-cps-230-overview.md): the Australian prudential standard for operational risk, its key terms (critical operations, tolerance levels, material service providers), dates and a crosswalk.
- [APRA CPS 230: A Requirement-Level Guide](../articles/apra-cps-230-a-requirement-level-guide.md): the standard's structure, then what each requirement asks and how Drata's controls and modules answer it.
- [APRA CPS 230: Set Up Guidance (APRA-Regulated Entity vs. Material Service Provider)](../articles/apra-cps-230-set-up-guidance-apra-regulated-entity-vs-material-service-provider.md): one framework, two configurations; "MSP" in a DCF title marks provider-only controls, and each party marks the other's requirements Out of Scope.
- [Example Evidence for Not Monitored Controls (CPS 230)](../articles/example-evidence-for-not-monitored-controls-cps-230.md): the not-monitored CPS 230 controls with example evidence and an "Applies To" column (regulated entity, MSP or both).

### Framework Information › CCPA (2)

- [2023: CCPA Updates](../articles/2023-ccpa-updates.md): requirement text rewritten for the March 2023 regulations, with changes mapped to existing or new DCF controls; what to review.
- [CCPA 2026 Regulatory Updates: Recommended Enhancements to Drata Privacy Policy Templates](../articles/ccpa-2026-regulatory-updates-recommended-enhancements-to-drata-privacy-policy-templates.md): clause-level additions to six privacy policy templates (risk assessment, vendor, incident response, classification, retention, protection) and the compliance dates.

### Framework Information › CIS 8.1 (2)

- [CIS v8.1 Framework Overview](../articles/cis-v8-1-framework-overview.md): the 18 CIS control categories, sub-controls and Implementation Groups IG1–IG3, how CIS fits other frameworks, and that there is no CIS certification.
- [Example Evidence for Not Monitored Controls (CIS 8.1)](../articles/example-evidence-for-not-monitored-controls-cis-8-1.md): the longest example-evidence table in the share (about 10,700 words) for CIS 8.1's not-monitored DCF controls.

### Framework Information › CMMC (1)

- [CMMC Framework Updates](../articles/cmmc-framework-updates.md): CMMC 2.0 moved from requirements-only to pre-mapped on 2024-10-16: Level 1 or 2 picker, 110 requirements, 195 DCF controls (26 new), 23 policy templates.

### Framework Information › Custom Frameworks (2)

- [Custom Framework](../articles/custom-framework.md): Create new custom framework (name, short name, description), CSV upload of requirements with optional DCF mappings, bulk and row actions, edit details, delete.
- [Framework Mapping Agent: AI-Assisted Control Mapping for Custom Frameworks](../articles/framework-mapping-agent-ai-assisted-control-mapping-for-custom-frameworks.md): after a custom framework upload, an agent proposes control mappings with a confidence level; a review queue to Map or Dismiss each.

### Framework Information › Cyber Essentials (1)

- [Cyber Essentials v3.2: What's Changed and How to Prepare](../articles/cyber-essentials-v3-2-what-s-changed-and-how-to-prepare.md): the UK scheme's five technical areas, the v3.2 changes for CE and CE Plus, and steps to prepare.

### Framework Information › DORA (3)

- [DORA ICT Risk Management Framework (RMF)](../articles/dora-ict-risk-management-framework-rmf.md): the full ICT risk management framework against the simplified one for small entities, by scope, review cycle and obligations.
- [DORA's Five Pillars of Compliance](../articles/dora-s-five-pillars-of-compliance.md): ICT risk management, incident reporting, resilience testing, third-party risk and information sharing, as steps for small financial entities.
- [EU DORA Framework Overview](../articles/eu-dora-framework-overview.md): what DORA is, whom it binds, and why it is a legal rather than a voluntary framework.

### Framework Information › FedRAMP (2)

- [A guide to Drata's FedRAMP Readiness Framework](../articles/a-guide-to-drata-s-fedramp-readiness-framework.md): the FedRAMP framework (LI-SaaS, Low, Moderate, High), mappings that change with the baseline, editable OSCAL parameters, no SSP or POA&M, and 25 tests to review for direct impact data.
- [FedRAMP 20x: A Modernized Path to Federal Cloud Security Overview](../articles/fedramp-20x-a-modernized-path-to-federal-cloud-security-overview.md): FedRAMP 20x's five goals (simple, reuse, continuous monitoring, trust, rapid change), its OSCAL and automation aims, and advice to providers.

### Framework Information › GDPR (3)

- [Example Evidence for Not Monitored GDPR Controls](../articles/example-evidence-for-not-monitored-gdpr-controls.md): example evidence for GDPR's not-monitored DCF controls, with a reminder that legal review the documents.
- [GDPR Requirements and Best Practices](../articles/gdpr-requirements-and-best-practices.md): GDPR's accountability model (no certification), its main components and practices for internal validation.
- [GDPR: Where do I Start?](../articles/gdpr-where-do-i-start.md): a starter list of questions (data personas, processing, transfers) and links to outside template sources.

### Framework Information › General (9)

- [Framework Readiness](../articles/framework-readiness.md): readiness layered control → requirement → framework; the Controls / Requirements toggle on Frameworks; Ready needs approvals, valid evidence and scope.
- [Framework Requirements](../articles/framework-requirements.md): the framework page's summary numbers under each toggle, the requirements list with Ready / Not Ready marks, filters, in-scope control counting and CSV downloads.
- [Frameworks](../articles/frameworks.md): the Frameworks page and the two kinds of framework, pre-mapped or requirements-only, with a table of 32 frameworks and which kind each is.
- [HITRUST e1/i1 Overview](../articles/hitrust-e1-i1-overview.md): HITRUST's Essentials (e1) and Implemented (i1) assessments side by side, their control domains and when to choose each.
- [How to collect evidence for DCF-574: Mobile device management software](../articles/how-to-collect-evidence-for-dcf-574-mobile-device-management-software.md): one control's evidence guide: in-scope devices, MDM enrolment and policy evidence, unenrolled devices, troubleshooting.
- [Level Picker for Frameworks with Tiered Requirements](../articles/level-picker-for-frameworks-with-tiered-requirements.md): the first-visit level picker for CMMC (Level 1, 2), NIST 800-53 (Security Low, Moderate, High, plus privacy) and FFIEC; the gear to change it.
- [Marking Requirements In and Out of Scope](../articles/marking-requirements-in-and-out-of-scope.md): the Scope filter, row menu and selection bar, a required business rationale, and controls that fall out of scope with their last requirement.
- [NIS2 Update: What ENISA's New Guidance Means for You!](../articles/nis2-update-what-enisa-s-new-guidance-means-for-you.md): ENISA's June 2025 NIS2 implementation guidance and what it changes for in-scope organisations.
- [Troubleshooting Login Issues: Browser, Cache & Session Problems](../articles/troubleshooting-login-issues-browser-cache-session-problems.md): browser steps for a failed sign-in (private window, cache, cookies, extensions); filed here but not about frameworks.

### Framework Information › HIPAA (2)

- [Example Evidence for Not Monitored Controls (HIPAA)](../articles/example-evidence-for-not-monitored-controls-hipaa.md): a Code | Name | Example Evidence table for HIPAA's not-monitored DCF controls.
- [HIPAA Checklist](../articles/hipaa-checklist.md): an ordered checklist for the HIPAA Security Rule in Drata, from approving policies to engaging an auditor, plus ongoing maintenance.

### Framework Information › ISO 27001 (12)

- [Example Evidence for Not Monitored Controls (ISO 27001) - Revised (Following 5/7/2024 Updates)](../articles/example-evidence-for-not-monitored-controls-iso-27001-revised-following-5-7-2024-updates.md): example evidence for ISO 27001:2022's not-monitored controls after the May 2024 remapping.
- [How to provide evidence for DCF-72: Root access control](../articles/how-to-provide-evidence-for-dcf-72-root-access-control.md): one control's evidence guide: unique SSH accounts or disabled root password login on production.
- [ISO 27001 Background Check FAQs](../articles/iso-27001-background-check-faqs.md): which kinds of screening satisfy ISO 27001 and how to handle contractors and existing staff.
- [ISO 27001 Certification Review Template](../articles/iso-27001-certification-review-template.md): reviewing a vendor's ISO 27001 certificate in the vendor drawer's Compliance Report Management, field by field.
- [ISO 27001:2013 Example ISMS Plan](../articles/iso-27001-2013-example-isms-plan.md): a completed ISMS plan for a fictional company under the 2013 clauses (about 13,700 words).
- [ISO 27001:2022](../articles/iso-27001-2022.md): what changed in the 2022 revision, how it arrives in Drata, Revert to latest template for policies, and the transition window.
- [ISO 27001:2022 Checklist](../articles/iso-27001-2022-checklist.md): an ordered year-one checklist (policies, ISMS plan, risk, SoA, internal audit, management review).
- [ISO 27001:2022 Example ISMS Plan](../articles/iso-27001-2022-example-isms-plan.md): a completed 2022 ISMS plan with bracketed guidance, clauses 6 and 8 combined, and a download (about 14,600 words).
- [ISO 27001:2022 Updates as of 5/7/2024](../articles/iso-27001-2022-updates-as-of-5-7-2024.md): the May 2024 remapping: controls unmapped, new controls, existing controls newly mapped, and the full control catalog.
- [Questions to ask a Potential ISO 27001 Certification Body (i.e. Auditor)](../articles/questions-to-ask-a-potential-iso-27001-certification-body-i-e-auditor.md): a short list of questions for choosing a certification body.
- [Security Engineering Principles](../articles/security-engineering-principles.md): what ISO's secure engineering requirement asks, with examples by layer.
- [Transition Guidance for ISO 27001:2013 to ISO 27001:2022](../articles/transition-guidance-for-iso-27001-2013-to-iso-27001-2022.md): which version to pursue by certification state; the 2025-10-30 deadline.

### Framework Information › ISO 27701:2019 (1)

- [ISO 27701:2019 Framework Updates](../articles/iso-27701-2019-framework-updates.md): 27701 made pre-mapped on 2024-07-08: 189 requirements, 235 DCF controls, 24 policies (2 new), 7 privacy risk categories and 20 risk templates.

### Framework Information › ISO 42001 (3)

- [Example Evidence for Not Monitored Controls (ISO 42001)](../articles/example-evidence-for-not-monitored-controls-iso-42001.md): a DCF Code | DCF Name | Example Evidence table for the AI management system controls.
- [ISO 42001 Framework Overview](../articles/iso-42001-framework-overview.md): what an AI management system is and why the standard matters.
- [Ready for ISO 42001? Let's Talk Next Steps](../articles/ready-for-iso-42001-let-s-talk-next-steps.md): ten steps from extending the ISMS to AI through risk assessment, controls, monitoring, vendors, SoA and Trust Center.

### Framework Information › Microsoft SSPA (2)

- [Example Evidence Not Monitored Controls (Microsoft Supplier Security and Privacy Assurance (SSPA))](../articles/example-evidence-not-monitored-controls-microsoft-supplier-security-and-privacy-assurance-sspa.md): example evidence for SSPA's not-monitored controls (about 7,400 words).
- [Microsoft Supplier Security & Privacy Assurance (SSPA) Program v11 Overview](../articles/microsoft-supplier-security-privacy-assurance-sspa-program-v11-overview.md): the SSPA program's goals, who must comply, and what v11 asks of suppliers.

### Framework Information › NIST CSF 2.0 (2)

- [Example Evidence for Not Monitored Controls (NIST CSF 2.0)](../articles/example-evidence-for-not-monitored-controls-nist-csf-2-0.md): example evidence for CSF 2.0's not-monitored DCF controls (about 9,500 words).
- [NIST CSF 2.0](../articles/nist-csf-2-0.md): what CSF 2.0 changed (Govern function, supply chain), Start Activation from "Available for your company", 23 new and 205 mapped DCF controls.

### Framework Information › NIST SP 800-171 Rev. 2 (3)

- [Example Evidence for Not Monitored Controls (NIST 800-171 Rev 3)](../articles/example-evidence-for-not-monitored-controls-nist-800-171-rev-3.md): a Code | Name | Evidence Example table of about 168 not-monitored DCF controls for Rev. 3, filed under Rev. 2.
- [NIST SP 800-171 Rev. 2  Framework Updates](../articles/nist-sp-800-171-rev-2-framework-updates.md): Rev. 2 made pre-mapped on 2024-09-05: 110 requirements, 195 DCF controls (26 new), 22 policies, an Assessment Objectives column from 800-171A.
- [NIST SP 800-171 Rev. 2 Self-Assessment](../articles/nist-sp-800-171-rev-2-self-assessment.md): a six-step self-assessment toward SPRS (scope, status, evidence, gaps, export, DoD scoring); Drata does not compute the SPRS score.

### Framework Information › NIST SP 800-53 (3)

- [Example Evidence for Not Monitored Controls (NIST 800-53r5)](../articles/example-evidence-for-not-monitored-controls-nist-800-53r5.md): about 297 not-monitored DCF controls, each with the 800-53 requirement codes it answers (such as AC-06-07) and example evidence.
- [NIST SP 800-53 (Rev. 5) Control & Policy Mapping Updates](../articles/nist-sp-800-53-rev-5-control-policy-mapping-updates.md): requirements gained 800-53A assessment objectives, 423 baseline requirements got DCF mappings, and five NIST policy templates were added.
- [System Security Planning Policy Guidance](../articles/system-security-planning-policy-guidance.md): the NIST-only SSP policy template, annotated: a plan per system, boundary, categorisation, overlays, tailoring rationale, AO approval, architecture.

### Framework Information › PCI DSS (7)

- [Example Evidence for Not Monitored Controls (PCI DSS v4.0.1 )](../articles/example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md): evidence drawn from the v4.0.1 Report on Compliance template, aligned to Drata's controls for a QSA audit.
- [PCI DSS v4.0](../articles/pci-dss-v4-0.md): v4.0's goals and dates, Start Activation and the SAQ type dialog, and Revert to latest template for policies.
- [PCI DSS v4.0.1 Checklist](../articles/pci-dss-v4-0-1-checklist.md): merchant and service-provider levels, validation by level, an ordered checklist and a glossary.
- [PCI DSS v4.0.1 Responsibility Matrix Guidance](../articles/pci-dss-v4-0-1-responsibility-matrix-guidance.md): how to split each requirement between provider and customer, with an example matrix.
- [PCI DSS v4.0.1 Targeted Risk Analysis (TRA)](../articles/pci-dss-v4-0-1-targeted-risk-analysis-tra.md): when a TRA is due, six steps to run one, and sample TRAs for periodic and customized approaches.
- [PCI DSS v4.0.1 Updates: What You Need to Know](../articles/pci-dss-v4-0-1-updates-what-you-need-to-know.md): v4.0.1 corrects and clarifies v4.0 without adding or removing requirements.
- [Required Documentation for PCI DSS](../articles/required-documentation-for-pci-dss.md): the documents each of the 12 PCI requirements expects, from SAQ D and ROC guidance.

### Framework Information › SOC 2 2017 (14)

- [Evidence for SOC 2 Compliance: Managed Platforms and Application Configurations](../articles/evidence-for-soc-2-compliance-managed-platforms-and-application-configurations.md): what evidence to give when the stack is a managed or no-code platform rather than owned infrastructure.
- [Example Evidence for Not Monitored Controls (SOC 2)](../articles/example-evidence-for-not-monitored-controls-soc-2.md): example evidence for SOC 2's not-monitored DCF controls (about 8,300 words).
- [Questions to ask a potential SOC 2 auditor](../articles/questions-to-ask-a-potential-soc-2-auditor.md): a short list of questions for choosing an audit firm.
- [Reviewing Your Vendors' SOC 2 Reports Using Drata](../articles/reviewing-your-vendors-soc-2-reports-using-drata.md): the vendor SOC report review form, section by section (reviewer, scope, opinion, findings, end-user controls, services, CPA firm, subservice organisations).
- [Set SOC 2 Trust Service Criteria to Security Only](../articles/set-soc-2-trust-service-criteria-to-security-only.md): new SOC 2 workspaces start with only the Security TSC in scope; "Controls Mapped" became "In-scope Controls"; an onboarding walkthrough.
- [SOC 2 Background Checks FAQs](../articles/soc-2-background-checks-faqs.md): background checks as a SOC 2 best practice, not a requirement, and partner offers.
- [SOC 2 Checklist](../articles/soc-2-checklist.md): an ordered checklist after connecting systems, from policies to the audit window.
- [SOC 2 System Description](../articles/soc-2-system-description.md): what the SOC 2 system description holds and a template outline.
- [SOC 2 Trust Services Categories Overview](../articles/soc-2-trust-services-categories-overview.md): the five TSCs and how to choose which to include.
- [SOC 2 Type 1 vs Type 2: Which Audit Type Should I Choose](../articles/soc-2-type-1-vs-type-2-which-audit-type-should-i-choose.md): Type 1 against Type 2, and whether to go straight to Type 2.
- [SOC 2 Updates as of 5/7/2024](../articles/soc-2-updates-as-of-5-7-2024.md): the May 2024 remapping: controls unmapped, new controls, existing controls newly mapped, and the full catalog.
- [SOC 2: All controls](../articles/soc-2-all-controls.md): the SOC 2 control list with TSC, Monitoring and Evidence filter groups, and evidence ideas for CC7.1, CC7.2 and CC6.6.
- [What Is a SOC 2 Bridge Letter? [+ Template]](../articles/what-is-a-soc-2-bridge-letter-template.md): what a bridge letter covers between report periods, with a template.
- [What to look for when reviewing your draft SOC 2 report](../articles/what-to-look-for-when-reviewing-your-draft-soc-2-report.md): what to check in each section of a draft report.

### Policy Guidance (43)

- [Acceptable Use Policy Guidance](../articles/acceptable-use-policy-guidance.md): the template annotated: company assets, clean desk, workstation use, internet use, teleworking, malware protection.
- [Asset Management Policy Guidance](../articles/asset-management-policy-guidance.md): the template annotated: inventory standard, ownership, physical and digital inventories, disposal.
- [Backup Policy Guidance](../articles/backup-policy-guidance.md): the template annotated: what is backed up, how often, retention and recovery testing.
- [Business Continuity Plan - Appendix A: Business Impact Analysis](../articles/business-continuity-plan-appendix-a-business-impact-analysis.md): a replacement Appendix A with worked BIA examples (resource requirements, recovery priorities).
- [Business Continuity Plan Guidance](../articles/business-continuity-plan-guidance.md): the template annotated: succession, response teams, resilience strategy, BIA.
- [Change Management Policy Guidance](../articles/change-management-policy-guidance.md): the template annotated: planned and unplanned change, software development changes, approvals.
- [Code of Conduct Guidance](../articles/code-of-conduct-guidance.md): the template annotated: who must follow it, non-retaliation, conflicts of interest, confidentiality.
- [Control Mapping Updates for Policies - 10/17/2025](../articles/control-mapping-updates-for-policies-10-17-2025.md): a Policy | Controls | Policy Controls | Frameworks table for every template as mapped on 2025-10-17.
- [Control Mapping Updates for Policies - 4/13/2023](../articles/control-mapping-updates-for-policies-4-13-2023.md): new policy-to-control mappings for NIST 800-53, NIST CSF and ISO 27001:2022, and the expected readiness dip.
- [Data Classification Policy Guidance](../articles/data-classification-policy-guidance.md): the template annotated: four levels (Confidential/Restricted, Internal Use, Public, De-identified), labelling.
- [Data Loss Prevention (DLP) Guidance](../articles/data-loss-prevention-dlp-guidance.md): what DLP adds beyond encryption, what to show the auditor, and alternatives when there is none.
- [Data Protection Policy Guidance](../articles/data-protection-policy-guidance.md): the template annotated: data at rest, in transit, messaging, event logs, masking.
- [Data Retention Policy Guidance](../articles/data-retention-policy-guidance.md): the template annotated: retention periods and customer data deletion.
- [Developing a Physical Security Policy for a remote team](../articles/developing-a-physical-security-policy-for-a-remote-team.md): auditor-sourced ideas for a remote team's physical security rules.
- [Disaster Recovery Plan Guidance](../articles/disaster-recovery-plan-guidance.md): the template annotated: threat assessment, tabletop and technical tests, recovery procedures.
- [Does Drata Have a Privacy Policy Template?](../articles/does-drata-have-a-privacy-policy-template.md): no; a public privacy policy is a legal document for counsel.
- [Encryption Policy Guidance](../articles/encryption-policy-guidance.md): the template annotated: cryptographic controls, key management, governing law.
- [Essential Policy FAQs: Your Quick Guide](../articles/essential-policy-faqs-your-quick-guide.md): policy against control, how to write one, Policy Center, annual acknowledgement, multi-tier approval, template updates.
- [Example Business Continuity Plan](../articles/example-business-continuity-plan.md): a completed BCP for a fictional company.
- [Example Completed Data Classification Table](../articles/example-completed-data-classification-table.md): a filled handling-controls table per classification level (labelling of email and other channels).
- [Example Threat Assessment Plan](../articles/example-threat-assessment-plan.md): a short threat intelligence plan for ISO 27001:2022 A.5.7, as an appendix to the risk assessment policy.
- [Incident Response Plan Guidance](../articles/incident-response-plan-guidance.md): the template annotated: roles, periodic evaluation, reporting and executing a response.
- [Information Governance Policy Guidance](../articles/information-governance-policy-guidance.md): the CCM-oriented template annotated: purpose, scope, roles, review.
- [Information Security Policy Guidance](../articles/information-security-policy-guidance.md): the umbrella template annotated: objectives, roles, review, exceptions, training.
- [Logging and Monitoring Policy Guidance](../articles/logging-and-monitoring-policy-guidance.md): the template annotated: what events are logged, retention and review.
- [Maintenance Management Policy Guidance](../articles/maintenance-management-policy-guidance.md): the NIST template annotated: controlled, remote and timely maintenance, tools and personnel.
- [Password Policy Guidance](../articles/password-policy-guidance.md): the template annotated: password and MFA requirements, distribution, protection.
- [Personal Data Management Policy Guidance](../articles/personal-data-management-policy-guidance.md): the privacy template for CCPA/CPRA and GDPR annotated: data subject rights and processing (about 5,600 words).
- [Physical Security Policy Guidance](../articles/physical-security-policy-guidance.md): the template annotated: access requirements, building standards per location, visitors.
- [Policies to Framework Summary](../articles/policies-to-framework-summary.md): a Policy | Description | Frameworks | Policy Control | Related DCF Controls table for 41 templates.
- [Policies: should they reflect what is currently in place or the adjustments you'll be making?](../articles/policies-should-they-reflect-what-is-currently-in-place-or-the-adjustments-you-ll-be-making.md): write near-term changes into the policy; leave distant ones out.
- [Policy Acknowledge Grouping](../articles/policy-acknowledge-grouping.md): a Policy | Acknowledged By table recommending which personnel groups acknowledge each of 34 policies.
- [Policy Coverage for Privacy](../articles/policy-coverage-for-privacy.md): privacy versions of eight templates for GDPR, HIPAA and CCPA, reached through Actions › Revert with latest template.
- [Responsible Disclosure Policy Guidance](../articles/responsible-disclosure-policy-guidance.md): the deprecated standalone template annotated: scope, legal posture, reporting, whistle-blowing.
- [Risk Assessment Policy Guidance](../articles/risk-assessment-policy-guidance.md): the template annotated: methodology, the risk score matrix and appendices A to D.
- [Roles and Responsibilities Guidance](../articles/roles-and-responsibilities-guidance.md): questions per policy area to decide who owns what.
- [Software Development Lifecycle (SDLC) Policy Guidance](../articles/software-development-lifecycle-sdlc-policy-guidance.md): the template annotated: phases, project management, secure engineering, security control guidelines.
- [System Access Control Policy Guidance](../articles/system-access-control-policy-guidance.md): the template annotated: provisioning, access reviews, unique IDs, MFA, logoff, third-party and service accounts.
- [System and Information Integrity Policy Guidance](../articles/system-and-information-integrity-policy-guidance.md): the NIST template annotated: flaw remediation, malicious code, monitoring, alerts, integrity, input validation.
- [Terms of Service Guidance: DCF-63 and DCF-66](../articles/terms-of-service-guidance-dcf-63-and-dcf-66.md): what terms of service are for and how they answer two DCF controls.
- [Vendor Management Policy Guidance](../articles/vendor-management-policy-guidance.md): the template annotated: inventory, contracts, change management of vendor services.
- [Vulnerability Management Policy Guidance](../articles/vulnerability-management-policy-guidance.md): the template annotated: scanning, penetration tests, findings reporting, tracking and remediation.
- [Vulnerability Scanning Guidance](../articles/vulnerability-scanning-guidance.md): scan types and scanners, which to run, and what to show the auditor.

## 2. Product surfaces

Two generations of the UI appear side by side in this share. The older one (2023–2024 screenshots) has a dark navy sidebar with the DRATA wordmark and a row of large stat cards on each framework page. The newer one (articles updated 2025–2026) has a light sidebar grouped as Workspace, Compliance and Organization, and small ring facts under the title. Each surface below says which it shows. The Controls register, control record, policy register and record, and the requirements mapping export are in `platform-grc-core.md` (2.8 to 2.12, 2.23 to 2.26) and are not repeated here.

### 2.1 Frameworks page (gallery, readiness rings, Controls / Requirements toggle)

Layout (newer):
- Sidebar: Workspace (Quick start, Dashboard, Tasks), Compliance expanded (Controls, Frameworks, Monitoring, Evidence, Audits), Events; Organization (Risk, Vendors, Governance, Trust).
- h1 "Frameworks"; filled primary "Create custom framework" at top right.
- Line tabs: "Current frameworks" | "Available for your company".
- "Calculate readiness by" with a two-segment switch, "Controls" | "Requirements". The choice is per user and changes every card and every framework page's summary.
- Cards in a three-column grid. Each: a round logo disc and the name; a ring gauge open at the bottom, its ready share in dark red, with "9%" and "Ready controls" inside; a right column "Requirements 186" and "Controls 22/257"; a text link "Open framework ›".
- Numbers seen: CCM v4 9%, 186 requirements, 22/257 controls; CCPA 8%, 42, 7/100; CIS 8.1 7%, 130, 14/224.

Layout (older):
- Same grid, cards taller. Top right of a card: a small filled "Learn More" (not purchased) or "Start Activation" (purchased, not active).
- Ring with "21% Ready"; footer figures with icon discs: a check disc "44 Requirements" and a sliders disc "57 Controls Mapped ⓘ"; ready share as "0/47 Requirements", "3/27 Requirements", "0/494 Requirements" (FFIEC).
- A requirements-only framework reads "0 Controls Mapped" (Microsoft SSPA 53 requirements; ISO 27701 189 before its 2024 mapping) and carries a one-line pitch to map your own controls.

Flow edges:
- → Compliance › Frameworks → this page (Admins and Information Security Leads only).
- → Open framework (or a card) → framework page (2.3).
- → Create custom framework → custom framework details (2.8).
- → Start Activation → Activate dialog (2.2); → Learn More → the account manager (text only).
- → Controls / Requirements switch → all readiness numbers recount, for this user only.

Images: `../../images/ux/frameworks/framework-readiness--01.gif`, `../../images/ux/frameworks/nist-csf-2-0--01.png`, `../../images/ux/frameworks/pci-dss-v4-0--01.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--01.png`.

### 2.2 Activating a framework and choosing its level (Activate, SAQ type, baseline, level picker)

Layout:
- "Activate NIST CSF 2.0": grey title bar with ✕; a blue info box "This activation just applies to this workspace" (other workspaces through Settings › Company Info); one sentence that Drata adds or updates controls and policies because the older version is already held; "Here's what you get with NIST CSF 2.0:" with three bullets, 106 requirements, 205 mapped controls, 24 policies; Cancel (outlined) and Activate (filled).
- "Activate PCI DSS v4.0": the same shape with 280 requirements, 260 mapped controls, 18 policies. A new version is a separate framework beside the old one (CSF 1.1 and 2.0, PCI 3.2.1 and 4.0), and activating it can lower the old one's readiness.
- "Set the PCI DSS v4.0 SAQ type": three paragraphs (an SAQ type rescopes requirements from the current SAQ documents; "None" keeps all 280 in scope, for a Report on Compliance; it can be changed later); a "SAQ type" select ("D for Service Providers"); Cancel and Save.
- "Set the FedRAMP baseline": one paragraph (the baseline marks inapplicable requirements out of scope; requirements can be brought back by hand; the baseline can change any time); a field labelled "baseline" with "Select…" opening LI-SaaS, Low, Moderate, High.
- Level picker (text only): on first visit to CMMC ("Level": Level 1, Level 2), NIST 800-53 ("Control Baseline": Security - Low, Security - Moderate, Security - High, plus an option to bring in the privacy requirements that overlap the baseline) and FFIEC ("Maturity Level": Baseline, Evolving, Intermediate, Advanced, Innovative). It marks other levels' requirements out of scope.
- Frameworks with no picker are scoped by hand: SOC 2 starts with only the Security TSC in scope for new workspaces; APRA CPS 230 starts as a regulated entity, and a provider marks the regulated-entity requirements out (DCF titles carrying "MSP" are the provider's).

Flow edges:
- → Frameworks › Available for your company › Start Activation → Activate → the framework joins Current frameworks, with its controls and policy templates provisioned (Admins only).
- → PCI DSS v4.0 first open → SAQ type dialog → Save → requirements in or out of scope.
- → FedRAMP card → baseline dialog → choice → the framework page titled "FedRAMP - Moderate" with mappings for that baseline (2.6).
- → requirements list gear (top right) → change level or baseline → the list resets its scope; for FedRAMP, parameter entries are erased.

Images: `../../images/ux/frameworks/nist-csf-2-0--01.png`, `../../images/ux/frameworks/pci-dss-v4-0--01.png`, `../../images/ux/frameworks/pci-dss-v4-0--02.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--01.png`.

### 2.3 Framework page: summary and requirements table

Layout (newer: CCM v4, a custom framework, SOC 3):
- Breadcrumb "Frameworks /"; logo disc and h1 ("CCM v4"); "⋯" at top right. A custom framework adds the primary "Add requirements ⌄".
- A fact row of small ring gauges: "Readiness (by controls)" or "Readiness (by requirements)" 9% or 0%; "Requirements ready" 0/186; "Controls ready" 22/257; then "Description ›" with a line of text and "Read more".
- Left filter card: "Clear all filters", a two-icon switch to dock or collapse the panel, and radio groups Scope (In Scope, Out of Scope), Readiness (Ready, Not Ready), and the framework's own category (Domain for CCM).
- Table card toolbar: "Filters" (funnel), a gear, Search, "Download"; under it "Filters applied:" with a chip "In Scope ×" and "Clear all".
- Columns: checkbox; row "⋯"; Status (a pale red chip with a crossed-out icon, "Not Ready", often cut to "Not R…"; or a pale blue "Ready" with a check); Code; Title (Name on a custom framework); Controls (a count, 23); Scope ("In scope"); a chevron at the row end. Each header carries its own "⋯".
- Footer: "50 per page" and "1-10 of 10" with first, previous, next, last.
- Filtered to Ready with nothing ready, the table body is a blank grey area with no message.
- Summary numbers follow the switch: by Controls, the not-ready and ready controls and the in-scope requirements; by Requirements, the not-ready and ready requirements and the in-scope controls mapped.

Layout (older: FedRAMP - Moderate, SOC 2 2017):
- A white header card: logo, title and a three-line description cut with "…".
- Four stat cards to its right: a ring "27% Ready"; a red ✕ disc "236/323 Requirements are Not Ready"; a green ✓ disc "87/323 Requirements are Ready"; a sliders disc "293 Controls Mapped" (SOC 2: 0%, 33/33 Not Ready, 0/33 Ready, "111 In-scope Controls").
- Left panel under a navy "All requirements" bar: the framework's facets (FedRAMP: Control Class with Technical, Operational, Management; Parameters with Complete, Incomplete; Readiness. SOC 2: TSC with Security, Availability, Processing Integrity, Confidentiality, Privacy, each with its own coloured icon; Readiness).
- Above the list: tabs "In Scope" | "Out of Scope", a search "Search requirements by title, tag, or code", a gear at the end.
- Bulk bar: "Select All" and a greyed "Mark Out of Scope".
- Each row: checkbox, a round status disc (red ✕ or green ✓), code and title ("AC-2.1 Automated System Account Management"), then one chip per mapped DCF control, pale red with ✕ or pale green with ✓, and an overflow "+5".

Flow edges:
- → Frameworks card → here.
- → row (newer) → requirement page (2.5); → row (older) → Requirement Details drawer (2.6).
- → row "⋯" or selection → Mark out of scope (2.4).
- → Download → four CSVs, requirements to controls and controls to requirements, all or filtered (`platform-grc-core.md` 2.12).
- → gear → level, baseline or SAQ type (2.2); on a custom framework, Edit details (2.8).

Images: `../../images/ux/frameworks/framework-readiness--02.png`, `../../images/ux/frameworks/marking-requirements-in-and-out-of-scope--01.png`, `../../images/ux/frameworks/custom-framework--02.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--02.png`, `../../images/ux/frameworks/set-soc-2-trust-service-criteria-to-security-only--01.png`.

### 2.4 Marking requirements out of scope (row menu, selection bar, rationale)

Layout:
- Row "⋯" opens a one-item menu, "Mark out of scope" (on a custom framework also Delete and Change category).
- The header checkbox selects the visible rows; ticked rows turn pale blue. A floating bar appears near the bottom of the table: "1 Selected | Select all 186 | Mark out of scope".
- Custom framework bar: "20 Selected | Deselect all | Mark out of scope | Change category | Delete requirements". With the Mapping Agent: "2 Selected | Select all 10 | Mark out of scope | Change category | Recommend objects | More", the AI verb outlined in purple with a sparkle.
- Confirmation dialog (text only): the number of requirements, a required business rationale (one text for all selected), Confirm (Submit on a custom framework's single row).
- Mark In Scope: filter Scope › Out of Scope, select, the table action "Mark In Scope", confirm.
- Who: Admins, Information Security Leads and Workspace Managers with write access to Frameworks.

Flow edges:
- → Scope › In Scope filter → row "⋯" or checkboxes → Mark out of scope → rationale → Confirm → the rows leave readiness.
- → a control mapped only to requirements now out of scope → the control turns Out of Scope too; a control stays in scope while any one of its requirements is in scope.

Images: `../../images/ux/frameworks/marking-requirements-in-and-out-of-scope--01.png`, `../../images/ux/frameworks/marking-requirements-in-and-out-of-scope--02.png`, `../../images/ux/frameworks/custom-framework--02.png`, `../../images/ux/frameworks/framework-mapping-agent-ai-assisted-control-mapping-for-custom-frameworks--01.png`.

### 2.5 Requirement page (Controls tab, Map controls)

Layout:
- Breadcrumb "Frameworks / CCM /"; a grey status chip "⊘ Out of scope" before the h1 ("Independent Assessments"); "⋯" at top right.
- One fact: "Code" A&A-02.
- Line tabs: "Overview" and "Controls 13", the count in a pale red pill.
- Controls tab toolbar: gear, Search, a text link "Compare to defaults", outlined "Map controls".
- Columns: checkbox, row "⋯", Control code, Name, Description, Status, Owners, Frameworks.
- Not-ready controls sort to the top of a requirement's list (text).

Flow edges:
- → framework page row → here.
- → Map controls → pick DCF or custom controls → mapped (text only).
- → Compare to defaults → this requirement's mappings against Drata's defaults (`platform-grc-core.md` 3.1).
- → "⋯" → Mark in or out of scope; on a custom framework, edit the requirement's details.
- → control row → control record (`platform-grc-core.md` 2.9).

Images: `../../images/ux/frameworks/marking-requirements-in-and-out-of-scope--03.png`.

### 2.6 FedRAMP framework: baseline, Parameters filter, requirement drawer

What Drata offers (from the guide, updated 2026-08-05):
- Baselines: LI-SaaS, Low, Moderate, High, set in the dialog of 2.2. The framework is built from FedRAMP's OSCAL content over NIST SP 800-53 Rev. 5.
- Control set: one requirement per 800-53 control or enhancement in the chosen baseline (323 at Moderate in the screenshot), each mapped to DCF controls (293 mapped at Moderate).
- Mapping: the DCF mappings appear only after a baseline is chosen, because FedRAMP's parameters and additional requirements change what a control asks at each baseline. Changing the baseline changes the mappings and erases every parameter value entered.
- Parameters: values FedRAMP sets are filled in for the baseline; the rest are editable per requirement. A Parameters filter (Complete, Incomplete) finds what is left. Readiness ignores parameters: a requirement with blanks can still be Ready.
- Included: the requirements with per-baseline mapping, editable parameters, the parameters filter, FedRAMP reports in the Trust Center, and Download-Only audits in Audit Hub.
- Not included: external audits in Audit Hub, and SSP and POA&M templates. Drata holds no FedRAMP authorisation, so the SSP, the POA&M and any evidence holding direct impact data stay outside it; such evidence is tracked as a URL (2.11). A table names 25 monitoring tests (by test ID and DCF control, for example test 86 "MFA on Identity Provider" on DCF-67) to review and disable if they could pull direct impact data in.

Layout:
- Framework page (older layout, 2.3) titled "FedRAMP - Moderate", with the facets Control Class (Technical, Operational, Management), Parameters (Complete, Incomplete) and Readiness.
- Rows read "AC-1 Policy and Procedures", "AC-2 Account Management", "AC-2.1 …", "AC-2.2 …": enhancements as dot numbers under their control, each row with its DCF chips (AC-2: DCF-11, DCF-102, DCF-182, DCF-327, DCF-356, +5).
- Requirement Details drawer, wide, from the right: a navy bar "FedRAMP | ac-1 | Requirement Details" (the code in lower case there) with archive, expand and ✕ icons.
- Drawer body: the code large ("AC-1"); "Control name" Policy and Procedures; "Control Description" printing the statement in its lettered and numbered parts.
- Inside the statement, open parameters are inline fields: outlined blue boxes reading "value required" and a dropdown reading "selection required ⌄". Values FedRAMP has set appear as text with a dotted underline ("at least every 3 years", "at least annually", "significant changes", "no more than 96 hours from last use").
- "Supplemental Guidance" follows as plain text.
- A requirement with nothing open shows an ⓘ at top right whose tooltip reads "Nothing editable in this requirement".
- Lower on the drawer: "MAPPED CONTROLS 6" with outlined "Map Controls"; one card per control with a status disc (red ✕ or green ✓), the control name ("Organizational Change Management"), its DCF chip and a chevron.

Flow edges:
- → Frameworks › FedRAMP → baseline dialog → framework page.
- → Parameters › Incomplete → the requirements with open fields → row → drawer → fill "value required" or choose a "selection required" option (an edit button saves; text only).
- → Map Controls → add DCF or custom controls; → control card chevron → control record.
- → gear → change baseline → mappings change, parameter entries are lost.
- → Evidence Library › Add Evidence › Source URL → link evidence kept in an authorised system.

Images: `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--01.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--02.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--03.png`, `../../images/ux/frameworks/a-guide-to-drata-s-fedramp-readiness-framework--04.png`.

### 2.7 NIST SP 800-53, NIST SP 800-171 and CMMC (text only)

No screenshot in the share shows these three; what follows is what the articles say Drata offers.

NIST SP 800-53 Rev. 5:
- Baselines: the level picker's "Control Baseline", Security - Low, Moderate or High, with an option to add the privacy requirements that cross over (2.2). Changing it later resets scope.
- Control set: first shipped as requirements only (one per control); later the requirements gained NIST SP 800-53A's assessment objectives as text, and the 423 requirements in a Security or Privacy baseline gained DCF mappings. Those mappings also reach risks for customers using Risk Management.
- How controls map: many to many. The example-evidence article lists about 297 DCF controls that Drata cannot test, each with the 800-53 requirement codes it answers, written zero-padded with the enhancement as a suffix ("AC-06-07", "IA-02-08"). One DCF control can answer 20 or more requirements: DCF-11 Annual Access Control Review answers 21, across AC, IA, PE and PS.
- Policies: five templates were added beside the original 20: Maintenance Management, System and Information Integrity, System and Services Acquisition, System Security Planning, and Change Management. Eight existing templates were revised for 800-53.
- Gaps: pre-mapped evidence from the Evidence Library is not offered for 800-53.

NIST SP 800-171:
- Rev. 2 moved from requirements-only to pre-mapped on 2024-09-05: 110 requirements, 195 DCF controls (26 written for it, 16 renamed, 63 redescribed, 18 remapped to policies), 22 policy templates, and an "Assessment Objectives" column from NIST SP 800-171A. Rev. 3 is offered as its own framework (its example-evidence table lists about 168 controls).
- Self-assessment guide, six steps: review requirements and scope on "Available for your company"; set each requirement's status; collect and link evidence for each objective; work gaps from the Dashboard and assign tasks; "Export" a control status report from the framework view (requirement by requirement, with linked controls, policies and owners); then score by hand for SPRS (start at the maximum, deduct 1, 3 or 5 points per unmet requirement).
- The guide names three statuses, Ready, In Progress and Out of Scope, and reads Ready as Met and In Progress as Not Met. No screen in this share shows "In Progress"; framework pages show Ready and Not Ready.
- The SSP and POA&M are uploaded as manual evidence. Drata does not compute or submit the SPRS score.

CMMC 2.0:
- Moved from requirements-only to pre-mapped on 2024-10-16. Level picker: Level 1 or Level 2.
- 110 requirements, 195 DCF controls, the same 26 new controls and the same edits as 800-171 Rev. 2, and 23 policy templates (800-171's 22 plus Backup Policy).

The release pattern (CMMC, 800-171, ISO 27701, CSF 2.0, 800-53):
- When a framework becomes pre-mapped, new controls and policy templates land in the account and readiness drops.
- The articles' action list: review the new controls and mark unwanted ones out of scope; revert changed controls to their latest template; review, approve and send new policies for acknowledgement, or archive them.

Images: none (text only).

### 2.8 Custom framework: create, upload, manage

Layout:
- Create (text only): "Create custom framework" opens details: Name (shown on Frameworks), Short name (used in the Controls page filters), Description (shown at the top of the framework page); an optional upload with a downloadable template.
- Template columns, grouped under "Requirement details" and "Mapped Controls": Code, Name, Category (Optional), Description (Optional), Additional Info (Optional), Control Mapping (Optional, comma-separated "DCF-1,DCF-2").
- Upload rules: headers spelled exactly; no `<`, `>` or `\`; Code and Name required; Code unique in the file and in Drata (duplicates skipped); one category; every mapped control must exist, be enabled and be in scope, else the whole row is skipped.
- Confirm step: the count to import and the skipped rows to fix; Next, then Save.
- Framework page (newer layout): logo disc reading "Custom Framework", h1 ("Custom Test"); "⋯" and primary "Add requirements ⌄" with Add requirement and Add/update in bulk; facts 0%, 0/20, 0/1 and the description ("Test for customer"); codes such as "GBP-IECREQ1".
- Bulk and row verbs: Mark out of scope (with rationale), Change category, Delete requirements.
- Settings (text only): gear › Edit details; inside the details pane, ⋮ › Delete framework. Deletion is permanent and refused while auditors, mapped controls or requirements are linked.

Flow edges:
- → Frameworks › Create custom framework → details → upload CSV → Next → confirm → Save → framework page.
- → Add requirements › Add/update in bulk → upload → only new codes are added; existing ones are edited in the app.
- → after creation, the Mapping Agent generates recommendations (2.9).
- → SOC 2 users are steered to the native framework: it cannot be deleted, comes pre-mapped and is kept current.

Images: `../../images/documentation/custom-framework--01.png`, `../../images/ux/frameworks/custom-framework--02.png`.

### 2.9 Framework Mapping Agent: banner, Recommendations, review panel

Layout:
- On the custom framework page, under the facts: a card with a purple-to-blue gradient border and a sparkle disc, "New mapping opportunities", a count line (1 custom requirement has recommendations), filled "View recommendations", ✕.
- Recommendations page: h1 "Recommendations"; outlined "Import requirements"; the same gradient banner, "Improve your compliance posture with these recommendations", "10 requirements …", accepted mappings apply at once.
- Toolbar: "Filter" and Search. One card per requirement: its name in bold and description; "Framework" SOC 3; "2 recommended controls".
- Each suggested control: a mono chip ("DCF-508" grey; "DCF-507" pale red with a crossed icon when the control is in the workspace and not ready), the control name and text, "Confidence: Medium ⓘ", then "Dismiss" (text) and "Map" (outlined).
- Card footer: "Review" (filled), "Map all" (outlined), "Dismiss" (text). Page footer: "50 per page", "1-10 of 10".
- Review panel: "1 of 10", "Previous ↑", "Next ↓", "✕ Close"; a status chip "Ready" above the requirement name; "Map all" at top right; "Requirement description".
- Each suggestion card in the panel: chip and name, confidence at right, the control text, a "Rationale" paragraph, then "Map" and "Dismiss". A control not yet in the workspace carries a blue box "Control from Drata Library": mapping adds it, mapped only to this framework. One already in use offers "View mapped objects ›".
- Confidence words: High, Medium, Low; some requirements are left unmatched, to be mapped by hand or with a new custom control.
- The queue has loading, empty and completed states and keeps progress between visits (text). Admins and Information Security Leads; the Custom Framework add-on.

Flow edges:
- → custom framework upload → recommendations generated → banner → View recommendations → this page.
- → selection bar "Recommend objects" → the chosen requirements join the queue.
- → Map, Map all or Dismiss → the mapping applies to the live framework at once; nothing is accepted without a click.
- → Review → panel → Next through the queue.

Images: `../../images/ux/frameworks/framework-mapping-agent-ai-assisted-control-mapping-for-custom-frameworks--01.png`, `../../images/ux/frameworks/framework-mapping-agent-ai-assisted-control-mapping-for-custom-frameworks--02.png`, `../../images/ux/frameworks/framework-mapping-agent-ai-assisted-control-mapping-for-custom-frameworks--03.png`.

### 2.10 SOC 2 control list and onboarding walkthrough

Layout:
- Controls list (older layout): a navy "All Controls" bar over the left panel; tabs "In Scope" | "Out of Scope"; a search "Search controls by name, description, code, or requirements…".
- Left facets: TSC (Security, Availability, Processing Integrity, Confidentiality, Privacy, each with a coloured icon), Monitoring (Monitored, Not Monitored), Evidence (Evidence Mapped, No Evidence).
- Bulk row: "Select All" and an archive icon at the far right.
- Rows: checkbox, the control name in bold, one line of its text, a pale blue framework chip "SOC 2"; at the right, round icon buttons: a paperclip when evidence is mapped, a broadcast icon when monitored.
- Onboarding on the SOC 2 2017 page: a blue popover pointing at the left panel, "Let's walk through how to manage SOC 2 requirements", four steps on the default scope and how to change it, "Get started", ✕.
- New SOC 2 workspaces start with only Security in scope: 33 requirements, 111 in-scope controls. The fact "Controls Mapped" was renamed "In-scope Controls" with this change.

Flow edges:
- → SOC 2 framework page left column → a TSC → the controls mapped to it.
- → Monitoring › Not Monitored or Evidence › No Evidence → the controls that need manual evidence (each framework's example-evidence article lists them).
- → first visit to SOC 2 → walkthrough → Get started.

Images: `../../images/ux/frameworks/soc-2-all-controls--01.png`, `../../images/ux/frameworks/soc-2-all-controls--02.png`, `../../images/ux/frameworks/soc-2-all-controls--03.png`, `../../images/ux/frameworks/set-soc-2-trust-service-criteria-to-security-only--01.png`.

### 2.11 Add Evidence drawer: file or URL

Layout:
- Navy bar "Add Evidence" with expand and ✕.
- Card "Details": Name* (placeholder "Example: Public privacy notice"), Description, Implementation guidance, Owner* (a person select).
- Card "Artifact": Source* with No artifact, File, URL; under it, greyed until chosen, "Frequency" and "Next renewal date".
- Footer: Cancel and Save.

Flow edges:
- → Evidence Library › Add Evidence → this drawer → Source URL → the item points to where the evidence lives (the FedRAMP guide's answer for direct impact data).
- The library and record are in `platform-grc-core.md` 2.18 and 2.19.

Images: `../../images/ux/evidence/a-guide-to-drata-s-fedramp-readiness-framework--05.png`.

### 2.12 Policy Builder: Revert or Restart with latest template

Layout (older Policy Builder):
- Breadcrumb "Policy Center / Policy Builder"; h1 "Risk Assessment Policy".
- "Actions ⌄" (outlined, focused) with Upload File, Revert to latest template, Revert to version 1; filled "Update Policy".
- A rich-text editor with a toolbar (Heading 1, size, bold, italic, strike, link, lists, indent, align, page break, quote, table, ⋮) and the template's text with the company name filled in.
- Right rail: owner card, "Description:", "Assigned to: All", then "Version: 1", "See Version History", "View Current Version", Created, Approved "-", Last Draft "-".

Layout (newer policy record, draft):
- Breadcrumb "Policy Center › Data Classification Policy"; h1; a grey "Draft" chip with Creation date, Approved date, Published date.
- Tabs "Policy" | "Version history"; a blue banner "This is a draft version" linking to the latest published version.
- "Actions ⌄" with PDF preview, Upload file, Restart with latest template, Delete draft; filled "Finalize draft".
- Confirm "Restart from template?": the template replaces the current text; description, owner, renewal date and SLA stay; Cancel and Continue.

Flow edges:
- → a framework release or a privacy framework added → Policy Center → policy → edit → Actions › Revert to latest template (or Restart with latest template for an uploaded policy) → confirm → draft → approval workflow → publish → personnel acknowledge.
- Drata says it never edits a customer's policy itself and gives notice of template changes; an approved version also updates the Trust Center.

Images: `../../images/ux/policies/nist-sp-800-53-rev-5-control-policy-mapping-updates--01.png`, `../../images/ux/policies/policy-coverage-for-privacy--01.png`, `../../images/ux/policies/policy-coverage-for-privacy--02.png`.

### 2.13 Vendor compliance report reviews (SOC 2 report, ISO 27001 certificate)

Layout:
- Vendor drawer: navy bar with the vendor's name, ⋮, expand, ✕. Card "Vendor Management": a "Reminder" toggle, "Reminder date" (a "1 Year" select and a date), outlined "Set Reminder Date".
- Accordion rows with status icons: "Vendor Details" (green ✓), "Compliance Report Management" (red ✕), "Vendor Questionnaire".
- Compliance Report Management open: "Latest Security Policy or Compliance Report" with a dashed "Upload File" drop zone and the accepted extensions.
- Below it, a row "SOC Report Review" with a red ✕ and the sub-status "Overdue", an upload icon (Manual Upload) and outlined "Start Review"; a note that SOC 2 expects high-risk vendors' reports to be reviewed; a checkbox "Not applicable for this vendor".
- "Upload SOC Report Review" dialog: File* drop zone; Cancel and Save File.
- SOC report review form: stacked section cards, each with a "0/1 Completed" (or 0/2) counter and a chevron.
  - Reviewer Information: Reviewer, Review Date, Vendor, SOC Report Issue Date*.
  - Compliance Report Scope: SOC 1, 2 or 3; Type 1 or 2; Trust Services Categories Included; whether a bridge letter covers the gap.
  - Report Opinion: Unqualified, Qualified, Adverse, Disclaimer; whether the objectives meet business needs (Yes, No); follow-up if qualified.
  - Report Findings: "No findings identified in the report", "List of Findings in Report*" with a trash icon per row and "+ add Finding"; material impact on your control environment (Yes, No).
  - End User Controls: Yes to All or No to All, then each control with "+ add Control" and Yes or No.
  - Optional sections: Services Listed (services and locations relied on), CPA Firm (name and the checks made on it), Subservice Organizations (inclusive or carve-out, N/A, procedures performed).
- ISO 27001 certificate review: no form; a template (Reviewer, Review Date, Vendor, Certificate #, Certification Body, Status Active or Expired, Accreditation Body and whether it is IAF-accredited, issue and expiry dates, scope, locations) filled outside Drata and uploaded through the SOC Report Review row's Manual Upload.

Flow edges:
- → Vendors → vendor → drawer → Compliance Report Management → upload the report → Start Review → form → sections complete → the row's ✕ clears (inferred).
- → Manual Upload → dialog → Save File → a review done outside Drata counts.

Images: `../../images/ux/vendors/iso-27001-certification-review-template--01.png`, `../../images/ux/vendors/iso-27001-certification-review-template--02.png`, `../../images/ux/vendors/iso-27001-certification-review-template--05.png`, `../../images/ux/vendors/reviewing-your-vendors-soc-2-reports-using-drata--01.png`, `../../images/ux/vendors/reviewing-your-vendors-soc-2-reports-using-drata--03.png`, `../../images/ux/vendors/reviewing-your-vendors-soc-2-reports-using-drata--04.png`.

## 3. The data model as the UI shows it

### 3.1 The chain

- framework → (level, baseline, SAQ type or configuration) → requirement → DCF or custom control → evidence, tests and policies.
- A framework is native or custom, and native ones are pre-mapped or requirements-only. The Frameworks article lists 32: 28 pre-mapped, and 4 requirements-only (COBIT, FFIEC, Microsoft SSPA, SOX ITGC). A new version is a separate framework beside the old one (CSF 1.1 and 2.0, PCI DSS 3.2.1 and 4.0, ISO 27001 2013 and 2022, NIST SP 800-171 Rev. 2 and 3). AIUC-1 is the exception: Drata shows only the version a year after the customer's certification month.
- A level, baseline or SAQ type is a framework-wide choice that sets requirements in or out of scope. It is a scope filter, not a record of its own: changing it rescopes the list, and for FedRAMP it also swaps the mappings and erases parameter values.
- A requirement has a code, a name, at most one category, a description and additional info. It also holds a scope (In scope or Out of scope, with a business rationale) and a derived readiness. FedRAMP requirements add a control class and parameters; 800-53 and 800-171 requirements add the assessment objectives as text.
- Requirement to control is many to many. One DCF control answers requirements in many frameworks ("test once, satisfy many"), and one requirement may need several controls. Drata ships default mappings, which customers may change and compare back to ("Compare to defaults").
- A control's support is its evidence (library items with a File, a URL or no artifact, and test results), its monitoring tests, and its policies. These are covered in `platform-grc-core.md` 3.1.

### 3.2 How a framework, its requirements, DCF controls and policies link

- A policy template links to controls in two ways (Policies to Framework Summary and the 2025-10-17 mapping table):
  - The "Policy Control": the one DCF control the policy itself satisfies (Acceptable Use Policy → DCF-37, Information Security Policy → DCF-13, System Security Planning Policy → DCF-577).
  - The "Related DCF Controls": the controls whose text the policy governs (System Access Control Policy → 67 of them; PCI DSS Compliance Policy → 151).
- A policy reaches a framework only through those controls. Its Frameworks column is derived: every framework whose requirements map to one of its controls. So a framework "comes with" a set of templates: 800-53 has 25 (20 + 5), 800-171 Rev. 2 22, CMMC 23, CSF 2.0 24, ISO 27701 24, PCI DSS 4.0 18.
- Activating a framework provisions its templates into the Policy Center. Customers only see the templates of frameworks they hold.
- When Drata remaps policies (2023-04-13 for 800-53, CSF and ISO 2022), readiness can dip. The customer may unmap a policy from a control.
- Readiness climbs the same chain:
  - A control is Ready when its required approvals are done, its evidence is valid, and it is in scope for at least one in-scope requirement.
  - A requirement is Ready when every mapped control is Ready. A requirement with no mapped control is Not Ready.
  - A framework's readiness is the share of Ready in-scope controls or in-scope requirements, by each user's switch.
  - FedRAMP parameters do not count towards readiness.
- Scope also climbs the chain. A control is in scope while any of its requirements is. When the last one goes out, the control goes out. Controls also have their own global scope (`platform-grc-core.md` 3.1).
- Policies also link to people. The Policy Acknowledge Grouping table says who acknowledges each policy: Everyone; Engineering/IT/Security; Executives; the people responsible for vendor management or risk; or None for the ISMS plan.

### 3.3 What each record shows of the others

- Frameworks card: the requirement count, ready over total controls (newer) or ready over total requirements and the controls mapped (older), and the readiness ring.
- Framework page: each requirement with its status, code, title, control count and scope (newer), or the chip of every mapped DCF control coloured by its readiness (older).
- Requirement page or drawer: code, name, statement (FedRAMP: with inline parameters), supplemental guidance, and the mapped controls with status, owners and frameworks.
- Controls list: each control's framework chips, plus icons for mapped evidence and monitoring.
- Policy page: description, assigned group, version, created, approved and last-draft dates. Its controls and frameworks are not drawn in this share.
- Mapping Agent: each requirement with its framework and suggested controls, each suggestion with its confidence and rationale, and whether the control is already in the workspace.

### 3.4 Statuses and their words

- Requirement and control readiness: "Ready" (green check, or a pale blue chip) and "Not Ready" (red ✕ disc, or a pale red chip with a crossed icon).
- Scope: "In Scope" and "Out of Scope" in filters and tabs; "In scope" in cells; a chip "⊘ Out of scope" beside a requirement's title.
- Parameters: "Complete" and "Incomplete"; inline fields "value required" and "selection required"; tooltip "Nothing editable in this requirement".
- 800-171 self-assessment (article only): Ready, In Progress, Out of Scope.
- Mapping Agent: "Confidence: High", "Confidence: Medium" or "Confidence: Low"; unmatched; Map and Dismiss.
- Controls list: Monitored and Not Monitored; Evidence Mapped and No Evidence.
- Policy: Draft, then approved and published (dates).
- Vendor review: a red ✕ with "Overdue", a green ✓, "0/1 Completed"; SOC opinion Unqualified, Qualified, Adverse or Disclaimer.

### 3.5 Numbers seen, for scale

| Framework | Requirements | DCF controls | Policies | Source |
| --- | --- | --- | --- | --- |
| FedRAMP Moderate | 323 | 293 mapped | – | screenshot |
| NIST SP 800-53 Rev. 5 | 423 with a baseline mapped | about 297 not monitored | 25 | articles |
| NIST SP 800-171 Rev. 2 | 110 | 195 | 22 | article |
| CMMC 2.0 | 110 | 195 | 23 | article |
| NIST CSF 2.0 | 106 | 205 | 24 | dialog |
| PCI DSS v4.0 | 280 | 260 | 18 | dialog |
| ISO 27701:2019 | 189 | 235 | 24 | article |
| CCM v4 | 186 | 257 | – | screenshot |
| CIS 8.1 | 130 | 224 | – | screenshot |
| CCPA | 42 | 100 | – | screenshot |
| SOC 2 (Security only) | 33 in scope | 111 in scope | – | screenshot |
| FFIEC | 494 | 0 (requirements-only) | – | screenshot |

Elsewhere in the share: 32 frameworks listed and 41 policy templates in the summary. DCF codes run past DCF-980 (DCF-987 in the Backup Policy row), with ".AI" variants for ISO 42001 (DCF-184.AI).

### 3.6 The policy templates

These are the 41 templates in Policies to Framework Summary, grouped by reach. The figure after each is the number of frameworks the summary lists for it. Each line says what the template covers, and the guidance article's sections where there is one.

Broad templates (28 to 34 frameworks each, all four federal ones included unless noted):
- Acceptable Use Policy (34): how staff may use company devices and technology: clean desk, workstations, internet, teleworking, malware.
- Asset Management Policy (34): the asset inventory standard, ownership, physical and digital inventories.
- Backup Policy (31; the summary leaves out CMMC and 800-171, though the CMMC article counts it): what is copied, how often, and recovery.
- Business Continuity Plan (33): keeping the business running through a disruption: succession, response teams, impact analysis (Appendix A).
- Change Management Policy (33): planned and unplanned changes, software changes, approvals.
- Code of Conduct (28; not CMMC or 800-171): behaviour expected of staff, conflicts of interest, confidentiality, non-retaliation.
- Data Classification Policy (33): the classification levels and how each is labelled and handled.
- Data Protection Policy (34): technical protection of data at rest and in transit, messaging, logs, masking.
- Data Retention Policy (33): how long data is kept, and deletion for customers.
- Disaster Recovery Plan (31; not CMMC or 800-171): resuming work after an incident: threat assessment, tabletop and technical tests, procedures.
- Encryption Policy (33): what must be encrypted, when, and to what minimum standard; key management.
- Incident Response Plan (34): detecting, reporting and responding to security incidents; roles and periodic evaluation.
- Information Security Policy (34): the umbrella policy: objectives, roles, review, exceptions, training.
- Logging and Monitoring Policy (33): which events are logged, retention and review.
- Network Security Policy (33): judging by its controls, network diagrams and segmentation, firewalls, WAF and intrusion detection (no guidance article in the share).
- Password Policy (34): password and MFA rules, distribution and protection of credentials.
- Physical Security Policy (33): facility access, building standards per location, visitors; a separate note covers remote teams.
- Risk Assessment Policy (33): the risk method, the score matrix, acceptable risk, appendices (a threat assessment plan example).
- Software Development Life Cycle Policy (34): development phases, project management, secure engineering principles.
- System Access Control Policy (34): provisioning and removal, access reviews, unique IDs, MFA, logoff, third-party and service accounts.
- Vendor Management Policy (34): vendor inventory, contracts, changes to vendor services.
- Vulnerability Management Policy (34): scanning, penetration tests, reporting, tracking and remediating findings.

NIST family templates (FedRAMP, CMMC, 800-53, 800-171 Rev. 2 and 3, and a few others):
- Maintenance Management Policy (9, DCF-575): controlled, remote and timely maintenance, tools and maintenance personnel.
- System and Information Integrity Policy (10, DCF-576): flaw remediation, malicious code, system monitoring, alerts and advisories, software and hardware integrity, spam, input validation.
- System Security Planning Policy (6, DCF-577): an SSP per system (boundary, FIPS 199 categorisation, environment and connections, overlays, controls with tailoring rationale, AO approval, annual review), rules of behaviour, security architecture, defence in depth.
- System and Services Acquisition Policy (7, DCF-578): security in acquisition (no guidance article in the share).

HIPAA templates:
- Business Associate Policy (1): business associate agreements under the Privacy and Security Rules.
- Breach Notification Policy (1): how breaches are reported, and the notice thresholds.
- Privacy, Use, and Disclosure Policy (1): permitted uses and disclosures of protected health information.

Management system plans:
- Information Security Management System (ISMS) Plan 2022 (2): the ISO 27001 ISMS, with example plans for 2013 and 2022.
- ISMS and Privacy Information Management System (PIMS) Plan (1): the ISO 27701 extension.
- Artificial Intelligence Management System (AIMS) Plan (1): the ISO 42001 management system.

Privacy, cloud and AI templates:
- Personal Data Management Policy (4): data subject rights and processing for CCPA/CPRA, GDPR and HITRUST.
- Internal Privacy Policy (2): internal privacy rules for ISO 27701 and HITRUST.
- Public Cloud PII Protection Policy (3): personal data in public cloud services (ISO 27018).
- Information Governance Policy (3): governance of information for CCM, DORA and HITRUST.
- Shared Responsibility Policy (3): the provider's and customer's shares for ISO 27017, 27018 and CCM.
- AI Governance Policy (2), AI Risk Management Policy (2), AI System Development and Evaluation Policy (2): AI oversight, risk and life cycle for NIST AI RMF and ISO 42001.
- PCI DSS Compliance Policy (2): one policy covering PCI DSS 4.0 and 4.0.1, mapped to 151 controls.

Outside the summary: the standalone Responsible Disclosure Policy (deprecated), a Global Network Firewall Policy for UK Cyber Essentials (in the acknowledgement table), and a Data Deletion Policy among the privacy versions. Drata offers no public privacy-notice template, which it treats as a legal document.

## 4. For Program Assurance

- **Drata stops at readiness for federal work.** This is Program Assurance's ground, so say so and build there.
  - FedRAMP comes without SSP or POA&M templates, external audits or an authorisation.
  - The 800-171 guide sends the reader to score SPRS by hand and to upload the SSP and POA&M as files.
  - 800-53 assessment objectives are a text column, not something counted.
  - Program Assurance's chain already goes past this point: objectives counted per control, determinations, findings, POA&M, risk, and the SSP assembled from the record. Keep showing that chain end to end, and do not flatten 800-53 into a vendor control set the way the DCF does.
- **Borrow the FedRAMP drawer's inline parameters.** Drata prints the control statement with open parameters as fields in place ("value required", "selection required ⌄"), underlines the values FedRAMP set, and offers a Complete / Incomplete filter.
  - Program Assurance already prints a program's values in a control's text (`program_control_parameters`). Take three things: the in-place fields, the underline for a value set upstream, and a filter for open parameters.
  - Leave two things. Drata erases parameter values when the baseline changes; Program Assurance's layers keep them. Drata does not count parameters in readiness; an open parameter is a real gap in an SSP and should count.
- **Ask for a rationale whenever scope is removed.** Drata's Mark out of scope requires a business rationale, applies one rationale to every selected row, and takes a control out of scope with its last requirement.
  - RMF tailoring owes a rationale anyway (Drata's own System Security Planning template asks the SSP for one).
  - Ask for it in the selection bar's confirm dialog, and show the cascade (which controls leave with these requirements) before the write, not after.
- **Never move status silently.**
  - Drata's baseline, level and SAQ dialogs rescope with a single paragraph of warning and no list of what moves.
  - Its releases ("now pre-mapped") drop readiness overnight and leave a to-do list in a help article.
  - Program Assurance should keep its practice of showing the delta before writing (as Take version does) for a baseline change, an overlay change, or a reference catalog republished.
- **Keep a status ladder, not Ready / Not Ready.**
  - Drata's readiness is binary at every layer. A requirement with no mapped control is simply Not Ready, and SOC 2 by requirements can read 0%. A Not Ready hides why.
  - Program Assurance's ladder (no requirement, no evidence, not assessed, a determination) says what to do next.
  - Do take Drata's two lenses on one count. Its per-user Controls / Requirements switch maps to "by controls / by objectives", which Program Assurance already counts.
- **Use the Mapping Agent's review pattern for imported requirements.**
  - Each suggestion carries a confidence, a rationale and Map / Dismiss. A notice warns when accepting a control would add it to the workspace. Previous / Next walks the queue, and nothing applies without a click.
  - That fits Map a requirement when a customer's requirements document is imported (`import_customer_requirements`). Keep the reader as the one who decides.
- **Align policies with control families.**
  - Drata gives each policy one "policy control", the one it satisfies, plus the controls it governs. Its NIST-only templates (Maintenance, System and Information Integrity, System Security Planning, System and Services Acquisition) mirror 800-53 families; its 22 broad templates do not.
  - For Program Assurance, the natural home of a policy is its family's -1 control (AC-1, SI-1, PL-1). A policy document is evidence on that control, and its review date is the control's parameter ("at least every 3 years"). Offer family-shaped policy shells rather than Drata's cross-framework set.
- **One visual generation.** Drata shows two UIs at once: the older one with navy stat cards and DCF chips on every row, and the newer one with small ring facts and a count column. Its framework pages differ by vintage, not by purpose. Program Assurance's control screens should have one register shape whatever the source (catalog, overlay, customer document).
- **Leave for later: a structured review of a provider's package.** Drata's vendor SOC report review is a sectioned form, each section with an "N/M Completed" counter (opinion, findings, end-user controls, subservice organisations).
  - Program Assurance's shared components and inherited controls will one day need the same for an external provider's FedRAMP package: its customer responsibilities are the end-user controls.
  - It is not needed before the component screens exist.

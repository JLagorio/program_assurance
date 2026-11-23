# Pre-Audit Checklist: How to Prepare for Your Audit with Drata

Source: https://help.drata.com/en/articles/12020733-pre-audit-checklist-how-to-prepare-for-your-audit-with-drata
Collection: Assessing Your Readiness
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

Getting ready for an audit can feel overwhelming, but Drata’s platform and team are here to help you succeed. This checklist is designed to walk you through the essential review stages within the Drata platform, helping you systematically verify that your controls are sound, your evidence is complete, and your environment is ready for auditor access.

**Please note: **This checklist provides a general overview of best practices for audit preparation using Drata. While it covers the most critical areas for a successful review, it is not an exhaustive task list for every possible scenario. Every compliance framework has unique requirements, and every organization has a unique environment. Therefore, it is essential that you and your team own the complete effort of your audit readiness. We encourage you to work closely with your auditor and be mindful of your specific framework's requirements that may go beyond this checklist.

To view a guided walkthrough of the pre-audit checklist, watch the [Drata Pre-Audit Check Webinar Recording](drata-pre-audit-check-webinar-recording.md) or join our live [Pre-Audit Check webinar](https://events.zoom.us/ev/AlDiCuZabBL7tiT3en8kk_bjM1goX4JCI11nbhA8m8TnMgpNjgAf~AhN0hTySaFCfSjUS1BDuChOD3XKaNp0lswCFRGkrUFWWXB3Z-M-GTVhioA), where we cover each step, share best practices, and answer questions.

## 1. Review Your *Monitoring* Page

- **Check your passing/failing tests:**
   - Aim for 100% passing before your audit starts.
- **Remediate failing tests:**
   - Have a clear plan to address any outstanding issues:
      - Click on each failing test to see the details of the failure, including the specific person, asset, or configuration that is non-compliant.
      - Follow the recommended remediation steps provided in the test details. For example, if a user's MFA is failing, go to your identity provider (e.g., Okta) and enable MFA for that user.
      - Wait for Drata's next automated sync (typically nightly) to see the test status update to "Passing."

## 2. Review Your *Controls* Page

- **Validate In-Scope Controls:**
- Confirm all controls marked as in-scope are relevant to your audit objectives and mapped to the correct requirements.
- Here’s a practical guide to scoping the right systems, people, data, and processes for compliance frameworks: [Scope Determination Checklist for Compliance Audits](scope-determination-checklist-for-compliance-audits.md)
- For **SOC 2**, ensure only the required Trust Services Criteria (TSC) – Security is mandatory, others (Availability, Confidentiality, Processing Integrity, Privacy) are included based on your business needs. Validate that controls mapped to out-of-scope TSCs are also marked out-of-scope.
- Help article to reference: [SOC 2 Trust Services Categories Overview](soc-2-trust-services-categories-overview.md)
- For** ISO 27001**, verify that only applicable Annex A controls are in-scope per your Statement of Applicability.- To determine applicability, conduct a risk assessment to evaluate each control's relevance to your organization's operations and risk environment. Document the rationale for including each control.
- For** GDPR**, ensure controls supporting your data processing activities are in-scope.

- **Validate Out-of-Scope Controls:**
- Review all controls marked out-of-scope and confirm the business rationale is documented (e.g., not applicable to your environment or service).
- For SOC 2, controls mapped to TSCs you’ve excluded (e.g., Privacy if not relevant) should be out-of-scope.
- For ISO 27001, controls not applicable to your ISMS (e.g., cryptography if not used) should be out-of-scope with justification. Document these exclusions in the Statement of Applicability (SoA), which serves as the formal record for control applicability and exclusions, critical for demonstrating compliance during audits.

- **Non-monitored controls: **
   - Upload evidence: For controls not automatically monitored, ensure you’ve uploaded supporting documents (not just policies).
   - Some controls may appear “Ready” just because they’re linked to a policy. Double-check where supporting evidence is needed and ensure it’s uploaded.
      - **Help article to reference for a list of DCFs which are common controls that may need both a linked policy AND supporting evidence**: **[Are Your Controls Ready? Understanding the Link Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)**
- Additional Resource: **[Evidence Library](https://help.drata.com/en/collections/10485351-evidence-library)**

## 3. Review Your *Personnel* Page

- **Confirm Personnel Records**
- **Impact on Compliance Tests:** Personnel status directly affects compliance tests such as "Infrastructure Accounts Removed Properly," ensuring former employees do not retain access. Contractors undergo separate validations like policy acceptance checks, though their devices may not need monitoring for certain tests.

- **Status Accuracy: Verify each individual’s status *(Current/Former Employee or Contractor). ***
   - **Drata Integration Note:** Drata pulls this information from your Identity Provider (IDP) and HRIS (if connected). Ensure these integrations are healthy and syncing correctly. If you've manually changed a status in Drata, be aware this can disable syncing for that field; you might need to reset manual changes to resume sync.

- **Out-of-Scope: Mark individuals not impacting audit scope (e.g. consultants without system/data access) as “Out of Scope.” This excludes them from compliance checks and onboarding.**

- **Verify Key Compliance Attributes**

- **Policy Acknowledgement:** Ensure all in-scope personnel have acknowledged assigned policies (green check).
   - **Tip:** Drata allows grouping personnel for policy assignment. Ensure appropriate groups are assigned to relevant policies.
   - **Reminder:** Annual policy re-acknowledgement is considered best practice.

- **Security Training:** Confirm completion of security awareness training for all in-scope personnel (green check). Upload external evidence if needed.
   - HIPAA Training: If applicable, confirm HIPAA training completion (green check).

- **Multi-Factor Authentication (MFA):** Verify MFA is enabled for all in-scope personnel on your identity provider.

- **Background Checks:** Ensure background checks are complete (green check or justified exclusion).
   - Drata Integration: Drata can integrate with background check providers (e.g., Checkr, Amiqus) or manual uploads of completed checks.
   - Exclusions: If certain personnel are legitimately excluded from background checks, ensure a documented exclusion is noted in Drata.

- **Endpoint Security:** If using Drata Agent, confirm device security (agent installed, disk encryption, anti-virus, auto-updates, lock screen, password manager) for all in-scope personnel.
   - If Drata Agent or an MDM is not deployed, manual evidence is required for endpoint security checks. For each in-scope user/device, you must upload proof (e.g. screenshots, config exports, attestation forms) demonstrating compliance with:
      - Disk encryption (e.g. BitLocker, FileVault enabled)
      - Anti-virus installed and active
      - Auto-updates enabled
      - Lock screen configured
      - Password manager in use

## 4. Review Your Policy Center

- **Approval Workflow**: Confirm each policy has gone through the required review and approval process. Only approved policies are considered valid for compliance.

- **Version Control:** Check that policy versions are tracked.
   - For reference: Material changes should trigger a new major version and require re-acknowledgement by personnel; non-material changes can be published as minor versions without re-acknowledgement.

- **Policy Assignment**: Ensure policies are assigned to the correct personnel groups. Use Drata’s grouping to target policies based on role, department, or location.

- **Acknowledgement Tracking:** Verify all in-scope personnel have acknowledged the latest versions of required policies. Drata provides status indicators for this.

- **Renewal Dates:** Update policy renewal dates as needed – most frameworks require annual review and renewal.
   - Help article to reference: [Annual Compliance Review](annual-compliance-review.md)

- **Policy-to-Control Mapping:** Confirm each policy is mapped to the relevant controls in Drata, ensuring traceability for auditors.

## 5. Review Your Vendors Page

- **Maintain a Complete Vendor Inventory**
   - Use Drata’s Vendor Directory to keep an up-to-date register of all vendors, including risk level, data types accessed, service description, and main contact.
   - This also satisfies **DCF-56**: Vendor Compliance Monitoring.

- **Classify and Assess Vendor Risk**
   - Identify “critical” vendors – those processing sensitive data, accessing internal systems, or providing essential services.
   - Each of your critical vendors should have a completed Security Review and supporting documentation (ex SOC 2 report) attached.

- **Collect and Centralize Due Diligence**
   - For critical vendors, obtain and upload the latest SOC 2 Type 2 report or a completed security questionnaire.
   - This also satisfies **DCF-507**: Vendor Due Diligence.

- **Vendor Related Controls**

| **DCF Control** | **Description** | **Evidence Guidance** |
|---|---|---|
| DCF-56 | Vendor Register and Agreements | 1. Provide evidence of a centralized, up-to-date inventory listing all your vendors/third parties. This should include details such as vendor name, relationship owner, a description of services, and their assigned risk rating.<br>   - Screenshots from your vendor management system (e.g., Drata's TPRM module, a dedicated GRC tool, or a comprehensive spreadsheet) clearly showing the categorized list of vendors based on impact/risk, along with the other required attributes.<br>1. Upon request from your auditor for their selected sample(s), provide evidence of an example executed agreement/contract with a vendor or service provider. This should be an agreement with a vendor involved in accessing, processing, storing, or managing your information assets. |
| DCF-57 | Vendor Compliance Monitoring | Provide documentation showing that your organization obtains and reviews compliance reports or other evidence for critical vendors at least annually.<br>Documentation can include:<br>- SOC 2 Type 2 Reports<br>- Completed security questionnaire (e.g. SIG, CAIQ, custom vendor security assessment)<br>- ISO 27001 certificate<br>- Other third-party security attestations |
| DCF-168 | Vendor Management Policy | Your Vendor Management Policy |
| DCF-507 | Vendor Due Diligence | - You need to perform due diligence on any new service provider or vendor *before* engaging with them. This process involves:<br>1. Evaluating the vendor's security posture<br>2. Reviewing security questionnaires or obtaining confirmation of compliance certifications (e.g., SOC 2)<br>3. Documenting the results of your due diligence and the date it was completed<br>- To complete this in Drata:<br>1. Add the prospective vendor and [start a security review](https://help.drata.com/en/articles/9676307-start-and-manage-security-reviews-for-your-vendors)<br>2. Document observations about the vendor's security posture<br>3. Review and annotate questionnaires sent through Drata<br>4. Finalize the review with a security decision (Approve, Approve with Exceptions, or Reject)<br>5. Include a note explaining your decision |

## 6. Configure Your Audit in Drata's Audit Hub

- **Log Your Auditor's Information**: Within the Audit Hub, you'll enter your external auditor's name and contact details. This formally invites them into your Drata environment (with appropriate read-only access).

- **Confirm Audit Start and End Dates:** This is a **critical step**. You will set the precise start and end dates for your audit period directly within the Audit Hub.
   - **Best Practice:** Always finalize the audit period in close consultation with your auditor. This ensures alignment with specific framework requirements (e.g., SOC 2 Type 2, ISO 27001) and prevents discrepancies during evidence collection or testing.

- **Resources:** Review these resources for a comprehensive overview of Audit Hub:
   - **[Drata Audit Hub Overview](https://help.drata.com/en/articles/8438218-drata-audit-hub-overview)**
   - **[Auditor Experience](https://help.drata.com/en/articles/6928357-auditor-experience)**

## Caveats and Considerations

- **Audit Timeframe is Paramount:**
   - **Evidence Visibility: **The most important caveat is that **only evidence generated or uploaded within the exact start and end dates you set in the Audit Hub will be visible to your auditor**. If a control's evidence (e.g., a security training completion, a vulnerability scan report, a policy approval) falls outside this defined period, it will not be presented to the auditor, even if it exists in Drata.
   - **Action:** Before setting these dates, ensure all relevant evidence for your chosen audit period is present and accounted for in Drata. If you need to adjust the audit period, be mindful of how this impacts the evidence presented.

- **“Read-only access” Toggle**: Granting "read-only access" to an auditor allows the auditor to view the application’s data beyond just the scope of a single audit, but restricts them from making any changes. This permission is distinct from simply assigning an auditor to an audit:
   - **Read-Only Access (Audit Hub toggle):**
      - Auditors can navigate the Drata application and view all evidence, controls, and documentation, not just those tied to their assigned audit.
      - Enables broader visibility, which is useful for auditors needing context or reviewing evidence outside the audit period.
      - Does not allow editing, uploading, or deleting any data.
      - Required for enabling the "Allow test, control, and requirement downloads" option, which lets auditors download evidence directly from the app.

- **Audit Assignment Without Read-Only:**
   - Auditors can only access evidence and data specifically scoped to the assigned audit.
   - No visibility into other areas of the application or evidence outside the audit period.
   - Download functionality for controls, tests, and requirements is disabled.

- **Pre-audit Package is Static:** The initial "Pre-audit package" generated when the audit is opened is a snapshot. It will not automatically update if you add new evidence or change samples later. To see updates in this package, you would typically need to complete the current audit and open a new one (though auditors will see real-time updates for individual controls).

- **Automated vs. Manual Evidence:** Remember that Drata automates much of the evidence collection for monitored controls. However, "Not Monitored" controls (such as many policies, manual review logs, or external reports) require you to manually upload evidence. Ensure these manual pieces of evidence are linked correctly and fall within the audit timeframe.
   **For a granular, step-by-step guide, download the full task list here:**
   [Expanded Pre-Audit Checklist .pdf](https://downloads.intercomcdn.com/i/o/am69aeco/1723531548/d0fb5b40fbbd286402ab3bb4ffc3/Expanded+Pre-Audit+Checklist+.pdf?expires=1795500000&signature=bdeeacd39c0b7f3b18b31911719df274b610314d17b1699a278842c2e67936bd&req=dSclFcx9nIRbUfMW3Hu4gU48etLxjoNvaU6iiknccFXz7dw1F29m2vNUSd3o%0AJw%3D%3D%0A)

## Related articles

- [SOC 2 Checklist](soc-2-checklist.md)
- [Scope Determination Checklist for Compliance Audits](scope-determination-checklist-for-compliance-audits.md)
- [HIPAA Checklist](hipaa-checklist.md)
- [Drata MCP — Setup & Usage Guide](drata-mcp-setup-usage-guide.md)
- [Pre-audit evidence packages in Drata (New Experience)](pre-audit-evidence-packages-in-drata-new-experience.md)

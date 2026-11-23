# Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls

Source: https://help.drata.com/en/articles/10723594-are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls
Collection: Assessing Your Readiness
Updated: 2026-06-12
Fetched: 2026-11-22
Description: Mapping Policies, Evidence, and Controls for Compliance

## Article text

Ensuring compliance and audit readiness depends on the strong connection between controls, policies, and evidence:

- Controls define the compliance requirements.
- Policies document the rules and guidelines that enforce these controls.
- Evidence proves that controls are implemented and effective.

For a control to be audit-ready, it must be mapped to approved policies **AND** valid evidence (e.g., passing test results, up-to-date documentation). Missing or invalid evidence can lead to audit failures or delays. Keeping controls, policies, and evidence aligned ensures a smooth and successful audit process.

This article explains how these elements work together and what is required to ensure a control is considered "Ready."

### What Makes a Control "Ready"?

A control is considered "Ready" when it meets the following criteria:

- All mapped evidence is valid.
- The control is not mapped to any invalid evidence.

### What Qualifies as Valid Evidence?

- A test is in a **PASSING** state.
- **All mapped policies have a *published* version.**
- A mapped Evidence Library item has **not** exceeded its renewal date.
- A mapped Miscellaneous Evidence file or URL has **not** exceeded its renewal date.

### What Constitutes Invalid Evidence?

Evidence is considered invalid if it meets any of the following conditions:

- A test is in a **FAILING** state.
- **A mapped policy is *not published*.**
- A mapped Evidence Library item has **exceeded** its renewal date.
- A mapped Miscellaneous Evidence file or URL has **exceeded** its renewal date.

### What to Do When a Control Is Not Ready

If a control is not ready, take the following steps:

1. **Review and Approve/Publish Policies** – Ensure that all mapped policies have been reviewed and approved/published, including pending/current contractor review and acknowledgement of policies.
2. **Upload Manual Evidence** – If needed, provide additional documentation to support the control.
3. **Verify Mapped Evidence** – Confirm that all mapped evidence remains valid and up-to-date.
4. **Ensure Controls Are Mapped to Evidence** – If a control lacks any mapped evidence, it is not considered ready. Check evidence mappings and resolve issues as needed through manual uploads or validations.

### DCFs That Require Additional Evidence

Here is a list of common DCF controls that may need **both a mapped policy and supporting evidence**.

These DCFs can appear as **READY** once a policy is attached, but they still **require** additional evidence to be fully compliant with auditor expectations.

| **Code** | **Name** | **Manual Evidence Required** |
|---|---|---|
| DCF-16 | Periodic Risk Assessment | Upload the latest documentation of completed risk assessment activities (e.g., risk register, risk treatment plan). |
| DCF-17 | Risk Treatment Plan | Upload the latest documentation of completed risk assessment activities (e.g., risk register, risk treatment plan). |
| DCF-18 | Vulnerability Scans | If you have not set up the integration for Drata to run an automated test to verify Vulnerability Scanning, you will need to upload copies of your vulnerability scan results. |
| DCF-19 | Penetration Tests | Upload evidence of the most recent penetration testing activities (e.g., test reports, vulnerability assessments, or remediation plans). |
| DCF-21 | Architectural Diagram | Upload your current architecture diagram(s) along with evidence of updates or reviews within the past year. Acceptable documentation may include emails from responsible personnel confirming accuracy or any other records verifying that the diagrams are up to date. |
| DCF-22 | Network Diagram | Upload your current network diagram(s) along with evidence of updates or reviews within the past year. |
| DCF-26 | BCP/DR Tests | Upload evidence of your most recent business continuity and/or disaster recovery test. |
| DCF-154 | Incident Response Test | Upload evidence of your most recently completed incident response test. |

By following these steps, you can ensure that your controls remain in a ready state, helping to streamline audits and maintain compliance.

## Related articles

- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Evidence Overview](evidence-overview.md)
- [Example Evidence for Not Monitored Controls (ISO 42001)](example-evidence-for-not-monitored-controls-iso-42001.md)

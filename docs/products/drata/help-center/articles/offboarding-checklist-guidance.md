# Offboarding Checklist Guidance

Source: https://help.drata.com/en/articles/6077161-offboarding-checklist-guidance
Collection: Personnel Management › Employee Offboarding
Updated: 2026-08-05
Fetched: 2026-11-22
Description: This article provides a checklist for an effective offboarding process.

## Article text

Offboarding isn’t just an HR task – it’s a key security and compliance control. A structured offboarding process helps safeguard data, maintain regulatory compliance, and ensure a smooth transition when an employee or contractor exits the organization. This checklist outlines the key steps, auditor expectations, and best practices to help you offboard employees effectively.

### What Auditors Look For

Auditors want clear, timestamped evidence that offboarding actions were completed promptly and consistently. While your offboarding process may vary depending on your organization’s structure, auditors will typically expect to see documented evidence (e.g., a ticket or checklist) confirming:

##### Timely Deactivation of Access

The employee’s access to systems and applications was disabled or removed within the defined SLA (as outlined in your System Access Control Policy and/or other relevant security policies).

##### Prioritization of High-Risk Systems

In complex IT environments, ensure access to externally facing or cloud-based systems is revoked first (e.g., VPN, email, GitHub, admin panels).

##### Access Review Cross-Check

Reference your User Access Matrix or Access Review logs to ensure all systems the individual had access to are covered.

##### Return of Company Assets

Confirmation that all IT equipment, access cards, and other assets were returned.

### Additional Best Practices

**Confidentiality Reminder:** Reiterate any ongoing obligations under NDAs or confidentiality agreements.

**Email Forwarding Setup: **Forward the employee’s email to their manager or a designated contact (if appropriate).

**Device Sanitization: **Ensure the employee’s laptop or device is securely wiped before being reassigned, recycled, or disposed of.

**Password Rotation:** Rotate any shared credentials or system passwords the employee had access to, especially important for involuntary terminations or users with elevated privileges.

**Conduct an Exit Interview:** Capture feedback and ensure a respectful close-out of the employment relationship.

### Drata Compliance Checks Linked to Offboarding

A **Former Personnel Offboarding Test** verifies that offboarding evidence exists for all former users. Evidence can be provided automatically (via ticketing tools like Jira), manually uploaded, or by excluding specific personnel.

Mapped DCFs:

- **DCF-70** (Access Deprovisioning)
- **DCF-688** (Return of Assets)

### Additional Resource

[Personnel Offboarding](personnel-offboarding-evidence.md)

## Related articles

- [Personnel Offboarding Evidence](personnel-offboarding-evidence.md)
- [SOC 2 Checklist](soc-2-checklist.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Scope Determination Checklist for Compliance Audits](scope-determination-checklist-for-compliance-audits.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)

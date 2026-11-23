# How to provide evidence for DCF-72: Root access control

Source: https://help.drata.com/en/articles/16402002-how-to-provide-evidence-for-dcf-72-root-access-control
Collection: Framework Information › ISO 27001
Updated: 2026-08-13
Fetched: 2026-11-22
Description: This article explains what evidence to provide in Drata when your organization needs to demonstrate that root access to production resources is restricted.

## Article text

DCF-72 focuses on preventing routine, direct root access to production resources. You can support the control by showing one or both of the following:

- Users access production systems through unique SSH accounts instead of a shared root account.
- Root password authentication is disabled on production resources, such as virtual machines or containers.

Disabling root password authentication does not necessarily prevent all forms of privileged access. Follow your organization’s access-control procedures and document any approved exceptions.

### Collect evidence for unique SSH accounts

Use this procedure when users connect to production systems through individual SSH accounts.

1. Identify the production systems included in the audit scope.
2. Sign in to a representative production system or open the applicable access-management configuration.
3. Capture evidence showing that the user signs in with a unique, named SSH account rather than the root account.
4. Include the system name, account name, and date in the evidence when possible.
5. Upload the evidence to the DCF-72 requirement in Drata.

### Collect evidence that root password authentication is disabled

Use this procedure when root password authentication is disabled on your production resources.

1. Identify the production systems included in the audit scope.
2. Open the configuration that controls root password authentication for each system or representative system.
3. Capture a screenshot or export showing that root password authentication is disabled.
4. Include the system name, configuration setting, and date in the evidence when possible.
5. Upload the evidence to the DCF-72 requirement in Drata.

Examples of supporting evidence include infrastructure-as-code configuration, server configuration, or settings from a platform that manages your production resources.

### Document approved root access

If root access cannot be disabled in a production environment, document how your organization controls and monitors approved use. These measures may help reduce risk, but they do not automatically satisfy DCF-72 or replace the evidence requirement.

1. Document why root access is required and identify the affected production resources.
2. Limit root access to authorized administrators.
3. Require approval before using root access, when practical.
4. Record when root access is used and review the activity.
5. Set a time limit for temporary root access when your technology supports it.
6. Retain the approval and activity records with the system’s access documentation.

Ask your auditor whether this approach is acceptable for your audit scope.

### Provide evidence for partner-managed systems

If a partner manages production systems in your audit scope, request evidence that addresses the same DCF-72 requirement.

1. Identify the production resources the partner manages on your organization’s behalf.
2. Ask the partner for evidence showing unique SSH access or disabled root password authentication.
3. Confirm that the evidence covers the systems and period included in your audit scope.
4. Document the partner’s responsibilities in the applicable agreement or security-responsibility document.
5. Upload the partner-provided evidence and supporting documentation to the DCF-72 requirement in Drata.

A vendor statement or contract may document responsibilities, but your auditor may request technical evidence as well.

### Use additional access controls

The following controls can strengthen your privileged-access program:

- Require multi-factor authentication for administrative access when supported by your environment.
- Use named accounts and role-based access controls for routine administration.
- Centralize privileged-activity logs and review them periodically.
- Monitor changes to authentication settings and privileged accounts.
- Use managed identities or certificate-based authentication for service accounts when appropriate.

These measures are supplementary. They do not replace evidence that users use unique SSH accounts or that root password authentication is disabled.

### Troubleshoot evidence requests

If you are unsure whether your evidence supports DCF-72, check the following:

- The evidence covers production resources, not only development or test systems.
- The evidence shows a current configuration or access practice.
- User accounts are unique and attributable to individual administrators.
- The evidence clearly shows whether root password authentication is enabled or disabled.
- Partner-managed resources and responsibilities are within the documented audit scope.
- Any approved exception includes a business justification, approval, scope, and review record.

If you cannot provide the requested evidence, contact your auditor to confirm the acceptable evidence and exception process for your audit.

## Related articles

- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Example Evidence for Not Monitored Controls (Essential Eight)](example-evidence-for-not-monitored-controls-essential-eight.md)
- [How to collect evidence for DCF-574: Mobile device management software](how-to-collect-evidence-for-dcf-574-mobile-device-management-software.md)

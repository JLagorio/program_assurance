# How to collect evidence for DCF-574: Mobile device management software

Source: https://help.drata.com/en/articles/16402161-how-to-collect-evidence-for-dcf-574-mobile-device-management-software
Collection: Framework Information › General
Updated: 2026-08-13
Fetched: 2026-11-22
Description: Use this article to prepare evidence for DCF-574 in Drata. The control focuses on managing and protecting mobile devices used for company purposes.

## Article text

DCF-574 focuses on using mobile device management (MDM) software to manage and protect in-scope mobile devices, such as phones and tablets.

The scope may include:

- Company-issued mobile devices.
- Personally owned devices that personnel use for company purposes, when those devices are included in the audit scope.

The specific security settings and device population that apply depend on your organization’s policies, technology, and audit scope. Review your control requirements and confirm any questions with your auditor.

## Identify in-scope devices

Use this procedure to identify the devices that your evidence should cover.

1. Review your audit scope and mobile device policy.
2. Identify the mobile devices used for company purposes.
3. Identify the operating systems and device types included in the scope.
4. Note whether the scope includes company-issued devices, personally owned devices, or both.
5. Record the device population and review date for your evidence package.

## Collect MDM enrollment evidence

Use this procedure to show that in-scope mobile devices are enrolled in an MDM solution.

1. Sign in to your MDM administration console.
2. Open the device inventory or enrollment page.
3. Filter the inventory to the devices included in your audit scope.
4. Capture a screenshot or export a report showing the device enrollment or management status.
5. Include the MDM solution name, device population, and evidence date when available.
6. Upload the evidence to the DCF-574 requirement in Drata.

Examples of MDM solutions include Microsoft Intune, Jamf, Kandji, and VMware Workspace ONE. Your organization may use another MDM solution.

## Collect security-policy evidence

Use this procedure to show that the MDM solution is configured to enforce security settings.

1. Open the compliance policies, configuration profiles, or security baselines in your MDM console.
2. Identify the policies assigned to the in-scope mobile devices.
3. Capture evidence of the security settings that apply to those devices.
4. Include the applicable operating system, device group, policy name, and policy status when available.
5. Upload the policy evidence to the DCF-574 requirement in Drata.

Depending on your environment, relevant settings may include:

- Device encryption.
- Screen-lock or password requirements.
- Remote lock or remote wipe.
- Restrictions on software installation.
- Restrictions on access to company data.
- Threat detection or device-compliance requirements.

The settings that apply to your organization depend on your policies, MDM capabilities, and audit scope. Do not claim that a setting is enforced unless your MDM evidence shows that it applies to the in-scope devices.

## Review the evidence

Use this checklist before submitting your evidence.

- The evidence covers mobile devices within the audit scope.
- The evidence identifies the MDM solution in use.
- The evidence shows which devices or device groups the policies apply to.
- The evidence shows that the policies are enabled or enforced, not only drafted.
- The evidence identifies the applicable operating system or device type.
- The evidence includes a date or other information that shows when it was collected.
- The evidence does not expose unnecessary personal information.

A single screenshot may not represent the entire in-scope device population. Include additional reports or screenshots when they are needed to show the population, policy assignment, and enforcement status.

## Handle devices that are not enrolled

If an in-scope device is not enrolled in the MDM solution, do not represent it as managed.

1. Identify the device and its owner or assigned group.
2. Confirm whether the device is in the audit scope.
3. Follow your organization’s process to enroll the device or remove its access to company resources.
4. Document an approved exception if your organization allows the device to remain outside MDM management.
5. Retain the exception approval and supporting records with your audit documentation.

An exception or policy document may explain why a device is not enrolled, but it does not by itself show that the device is managed by MDM. Confirm with your auditor what evidence is acceptable for your audit.

## Work with a device-management provider

If another team or service provider manages your mobile devices, request evidence from the team or provider.

1. Identify the mobile devices and MDM policies they manage for your organization.
2. Request an enrollment report or equivalent evidence for the in-scope devices.
3. Request evidence of the security policies assigned to those devices.
4. Confirm that the evidence covers the applicable audit period and device population.
5. Upload the evidence and document the provider’s responsibilities in the DCF-574 requirement in Drata.

A contract or responsibility document can explain who manages the devices, but your auditor may also request technical evidence showing enrollment and policy enforcement.

## Troubleshoot evidence requests

If you are unsure whether your evidence supports DCF-574, check the following:

- The evidence covers phones and tablets used for company purposes, rather than only unrelated laptops or workstations.
- The evidence shows that the MDM solution manages the devices in scope.
- The security policies are assigned to the relevant devices or groups.
- The policies are enabled or enforced.
- The evidence covers each applicable operating-system type.
- The evidence date and audit period are clear.
- Any excluded or unenrolled device has a documented, approved exception.

If you cannot determine what evidence is appropriate, contact your auditor to confirm the expected scope and evidence format for your audit.

## Related articles

- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Example Evidence for Not Monitored Controls (ISO 42001)](example-evidence-for-not-monitored-controls-iso-42001.md)
- [How to provide evidence for DCF-72: Root access control](how-to-provide-evidence-for-dcf-72-root-access-control.md)

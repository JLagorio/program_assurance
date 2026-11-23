# Evidence for SOC 2 Compliance: Managed Platforms and Application Configurations

Source: https://help.drata.com/en/articles/11887346-evidence-for-soc-2-compliance-managed-platforms-and-application-configurations
Collection: Framework Information › SOC 2 2017
Updated: 2025-12-21
Fetched: 2026-11-22

## Article text

## Overview

SOC 2 compliance requires organizations to produce audit-ready evidence that demonstrates effective implementation of controls. Whether you use a managed or no-code platform or maintain your own infrastructure, auditors expect clear, specific artifacts that directly support the control requirements. This article outlines how to prepare and present evidence for both managed environments and custom-configured systems.

## Key Concepts or Components

### Evidence Expectations for SOC 2

Auditors assess whether your environment satisfies the trust services criteria outlined in your SOC 2 framework. Evidence must be specific to your systems and traceable to the corresponding controls. This includes both documentation and technical configurations, with supporting context that enables auditors to validate effectiveness.

### Managed or No-Code Platforms

If your organization operates on a fully managed or no-code platform (such as Bubble.io), where infrastructure is not customer-managed, you remain responsible for showing how the platform enforces applicable controls for your environment.

Recommended evidence includes:

- **Platform Control Confirmation: **When possible, request confirmation from the provider (e.g., support or technical documentation) identifying which infrastructure-level controls apply to your subscription or deployment. Examples include data encryption, backups, monitoring, or multi-region redundancy.
- **Service Tier Documentation: **Reference publicly available platform documentation that describes control coverage by plan or service tier. Clearly identify your current tier and the protections it includes.
- **Account-Specific Artifacts:** Provide screenshots or other evidence showing your current billing plan, administrative settings, or service-level indicators. This confirms that the platform’s stated controls are active for your environment—not just available in theory.

### Custom Environments

For environments you configure directly (e.g., AWS EC2, ECS, or other containerized systems), auditors will expect runtime evidence of secure configurations and operating safeguards.

Key types of evidence include:

- **Configuration Screenshots: **Include labeled screenshots showing security groups, IAM roles, firewall rules, logging configurations, monitoring dashboards, and other relevant system settings.
- **Runtime Security Practices:** Demonstrate that systems are hardened and monitored. Highlight controls such as audit logging, access controls, encryption settings, and API gateway protections.
- **Control Mapping:** Ensure each artifact is clearly mapped to its corresponding SOC 2 control. Group related items together for ease of review.

### Use Cases / Best Practices

Follow these practices to improve the quality and audit-readiness of your evidence:

- **Label and Explain Each Artifact:** Use clear descriptions to identify what each artifact shows and which control it supports.
- **Group Artifacts by Control:** Organize screenshots, documents, and configurations under each relevant control for clarity.
- **Include Supporting Context:** Add brief written explanations or confirmations when evidence may require interpretation by an external auditor.

These practices help ensure your submission aligns with SOC 2 audit requirements, regardless of your platform or system architecture.

## Related articles

- [SOC 2 Checklist](soc-2-checklist.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Pre-audit evidence packages in Drata (New Experience)](pre-audit-evidence-packages-in-drata-new-experience.md)
- [Section 5: Evidence Owners](section-5-evidence-owners.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)

# PCI DSS v4.0.1 Updates: What You Need to Know

Source: https://help.drata.com/en/articles/10670101-pci-dss-v4-0-1-updates-what-you-need-to-know
Collection: Framework Information › PCI DSS
Updated: 2026-08-17
Fetched: 2026-11-22
Description: This article provides an overview of the updates in PCI DSS v4.0.1.

## Article text

This highlights key clarifications and changes without introducing new or removed requirements. It is designed to help you understand what has been updated and how it impacts your compliance efforts. For further details, feel free to reach out to us.

### What Happened?

On January 31, 2024, the PCI Security Standards Council (PCI SSC) released PCI DSS v4.0.1, a limited update to PCI DSS v4.0. This revision does not introduce new or deleted requirements. Instead, it includes minor corrections, clarifications, and formatting fixes to improve understanding and implementation of the standard.

**After January 1, 2025, PCI DSS v4.0.1 will be the only supported version.**

Please note that while organizations must transition to v4.0.1 by January 1, 2025, the new requirements introduced in v4.0 will not become mandatory until March 31, 2025, as originally planned.

### What Changed in the Standard?

The updates in PCI DSS v4.0.1 focus on:

- Clarifying existing requirements to remove ambiguity
- Fixing typographical and formatting errors
- Updating applicability notes for better interpretation
- Reverting some wording in v4.0.1 to better align with PCI DSS v3.2.1 where necessary for clarity.

#### Key Updates by Requirement:

- Requirement 3 (Protect stored cardholder data)
   - Clarified how issuers and issuing service providers should interpret specific controls.
   - Added a Customized Approach Objective for organizations using keyed cryptographic hashes.

- Requirement 6 (Develop and maintain secure systems and applications)
   - Reinstated PCI DSS v3.2.1 language, clarifying that the 30-day patching timeframe applies only to critical vulnerabilities.
   - Added notes on how to manage payment page scripts securely.

- Requirement 8 (Identify and authenticate access to system components)
   - Clarified that multi-factor authentication (MFA) does not apply to accounts only authenticated with phishing-resistant authentication factors.

- Requirement 12 (Maintain a security policy and support compliance efforts)
   - Updated notes on third-party service provider (TPSP) relationships to clarify responsibilities.

- Appendices
   - Removed sample templates from Appendix E (now available on the PCI SSC website).
   - Added definitions for Legal Exception, Phishing-Resistant Authentication, and Visitor in Appendix G.

#### What Didn’t Change?

- No new requirements were added.
- No existing requirements were removed.
- The March 31, 2025, effective date for new v4.0 requirements remains unchanged.

For a full description of changes, refer to the Summary of Changes from PCI DSS v4.0 to v4.0.1 file link below.

[PCI DSS v4 to v4.0.1 Summary of Changes.pdf](https://downloads.intercomcdn.com/i/o/am69aeco/1400113276/23e6689e3d15773abee00d0c8a47/PCI+DSS+v4+to+v4_0_1+Summary+of+Changes.pdf?expires=1795500000&signature=a39e1b29a21d325319123b51a3f2dcfe8c39c2dfae82380da5d3ba66941d982a&req=dSQnFsh%2FnoNYX%2FMW3Hu4gdXYpJ8OIKDwXPCk%2F1LihDCN3VXSVFTO57qQkFIq%0AeA%3D%3D%0A)

### What Changed in Drata?

If you are working towards PCI DSS v4.0.1 compliance, these updates do not change your compliance strategy. The focus remains on implementing the existing security controls while using the clarifications to ensure correct interpretation and implementation.

This release is a minor update, the text / copy for 44 requirements were updated, but had no impact on DCF or Policy mapping.

- **Policies:** Our standard 22 policy templates will be provisioned with the update, we’re increasing the number of policy templates attached to PCI from the 18 it was under 4.0, but this is not due any updated requirements, rather we’re augmenting the standard set of policy templates we deliver across the Platform.
   The additional policies included are as follows:
   - [Backup Policy](backup-policy-guidance.md)
   - [Business Continuity Plan](business-continuity-plan-guidance.md)
   - [Disaster Recovery Plan](disaster-recovery-plan-guidance.md)
   - [Risk Assessment Policy](risk-assessment-policy-guidance.md)

- **Risks: **No new risks have been developed or associated with the framework.

## Related articles

- [Policies to Framework Summary](policies-to-framework-summary.md)
- [PCI DSS v4.0](pci-dss-v4-0.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)
- [PCI DSS v4.0.1 Checklist](pci-dss-v4-0-1-checklist.md)
- [PCI DSS v4.0.1 Responsibility Matrix Guidance](pci-dss-v4-0-1-responsibility-matrix-guidance.md)

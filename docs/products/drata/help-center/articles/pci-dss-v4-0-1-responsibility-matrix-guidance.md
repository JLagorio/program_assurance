# PCI DSS v4.0.1 Responsibility Matrix Guidance

Source: https://help.drata.com/en/articles/11734403-pci-dss-v4-0-1-responsibility-matrix-guidance
Collection: Framework Information › PCI DSS
Updated: 2025-07-09
Fetched: 2026-11-22

## Article text

### Overview

The PCI DSS Responsibility Matrix helps organizations define and allocate compliance responsibilities between entities such as merchants, service providers, and third-party vendors. This document outlines shared responsibilities for implementing security controls, ensuring clarity in maintaining compliance with PCI DSS v4.0.1 requirements.

This matrix clarifies which security requirements fall under the direct responsibility of an organization versus those managed by third-party vendors or shared between both parties. The goal is to ensure all PCI DSS controls are adequately covered, reducing compliance gaps and strengthening security postures.

The PCI DSS v4.0.1 Responsibility Matrix applies to all entities that store, process, or transmit cardholder data and are required to comply with PCI DSS. It includes:

- **Your Organization’s Responsibilities:** Internal security controls and compliance measures.
- **Third-Party Vendor Responsibilities:** Tasks managed by service providers or outsourced partners.
- **Shared Responsibilities:** Controls requiring collaboration between internal teams and third-party vendors.

### How to Use the Responsibility Matrix

To use the PCI DSS v4.0.1 Responsibility Matrix, start by reviewing all PCI DSS requirements and sub-requirements listed in the matrix to ensure comprehensive coverage of compliance obligations.

Next, assign responsibility for each requirement by marking whether it falls under your organization, a third-party vendor, or is shared between both parties. Once assignments are made, validate them by ensuring that responsibilities are clearly documented in contracts or service agreements with vendors.

### The 12 PCI DSS v4.0 Core Requirements

PCI DSS v4.0.1 consists of **12 core requirements**, each outlining specific security controls that must be implemented. You are responsible for reviewing each of these requirements in the matrix and marking whether the responsible party is your organization, a third-party vendor, or both.

1. Install and Maintain network Security Controls
2. Apply Secure Configuration to All System Components
3. Protect Stored Account Data
4. Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks
5. Protect All Systems and Networks from Malicious Software
6. Develop and Maintain Secure Systems and Software
7. Restrict Access to System Components and Cardholder Data by Business Need to Know
8. Identify Users and Authenticate to System Components
9. Restrict Physical Access to Cardholder Data
10. Log and Monitor All Access to System Components and Cardholder Data
11. Test Security of Systems and Networks Regularly
12. Support Information Security with Organizational Policies and Programs

## Responsibility Matrix Template - EXAMPLE ONLY 

**Note: **This responsibility matrix is provided as an **Example** and currently includes only a subset of PCI DSS v4.0.1 requirements. To ensure full compliance, this chart must be completed for all **12 core requirements (1 through 12)** and their associated sub-requirements. Each control must be evaluated to determine whether it is the responsibility of your organization, a third-party vendor, or a shared responsibility.

| **PCI DSS version 4.0.1 Responsibility Matrix Template** | **Responsibility** | **EXAMPLE ONLY** |  |  |  |
|---|---|---|---|---|---|
| **Requirements ** | Third-Party Vendor | Your<br>[COMPANY] | Both | N/A | Comments |
| **1.1 Processes and mechanisms for installing and maintaining network security controls are defined and understood.** |  |  |  |  |  |
| 1.1.1 All security policies and operational procedures that are identified in Requirement 1 are documented, kept up to date, in use and know to all affected parties. | X |  |  |  |  |
| 1.1.2 Roles and responsibilities for performing activities in Requirement 1 are documented, assigned, and understood. | X |  |  |  |  |
| **1.2 Network security controls (NSCs) are configured and maintained.** |  |  |  |  |  |
| 1.2.1 Configuration standards for NSC rulesets are defined, implemented and maintained. |  | X |  |  |  |
| 1.2.2 All changes to network connections and to configurations of NSCs are approved and managed in accordance with the change control process defined at Requirement 6.5.1. |  |  | X |  |  |
| 1.2.3 An accurate network diagram(s) is maintained that shows all connections between the CDE and other networks, including any wireless networks. |  | X |  |  |  |
|  |  |  |  |  |  |

**This continues on from Requirements 2 through 12. **

### Related Help Articles:

[PCI DSS v4.0](pci-dss-v4-0.md)

[PCI DSS v4.0.1 Updates: What You Need to Know](pci-dss-v4-0-1-updates-what-you-need-to-know.md)

[Required Documentation for PCI DSS](required-documentation-for-pci-dss.md)

[PCI DSS v4.0.1 Checklist](pci-dss-v4-0-1-checklist.md)

[Example Evidence for Not Monitored Controls (PCI DSS v4.0.1 )](example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md)

## Related articles

- [Required Documentation for PCI DSS](required-documentation-for-pci-dss.md)
- [PCI DSS v4.0](pci-dss-v4-0.md)
- [PCI DSS v4.0.1 Updates: What You Need to Know](pci-dss-v4-0-1-updates-what-you-need-to-know.md)
- [Example Evidence for Not Monitored Controls (PCI DSS v4.0.1 )](example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md)
- [PCI DSS v4.0.1 Checklist](pci-dss-v4-0-1-checklist.md)

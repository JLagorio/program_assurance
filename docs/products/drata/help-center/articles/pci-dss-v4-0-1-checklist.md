# PCI DSS v4.0.1 Checklist

Source: https://help.drata.com/en/articles/11725681-pci-dss-v4-0-1-checklist
Collection: Framework Information › PCI DSS
Updated: 2026-08-17
Fetched: 2026-11-22
Description: A checklist for achieving PCI DSS within Drata

## Article text

We recommend completing the following checklist in sequential order as you work toward your Payment Card Industry Data Security Standard (PCI DSS) v4.0.1 audit. The items listed below are applicable after you have successfully connected your systems in Drata:

**Before initiating the steps below, you must first identify your PCI compliance level, because the requirements and validation methods differ depending on the level which are defined by payment brands (Visa, Mastercard, etc.)**

## For Merchants

| **Level** | **Criteria** | **Validation** |
|---|---|---|
| Level 1 | >6M transactions annually (or suffered a breach) | Annual QSA audit + quarterly ASV scans |
| Level 2 | 1M-6M transactions | SAQ + quarterly ASV scans |
| Level 3 | 20K-1M e-commerce transactions | SAQ + quarterly ASV scans |
| Level 4 | <20K e-commerce OR <1M overall | SAQ recommended, ASV may be required by acquirer |

## For Service Providers

| **Level** | **Criteria** | **Validation** |
|---|---|---|
| Level 1 | >300K transactions annually | Annual QSA audit + quarterly scans |
| Level 2 | <300K transactions | SAQ-D or QSA-required, varies by acquirer |

## PCI DSS v4.0.1 Compliance Validation Requirements by Level

| **Requirement Category** | **Level 1 Merchants & Service Providers** | **Level 2 - 4 Merchants & Service Providers** |
|---|---|---|
| Validation Method | Annual Report on Compliance (ROC) performed by a Qualified Security Assessor (QSA) or a PCI SSC-certified Assessor. This involves a mandatory on-site audit. | Annual Self-Assessment Questionnaire (SAQ) completed internally. The specific SAQ form depends on how the entity handles cardholder data. |
| External Vulnerability Scans | Required: Quarterly external network scans by an Approved Scanning Vendor (ASV). | Often Required: Quarterly external network scans by an Approved Scanning Vendor (ASV), particularly if the Cardholder Data Environment (CDE) is exposed to the internet. This is a common requirement from acquiring banks/card brands even if not explicitly mandated for all SAQ types by PCI SSC for these levels. |
| Internal Vulnerability Scans | Required: Regular internal vulnerability scans. | Required: Regular internal vulnerability scans. |
| Attestation of Compliance (AOC) | Required: A signed AOC by a senior executive, submitted along with the ROC. | Required: A signed AOC by a senior executive, usually submitted annually along with the completed SAQ to the acquiring bank or relevant card brands. |
| QSA Engagement | Mandatory: A QSA (or ISA) must conduct the annual on-site assessment and produce the ROC. | Optional/Recommended: A QSA is not typically mandated for the annual validation, but can be engaged to assist with scoping, gap analysis, SAQ completion, or readiness assessments. |

**Note:** You can download the necessary SAQ and AOC documents from the[PCI SSC Document Library](https://www.pcisecuritystandards.org/document_library/).

## PCI DSS v4.0.1 Checklist

1. Complete and approve all [policies](policies-to-framework-summary.md) relevant to PCI DSS v4.0.1 in the Drata Platform. The standard requires a comprehensive information security policy that is established, published, and maintained and disseminated to all relevant personnel.
   1. Define and Validate your PCI DSS Scope
      1. **Document Cardholder Data Environment (CDE):** Clearly identify and document all system components, networks, applications, and personnel that interact with cardholder data during its transmission, processing, or storage.
      2. **Identify Connected-to and Security-Impacting Systems**: Include system components that may not handle CHD/SAD but have unrestricted connectivity to the CDE, provide security services, facilitate segmentation, or could otherwise impact the security of the CDE.
      3. **Document Data Flows:** Maintain accurate network and data-flow diagrams to show all connections and account data flows across systems and networks.
      4. **Confirm Scope Annually:** The entity must confirm the accuracy of its PCI DSS scope at least once every 12 months and upon significant change. Service providers must do this every six months.
      5. **Consider Segmentation:** While not a requirement, segmenting the CDE from the rest of the network is strongly recommended to reduce the scope and cost of a PCI DSS assessment. If used, segmentation controls must be tested regularly.
   2. Review the [Required Documentation for PCI DSS](required-documentation-for-pci-dss.md) and ensure they are drafted, reviewed, and approved in your [Policy Center](https://app.drata.com/governance/policies).
2. Validate the 12 Key Controls by Requirement in the Drata Platform
   1. Network Security
   2. Secure Configurations
   3. Data Storage Protection
   4. Data Transmission Protection
   5. Malware Protection
   6. Secure Development and Maintenance
   7. Access Management
   8. Identification and Authentication
   9. Physical Access Control
   10. Logging and Monitoring
   11. Security Testing
   12. Organizational Policies and Programs
3. Address Supplemental Requirements (if applicable)
   1. Appendix 1: Additional PCI DSS Requirements for Multi-Tentant Service Providers
   2. Appendix 2: Additional PCI DSS Requirements for Entities Using SSL/Early TLS
   3. Appendix 3: Designated Entities Supplemental Validation (DESV), which applies only to entities designated by a payment brand or acquirer.
4. Upload evidence for “[Not Monitored Controls (PCI DSS v4.0.1 )](example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md)”.
   1. Note: this may be a larger level of effort depending on the scope and size of your organization
5. Obtain and Review PCI DSS v4.0.1 Documentation
   1. Download the latest **PCI DSS v4.0.1 standard** and **Self-Assessment Questionnaire (SAQ)** or **Report on Compliance(ROC)** template (depending on your compliance level).
   2. Please review the link for relevant PCI DSS documents: [https://www.pcisecuritystandards.org/document_library/](https://www.pcisecuritystandards.org/document_library/)

## Glossary

| **Term** | **Definition** |
|---|---|
| **Acquirer** | Also referred to as “merchant bank,” “acquiring bank,” or “acquiring financial institution.” Entity, typically a financial institution, that processes payment card transactions for merchants and is defined by a payment brand as an acquirer. Acquirers are subject to payment brand rules and procedures regarding merchant compliance. |
| **AOC (Attestation of Compliance)** | The official PCI SSC form for merchants and service providers to attest to the results of a PCI DSS assessment, as documented in a Self-Assessment Questionnaire (SAQ) or Report on Compliance (ROC). |
| **ASV (Approved Scanning Vendor)** | Company approved by the PCI SSC to conduct external vulnerability scanning services. |
| **CDE (Cardholder Data Environment)** | The system components, people, and processes that store, process, or transmit cardholder data and/or sensitive authentication data. It also includes systems that may not store/process CHD/SAD but have unrestricted connectivity to systems that do. |
| **CHD (Cardholder Data)** | At a minimum, cardholder data consists of the full Primary Account Number (PAN). It may also include the cardholder name, expiration date, and/or service code. |
| **Merchant** | An entity that accepts payment cards bearing PCI SSC Participating Payment Brand logos as payment for goods/services. A merchant can also be a service provider if they store/process/transmit cardholder data for others. |
| **Multi-Tenant Service Provider** | A third-party provider offering shared services to multiple clients, such as SaaS, hosting, or payment gateway access. Customers share infrastructure, servers, or applications. |
| **PAN (Primary Account Number)** | Unique payment card number (credit, debit, or prepaid cards, etc.) that identifies the issuer and the cardholder account. |
| **Penetration Testing** | A distinct and crucial security testing method required by PCI DSS. |
| **QSA (Qualified Security Assessor)** | Companies qualified by the PCI SSC to validate compliance with PCI DSS. Requirements are detailed in the QSA Qualification Requirements. |
| **ROC (Report on Compliance)** | A reporting tool used to document detailed PCI DSS assessment results for an entity, typically conducted by a QSA. |
| **Sensitive**<br>**Authentication Data**<br>**(SAD)** | Security-related information used to authenticate cardholders and/or authorize payment card transactions. This information includes, but is not limited to, card verification codes, full track data (from magnetic stripe or equivalent on a chip), PINs, and PIN blocks. |
| **SAQ (Self-Assessment Questionnaire)** | A reporting tool used by entities to document results from a self-conducted PCI DSS assessment. |
| **Service Provider** | A non-payment brand entity that stores, processes, or transmits CHD/SAD on behalf of another. Includes payment gateways, managed service providers, and hosting providers. |
| **Vulnerability** | Flaw or weakness which, if exploited, may result in an intentional or unintentional compromise of a system. |
| **Vulnerability Scan (Internal/External)** | A general definition of vulnerability scanning, including the distinction between internal and external. |

## Related articles

- [Required Documentation for PCI DSS](required-documentation-for-pci-dss.md)
- [PCI DSS v4.0](pci-dss-v4-0.md)
- [PCI DSS v4.0.1 Updates: What You Need to Know](pci-dss-v4-0-1-updates-what-you-need-to-know.md)
- [Example Evidence for Not Monitored Controls (PCI DSS v4.0.1 )](example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md)
- [PCI DSS v4.0.1 Responsibility Matrix Guidance](pci-dss-v4-0-1-responsibility-matrix-guidance.md)

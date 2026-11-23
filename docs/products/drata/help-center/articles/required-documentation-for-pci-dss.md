# Required Documentation for PCI DSS

Source: https://help.drata.com/en/articles/6038558-required-documentation-for-pci-dss
Collection: Framework Information › PCI DSS
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

PCI DSS is probably the most critical compliance standard your organization will need to comply with if your organization processes payment card transactions or has customers who process payment card transactions. If your organization does not comply with PCI, you may lose authorization to process these transactions or, if you don’t process transactions, you may lose the business of customers who rely on your service for their own transaction processing activities. Part of complying with PCI will involve producing significant amounts of documentation related to managing your IT environment. This documentation will be used to support your answers if you are filling out a PCI DSS Self-Assessment Questionnaire (SAQ) or support your auditor’s testing if you are required to have a PCI on-site assessment performed (QSA assessment or Report on Compliance (ROC)).

To help determine what documentation is required when completing a PCI SAQ or ROC, we have read through PCI SAQ D, the assessment guidance for PCI ROCs, and outside sources.

The table below contains the documentation required for each of the 12 PCI DSS requirements outlined by the PCI Security Standards Council.

| PCI Requirement | Documentation Required |
|---|---|
| 1. Install and maintain a firewall configuration to protect cardholder data | - Firewall and router configuration standards for your organization<br>- Network diagram showing how the network is segmented (such as through the use of DMZs, etc.)<br>- Data flow diagrams showing how data flows into and out of the Cardholder Data Environment<br>- Network policies/procedures which document who has access to the network, who is responsible for administration, etc.<br>- Most recent firewall/router rule review |
| 2. Do not use vendor-supplied defaults for system passwords and other security parameters | - Hardening procedures for in-scope network components (firewalls, routers, servers, databases, etc.)<br>- Policies/procedures which document a requirement to change vendor supplied default configurations where possible<br>- Asset inventory documenting the in-scope network assets<br>- Data retention policy/procedures<br>- Data disposal/deletion policies/procedures<br>- Data protection or storage policies/procedures |
| 3. Protect stored cardholder data | - Encryption policy or procedures which cover hard drive/disk encryption<br>- Encryption key management policy/procedures which include key lifecycle management procedures<br>- Key management/custodian acceptance form which covers the responsibilities of key custodians and requires sign offs |
| 4. Encrypt transmission of cardholder data across open, public networks | - Hardening procedures for in-scope network components (firewalls, routers, servers, databases, etc.)<br>- Encryption policy or procedures which cover the encryption algorithms and strengths used to transmit data within the network<br>- Network policies/procedures which document who has access to the network, who is responsible for administration, etc. |
| 5. Protect all systems against malware and regularly update anti-virus software or programs | - Antivirus policies or procedures or other documents which indicate the requirement for antivirus on endpoints and systems within the Cardholder Data Environment |
| 6. Develop and maintain secure systems and applications | - Software Development Life Cycle policies/procedures documenting a requirement for security during each phase of the development process<br>- Change management policy/procedures<br>- Security testing procedures for systems<br>- Vulnerability management policies/procedures<br>- System/software patching procedures |
| 7. Restrict access to cardholder data by business need-to-know | - Access control policy/procedures |
| 8. Identify and authenticate access to system components | - Access control policy/procedures<br>- Documented job duties and responsibilities for users with access to the Cardholder Data Environment |
| 9. Restrict physical access to cardholder data | - Physical access control policies/procedures including visitor identification procedures<br>- Policies/procedures for secure storage of media (removable media, hard disks, backup media, etc.)<br>- Policies/procedures for distributing media to employees<br>- Asset inventory and documented review containing media assets<br>- Media destruction policies/procedures<br>- (if your organization maintains payment card terminals) Policies/procedures for securing card reading devices<br>- (if your organization maintains payment card terminals) Inventory of payment card reading devices<br>- (if your organization maintains payment card terminals) Security awareness training materials for detecting tampering with payment card reading devices |
| 10. Track and monitor all access to network resources and cardholder data | - System monitoring policies/procedures documenting what is logged, required log fields, and frequency of log review |
| 11. Regularly test security systems and processes | - Policies and procedures covering detecting both authorized and unauthorized wireless devices<br>- Inventory of authorized wireless devices<br>- Incident response plan/procedures<br>- Internal network vulnerability scan results<br>- External network vulnerability scan results performed by a PCI Approved Scanning Vendor (ASV)<br>- Internal penetration test results<br>- External penetration test results |
| 12. Maintain a policy that addresses information security for all personnel | - Information Security Policy<br>- Risk Assessment Policy<br>- Completed Risk Assessment<br>- Acceptable Use and any other IT Resource Usage policies<br>- List of company approved products/services<br>- Incident Response Plan<br>- Security Monitoring procedures<br>- System Monitoring procedures<br>- Documented roles and responsibilities for network and security monitoring<br>- Documented Security Awareness Program<br>- HR policies and procedures related to managing personnel<br>- Third Party/Vendor Management policies and procedures<br>- Documented list of third parties used within the Cardholder Data Environment<br>- Incident Response Plan test |

This article was developed through the use of the following website: [https://www.pcidssguide.com/pci-dss-policy-and-procedure-documentation/](https://www.pcidssguide.com/pci-dss-policy-and-procedure-documentation/) along with consulting the assessor guidance provided by the PCI Security Standard Council.

## Related articles

- [PCI DSS v4.0](pci-dss-v4-0.md)
- [Example Evidence for Not Monitored Controls (PCI DSS v4.0.1 )](example-evidence-for-not-monitored-controls-pci-dss-v4-0-1.md)
- [PCI DSS v4.0.1 Targeted Risk Analysis (TRA)](pci-dss-v4-0-1-targeted-risk-analysis-tra.md)
- [PCI DSS v4.0.1 Checklist](pci-dss-v4-0-1-checklist.md)
- [PCI DSS v4.0.1 Responsibility Matrix Guidance](pci-dss-v4-0-1-responsibility-matrix-guidance.md)

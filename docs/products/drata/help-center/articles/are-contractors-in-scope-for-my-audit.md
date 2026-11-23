# Are Contractors in Scope for my Audit?

Source: https://help.drata.com/en/articles/5947523-are-contractors-in-scope-for-my-audit
Collection: Personnel Management › Personnel Compliance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

We understand that for a lot of organizations, especially in the early stages, hiring full-time employees might not be possible. One of the most common questions customers have is: “Are my contractors in scope for my audit?”. Ultimately, the decision on whether or not contractors will be included is up to your auditor. However, we want to go through each of the frameworks offered in Drata and explain when a contractor would usually be included within the audit so that when discussing this with your auditor, you can explain why you believe your contractors should or should not be in scope.

**SOC 2**

With SOC 2, the scope of the audit is a specific system along with any related business objectives and customer commitments. A contractor will be in scope for a SOC 2 report if they have an effect on the system being audited, your business objectives, or your customer commitments. Some questions you can ask yourself to help determine if a contractor is in scope are:

- Does the contractor interact with any customer data?
- Does the contractor support the system being audited?
- If the contractor does not interact with customer data or the system being audited, does their work directly impact the business objectives or customer commitments covered by this audit?

As an example, if your business hires a security consultant who only works on your information security policies and your risk assessment, they might not touch customer data or the system being audited, but they do affect your organization’s ability to meet its business objectives. Other examples would be a DevOps contractor. Since they directly interact with the system, they would be in scope, while a contractor who assists with logo design might not be in scope for SOC 2.

**ISO 27001**

With ISO 27001, the scope of the audit is your Information Security Management System (ISMS). The ISMS is a documented set of security controls which protect the confidentiality, integrity, and availability of your assets from threats and vulnerabilities. The most critical part of determining whether contractors will be in scope for ISO 27001 will be the documented scope of your ISMS. When defining your ISMS, you might exclude certain departments or systems from the scope of your ISMS. You might choose to include Management, Engineering, HR, Legal, and Security but exclude your Marketing and Sales departments from your ISMS. With that in mind, these are the questions you should ask when determining whether or not your contractors will be in scope for your ISO 27001 audit:

- Does your contractor belong to or support the portions of your ISMS you are considering in scope for the audit?
- Does your contractor support or interact with the assets being considered in scope for the audit?

An example for ISO 27001 would be if you have a contractor who is doing IT support for your organization, they will likely be in scope, but if some of your Sales personnel are contractors and you have excluded Sales from your ISMS, they will likely not be in scope for the audit.

**HIPAA**

HIPAA is a bit more difficult to determine when compared to SOC 2 or ISO 27001. The scope of HIPAA is electronic Protected Health Information (ePHI), but some requirements within HIPAA have the caveat “including, as appropriate, contractors” or similar language. Since the “as appropriate” is not defined anywhere, it makes determining whether or not contractors are in scope more difficult. We suggest working with your auditor more closely if you plan to undergo a HIPAA audit and have questions about whether or not your contractors are in scope, but in general, the main question you should ask yourself is:

- Does the contractor have access to ePHI or have the potential to access ePHI?

As an example, if you hire a contractor who helps to maintain your file server, they will be in scope since they have the potential to access ePHI, while a contractor you’ve hired as a security guard to patrol your facilities will likely not be in scope.

**PCI**

Finally, PCI is a bit more straightforward. In general, the scope of PCI is limited to your “Cardholder Data Environment (CDE)”. If a contractor has access to cardholder data, they will be in scope for PCI. There is one exception to this, if you have an office or other facility then PCI SAQ D’s requirement 9.2 requires that procedures are established to identify “on-site” personnel, which includes contractors, and distinguish them from visitors. This is usually done in the form of ID badges. So the main questions you should ask yourself when determining if contractors are in scope are:

- Does the contractor have access to payment card or transaction data?
- Do we have a physical facility?

An example here would be if you have a contractor that you have hired to assist with implementing a data warehouse to analyze transactions, they will likely be in scope. On the other hand, a contractor who assists with marketing communications will be out of scope **unless **you have a physical location, in which case that contractor will need an ID Badge.

## Related articles

- [Risk Treatment Plan Guidance](risk-treatment-plan-guidance.md)
- [How do Bring Your Own Device (BYOD) Devices Affect my Audit?](how-do-bring-your-own-device-byod-devices-affect-my-audit.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [DCF Library Updates on 1/18/2024](dcf-library-updates-on-1-18-2024.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)

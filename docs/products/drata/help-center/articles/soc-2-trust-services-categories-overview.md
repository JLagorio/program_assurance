# SOC 2 Trust Services Categories Overview

Source: https://help.drata.com/en/articles/5947518-soc-2-trust-services-categories-overview
Collection: Framework Information › SOC 2 2017
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

A fundamental initial step in the SOC 2 certification process involves identifying the relevant Trust Services Categories (TSCs) for your organization. This crucial choice establishes the boundaries of your audit, determining which controls will be assessed and subsequently presented to your clients.

The SOC 2 framework comprises five distinct TSCs, each focusing on a specific dimension of data and system management:

- Security (Common Criteria)
- Availability
- Confidentiality
- Processing Integrity
- Privacy

Only the Security category is required for every SOC 2 report. It acts as the foundation for the other categories and is often called the "Common Criteria" because its controls support and overlap with all the others.

While including all five Trust Services Categories might seem like a way to create a more complete report, it's not always necessary or the most strategic choice. Deciding which categories to include should be a thoughtful business decision based on your customer needs, the services you provide, and conversations with your auditor.

This guide breaks down each category and offers key things to consider as you define the right scope for your SOC 2 report.

**Security (Common Criteria): The Mandatory Foundation**

The Security TSC is the non-negotiable core of every SOC 2 report. It focuses on protecting systems and data from unauthorized access, disclosure, and damage that could impact availability, integrity, confidentiality, or privacy. It's often referred to as the "Common Criteria" because its control requirements overlap with every other category.

**What it covers:** Security lays the groundwork for your overall security posture. Auditors will assess both your baseline controls and the maturity of your program. Focus areas include:

- **Logical and Physical Access Controls:** How you prevent unauthorized access to infrastructure and data.
- **Change Management:** How you authorize, test, and approve system changes.
- **System Operations:** How you monitor systems, manage vulnerabilities, and respond to incidents.
- **Risk Management:** Your process for identifying, assessing, and mitigating risks.

**Scoping Consideration:**

Since Security is required for all SOC 2 reports, this part of your scope is already set. All organizations must be ready to show effective implementation of these controls.

**Availability: The Assurance of Uptime and Resilience**

The Availability TSC focuses on whether your systems are available for use as promised. It's not just about avoiding downtime, it’s about showing you have the infrastructure and processes to stay resilient.

**What it covers:** Auditors will evaluate how you ensure consistent performance and recover quickly from disruptions. Key controls include:

- **Performance and Capacity Monitoring:** Ensuring systems can handle current and future demand.
- **Data Backup and Recovery:** How you back up and restore critical data.
- **Business Continuity and Disaster Recovery (BC/DR):** The design, testing, and effectiveness of your recovery plans.

**Scoping Consideration**

Consider including Availability if:

- Your customers rely on your service being consistently online to run their own operations.
- You've made uptime or performance commitments in contracts or SLAs.
- A service disruption would significantly impact your customers.

Including Availability in your report can demonstrate operational maturity and reinforce customer confidence in your ability to deliver reliable services.

**Confidentiality: Protecting Sensitive Information**

The Confidentiality TSC addresses how you protect sensitive data from unauthorized disclosure, especially when the data is defined as confidential by contracts, law, or internal policy.

**What it covers:** This category looks at how you protect confidential data across its lifecycle:

- **Data Classification:** How you identify and label sensitive information.
- **Access Controls and Encryption:** Ensuring only authorized users can access data, both at rest and in transit.
- **Secure Data Disposal:** How you safely dispose of data you no longer need.

**Scoping Consideration**

Confidentiality is worth including if your service involves:

- Customer intellectual property or proprietary data.
- Information under NDAs.
- Data that could cause harm if leaked (financial, reputational, or competitive).

This TSC can provide targeted assurance to customers who trust you with sensitive business information.

**Privacy: Safeguarding Personal Information**

The Privacy TSC specifically addresses how you collect, use, retain, disclose, and dispose of Personally Identifiable Information (PII), based on your privacy notice and AICPA criteria.

**A note on scoping:** A SOC 2 report with the Privacy TSC is a valuable way to demonstrate your commitment to data privacy, but it does not replace formal compliance with regulations like GDPR, CCPA, or HIPAA. While there’s overlap, additional audits or frameworks may be needed to fully demonstrate legal compliance. Discuss these options with your auditor.

**What it covers:** Privacy controls focus on how your organization handles PII:

- **Notice and Communication:** How clearly your privacy practices are disclosed.
- **Choice and Consent:** How users give and manage consent for data use.
- **Data Subject Rights:** How individuals can access, update, or request deletion of their data.

**Scoping Consideration**

Consider adding the Privacy TSC if:

- You collect or process significant volumes of PII from customers or their end users.
- You want to proactively demonstrate strong privacy practices beyond just breach prevention.

Including Privacy can help you establish trust, especially in industries where personal data is central to your business model.

**Processing Integrity: Ensuring Accuracy and Reliability**

The Processing Integrity TSC verifies that your system performs as intended, processing data accurately, completely, and without error or manipulation.

**What it covers:** This category is highly dependent on the nature of your system. Auditors will work with you to tailor the scope. Common control areas include:

- **Input Controls:** Ensuring the accuracy and completeness of incoming data.
- **Processing Controls:** Validating that transactions and operations function as intended.
- **Output Controls:** Making sure processing results are correct and delivered appropriately.
- **Regression Testing:** Confirming that changes don’t disrupt existing processing functions.

**Scoping Consideration**

Processing Integrity is a strong fit if:

- Your system performs key calculations, transformations, or transactions.
- Errors could create significant financial, legal, or operational risks for your customers.
- Your customers rely on your outputs being accurate and trustworthy.

Adding this TSC is especially relevant for services where correctness and consistency of outputs is business-critical.

### At-a-Glance Summary of SOC 2 Trust Services Categories

| **Category** | **Focus Area** | **When to Consider Including** | **Example Scenarios** |
|---|---|---|---|
| **Security** | Foundational controls across all areas | **Always included** (mandatory) | You need a baseline security posture—access control, logging, risk. |
| **Availability** | Uptime, performance, disaster recovery | Customers depend on consistent access or you have SLAs around uptime | Systems with high availability expectations or real-time access. |
| **Confidentiality** | Protecting sensitive or proprietary data | You manage sensitive internal or customer-provided information | Source code, business plans, financial data, proprietary algorithms. |
| **Privacy** | Handling of personally identifiable data | You collect or process personal data from individuals | Registration forms, customer profiles, user-submitted content. |
| **Processing Integrity** | Accuracy and reliability of data processing | Outputs or transactions must be correct and dependable | Calculations, billing systems, workflow engines, analytics tools. |

### Leveraging Your Auditor for Scoping Guidance

If you are uncertain about which TSCs to include, your audit firm is your most valuable resource. Engaging them early in the process will help ensure your SOC 2 report is properly aligned with your business objectives and customer expectations. An experienced auditor can provide guidance on tailoring the scope and controls to your specific environment, helping you create a meaningful report while avoiding unnecessary effort.

## Related articles

- [SOC 2: All controls](soc-2-all-controls.md)
- [SOC 2 Background Checks FAQs](soc-2-background-checks-faqs.md)
- [SOC 2 Checklist](soc-2-checklist.md)
- [Set SOC 2 Trust Service Criteria to Security Only](set-soc-2-trust-service-criteria-to-security-only.md)
- [Scope Determination Checklist for Compliance Audits](scope-determination-checklist-for-compliance-audits.md)

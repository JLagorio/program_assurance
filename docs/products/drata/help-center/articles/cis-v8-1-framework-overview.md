# CIS v8.1 Framework Overview

Source: https://help.drata.com/en/articles/11145651-cis-v8-1-framework-overview
Collection: Framework Information › CIS 8.1
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

CIS Controls Version 8.1 (CIS v8.1) is a set of best practices developed by the Center for Internet Security to improve cybersecurity and protect IT systems and data.

While not mandatory, CIS v8.1 is widely recognized for helping organizations strengthen security and reduce the risk of cyberattacks. CIS v8.1 offers a practical and cost-effective solution for improving cybersecurity.

## Key Points about CIS v8.1

CIS v8.1 refines the original version with updated guidelines to address new threats and technologies, offering clarifications and improvements rather than a complete overhaul.

**The 18 CIS Controls:**
CIS v8.1 includes 18 critical security controls, organized into three categories:

- **Basic Controls (1–6):** Focus on essential cybersecurity hygiene.
- **Foundational Controls (7–16):** Address more advanced cybersecurity practices.
- **Organizational Controls (17–18):** Focus on management, training, and governance.

**Control Structure:**
The CIS Controls provide prioritized, actionable guidance to strengthen cybersecurity. Each control is divided into sub-controls designed to reduce the most common and impactful risks.

**Purpose of CIS Controls:**

- Identify and Mitigate Risks: Help organizations identify and reduce cybersecurity vulnerabilities.
- Implement Best Practices: Based on real-world data, the controls make implementation easier.
- Prioritize Security Measures: The controls guide organizations to focus on the most critical security activities first.

## CIS v8.1: Control Categories, Sub-Controls, and IG Levels

CIS Controls v8.1 are structured into three categories—Basic (Controls 1–6), Foundational (Controls 7–16), and Organizational (Controls 17–18)—representing a progression from essential security practices to more advanced and strategic defenses. Each control is further broken down into sub-controls, which are specific, actionable safeguards that guide implementation.

To help organizations prioritize, each sub-control is assigned to an Implementation Group (IG):

- **IG1** is for smaller or less complex organizations with limited cybersecurity resources. It focuses on essential cyber hygiene to defend against the most common threats.
- **IG2** builds on IG1 by adding safeguards for organizations with dedicated IT staff, moderate complexity, and a greater risk profile.
- **IG3** includes all of IG1 and IG2, and adds advanced protections for larger or high-risk organizations handling sensitive or regulated data.

The IGs are cumulative—meaning IG2 includes all IG1 sub-controls, and IG3 includes everything from IG1 and IG2. This flexible, scalable approach allows organizations to implement controls based on their current maturity and grow their security posture over time.

### Basic Controls (Controls 1–6)

*(Recommended for IG1, IG2, and IG3 – foundational for all organizations)*

1. Inventory and Control of Enterprise Assets *(7 sub-controls)
* Ensure only authorized hardware assets are allowed on the network.

- IG1: Maintain a current asset inventory.
- IG2–3: Automate asset discovery and enforce access policies.

2. Inventory and Control of Software Assets *(7 sub-controls)
* Track and control all software to prevent unauthorized programs.

- IG1: Maintain a list of approved software.
- IG2–3: Use allowlisting and automation tools.

3. Data Protection *(14 sub-controls)
* Protect sensitive data in transit, at rest, and in use.

- IG1: Basic encryption and access control.
- IG2: Add integrity checks and backups.
- IG3: Implement data loss prevention (DLP) and advanced monitoring.

4. Controlled Use of Administrative Privileges *(9 sub-controls)
* Restrict and monitor the use of admin privileges.

- IG1: Limit admin accounts.
- IG2: Implement multifactor authentication (MFA).
- IG3: Log and analyze admin actions continuously.

5. Secure Configuration for Hardware and Software *(12 sub-controls)
* Harden system configurations to reduce attack surfaces.

- IG1: Apply security baselines.
- IG2–3: Use configuration management tools and conduct regular audits.

6. Maintenance, Monitoring, and Analysis of Audit Logs *(9 sub-controls)
* Collect and review logs to detect suspicious activity.

- IG1: Enable logging on critical systems.
- IG2–3: Use centralized logging, SIEM tools, and correlation rules.

### Foundational Controls (Controls 7–16)

*(Recommended for IG2 and IG3 – enhances core protections)*

7. Email and Web Browser Protections *(5 sub-controls)
* Defend against phishing and web-based threats.

- IG2: Apply email filtering and browser security settings.
- IG3: Implement sandboxing and advanced threat protection.

8. Malware Defenses *(4 sub-controls)
* Detect and respond to malicious software.

- IG2: Use antivirus with auto-updates.
- IG3: Deploy endpoint detection and response (EDR).

9. Limitation and Control of Network Ports, Services, and Protocols *(8 sub-controls)
* Reduce exposure by disabling unnecessary services.

- IG2: Conduct regular port scans.
- IG3: Implement network segmentation and dynamic control policies.

10. Data Recovery Capabilities *(5 sub-controls)
* Ensure recoverability after an incident.

- IG2: Automate backups and test restores.
- IG3: Integrate into business continuity and disaster recovery (BC/DR) plans.

11. Secure Configuration for Network Devices *(6 sub-controls)
* Harden routers, firewalls, and switches.

- IG2: Use secure management protocols.
- IG3: Automate configuration compliance.

12. Boundary Defense *(10 sub-controls)
* Control traffic between internal and external networks.

- IG2: Deploy firewalls and intrusion detection systems.
- IG3: Use network access control (NAC) and threat intelligence.

13. Security Awareness and Skills Training *(7 sub-controls)
* Train users to recognize and avoid threats.

- IG2: Conduct periodic training.
- IG3: Simulate phishing and provide role-based training.

14. Service Provider Management *(6 sub-controls)
* Manage third-party risks.

- IG2: Assess vendor security practices.
- IG3: Include SLAs and compliance clauses in contracts.

15. Application Software Security *(9 sub-controls)
* Secure development and maintenance of software.

- IG2: Follow secure coding standards.
- IG3: Perform code reviews and automated testing.

16. Account Monitoring and Control (6 sub-controls)

Actively manage user accounts to prevent misuse through proper creation, use, and removal.

- IG2: Disable dormant accounts and enforce account lockout.
- IG3: Monitor account activity and implement alerts for anomalies.

### Organizational Controls (Controls 17–18)

*(Primarily for IG3 – comprehensive oversight and validation)*

17. Incident Response Management *(7 sub-controls)
* Establish and test response plans.

- IG3: Conduct tabletop exercises and forensic analysis.

18. Penetration Testing *(7 sub-controls)
* Simulate attacks to evaluate defenses.

- IG3: Schedule regular penetration tests and red teaming.

## How CIS v8.1 Fits with Other Frameworks:

CIS v8.1 is often used in conjunction with other security frameworks such as SOC 2, NIST, ISO 27001, and others. It provides actionable, practical steps to mitigate risks, which can be applied within the broader context of compliance frameworks like SOC 2 or ISO 27001.

## Is there a CIS v8.1 Certification?

There is no official CIS certification, but organizations can self-assess their compliance with the CIS Controls using tools like the [CIS Controls Self-Assessment Tool (CSAT)](https://learn.cisecurity.org/cis-cat-lite)or undergo an external audit to verify their implementation.

While a third-party audit can validate adherence to the controls, it does not result in formal certification from CIS. Implementing CIS Controls is a continuous process that requires ongoing monitoring, assessments, and improvements.

For official certification of security practices, organizations may pursue frameworks like ISO 27001 or SOC 2, using CIS v8.1 to guide and enhance their internal security measures.

CIS v8.1 framework is suitable for organizations of all sizes, including small businesses, large companies, and government or educational institutions. Its flexibility and focus on critical controls make it especially useful for small to medium-sized businesses that may not have the resources for more complex security frameworks.

## Related articles

- [Test 257: Azure PostgreSQL Database Server Log Checkpoints](test-257-azure-postgresql-database-server-log-checkpoints.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [HITRUST e1/i1 Overview](hitrust-e1-i1-overview.md)
- [ACSC Essential Eight Overview](acsc-essential-eight-overview.md)
- [Cyber Essentials v3.2: What’s Changed and How to Prepare](cyber-essentials-v3-2-what-s-changed-and-how-to-prepare.md)

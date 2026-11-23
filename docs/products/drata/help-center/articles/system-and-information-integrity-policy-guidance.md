# System and Information Integrity Policy Guidance

Source: https://help.drata.com/en/articles/11140776-system-and-information-integrity-policy-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the System and Information Integrity Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “**[ ]**” below the statements of the policy.

## System and Information Integrity Policy

## [COMPANY NAME]

__________________________________________________________________

## Purpose

To ensure that [COMPANY NAME] resources and information systems are established with system integrity monitoring to include areas of concern such as malware, application and source code flaws, industry supplied alerts and remediation of detected or disclosed integrity issues.

## Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Please see here for more guidance on roles and responsibilities: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). For example, “Who is responsible for updating, reviewing, and maintaining this policy?” The statement may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

## Policy

## Flaw Remediation

[COMPANY NAME] identifies information systems containing software affected by recently announced software flaws (and potential vulnerabilities resulting from those flaws).

[COMPANY NAME] will:

- Identify, report, and correct information system flaws.
- Test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation.
- Install security-relevant software and firmware updates within [entity defined time period] of the release of the updates.
- Incorporate flaw remediation into the configuration management process.
- Employ automated mechanisms [entity defined frequency] to determine the state of information system components with regard to flaw remediation.

**[This section describes the steps you should take to identify, report, correct, and manage information system flaws. Examples of automated tools include Tenable.io, Rapid 7, Microsoft Defender, etc.]**

## Malicious Code Protection

[COMPANY NAME] will:

- Employ malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code.
- Update malicious code protection mechanisms whenever new releases are available in accordance with configuration management policy and procedures.
- Configure malicious code protection mechanisms to:
- Perform periodic scans of the information system [entity defined frequency] and real-time scans of files from external sources at endpoint; network entry/exit points as the files are downloaded, opened, or executed in accordance with the security policy.
- Block malicious code; quarantine malicious code; send alert to administrator; [entity defined action] in response to malicious code detection.
- Address the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.

**[This section could be modified to explain your malicious code protection tools that you have implemented. Examples of automated malicious code protection mechanisms: Endpoint Security (Antivirus, EDR, XDR), Network Security (Firewalls, IPS, DNS Filtering), Email & Web Security.]**

## Information System Monitoring

[COMPANY NAME] will:

- Monitor information systems to automatically detect: attacks and indicators of potential attacks; and, unauthorized local, network, and remote connections.
- Identify unauthorized use of the information system through defined techniques and methods.
- Deploy monitoring devices strategically within the information system to collect **<TYPE OF ESSENTIAL INFORMATION>** and at ad hoc locations within the system to track specific types of transactions of interest to the entity.

**[Examples of Type of Essential Information include, System & Security Logs, Network Traffic Data, Threat Intelligence Data, etc.]**

- Protect information obtained from intrusion-monitoring tools from unauthorized access, modification, and deletion.
- Heighten the level of information system monitoring activity whenever there is an indication of increased risk to operations and assets, individuals, other organizations, or based on law enforcement information, intelligence information, or other credible sources of information.
- Obtain legal opinion with regard to information system monitoring activities in accordance with applicable state and federal laws, directives, policies, or regulations.
- Provide information system monitoring information to authorized personnel or business units as needed.

**[This section details how to detect and respond to security incidents in a timely manner to protect the integrity, confidentiality, and availability of information assets.]**

## System Generated Alerts

[COMPANY NAME] will ensure that system-generated alerts that may be generated from a variety of sources (e.g., audit records or inputs from malicious code protection mechanisms, intrusion detection or prevention systems, firewalls, gateways, and routers) will be disseminated to authorized personnel or business units that must take appropriate action on the alert(s).

Alerts will be transmitted by **<MODE OF TRANSMISSION>** as required. Personnel on the notification list can include system administrators, mission/business owners, system owners, or information system security officers.

**[Mode of Transmission refers to how alerts are delivered or communicated from System Generated tools. (e.g., Email Notification, Dashboard Alerts).]**

**[This section should describe how your organization leverages its security monitoring tools. For example, Security Information and Event Management (SIEM) solution, endpoint detection and response (EDR) platforms, intrusion detection/prevention systems (IDS/IPS), firewalls, cloud security tools, and other log management solutions to generate, correlate, and respond to system alerts from various sources.]**

## Security Alerts, Advisories, and Directives

[COMPANY NAME] will:

- Receive information system security alerts, advisories, and directives from [entity defined external organizations] on an ongoing basis.
- Generate internal security alerts, advisories, and directives as deemed necessary.
- Disseminate security alerts, advisories, and directives, as applicable, to:
   - **<PERSONNEL OR ROLES>**
   - **<BUSINESS ENTITIES>**
   - **<EXTERNAL ORGANIZATIONS>**
- Implement security directives in accordance with established time frames, or notify the issuing organization of the degree of noncompliance.

**[Describe how alerts are communicated to relevant personnel, internal teams, and external stakeholders or partners detailing the methods, channels, and escalation paths used to ensure timely awareness and coordinated response.]**

## Software, Firmware, and Information Integrity

[COMPANY NAME] will:

- Employ integrity verification tools to detect unauthorized changes to applicable software, firmware, and information.
- Ensure the information system performs an integrity check of the applicable software, firmware, and information at startup, periodically, and/or when necessary.
- Incorporate the detection of unauthorized changes into the incident response capability.

**[This section describes employing File Integrity Monitoring (FIM) Tools to ensure systems are monitored, trusted, and recoverable from unauthorized modifications or attacks.]**

## Hardware Integrity

[COMPANY NAME] will:

- Verify the integrity of hardware components through specific methods (e.g., hard-to-copy labels, verifiable serial numbers, numbers provided by developers, and anti-tamper technologies).
- Incorporate the detection of unauthorized changes into the incident response capability.

**[This section is specific to the NIST Cybersecurity Framework.]**

## Spam Protection

[COMPANY NAME] will employ spam protection mechanisms at information system entry and exit points to detect and take action on unsolicited messages. Spam protection mechanisms will be automatically updated and centrally managed.

**[Examples for Spam Protection tools include, Microsoft Defender, Proofpoint, Mimecast, etc.]**

## Information Input Validation

[COMPANY NAME] will ensure the information system automatically:

- Incorporate the detection of unauthorized changes to the information system into the incident response capability.
- Checks the validity of information inputs.
- Restricts the use of the manual override capability to designated personnel only.
- Audits the use of the manual override capability.
- Reviews and resolves input validation errors.
- Behaves in a predictable and documented manner that reflects system objectives when invalid inputs are received.

**[Configure systems to automatically detect unauthorized changes, validate inputs, and handle invalid data in a consistent, documented way that aligns with your system’s intended behavior.]**

## Error Handling 

[COMPANY NAME] will ensure the information system:

- Generates error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries.
- Reveals error messages only to designated personnel or roles.

**[Configure systems to display error messages that help fix problems without exposing sensitive system details.]**

## Information Handling and Retention

[COMPANY NAME] will manage information within the information system and its outputs in accordance with applicable laws, regulations, policies, and other obligations.

**[This section describes that data collected, stored, and processed will be handled in compliance with applicable laws and regulations.] **

## Memory Protection

[COMPANY NAME] will ensure the information system has security safeguards to protect its memory from unauthorized code execution.

**[This section describes that systems will have built-in security features to prevent hackers or malicious software from injecting or running unauthorized code in the system’s memory.] **

**Revision History **

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Related articles

- [Acceptable Use Policy Guidance](acceptable-use-policy-guidance.md)
- [Vulnerability Management Policy Guidance](vulnerability-management-policy-guidance.md)
- [Logging and Monitoring Policy Guidance](logging-and-monitoring-policy-guidance.md)
- [System Security Planning Policy Guidance](system-security-planning-policy-guidance.md)
- [Maintenance Management Policy Guidance](maintenance-management-policy-guidance.md)

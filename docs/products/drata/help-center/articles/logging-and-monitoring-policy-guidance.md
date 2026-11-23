# Logging and Monitoring Policy Guidance

Source: https://help.drata.com/en/articles/9829067-logging-and-monitoring-policy-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

**Logging and Monitoring Policy**

**[COMPANY NAME]**

**____________________________________________________________________________**

**Purpose**

The purpose of this policy is to outline requirements for audit logging and monitoring of system activity at [COMPANY NAME]. Frequent monitoring and maintenance of audit trails are required to effectively assess information system controls, operations, and general security.

**Scope**

This policy applies to all [COMPANY NAME] system components including applications, infrastructure (including cloud infrastructure), network, security tools and utilities, or any other components that could impact the security of [COMPANY NAME] and the data it manages and processes.

**Roles & Responsibilities **

**<ROLES AND RESPONSIBILITIES>**

**-[Additional guidance on what roles and responsibilities to list in this policy can be found here: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

## Section

## Event Logs

All [COMPANY NAME] systems that may access or handle sensitive information, accept network connections, manage access control (authentication and authorization), or that may affect the security of the environment (e.g., anti malware utilities, firewalls, etc.) will record and retain audit-logging information sufficient to answer: What activity was performed? Who performed it? Where, when, and how (with what tools) was it performed? And, what was the status, outcome, or result of the activity?

Logged Activities

Log records will be created for the following activities:

- Attempts to create, read, update, or delete sensitive information, confidential authentication information such as passwords;
- Attempts to create, update, or delete information not covered in above;
- Initiating a network connection;
- Accepting a network connection;
- User authentication and authorization for activities covered above such as user login and logout;
- All invalid logical access attempts;
   All actions taken by any individual with administrative access, including any interactive use of application or system accounts.
- Attempts to grant, modify, or revoke access rights, including adding a new user or group, changing user privilege levels, changing file permissions, changing database object permissions, elevation of privileges, modifications of administrative access, firewall rules changes, and user password changes;
- All access to audit logs
- initialization of new audit logs, all starting, stopping, or pausing of the existing audit logs.

- Creation and deletion of system-level objects;
- System, network, or services configuration changes, including installation of software patches and updates, or other installed software changes;
- Application process startup, shutdown, or restart;
- Application process abort, failure, or abnormal end, especially due to resource exhaustion or reaching a resource limit or threshold (such as for CPU, memory, network connections, network bandwidth, disk space, or other resources), the failure of network services such as DHCP or DNS, or hardware fault; and
- Detection of suspicious/malicious activity such as from an intrusion detection or prevention system (IDS/IPS), web application firewalls, an anti-malware system, or an anti-spyware system.

**<Frameworks like SOC 2 and ISO 27001 don’t specify the exact attributes that must be included in logs; however, the list above includes recommendations and best practices of objects to capture in an audit log. The idea is that these attributes help with fraud detection, incident management activities, and investigations, among other things. Modify this list to what system capabilities are currently available for your in-scope system audit logs.>**

[If a Cloud Service Customer] Where necessary, [COMPANY NAME] will assess whether the logging capabilities provided by the cloud service provider are sufficient, or if additional logging capabilities need to be implemented.

Log Elements

Each log will identify or contain at least the following elements, directly or indirectly (unambiguously inferred):

- Type of action – examples include authorize, create, read, update, delete, and accept network connection, including whether it was a successful or failed action.
- Subsystems performing the action – examples include process or transaction name, process or transaction identifier.
- Identifiers (as many as available) for the subject requesting the action – examples include user name, computer name, IP address, and MAC address. Note that such identifiers should be standardized in order to facilitate log correlation.
   - In the case of sharing logs with third parties (including auditors), the use of identifiers containing PII will be limited to:
      **<IDENTIFIER TYPE 1>
      <IDENTIFIER TYPE 2>**
- Identifiers (as many as available) for the object the action was performed on – examples include file names accessed, unique identifiers of records accessed in a database, query parameters used to determine records accessed in a database, computer name, IP address, and MAC address. Note that such identifiers should be standardized in order to facilitate log correlation.
- Before and after values when action involves updating a data element, if feasible.
- Date and time the action was performed, including relevant time-zone information if not in Coordinated Universal Time.
- Whether the action was allowed or denied by access-control mechanisms.
- Description and/or reason-codes of why the action was denied by the access-control mechanism, if applicable.

**<The section should be updated for the logging capabilities for the systems in use. The bulleted list includes best practices for attributes that should be included in logs so that incident management and investigations can be properly performed.>**

Clock Synchronization

- To ensure the accuracy of system logs, system clocks and time will be synchronized using time-synchronization technology.
- The system will also ensure clock synchronization for the accuracy of audit logs. Time received from external sources will be based on International Atomic Time or Coordinated Universal Time (UTC). A network time protocol will be used to keep all of the servers in synchronization with a central time server.
- Time synchronization settings and data will be restricted to only personnel with a business need. Any changes to time settings on critical systems will be logged, monitored, and reviewed.

**<This section isn’t required for SOC 2, but is required for ISO 27001, ISO 27701, NIST 800-53, NIST 800-171, PCI DSS, CMMC, and HIPAA>**

Protection of Audit Logs

To safeguard and prevent manipulation of logs by individuals with elevated access or unauthorized users, the following will be implemented where appropriate and possible:

- Read access to audit logs files will be limited to those with a job-related need.
- Audit log files will be protected to prevent modifications by individuals.
- System administrators will be restricted from erasing or deactivating logs of their own activities.
- Audit log files, including those for external facing technologies, will be backed up to a secure, central, internal log server or other media outside of the control of a system administrator or operator.
- Monitoring system and network administration activities will be performed by using an intrusion detection system managed outside of the control of system and network administrators.
- File integrity monitoring or change-detection mechanisms will be used on audit logs to ensure that existing log data cannot be changed without generating alerts.
- Frequent review of logs to maintain accountability of privileged users.
- All activities carried out by system administrators and operators will be logged. These logs will be safeguarded and subjected to routine reviews.
- In instances where [COMPANY NAME] has been delegated privileged operations, the performance of these operations will be logged.

**<When considering compliance with frameworks such as GDPR, ISO 27001, NIST CSF, and SOC 2, it is crucial to ensure audit logs are securely stored and access is restricted to authorized personnel only, maintaining data integrity and confidentiality. Implement strict controls to prevent system administrators from altering or deleting logs of their own activities, and ensure all audit logs are regularly backed up to secure, tamper-proof locations.>**

Monitoring

- Failures of critical security control systems will be detected, alerted, and addressed promptly through the monitoring of logs and alerting mechanisms. Critical security control systems include:
   - Network security controls.
   - IDS/IPS.
   - Change-detection mechanisms.
   - Anti-malware solutions.
   - Physical access controls.
   - Logical access controls.
   - Audit logging mechanisms.
   - Segmentation controls.
   - Audit log review mechanisms.
   - Automated security testing tools.

**<These are examples and best practices of critical systems controls. Your organization can choose to modify this list to reflect technology systems in place for monitoring and alerting mechanisms>**

- Failures of any critical security controls systems identified through log monitoring will be responded to promptly in accordance with incident response policies and procedures, including but not limited to:
   - Restoring security functions.
   - Identifying and documenting the duration (date and time from start to end) of the security failure.
   - Identifying and documenting the cause(s) of failure and documenting required remediation.
   - Identifying and addressing any security issues that arose during the failure.
   - Determining whether further actions are required as a result of the security failure.
   - Implementing controls to prevent the cause of failure from reoccurring.
   - Resuming monitoring of security controls.

**<Feel free to modify this list with how your organization chooses to respond to failures of critical security controls, in accordance with your incident response policies.>**

## Related articles

- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
- [Example Evidence for Not Monitored Controls (NIST 800-53r5)](example-evidence-for-not-monitored-controls-nist-800-53r5.md)
- [System and Information Integrity Policy Guidance](system-and-information-integrity-policy-guidance.md)
- [Example Evidence for Not Monitored Controls (NIST 800-171 Rev 3)](example-evidence-for-not-monitored-controls-nist-800-171-rev-3.md)
- [Example Evidence for Not Monitored Controls (Essential Eight)](example-evidence-for-not-monitored-controls-essential-eight.md)

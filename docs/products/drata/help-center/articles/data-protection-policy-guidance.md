# Data Protection Policy Guidance

Source: https://help.drata.com/en/articles/8260378-data-protection-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Data Protection Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

## Data Protection Policy

## [COMPANY NAME]

____________________________________________________________________________

## Purpose

This policy outlines many of the procedures and technical controls in support of data protection.

## Scope

Production systems that create, receive, store, or transmit [COMPANY NAME] customer data (hereafter "Production Systems") must follow the requirements and guidelines described in this policy.

## Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Please see here for more guidance on roles and responsibilities: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md)]**

## Policy

[COMPANY NAME] policy requires that:

- Data must be handled and protected according to its classification requirements and following approved encryption standards, if applicable.
- Whenever possible, store data of the same classification in a given data repository and avoid mixing sensitive and non-sensitive data in the same repository. Security controls, including authentication, authorization, data encryption, and auditing, should be applied according to the highest classification of data in a given repository.
- Employees shall not have direct administrative access to production data during normal business operations. Exceptions include emergency operations such as forensic analysis and manual disaster recovery.
   **[This statement is referring to the concept of 'always off' production access, where accounts used to access production are off unless turned on for a specific situation. This is a security best practice but is not required by any framework.]**
- All Production Systems must disable services that are not required to achieve the business purpose or function of the system.
- All access to Production Systems must be logged.
- All Production Systems must have security monitoring enabled, including activity and file integrity monitoring, vulnerability scanning, and/or malware detection, as applicable.

## Data Protection Implementation and Processes

Customer Data Protection

[COMPANY NAME] hosts on **<INFRASTRUCTURE PROVIDER(S)>** in the **<REGION>** region by default. Data is replicated across multiple regions for redundancy and disaster recovery.

**[It is considered a security and availability best practice to replicate data across multiple regions in your cloud service provider. So for example if you are in us-east-1 for AWS, then it is best practice to replicate your data in AWS to another AWS region.]**

**[Examples of Infrastructure Providers include AWS, GCP, Azure, Heroku, and Digital Ocean. Examples of regions include us-east-1, eu-west-1, etc.]**

All [COMPANY NAME] employees adhere to the following processes to reduce the risk of compromising Production Data:

- Implement and/or review controls designed to protect Production Data from improper alteration or destruction.
- Ensure that confidential data is stored in a manner that supports user access logs and automated monitoring for potential security incidents.
- Ensure [COMPANY NAME] Customer Production Data is segmented and only accessible to Customers authorized to access data.
- All Production Data at rest is stored on encrypted volumes using encryption keys managed by [COMPANY NAME].
   **[If your encryption keys are managed by your cloud service provider, then you should modify this statement to reflect that process.]**
- Volume encryption keys and machines that generate volume encryption keys are protected from unauthorized access. Volume encryption key material is protected with access controls such that the key material is only accessible by privileged accounts.

Access

[COMPANY NAME] employee access to production is guarded by an approval process and by default is disabled. When access is approved, temporary access is granted that allows access to production. Production access is reviewed by the security team on a case by case basis.

Separation

Customer data is logically separated at the database/datastore level using a unique identifier for the customer. The separation is enforced at the API layer where the client must authenticate with a chosen account and then the customer unique identifier is included in the access token and used by the API to restrict access to data to the account. All database/datastore queries then include the account identifier.

Monitoring

[COMPANY NAME] uses **<MONITORING TOOL(S)>** to monitor the entire cloud service operation. If a system failure and alarm is triggered, key personnel are notified by text, chat, and/or email message in order to take appropriate corrective action.

**[Examples of monitoring tools include AWS CloudWatch/CloudTrail, Azure Monitor, Google Stackdriver etc.]**

[COMPANY NAME] uses a security agent to monitor production systems. The agents monitor system activities, generate alerts on suspicious activities and report on vulnerability findings to a centralized management console.

**[This statement will only apply if you have implemented agent based security monitoring on your infrastructure. If you do not leverage a security agent, you should reword this paragraph to explain how you monitor your production systems for vulnerabilities.]**

Confidentiality/Non-Disclosure Agreement (NDA)

[COMPANY NAME] uses confidentiality or non-disclosure agreements to protect confidential information using legally enforceable terms. NDAs are applicable to both internal and external parties. NDAs will have the following elements:

- Definition of the information to be protected
- Duration of the agreement
- Required actions upon termination of agreement
- Responsibilities and actions to avoid unauthorized disclosure
- Ownership of information, trade secrets and intellectual property
- Permitted use of the confidential information and rights to use information
- Audit and monitor activities that involve confidential information
- Process of notification and reporting of unauthorized disclosure or information leakage
- Information return or destruction terms when agreement is terminated
- Actions in case of breach of agreement
- Periodic review

## Data At Rest

Encryption

All databases, data stores, and file systems are encrypted according to [COMPANY NAME]’s *Encryption Policy*.

Retention

**[The ‘Retention’ section is required for ISO 27001 and optional for all other frameworks.]**

Stored data must be properly categorized and a retention schedule applied accordingly in conjunction with [COMPANY NAME] *Asset Management Policy*, *Data Classification Policy* and *Data Retention Policy*. Considerations for retention timeframe include:

- Statutory, regulatory or contractual requirements
- Type of data (e.g., accounting records,database records, audit logs)
- Type of storage media (e.g., paper, hard drive, server)

Storage and Disposal

**[The ‘Storage and Disposal’ section is required for ISO 27001 and optional for all other frameworks.]**

Stored data must be properly stored and handled while at rest. Considerations for storage and disposal of data at rest in conjunction with [COMPANY NAME] *Asset Management Policy*, *Data Classification Policy* and *Data Retention Policy* include:

- Authorization to access or manage stored data
- Proper identification of records and their retention period
- Technology change and ability to access data throughout retention period
- Acceptable timeframe and format to retrieve data
- Appropriate methods of disposal

Data Deletion

**[The ‘Data Deletion’ section is required for ISO 27001 and optional for all other frameworks.]**

Stored Sensitive data that is no longer required will be properly deleted in accordance with [COMPANY NAME]’s business objectives, applicable laws and regulations, and relevant third-party agreements. A record of such deletion will be kept.

The following methods will be used to delete data:

**<DELETION METHODS>**

**[In this section, a common approach to delete data is to lean on the tools provided by the platform where the data lives. For instance, your cloud service provider likely provides several methods for data deletion.]**

## Data in Transit

Necessity

Data will only be transferred where strictly necessary for effective business processes.

Transfer Factors

**[The ‘Transfer Factors’ section is required for ISO 27001 and optional for all other frameworks.]**

Before choosing the method of data transfer, the following must be considered:

- Nature, sensitivity, confidentiality, and value of the information
- Size of data being transferred
- Impact of loss during transit

Encryption

To ensure the safety of data in transit:

- All external data transmission must be encrypted end-to-end using encryption keys managed by [COMPANY NAME]. This includes, but is not limited to, cloud infrastructure and third party vendors and applications.
   **[This requirement is required for ISO 27001 but is not required for all other frameworks.]**

- All internet and intranet connections are encrypted and authenticated using a strong protocol, a strong key exchange, and a strong cipher.

Information Exchange

**[The ‘Information Exchange’ section is required for NIST 800-53 and is optional for all other frameworks.]**

Information will be exchanged between [COMPANY NAME]’s system and other information systems only as authorized through **<TYPE OF AGREEMENT(S)>**, which include:

- Interface characteristics;
- Security and privacy requirements, controls, and responsibilities for each system; and,
- Impact level of the information communicated.

**[‘Type of Agreement(s)’ here could include Interconnection Security Agreements, Information Exchange Security Agreements, Memoranda of Understanding/ Agreement, Service Level Agreements, User Agreements, and Non-disclosure Agreements]**

The agreement(s) will be reviewed and updated <FREQUENCY>, or as needed.

## End-user Messaging Channels

- Restricted and sensitive data is not allowed to be sent over electronic end-user messaging channels such as email or chat, unless end-to-end encryption is enabled.
- Messages must be protected from unauthorized access, modification or denial of service commensurate with the classification scheme adopted by the organization.
- Messages must be reviewed prior to sending to ensure correct addressing and transportation of the message.
- The reliability and availability of the messaging channel must be verified.
- All applicable legal requirements will be adhered to.
- Use of external public services such as instant messaging, social networking or file sharing will require prior approval and authorization.
- Publicly accessible networks will be controlled by stronger authentication.

**[Bullets 2-6 in the ‘End-user Messaging Channels’ section are required for ISO 27001 and are optional for all other frameworks.]**

## Event Logs

**[The ‘Event Logs’ section is required for ISO 27001 and is optional for all other frameworks.]**

All [COMPANY NAME] systems that handle confidential information, accept network connections, or make access control (authentication and authorization) decisions will record and retain audit-logging information sufficient to answer: What activity was performed? Who performed it? Where, when, and how (with what tools) was it performed? And, what was the status, outcome, or result of the activity?

Logged Activities

**[The ‘Logged Activities’ section is required for ISO 27001 and is optional for all other frameworks.]**

The logs will be created whenever the system is asked to perform any of the following activities:

- Create, read, update, or delete confidential information, including confidential authentication information such as passwords;
- Create, update, or delete information not covered in above;
- Initiate a network connection;
- Accept a network connection;
- User authentication and authorization for activities covered above such as user login and logout;
- Grant, modify, or revoke access rights, including adding a new user or group, changing user privilege levels, changing file permissions, changing database object permissions, changing firewall rules, and user password changes;
- System, network, or services configuration changes, including installation of software patches and updates, or other installed software changes;
- Application process startup, shutdown, or restart;
- Application process abort, failure, or abnormal end, especially due to resource exhaustion or reaching a resource limit or threshold (such as for CPU, memory, network connections, network bandwidth, disk space, or other resources), the failure of network services such as DHCP or DNS, or hardware fault; and
- Detection of suspicious/malicious activity such as from an Intrusion Detection or Prevention System (IDS/IPS), anti-virus system, or anti-spyware system.

Log Elements

**[The ‘Log Elements’ section is required for ISO 27001 and is optional for all other frameworks.]**

Each log will identify or contain at least the following elements, directly or indirectly (unambiguously inferred):

- Type of action – examples include authorize, create, read, update, delete, and accept network connection.
- Subsystem performing the action – examples include process or transaction name, process or transaction identifier.
- Identifiers (as many as available) for the subject requesting the action – examples include user name, computer name, IP address, and MAC address. Note that such identifiers should be standardized in order to facilitate log correlation.
   - In the case of sharing logs with third parties (including auditors), limit the use of identifiers containing PII in the log(s) to:
      **<IDENTIFIER TYPE 1>
      <IDENTIFIER TYPE 2>**
      **[Common examples of identifiers include user name, computer name, IP address, and MAC address.]**
- Identifiers (as many as available) for the object the action was performed on – examples include file names accessed, unique identifiers of records accessed in a database, query parameters used to determine records accessed in a database, computer name, IP address, and MAC address. Note that such identifiers should be standardized in order to facilitate log correlation.
- Before and after values when action involves updating a data element, if feasible.
- Date and time the action was performed, including relevant time-zone information if not in Coordinated Universal Time.
- Whether the action was allowed or denied by access-control mechanisms.
- Description and/or reason-codes of why the action was denied by the access-control mechanism, if applicable.

Formatting, Storage, Clock Synchronization

**[The ‘Formatting, Storage, Clock Synchronization’ section is required for ISO 27001 and is optional for all other frameworks.]**

- The system will support the formatting and storage of audit logs in such a way as to ensure the integrity of the logs and to support enterprise-level analysis and reporting. Note that the construction of an actual enterprise-level log management mechanism is outside the scope of this document.
- The system will also ensure clock synchronization for the accuracy of audit logs. A clock linked to a radio time broadcast from a national atomic clock can be used as the master clock for logging systems. A network time protocol will be used to keep all of the servers in synchronization with the master clock.

Administrators and Operator Logs

**[The ‘Administrators and Operator Logs’ section is required for ISO 27001 and is optional for all other frameworks.]**

To safeguard and prevent manipulation of logs by privileged users the following will be implemented where appropriate and possible:

- System administrators are not permitted to erase or de-activate logs of their own activities.
- Real-time copying of logs to a system outside the control of a system administrator or operator.
- Monitoring system and network administration activities by using an intrusion detection system managed outside of the control of system and network administrators.
- Frequent review of logs to maintain accountability of privileged users.

## Data De-identification/Masking

**[The ‘Data De-Identification/Masking’ section is required for ISO 27001 and optional for all other frameworks.]**

[COMPANY NAME] will ensure that types of sensitive data that require de-identification/masking are determined as outlined in the *Data Classification Policy*.

[COMPANY NAME] will use **<TECHNIQUE(s)>** for sensitive data de-identification. The adequate de-identification will be verified to ensure that no connection to sensitive data remains.

**[Common techniques here would be data anonymization or pseudonymization]**

## Related articles

- [Data Classification Policy Guidance](data-classification-policy-guidance.md)
- [Vendor Management Policy Guidance](vendor-management-policy-guidance.md)
- [Encryption Policy Guidance](encryption-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Software Development Lifecycle (SDLC) Policy Guidance](software-development-lifecycle-sdlc-policy-guidance.md)

# Software Development Lifecycle (SDLC) Policy Guidance

Source: https://help.drata.com/en/articles/8002321-software-development-lifecycle-sdlc-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Software Development Life Cycle (SDLC) Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in **bold** and enclosed in brackets “**[...]**” below the statements of the policy.

### Software Development Life Cycle (SDLC) Policy

### [COMPANY NAME]

__________________________________________________________________

### Purpose

This policydefines the high-level requirements for providing business program managers, business project managers, technical project managers, and other program and project stakeholders guidance to support the approval, planning, and life-cycle development of [COMPANY NAME] software systems, aligned with the Information Security Program.

### Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**- [Additional guidance on what roles and responsibilities to list in this policy can be found in [Roles and Responsibilities Guidance](roles-and-responsibilities-guidance.md).  To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

### Policy

[COMPANY NAME] must establish and maintain processes for ensuring that its computer applications or systems follow an SDLC process which is consistent and repeatable, and maintains information security at every stage.

### Software Development Phases and Approach Standard

A Software Development Project consists of a defined set of phases:

***Determine System Need Phase***

The Determine System Need phase is the period of time in which an information system need is identified and the decision is made whether to commit the necessary resources to address the need.

***Define System Requirements Phase***

The Define System Requirements phase is the period in which the User Requirements are broken down into more detailed requirements which can be used during designing and coding. Applicable security requirements and controls will be identified through an information security risk assessment.

***Design System Component Phase***

The Design System Components phase transforms requirements into specifications to guide the work of the Development phase. The decisions made in this phase address how the system will meet the functional, physical, interface, data, and security requirements. Design phase activities may be conducted in an iterative fashion, producing a system design that emphasizes the functional features of the system and technical detail.

***Build System Component Phase***

The Build phase transforms the detailed system design into complete coded software units and eventually, into an integrated product for release. Each software unit and subsequent integrated units are tested thoroughly, to include tests for security vulnerabilities. System documents that support installation and operations are also developed in this phase.

***Evaluate System Readiness Phase***

The evaluation phase ensures that the system, as designed and built, satisfies the requirements of the user, as well as applicable security requirements. Whenever possible, independent testers measure the system's ability to perform the functions that are required by the customer and ensure an acceptable level of quality, performance, and security. Once the phase is complete, it will be evident whether or not the system is ready for operation or redevelopment.

***System Deployment Phase***

System Deployment phase is the final phase of the development life cycle, when the system is released initially to a pilot site, where any further security vulnerabilities can be identified, and then into the production environment. All necessary training for using the system is accomplished.

### Project Management

The sequence of the development phases depends on the software development approach taken. The project management approaches include but are not limited to:

- Waterfall Development
- Agile Development
- Iterative Development
- Staged Delivery Development

Based on the approach for and the size of the software development, some of the phases can be combined. In Iterative Development there may be multiple Cycles (iterations) of the above phases before the final software is released.

**- [The entire language under the Software Development Phases and Approach Standard is meant to provide a high-level overview of your approach towards your SDLC. The phases written here are examples and you can tailor the specific details to the methodology your organization is following]**

### Secure System Engineering Principles

Information security implications will be addressed and reviewed regularly, and responsibilities for information security will be defined and allocated to the roles defined in the project management methods.

**- [The Secure System Engineering Principles is primarily an ISO requirement. Additional guidance can be found here: [Security Engineering Principles](security-engineering-principles.md)]**

Engineering principles for a secure system will fall under the following categories:

- Business Layer
   - **<PRINCIPLES>**

**- [Business Layer is how you define your user authentication/access restrictions (e.g. users can only see their own data, access requires a unique user ID, and/or access is role-based)]**

- Data Layer
   - **<PRINCIPLES>**

**- [Data Layer is how your actual data is being protected at rest (e.g. database encryptions requirements, and data replication and/or backup requirements)]**

- Applications
   - **<PRINCIPLES>**

**- [Application Layer is how you protect data during in-transit and in use (export and import) (e.g. data transferred using TLS v1.2 or higher, SFTP for direct file uploads, and Device Enrollment Program (DEP) and Address space layout randomization (ASLR) are enabled on all servers)]**

- Technology
   - **<PRINCIPLES>**

**- [Technology Layer is how you ensure that all technology in your stack is secured (e.g. all software must be approved using your vendor management process, open source technology must be reviewed, and updates in technology stack are installed as they become available or with a set frequency)]**

### SDLC Security Control Guidelines

The SDLC process will adhere to the following information security controls:

- Adequate procedures should be established to provide separation of duties in the origination and approval of source documents. This shall include but not be limited to separation of duties between Personnel assigned to the development/test environment and those assigned to the production environment.

**- [This bullet is discussing that your organization has two different people writing the code and approving the code before they are moved into Production. The review and approval process shall be performed by someone who did not write the code]**

- Modification of code or an emergency release will follow the change control standard.

**- [For most frameworks, the SDLC Policy itself counts as your standards for Change Control. For ISO 27001:2022, NIST 800-53, and NIST CSF, the Change Management Policy supplements your SDLC policy]**

- Secure programming standards should be followed. Secure code training should be provided to [COMPANY NAME]’s developers.

**- [Secure Code Training is best practice recommendation for most frameworks, but is required for PCI and ISO 27001:2022. Here is a FREE Secure Code Training resource: [An Introduction to OWASP Top 10 Vulnerabilities](http://udemy.com/course/an-introduction-to-owasp-top-10-vulnerabilities/) Other options for secure code training: [G2 Secure Code Training Software](https://www.g2.com/categories/secure-code-training)]**

- Secure development environment will be created, based on:
   - sensitivity of data to be processed, stored and transmitted by the system;
   - applicable external and internal requirements, e.g. from regulations or policies;
   - security controls already implemented by the organization that support system development;
   - trustworthiness of personnel working in the environment;
   - the degree of outsourcing associated with system development;
   - the need for segregation between different development environments;
   - control of access to the development environment;
   - monitoring of change to the environment and code stored therein;
   - backups are stored at secure offsite locations; and,
   - control over movement of data from and to the environment.

**- [This bullet is primarily written based on ISO 27001 Control Guidance. This is referring to your Staging & Development environments, not Production]**

- Threat modeling, incident reviews, use of vulnerability thresholds or contingency planning will be conducted to ensure the architecture and design of information systems are protected against known threats based on the operational environmen**t.**

**- [This bullet is primarily written based on ISO 27001 Control Guidance. This is discussing activities that you are doing to secure your environment]**

- All software deployed on Corporate or Hosted infrastructure must prevent security issues including but not limited to those covered by SANS and OWASP.

**- [This bullet is discussing that you are taking proactive steps to prevent security issues from happening, such as the ones identified in [OWASP Top 10 Vulnerabilities](https://owasp.org/www-project-top-ten/) and [SANS Top 25 Software Errors](https://www.sans.org/top25-software-errors/)]**

- Code changes are reviewed by individuals other than the originating code author and by individuals who are knowledgeable in code review techniques and secure coding practices.

**- [Similar to segregation of duties, this bullet is emphasizing that the code review is not performed by the same person who wrote it. Ideally, the code review should be performed by the code author’s senior/manager]**

- Overrides of edit checks, approvals, and changes to confirmed transactions should be appropriately authorized, documented, and reviewed.

**- [This is referring to situations where your standard controls have to be overridden in order to fix an issue or undo something. (e.g. manually making an update to a database value outside of the normal deployment process)]**

- Application development activity should be separated from the production and test environments. The extent of separation, logical or physical, is recommended to be appropriate to the risk of the business application or be in line with customer contractual requirements. The level of separation that is necessary between production, development, and test environments should be evaluated and controls established to secure that separation.

**- [Separating Test and Production environments is a critical control as this will ensure stability and security in your software development process. This prevents unanticipated impact on live production system]**

- Test environments are designed to match production environments as closely as possible.

**- [This bullet is primarily written based on ISO 27001 Control Guidance and will apply to your organization especially if you have Production data on Test environments]**

- All changes to production environments should strictly follow change control procedures, including human approval of all changes, granted by an authorized owner of that environment. Automated updates should be disallowed without such approval.

**- [This bullet is emphasizing that all changes must follow your standard change control procedures outlined in the SDLC policy]**

Individuals who are responsible for supporting or writing code for an internet-facing application, or internal application that utilizes web technology and handles customer information, should complete **annual **security training specific to secure coding practices. For individuals supporting or writing code for an internet-facing application, training should also include topics specific to internet threats. The individual should complete the training prior to writing or supporting the code. The training must include OWASP secure development principles as well as OWASP top 10 vulnerability awareness for the most recent year available.

**- [Secure Code Training is best practice recommendation for most frameworks, but is required for PCI and ISO 27001:2022. Here is a FREE Secure Code Training resource: [An Introduction to OWASP Top 10 Vulnerabilities](http://udemy.com/course/an-introduction-to-owasp-top-10-vulnerabilities/) Other options for secure code training: [G2 Secure Code Training Software](https://www.g2.com/categories/secure-code-training)]**

- Custom accounts and user IDs and/or passwords should be removed from applications before applications become active or are released to customers.

**- [This bullet is emphasizing that embedded credentials should be removed from the application before it is deployed as it poses a security risk if not removed]**

- Production data should not be used in testing or development environments.
- Security controls that are in place for the production copy in the test system should be production quality (e.g. mirroring the production controls over the data).

**- [The two bullets above goes hand-in-hand. Not using production data in test and/or development environments is crucial in protecting potentially sensitive data.**

**If there is a business requirement for you to use real data in your test environment, then you will need to ensure that your testing environment has the same protections as your production environment Additional recommended controls are noted on a later section of the policy]**

- When conducting quality assurance (QA) testing prior to the release of a new feature requiring user input where constraints on user input may be reasonably understood, feature acceptance tests must include testing of edge and boundary cases.

**- [This bullet is discussing the need to employ methods to identify unexpected behaviors for fields that require user input (e.g. input validation, and/or fuzz testing)**

For situations demonstrating that testing needs to use production data, the requirements are the following:

- The Information Resource Owner will provide approval before production data can be used for testing purposes.
- Wherever possible, the production data should be tokenized, anonymized, removed, or de-identified instead of using production data.
- Testing and parallel runs should use a separate copy of production data and the test location or destination should be acceptable (e.g. loading confidential production data to a laptop for testing is not acceptable).
- The data should not be extracted, handled, or used by the test process in a manner that subjects the data to unauthorized disclosure.
- The data should be accessed on a need-to-know basis with the same access control procedures as operational environments.
- The data should have a separate authorization each time operational information is copied to a test environment.
- Copying data into the test environment should be logged for an audit trail.
- Normal test activities should not use production data. In cases where test activity requires access to production data, access to production data should be restricted to only those individuals who have a documented business need. Only the information with the documented business need should be accessible by those users.
- Production data used for testing should be securely erased upon completion of testing.
- Test data and accounts will be removed before being placed into production.
- Restricted/Protected Information will be encrypted according to the Encryption Standard while at rest or in transit.
- Error messages must be handled securely and they must not leak sensitive information.

**- [This section is relevant if you are using production data in lower environments. **

**If you are only using test/mock data in lower environments, it is okay to remove this entire section]**

If production is outsourced, the following will be considered, as applicable, across the entire external supply chain in conjunction with the requirements outlined in the *Vendor Management Policy*:

- Licensing arrangements, code ownership and intellectual property rights related to the outsourced content.
- Contractual requirements for secure design, coding and testing practices.
- Provision of the approved threat model to the external developer.
- Acceptance testing for the quality and accuracy of the deliverables.
- Provision of evidence that security thresholds were used to establish minimum acceptable levels of security and privacy quality.
- Provision of evidence that sufficient testing has been applied to guard against the absence of both intentional and unintentional malicious content upon delivery.
- Provision of evidence that sufficient testing has been applied to guard against the presence of known vulnerabilities.
- Escrow arrangements, e.g. if source code is no longer available.
- Contractual right to audit development processes and controls.
- Effective documentation of the build environment used to create deliverables.
- The organization remains responsible for compliance with applicable laws and control efficiency verification.

**- [This section will apply to you if your development process involves contracting with third-parties to write and produce code on your behalf. Otherwise, it is okay to remove the entire section]**

### Secure Interoperability and Data Portability Management

[COMPANY NAME] is committed to the protection of customer data throughout the process of interoperability and portability, particularly through:

- Implementation of cryptographically secure and standardized network protocols to ensure the effective management, import, and export of data in a secure manner.
- Evidence of executed and planned security tests for all interoperability and portability systems. These tests are supplied as per contractual agreements or upon customer request, ensuring transparency and confidence in the security measures employed by the company.

**- [This section is specific to CCM and not required to any other framework]**

***Data Portability Contractual Obligations***

[COMPANY NAME] will ensure that all agreements with customers include provisions specifying their access to data upon contract termination. These provisions will address:

- Data format: The format in which data will be provided to ensure compatibility and ease of use for the customer.
- Length of time the data will be stored: The duration for which [COMPANY NAME] will store the customer's data after contract termination.
- Scope of the data retained and made available: A clear outline of the extent and types of data that will be retained and accessible to the customer.
- Data deletion policy: The policy detailing the process and timeline for data deletion upon contract termination, ensuring the protection of the customer's information.

**- [This section is specific to CCM and not required to any other framework]**

### Application Programming Interface (API) Availability

[COMPANY NAME] will provide the following application interface(s) to customers, enabling them to programmatically retrieve their data for improved interoperability and portability.

### <LIST OF APIs AVAILABLE TO CUSTOMERS >

These APIs are designed to support interoperability between components and facilitate the secure migration of applications and data between environments. [COMPANY NAME] maintains thorough documentation for API functionality, which is regularly updated and provided to customers alongside new API versions. Additionally, security considerations are addressed during both the development and update processes to ensure the highest level of protection for customer data.

**- [This section is specific to CCM and not required to any other framework]**

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

**- [Version: This indicates which iteration of the policy document this is**

**Date: This indicates when the policy document was last updated**

**Editor: This is the person who wrote or revised the policy document**

**Approver: This is the person who reviewed and approved the policy document for official publication**

**Description of Changes: This provides a summary of the revisions made to the policy document since the previous version**

**Format: This refers to the way the policy document is presented. If you are using Drata’s Policy template, you can indicate this as “.PDF”**

**It is common and acceptable for smaller organizations to have the writer of the policy to be the same person as the approver]**

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Disaster Recovery Plan Guidance](disaster-recovery-plan-guidance.md)
- [Vulnerability Management Policy Guidance](vulnerability-management-policy-guidance.md)
- [Change Management Policy Guidance](change-management-policy-guidance.md)
- [System Security Planning Policy Guidance](system-security-planning-policy-guidance.md)

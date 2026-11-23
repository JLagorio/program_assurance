# ISO 27001:2022 Example ISMS Plan

Source: https://help.drata.com/en/articles/7208186-iso-27001-2022-example-isms-plan
Collection: Framework Information › ISO 27001
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

This is an example of a completed ISMS plan for ISO 27001:2022. This is only guidance and you should review the example language before including it in your own ISMS plan.

**Guidance statements will appear in bold and enclosed in brackets “[ ]” below the statements of the policy. A downloadable version of this template can be found at the bottom of this article.**

*Note: This ISMS template combines Clauses 6 and 8 to reduce duplication and streamline documentation. Combining them improves efficiency and clarity by linking risk planning directly to implementation.*

### Information Security Management System Plan (ISO/IEC 27001:2022)

### Example Corporation

____________________________________________________________________

**Table of Contents:**

Purpose

Background and Objectives

ISMS Plan

4. Context of the organization

4.1. Understanding the organizations and its context

4.2. Understanding the needs and expectations of interested parties

4.3. Determining the scope of the ISMS

5. Leadership

5.1. Leadership and commitment

5.2. Policies

5.3. Organizational roles, responsibilities and authorities

6./8.1 Planning

6.1. Actions to address risks and opportunities

6.1.1. General; 6.1.2 / 8.2. Information security risk assessment

6.1.3 / 8.3. Information security risk treatment

SOA REVISION HISTORY

6.2 Information security objectives and planning to achieve them

6.3 Planning of changes

7. Support

7.1. Resources and 7.2 Competence

7.3. Awareness

7.4. Communication

7.5. Documented Information

7.5.1. General

7.5.2. Creating and updating

7.5.3. Control of documented information

9. Performance Evaluation / 10. Improvement

9.1. Monitoring, measurement, analysis and evaluation

9.2. Internal audit

9.3. Management review / 10.1. Continual improvement / 10.2. Nonconformity and corrective action

APPENDIX A

APPENDIX B

APPENDIX C

Internal Audit Plan and Procedure

### Purpose

This Information Security Management System (ISMS) Plan aims to define the principles, requirements, and basic rules for the establishment, implementation and operation of the Information Security Management System.

### Background and Objectives

The ISMS Plan lays the foundation of the company’s ISMS, and identifies the roadmap for the establishment, implementation and operation of the ISMS and its continued efficacy. This document is supplemented by security policies and procedures that enable the treatment of risks to the organization.

Key objectives of the ISMS Plan are to:

- Define the context of the organization
- Define the scope of the ISMS
- Provide guidance for the implementation of risk treatment and creation of the statement of applicability
- Identify all necessary documents and records
- Outline the internal audit process, audit reviews, and remedial actions
- Establish expectations for continual improvement of the ISMS

The ISMS will be designed and implemented in accordance with the following reference standards:

- **ISO/IEC 27001:2022 **Information security, cybersecurity and privacy protection - Information security management systems - Requirements
- **ISO/IEC 27017:2015** Information technology - Security techniques - Code of practice for information security controls based on ISO/IEC 27002 for cloud services
- **ISO/IEC 27018:2019** Information technology - Security techniques - Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors
   ***[GUIDANCE NOTE: Edit this section to include only applicable standards.]***

### ISMS Plan

### 4. Context of the organization

***4.1. Understanding the organization and its context***

**Example Corporation** has identified issues relevant to the ISMS. Internal and external issues are those factors relevant to **Example Corporation’s** purpose and that affect **Example Corporation’s** ability to achieve the intended outcomes of its ISMS.

Internal issues relevant to the ISMS include, but are not limited to:

- **Example Corporation** culture, as guided by its values, mission, and vision:
   - Mission: <Insert organization mission or link to where it’s available>
   - Vision: <Insert organization vision or link to where it’s available>
   - Values: <Insert organization values or link to where it’s available>
- Governance, organizational structure, (see Organizational Chart) and roles and responsibilities for the ISMS (see Skills Matrix)
- Policies, objectives and the strategies in place to achieve them (see Information Security Policy and topic-specific policies)
- Internal capabilities, (e.g. capital, time, people, processes, systems and technology)
- Internal interested parties and their expectations (see below)
- Form and extent of contractual relationships (see Vendor Management Policy and vendor register)

External issues relevant to the ISMS include, but are not limited to:

- Laws and regulations that are applicable to **Example Corporation** (see below)
- Interested parties and their expectations (see below)
- Vendor and supplier compliance to applicable standards, laws, and regulations and **Example Corporation’s** security requirements;
- Market trends and customer preferences
- Political, public policy, and economic changes
- Technological trends and emerging fields and their associated threats.

***[GUIDANCE NOTE: These are examples of internal and external issues. You must customize this section to your organization and be prepared to describe/provide examples if asked by auditors during a certification audit (e.g., describe market trends and customer preferences if included as an external issue.)***

**Example Corporation** has determined that climate change is not a relevant issue**. **

**<OR>**

**Example Corporation** has determined that issues related to climate change are relevant for the ISMS, including:

- *<EXAMPLE> Impacts on natural resources and greenhouse gas emissions due to increased power consumption of computational resources.*
- * <+>*

***[GUIDANCE NOTE: This marks the first amendment to ISO 27001:2022. Organizations are advised to evaluate whether climate change impacts their specific environment and operations. The provided example guidance is illustrative, and it is crucial for organizations to assess which aspects of climate change are pertinent to their unique circumstances.]***

***4.2. Understanding the needs and expectations of interested parties***

| **APPLICABLE LAWS AND REGULATIONS (EXTERNAL)** | ***Requirements / Notes*** |
|---|---|
| **EU:** |  |
| General Data Protection Regulation (EU) | <Example> Article 32 of GDPR requires appropriate technical and organizational measures commensurate with the level of risk, which will be implemented through the ISMS. |
| EU-US Data Privacy Framework (EU / US) |  |
| EU AI Act (EU) |  |
| Digital Services Act (EU) |  |
| Digital Markets Act (EU) |  |
| Ethics Guidelines for Trustworthy AI (EU) |  |
| Network and Information Security Directive (EU) |  |
| Digital Operational Resilience Act - DORA (EU) |  |
|  |  |
| **US:** |  |
| AI Training Act (US) |  |
| National AI Initiative Act (US) |  |
| AI In Government Act (US) |  |
| Health Insurance Portability and Accountability Act (US) |  |
| California Consumer Privacy Act (US-CA) |  |
|  |  |
| **Australia:** |  |
| AI Ethics Framework (AU) |  |
| Data Availability and Transparency Act 2022 (AU) |  |
| Competition and Consumer Data Right Rules (AU) |  |
|  |  |
| **Brazil:** |  |
| Brazilian General Data Protection (BR) |  |
|  |  |
| **Canada:** |  |
| Privacy Act (CA) |  |
| Quebec’s Law 25 (CA) |  |
|  |  |
| **India:** |  |
| Information Technology Act (IN) |  |
| The Information Technology Rules (IN) |  |
| Competition Act (IN) |  |
| Digital Personal Data Protection Act (IN) |  |
| Copyright Act (IN) |  |
| National e-Governance Plan (IN) |  |
| Law No. 27 of 2022 on Personal Data Protection (IN) |  |
| Electronic Information Law (IN) |  |
| Article 40 of Law No. 36 of 1999 regarding Telecommunications (IN) |  |
| Law No. 14 of 2008 on Public Information Transparency (IN) |  |
|  |  |
| **Israel:** |  |
| Basic Law: Human Dignity and Liberty (IL) |  |
| Privacy Protection Law (IL) |  |
| Data Security Regulation (IL) |  |
| Credit Data Law (IL) |  |
| Copyright Act (IL) |  |
|  |  |
| **Japan:** |  |
| Improving Transparency and Fairness of Digital Platforms Act (JP) |  |
|  |  |
| **New Zealand:** |  |
| Privacy Act (NZ) |  |
|  |  |
| **UK:** |  |
| UK General Data Protection Regulation (UK) |  |

***[GUIDANCE NOTE: The above are example laws and regulations that may be relevant to your organization and your ISMS. You must review and update the table as appropriate (for example, remove the jurisdictions you do not operate in). You should also consider whether there are additional ones not listed that are relevant to you by consulting with your own privacy, compliance, and legal teams.***

| **CONTRACTUAL REQUIREMENTS (EXTERNAL)** | ***Requirements / Notes*** |
|---|---|
| **[EXAMPLE] Example Corporation (Customer)** | [EXAMPLE]<br>**Example Corporation **requires an ISO 27001 certification as part of the MSA signed in 2022. |
| **[EXAMPLE] Enterprise Customers** | [EXAMPLE]<br>**Example Corporation** provides a provision in all contracts with enterprise customers that evidence of an annual penetration test will be provided upon request. |
| **+** |  |

***[GUIDANCE NOTE: Update to reflect any contractual requirements relevant to your ISMS. For example:***

***1. Requirements from customers to implement ISO 27001 or other security framework***

***2. Requirements to implement specific security technical and organizational measures, such as penetration tests***

***3. Any other contractual requirements]***

| **INTERESTED PARTIES (EXTERNAL)** | ***Requirements / Notes*** | ***Will requirements be managed through the ISMS? *** |
|---|---|---|
| **[EXAMPLE] Customers** | Service delivery and performance in accordance with SLAs and terms of service (e.g., availability of the system and/or services). | Yes |
|  | Protection of customer data through technical and organizational measures. | Yes |
|  | Maintaining compliance with security standards such as ISO 27001. | Yes |
| **[EXAMPLE] Suppliers** | Ability to meet financial obligations. | No |
| **[EXAMPLE] Regulators/Law Enforcement** | Compliance with applicable legislation and regulations. | Yes |
|  | Ability and capability to protect and safeguard sensitive customer data as well as preventing financial fraud or malicious intent. | Yes |
|  | Ability to handle all potential incidents related to the company, its products and services, or its personnel. | Yes |
| **[EXAMPLE] Shareholders/Owners/Investors** | Achieving growth goals and business objectives such as profit margins. | No |
| **+** |  |  |

***[GUIDANCE NOTE: Organizations to determine which of these requirements will be addressed through the ISMS.]***

| **INTERESTED PARTIES (INTERNAL)** | ***Requirements / Notes*** | ***Will requirements be managed through the ISMS? *** |
|---|---|---|
| **[EXAMPLE] Engineering** | Having the tools and resources to implement secure design and development processes. | Yes |
| **[EXAMPLE] HR** | Maintaining high employee engagement and morale. | No |
|  | Hiring and retaining competent and ethical personnel. | Yes |
| **[EXAMPLE] Security/IT** | Providing personnel with the necessary knowledge and awareness to detect and report security events (e.g. phishing attempts) | Yes |
| **[EXAMPLE] Senior Management** | Achieving business objectives related to information security. | Yes |
|  | Ability to respond to and/or mitigate major security breaches, incidents, lawsuits, disasters, and other global events. | Yes |
|  | Continuously improving business processes to eliminate nonconformities that result in unnecessary capital and resources. | Yes |
|  | Ability to forecast and respond to market trends and major competitor tactics. | No |
| **+** |  |  |

***[GUIDANCE NOTE: These are examples of interested parties and requirements. You must customize to your organization. Note that the requirements of interested parties can include legal and regulatory requirements and contractual oblig*ations]**

***<IF APPLICABLE> *Example Corporation** did not identify any requirements from interested parties related to climate change.

***[GUIDANCE NOTE: Relevant interested parties can have requirements related to climate change.***

***You must consider whether interested parties have requirements related to climate change relevant to your ISMS and update the table above accordingly (e.g., climate change regulatory actions and initiatives from national agencies in your jurisdiction, etc.). Otherwise, keep this note.]***

***4.3. Determining the scope of the ISMS***

***[Guidance Note:If transitioning from ISO/IEC 27001:2013 to the 2022 version, it is best practice to conduct a gap assessment. This helps identify changes in controls and requirements to ensure your ISMS is fully aligned with the updated standard.*]**

The scope of **Example Corporation’s** ISMS comprises the following standards:

- **ISO/IEC 27001:2022 **Information security, cybersecurity and privacy protection - Information security management systems - Requirements
- **ISO/IEC 27017:2015** Information technology - Security techniques - Code of practice for information security controls based on ISO/IEC 27002 for cloud services
- **ISO/IEC 27018:2019** Information technology - Security techniques - Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors

***[GUIDANCE NOTE: The scope of the ISMS as defined here will be explicitly described in your certificate of registration. Edit this section to include only applicable standards.]***

The scope of the ISMS was established taking into account the internal and external issues, legal, regulatory, and contractual requirements, expectations of interested parties, and other stated requirements to include the following:

**Organizational Units/Departments **

**<Outline organizational units/Departments included in the scope> **

Example:

- *Product*
- *Engineering*
- *Security*
- *IT*
- *People*
- <+>

**Systems, Applications and Infrastructure**

**<Outline systems and applications included in the scope> **

*Example:*

- *AWS/Azure/GCP*
- *GitHub/GitLab*
- *Jenkins*
- *DataDog*
- *Okta*
- *Google Workspace*
- *Teleport*
- *Twilio*
- *Sentry*
- *ADP*
- *<+>*

**Business Processes, Products and Services**

**<Outline business processes, products and services included in the scope> **

Example:

- *[Company] Web Application (app.examplecorp.com)*
- *[Company] Mobile Application (iOS/Android)*
- *Services:*
   - *MSSP*
   - *Development*

**Locations**

**<Outline locations included in the scope, including addresses> **

Example:

- *Main office: P. Sherman, 42 Wallaby Way, Sydney **<OR>***
- ***Example Corporation has no physical locations in scope for the ISMS as the company’s workforce is primarily/entirely remote. All activities relevant to the ISMS are conducted remotely.*

**[GUIDANCE NOTE: For Example Corporations with no physical locations, this section could be removed.]**

**<Outline any additional categories included in the scope>**

- <+>

Interfaces and dependencies between activities performed by other organizations include, but are not limited to, the following:

- *Drata: Provides a cloud platform for continuous control monitoring used to track implementation of the ISMS*
- *<Name>: Provides vCISO and ISMS implementation services *
- (+)

**EXCLUSIONS**

The following items are explicitly excluded from the ISMS scope of **Example Corporation**:

***[GUIDANCE NOTE: Specify all individual elements which are to be specifically excluded from the scope, such as organizational teams, business processes or services, systems, locations not relevant for the ISMS]. ***

*Example:*

- *Marketing/Design personnel will be excluded from the departmental scope as this department does not handle any customer data and is not involved in activities relevant to the ISMS. *
- *Office at P. Sherman, 43 Wallaby Way, Sydney will be excluded from the in-scope locations as this is a shared coworking space; there are no critical assets and it is entirely managed by WeWorks.*

### 5. Leadership

***5.1. Leadership and commitment***

Top management for the scope of the ISMS includes:

- <NAME, TITLE>
- <NAME, TITLE>
- <NAME, TITLE>

[GUIDANCE NOTE: Top management-Person or group of people who directs and controls an organization at the highest level. Top management has the power to delegate authority and provide resources within the organization. If the scope of the management system covers only part of an organization, then top management refers to those who direct and control that part of the organization. Consider C-Suite officers, information security committee members, etc. and their expected involvement in the ISMS.]

Top management will demonstrate its leadership and commitment to the ISMS through:

- Establishing an Information Security Policy (see Information Security Policy)
- Ensuring ISMS, roles, responsibilities and authorities are assigned
- Ensuring resources needed for the ISMS implementation (e.g., resources needed to implement necessary controls) are made available
- Communicating the importance of effective information security management
- Motivating & empowering persons to contribute to the effectiveness of the ISMS
- Reinforcing organizational accountability for information security management results
- Creating and maintaining an internal environment in which persons can become fully involved in achieving the organization’s information security objectives

***5.2. Policies***

Management has established an Information Security Policy that is available as documented information, managed, and communicated to company personnel via **<Drata or other platform>**. Management may also make the Information Security Policy available to external parties in certain circumstances as deemed appropriate (e.g., to satisfy due diligence requests from prospects, etc).

Through the establishment and implementation of the Information Security Policy, management is committed to satisfying applicable requirements related to information security and continuously improving the ISMS.

In addition to this plan and the Information Security Policy, management will establish and implement topic-specific policies to support the implementation of information security controls in specific areas of the organization and security areas. These topic-specific policies will be managed and made available to personnel via **<Drata or other platform>. **

***5.3. Organizational roles, responsibilities and authorities***

The [**SECURITY OFFICER//OTHER RESPONSIBLE PARTY]** is responsible for:

- The design, development, maintenance, dissemination, and enforcement of the items contained in this policy and associated policies.
- Ensuring that the information security management system conforms to the requirements of ISO/IEC 27001:2022 (Clause 5.2c and Clause 5.3a).
- Reporting on the performance of the information security program to top management to identify areas for continuous improvement (Clause 5.2d and Clause 5.3b).

The objectives and measures outlined by this plan and associated policies shall be maintained and enforced by the roles and responsibilities specified in each policy and the company *Skills Matrix *(see below).

**SKILLS MATRIX**

| **Role Title** | **ISMS Responsibilities** | **Required Skills & Competence** | **Current Personnel or Members** | **Fully Competent ***(Y/N)* | **Competency Plan**<br>*(if not fully competent)* | **Proof of Competence** |
|---|---|---|---|---|---|---|
| *CIO/CEO/CISO / Other* | *1 - Oversight of the ISMS implementation*<br>*2 - Providing leadership support including resources to implement the ISMS*<br>*3 - Fostering a culture of continuous improvement*<br>*4 - Monitoring the performance of the ISMS* | - *12 years of experience*<br>- *Master’s Degree*<br>- *Information Security Management Certification (e.g., CISSP, CISM, C-CISO)* | *John Smith* | *Y* | *N/A* | - *Resume*<br>- *Copy of certifications (e.g., CISSP, CISM, CISA).*<br>- *List of completed Trainings in a specific time period*<br>- *URL to LinkedIn profile* |
| *Security Officer/Other Responsible Party* | *1 - The design, development, maintenance, dissemination, and enforcement of the items contained in this policy and other ISP policies.*<br>*2 - Ensuring that the information security management system conforms to the requirements of the standard. *<br>*3 - Reporting on the performance of the information security program to top management to identify areas for continuous improvement (5.2d, 5.3b).* | - *ISO/IEC 27001 implementation experience*<br>- *Audit experience* | *Jane Doe* | *N* | *Does not have ISO/IEC 27001 implementation experience. Will complete ISO/IEC 27001 lead implementer training by the end of this year. * | - *Resume*<br>- *Copy of certifications (e.g., CISSP, CISM, CISA).*<br>- *List of completed Trainings in a specific time period*<br>- *URL to LinkedIn profile* |
| *(+)* |  |  |  |  |  |  |

***[GUIDANCE NOTE: This is an example Skills Matrix to document ISMS roles and responsibilities and competence as required by the standard. You must customize it for your organization.]***

### 6./8.1 Planning

***6.1. Actions to address risks and opportunities***

***6.1.1. General; 6.1.2 / 8.2. Information security risk assessment***

**Methodology**

**Example Corporation** will establish a methodology for risk assessment which will include the following:

- Process for identifying risks that could cause the loss of confidentiality, integrity, and/or availability of information
- Identification of risk owners
- Assessment of consequences and the likelihood of risks

The risk methodology will ensure that the risk assessment results are consistent across all relevant sectors of the company with comparable results (see Risk Assessment Policy).

**Performance**

**Example Corporation** will conduct the risk assessment process as outlined in its Risk Assessment Policy **<FREQUENCY - annually at a minimum, quarterly recommended> **or when significant changes occur

***6.1.3 / 8.3. Information security risk treatment***

- **Risk Treatment Plan. **The Risk Treatment Plan is a crucial part of the ISMS implementation. Example Corporation will document a Risk Treatment Plan for every identified risk, which will include the necessary controls to modify risk, responsible party, and as deemed necessary, timing and intervals, and allocated resources/budgets.
- **Evaluation of Effectiveness. **Example Corporation will measure and evaluate the fulfillment and effectiveness of the controls in place and other ISMS objectives in place, as set forth in the Risk Treatment Plan.
- **Statement of Applicability. T**he Statement of Applicability (SOA) links **Example Corporation’s** risk assessment and treatment with the implementation of the ISMS. The SOA will list all controls identified by Example Corporation to be necessary to implement the risk treatment plan based on the results of the risk assessment. This may include ISO 27001 Annex A controls, controls from other frameworks, custom controls deemed necessary by the organization, etc. The SOA will indicate any controls that are not deemed necessary to treat an identified risk as justification for exclusion. Each control in the SOA will have implementation status and implementation details. *Refer to Appendix A for **Example Corporations** statement of applicability.*

***[GUIDANCE NOTE: You must complete a Statement of Applicability (SoA) and provide it to your certification body. This can be included in Appendix A of your ISMS documentation or maintained as a standalone document.***

***The SoA must:***

- ***List all 93 Annex A controls (they are listed in the template at the bottom of the page)***
- ***Clearly state whether each control is applicable or not***
- ***Provide a justification for any exclusions***
- ***Describe the implementation status of each applicable control***

***While the SoA is part of your broader ISMS plan, many organizations choose to keep it as a separate document. You can store it in your Evidence Library if that works best for your documentation structure. ***

***Note: An export of controls from Drata can be a helpful starting point, but it is not sufficient on its own. The export indicates scope status, but does not include the required justifications. If you use the export, be sure to add columns to capture applicability decisions and rationale for each of the 93 controls.]***

***6.2 Information security objectives and planning to achieve them***

Information security objectives will be established, in accordance with **Example Corporation’s** *Information Security Policy *and will consider any applicable information security requirement, as well as risk assessment and treatment results. The information security objectives will be measurable, if and when practical, and will reflect:

- what will be done;
- what resources will be required;
- who will be responsible;
- when it will be completed; and
- how the results will be evaluated.

**Example Corporation** information security objectives will reflect the objectives for the protection of the Confidentiality, Integrity, and Availability of information as it relates to **Example Corporation’s** ISMS. The objectives will be monitored and updated when needed (*see table below*).

**INFORMATION SECURITY OBJECTIVES (202X)**

| **ID** | **Objective** | **Actions to Achieve Objectives** | **Required Resources** | **How Will It Be Monitored** | **Responsible Party** | **Timeline** | **Evaluation Criteria** |
|---|---|---|---|---|---|---|---|
| *1* | *EXAMPLE 1. Achieve and maintain ISO/IEC 27001 Certification* | *1 - Implement ISMS requirements*<br>*2 - Perform a risk assessment and implement necessary controls based on results*<br>*3 - Conduct management review and internal audits at planned intervals*<br>*4 - Engage certification body to perform initial certification audit*<br>*5 - After initial certification perform required activities at least annually for surveillance audit* | *1 - Budget for implementing required certification activities (e.g., engaging with a certification body, internal auditor, etc.)*<br>*2 - Operational staff and top management time * | *1 - Implementation of the ISMS and associated activities will be monitored in Drata. *<br>*2 - ISO/IEC 27001 certificate will be provided by certification body upon completion of successful audit * | *<CISO or other responsible party>* | *Initial certification expected to be obtained by QX, 202X.*<br>*Surveillance audits will be conducted every year thereafter to maintain the certification. * | *1 - ISO/IEC 27001 certification received by the organization by expected date.*<br>*2 -Successful surveillance audits and maintenance of the certification. * |
| *2* | *EXAMPLE 2: Foster a culture of security throughout the entire organization* | *1 - Training personnel periodically on security awareness and monitor completion*<br>*2 - Provide internal communication channels to report security events*<br>*3 - Require personnel to acknowledge security policies* | *1 - Security awareness training resources or platform and tracking mechanism*<br>*2 - Internal security communication channels (e.g., Slack/MS Teams, security email, etc.)*<br>*3 - Policy management platform* | *1 - Completion status for security awareness training and policy acknowledgement*<br>*2 - Usage of internal security communication channels* | *<CISO/HR or other responsible party>* | *Training and policy acknowledgement will be expected during personnel onboarding and at least every 12 months. *<br>*Usage of internal security communication channels will be ongoing* | *1 - 95% personnel complete security awareness training and policy acknowledgements on time*<br>*2 - Internal security communication channels actively used to report events* |
| *3* | *EXAMPLE 3: Evaluate and consider the impact of technology changes and implement appropriate responses* | *1 - Perform risk assessments at planned intervals to consider technology changes*<br>*2 - Discuss technology changes in management review meetings* | *1 - Operational staff and top management time *<br>*2 - Methodology for risk assessment* | *1 - Completion of the risk assessment activities *<br>*2 - Conducting the management review meetings* | *<CISO or other responsible party>* | *Initial risk assessment and management review to be performed by QX, 202X and then at least annually thereafter* | *1 - Updated risk register following risk assessment activities*<br>*2 - Management reviews agenda and minutes* |
| *4* | *EXAMPLE 4: Meet contractual commitments around availability of the product and services* | *1 - Implement and maintain a high availability infrastructure with redundancy* | *1 - Operational staff time*<br>*2 - Budget for additional cost of redundant infrastructure* | *1 - Uptime % for product/service within status portal * | *<Engineering Lead or other responsible party>* | *Ongoing* | *Uptime % for product/service within availability SLA* |
| *5* | *EXAMPLE 5: Protect confidentiality, availability, and integrity of customer data* | *1 - Implement strong encryption for data at rest and in transit*<br>*2 - Implement strong authentication mechanisms such as MFA*<br>*3 - Implement access control policies based on the principle of least privilege and need-to-know* | *1 - Operational staff time*<br>*2 - Resources to implement access control processes and mechanisms (processes for provisioning, reviewing, and deprovisioning access) * | *1 - All databases and services encrypted at rest and in transit per Drata monitoring*<br>*2 - All users have MFA enabled per Drata monitoring*<br>*3 - All terminated users have access disabled per Drata monitoring* | *<IT Lead or other responsible party>* | *Ongoing* | *Successful monitoring results in Drata* |
| *6* | *EXAMPLE 6: Institutionalize organizational incident response capabilities * | *1 - Establish an incident response plan and a disaster recovery plan*<br>*2 - Define recovery time objectives (RTOs) and recovery point objectives (RPOs)*<br>*2 - Conduct annual incident or BCP/DRP response tests* | *1 - Operational staff time*<br>*2 - Documented plans*<br>*3 - Dedicated time scheduled to conduct activities * | *1 - Incident response and disaster recovery plan documented and available within Drata*<br>*2 - Incident response or BCP/DRP tests successfully conducted * | *<Engineering Lead or other responsible party>* | *Initial incident response or BCP/DRP test to be performed by QX, 202X and then at least annually thereafter* | *Ability to recover in line with RTOs and RPOs during the incident response or BCP/DRP tests* |

***[GUIDANCE NOTE: This table includes example objectives. Customize it to your organization and update periodically (at least annually). Consider existing objectives in your organization (e.g., OKRs, annual goals, etc.)]***

***6.3 Planning of changes***

All changes to the ISMS will be made in accordance with **Example Corporation’s** policies, including, but not limited to, the *Information Security Policy*, *Risk Assessment Policy*, *Change Management Policy* and this ISMS plan. This will include planned and unplanned changes impacting the organization and the ISMS, such as:

- Changes to policies and procedures resulting from ad-hoc or periodic reviews
- Changes to control implementations resulting from risk treatment activities
- Software development changes
- Changes to vendors and suppliers
- Configuration changes
- Changes to ISMS documentation

### 7. Support

***7.1. Resources and 7.2 Competence***

The proper operations and maintenance of the ISMS requires proper personnel planning and resources. **Example Corporation** management is devoted to making sure that the ISMS roles and responsibilities, as well as the skills necessary to perform them are well-defined, and that those roles are properly manned by people with the requisite skills (see *Skills Matrix *above). Records of competence will be maintained. Management will also make sure that the ISMS is prioritized in the budgeting process and properly resourced to guarantee optimal performance.

***7.3. Awareness***

To ensure the proper implementation of the controls, policies, and procedures, **Example Corporation** will promote awareness and provide training as to the necessity of such provisions, and how to perform their roles and responsibilities in accordance with these provisions.

***7.4. Communication***

**Example Corporation**’s communication plan outlines the lines of communication within the organization, and with outside entities, to include appropriate government agencies (e.g., law enforcement) and non-governmental organizations. It also defines times and intervals, events and situations, and personnel responsible for the communication (see below).

**COMMUNICATION PLAN**

| **Document/**<br>**Deliverable** | **Frequency of Communication** | **Sender**<br>*(Delivery from)* | **Audience**<br>*(Delivery to)* | **Delivery Type** | **Delivery Evidence** |
|---|---|---|---|---|---|
| **Internal Audit Report** | Annually | -Internal Auditor<br>-Member of Security Team | -CISO<br>-Risk Committee | -Email<br>-Presentations<br>-Drata Evidence Library (with Access to Drata) | -Email<br>-Committee Meeting Minutes<br>-In Drata |
| **External Audit Report** | Annually | -External Auditor<br>-Member of Security Team | -CISO<br>-Risk Committee<br>-Board of Directors | -Email<br>-Presentations | -Risk Committee and/or Board of Directors Closing Meeting Minutes |
| **ISO 27001 Certificate** | As New Certificates are Issued | -External Auditor<br>-Member of Web Dev Team | -Posted on company website<br>-Marketing<br>-Sales | -Email<br>-Web Posting | -Email<br>-Website |
| **Corrective Action Report** | Quarterly | -Member Responsible for Developing CARs | -CISO<br>-Business Unit Leadership responsible for Corrective Actions<br>-(For external findings) External Auditor | -Email<br>-Meetings<br>-Drata Evidence Library (with Access to Drata) | -Email<br>-Meeting Minutes<br>-In Drata |
| **ISMS Security Objectives** | Quarterly | -Member Responsible for Developing objectives | -Business Unit Leadership for Security Objectives | -Email<br>-Meetings<br>-Drata Evidence Library (with Access to Drata) | -Email<br>-Meeting Minutes<br>-In Drata |
| **Risk Treatment Plans** | Quarterly | -Member Responsible for Developing RTPs | -CISO<br>-Risk Committee<br>-Business Unit Leadership for RTP | -Email<br>-Meetings<br>-Drata Evidence Library (with Access to Drata) | -Email<br>-Meeting Minutes<br>-In Drata |
| **Management Review Report** | Annually or as necessary | -Member Responsible for reporting metrics in Management Review | -CISO<br>-Appropriate Business Unit Leadership | -Email<br>-Meetings<br>-Drata Evidence Library (with Access to Drata) | -Email<br>-Meeting Minutes<br>-In Drata |
| **External Incident Response Report** | As necessary | -Designated member to communicate with external parties (e.g., government agency, NGOs, etc.) | -External Parties (e.g., government agencies, NGOs, etc.) | -Email<br>-Phone<br>-As required by local regulations or standards | -Email<br>-Phone Log<br>-Appropriate Records |

***[GUIDANCE NOTE: This is an example communication plan. Customize it to your organization. Consider existing means of communication within your organization (e.g., periodic all-hands calls, newsletters, periodic leadership discussions, quarterly business reviews, etc.)]***

***7.5. Documented Information***

**

***7.5.1. General***

The following table includes the documents determined by **Example Corporation** as being necessary for the effectiveness of the ISMS.

**MANDATORY RECORDS & DOCUMENTS **

| **Document** | **Reference** | **Location** |
|---|---|---|
| **ISO 27001:2022 TIER 1 DOCUMENTATION** |  |  |
| Scope of The Information Security Management System (ISMS) | Clause 4.3 | *Section 4.3 of the ISMS Plan* |
| Information Security Policy | Clause 5.2 | *Drata Policy Center* |
| Definition of Security Roles & Responsibilities | Clause 5.2, Annex A.6.2 | *Skills Matrix section of the ISMS Plan* |
| Information Security Objectives | Clause 6.2 | *Information Security Objectives section of the ISMS Plan* |
| Risk Assessment Process | Clause 6.1.2 | *Risk Assessment Policy* |
| Risk Assessment Report | Clause 8.2 | *Drata - *Evidence Library |
| Risk Treatment Process | Clause 6.1.3 | *Risk Assessment Policy* |
| Risk Treatment Plan | Clause 6.1.3e | *Drata - *Evidence Library |
| Statement of Applicability (For Controls in Annex A) | Clause 6.1.3d | *Statement of Applicability section of the ISMS Plan* |
| List of Interested Parties, Legal & Other Requirements | Clauses 4.2 & 6.1 | *Section 4.2 of the ISMS Plan* |
| Competence (e.g., Skills Matrix & Associated Proof Of Skills) | Clause 7.2 | *Skills Matrix section of the ISMS Plan* |
| Evidence of Communication | Clause 7.4 | *Communication Plan section of the ISMS Plan* |
| Procedure for Document Control | Clause 7.5 | *Last page of ISMS Plan* |
| Monitoring & Measurement Results | Clause 9.1 | *Drata - Monitoring page* |
| Internal Audit Plan & Reports | Clause 9.2 | *Internal Audit Section of the ISMS Plan* |
| Results of Management Reviews of ISMS | Clause 9.3 | *Appendix B of the ISMS Plan* |
| Nonconformities, Corrective Actions & Improvement Suggestions | Clause 10.1; 10.2 | *Appendix C of the ISMS Plan* |
| **ISO 27001:2022 TIER 2 DOCUMENTATION** |  |  |
| Inventory of Assets | Annex A.5.9 | *Drata - Assets module* |
| Acceptable Use of Assets | Annex A.5.10 | *Drata - Policy Center* |
| Access Control Policy | Annex A.5.15 | *Drata - Policy Center* |
| Operating Procedures for Information Security | Annex A.5.37 | *Drata - Policy Center* |
| Logging | Annex A.8.15 | *Drata - Policy Center, AWS CloudTrail* |
| Incident Management Procedure | Annex A.5.26 | *Drata - Policy Center* |
| Business Continuity Strategy & Procedures | Annex A.5.29 | *Drata - Policy Center* |
| Statutory, Regulatory, And Contractual Requirements | Annex A.5.31 | *Section 4.2 of the ISMS Plan* |

***[GUIDANCE NOTE: This list includes REQUIRED documented information for the ISMS. The certification body will demand to see documented evidence of each. Customize location as appropriate.] *

**CONDITIONAL RECORDS & DOCUMENTS (If Applicable)**

| **Document** | **Reference** | **Location** |
|---|---|---|
| Confidentiality or Non-Disclosure Agreements | Annex A.6.6 | *Google Drive* |
| Secure System Engineering Principles | Annex A.8.27 | *Drata - Policy Center* |
| Supplier Security Policy | Annex A.5.19 | *Google Drive* |

**DISCRETIONARY RECORDS & DOCUMENTS (Commonly Used)**

| **Document** | **Reference** | **Location** |
|---|---|---|
| Controls for Managing Records | Clause 7.5.3 | *Section 7.5.2-.3 of the ISMS Plan* |
| Procedure for Measuring and Monitoring | Clause 9.1 | *Section 9.1 of the ISMS Plan* |
| Procedure for Corrective Action | Clause 10.2 | Appendix C of the ISMS Plan |
| Bring Your Own Device (BYOD) Policy | Annex A.8.1 | *Drata - Policy Center* |
| Mobile Device & Teleworking Policy | Annex A.8.1 | *Drata - Policy Center* |
| Information Classification Policy | Annex A.5.12 | *Drata - Policy Center* |
| User Access Rights Policies (Including Password Control) | Annex A.5.18 | *Drata - Policy Center* |
| Disposal & Destruction Policy | Annex A.7.10; A.7.4 | *Drata - Policy Center* |
| Procedures for Working in Secure Areas | Annex A.7.6 | *Drata - Policy Center* |
| Clear Desk & Clear Screen Policy | Annex A.7.7 | *Drata - Policy Center* |
| Change Management Policy | Clause 6.3; Annex A.8.32 | *Drata - Policy Center* |
| Backup Policy | Annex A.8.13 | *Drata - Policy Center* |
| Information Transfer Policy | Annex A.5.14 | *Drata - Policy Center* |
| Business Impact Analysis | Annex A.5.29 | *Drata - Policy Center* |
| ISMS Continuity Controls Testing Plan | Annex A.5.29 | *Drata - Policy Center* |

***7.5.2. Creating and updating***

**Example Corporation** ensures documentation generated by **Example Corporation** personnel is appropriately controlled. Consideration is given to:

- Identification of documentation through the assignment of titles, dates, authors, and reference numbers.
- Format including language, version, and media (physical or electronic) used to display and communicate documentation.
- Review and approval for suitability, adequacy, and accuracy of the information contained within documentation.

The record of this consideration is contained within the “Revision History” table inside of each policy, and records of review and approval are contained within the Drata Policy Center, which documents the policy approval and assigned owner.

***7.5.3. Control of documented information***

**Example Corporation**’s crucial task in the operation and maintenance of the ISMS is the collection of the appropriate records and evidence to ensure the functionality of the ISMS, and the effectiveness of the system. The records will also reflect personnel performance and completion of necessary tasks.

**Example Corporation** will also have a systematic approach for document management. To control documents:

- Classify documents properly
- Define members with the rights for distribution, access, retrieval, and use of documents, and the necessary actions to be performed.
- Identify methods currently used to receive, process, approve/reject, store and/ or delete documents.
- Align business processes to document management requirements
- Identify documents for control
- Integrate change controls to ensure integrity of documents

### 9. Performance Evaluation / 10. Improvement

***9.1. Monitoring, measurement, analysis and evaluation***

**Example Corporation **will evaluate its security objectives by monitoring and measurement of implemented controls. Monitoring provides awareness of the status and state of assets and processes that have been selected to be watched, and can provide basic and immediate alerts if something is not performing as expected. Measurements allow for the evaluation of assets and processes based on predefined units. The assets and processes for evaluation will be properly documented, the company will produce and maintain reports and evidence of evaluations.

These evaluations are meant to allow the **Example Corporation** to:

- Ensure control objectives are being satisfied and validate the decisions made;
- Establish a roadmap to meet set targets and expectations;
- Produce evidence and justification for implemented measures; and/or,
- Discover and identify security gaps that would require change, corrective action(s), or intervention.

The following systems, processes and activities could be monitored:

- ISMS Implementation
- Incident Management
- Vulnerability Management
- Configuration Management
- Security Awareness and Training
- Access Control, Firewall and other Event Logging
- Audits
- Risk Assessment Process
- Risk Treatment Process
- Third Party Risk Management
- Business Continuity Management
- Physical and Environmental Security Management
- System Monitoring

The following processes and activities could be measured:

- Planning
- Leadership
- Risk Management
- Policy Management
- Resource Management
- Communicating
- Management Review
- Documenting
- Auditing

Effectiveness measures will be used to evaluate the effectiveness and impact of the risk treatment plan and related processes and controls related to the information security objectives. These measures could include:

- Cost savings resulting from properly operating the ISMS, or costs incurred from addressing incidents
- Level of customer trust
- Achievement of other information security objectives

**KPI Metrics**

| **KPI** | **Infosec Objective ID (Fr. 6.2)** | **Frequency** | **Measure** | **Result** | **Target** | **Supporting Documentation** | **KPI Owner** | **Last Review Date** |
|---|---|---|---|---|---|---|---|---|
| ***ISMS Plan Review*** | ***6*** | *Annually* | *(# of Reviews / 1) * 100* | *100%* | *100%* | *Security Steering Committee Meeting Minutes* | *CISO* | *01/20/2023* |
| ***Information Security Policy Review*** | ***1, 4*** | *Annually* | *(# of Reviews / 1) * 100* | *100%* | *100%* | *Information Security Policy* | *CISO* | *01/20/2023* |
| ***Security Awareness Training*** | ***3*** | *Annually* | *(# of employees who received SATE / total # of employees) * 100* | *87%* | *90-100%* | *Proofpoint Security Awareness Training Results* | *Manager, GRC* | *01/20/2023* |
| ***Social Engineering Reporting Rate*** | ***3*** | *Quarterly* | *(# of phishing simulation report / total # of employees) * 100* | *43%* | *>50%* | *Proofpoint Security Awareness Training Results* | *Manager, GRC* | *03/06/2023* |
| ***Social Engineering Failure Rate*** | ***3*** | *Quarterly* | *(# of phishing failure / total # of employees) * 100* | *7%* | *<5%* | *Proofpoint Security Awareness Training Results* | *Manager, GRC* | *03/06/2023* |
| ***BC/DR Annual Test*** | ***1, 2*** | *Annually* | *(# of BC/DR test performed / 1) * 100* | *100%* | *100%* | *BC/DR Test Report* | *CISO* | *02/17/2023* |
| ***Annual Incident Response Test*** | ***1, 5, 6*** | *Annually* | *(# of IR test performed / 1) * 100* | *100%* | *100%* | *IR Test Report* | *CISO* | *02/24/2023* |
| ***Penetration Test*** | ***1, 5, 6*** | *Annually* | *(# of penetration test performed / 1) * 100* | *100%* | *100%* | *Penetration Test Report* | *Manager, GRC* | *01/17/2023* |
| ***Vulnerability Scans*** | ***1, 5, 6*** | *Monthly* | *(# of vulnerability scans performed / 12) * 100* | *100%* | *100%* | *AWS GuardDuty* | *Manager, GRC* | *03/20/2023* |
| ***User Access Reviews*** | ***1, 6*** | *Quarterly* | *(# of user access reviews performed / 4) * 100* | *100%* | *100%* | *User Access Review emails* | *Manager, GRC* | *01/09/2023* |
| ***Annual Board of Directors meeting on Cybersecurity*** | ***4*** | *Annually* | *(# of Board Meetings / 1) * 100* | *100%* | *100%* | *Board of Director Meeting Minutes* | *CISO* | *03/03/2023* |
| ***Platform Availability metric*** | ***1, 4*** | *Monthly* | *((100 - Down time) / 100) * 100* | *99.5%* | *99.5%* | *Status page* | *IT* | *03/20/2023* |
| ***Drata Controls Monitoring*** | ***1*** | *Daily* | *(# Passing test / Total number of test) * 100* | *93%* | *95%-100%* | *Drata Monitoring * | *Manager, GRC* | *03/23/2023* |

* **[GUIDANCE NOTE: These are examples of KPI metrics. You must customize it to your organization. Considering existing KPIs, goals and OKRs measured across different departments in your organization and how they are monitored, reported, and evaluated (e.g., quarterly business reviews, periodic executive level meetings, etc.)]***

***9.2. Internal audit***

Internal Audits are a crucial element of **Example Corporation**’s ISMS and its continuous improvement. The process will ensure the discovery and identification of issues, gaps, malfunctions, etc. in the company’s ISMS that could ultimately damage or harm the company.

- **Frequency. Example Corporation** will conduct an internal audit of its ISMS at least annually
- **Audit Entity.Example Corporation** internal audits will be conducted by:
   - Employee, full-time auditor;
   - Employee, part-time auditor; or
   - Third party internal auditor (outside organization will conduct internal audit per rules set by **Example Corporation**)
   - In the case of an employee being selected as an auditor, **Example Corporation** will ensure that the auditor is objective and impartial. This will be done through different methods, such as selecting an employee from a different department or team to audit a specific department or team.
- **Documentation.Example Corporation** will set and document the criteria and scope of each annual internal audit in the Internal Audit Program. It will also produce and maintain, for evidence, reports of the internal audit, where findings, gaps, and nonconformities will be outlined (see *Appendix A*).
   **Example Corporation** will include in its Internal Audit Program sections such as:
   - Method of internal auditor selection
   - Process of planning the internal audit
   - Steps to conduct the internal audit
   - Post-audit activities
   - Internal audit checklist
- **Plan and Procedure. (See APPENDIX A)**

***9.3. Management review / 10.1. Continual improvement / 10.2. Nonconformity and corrective action***

- **Management review. Example Corporation** management will systematically review and make critical decisions concerning the ISMS. The review will be **<ASSIGN MEMBER (e.g., CISO)>**, who is also responsible for compiling all necessary information and inputs for consideration (see APPENDIX B).
   The review will take into consideration:
   - Status of items, issues, and tasks from previous review
   - Any internal and external changes that impact security
   - Feedback from, and any security-related changes in needs and expectations of, interested parties
   - Feedback on the performance of the ISMS, to include:
      - Nonconformities and corrective actions
      - Monitoring and measurement results
      - Audit results
      - Fulfillment of information security objectives
   - Risk assessment results, and risk treatment status
   - Continual improvement opportunities
   Decisions will be made concerning:
   - The ISMS scope and whether it requires modifications
   - Security policies and whether any require modifications
   - Security gaps and necessary improvements
   - Necessary resources
   - The overall effectiveness of the ISMS and fulfillment of its objectives
   - Implementation of different security strategies and training
- **Frequency.Example Corporation** will conduct a management review of its ISMS **<INTERVAL (at least annually)>**, and as necessary.
- **Documentation and reporting. **The considerations, discussions, and decisions from the management review will be recorded in the meeting minutes, which could also include discussions from other reviews. The results of the review, and subsequent tasks and responsibilities, will be communicated to relevant parties **by [METHOD, e.g., e-mail, meeting, all-hands, etc.].**
- **Nonconformity and corrective action plan.**
   In the event of a nonconformity, [COMPANY NAME] will take action to control and correct it, or deal with the consequences, as applicable. [COMPANY NAME] will employ corrective action plans for the systematic elimination of issues and nonconformities. The plan will aim to resolve an issue from its root cause so that it can be prevented or mitigated in the future and sustain the corrective measures. It will include:
   - Review of the nonconformity
   - Root cause analysis and assessment
   - Determination of whether similar nonconformities are present or could occur
   - Required steps for root cause elimination
   - Implementing changes to the ISMS, if necessary
   - Risk-opportunity assessment of changes and review of their effectiveness
   - Time and cost assessment
   - Rubric for measuring effectiveness
- **[COMPANY NAME] **will document any corrective actions taken. The documentation will at a minimum include:
   - Nature of nonconformities
   - Identified root cause
   - Corrective actions taken
   - Implementation of corrective actions
   - Result of corrective actions (include effectiveness)

**ISMS Plan Revision History **

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
| 1.0 |  |  |  |  |  |
| 1.1 | 12/19/2024 | Ari Mojiri | Ari Mojiri | Typo and formatting corrections; removal of trailing periods for section numbers. |  |
|  |  |  |  |  |  |

### APPENDIX A 

### Statement of Applicability (SOA) & SOA Revision History

##### *You may use this optional template to document your statement of applicability. You may use this document or create a separate copy and manage it in a different format (e.g., internal wiki, etc.)*

### ISO/IEC 27001:2022 Annex A 

*NOTE: Per ISO/IEC 27001, the information security controls listed in Annex A are not exhaustive and additional information security controls can be included if needed.*

*NOTE 2: Per ISO/IEC 27006, It is possible for an organization to design its own necessary controls or to select them from any source, therefore it is possible that an organization is certified to ISO/IEC 27001 even though none of its necessary controls are those specified in ISO/IEC 27001:2022, Annex A. *

*NOTE 3: Per ISO/IEC 27005, only controls identified in the risk assessment can be included in the SOA. Controls cannot be added to the SOA independent of the risk assessment. There should be consistency between the controls necessary to realize selected risk treatment options and the SOA. The SOA can state that the justification for the inclusion of a control is the same for all controls and that they have been identified in the risk assessment as necessary to treat one or more risks to an acceptable level. No further justification for the inclusion of a control is needed for any of the controls.*

*NOTE 4: The justification for the inclusion of all controls listed as applicable in this SOA is the same for all controls: they have been identified in the risk assessment as necessary to treat one or more risks identified in the risk assessment to an acceptable level.*

#### Statement of Applicability

***[IMPORTANT NOTE: Downloadable version of the sample template can be found at the bottom of the page. When completing Appendix A, assess all 93 Annex A controls and determine if each is applicable based on your risk assessment. Clearly state whether each control is included or excluded, and provide specific, risk-based justifications for any exclusions. Avoid vague language, tie decisions to your actual environment. For applicable controls, note their implementation status and reference supporting policies or procedures to ensure the SoA is clear, justified, and audit-ready.]***

|  |  |  |  |  |  |
|---|---|---|---|---|---|
| **CONTROL** | **CONTROL TITLE & DESCRIPTION** | **APPLICABLE? (Y/N)** | **JUSTIFICATION FOR EXCLUSION** | **IMPLEMENTED? (Y/N)** | **IMPLEMENTATION DETAILS** |
| **A.5** | **ORGANIZATIONAL CONTROLS** |  |  |  |  |
| A.5.1 | Policies for information security<br>Information security policy and topic-specific policies should be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur. | [EXAMPLE]<br>Y | [EXAMPLE]<br>N/A | [EXAMPLE]<br>Y | [EXAMPLE]<br>All company policies currently approved by management and acknowledged by employees |
| A.5.2 | Information security roles and responsibilities<br>Information security roles and responsibilities should be defined and allocated according to the organization needs. |  |  |  |  |
| A.5.3 | Segregation of duties<br>Conflicting duties and conflicting areas of responsibility should be segregated. |  |  |  |  |
| A.5.4 | Management responsibilities<br>Management should require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization. |  |  |  |  |
| A.5.5 | Contact with authorities<br>The organization should establish and maintain contact with relevant authorities. |  |  |  |  |
| A.5.6 | Contact with special interest groups<br>The organization should establish and maintain contact with special interest groups or other specialist security forums and professional associations. |  |  |  |  |
| A.5.7 | Threat intelligence<br>Information relating to information security threats should be collected and analysed to produce threat intelligence. |  |  |  |  |
| A.5.8 | Information security in project management<br>Information security should be integrated into project management. |  |  |  |  |
| A.5.9 | Inventory of information and other associated assets<br>An inventory of information and other associated assets, including owners, should be developed and maintained. |  |  |  |  |
| A.5.10 | Acceptable use of information and other associated assets<br>Rules for the acceptable use and procedures for handling information and other associated assets should be identified, documented and implemented. |  |  |  |  |
| A.5.11 | Return of assets<br>Personnel and other interested parties as appropriate should return all the organization’s assets in their possession upon change or termination of their employment, contract or agreement. |  |  |  |  |
| A.5.12 | Classification of information<br>Information should be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements. |  |  |  |  |
| A.5.13 | Labeling of information<br>An appropriate set of procedures for information labeling should be developed and implemented in accordance with the information classification scheme adopted by the organization. | [EXAMPLE]<br>Y | [EXAMPLE]<br>N/A | [EXAMPLE]<br>N - In progress | [EXAMPLE]<br>Currently rolling out labeling strategy across the organization through Google Drive labeling features; expected completion by end of Q4 202X |
| A.5.14 | Information transfer<br>Information transfer rules, procedures, or agreements should be in place for all types of transfer facilities within the organization and between the organization and other parties. |  |  |  |  |
| A.5.15 | Access control<br>Rules to control physical and logical access to information and other associated assets should be established and implemented based on business and information security requirements. |  |  |  |  |
| A.5.16 | Identity management<br>The full life cycle of identities should be managed. |  |  |  |  |
| A.5.17 | Authentication information<br>Allocation and management of authentication information should be controlled by a management process, including advising personnel on the appropriate handling of authentication information. |  |  |  |  |
| A.5.18 | Access rights<br>Access rights to information and other associated assets should be provisioned, reviewed, modified and removed in accordance with the organization’s topic-specific policy on and rules for access control. |  |  |  |  |
| A.5.19 | Information security in supplier relationships<br>Processes and procedures should be defined and implemented to manage the information security risks associated with the use of supplier’s products or services. |  |  |  |  |
| A.5.20 | Addressing information security within supplier agreements<br>Relevant information security requirements should be established and agreed with each supplier based on the type of supplier relationship. |  |  |  |  |
| A.5.21 | Managing information security in the ICT supply chain<br>Processes and procedures should be defined and implemented to manage the information security risks associated with the ICT products and services supply chain. |  |  |  |  |
| A.5.22 | Monitoring, review and change management of supplier services<br>The organization should regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery. |  |  |  |  |
| A.5.23 | Information security for use of cloud services<br>Processes for acquisition, use, management and exit from cloud services should be established in accordance with the organization’s information security requirements. |  |  |  |  |
| A.5.24 | Information security incident management planning and preparation<br>The organization should plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities. |  |  |  |  |
| A.5.25 | Assessment and decision on information security events<br>The organization should assess information security events and decide if they are to be categorized as information security incidents. |  |  |  |  |
| A.5.26 | Response to information security incidents<br>Information security incidents should be responded to in accordance with the documented procedures. |  |  |  |  |
| A.5.27 | Learning from information security incidents<br>Knowledge gained from information security incidents should be used to strengthen and improve the information security controls. |  |  |  |  |
| A.5.28 | Collection of evidence<br>The organization should establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events. |  |  |  |  |
| A.5.29 | Information security during disruption<br>The organization should plan how to maintain information security at an appropriate level during disruption. |  |  |  |  |
| A.5.30 | ICT readiness for business continuity<br>ICT readiness should be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements. |  |  |  |  |
| A.5.31 | Legal, statutory, regulatory and contractual requirements<br>Legal, statutory, regulatory and contractual requirements relevant to information security and the organization’s approach to meet these requirements should be identified, documented and kept up to date. |  |  |  |  |
| A.5.32 | Intellectual property rights<br>The organization should implement appropriate procedures to protect intellectual property rights. |  |  |  |  |
| A.5.33 | Protection of records<br>Records should be protected from loss, destruction, falsification, unauthorized access and unauthorized release. |  |  |  |  |
| A.5.34 | Privacy and protection of PII<br>The organization should identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements. |  |  |  |  |
| A.5.35 | Independent review of information security<br>The organization’s approach to managing information security and its implementation including people, processes and technologies should be reviewed independently at planned intervals, or when significant changes occur. |  |  |  |  |
| A.5.36 | Compliance with policies, rules and standards for information security<br>Compliance with the organization’s information security policy, topic-specific policies, rules and standards should be regularly reviewed. |  |  |  |  |
| A.5.37 | Documented operating procedures<br>Operating procedures for information processing facilities should be documented and made available to personnel who need them. |  |  |  |  |
| **A.6** | **PEOPLE CONTROLS** |  |  |  |  |
| A.6.1 | Screening<br>Background verification checks on all candidates to become personnel should be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks. |  |  |  |  |
| A.6.2 | Terms and conditions of employment<br>The employment contractual agreements should state the personnel’s and the organization’s responsibilities for information security. |  |  |  |  |
| A.6.3 | Information security awareness, education and training<br>Personnel of the organization and relevant interested parties should receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function. |  |  |  |  |
| A.6.4 | Disciplinary process<br>A disciplinary process should be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation. |  |  |  |  |
| A.6.5 | Responsibilities after termination or change of employment<br>Information security responsibilities and duties that remain valid after termination or change of employment should be defined, enforced and communicated to relevant personnel and other interested parties. |  |  |  |  |
| A.6.6 | Confidentiality or non-disclosure agreements<br>Confidentiality or non-disclosure agreements reflecting the organization’s needs for the protection of information should be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties. |  |  |  |  |
| A.6.7 | Remote working<br>Security measures should be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization’s premises. |  |  |  |  |
| A.6.8 | Information security event reporting<br>The organization should provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner. |  |  |  |  |
| **A.7** | **PHYSICAL CONTROLS** |  |  |  |  |
| A.7.1 | Physical security perimeters<br>Security perimeters should be defined and used to protect areas that contain information and other associated assets. |  |  |  |  |
| A.7.2 | Physical entry<br>Secure areas should be protected by appropriate entry controls and access points. |  |  |  |  |
| A.7.3 | Securing offices, rooms and facilities<br>Physical security for offices, rooms and facilities should be designed and implemented. |  |  |  |  |
| A.7.4 | Physical security monitoring<br>Premises should be continuously monitored for unauthorized physical access. |  |  |  |  |
| A.7.5 | Protecting against physical and environmental threats<br>Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure should be designed and implemented. |  |  |  |  |
| A.7.6 | Working in secure areas<br>Security measures for working in secure areas should be designed and implemented. |  |  |  |  |
| A.7.7 | Clear desk and clear screen<br>Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities should be defined and appropriately enforced. |  |  |  |  |
| A.7.8 | Equipment siting and protection<br>Equipment should be sited securely and protected. |  |  |  |  |
| A.7.9 | Security of assets off-premises<br>Off-site assets should be protected. |  |  |  |  |
| A.7.10 | Storage media<br>Storage media should be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization’s classification scheme and handling requirements. |  |  |  |  |
| A.7.11 | Supporting utilities<br>Information processing facilities should be protected from power failures and other disruptions caused by failures in supporting utilities. |  |  |  |  |
| A.7.12 | Cabling security<br>Cables carrying power, data or supporting information services should be protected from interception, interference or damage. |  |  |  |  |
| A.7.13 | Equipment maintenance<br>Equipment should be maintained correctly to ensure availability, integrity and confidentiality of information. |  |  |  |  |
| A.7.14 | Secure disposal or re-use of equipment<br>Items of equipment containing storage media should be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use. |  |  |  |  |
| **A.8** | **TECHNICAL CONTROLS** |  |  |  |  |
| A.8.1 | User endpoint devices<br>Information stored on, processed by or accessible via user endpoint devices should be protected. |  |  |  |  |
| A.8.2 | Privileged access rights<br>The allocation and use of privileged access rights should be restricted and managed. |  |  |  |  |
| A.8.3 | Information access restriction<br>Access to information and other associated assets should be restricted in accordance with the established topic-specific policy on access control. |  |  |  |  |
| A.8.4 | Access to source code<br>Read and write access to source code, development tools and software libraries should be appropriately managed. |  |  |  |  |
| A.8.5 | Secure authentication<br>Secure authentication technologies and procedures should be implemented based on information access restrictions and the topic-specific policy on access control. |  |  |  |  |
| A.8.6 | Capacity management<br>The use of resources should be monitored and adjusted in line with current and expected capacity requirements. |  |  |  |  |
| A.8.7 | Protection against malware<br>Protection against malware should be implemented and supported by appropriate user awareness. |  |  |  |  |
| A.8.8 | Management of technical vulnerabilities<br>Information about technical vulnerabilities of information systems in use should be obtained, the organization’s exposure to such vulnerabilities should be evaluated and appropriate measures should be taken. |  |  |  |  |
| A.8.9 | Configuration management<br>Configurations, including security configurations, of hardware, software, services and networks should be established, documented, implemented, monitored and reviewed. |  |  |  |  |
| A.8.10 | Information deletion<br>Information stored in information systems, devices or in any other storage media should be deleted when no longer required. |  |  |  |  |
| A.8.11 | Data masking<br>Data masking should be used in accordance with the organization’s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration. |  |  |  |  |
| A.8.12 | Data leakage prevention<br>Data leakage prevention measures should be applied to systems, networks and any other devices that process, store or transmit sensitive information. |  |  |  |  |
| A.8.13 | Information backup<br>Backup copies of information, software and systems should be maintained and regularly tested in accordance with the agreed topic-specific policy on backup. |  |  |  |  |
| A.8.14 | Redundancy of information processing facilities<br>Information processing facilities should be implemented with redundancy sufficient to meet availability requirements. |  |  |  |  |
| A.8.15 | Logging<br>Logs that record activities, exceptions, faults and other relevant events should be produced, stored, protected and analysed. |  |  |  |  |
| A.8.16 | Monitoring activities<br>Networks, systems and applications should be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents. |  |  |  |  |
| A.8.17 | Clock synchronization<br>The clocks of information processing systems used by the organization should be synchronized to approved time sources. |  |  |  |  |
| A.8.18 | Use of privileged utility programs<br>The use of utility programs that can be capable of overriding system and application controls should be restricted and tightly controlled. |  |  |  |  |
| A.8.19 | Installation of software on operational systems<br>Procedures and measures should be implemented to securely manage software installation on operational systems. |  |  |  |  |
| A.8.20 | Networks security<br>Networks and network devices should be secured, managed and controlled to protect information in systems and applications. |  |  |  |  |
| A.8.21 | Security of network services<br>Security mechanisms, service levels and service requirements of network services should be identified, implemented and monitored. |  |  |  |  |
| A.8.22 | Segregation of networks<br>Groups of information services, users and information systems should be segregated in the organization’s networks. |  |  |  |  |
| A.8.23 | Web filtering<br>Access to external websites should be managed to reduce exposure to malicious content. |  |  |  |  |
| A.8.24 | Use of cryptography<br>Rules for the effective use of cryptography, including cryptographic key management, should be defined and implemented. |  |  |  |  |
| A.8.25 | Secure development life cycle<br>Rules for the secure development of software and systems should be established and applied. |  |  |  |  |
| A.8.26 | Application security requirements<br>Information security requirements should be identified, specified and approved when developing or acquiring applications. |  |  |  |  |
| A.8.27 | Secure system architecture and engineering principles<br>Principles for engineering secure systems should be established, documented, maintained and applied to any information system development activities. |  |  |  |  |
| A.8.28 | Secure coding<br>Secure coding principles should be applied to software development. |  |  |  |  |
| A.8.29 | Security testing in development and acceptance<br>Security testing processes should be defined and implemented in the development life cycle. |  |  |  |  |
| A.8.30 | Outsourced development<br>The organization should direct, monitor and review the activities related to outsourced system development. | Not Applicable | Not needed to implement risk treatment plan | N/A | N/A |
| A.8.31 | Separation of development, test and production environments<br>Development, testing and production environments should be separated and secured. |  |  |  |  |
| A.8.32 | Change management<br>Changes to information processing facilities and information systems should be subject to change management procedures. |  |  |  |  |
| A.8.33 | Test information<br>Test information should be appropriately selected, protected and managed. |  |  |  |  |
| A.8.34 | Protection of information systems during audit testing<br>Audit tests and other assurance activities involving assessment of operational systems should be planned and agreed between the tester and appropriate management. |  |  |  |  |

**Addendum for ISO/IEC 27017**

| **CONTROL** | **CONTROL TITLE & DESCRIPTION** | **APPLICABLE?**<br>**(Y/N)** | **JUSTIFICATION FOR EXCLUSION** | **IMPLEMENTED?**<br>**(Y/N)** | **IMPLEMENTATION DETAILS** |
|---|---|---|---|---|---|
| CLD 6.3.1 | Shared roles and responsibilities within a cloud computing environment<br>Responsibilities for shared information security roles in the use of the cloud service should be allocated to identified parties, documented, communicated and implemented by both the cloud service customer and the cloud service provider. |  |  |  |  |
| CLD 8.1.5 | Removal of cloud service customer assets<br>Assets of the cloud service customer that are on the cloud service provider's premises should be removed, and returned if necessary, in a timely manner upon termination of the cloud service agreement. |  |  |  |  |
| CLD 9.5.1 | Segregation in virtual computing environments<br>A cloud service customer's virtual environment running on a cloud service should be protected from other cloud service customers and unauthorized persons. |  |  |  |  |
| CLD 9.5.2 | Virtual Machine Hardening<br>Virtual machines in a cloud computing environment should be hardened to meet business needs. |  |  |  |  |
| CLD 12.1.5 | Administrator's operational security<br>Procedures for administrative operations of a cloud computing environment should be defined, documented and monitored. |  |  |  |  |
| CLD 12.4.5 | Monitoring of Cloud Services<br>The cloud service customer should have the capability to monitor specified aspects of the operation of the cloud services<br>that the cloud service customer uses. |  |  |  |  |
| CLD 13.1.4 | Alignment of security management for virtual and physical networks<br>Upon configuration of virtual networks, consistency of configurations between virtual and physical networks should be verified based on the cloud service provider's network security policy. |  |  |  |  |

**[Delete if your ISMS doesn't include ISO27017]**

**Addendum for ISO/IEC 27018**

| **CONTROL** | **CONTROL TITLE & DESCRIPTION** | **APPLICABLE?**<br>**(Y/N)** | **JUSTIFICATION FOR EXCLUSION** | **IMPLEMENTED?**<br>**(Y/N)** | **IMPLEMENTATION DETAILS** |
|---|---|---|---|---|---|
| A.2.1 | Obligation to co-operate regarding PII principals’ rights<br>The public cloud PII processor should provide the cloud service customer with the means to enable them to fulfill their obligation to facilitate the exercise of PII principals’ rights to access, correct and/or erase PII pertaining to them. |  |  |  |  |
| A.3.1 | Public cloud PII processor’s purpose<br>PII to be processed under a contract should not be processed for any purpose independent of the instructions of the cloud service customer. |  |  |  |  |
| A.3.2 | Public cloud PII processor's commercial use<br>PII processed under a contract should not be used by the public cloud PII processor for the purposes of marketing and advertising without express consent. Such consent should not be a condition of receiving the service. |  |  |  |  |
| A.5.1 | Secure erasure of temporary files<br>Temporary files and documents should be erased or destroyed within a specified, documented period. |  |  |  |  |
| A.6.1 | PII disclosure notification<br>The contract between the public cloud PII processor and the cloud service customer should require the public cloud PII processor to notify the cloud service customer, in accordance with any procedure and time periods agreed in the contract, of any legally binding request for disclosure of PII by a law enforcement authority, unless such a disclosure is otherwise prohibited. |  |  |  |  |
| A.6.2 | Recording of PII disclosures<br>Disclosures of PII to third parties should be recorded, including what PII has been disclosed, to whom and at what time. |  |  |  |  |
| A.8.1 | Disclosure of sub-contracted PII processing<br>The use of sub-contractors by the public cloud PII processor to process PII should be disclosed to the relevant cloud service customers before their use. |  |  |  |  |
| A.10.1 | Notification of a data breach involving PII<br>The public cloud PII processor should promptly notify the relevant cloud service customer in the event of any unauthorized access to PII or unauthorized access to processing equipment or facilities resulting in loss, disclosure or alteration of PII. |  |  |  |  |
| A.10.2 | Retention period for administrative security policies and guidelines<br>Copies of security policies and operating procedures should be retained for a specified, documented period on replacement (including updating). |  |  |  |  |
| A.10.3 | PII return, transfer and disposal<br>The public cloud PII processor should have a policy in respect of the return, transfer and/or disposal of PII and should make this policy available to the cloud service customer. |  |  |  |  |
| A.11.1 | Confidentiality or non-disclosure agreements<br>Individuals under the public cloud PII processor’s control with access to PII should be subject to a confidentiality obligation. |  |  |  |  |
| A.11.2 | Restriction of the creation of hardcopy material<br>The creation of hardcopy material displaying PII should be restricted. |  |  |  |  |
| A.11.3 | Control and logging of data restoration<br>There should be a procedure for, and a log of, data restoration efforts. |  |  |  |  |
| A 11.4 | Protecting data on storage media leaving the premises<br>PII on media leaving the organization's premises should be subject to an authorization procedure and should not be accessible to anyone other than authorized personnel (e.g. by encrypting the data concerned). |  |  |  |  |
| A.11.5 | Use of unencrypted portable storage media and devices<br>Portable physical media and portable devices that do not permit encryption should not be used except where it is unavoidable, and any use of such portable media and devices should be documented. |  |  |  |  |
| A.11.6 | Encryption of PII transmitted over public data-transmission networks<br>PII that is transmitted over public data-transmission networks should be encrypted prior to transmission. |  |  |  |  |
| A.11.7 | Secure disposal of hardcopy materials<br>Where hardcopy materials are destroyed, they should be destroyed securely using mechanisms such as cross-cutting, shredding, incinerating, pulping, etc. |  |  |  |  |
| A.11.8 | Unique use of user IDs<br>If more than one individual has access to stored PII, then they should each have a distinct user ID for identification, authentication and authorization purposes. |  |  |  |  |
| A.11.9 | Records of authorized users<br>An up-to-date record of the users or profiles of users who have authorized access to the information system should be maintained. |  |  |  |  |
| A.11.10 | User ID management<br>De-activated or expired user IDs should not be granted to other individuals. |  |  |  |  |
| A.11.11 | Contract measures<br>Contracts between the cloud service customer and the public cloud PII processor should specify minimum technical and organizational measures to ensure that the contracted security arrangements are in place and that data are not processed for any purpose independent of the instructions of the controller. Such measures should not be subject to unilateral reduction by the public cloud PII processor. |  |  |  |  |
| A.11.12 | Sub-contracted PII processing<br>Contracts between the public cloud PII processor and any sub-contractors that process PII should specify minimum technical and organizational measures that meet the information security and PII protection obligations of the public cloud PII processor. Such measures should not be subject to unilateral reduction by the sub-contractor. |  |  |  |  |
| A.11.13 | Access to data on pre-used data storage space<br>The public cloud PII processor should ensure that whenever data storage space is assigned to a cloud service customer, any data previously residing on that storage space is not visible to that cloud service customer. |  |  |  |  |
| A.12.1 | Geographical location of PII<br>The public cloud PII processor should specify and document the countries in which PII can possibly be stored. |  |  |  |  |
| A.12.2 | Intended destination of PII<br>PII transmitted using a data-transmission network should be subject to appropriate controls designed to ensure that data reaches its intended destination. |  |  |  |  |

**[Delete if your ISMS does not include ISO 27018.]**

### Statement of Applicability Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** |
|---|---|---|---|---|
| 1.0 | XX/XX/XX |  |  | Initial creation |
|  |  |  |  |  |
|  |  |  |  |  |

### APPENDIX B

### Management Review Agenda and Minutes Template

*You may use this optional template to satisfy requirements for documented information of the management reviews per clause 9.3 To use this template, create a separate copy and document the agenda and minutes for every management review meeting. Documentation of the management review should be maintained separate from this ISMS plan. We recommend you delete this template from the ISMS plan before finalizing the document and submitting it for final review and approval. *

**<DATE> | <QX> Management Review Meeting**

Attendees: **< >**

**Status of action items from previous management reviews**

| Action Item | Responsible Party | Status |
|---|---|---|
| **<Example> Request quotes for certification audit** | **<Example> IT Manager** | **<Example> Completed** |

**Changes in external and internal issues that are relevant to the information security management systems:**

- *<Example> The rise of artificial intelligence has become a relevant external issue as there is an increased risk that employees will enter company or customer data in online AI tools*

**Changes in needs and expectations of interested parties that are relevant to the information**

**security management system;**

- *<Example> We entered into a contract with a new customer that requires ISO/IEC 27017 to be implemented as part of the ISMS before the end of next year*

**Audit results**

- *<Example> Internal Audit was completed on XX/XX. We received the audit report with 2 minor nonconformities (see below). *

**Review of nonconformities and corrective actions:**

- ***<Example> Internal Audit identified the following nonconformities:***
   - *13 controls marked applicable in the statement of applicability did not tie to a risk in the risk register (6.1.3)*
   - *Two policy documents have not been reviewed and approved within the past year as required by the information security policy. *

**Monitoring and measurement results**

- *<Insert evidence (for example, links to dashboards, reports, presentations etc.) to results of metrics evaluation as defined in clause 9.1>*

**Fulfillment of information security objectives**

- *<Example> We are on track to achieve our information security objective of achieving ISO/IEC 27001 certification by QX, 202X (objectives were defined in clause 6 of the ISMS plan). *

**Feedback from interested parties**

- *<Example> We communicated the expected certification date to JP Morgan (customer) to whom we are contractually obligated to obtain the certification this year and received positive feedback.*

**Results of risk assessment and status of risk treatment plan**

- *<Example> The most recent risk assessment was completed on XX/XX. As of these date and after implementing the risk treatment plan since the previous risk assessment the following remain:*
   - *1 critical risk*
   - *3 high risks*
   - *3 medium risks*
   - *75 low risks - The residual risks for these have been deemed acceptable following the implementation of the necessary controls *

**Opportunities for continual improvement**

- *<Example> The most recent risk assessment was completed on XX/XX. As of these date and after implementing the risk treatment plan since the previous risk assessment the following remain:*
   - *1 critical risk*
   - *3 high risks*
   - *3 medium risks*
   - *75 low risks - The residual risks for these have been deemed acceptable following the implementation of the necessary controls *

**Decisions and need for changes to the information security management system**

| Action Item | Responsible Party | Expected Completion Date |
|---|---|---|
| Schedule meeting for review of quotes and selection of certification auditor | <Example> IT Manager | <Example> XX/XX/XXXX |
| Implement corrective actions for the nonconformities identified in the internal audit | <Example> IT Manager | <Example> XX/XX/XXXX |

### APPENDIX C

### Corrective Action Report Template

*You may use this optional template to satisfy requirements for documented information of the evaluation of nonconformities and corrective actions per clause 10.2. To use this template, create a separate copy and complete an evaluation every time a nonconformity (e.g., control failure, non-fulfillment of a requirement) is identified. Nonconformities can be identified from many sources including internal audits, external audits, personnel reporting, etc.Documentation of nonconformities and corrective actions should be maintained separate from this ISMS plan. We recommend you delete this template from the ISMS plan before finalizing the document and submitting it for final review and approval. *

| **CORRECTIVE ACTION REPORT** | **Confidentiality** | **Date of Review** | [DATE] |
|---|---|---|---|
| *[COMPANY NAME]* | ***[LEVEL]*** | **Date of Previous Review** | [DATE] |
| **NON-CONFORMITIES** |  |  |  |
| 1. [NONCONFORMITY] |  |  |  |
| **Date Identified ** |  | **Description** |  |
| **Source** |  | **Corrective Action** |  |
| **Root Cause** |  | **Implementation** |  |
| **Result/Effectiveness** |  |  |  |
| **Due Date** |  | **Owner** |  |
| **Notes:** |  |  |  |
| 1. [NONCONFORMITY] |  |  |  |
| **Date Identified ** |  | **Description** |  |
| **Source** |  | **Corrective Action** |  |
| **Root Cause** |  | **Implementation** |  |
| **Result/Effectiveness** |  |  |  |
| **Due Date** |  | **Owner** |  |
| **Notes:** |  |  |  |

### Internal Audit Plan and Procedure

### Purpose

The purpose of the internal audit is to ensure the effectiveness of **Example Corporation**’s information security management system, its continuous improvement, and conformance with the requirements of ISO 27001:2022, as set out in Clause 9.2 of the standard. It will ensure (a) conformance with the standard, and more importantly, (b) proper information security measures in place that are continuously improved. Additionally, the internal audit will:

- Uncover nonconformities before others discover them;
- Ensure a strong security stance by identifying areas that require attention prior to a security event;
- Demonstrate and inform management commitment; and
- Assist staff understanding and awareness.

### Scope

This plan applies to **Example Corporation** internal audits of the ISMS, and establishes the procedures for carrying out the audit. The audit scope should match the ISMS.

### Roles and responsibilities

*Lead Auditor*: Responsible for the planning and execution of the audit. The lead auditor is a competent entity independent from the ISMS, who is a member of the company independent of the ISMS OR a third party auditor.

*Employees*: Responsible for assisting in the audit process, when and as required.

### Plan

- Audit schedule
   - Properly planned out audit, and readily-available schedule to let all members aware of when each process will be audited over the upcoming cycle.
   - Allow time for better preparation and practical support.
   - Allow time for process owners to:
      1. finish any improvement projects and gather valuable information on the implementation; or,
      2. request that the auditor(s) focus on helping to gather information for other planned improvements.
- Coordinate with process owners
   - Collaborate to determine the best time to review the process.
   - Auditor(s) can review previous audits to see if any follow-up is required on comments or concerns previously found.
   - Process owners can identify any areas that the auditor can look at to assist the process owner to identify information.
   - Ensure that the process owners will get value out of the audit process.
- Conducting the audit
   - Gather, review, analyze information as outlined in the audit procedures below.
   - Identify areas that do not have operational evidence.
   - Identify areas that may function better if changes are made.
- Reporting audit findings
   - Meet with interested parties and process owners to ensure an efficient flow of information (non-conforming).
   - Highlight areas of weakness to be addressed, and areas that could use improvement (improvement opportunities).
- Follow-up
   - Ensure that identified areas of non-conformity are resolved and corrective actions have been taken.
   - Check any progress on identified improvement opportunities.

### Procedure

- Review ISMS documentation
   - Audit scope should match ISMS, setting clear limits for the internal audit.
   - All prescribed documents(See *Prescribed Documentation *above) are in place and readily available.
- Identify any criteria, if any, needed for consideration during the audit
   - Identify the extent of work that may be done during the audit
   - Identify any anticipated limitations
- Identify the main stakeholders in the ISMS
   - Any required documentation for the audit could be easily requested.
- Management input
   - Designated internal auditor should be competent and independent.
   - Agree and determine the timing and resources required for the audit.
   - Set milestones/checkpoints for when the board should receive interim updates.
   - Discuss issues or concerns
- Conduct practical assessment
   - Observe the operation of the ISMS, and whether it properly functions in practice by speaking with members involved and operating processes related to the ISMS, whether they are in an ISMS role or not.
   - Run audit tests to validate evidence as it is gathered.
   - Complete audit reports and document the results of each test.
- Analyze evidence
   - Sort and review all evidence collected during the audit, as related to the company’s risk treatment plan and control objectives.
   - Identify any further gaps or need for further audit tests.
- Report findings (see *Appendix A*). The report should include:
   - Classification and dissemination restrictions of the report
   - Intended recipient(s) of the report
   - An executive summary to highlight the key findings, high-level analysis and a conclusion
   - Scope, Timing, any outlined criteria
   - Analysis of the findings and compliance with each clause of the ISMS requirements
   - Recommendations
   - Post-audit actions

| **INTERNAL AUDIT REPORT** | **Confidentiality** | **Date of Audit** | 02/14/2023 - 02/23/2023 |  |  |
|---|---|---|---|---|---|
| ***Example Corporation*** | ***Internal Use*** | **Date of Previous Audit** | N/A |  |  |
| **RECIPIENT(S)** | - John Smith - CISO<br>- Jane Doe - Manager, GRC<br>- Lisa Bautista - CEO<br>- James Chapman - CTO<br>- Alice Wallace - CFO |  |  |  |  |
| **EXECUTIVE SUMMARY** |  |  |  |  |  |
| Internal Audit has prepared the following report after conducting an audit on the **Example Corporation**’s web and mobile applications. This audit was conducted pursuant to receiving ISO 27001 certification for **Example Corporation**’s ISMS. This audit was conducted against the ISO 27001 and ISO 27002 standards. Evidence was collected through the use of the Drata Platform and collected from the interviews with the GRC Manager, and taking screenshots from specific systems not otherwise captured within the Drata Platform. The overall opinion of the internal audit is that Drata’s ISMS was established and is being operated appropriately. Three (3) minor non-conformities were noted and one (1) enhancements/process improvements were noted. It is the recommendation of Internal Audit that the three (3) minor non-conformities are remediated prior to beginning Stage 1 of the ISO 27001 audit. |  |  |  |  |  |
| **AUDITOR** | **AUDIT SCOPE & CRITERIA** |  |  |  |  |
| **Auditor Name** | Benedict Arnold | **Scope** | - **Organizational Units **<br>**Example Corporation** Management<br>Information Security<br>Information Technology & Engineering<br>Human Resources<br>Legal<br>- **Networks and IT Infrastructure**<br>Amazon Web Services (AWS)<br>GitHub<br>Slack<br>Jira<br>- **Processes and Services**<br>**Example Corporation** Web Application (app.examplecorp.com)<br>**Example Corporation** Mobile Application (iOS & Android)<br>- **Locations**<br>Not Applicable as **Example Corporation** has not physical locations in scope<br>**EXCLUSIONS. **The following items are explicitly excluded from the ISMS scope of **Example Corporation**:<br>- Business Units:<br>Sales<br>Marketing<br>Finance<br>- Vendor Dependencies:<br>Amazon Web Services (AWS) - Data Center & Physical Security Controls |  |  |
| **Internal or External?** | Internal |  |  |  |  |
| **Organization (if external)** | N/A | **Criteria** | Refer to associated document Drata ISMS SOA |  |  |
| **Primary Role** | Lead Internal Auditor |  |  |  |  |
| **AUDIT METHOD** | **AUDIT FINDINGS** |  |  |  |  |
| **Activity** | **Action** | **Nonconformities** |  |  |  |
| Document Review | All evidence were provided through the use of Drata platform’s Audit Hub and reviewed with Read-Only Access | **Clause 7.5.2.B - Example Corporation'**s document history table does not include details such as format (Electronic/Physical), language, software version, etc. which is listed in item B of Clause 7.5.2.<br>**Annex A 5.13 - Example Corporation**’s Data Classification Policy does not include guidance for labeling data.<br>**Annex A 5.22 - Example Corporation'**s Vendor Management Policy does not include procedures related to managing changes in supplier contracts, changes to the services delivered by suppliers, or changes at **Example Corporation** made in order to implement changes in supplier contracts or services. |  |  |  |
| Evidential Sampling | For select controls, the Internal Auditor requested additional documentation including samples using a sample size of 1 as supplementary evidence to support provided documents. |  |  |  |  |
| **Interviews** | **Improvement Opportunities** |  |  |  |  |
| ISMS Key Members | Non-ISMS Members | **Annex A 8.27** |  |  |  |
| Jane Doe |  |  |  |  |  |
| **RECOMMENDATIONS** |  |  |  |  |  |
| **Annex A 8.27 - Example Corporation**'s SDLC policy does not formally document secure engineering principles. Review and ensure that SDLC policy includes secure engineering principles. |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
| **COMPLIANCE** | **POST-AUDIT ACTIONS** |  |  |  |  |
| Clause 4<br>Clause 5<br>Clause 6<br>Clause 7<br>Clause 8<br>Clause 9<br>Clause 10 | Minor non-conformities found on Clause 7.5.2B, Annex A 5.13, and Annex A 5.22. | **Example Corporation**’s Management should review the provided Internal Audit report, develop a treatment plan, and remediate the non-conformities listed before moving into Stage 1 of the ISO 27001 audit. |  |  |  |
|  |  |  |  |  |  |
| **Dissemination Restrictions:** | Internal Use only, this report is meant to be reviewed by management of ISMS |  |  |  |  |
| **Report PREPARED by:** | Benedict Arnold | Internal Auditor | Remote - N/A | 2/23/2023<br>4PM PST |  |
| **Report APPROVED by:** | John Smith | CISO | Remote - N/A | 2/24/2023<br>11AM PST |  |

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
| 1.0 | 03/20/2023 | Jane Doe | John Smith | Initial Creation | .DOCX |

## Downloadable Version of this Template

## Related articles

- [ISO 27001:2022 Checklist](iso-27001-2022-checklist.md)
- [ISO 27001:2022](iso-27001-2022.md)
- [ISO 27001:2013 Example ISMS Plan](iso-27001-2013-example-isms-plan.md)
- [ISO 27001:2022 Updates as of 5/7/2024](iso-27001-2022-updates-as-of-5-7-2024.md)
- [Ready for ISO 42001? Let’s Talk Next Steps](ready-for-iso-42001-let-s-talk-next-steps.md)

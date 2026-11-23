# Vendor Management Policy Guidance

Source: https://help.drata.com/en/articles/7852188-vendor-management-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Vendor Management Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in **bold** and enclosed in brackets “**[...]**” below the statements of the policy.

### Vendor Management Policy

[COMPANY NAME]

______________________________________________________________________

**Purpose**

The purpose of this policy is to establish requirements for ensuring third-party service providers/vendors meet [COMPANY NAME] requirements for preserving and protecting [COMPANY NAME] information.

### Scope

The policy applies to all IT vendors and partners who have the ability to impact the confidentiality, integrity, and availability of [COMPANY NAME]’s technology and sensitive information, or who are within the scope of [COMPANY NAME]’s information security program. This policy also applies to all employees and contractors that are responsible for the management and oversight of IT vendors and partners of [COMPANY NAME].

**Background**

This policy prescribes the minimum standards a vendor must meet from an information security standpoint, including security clauses, risk assessments, service level agreements, and incident management.

**Roles and Responsibilities**

<ROLES AND RESPONSIBILITIES>

**- [Additional guidance on what roles and responsibilities to list in this policy can be found in [Roles and Responsibilities Guidance](roles-and-responsibilities-guidance.md). **

**To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

**Policy**

[COMPANY NAME] makes every effort to assure all 3rd party organizations (including cloud service providers) are compliant and do not compromise the integrity, security, and privacy of [COMPANY NAME] or its customer data. 3rd parties include customers, partners, subcontractors, and contracted developers.

- IT vendors are prohibited from accessing [COMPANY NAME]’s information security assets until a contract containing security controls is agreed to and signed by the appropriate parties.

**- [This bullet talks about having your vendor agree to security control requirements prior to giving them access to your information security assets so they are aware of their security responsibilities and take appropriate measures to protect the assets you entrust them to access]**

- All IT vendors must comply with the security policies defined and derived from [COMPANY NAME]’s Information Security Program to include the Acceptable Use Policy.

**- [This bullet emphasizes that your company’s security standards are upheld by your external vendors]**

- IT vendors and partners must ensure that organizational records are protected, safeguarded, and disposed of securely. [COMPANY NAME] strictly adheres to all applicable legal, regulatory and contractual requirements regarding the collection, processing, and transmission of sensitive data such as Personally-Identifiable Information (PII).

**- [This bullet emphasizes that vendors must ensure that they have appropriate security measures in place to protect the confidentiality, integrity, and availability of your company’s records and data, while considering applicable contractual and legal obligation]**

- [COMPANY NAME] may choose to audit IT vendors and partners to ensure compliance with applicable security policies, as well as legal, regulatory and contractual obligations.

**- [This bullet means that your company is reserving the right to conduct audits of your vendors and partners to identify any potential security risks or compliance issues]**

**Vendor Inventory**

An inventory of third party service providers shall be maintained, and will include:

- Vendor risk level
- Types of data shared with the third party
- Brief description of services
- Main point of contact at the third party
- How access is granted to the third party vendor
- Significant controls in place
- Security report and/or questionnaire

**- [It is important to identify your key vendors to include in Drata’s Vendor module. In general, these will be your vendors who may have your customer’s data, impact the availability of your platform, or perform some type of security service for you. For more information, please refer to [How to Determine Key Vendors to include in Drata](how-to-determine-key-vendors-to-include-in-drata.md)]**

**Vendor risk level assessment will be based on the following considerations:**

- High: the vendor stores or has access to sensitive data and a failure of this vendor would have critical impact on your business
- Moderate: the vendor does not store or have access to sensitive data and a failure of this vendor would not have critical impact on your business
- Low: the vendor doesn't store or have access to any data and a failure of this vendor would have very little to no impact on your business

**- [This scoring will vary depending on the result of your risk level assessment associated with each of your vendors. This may depend on the criticality of the services they provide to the organization, as well as the level of access they have to the organization’s systems and data]**

**Vendor Contracts - General**

Formal contracts that address relevant security and privacy requirements must be in place for all third parties that process, store, or transmit confidential data or provide critical services. The following must be included in all such contracts:

**- [This section emphasizes that your organization recognizes the importance of having a formal agreement in place with your third-party vendors. You may change the line “The following must be included in all such contracts” to “The following must be considered for all contracts which [Company Name] has control over." This is to account for larger vendors where a customized contract would not be possible.]**

- Contracts will acknowledge that the third party is responsible for the security of the institution’s confidential data that it possesses, stores, processes, or transmits.

**- [This bullet means that your organization is expecting your third party vendors to be responsible in safeguarding all your data as part of a contractual agreement]**

- Contracts stipulate that the third-party security controls are regularly reviewed and validated by an independent party.

**- [This bullet means that you are putting in your contract that your third party vendors are expected to undergo regular security audits and assessments to ensure that their security controls are objectively evaluated for its effectiveness]**

- Contracts identify information security policies relevant to the agreement.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. By including this in the contract, you are ensuring that your vendor is aware of the expectations related to information security]**

- Contracts establish training and awareness requirements for specific procedures and information security requirements.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. This means that contracts signed with third party vendors must provision training and awareness requirements for their employees who may handle your organization’s data]**

- Contracts identify relevant regulations for sub-contracting.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. This refers to when your vendor hires another party to perform services on behalf of the organization. Having this in the contract will help ensure that subcontractors will comply with the same security and privacy requirements as the vendor]**

- Contracts implement a monitoring process and acceptable methods for validating the adherence to security requirements of delivered information and communication technology products and services.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. Having this in place in the contract emphasizes that your third party vendor is expected to continue meeting the security requirements of your organization throughout the contract]**

- Contracts implement specific processes for managing information and communication technology component lifecycle and availability and associated security risks.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. Having this in the contract means that your third party vendor is expected to ensure that all technology components remain available and secure, as well as have a process in place to monitor and manage risks associated with the components]**

- Contracts identify and outline use of key controls to ensure the protection of organizational assets – e.g. physical controls, controls for protection against malicious code, physical protection controls, controls to protect integrity, availability and confidentiality of information, controls to ensure the return or destruction of information assets after their use, controls to prevent copying and distributing information.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. This emphasizes the importance of outlining key controls in the contract to ensure that both parties understand their respective responsibilities for protecting the organization’s assets]**

- Contracts define information security requirements and identify the owner of information and how intellectual property rights are regulated.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. Having this in the contract will help identify who owns the information being processed, stored, or transmitted by the vendors]**

- Contracts will include screening requirements and background verification checks for contractors, which must be completed prior to joining the organization.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. This bullet discusses the need to have a screening process and background check for contractors working for a third party organization as they may potentially handle sensitive data]**

- Screening requirements for personnel provided to [COMPANY NAME] must be included within the agreement.

**- [This bullet is optional for SOC 2, but required for other frameworks such as ISO 27001. Similar to the bullet above, this discusses the need to provision a screening process for personnel provided by your vendor to your company]**

- Contracts identify the recourse available to [COMPANY NAME] should the third party fail to meet defined security requirements.

**- [Having this in place in the contract will give your organization the ability to take action against the vendor should they fail to fulfill their contractual obligations with regards to security]**

- Contracts establish responsibilities for responding to direct and indirect security incidents including timing as defined by service-level agreements (SLAs).

**- [Having this in the contract will help define the level of service your vendor is expected to provide in responding to security incidents. This helps ensure that your vendor is prepared to respond to incidents in a timely and effective manner]**

- Contracts specify the security requirements for the return or destruction of data upon contract termination.

**- [Having this in the contract will help ensure that your vendor does not retain any sensitive information upon termination of the contract and reduce the risk of data breaches or unauthorized access to the information] **

- Responsibilities for managing devices (e.g., firewalls, routers) that secure connections with third parties are formally documented in the contract.

**- [This bullet is emphasizing that the contract would define who is responsible for ensuring that the connection being used is secure should a vendor need to connect directly to your organization’s systems]**

- Contracts stipulate geographic limits on where data can be stored or transmitted.

**- [This bullet is not required for SOC 2, but is important if your organization or your customers have concerns about certain countries or regions where data is being processed or stored. This talks about having your organization and the vendor contractually agree upon which geographic locations data will be processed, stored, or transmitted.**

**Vendor Contracts - Cloud Service Providers**

**- [This section was added to account for the 2022 version of the ISO 27001. This will help lay out the process for the management of the cloud services.**

**For SOC 2, this section is optional and can be modified or removed entirely]**

Collaborative efforts and responsibilities with cloud service providers will be defined, with consideration given to the following aspects:

- Cloud service selection criteria and scope of cloud service usage;
- Information security controls that are managed by the cloud service provider and those that are managed by the organization as the cloud service customer;
- How to obtain and utilize information security capabilities provided by the cloud service provider;
- How to obtain assurance on information security controls implemented by cloud service providers;
- How to manage controls, interfaces and changes in services when an organization uses multiple cloud services, particularly from different cloud service providers;
- Procedures for handling information security incidents that occur in relation to the use of cloud services;
- The approach for monitoring, reviewing and evaluating the ongoing use of cloud services to manage information security risks;
- How to change or stop the use of cloud services including exit strategies for cloud services.

**- [The purpose of this section is to clarify which information security security controls are managed by the cloud service provider and which are the ones managed by the organization as the cloud service customer]**

Formal contracts that address relevant security and privacy requirements must be in place for all cloud service providers that process, store, or transmit confidential data or provide critical services. The following must be included in all such contracts:

- Providing solutions based on industry accepted standards for architecture and infrastructure;
- Managing access controls of the cloud service to meet the requirements of the organization;
- Implementing malware monitoring and protection solutions;
- Supporting the organization in gathering digital evidence, taking into consideration laws and regulations for digital evidence across different jurisdictions;
- Providing appropriate support and availability of services for an appropriate time frame when the organization wants to exit from the cloud service;
- Providing required backup of data and configuration information and securely managing backups as applicable, based on the capabilities of the cloud service provider used by the organization, acting as the cloud service customer.

**- [Similar to the section above, the purpose of this section is to ensure that contracts should clearly define the responsibilities of both parties and the specific measures to protect confidentiality, integrity and availability of the organization’s data stored or processed in the cloud]**

[COMPANY NAME], acting as the cloud service customer, will consider whether the agreement should require cloud service providers to provide advance notification prior to any substantive customer impacting changes being made to the way the service is delivered to the organization, including:

- Changes to the technical infrastructure (e.g. relocation, reconfiguration, or changes in hardware or software) that affect or change the cloud service offering;
- Processing or storing information in a new geographical or legal jurisdiction;
- Use of peer cloud service providers or other sub-contractors (including changing existing or using new parties).

**- [This section mentions that your organization wants to ensure that any changes made to the cloud service your vendor provides will not negatively impact your organization’s operations or compromise the confidentiality, integrity, and availability of your data]**

**Vendor Contracts - Telecommunications Services**

Agreements with primary and alternative telecommunications service provider will include:

- Requirement for contingency plans;
- Contingency plan review, to ensure that the plans meet [COMPANY NAME]’s contingency requirements; and,
- Periodic record of the provider conducting contingency testing and training by providers.

**- [This section is only required for NIST SP 800-53 to help meet CP-08-04, which talks about having the need for contingency plans to be included in the agreements with telecommunications service providers, outlining the steps to be taken in an event of a disruption of services. This also mentions the need to review and test the contingency plan to ensure effectiveness]**

**Vendor Services Change Management**

Changes to the provision of services by vendors, including maintaining and improving existing information security policies, procedures and controls, should be managed, taking account of business information criticality, systems and processes involved and re-assessment of risks. The following aspects will be considered:

- Changes to supplier agreements;
- Changes made by the organization to implement:
   - Enhancements to the current services offered;
   - Development of any new applications and systems;
   - Modifications or updates of the organization’s policies and procedures;
   - New/changed controls to resolve security incidents and improve security.
- Changes in supplier services to implement:
   - Changes and enhancement to networks;
   - Use of new technologies;
   - Adoption of new products or newer versions/releases;
   - New development tools and environments;
   - Changes to physical location of service facilities;
   - Change of suppliers;
   - Subcontracting to another supplier.

**- [This whole section about Vendor Services Change Management is optional for SOC 2 and is more applicable for ISO 27001. This section emphasizes that changes to how your vendor provisions their services must align with your organization’s information security policy. Changes may involve or trigger a re-assessment of risks to ensure that any new products or versions of the products are still complying with your organization’s security requirements. Ultimately, this talks about managing and reviewing changes made by vendors to ensure that they do not introduce significant risks to your organization]**

## Related articles

- [Physical Security Policy Guidance](physical-security-policy-guidance.md)
- [Encryption Policy Guidance](encryption-policy-guidance.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [What Is a Subprocessor?](what-is-a-subprocessor.md)
- [Information Governance Policy Guidance](information-governance-policy-guidance.md)

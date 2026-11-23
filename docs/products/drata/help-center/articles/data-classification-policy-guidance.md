# Data Classification Policy Guidance

Source: https://help.drata.com/en/articles/7172842-data-classification-policy-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Data Classification Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

## Data Classification Policy

## [COMPANY NAME]

______________________________________________________________________

## Purpose

This policy will assist employees and other third-parties with understanding [COMPANY NAME]’s information labeling and handling guidelines. It should be noted that the sensitivity level definitions were created as guidelines and to emphasize common sense steps that you can take to protect sensitive or confidential information (e.g., company confidential information should not be left unattended in conference rooms).

## Scope

This policy applies to all information owned, managed, controlled, or maintained by [COMPANY NAME] Information covered in this policy includes, but is not limited to, information that is received, stored, processed, or transmitted via any means. This includes electronic, hardcopy, and any other form of information regardless of the media on which it resides.

## Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES> **

**[Additional guidance on what roles and responsibilities to list in this policy can be found here: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

## Policy

## Definitions

- **Restricted Data.** The highest sensitivity level. Data whose unauthorized disclosure could cause serious damage to your organization, including regulatory violations, identity theft risk, or significant reputational harm. Protection requirements are dictated externally by legal and/or contractual obligations.
- **Confidential Data.** Sensitive data whose protection level is determined internally by your organization. Unauthorized disclosure could cause significant damage, including competitive harm or reputation damage.
- **Internal Use Data.** Non-sensitive information owned by or entrusted to your organization. May be shared internally with those who have a business need but should not be released to the general public.
- **Public Information.** Any information approved for release to the general public. Freely shareable internally and externally with no damage risk.

**[If you adjust the names or number of data classification levels, update these definitions accordingly to match your classification scheme.]**

## Data Classification Scheme

Data classification, in the context of information security, is the classification of data based on its level of sensitivity and the impact to [COMPANY NAME] should that data be disclosed, altered, or destroyed without authorization. The classification of data helps determine what baseline security controls are appropriate for safeguarding that data. All data should be classified into one of the following classifications.

**[The default template can support either three or four classification levels depending on how you structure your policy. If you treat Restricted and Confidential as separate levels, you will have four classifications. If you combine them into a single "Confidential/Restricted" level, you will have three. Update this sentence to reflect the number of levels in your organization's policy.]**

## Confidential/Restricted Data

Data should be classified as Restricted or Confidential when the unauthorized disclosure, alteration, or destruction of that data could cause a serious or significant level of risk to [COMPANY NAME] or its customers. Examples of sensitive data include data protected by state or federal privacy regulations (e.g. PHI & PII) and data protected by confidentiality agreements. The highest level of security controls should be applied to Restricted and Confidential Data:

- Disclosure or access to Restricted and Confidential data is limited to specific use by individuals with a legitimate need-to-know. Explicit authorization by the Security Officer is required for access because of legal, contractual, privacy, or other constraints.

**[You may change who authorized these disclosures to replace the Security Officer, but there should be some level of authorization prior to disclosing your most sensitive classifications of data.]**

- Must be protected to prevent loss, theft, unauthorized access, and/or unauthorized disclosure.
- Must be destroyed when no longer needed. Destruction must be in accordance with Company policies and procedures.
- Will require specific methodologies, procedures, and reporting requirements for the response and handling of incidents.

**[This section can be edited if you choose to add or remove data classification levels. But this section is explaining that the most sensitive data has the most security controls applied to it.]**

## Internal Use Data

Data should be classified as Internal Use when the unauthorized disclosure, alteration, or destruction of that data could result in a moderate level of risk to [COMPANY NAME] or its customers. This includes proprietary, ethical, or privacy considerations. Data must be protected from unauthorized access, modification, transmission, storage or other use. This applies even though there may not be a civil statute requiring this protection. Internal Use Data is restricted to personnel who have a legitimate reason to access it. By default, all data that is not explicitly classified as Restricted/Confidential or Public data should be treated as Internal Use data. A reasonable level of security controls should be applied to Internal Use Data.

**[This section can be edited if you choose to add or remove data classification levels. Internal Use Data is listed as the default sensitivity level all unlabeled data is classified as, if you change data classification levels, you should still maintain a level of sensitivity which all data without an explicit label is classified as.]**

## Public Data

Data should be classified as Public when the unauthorized disclosure, alteration or destruction of that data would result in little or no risk to [COMPANY NAME] and its customers. It is further defined as information with no existing local, national, or international legal restrictions on access or usage. While little or no controls are required to protect the confidentiality of Public data, some level of control is required to prevent unauthorized alteration or destruction of Public Data.

**[This section can be edited if you choose to add or remove data classification levels. You should still have a classification level for data which only requires a small number of controls protecting it.]**

## De-identified Data

[COMPANY NAME] will de-identify data as a tool to remove personal information from data that it collects, uses, archives, and shares with other organizations. The de-identification process will allow the removal of direct identifiers, including all unique identifying numbers, characteristics, or codes. If a data set contains any amount or type of personal information, it will not be considered de-identified.

**[This section is just explaining that when sharing data externally with other organizations, any information which may identify the customer will be removed prior to sharing that data with the external organizations.]**

## Assessing Classification Level and Labeling

The goal of information security, as stated in the Information Security Policy, is to protect the confidentiality, integrity, and availability of Corporate and Customer Data. Data classification reflects the level of impact to [COMPANY NAME] if confidentiality, integrity, or availability is compromised.

If a classification is not inherently obvious, consider each security objective using the following table as a guide. All data will be assigned one of the following four sensitivity levels.

**CLASSIFICATION LEVELS**

| **CLASSIFICATION** | **POTENTIAL IMPACT OF LOSS** |
|---|---|
| **RESTRICTED**<br>- Highly sensitive information<br>- Level of protection is dictated externally by legal and/or contractual requirements<br>- Must be limited to only authorized employees, contractors, and business partners with a specific business need | **SERIOUS DAMAGE** would occur if Restricted information were to become available to unauthorized parties either internal or external to [COMPANY NAME].<br>Impact could include negatively affecting [COMPANY NAME]’s competitive position, violating regulatory requirements, damaging the company’s reputation, violating contractual requirements, and posing an identity theft risk. |
| **CONFIDENTIAL**<br>- Sensitive information<br>- Level of protection is dictated internally by [COMPANY NAME]<br>- Must be limited to only authorized employees, contractors, and business partners with a specific business need | **SIGNIFICANT DAMAGE** would occur if Confidential information were to become available to unauthorized parties either internal or external to [COMPANY NAME].<br>Impact could include negatively affecting [COMPANY NAME]’s competitive position, damaging the company’s reputation, violating contractual requirements, and exposing geographic location of individuals. |
| **INTERNAL USE**<br>- Non-sensitive Information<br>- Originating within or owned by [COMPANY NAME], or entrusted to it by others.<br>- May be shared with authorized employees, contractors, and business partners who have a business need, but may not be released to the general public, due to the negative impact it might have on the company’s business interests | **MODERATE DAMAGE** would occur if Internal Use information were to become available to unauthorized parties either internal or external to [COMPANY NAME].<br>Impact could include damaging the company’s reputation and violating contractual requirements. |
| **PUBLIC**<br>- Information that has been approved for release to the general public<br>- Freely shareable both internally and externally | **NO DAMAGE** would occur if Public information were to become available to parties either internal or external to [COMPANY NAME].<br>Impact would not be damaging or a risk to business operations. |

**[These levels can be adjusted as needed, they should however be based on the impact of their unauthorized disclosure as indicated by the column on the right.]**

**HANDLING CONTROLS PER DATA CLASSIFICATION**

Labeling data is a critical activity within certain frameworks, such as ISO 27001. However, these frameworks usually leave it up to an individual organization on “how” exactly data should be labeled. Within Drata’s Data Classification Policy template, we provide a table to develop your strategy for labeling data. Each type of data is contained in a row of the table in bold text. Each column of that row will be the classification level for each type of data. The first row of a data type lists out what specific controls must be in place for a given data type and data classification level. The next row will be for defining how you intend to apply labels to a given data type at each level of classification.

For example, Email is broken up into four classification levels: Restricted, Confidential, Internal Use, and Public. In the labeling row under Email, you would define the label you want to apply when emails contain specific types of data:

- Emails containing Restricted Data: ““Restricted” must appear in the Subject Line of the email.”
- Emails containing Confidential Data: ““Confidential” must appear in the Subject Line of the email.”
- Emails containing Internal Use Data or Public Information: “No Label Required.”

You are not required to apply a label at every level of data classification or even for every type of data. For example, the first row of the NDA data type explains which classification levels require an NDA and who must sign an NDA. Likely, you only have one relevant non-disclosure agreement. Because of this, labeling is not required for the NDA data type. To illustrate this in the table below, the labeling row has been changed to “No Label Required” for the NDA data type.

While you may choose to not label specific data types, you do have to define your approach to labeling and define the types/classifications of data you want to apply data labels to. To assist with this, we have provided an example of how to complete this table below. This is an example for illustrative purposes only, you may elect to apply labels in a different way or apply labels to more or less of the types and classifications of data than we have in this example.

**Note: **Additionally, labeling is not required for SOC 2. If you are only working towards SOC 2, you may choose to delete the labeling rows entirely.

| **Handling Controls** | **Restricted** | **Confidential** | **Internal Use** | **Public** |
|---|---|---|---|---|
| **Non-Disclosure Agreement (NDA)** | Required prior to access by non-[COMPANY NAME] employees | Recommended prior to access by non-[COMPANY NAME] employees | Not Required | Not Required |
| *Labeling* |  |  |  |  |
| **Internal Network Transmission (wired & wireless)** | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - Encryption Recommended<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - No Requirements | - No Requirements |
| *Labeling* |  |  |  |  |
| **External Network Transmission (wired & wireless)** | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited<br>- Remote Access if Necessary (only with VPN and two-factor authorization when possible) | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - Encryption Recommended<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - No special requirements |
| *Labeling* |  |  |  |  |
| **Data at Rest (file servers, databases, archives, etc.)** | - Encryption Required<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific Individuals | - Encryption Recommended<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups | - Encryption Recommended<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups | - Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups |
| *Labeling* |  |  |  |  |
| **Mobile Devices (iPhone, iPad, USB Drive, etc.)** | - Encryption Required<br>- Remote Wipe Enablement Required, if possible | - Encryption Required<br>- Remote Wipe Enablement Required, if possible | - Encryption Recommended<br>- Remote Wipe Enablement Recommended, if possible | - No Requirements |
| *Labeling* |  |  |  |  |
| **Email (with and without attachments)** | - Encryption Required<br>- Do Not Forward | - Encryption Recommended<br>- Do not Forward | - Encryption Recommended<br>- Do Not Forward | - No Requirements |
| *Labeling* |  |  |  |  |
| **Physical Mail** | - Mark "Open by Addressee Only"<br>- Use Courier or "Certified Mail" and Sealed, Tamper- Resistant Envelopes for External Mailings | - Mark "Open by Addressee Only"<br>- Use "Certified Mail" and Sealed, Tamper- Resistant Envelopes for External Mailings | - Mail with Company Interoffice Mail<br>- US Mail or Other Public Delivery Systems | - No Requirements |
| *Labeling* |  |  |  |  |

For the labeling rows, those are the labels you want to apply to different types of data at different sensitivity/classification levels. Each labeling row will apply to each data type and classification level. And in those rows, you write how you want to label each particular type/classification of data.

For example, Email would have 4 cells/values for Restricted, Confidential, Internal Use, and Public.

- For Restricted Email you may write: "Restricted must appear in the Subject Line of the email"
- Confidential Email may have: "Confidential must appear in the Subject Line of the email"
- Internal Use and Public may be listed as "No label applied"

You don't have to apply labels to every type of data and classification level, so you may not apply labels to Network Transmissions for example.

For the NDAs, the handling controls are more towards when an NDA is required (prior to handling confidential or restricted data) but you may want to apply a separate label to different types of NDAs. If you only have a single NDA though, it may be irrelevant.

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Physical Security Policy Guidance](physical-security-policy-guidance.md)
- [Example Completed Data Classification Table](example-completed-data-classification-table.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)

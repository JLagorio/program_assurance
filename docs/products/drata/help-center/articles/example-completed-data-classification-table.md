# Example Completed Data Classification Table

Source: https://help.drata.com/en/articles/7860581-example-completed-data-classification-table
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

Labeling data is a critical activity within certain frameworks, such as ISO 27001. However, these frameworks usually leave it up to each organization to determine how data should be labeled. Within Drata’s Data Classification Policy template, we provide a table to help you develop your strategy for labeling data. Each type of data is in a bolded row. Each column of that row represents the classification level for that type of data. The first row for a data type lists the specific controls that must be in place for a given data type and classification level. The next row defines how you intend to apply labels to that data type at each classification level.

For example, Email is broken into four classification levels: Restricted, Confidential, Internal Use, and Public. In the labeling row for Email, you would define the label you want to apply when emails contain specific types of data:

- Emails containing Restricted Data: “Restricted” must appear in the Subject line of the email.
- Emails containing Confidential Data: “Confidential” must appear in the Subject line of the email.
- Emails containing Internal Use Data or Public Information: No label required.

You are not required to apply a label at every data classification level or for every data type. For example, the first row for the NDA data type explains which classification levels require an NDA and who must sign it. You likely only have one relevant non-disclosure agreement. Because of this, labeling is not required for the NDA data type. In the table, the labeling row for NDA is set to “No Label Required.”

While you may choose not to label certain data types, you must define your labeling approach and identify the types and classifications of data to which you will apply labels. To assist with this, we have provided an example of a completed table below. This example is for illustrative purposes only. You may choose to apply labels differently or to more or fewer types and classifications of data.

**Note:** Labeling is not required for SOC 2. If you are only working toward SOC 2, you may delete the labeling rows entirely.

**HANDLING CONTROLS PER DATA CLASSIFICATION**

| **Handling Controls** | **Restricted** | **Confidential** | **Internal Use** | **Public** |
|---|---|---|---|---|
| **Non-Disclosure Agreement (NDA)** | Required prior to access by non-[COMPANY NAME] employees | Recommended prior to access by non-[COMPANY NAME] employees | Not Required | Not Required |
| *Labeling* | No Label Required | No Label Required | No Label Required | No Label Required |
| **Internal Network Transmission (wired & wireless)** | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - Encryption Recommended<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - No Requirements | - No Requirements |
| *Labeling* | No Label Required | No Label Required | No Label Required | No Label Required |
| **External Network Transmission (wired & wireless)** | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited<br>- Remote Access if Necessary (only with VPN and two-factor authorization when possible) | - Encryption Required<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - Encryption Recommended<br>- Instant Messaging Prohibited<br>- FTP Prohibited | - No special requirements |
| *Labeling* | Content of the message must indicate that it contains Restricted information and is not to be shared. | Content of the message must indicate that it contains Confidential information and may only be shared with authorized recipients. | Content of the message must indicate that it contains Internal Use information and may only be shared with personnel of <Company Name> or authorized recipients. | No Label Required |
| **Data at Rest (file servers, databases, archives, etc.)** | - Encryption Required<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific Individuals | - Encryption Recommended<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups | - Encryption Recommended<br>- Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups | - Logical Access Controls Required (Limit Unauthorized Use)<br>- Physical Access Restricted to Specific groups |
| *Labeling* | Asset Inventory must label the resource as “Restricted”. | Asset Inventory must label the resource as “Confidential”. | Asset Inventory must label the resource as “Internal Use”. | Asset Inventory must label the resource as “Public”. |
| **Mobile Devices (iPhone, iPad, USB Drive, etc.)** | - Encryption Required<br>- Remote Wipe Enablement Required, if possible | - Encryption Required<br>- Remote Wipe Enablement Required, if possible | - Encryption Recommended<br>- Remote Wipe Enablement Recommended, if possible | - No Requirements |
| *Labeling* | Must have a physical asset tag indicating the asset ID and the statement “Property of <Company Name>.”<br>Asset Inventory must label the resource as “Restricted”. | Asset Inventory must label the resource as “Confidential”. | Asset Inventory must label the resource as “Internal Use”. | No Label Required |
| **Email (with and without attachments)** | - Encryption Required<br>- Do Not Forward | - Encryption Recommended<br>- Do not Forward | - Encryption Recommended<br>- Do Not Forward | - No Requirements |
| *Labeling* | “Restricted” must appear in the Subject Line of the email. | “Confidential” must appear in the Subject Line of the email. | No Label Required | No Label Required |
| **Physical Mail** | - Mark "Open by Addressee Only"<br>- Use Courier or "Certified Mail" and Sealed, Tamper- Resistant Envelopes for External Mailings | - Mark "Open by Addressee Only"<br>- Use "Certified Mail" and Sealed, Tamper- Resistant Envelopes for External Mailings | - Mail with Company Interoffice Mail<br>- US Mail or Other Public Delivery Systems | - No Requirements |
| *Labeling* | Mark “Open by Addressee Only”. | Mark “Open by Addressee Only”. | No Label Required | No Label Required |

## Related articles

- [Test 137: Data Classification Policy](test-137-data-classification-policy.md)
- [Acceptable Use Policy Guidance](acceptable-use-policy-guidance.md)
- [Data Classification Policy Guidance](data-classification-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)

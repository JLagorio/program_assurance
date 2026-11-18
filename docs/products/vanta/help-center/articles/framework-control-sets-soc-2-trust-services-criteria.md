# Framework Control Sets (SOC 2 Trust Services Criteria)

Source: https://help.vanta.com/en/articles/11794756-framework-control-sets-soc-2-trust-services-criteria
Collection: Audit Readiness ; Audit Readiness › Compliance Standards Library
Fetched: 2026-11-17

## Article text

## Frameworks Control Sets
A control set is a collection of security controls designed to help organizations meet specific cybersecurity frameworks or compliance requirements. These sets are organized by level or tailored to specific requirements, providing a structured approach to managing your security program.
 
In the context of SOC 2, organizations can select up to five categories of Trust Services Criteria that align with their system’s service commitments and requirements, as well as the related control activities they perform to meet their objectives. 
 
 

## What Are the SOC 2 TSCs?
The TSC a five-category categories that organizes the SOC 2 controls:
- 
(CC) ‍Security, also known as common criteria: Controls that protect against unauthorized access, unauthorized disclosure of information, and damage to systems that could compromise the availability, integrity, confidentiality, and privacy of information or systems and affect the entity’s ability to achieve its objectives.
- 
(A) Availability: Controls that ensure data and systems are available for operation and use to meet business objectives.
- 
(C) Confidentiality: Controls that protect confidential information to meet the entity’s objectives.
- 
(PI) Processing integrity: Controls that ensure the organizational systems' processing of data is complete, accurate, and timely and authorized to meet the entity’s objectives. 
- 
(P) Privacy: Controls that ensure personal information is collected, used, retained, disclosed, and disposed of to meet the entity’s objectives. 
The Security TSC is mandatory for anyone receiving a SOC 2 report; however, the other four categories, availability, confidentiality, processing integrity, and privacy, are optional for inclusion and may be included if deemed applicable to your business and service commitments (i.e., objectives).
 
 

## Changing the SOC 2 TSCs in Vanta
Before changing the control set, it's essential to assess which TSCs align best with your organization’s service commitments and requirements related to the in-scope system(s) and data handling practices. 
 
Keep in mind that adding TSCs can introduce additional controls that may require significant investment in IT resources and staff training. 
 
Similarly, only having Security in scope may reduce the control burden, but it could expose your organization to increased risk if not carefully considered.
Please note: Only Vanta Admins have the privilege to make changes to the control set. Changing your control set during an active audit can delay or compromise your audit. Modifying the control set during an audit could alter the audit scope, potentially impacting the accuracy of the audit results and increasing audit costs.
 

### 1. Locate the Control Set Filter 
- 
From the Frameworks page, select SOC 2
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1625948744/f2a77cd5ee5686f9d9a4e4d6aaad/Screenshot+2025-07-17+at+2_25_39%E2%80%AFPM.png?expires=1794967200&signature=c9819ba2fa59123ac98c0705798ae89e6f4399a529e37817966fdaaa977b1111&req=dSYlE8B6lYZbXfMW1HO4zfHwPnfDRpS5bWPBSRvxd%2FAubobN7EfmpLaag7Gn%0A%2B06IaJ05ulETu5AXnsU%3D%0A>
- 
You will see a filter icon located below the framework name (“Control Set:”). Select the pen icon to edit.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1625945459/442c67ad3853254724d3c040d90a/Screenshot+2025-07-17+at+2_24_13%E2%80%AFPM.png?expires=1794967200&signature=88cf4358db10957cae198ddd5c1587e40f1d8ebd6b089100ca0609ea44cf0743&req=dSYlE8B6mIVaUPMW1HO4zRAKSBN2%2F8Gu1pBw2vz%2BGssCkYwJF85JkXKvBP98%0ARYF7i7DgS0%2FmwgfGiqw%3D%0A>
- 
Click the filter to view a list of available control sets (Security, Availability, Confidentiality, Processing Integrity, Privacy). This list will show the current set your organization is using and the available sets you can add.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1625885395/6cf1b88e575a4ee8595bcd1bec71/AD_4nXcUK5nKOfCyh_BX8xRhKIKCZDRdUW89hosp7wPeRMuPMDyIYBsyvOv38z52os_-re_3FqMjvHZuv-co8XU51gjCb9560fVLFACvOX6rO9SV1NVyMmReYRhwQBzrSFjBnhr5KiFyCg?expires=1794967200&signature=ac775bd5fd1ea12a8d2bfe70cb5754535ee105493334c339ae8a987291589f65&req=dSYlE8F2mIJWXPMW1HO4zWms05iKfu%2F0vakQcX4PZQVqlcfh96ns2hk4fra3%0Aq1LDJIA4LpNGJlzG2g8%3D%0A>
- 
Once you select a different control set, a modal will appear. This modal will display the following:
- 
The current control set your organization is using.
- 
The control set you are about to update to.
- 
An important note stating changes to a framework control set are not allowed during an active audit.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1625885396/869b578bd0bfce8486a50a058323/AD_4nXeoHg8g25XhEMmjBPcXKtCIllKN4oHugnFhl6H9_wKiCcq5rxIKkHkTsKjYqX5Xr4X74ADkeuvsvo3qjSQUzBOkjpgPO7NWEMQH9CFwFjVtsDp2lTd9k38cTBju653a3zkJyYqLsQ?expires=1794967200&signature=5b186c97e13f1df97f6ebb569ea4f1f2c82fba354a475cd015f1f581c47a69e4&req=dSYlE8F2mIJWX%2FMW1HO4zWHZv%2BX0%2B7DX5UubSE8obDNTGB1uULdguhZIDSRX%0AvXhgC2vwgSUXmasO%2Fl0%3D%0A>
 

### 2. Review the Impact
Carefully review the differences between your current control set and the one you plan to implement. 
- 
After reviewing, confirm the change. Be aware that updating the control set can have a significant impact on your compliance environment, including:
- 
New controls may require additional resources to implement and maintain.
- 
Removing controls could reduce your organization’s overall security posture, potentially leaving it more vulnerable to cyber threats.
- 
Custom changes to your control set will not automatically deactivate or add controls to the SOC 2 baseline. If you deactivate a control manually or introduce a new one, these actions will be lost in the TSC control set if the criteria is deactivated.

### 3. Impact on Your SOC 2 Control Environment:
Modifying your SOC 2 control set by adding or removing TSC, especially during an active audit, can disrupt the audit process. Changes in the control set will alter the scope of the audit, affecting its accuracy and potentially leading to additional audit fees. Ensure you align with your auditor on which TSC your SOC 2 audit will include before commencing the audit. 
 
Adding TSC to your SOC 2 scope may introduce controls that require: 
- 
Increased operational capacity: Implementing new controls may require additional staff, training, or IT infrastructure.
- 
Ongoing monitoring and maintenance: As your control scope becomes more robust, your organization will need to monitor these controls to ensure continuous compliance and security.
 
 

## Adding and removing TSCs
When creating a SOC 2 audit in Vanta, you'll need to select your report type and TSCs as part of the setup. You can add or remove TSCs after the audit is created, but not once the audit begins.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2284590709/27fe6341c0a71a5fc59738ee4980/32895051373460?expires=1794967200&signature=9c593dfbe9ae3a29a23ad5c0956ec6c018a9b6963a82014cd66f59c136089ef1&req=diIvEsx3nYZfUPMW1HO4zYMg0hIjCHqvieee0ktYjAa5pMJtxq0cpcua4igb%0A22l2XmXw9M1cf%2BpeunQ%3D%0A>

## Images

- [image 01] ../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--01.png
- [image 02] ../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--02.png
- [image 03] ../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--03.png
- [image 04] ../../images/ux/frameworks/framework-control-sets-soc-2-trust-services-criteria--04.png
- [image 05] ../../images/ux/audits/framework-control-sets-soc-2-trust-services-criteria--05.png

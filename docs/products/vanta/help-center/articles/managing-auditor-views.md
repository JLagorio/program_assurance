# Managing Auditor Views

Source: https://help.vanta.com/en/articles/11565398-managing-auditor-views
Collection: Audit Readiness ; Audit Readiness › Audits
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Compliance features, including Information Request Lists (IRLs) and Controlled Auditor Views, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
What an auditor can access in Vanta depends on a few things: the scope of your audit, the request list being used, and the auditor view you selected when creating the audit. 
 
The scope of your audit determines what evidence and test data exist in the audit based on your selected frameworks. The request list and auditor view then determine the population data your auditor can see and how they can interact with it. 
 
At any time, you can preview an audit <https://help.vanta.com/en/articles/11345983-how-to-view-vanta-as-an-auditor> in Vanta to see what your auditor will have access to during the observation window.
 
 

## Understanding auditor views
In addition to your framework scoping <https://help.vanta.com/en/articles/11345359-adaptive-framework-scoping>, the data an auditor can access is determined by the type of request list used for the audit and the auditor view applied to it. 
 
The request list defines which auditor views are available, while the auditor view determines the population data your auditor can see and interact with.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205815947/70dc360ef24ac2eb8ca8378d2cf9/image.png?expires=1794967200&signature=e2793c034312d161ef7696149ff33834218b00a085575a491ccc4f0fd042f378&req=diInE8F%2FmIhbXvMW1HO4zfwncTyDpUSmYQ26WVqyEqJF4zT7v%2BE7WyGfFJo6%0AA9HbEMQavfEGT9GJVlM%3D%0A>
 
 | 
Request list type | 
Auditor view | 
Description
 | 
Default request list | 
Full auditor view | 
Standard Vanta request list used for most audits. Provides full visibility into population data. All population data pages are visible and fully explorable.
 | 
Default request list | 
Controlled auditor view | 
Standard Vanta request list used for most audits. Provides limited visibility into population data. All population data pages are visible by default but cannot be turned on or off.
 | 
Information request list (IRL) <https://help.vanta.com/en/articles/12293647-information-request-list-irl-in-vanta-public-preview> | 
Controlled auditor view | 
Custom request list used to manually manage and fulfill audit requests. Provides limited visibility into population data. All population data pages are turned off by default and must be enabled to share with your auditor.
 
 

## Auditor view comparison
The auditor view determines how much population data your auditor can access:
- 
Full auditor view: Auditors have full visibility into population data and can explore records and attributes across your environment. 
- 
Controlled auditor view: Auditor access to population data is limited to a subset of attributes rather than the full dataset. This allows you to restrict sensitive information while still enabling auditors to review and select samples. Because auditors do not have access to all attributes, you may need to fulfill some requests manually.
Review each section to understand the population data included in each view:
 

### Risk
 
Risk data helps auditors understand how your company identifies and manages security or operational threats. This information comes from your risk register and includes detailed scenarios and statuses.
 
If you're using the Controlled view, auditors only see the fields that you've explicitly marked as visible. In the Full view, they see everything, including custom and extended risk data.
 | 
Controlled view | 
Full view
 | 
Risk snapshot fields: 
- 
Risk ID 
- 
Risk scenario 
- 
Inherent risk
- 
Treatment 
- 
Residual risk 
- 
Approval status 
- 
Owner 
- 
Categories 
- 
CIA categories 
- 
Identified 
- 
Custom fields marked as visible 
​
​Information is not clickable | 
All fields, including: 
- 
Financial impact 
- 
Business function 
​
​Information is fully accessible
 

### Vendors
 
Vendor data allows auditors to assess the third parties your organization works with, including review schedules and security posture.
 
The Controlled view limits visibility to standard fields. In the Full view, auditors can view a comprehensive history and explore more detailed information.
 | 
Controlled view | 
Full view
 | 
Vendor fields (both active and archived vendors): 
- 
Vendor name 
- 
Vendor category 
- 
Inherent risk 
- 
Findings 
- 
Last review completed 
- 
Next review scheduled 
- 
Custom fields marked as visible 
​
​Information is not clickable | 
Vendors (both active and archived vendors) and security reviews are shown on separate pages. 
​
​Information is clickable, including: 
- 
Security review findings
 

### Assets
 
Asset data encompasses a wide range of items, including computers, databases, alarms, vulnerabilities, and more. It helps auditors verify how you monitor and protect your technical infrastructure.
 
The Controlled view shows only selected inventory and code change attributes. The Full view displays all asset types and fields.
 | 
Controlled view | 
Full view
 | 
Inventory fields: 
- 
Vendor name
- 
Vendor category
- 
Inherent risk
- 
Findings 
Code changes fields: 
- 
Vendor name
- 
Vendor category
- 
Inherent risk
- 
Findings 
- 
Last review completed
- 
Next review scheduled
- 
Custom fields marked as visible 
​
​Information is not clickable | 
Full visibility into:
- 
Inventory
- 
Vulnerabilities
- 
Alarms
- 
Code changes
- 
Databases
- 
Network configurations
- 
Subnets
- 
Related settings
- 
Examples like: Vulnerability remediation SLAs
 

### Personnel
 
Auditor access to personnel data lets them verify onboarding, offboarding, group membership, and system access for employees and contractors.
 
The Controlled view offers a summarized version with static tables. In the Full view, auditors can drill down into tasks, group membership, and access accounts.
 | 
Controlled view | 
Full view
 | 
People:
- 
Name
- 
Employment status
- 
Start date
- 
End date
- 
Groups 
Groups:
- 
Name
- 
Members (#)
- 
Source
- 
Tasks
- 
Last updated 
- 
Point of contact
- 
Drawer opens task data:
- 
Policies
- 
Trainings
- 
Background checks
- 
Onboarding
- 
Offboarding 
Account access: 
- 
Account name
- 
Owner
- 
Role
- 
Status
- 
MFA
- 
Date created
- 
Date deactivated
- 
Custom fields 
Tables are not clickable | 
Full access, including clickable rows in People and Groups tables that reveal: 
- 
People task status
- 
Detailed access settings
 

### Integrations
 
Integrations demonstrate how you collect evidence and monitor infrastructure using automated tools.
 
The Controlled view offers basic metadata. The Full view provides complete insight into integration configuration and status.
 | 
Controlled view | 
Full view
 | 
Connective integration fields: 
- 
Name
- 
Tags
- 
Categories
- 
Drawer opens:
- 
Overview
- 
Categories
- 
Permissions | 
Full access to:
- 
All integrations
- 
Scope configuration
- 
Permissions
- 
Errors
- 
Connected integrations
- 
Shown on separate pages
 

### Organizations
 
This section shows your company’s general information and audit notification preferences.
 
This is the only section that is identical in both the Controlled view and Full view.
 | 
Controlled view | 
Full view
 | 
Company info fields:
- 
Display name
- 
Legal name
- 
Incorporation
- 
URL 
- 
Mailing address
- 
Telephone
- 
Logo 
Notifications: 
- 
Notification schedule
- 
Personnel reminders
- 
External notifications | 
Same as Controlled View
 
 

## Setting a default auditor view
When using Vanta’s default request list, you can set a default auditor view for future audits. Users with permission to create audits can override this setting during audit setup. Auditors cannot change the auditor view being used for an audit.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205809204/8e88c920c39f379d853ba030ea0f/image.png?expires=1794967200&signature=3444014a5093a90f2017efd1dc4fecf99d0c56a9380acf02eee5bcccfe0c5c8e&req=diInE8F%2BlINfXfMW1HO4zZiBlVkgbMGkYDpC9xu%2FNzjazxVLNaX4kxb9mBs6%0Afrh4qsWll09YIYnHmE8%3D%0A>
 
To set a default auditor view:
- 
In your account header, click the Settings icon.
- 
In the page menu, scroll to the Features section and select Compliance.
- 
Scroll to the Audit visibility section.
- 
Select a Default audit view. Changes are saved automatically.
​
 

## IRLs and controlled auditor views
When using an information request list (IRL) <https://help.vanta.com/en/articles/12293647-information-request-list-irl-in-vanta-public-preview>, audits use a Controlled auditor view with all population data pages hidden by default. To share population data with your auditor, you must enable the pages you want them to access.
 
When a page is enabled, it becomes visible to the auditor with limited access to population data. When a page is disabled, it's not visible to the auditor. You can see the exact information the auditor can see by clicking the View button next to the population.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205800042/bfcf7fe0f9738757247e201e83ee/image.png?expires=1794967200&signature=1c4b9f3040c35d97b245c275a11542e5f910fedcde3ada46e46647910f485486&req=diInE8F%2BnYFbW%2FMW1HO4zfqS2JV%2FaUIQOaextzFB5jpcno4wAUiuQx3YXXFB%0ASJfhH1W9rFYCgIg1VS8%3D%0A>
 
To manage page visibility:
- 
From the Audits page, click Open audit.
- 
Go to the Data & populations tab. From here you can:
- 
Enable all sections 
- 
Disable all sections
- 
Expand each section to manage visibility at the page level
- 
View what the auditor will have access to once the audit period starts

## Images

- [image 01] ../../images/ux/audits/managing-auditor-views--01.png
- [image 02] ../../images/ux/settings/managing-auditor-views--02.png
- [image 03] ../../images/ux/audits/managing-auditor-views--03.png

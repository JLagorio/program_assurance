# Custom User Roles

Source: https://help.vanta.com/en/articles/11345585-custom-user-roles
Collection: Team Compliance ; Team Compliance › Managing Users
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Custom Role-Based Access Controls (RBAC), which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Custom roles let you bundle permissions for users who need access to specific parts of Vanta. They're organized by product area—each product area contains one or more permission sets, and you set the access level for each permission set independently. Custom roles are built on the Collaborator role as a baseline, so users can still be assigned objects across the product.
 
⚙️ User permissions: Only Admins can create and manage custom roles. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta> 
 
 

## Creating custom roles
Depending on your plan, you can create custom roles from your settings.
 
To create a custom role:
- 
In your account header, click the Settings icon.
- 
Under Access, open the Roles page.
- 
Click Add role and give the role a name and description.
- 
Choose the permission sets to enable for the role.
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2451642453/2f892e256e869b0bbe4477e49910/image.png?expires=1794967200&signature=c596426317ebd8d181457ad08f2368fd80fd0ab5d784f1cdd571efdc5ec7b877&req=diQiF896n4VaWvMW1HO4zR7h7NWU1yMgu2tjxNzNt2AT79qRLcS0pGpQ1dna%0AL%2FlHONBt2aCNckQ84fQ%3D%0A>
 
Most permission sets allow the following access levels:
 | 
Access level | 
What it grants
 | 
View and edit | 
Typically matches what an Editor can do in that permission set, unless noted in the permission set details below.
 | 
View only | 
The same access as granting view and edit, but read-only. Users can still be assigned objects as needed.
 | 
No access | 
Works like the Collaborator role. No default access, but users can still be assigned objects as needed.
 
 

## Product areas
Available product areas and permission sets depend on your plan and enabled features:
 | 
Product area | 
Permission sets
 | 
Assets | 
- 
Inventory
- 
Code Changes
- 
Vulnerabilities
- 
Security Alerts
 | 
Compliance | 
- 
Frameworks & Controls
- 
Policies
- 
Tests & Documents
 | 
Customer Trust | 
- 
Trust Centers
- 
Questionnaires
- 
Knowledge Base
- 
Customer Commitments
- 
Customer Contracts
 | 
Personnel | 
- 
People Management
- 
Access Accounts
- 
Access Reviews and Access Requests
- 
Deprovision Accounts
 | 
Platform | 
- 
Reports
- 
Integrations
 | 
Privacy | 
- 
Data Inventory
- 
Privacy Settings
 | 
Risk | 
- 
Risk Management
 | 
Settings | 
- 
Billing
 | 
Vendors (TPRM) | 
- 
Vendors
 
 

## Permission sets
The tables below list the permission sets available for each product area. Enabling editing permissions typically matches what an Editor can do within that particular part of the product—any exceptions are noted in the permission set details below.
 

### Assets
 | 
Permission set | 
View and edit access level
 | 
Code Changes | 
Same as Editors within the Code Changes page.
 | 
Inventory | 
Same as Editors within the Inventory page.
 | 
Security Alerts | 
Same as Editors within the Security Alerts page.
 | 
Vulnerabilities | 
Same as Editors within the Vulnerabilities page and Assets settings (Vulnerability Scanners tab only). However, users may also need at least view access to Integrations for all vulnerability scanner data and related settings surfaces to load correctly.
 

### Compliance
 | 
Permission set | 
View and edit access level
 | 
Frameworks & Controls | 
Same as Editors within the Frameworks page, Controls page, Frameworks settings, and Compliance settings related to frameworks and controls.
 | 
Policies | 
Same as Editors within the Policies page.
 | 
Tests & Documents | 
Same as Editors within the Tests page, Documents page, and Compliance settings related to tests and documents.
 

### Customer Trust
 | 
Permission set | 
View and edit access level
 | 
Knowledge Base | 
Same as Trust Admins and Editors within the Knowledge Base page and Customer Trust settings  (Knowledge Base tab only).
 | 
Questionnaires | 
Use the View, edit, and approve access level to match Trust Admin or Editor access, as well as grant access to Customer Trust settings (Question Answering and Tags tabs only). The View and edit access level is similar to the Trust Collaborator role—users can work on questionnaires but cannot approve answers, edit approved answers, approve questionnaires, or mark them complete. 
 | 
Trust Centers | 
Same as Trust Admins and Editors within the Trust Center page and Customer Trust settings (Trust Center and Tags tabs only).
 | 
Customer Commitments | 
Same as Trust Admins and Editors within the Commitments page.
 | 
Customer Contracts | 
Same as Admins within the Commitments page and Customer Trust settings (Commitments tab only). 
ℹ️ Note: Customer Contracts access requires Customer Commitments access. When you enable Customer Contracts, Customer Commitments is automatically set to at least View only. You can raise it to View and edit, but you can’t set it to No access while Customer Contracts is enabled.
 
 

### Personnel
 | 
Permission set | 
View and edit access level
 | 
Access Accounts | 
Same as Editors within the Accounts tab of the Access page.
 | 
Access Reviews and Access Requests | 
Same as Editors within the Reviews tab and Access Requests tab of the Access page and Personnel settings (Access Reviews tab only).
 | 
Deprovision Accounts | 
Same as Editors within the Deprovisioning Tasks tab of the Access page.
 | 
People Management | 
Same as Editors within the People page and Computers page, and Personnel settings (SLAs, Security Tasks, Setup tabs only), plus grants view-only access to Policies.
 

### Platform
 | 
Permission set | 
View and edit access level
 | 
Integrations | 
Same permissions as Editors within the Integrations section (all integrations except identity provider (IdP) integrations). Does not include access to Developer Console or Webhooks settings.
 | 
Reports | 
Same report-level permissions as Editors within the Reports section. However, reports and data can still depend on permissions in other product areas.
 

### Privacy
 | 
Permission set | 
View and edit access level
 | 
Data Inventory | 
Same permissions as Editors within the Privacy section.
 | 
Privacy Settings | 
Same permissions as Editors within the Privacy settings.
 

### Risk
 | 
Permission set | 
View and edit access level
 | 
Risk Management | 
Same permissions as Editors within the Risk section and Risk settings.
 

### Settings
 | 
Permission set | 
View and edit access level
 | 
Billing | 
Same permissions as Admins within Billing settings.
 

### Vendors (TPRM)
 | 
Permission set | 
View and edit access level
 | 
Vendors | 
Same permissions as Editors within the Vendors section and Vendors settings.
 
📖 Learn more: For a breakdown of what Collaborators, Editors, and Admins can access per product area, see: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Common scenarios
- 
Scope someone to one area of Vanta: Create a custom role with only the relevant permission sets enabled. Users with a custom role can still be assigned objects across the product, and those assignments add access on top of the custom role.
- 
Give someone different access levels across areas: Use a custom role to mix and match—for example, edit access in Risk and view-only access in Compliance.
- 
Give someone no default product access: Use the Employee or Collaborator role instead—no custom role needed. Employees can only access the employee portal. Collaborators have no default product access but can be assigned objects across Vanta.

## Images

- [image 01] ../../images/ux/settings/custom-user-roles--01.png

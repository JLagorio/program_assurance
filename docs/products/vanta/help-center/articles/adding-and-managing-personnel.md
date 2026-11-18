# Adding and Managing Personnel

Source: https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel
Collection: Team Compliance ; Team Compliance › Employee Onboarding & Offboarding
Fetched: 2026-11-17

## Article text

The People page is where you add and manage the personnel your organization tracks for compliance. Connect your identity provider (IdP) to keep your roster in sync automatically as your team changes, and connect your human resources information system (HRIS) to enrich personnel records with employment data like job title, department, and leave status. Use the user provisioning setting to manage which personnel have user accounts and can log into Vanta.
 
⚙️ User permissions: Admins and Editors can add and manage personnel. Only Admins can change the user provisioning setting. Refer to Understanding User Roles and Permissions <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta> for more details.
 
 

## Getting started
If you're setting up your People page for the first time, a setup wizard will guide you through importing your personnel, adding employment data, and managing how personnel access Vanta.
- 
Import personnel: Select your personnel source—connect your IdP to sync personnel automatically, or skip this step if you plan to add personnel manually.
- 
Add employment data: Connect your HRIS to sync employment details to your personnel records. You can skip this step if you plan to add employment data manually.
- 
Manage personnel access to Vanta: Configure how personnel can get user accounts to access Vanta. This step is required before you can access the People page.
Each section below includes a table describing how your setup affects what you can edit and where—your setup determines where personnel data lives, what you can edit in Vanta vs. your source systems, and whether personnel can log in to complete tasks.
 
 

## Importing personnel
Personnel records are created when you connect an IdP or add someone manually. Once imported, personnel records populate on the People page. 
 | 
Situation | 
What it means | 
Editing personnel
 | 
Personnel added via IdP | 
Personnel records are created and kept in sync automatically | 
Edit names and email addresses in your IdP
 | 
Personnel added via multiple IdPs | 
Personnel records are created and kept in sync automatically in order of IdP precedence | 
Edit names and email addresses in the IdP with the highest precedence
 
 | 
Personnel added manually | 
Personnel records are created manually in Vanta and not synced with any integration | 
Edit names and email addresses directly in Vanta

### Connecting an IdP
 
Connecting an IdP imports your personnel into Vanta and keeps the People page in sync.
- 
After connecting, configure the scope of the integration to control which personnel are imported.
- 
To manage the IdP integration after initial setup of the People page, go to Settings, select Personnel from the page menu, and go to the Setup tab.
- 
For integration-specific setup instructions, see Identity Providers (IdP) <https://help.vanta.com/en/collections/18953664-identity-providers>.
 

### Connecting multiple IdPs
 
You can connect more than one IdP—for example, if your employees are in one and your contractors are in another. When you connect multiple IdPs, personnel records come from your IdPs in order of precedence.
 
To set or update precedence:
- 
Go to Settings and select Personnel from the page menu.
- 
Go to the Setup tab. 
- 
Click the ••• menu next to the integration and select IdP precedence.
​
⚠️  Note: If the same personnel appears in both IdPs with the same email, only one record is imported and the other is flagged with a fetch error <https://help.vanta.com/en/articles/11346057-error-unable-to-load-user-from-identity-provider>. If they appear with different emails, both are imported and you'll end up with duplicate records <https://help.vanta.com/en/articles/11345591-having-multiple-users-in-vanta-for-the-same-person>.
 

### Adding personnel manually
 
If someone isn't in your IdP, you can add them directly from the People page. You might do this if you're skipping the IdP step during initial setup, or if you have personnel who aren't in your IdP or who only have an HRIS record, like a contractor or freelancer.
 
To add a personnel record manually:
- 
From Personnel, go to the People page.
- 
Select the ••• menu above the table and select Add a personnel record.
- 
Enter their name and email address and select Add.
​
💡 Tip: Manually-added personnel records can still be linked to employment data being pulled in via an HRIS integration. Learn more
 
 

## Adding employment data
Connect your HRIS to add employment data to personnel records in Vanta. Your IdP can create and sync personnel, while your HRIS adds richer employee details like job title, department, employment status, and key dates such as start and end dates. When both are connected, Vanta prioritizes HRIS data for employee information.
 | 
Situation | 
What it means | 
Editing employment data
 | 
Employee data added via HRIS | 
Employment details like job title, leave status, and dates are synced from your HRIS | 
Edit employment data in your HRIS
 
 | 
Employment data added manually | 
Employment details are managed manually in Vanta | 
Edit employment data directly in Vanta
 

### Connecting an HRIS
 
Connecting an HRIS links your personnel records with employment details by matching email addresses.
- 
For setup instructions, see HR Systems (HRIS) <https://help.vanta.com/en/collections/18953568-hr-systems-hris>.
- 
After connecting, configure scope to control which records are imported.
- 
Once configured, Vanta automatically links HR data to matching personnel records.
- 
If any records can't be matched automatically, you can manually link to available HR data or add HR data manually.
 

### Linking and unlinking data 
 
Vanta links employment data from your HRIS to personnel records automatically by matching email addresses. If a record can't be matched, you can link or unlink it manually. This might happen when the email in your HRIS differs from the one in Vanta.
 
To link or unlink HR data:
- 
From Personnel, go to the People page.
- 
Select the ••• menu above the table and select Manage HR data.
- 
On the Unlinked tab, find the record and select the personnel record in Vanta to link it to.
- 
On the Linked tab, find the record and select Clear to unlink it.
- 
Click Save.
 

### Manually managing data
 
If you don't have an HRIS connected, employment details aren't synced automatically—you manage them directly on each personnel record in Vanta. 
 
When you open a personnel record from the People page, the following fields are editable:
- 
Start date
- 
End date
- 
Leave status
 
 

## Managing personnel access to Vanta
Personnel records and user accounts are two different things in Vanta. Your user provisioning setting controls whether adding a personnel record automatically creates a linked user account. It's a global setting that applies to all personnel records regardless of how they were imported.
 | 
Situation | 
What it means | 
Managing user access
 | 
Personnel auto-provisioning | 
Personnel automatically get a linked user account with the Employee role. Accounts are automatically deactivated when the linked personnel record is terminated, marked out of scope, or set as a service account. | 
Edit user roles from user permissions settings <https://help.vanta.com/en/articles/11345385-managing-user-roles#h_80803e8239> in Vanta
 | 
User provisioning via SCIM | 
User accounts and roles are created and synced from your IdP. Accounts are deprovisioned when removed in your IdP. | 
Edit user roles in your IdP using SCIM <https://help.vanta.com/en/articles/11345647-enabling-scim-in-vanta>
 | 
Manual provisioning | 
Personnel are monitored only—no Vanta login unless manually granted. Offboarding personnel records does not deactivate user accounts. | 
Create user accounts and edit user roles from user permissions settings <https://help.vanta.com/en/articles/11345385-managing-user-roles#h_80803e8239> in Vanta
ℹ️ Note: To view or change your user provisioning setting after setup, go to Settings and select Login and security. To understand how each setting affects user accounts, see Managing User Roles <https://help.vanta.com/en/articles/11345385-managing-user-roles#h_0794b77c5b>.
 

### Choosing a user provisioning setting
 
When you add personnel for the first time, we'll ask how you want to manage personnel access to Vanta. Your answer sets your user provisioning setting. 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381415207/24f4d69e42417d95391a75cb215f/image.png?expires=1794966300&signature=3b440279217e6d1a216c1ff1a1d4ea1b44b8318575965a0d2583563faaebd583&req=diMvF81%2FmINfXvMW1HO4zTZK31FTQE4uGULkzyvaCmD%2BcAMVgG4dpZL1BYS9%0A%2FyiceOBqOBG%2BoVzvvBo%3D%0A>
 
If your personnel need to log into Vanta to complete security tasks, submit access requests, or access the vendor intake form from the employee portal, they need a user account with the Employee role or higher. Personnel are not notified when their account is created—they only receive a notification when they’re assigned tasks or sent reminders.
 | 
Goal | 
What to click | 
User provisioning setting
 | 
You want all active personnel to automatically get a Vanta login with the Employee role that can be upgraded | 
Select Using Vanta > Automatically manage | 
Personnel auto-provisioning enabled
 | 
You manage software access from your IdP and want Vanta to follow suit | 
Select Using Vanta > Use SCIM | 
User provisioning via SCIM enabled
 | 
You want to hand-pick who gets a Vanta login | 
Select Using Vanta > Manually manage | 
Manual provisioning (user provisioning is turned off in settings)
 | 
Your personnel don't need to log in to complete tasks in Vanta | 
Select Using other systems | 
Manual provisioning (user provisioning is turned off in settings)
 
 

## Managing personnel records
You can manage personnel records from the People page. Use the tools above the table to search, filter, and sort your personnel based on available fields. Customize your table view using the controls icon to choose which columns to display and adjust how data is shown. Click a row in the table to open an individual personnel record.
 
To update a personnel record's name or email, how you make the change depends on how they were imported. For IdP-connected personnel, make the edit in your IdP and it will sync to Vanta. For manually added personnel, you can edit directly from the People page.
 | 
Action | 
Description
 | 
Marking service accounts <https://help.vanta.com/en/articles/11345579-marking-personnel-as-a-service-account> | 
Mark service accounts or other non-human accounts as Not a person. These accounts can still be accessed but will not be assigned tasks.
 | 
Scoping out personnel <https://help.vanta.com/en/articles/11346114> | 
Scope out personnel who aren’t relevant to your audit.
 | 
Merging duplicate personnel <https://help.vanta.com/en/articles/11345591-having-multiple-users-in-vanta-for-the-same-person> | 
Merge duplicates with the Vanta Agent, mark duplicates out of scope, or manage your personnel sources to prevent new duplicates.
 | 
Marking personnel on leave <https://help.vanta.com/en/articles/11345588> | 
Mark someone on leave to pause all their tasks.
 | 
Creating personnel groups <https://help.vanta.com/en/articles/11345594-creating-groups-and-tasklists> | 
Organize personnel into groups to assign security tasks. All personnel are added to a default group automatically, and you can create additional groups for subsets with different requirements.
 | 
Managing personnel tasks <https://help.vanta.com/en/articles/11345600-personnel-tasks> | 
Assign and track security tasks for your personnel, like policy acceptance, device monitoring, background checks, and security training.
 | 
Sending personnel reminders <https://help.vanta.com/en/articles/11345593-personnel-reminders-and-settings> | 
Send automated or one-time reminders to personnel with incomplete tasks via email or Slack.
 | 
Offboarding personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel> | 
When someone leaves, offboard their personnel record to trigger deprovisioning of their system access and complete any offboarding tasks.

## Images

- [image 01] ../../images/ux/personnel/adding-and-managing-personnel--01.png

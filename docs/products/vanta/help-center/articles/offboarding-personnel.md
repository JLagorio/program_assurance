# Offboarding Personnel

Source: https://help.vanta.com/en/articles/11345609-offboarding-personnel
Collection: Team Compliance ; Team Compliance › Employee Onboarding & Offboarding
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Access Management features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
When personnel leave your company, Vanta helps you manage two parts of the process: (1) starting offboarding once Vanta recognizes that the personnel record is no longer employed, and (2) deprovisioning and completing offboarding by reviewing accounts, assigning tasks, and confirming that offboarding is complete.
 
⚙️ User permissions: To start or complete offboarding, you need a user role <https://help.vanta.com/en/articles/11345385-assigning-user-roles-and-permissions> with permissions to manage people in Vanta. This means an Admin or Editor role, or a custom role with the required permissions.
 
 

## Getting started
- 
Start offboarding: Vanta needs to recognize the personnel record as no longer employed before you can begin deprovisioning or complete offboarding.
- 
Reviewing accounts: Review the personnel record's known accounts and systems, assign the people responsible for deprovisioning each one, and kick off the process.
- 
Monitor deprovisioning tasks: Track deprovisioning tasks as assignees work through their accounts.
- 
Complete offboarding: Once all tasks are done and monitored accounts are deactivated, complete the final step to mark the personnel record as fully offboarded in Vanta.
​
 

## Starting offboarding
To appear in the Offboarding filter on the People page, a personnel record should have a Terminated employment status. How a personnel record reaches that status depends on how employment data is managed in Vanta.
 
ℹ️ Note: Once a personnel record appears as Terminated, go to Personnel > People, open the record, and select Deprovision accounts to continue. The Offboard action on the People page is used to complete offboarding for records that are already eligible for final completion—it's not how you start the offboarding workflow.
 

### Employment status controlled via HRIS
 
If your HRIS is connected, Vanta uses it as the primary source of truth for employment status. 
 
After the next sync (typically within about an hour for many integrations) changes to a personnel record's HRIS status can update their employment status in Vanta. In practice, the offboarding workflow is usually available once the personnel record appears as Terminated in Vanta.
 
If a personnel record appears as Inactive instead of Terminated, Vanta may be missing a usable end date. See Troubleshooting below.
 

### Employment status controlled via IdP
 
If no HRIS is connected, Vanta uses your identity provider to determine employment status. 
 
Offboarding can start when Vanta detects that the linked IdP account has been deleted, suspended, blocked from sign-in, or otherwise deactivated, depending on the provider. For example:
- 
Google Workspace: Suspend the account
- 
Microsoft 365: Block sign-in
- 
Okta or OneLogin: Suspend the account
If your HRIS and IdP are both connected, HRIS data takes priority—deactivating the IdP account alone will not update employment status if an active HRIS record is still linked.
⚠️ Note: If you use imported IdP groups to assign Personnel tasks, permanently deleting an employee from your IdP may remove their group memberships from Vanta.
 
If the employee is deleted before their Vanta offboarding is complete, their group-specific tasks and access-removal requirements may no longer appear. To ensure the correct requirements remain assigned:
- 
Suspend, deactivate, or block sign-in for the employee instead of permanently deleting their IdP account.
- 
Confirm that the employee appears as Terminated in Vanta.
- 
Complete the employee’s offboarding requirements in Vanta before permanently deleting their IdP account.
 
 

### Manually managed personnel
 
If a personnel record isn't connected to an HRIS or identity provider, employment status won't update automatically. To start offboarding, you'll need to initiate it directly from the personnel record.
 
To mark the record as Terminated:
- 
From Personnel, go to the People page.
- 
Open the personnel record.
- 
Go to the Offboarding tab and click Offboard.
- 
Confirm Start offboarding.
This marks the personnel record as Terminated. After that, the personnel record moves into the same Deprovision accounts workflow used for other terminated personnel.
 
 

## Reviewing accounts
Once a personnel record is Terminated, open the record from the People page and select the Deprovision accounts task. 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2403982829/d30271799a9289d3cdaaa7701263/image.png?expires=1794967200&signature=805caf6aeb19a86d96683c3b4cce8741fe3a1250f97b8574505bf8e518e9e6d5&req=diQnFcB2n4ldUPMW1HO4zXMNktu7%2BAUwcqzqCQSgvzaWkzHTQBwgOc9KgD0f%0AspgKm8sctYjkxcRDZ1s%3D%0A>
 
Vanta surfaces all known accounts and systems associated with that personnel record and organizes them into sections for review. Depending on your setup, you may see:
- 
Accounts Vanta will deprovision automatically through connected integrations
- 
Accounts that need to be removed manually or confirmed
- 
Systems to review based on the personnel record's group memberships
 

### Accounts Vanta deprovisions automatically
 
If automated deprovisioning is available for your workspace and supported by the connected integration, Vanta shows these accounts in a separate section. 
 
Once you start deprovisioning, Vanta removes access automatically and updates the status as it verifies removal. No action is needed for these accounts unless you need to override the integration's status.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2403983854/05e4a1b6dc86943780771c08c40e/image.png?expires=1794967200&signature=c614242b11cf80f31c43d71f3b79bd2f04f79c0a673c316f5a61c0eb053d30ae&req=diQnFcB2nolaXfMW1HO4zVC2ZGbyfyfU02G4emLdx9IowZr2Qz3Pw17FD3Lg%0AmBzPGLfVsAFSpZJeRoQ%3D%0A>
 

### Accounts that need to be removed manually
 
These accounts still need follow-up. There are two types:
- 
Integrated accounts: Accounts in systems connected to Vanta that Vanta can monitor, but that still need an assignee or manual confirmation.
- 
Manual accounts: Accounts from past access requests in systems that are not integrated with Vanta.
For each account, assign the person responsible for deprovisioning it. By default, Vanta fills this in using the vendor's security owner. You can also reassign an account if ownership is transferring to a current employee.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2403985951/b8fa4558686ea87dde8490b9ad45/image.png?expires=1794967200&signature=28d5bbb9ac24dc4ec451e9476cecf618c6db06e485637570fe3d43eb001ab5e9&req=diQnFcB2mIhaWPMW1HO4zYODaG6FCWcJboHA5XJB38hxalVPlb3Tf8iKNojl%0AG1y0prTypQ6%2FhvVTFWI%3D%0A>
 

### Systems to review from group memberships
 
If you assign systems to personnel groups, Vanta surfaces systems that should be reviewed even when no known account has been found yet.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2404014750/04358f4c9c4bf9c7ec9ddda06c8c/image.png?expires=1794967200&signature=3441ee3f31db43d2395355762a30dc96a3d3f0a0b030aa9fa281e68430053099&req=diQnEsl%2FmYZaWfMW1HO4zZkMADFWU87rgz1YJPlKQ9jeX7loW16xiEtdJWLc%0AekT4OODKNvi3dzs4n%2Fw%3D%0A>
 
For each system, either assign the person responsible for confirming whether an account exists and deprovisioning it if needed, or ignore it if confirmation isn't required.
 
To customize what appears in this section, go to Personnel > People > Groups and update the group’s Offboarding > Access removal settings. See Vendor Scoping by Group <https://help.vanta.com/en/articles/11345605-vendor-scoping-by-group> for more details.
 
 

## Monitoring deprovisioning tasks
Once you've reviewed accounts and assigned the owners responsible for deprovisioning, you're ready to kick off the process. From there, Vanta tracks progress and assignees work through their tasks until all accounts are resolved.
 

### Starting deprovisioning
 
Once accounts and systems have assignees where needed, click Start deprovisioning. Assignees will receive their tasks and notifications. Notifications are batched and can take up to five minutes to appear.
 

### What assignees do
 
Assignees complete their work from Access > Deprovisioning tasks—they don't need access to the People page to do this.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2404007439/6f474ceca7257b8c596bf2b99281/image.png?expires=1794967200&signature=47b207e4a84c705669e8a6f911b7b2bee9d29bc88356de6cfac963a8efa8daa1&req=diQnEsl%2BmoVcUPMW1HO4zcYkdnrRyq9V9YWYMmuFOVvCiKZkRAD%2FrkVnRJ86%0AnDjhzh1UfAwAEUTJcFY%3D%0A>
 
Each task includes the system name, account name, former owner, and entitlements. Once the assignee has deprovisioned the account in the external system, they click Confirm account as deprovisioned. 
 
For supported integrations, Vanta automatically closes the task when it detects the account has been deprovisioned.
 

### Monitoring status
 
As assignees work through their tasks, you can monitor the status of each account from the personnel record. 
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2404009071/6a815391d5915ddd4503e124ed37/image.png?expires=1794967200&signature=31cab5c120f26c2e2041a6a44aca71cbc35893ef29f09813d0785c73b6e9d122&req=diQnEsl%2BlIFYWPMW1HO4zacfRHC38u8AVdBrVHsQivoxPAExym4eWd02Faf5%0AcJX29KlhSN6IaIZQK9I%3D%0A>
 
For each account, you can:
- 
View the associated deprovisioning task
- 
Mark the account as deprovisioned and close the task
- 
Open the system directly from Vanta
For deprovisioned accounts, Vanta records when the account was verified and how—whether via integration or manual confirmation.
 
 
 

## Completing offboarding
Starting deprovisioning does not automatically mark a personnel record as fully offboarded in Vanta—there is a separate final step. 
 
Once all required offboarding tasks are complete and monitored accounts are deactivated or manually marked as deactivated, you can complete offboarding to mark the personnel record as fully offboarded in Vanta. When you complete offboarding, Vanta also marks any unmonitored accounts as deactivated.
 
To complete offboarding for a single personnel record:
- 
From Personnel, go to the People page.
- 
Open the personnel record.
- 
Go to the Offboarding tab and click Complete offboarding.
 

### Bulk offboarding
 
If you need to complete offboarding for multiple personnel records at once, you can use bulk offboarding instead of completing each record individually.  
 
To complete offboarding for multiple personnel records at once:
- 
From Personnel, go to the People page.
- 
Select the checkboxes next to the personnel records you want to offboard. You can bulk offboard up to 1,000 personnel records at a time. The People page displays 50 records at a time, but you can continue selecting across pages until you reach the limit.
- 
Click Offboard.
- 
Review the confirmation dialog. Vanta separates the selected records into those that will be offboarded and those that won't. Bulk offboarding only completes offboarding for records that are already eligible for final completion—it does not initiate offboarding for active personnel records.
- 
Click Offboard to confirm.
If a personnel record appears in the will not be offboarded group, the reason will be shown in the dialog. Common reasons include:
- 
The personnel record was already offboarded
- 
The personnel record doesn't have an end date
- 
The personnel record isn't yet Terminated
- 
There are still incomplete offboarding tasks
- 
There are still active monitored accounts
Resolve the issue shown and then try again.
 
 

## Troubleshooting
 

### A personnel record shows as Inactive instead of Terminated
 
This usually means Vanta doesn't have the end-date information it needs to proceed with offboarding. This commonly happens when the HRIS has a future end date or doesn't provide a usable end date.
 
To resolve this:
- 
Go to Integrations.
- 
Open your HRIS connection and select Configure scope.
- 
Find the personnel record and mark it Out of scope.
- 
After the next sync, Vanta will use your identity provider as the source of truth for that record. If the IdP account is already deactivated, Vanta will pull the IdP deactivation date as the end date and offboarding should become available.
 

### The IdP account was deactivated, but Vanta didn't start offboarding
 
If the personnel record is linked to both an HRIS and an IdP, HRIS data takes priority. Even if the IdP account has been suspended or deleted, an active HRIS record can prevent the employment status from updating as expected.
 

### The personnel record is Terminated, but I can't complete offboarding
 
A Terminated status means the offboarding workflow is available—it doesn't skip the deprovisioning steps or the final completion step. 
 
You may still need to finish required offboarding tasks or mark monitored accounts as deactivated before Complete offboarding becomes available.
 

### I need to keep the person's inbox active
 
Some providers let you suspend or block sign-in without deleting the account. That can still make offboarding available in Vanta while preserving mailbox access. See Offboarding a User in Vanta while Keeping an Inbox Active <https://help.vanta.com/en/articles/11345606-offboarding-a-user-in-vanta-while-keeping-an-inbox-active> for provider-specific guidance.
 

### I need to find everyone who still needs offboarding attention
 
Go to Personnel > People and use the Offboarding filter. From there, use the task status filters to narrow the list and open individual records that need deprovisioning or final completion.

## Images

- [image 01] ../../images/ux/personnel/offboarding-personnel--01.png
- [image 02] ../../images/ux/personnel/offboarding-personnel--02.png
- [image 03] ../../images/ux/personnel/offboarding-personnel--03.png
- [image 04] ../../images/ux/personnel/offboarding-personnel--04.png
- [image 05] ../../images/ux/access/offboarding-personnel--05.png
- [image 06] ../../images/ux/personnel/offboarding-personnel--06.png

# Duplicate Personnel Records

Source: https://help.vanta.com/en/articles/11345591-duplicate-personnel-records
Collection: Team Compliance ; Team Compliance › Managing Users
Fetched: 2026-11-17

## Article text

Duplicate personnel records can appear on the People page when the same person is added or imported more than once. You can merge duplicates with the Vanta Agent, mark duplicates out of scope, or manage your personnel sources to prevent new duplicates.
 
⚙️ User permissions: Editors and Admins can manage personnel records. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Understanding duplicate personnel records
Vanta allows one active personnel record per email address at a time. However, you might see multiple personnel records for the same person on the People page. This can happen when:
- 
Rehire or contractor conversion: Someone leaves and rejoins your company, or moves from a contractor role to a full-time role, and your IdP or HR system creates a new account for them.
- 
Updated IdP account: An admin creates a new IdP account for someone, and the earlier IdP account is deleted or suspended.
- 
Manual record added: Someone is added manually with a different email address than their IdP record.
- 
Multiple IdPs: More than one IdP is set to populate the People page, and the same person has a different email address in each.
​
💡 Tip: Separate personnel records are expected when they track separate periods of employment, like a rehire or a move from contractor to employee. That way each record keeps its own onboarding and offboarding history. Merging them combines that history into one record, so talk to your auditor first.
 
 

## Resolving duplicate personnel records
Depending on your situation, you can merge duplicate personnel records with the Vanta Agent, mark duplicates out of scope, or manage your personnel sources to prevent new duplicates:
 | 
Situation | 
Solution 
 | 
You want to combine two personnel records into one | 
Merge duplicates with the Vanta Agent
 | 
You want to remove a duplicate personnel record that came from an IdP | 
Mark duplicates out of scope
 | 
You want to change which IdPs populate your People page | 
Manage personnel sources then merge duplicates with the Vanta agent
 | 
None of these situations fit, or the solution you tried didn’t work | 
Contact Vanta Support
 

### Merge duplicates with the Vanta Agent
 
⚠️ Note: Merging personnel records cannot be undone. The Vanta Agent can only merge records that are already on the People page. It cannot merge service accounts, records marked out of scope, or an active record into a terminated one.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2799169266/1210747f2892894c7967699b3382/image.png?expires=1794967200&signature=06ae923486affea71574f839de5e71e7c8d29beda8b4e19cb7f1eddbfaf5ac6e&req=dicuH8h4lINZX%2FMW1HO4zVh%2BTg%2B9DUEfVdA0%2Fhk867Dux9TXZMXsSBlktUmA%0ABagU%2FKS3BZcnnwyLtR0%3D%0A>
 
To merge duplicate personnel records:
- 
Open the Vanta Agent:
- 
From the People page, select the ••• menu above the table, then select Merge duplicates with Vanta Agent.
- 
Open the agent from any page and ask it to merge duplicate personnel records.
- 
Tell the agent the personnel records to merge:
- 
To find potential duplicates, the agent needs a full name, email address, or personnel ID for each person you want to check.
- 
You can locate a personnel ID in the URL when viewing a personnel record.
- 
You can look for duplicates across multiple people at once—the agent will work on them one at a time.
- 
Choose which record to keep:
- 
Record to remove: The record you remove is deleted if it was created manually. If it was imported from an IdP, it’s marked out of scope and removed from the People page. An IdP link doesn’t move to the record you keep, so keep the IdP-imported record if you want the person to keep syncing from your IdP.
- 
Record to keep: The record you keep stays on the People page and receives the other record’s ownership and access assignments, HR links, and compliance history, like policy acceptances, security training completions, task history, and offboarding.
- 
Approve each merge:
- 
Click Approve to merge the records.
- 
Click Reject to cancel the merge.
​
ℹ️ Note: If personnel records are linked to Vanta user accounts, the user account linked to the personnel record you keep retains its user role, and the other user account may be deactivated, depending on how your user accounts are managed. Update the user role as needed after merging. Learn more <https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel#h_b9d8cdbb72>
 
 

### Mark duplicates out of scope
 
Marking a duplicate personnel record out of scope removes it from the People page, reports, and exports. Use this when the personnel record has an IdP as a source and you don’t need to keep its tasks or history. To keep them, merge the duplicate personnel records with the Vanta Agent instead.
 
To mark an IdP user out of scope:
- 
Find the IdP the duplicate came from:
- 
From the People page, open the duplicate personnel record.
- 
Next to Sources, hover over the info icon to find the IdP listed for Email.
- 
From the Integrations page, open the IdP and go to the Scope tab.
- 
In the list of users in scope for that IdP:
- 
Find the user with the same email address as the personnel record and toggle it off. The record is removed from the People page and all reports and exports. To restore it, toggle the user back in scope.
- 
If you can’t change the toggle, you may be using IdP-controlled scoping, which is available for Okta, Microsoft Entra, JumpCloud, and OneLogin. Unassign the person from the Vanta app in your IdP instead.
​
ℹ️ Note: If you mark the user back in scope while another active personnel record uses the same email address, the Identity Provider Linked to Vanta test may show an error. Learn more <https://help.vanta.com/en/articles/11346057-error-unable-to-load-user-from-identity-provider>
 

### Manage personnel sources
 
If you want to use only one IdP to populate the People page, remove the other IdPs as personnel sources to prevent new duplicates.
 
To remove an IdP as a personnel source:
- 
Go to Settings > Personnel > Setup > Personnel source.
- 
Click the ••• menu next to the IdP and select Remove source.
- 
Click Disable to turn off personnel monitoring.
- 
Removing a source doesn’t disconnect the IdP, and its accounts still appear for access and vendor monitoring. 
- 
The personnel records that IdP created stay on the People page but no longer sync from that IdP. 
- 
To remove pre-existing duplicates, merge the personnel records with the Vanta Agent.
If you want to continue to use multiple IdPs, like Okta and Google Workspace, what happens depends on the person’s email address:
- 
If the email address is the same in each IdP, Vanta matches the accounts to one personnel record, so the person doesn’t get duplicates. The order you set for IdP precedence determines which IdP’s name and email address Vanta uses for that record.
- 
If the email addresses differ, Vanta creates a separate personnel record for each account, so precedence doesn’t apply. You can merge the duplicate personnel records with the Vanta Agent.
If you use the same IdP more than once, like two Okta organizations, what happens depends on the person’s email address:.
- 
If the email address is the same in both and the person has an active personnel record, Vanta doesn’t create a second personnel record, and the Identity Provider Linked to Vanta test shows an error. Learn more <https://help.vanta.com/en/articles/11346057-error-unable-to-load-user-from-identity-provider>
- 
If the email addresses differ, Vanta creates a separate personnel record for each account. You can merge the duplicate personnel records with the Vanta Agent.
 

### Contact Vanta Support
 
If the above situations don’t apply or the recommended solution didn’t resolve the issue, contact Vanta Support <https://help.vanta.com/en/articles/11346096-contacting-vanta-support>:
- 
Example prompt: I couldn’t resolve my duplicate personnel records with the Vanta Agent.
- 
Ask Ilma will ask you for the names and email addresses of the duplicate records, and which records you want to keep.
- 
Share any error messages you’re seeing or explanations the Vanta Agent gave for why it couldn’t complete the merge.

## Images

- [image 01] ../../images/ux/ai/duplicate-personnel-records--01.png

# Error: "Unable to load user from identity provider"

Source: https://help.vanta.com/en/articles/11346057-error-unable-to-load-user-from-identity-provider
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

On the Identity Provider Linked to Vanta test, you may see one of the following messages on a user entry:
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2788134312/0a53e83b85274d5c34f4045b7caa/image.png?expires=1794967200&signature=68188fc2c395b9255f8b15cdcfb29a5dca7c230fab92f6eab400e297ef79ef96&req=dicvHsh9mYJeW%2FMW1HO4za4vKL3mYQJgLkZVvu%2BzBPeXruo7xR4WdG4mA6Us%0A0JJZahERagtGu7pJjG4%3D%0A>
- 
"Unable to load user from identity provider. Loading this user would cause there to be multiple active users in Vanta with the same email address."
- 
"Updating Vanta user would cause multiple active users to have the same email."
- 
"There are multiple users with the same email in your identity provider. Loading this user would cause there to be multiple active users in Vanta with the same email address."
All three messages stem from the same root issue: Vanta enforces a rule that only one active personnel record can exist per email address. When an Identity Provider (IdP) sync would create or update a user in a way that violates this rule, Vanta blocks the sync and records a fetch error on the affected IdP user resource.
 
ℹ️ Note: If the error message says “There are multiple users with the same email in your identity provider,” the duplicate is in your IdP, not in Vanta. Check your IdP admin console for two active accounts sharing the same email address, and deactivate or update the duplicate there.
 
 
 

## Identify your scenario
Before proceeding, determine which situation matches yours:
 | 
Scenario | 
Key indicator
 | 
Scenario 1: IdP user conflicts with an existing manually-added user | 
The People page already has a personnel record with the same email, and Vanta is listed as the source
 | 
Scenario 2: IdP user conflicts with a user from a different IdP | 
The People page already has a personnel record with the same email, sourced from a different IdP
 | 
Scenario 3: An email change in the IdP conflicts with an existing user | 
The person has multiple personnel records with different emails, and the IdP email was recently updated
 
 

## Scenario 1: IdP user conflicts with an existing manually-added user

### What causes this
Someone was added to the People page manually, and then your IdP tried to import a user with the same email address. Vanta allows only one active personnel record per email address, so it blocked the IdP user from syncing in. The IdP user doesn’t appear on the People page, the manually added personnel record stays there, and the test shows an error for the IdP user.
 
Normally, when an IdP user has the same email address as a manually added personnel record, Vanta matches them to the same personnel record, so the person appears once and you don’t see this error. The conflict happens when that doesn’t work, for example:
- 
The manually added personnel record still has a connection to an earlier account from the same IdP.
- 
You marked an IdP user out of scope, someone added a personnel record manually with the same email address, and you marked the IdP user back in scope. 

### How to identify
- 
The error message in the test names the IdP user that can’t sync.
- 
Go to the Integrations page, open the affected IdP, and go to the Scope tab.
- 
Find the IdP user and note their email address.
- 
Go to the People page and search for that email address.

### You're dealing with this scenario if
- 
The People page has an active personnel record with that email address
- 
Vanta is listed as its source (not an IdP)
- 
Its status is Current

### Resolution
- 
Change the email address of the manually added personnel record so it doesn't match the one in your IdP (example: change from [email protected] to [email protected]).
- 
Wait for the next data fetch so the IdP user can sync in.
- 
Merge the personnel records <https://help.vanta.com/en/articles/11345591-duplicate-personnel-records> with the Vanta Agent. Keep the personnel record from your IdP.
​ 
 

## Scenario 2: IdP user conflicts with a user from a different IdP

### What causes this
Your organization has more than one IdP connected to Vanta (for example, both Google Workspace and Okta, or two instances of the same IdP across different domains), and both are configured to populate the People page. When the second IdP tries to sync a user whose email is already occupied by a profile from the first IdP, Vanta blocks it.
 
This can also happen with a single IdP if you have two credentials or domain instances connected.
 

### How to identify
- 
The error message will tell you which IdP user is failing.
- 
Navigate to Integrations → Connected and click Manage Scope next to the affected IdP.
- 
Search for the flagged user and note their email.
- 
Navigate to the People page and search for that email.

### You're dealing with this scenario if:
- 
There is an active profile with the same email
- 
A different IdP is listed as the source
- 
Their status is Current

### Resolution
First, decide which IdP should be the source of truth for this user.

### Option A — Keep the existing IdP user, exclude the flagged one:
- 
Go to Integrations → Connected and click Manage Scope next to the IdP that is failing.
- 
Toggle the flagged user out of scope. This stops that IdP from trying to provision them and clears the error.

### Option B — Keep the existing IdP user for all users, stop the second IdP from creating people entirely:
- 
Go to Integrations → Connected and click Manage Scope next to the secondary IdP.
- 
Turn off the "Populate the People Page" toggle. Users from this IdP will still appear as accounts for access and vendor monitoring, but they won't create or conflict with profiles on the People page.

### Option C — Switch to the new IdP user:
- 
Determine whether the existing IdP user has task history or assigned ownerships.
- 
Revoke the existing user's Admin role if assigned.
- 
Unlink HRIS data from the existing user if linked.
- 
If the existing user has no historical data, go to the existing IdP's Manage Scope and toggle the existing user out of scope. This removes them, allowing the new IdP user to sync.
- 
If the existing user has historical data, contact Vanta Support. They will walk you through marking the existing user as a Service Account so the new user can sync, and then merge the profiles to preserve historical data.
- 
Once the new IdP user is on the People page, re-link Admin roles and HRIS data as needed.
When connecting multiple IdPs to Vanta, it is recommended to only use one IdP for "populating the People page" unless your personnel are genuinely split across multiple IdPs. Visit the Integrations page to adjust this setting for each IdP.
 
 

## Scenario 3: IdP email change conflicts with an existing user

### What causes this
A user's email was updated in the IdP (e.g., name change, alias change), and the new email matches an existing active profile on the People page. When Vanta tries to sync the email change, it can't update the linked profile because this would cause two active profiles with the same email.
 
You may see the variant error message: "Updating Vanta user would cause multiple active users to have the same email."
 

### How to identify
- 
The error message will identify the affected user.
- 
Check the People page — this person may have multiple active profiles with different email addresses.
- 
One profile reflects their old email (still linked to the IdP); another profile already uses the new email.

### Resolution
- 
Find the two personnel records for this person:
- 
The one with their old email address, which is linked to your IdP.
- 
The one that already uses their new email address.
- 
Your IdP can’t update the person's email address because a personnel record with the new email address already exists. To fix this, merge the two personnel records:
- 
Merge the personnel records <https://help.vanta.com/en/articles/11345591-duplicate-personnel-records> with the Vanta Agent. 
- 
Keep the personnel record with the old email address, because it's linked to your IdP. If you keep the one with the new email address instead, the person stops syncing from your IdP.
​
 

## How to unlink HR data
Several resolution paths require unlinking HRIS data before a user can be removed or converted. These steps require an active HRIS integration (e.g., Rippling, BambooHR, Workday) connected to Vanta.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2788113269/4ec59d257c16dc143789a39e5fb2/image.png?expires=1794967200&signature=fcd7c56609458dcd9ee6a35ad6b891772f664e3125b43aab1926e267931ee988&req=dicvHsh%2FnoNZUPMW1HO4zdFUrBVwutS24Ww2lbjz0ie%2Fu0tMawdnjHk%2BHlTo%0A4FVs2INtXaiYt1rX%2FSc%3D%0A>
- 
Navigate to Personnel in the left-hand column.
- 
Select the People tab.
- 
Click the ••• menu above the table and select Manage HR Data.
- 
In the pop-up modal, go to the Linked tab and find the appropriate person's name in the Link To Person column.
- 
Select Unlink user from the dropdown.
- 
Click Save in the bottom right corner.
If you do not have an HRIS integration connected, the Manage HR Data option may not be available. Contact Support in that case.
 
 

## Additional resources
- 
Vanta & Identity Providers (IdPs) <https://help.vanta.com/en/articles/11345653>
- 
Duplicate Personnel Records <https://help.vanta.com/en/articles/11345591-duplicate-personnel-records>
- 
How Does a Person's Employment Status get Determined? <https://help.vanta.com/en/articles/11345592>
- 
Employee start dates when only using an Identity Provider <https://help.vanta.com/en/articles/11345955>
- 
How to Manually Link/Unlink HR Data <https://help.vanta.com/en/articles/11346035>

## Images

- [image 01] ../../images/ux/tests/error-unable-to-load-user-from-identity-provider--01.png
- [image 02] ../../images/ux/personnel/error-unable-to-load-user-from-identity-provider--02.png

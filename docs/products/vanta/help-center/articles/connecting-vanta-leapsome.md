# Connecting Vanta & Leapsome

Source: https://help.vanta.com/en/articles/16946450-connecting-vanta-leapsome
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

## Overview
The Leapsome integration connects your Leapsome workspace to Vanta using SCIM 2.0 API, syncing user accounts and group memberships for access governance and compliance tracking. It is best suited for teams that use Leapsome for performance management and employee engagement and need to ensure every Leapsome account is tracked, attributed to a known employee, and included in access reviews.
 
Estimated setup time: Under 5 minutes
 
 

## Use cases and capabilities
This integration pulls Leapsome user accounts into Vanta so they can be reviewed, linked to personnel records, and tracked through access control tests. It gives your team visibility into who has access to your Leapsome workspace without manual exports.
ℹ️ Note: We sync Leapsome user accounts, along with group information where available. We do not sync HR employee records such as hire dates, departments, or reporting structures.
 

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User accounts | 
Yes | 
Imported into Vanta for access reviews and personnel tracking
 | 
Account name and email | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Roles and user types | 
Yes | 
Displayed in the Role column on the Access page when available from Leapsome
 | 
Group memberships | 
Partial | 
Read from Leapsome, but not shown as a separate field. A group name may appear in the Role column when an account has no role value
 | 
Account status (active or inactive) | 
Partial | 
We use the status Leapsome reports. If no status is reported for an account, we treat it as active
 | 
Account creation date | 
Yes | 
Displayed in the Created column on the Access page
 | 
MFA status | 
No | 
Not available from the Leapsome SCIM API
 | 
Last login time | 
No | 
Not available from the Leapsome SCIM API
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
HR employee records (hire dates, departments, managers) | 
No | 
Out of scope. We only sync user accounts and groups
ℹ️ Note: Leapsome issues SCIM tokens with read and write access. We only make read-only API calls for user and group information, and we do not provision or deprovision users.
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Leapsome account with admin-level access to Settings > Integrations > HRIS Integrations, where the SCIM API settings live.
💡 Tip: We match Leapsome accounts to people in Vanta by email address. Accounts without a primary email address cannot be imported, and accounts whose emails do not match a Vanta personnel record will show as unassigned until they are linked manually.
 
 

## Setup guide

### Step 1: Generate a SCIM Authentication Token in Leapsome
- 
Log in to Leapsome as an admin.
- 
Go to Settings > Integrations > HRIS Integrations and open the SCIM API tab.
- 
Click Update & Synchronize to generate a SCIM Authentication Token.
- 
Copy the token. Treat this token like a password; keep it safe. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677808752/fb7c4fe028de384ffcf5ea046649/image.png?expires=1794967200&signature=dc7550d3d3e3f95ffa09b3c4aed20de0b6a9e86871b5be0469bf56b8240c096d&req=diYgEcF%2BlYZaW%2FMW1HO4zSM86zWiUk4%2F9k%2FwbuiTKiNFeJi12FaRz54TtvbT%0A6GeXCcu2xb%2Fn83u%2Fos8%3D%0A>
 
ℹ️ Note: For Leapsome's own step-by-step instructions on generating SCIM credentials, see Leapsome's user provisioning documentation <https://leapsome.zendesk.com/hc/en-us/articles/360005741814-Azure-Active-Directory-Integration-SCIM->.
 

### Step 2: Connect the integration in Vanta
- 
In Vanta, go to Integrations and click the Add integrations button.
- 
Search for Leapsome and click on the integration tile.
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2670072708/c6f0269aa19a76013df9377268fc/image.png?expires=1794967200&signature=d9b35d6965b5a420e0082a96a9e3088453138396bac6f6471dc7b209d2535112&req=diYgFsl5n4ZfUfMW1HO4zYTBDCyaaCeSwOlYwFVuj8zTxxoqVImnV1JINt6O%0AuvczRc0enuZQdlFo2xA%3D%0A>
- 
Paste the token into the SCIM bearer token field and complete the connection.
- 
Click Validate and store credentials. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2670074944/b97de80d9c9503de50b39145a81c/image.png?expires=1794967200&signature=010aadbea84d17fb2656d67c23abe200521e64cd98137f72ae6c2ce86f9a4b5f&req=diYgFsl5mYhbXfMW1HO4zZKy5fpKChKwYdSh3DZXEp7Rs9BrQ6fuSXADhupm%0A6eY%2Fiy513elUF9JuSVc%3D%0A>
 

### Step 3: Confirm the connection
- 
After connecting, the Leapsome integration should appear as Connected in your Vanta integrations list.
- 
We begin an initial sync after setup completes. We fetch your Leapsome users and groups, and the sync may take a few minutes depending on the size of your workspace.
 

### Step 4: Review imported accounts
- 
In Vanta, go to the Access page and filter by Leapsome to review imported accounts.
- 
We automatically match Leapsome accounts to Vanta personnel records based on email address.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, create the user by selecting Add a person, mark the account as external by selecting Assign to external person, or select Mark as service account for non-human accounts.
ℹ️ Note: Unmatched accounts will cause the "Leapsome accounts associated with users" test to fail until they are resolved.
 
 

## Permissions

### Read access
We use your SCIM Authentication Token to read two things from Leapsome: your list of users and your list of groups. From users, we read identifying information such as name, primary email, username, role or user type, account creation date, and account status. From groups, we read group names and membership so we can show which groups each account belongs to.
 
We use this information to match Leapsome accounts to people in Vanta and to run access tests, such as confirming that terminated employees no longer have active Leapsome accounts. 
 

### Write access
There is no write access. Even though the token Leapsome issues includes write permissions, we make read-only API calls only. We do not create, modify, provision, or deprovision Leapsome users.
 
 

## Troubleshooting and FAQs

### The "Leapsome accounts deprovisioned when personnel leave" test is failing
- 
Likely cause: A person marked as terminated in Vanta still has an active Leapsome account. We do not deactivate accounts for you, so the account stays active until someone removes it in Leapsome.
- 
How to confirm: Open the failing test to see which accounts are flagged, then check those accounts in Leapsome.
- 
Fix: Deactivate or delete the account in Leapsome. The test passes once the account is no longer active.

### A Leapsome user is missing from Vanta
- 
Likely cause: We can only import accounts that have a primary email address. Users without one are skipped.
- 
How to confirm: In Leapsome, check whether the missing user has an email address on their profile.
- 
Fix: Add a primary email address to the user in Leapsome, then wait for the next sync.

### A user I deactivated in Leapsome still shows as active in Vanta
- 
Likely cause: If Leapsome does not report a status for an account, we treat the account as active. There may also simply be a delay until the next sync runs.
- 
How to confirm: Verify the account is deactivated in Leapsome, then check whether the status updates in Vanta after the next sync.
- 
Fix: If the account remains active in Vanta after a sync completes, contact Vanta support.

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The SCIM Authentication Token was revoked or regenerated in Leapsome. Generating a new token can invalidate the old one. We automatically disconnect the integration when Leapsome's API tells us the token is invalid or no longer authorized.
- 
How to confirm: In Vanta, check the Leapsome integration tile for a disconnected or error status. In Leapsome, check the SCIM API tab to see whether the token was recently changed.
- 
Fix: Generate a fresh token in Leapsome and reconnect the integration from the Vanta Integrations page with the new token.

## Images

- [image 01] ../../images/integrations/leapsome/connecting-vanta-leapsome--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-leapsome--02.png
- [image 03] ../../images/integrations/leapsome/connecting-vanta-leapsome--03.png

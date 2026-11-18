# Connecting Vanta & Torii

Source: https://help.vanta.com/en/articles/16005680-connecting-vanta-torii
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The Torii integration connects your Torii SaaS management platform to Vanta via API key, syncing user accounts for access governance and compliance tracking. It is best suited for teams that use Torii to discover and manage their SaaS inventory and need to ensure every account is tracked, attributed to a known employee, and included in access reviews.
 
Estimated setup time: Under 5 minutes
 
 

## Use cases and capabilities
This integration pulls Torii user accounts into Vanta so they can be reviewed, linked to personnel records, and tracked through access control tests. It gives your team visibility into who has access to Torii-managed applications without manual exports.
 

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
Account email and display name | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Account creation date | 
Yes | 
Displayed on the account record
 | 
Role | 
Yes | 
Displayed on the account record to indicate the user's role in Torii
 | 
MFA status | 
No | 
Not available from the Torii API
 | 
Last login time | 
No | 
Not available from the Torii API
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
External users | 
No | 
Intentionally excluded — we only sync internal users
 | 
Offboarded users | 
No | 
Intentionally excluded — we only sync active users
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Torii admin account with access to API key management.
- 
You have generated a read-only API key in Torii (see Step 1 below).
 
 

## Setup guide

### Step 1: Generate a read-only API key in Torii
- 
Log in to your Torii admin portal.
- 
Navigate to Settings > API Access. 
- 
Click Generate API key.
- 
Give the key a descriptive name, such as Vanta Integration.
- 
Set permissions to read-only.
- 
Copy the generated API key. You will need it in the next step.
⚠️ Note: Store your API key in a secure place before navigating away. You may not be able to view it again after leaving this screen.
 

### Step 2: Find the Torii integration in Vanta
- 
In Vanta, go to Integrations and click the Add integrations button.
- 
Search for Torii and click on the integration tile.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2555227525/d6e4510a99624f5a54555b788412/image.png?expires=1794967200&signature=e21b05c48501c07fe9ae3275a29db10dcd2273dee4ca2ac3dcab2ba564259c47&req=diUiE8t8moRdXPMW1HO4zSYCoU1EoyFIDyK5CgHt6U2K8kaR7PFBhYbRd9r%2F%0Aban41WHSKvWsCc44hco%3D%0A>
 

### Step 3: Select your product(s)
- 
A setup modal will appear. Select which product(s) you want to enable:
- 
Access — syncs Torii user accounts into Vanta for access monitoring and reviews.
- 
Click Next.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2555229298/cf8c3c63a2da244bf44dce699694/image.png?expires=1794967200&signature=f577f51dd701599655172f74d0df491d06a16cf517604b06c93f44a20d542195&req=diUiE8t8lINWUfMW1HO4zSoxw2e3nV5ojRlv1z%2FGREFjwH1jQBkf9%2B%2BXBqdN%0AsiiQ6kg56uEOZJP2V4I%3D%0A>
 

## Step 4: Enter your API key
- 
Enter the Torii API key you generated in Step 1.
- 
Click Done to validate and save your credentials.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2555232166/88bb02de80e531b6ff7243da09b3/image.png?expires=1794967200&signature=a6fe2ef9efe0f1de54ee936111a9a8b64cc395e03184a8cb6f0911647f77b8cf&req=diUiE8t9n4BZX%2FMW1HO4zT4%2FXTElq1ucLVLwIQTmA6sKWUeo8SSdNlzlePGc%0AEoSrrZzvSa57m8F6wKY%3D%0A>
 

### Step 5: Review imported accounts
- 
We begin an initial sync immediately after setup completes. The sync may take a few minutes depending on the size of your Torii account.
- 
In Vanta, go to Personnel and then select the Access page and filter by Torii to review imported accounts.
- 
We automatically suggest matches between Torii accounts and Vanta personnel records based on email address. You may need to confirm these suggestions in the Access page for them to be fully linked.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, or mark them as external or service accounts as appropriate.
ℹ️ Note: Unmatched accounts will cause the "Torii accounts associated with users" test to fail until they are resolved.
 
 

## Permissions

### Read access
We use the API key you provide to read user account data from your Torii workspace, including email addresses, names, roles, lifecycle status, and account creation dates. 
 

### Write access
There is no write access. We do not modify, reassign, or delete any data in Torii.
 
 

## Troubleshooting and FAQs

### The "Torii accounts associated with users" test is failing
- 
Likely cause: One or more Torii accounts are not linked to a Vanta personnel record. This test passes only when every imported account is associated with a known user in Vanta.
- 
How to confirm: In Vanta, go to Access and filter by Torii. Look for accounts with no linked user.
- 
Fix: For each unlinked account, link it to the correct Vanta user, or mark it as an external or service account. All three options resolve the test failure for that account.

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The API key was revoked or rotated in Torii. We automatically disconnect the integration if we receive an authentication error from the Torii API.
- 
How to confirm: In Vanta, check the Torii integration tile for a disconnected or error status. In Torii, confirm that the API key is still active in your API settings.
- 
Fix: Generate a new read-only API key in Torii, then reconnect the integration from the Vanta Integrations page and enter the new key.

### A Torii user is missing from Vanta
- 
Likely cause: The user may be offboarded, marked as external, or missing a valid email address in Torii. All three conditions cause a user to be excluded from sync.
- 
How to confirm: In Torii, check the user's lifecycle status, external user flag, and email address.
- 
Fix: If the user should be included, update their record in Torii and wait for the next sync cycle. If the user is correctly offboarded or external, no action is needed; this is expected behavior.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-torii--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-torii--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-torii--03.png

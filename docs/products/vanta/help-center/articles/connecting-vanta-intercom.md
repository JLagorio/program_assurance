# Connecting Vanta & Intercom

Source: https://help.vanta.com/en/articles/15436694-connecting-vanta-intercom
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.

## Overview
The Intercom integration connects your Intercom workspace to Vanta over OAuth, syncing admin and teammate accounts for access governance and compliance tracking. It is best suited for teams that use Intercom to manage customer communications and need to ensure every Intercom account is tracked, attributed to a known employee, and included in access reviews.
 
Estimated setup time: Under 5 minutes
 
 

## Use cases and capabilities
This integration pulls Intercom admin and teammate accounts into Vanta so they can be reviewed, linked to personnel records, and tracked through access control tests. It gives your team visibility into who has access to your Intercom workspace without manual exports.
ℹ️ Note: We only sync admin and teammate accounts, the people who manage your Intercom workspace. We do not sync Intercom end-user contacts or customer records.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Admin and teammate accounts | 
Yes | 
Imported into Vanta for access reviews and personnel tracking
 | 
Account display name and email | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Role (inbox vs. teammate) | 
Yes | 
Displayed on the account record to indicate whether the user holds an inbox seat
 | 
Job title | 
Yes | 
Displayed on the account record when available in Intercom
 | 
MFA status | 
No | 
Not available from the Intercom API
 | 
Account creation date | 
No | 
Not available from the Intercom API
 | 
Last login time | 
No | 
Not available from the Intercom API
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
End-user contacts / customers | 
No | 
Out of scope — we only sync workspace admins and teammates
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an Intercom account with admin or owner-level access to the workspace you want to sync.
💡 Tip: We connect via OAuth and inherit the permissions of the account you authorize with. If the authorizing account has restricted visibility in Intercom, we will only be able to access what it can see. We recommend connecting with an Intercom Owner or Admin role to ensure all teammate accounts are captured.
ℹ️ Note: This integration connects to one Intercom workspace per OAuth credential. If your organization uses multiple Intercom workspaces, each will require a separate connection.
 
 

## Setup guide

### Step 1: Find the Intercom integration in Vanta
- 
In Vanta, go to Integrations and click the Add integrations button.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2466096758/2bf2c9446d7a093b3c145dcf2ae0/7df69efb-1d38-460c-9f63-b2655be5d3b0?expires=1794967200&signature=980a8a68489dc703f9635b7c5e840b88ff95b6eee33fb1c868f0c5f5ddc3376a&req=diQhEMl3m4ZaUfMW1HO4zZbeftcdR1jYMjlhtW7eM2sDFzYyr5Uy%2BlLsFJ17%0AlASdJNu51gxi2nuJKEU%3D%0A>
- 
Search for Intercom and click on the integration tile. 
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2466097521/268721ea2af54ab852c6b9a86100/f00ee314-4c13-4036-843d-33d93645100b?expires=1794967200&signature=7e04af90c74bf2f1e23f2503a76f8038451545148242093cfa72ddb6b098a630&req=diQhEMl3moRdWPMW1HO4zUl%2BK%2Ba4uk7Nf1Nvuh2QYgjDkVhO9paKTtTZ9AoK%0AfQnkgyDv%2FQHGi9BCZy4%3D%0A>
 

### Step 2: Authorize the connection
- 
A Link Intercom modal will appear. Click Connect Intercom.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2466098331/4157b6eafdd70a8be69bec8b2f5c/4c9c8b08-1a6b-448d-abee-6d076806f9bc?expires=1794967200&signature=be7b331d9ee38bc5a77d05a860e48ec38495d83551dd0013222ec689c71cf641&req=diQhEMl3lYJcWPMW1HO4zZZH8Brm6U%2FO5Oye%2F8vijhbE2yfoVjUVIXTQb7Kk%0ANHSAsicX4B3CUrxHGrA%3D%0A>
- 
Vanta redirects you to Intercom's OAuth authorization page.
- 
Make sure you are logged into the correct Intercom account before proceeding.
- 
Review the requested permissions and click the confirmation button to grant Vanta access.
- 
Intercom redirects you back to Vanta automatically.
⚠️ Note: If you are not redirected back to Vanta, check that your browser is not blocking third-party cookies, which can interfere with the OAuth callback. If the redirect does not complete, try the flow in an incognito window or a different browser.
 

### Step 3: Confirm the connection
- 
After authorizing, the Intercom integration should appear as Connected in your Vanta integrations list.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2466147093/f9629c2f04ff2123ecc6fa4d71d1/2dc60179-2e80-47a9-9a1f-64df7fe42e13?expires=1794967200&signature=85f45353e5fa5b249a8eac44222be9073c77c9fd723af947f54324939ba073d5&req=diQhEMh6moFWWvMW1HO4zRTgMzwPBDTxYQOBt4G5mXPcDH5Kc9BMSwmDjuCz%0AINANAmiUcnMSFXURZhs%3D%0A>
- 
We begin an initial sync immediately after setup completes. The sync may take a few minutes depending on the size of your Intercom workspace.
 

## Step 4: Review imported accounts
- 
In Vanta, go to Personnel and then select the Access page and filter by Intercom to review imported accounts.
- 
We automatically suggest matches between Intercom accounts and Vanta personnel records based on email address and display name. You may need to confirm these suggestions in the Access page for them to be fully linked.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, or mark them as external or service accounts as appropriate.
ℹ️ Note: Unmatched accounts will cause the "Intercom accounts associated with users" test to fail until they are resolved.
 
 

## Permissions

### Read access
We use the authorization you grant during setup to read admin and teammate account data from your Intercom workspace including display names, email addresses, roles, and job titles where available. We do not access Intercom conversations, messages, contacts, or any customer-facing data.
 

### Write access
There is no write access. We do not modify, reassign, or delete any data in Intercom.
 
 

## Troubleshooting and FAQs

### The "Intercom accounts associated with users" test is failing
- 
Likely cause: One or more Intercom accounts are not linked to a Vanta personnel record. This test passes only when every imported account is associated with a known user in Vanta.
- 
How to confirm: In Vanta, go to Access and filter by Intercom. Look for accounts with no linked user.
- 
Fix: For each unlinked account, link it to the correct Vanta user, or mark it as an external or service account. All three options resolve the test failure for that account.

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The OAuth access token was revoked in Intercom, or the authorizing account lost admin access. We also automatically disconnect the integration if it receives an authorization or permission error from the Intercom API.
- 
How to confirm: In Vanta, check the Intercom integration tile for a disconnected or error status. In Intercom, confirm that Vanta's OAuth authorization is still active under your workspace's app or security settings.
- 
Fix: Reconnect the integration from the Vanta Integrations page and complete the OAuth flow again. If the disconnection recurs, reconnect using an Intercom Owner-level account to reduce the risk of permission-related failures.
ℹ️ Note: The Intercom OAuth token does not expire on a schedule. Your connection remains active unless you manually revoke Vanta's access in Intercom or the authorizing account is removed.
 

### An Intercom account is missing from Vanta
- 
Likely cause: The missing account may be a system or bot account used internally by Intercom. 
- 
How to confirm: If you believe a legitimate teammate account is missing, check Settings > Teammates in Intercom and wait for the next sync cycle.
- 
Fix: If the account is present in Intercom but not showing in Vanta after waiting for a sync, try disconnecting and reconnecting the integration to trigger a fresh sync.

### MFA status is not showing for Intercom accounts
- 
Likely cause: This is expected. The Intercom API does not expose MFA status for admin accounts, so this field is always blank in Vanta for Intercom accounts.
- 
How to confirm: MFA will appear as unavailable for all Intercom accounts. This is not a sync error.
- 
Fix: No action needed in Vanta. To verify MFA status for your Intercom admins, check directly within Intercom's admin settings or your identity provider.

### The OAuth authorization failed or I was not redirected back to Vanta
- 
Likely cause: A browser issue (cookie blocking, session mismatch) or an error during the OAuth handshake.
- 
How to confirm: Check whether the Intercom integration in Vanta shows a connection error. Try the flow in an incognito window or a different browser to rule out browser-specific issues.
- 
Fix: Retry the connection from the Vanta Integrations page. Make sure you are logged into the correct Intercom account before clicking Connect.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-intercom--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-intercom--02.png
- [image 03] ../../images/integrations/intercom/connecting-vanta-intercom--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-intercom--04.png

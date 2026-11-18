# Connecting Vanta & Twilio

Source: https://help.vanta.com/en/articles/15364630-connecting-vanta-twilio
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The integration connects your Twilio organization to Vanta using OAuth, pulling in active user accounts for access reviews, offboarding tracking, and compliance monitoring. We connect using an OAuth app you create in the Twilio Admin Center; no agent or connector software required.
 
This integration is best suited for:
- 
Security and compliance teams that need visibility into who has an active Twilio account and whether former employees have been offboarded
- 
IT and access management teams running periodic access reviews and needing Twilio included in automated compliance tests
- 
GRC teams building evidence that terminated personnel have had Twilio access removed
Estimated setup time: 10–15 minutes
 
 

## Use cases and capabilities
We import active user accounts from your Twilio organization so they can be linked to personnel records, included in access reviews, and tracked through automated compliance tests. This gives your team a clear view of who has access to Twilio without manual exports or one-off audits.
 

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User accounts | 
Yes | 
Imported for access reviews and personnel tracking
 | 
Account status (active/inactive) | 
Partial | 
Only active accounts are imported; inactive accounts are excluded during sync and are not visible in Vanta 
 | 
Display name and email | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Roles / Entitlements | 
No | 
Not currently imported by this integration
 | 
Last login time | 
No | 
Not currently imported by this integration
 | 
MFA status | 
No | 
Not currently imported by this integration
 | 
Groups | 
No | 
Not included in this integration
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
Multiple Twilio connections | 
Yes | 
A single Vanta org can connect multiple Twilio organizations
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Twilio account with Organization Owner or Organization Admin role. This is required to access the Twilio Admin Center and create OAuth apps.
- 
You can access Twilio Admin Center (separate from the Twilio Console — it is reached by clicking Admin in the top-right corner of the Console).
- 
The account you will use to authorize the connection has Twilio email (non-SSO) credentials configured. If it does not, contact your Twilio administrator before starting.
💡 Tip: The OAuth authorization in the final step is tied to the user who approves access. We recommend performing this setup with a dedicated service account rather than an individual's personal account, so the connection is not disrupted if that person's access changes or they leave the organization.
 
 

## Setup guide

### Step 1: Create an OAuth app in Twilio Admin Center
- 
Sign in to the Twilio Console as an Organization Owner or Organization Admin. Click Admin in the top-right corner to open the Admin Center.
- 
Go to Applications > OAuth apps.
- 
Click Create OAuth app.
- 
Select Authorization code as the grant type.
- 
In the Application name field, enter a name for your OAuth app (e.g., "Vanta").
- 
In the Company Name field, enter your company name.
- 
In the Redirect URL field, enter https://api.vanta.com/auth/o/callback/integrations_platform.
- 
Under Scopes and Permissions, select the managed-users scope with the List option. This grants Vanta read-only access to the list of managed users in your Twilio organization.
- 
Click Save.
- 
After Twilio generates the credentials, copy both the Client ID and the Client Secret.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493750059/3f65254c5d1bf381dbedf4fdc31b/25598b5b-a4d0-4111-9ee0-6b5e680eaebe?expires=1794967200&signature=82aa10cc83da1439052778807d69260786e94030b0116ef20a16889ec248dc8d&req=diQuFc57nYFaUPMW1HO4zXNtmCjI8FpBe5RiOU2ZC1m5jWAksEG0wlR3ztxU%0AVFAfnlKey9JeL2RUqJE%3D%0A>
⚠️ Note: The Client Secret is shown only once. Copy it before navigating away. You cannot retrieve it again afterward. If you lose it, you will need to delete the OAuth app and create a new one.
 

### Step 2: Enter your credentials in Vanta and authorize access
- 
In Vanta, go to Integrations, click Add integration, and search for Twilio. For help navigating integrations, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
On the Connect Twilio page, enter the Client ID and Client Secret you copied in Step 1 into their respective fields.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493751334/5d8600ef3c4a5997cf0686a53a61/fa22a3d7-4044-4e5d-9fe6-3e98bafe4732?expires=1794967200&signature=0c66be770cb5c7cf7032e7cd18e971d1c63408c3f4cd80f31315372474b0db5d&req=diQuFc57nIJcXfMW1HO4zQT6bikvSZHvNTkX7SSehGVEd%2F9mKwjTLfex8wk3%0AV%2F90nMv4FMOzgpOawdE%3D%0A>
- 
Click Validate and store credentials. You will be redirected to Twilio to approve access.
- 
Sign in with your Twilio email address and password.
- 
Approve the requested permissions. You will be redirected back to Vanta automatically.
 

### Step 3: Confirm the connection and review imported accounts
- 
After completing authorization, the Twilio integration should appear as Connected in your Vanta integrations list.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493752092/1b5a7d361dfdfb05e5d47edc6b65/62f99947-6d37-4190-a3db-2d9d01466855?expires=1794967200&signature=59392014e407d7d231ff011581d1105e6f9375fdd081485f1fcd33550f3bf2ea&req=diQuFc57n4FWW%2FMW1HO4zcDa7f539QjPGyQBA2D1e7PECJK0%2BFr5ZiOk8oVe%0AW9PhcFML3xQax2peqQ8%3D%0A>
- 
In Vanta, go to Personnel, select the Access tab, and filter by Twilio to review imported accounts.
- 
We automatically suggest matches between Twilio accounts and Vanta personnel records based on email address and account name. You may need to confirm some of these suggestions manually.
ℹ️ Note: If you need to connect additional Twilio organizations (for example, if your company operates under multiple Twilio org accounts), you can add multiple Twilio connections from the same integrations page.
 
 

## Permissions

### Read access
We use the OAuth authorization you grant during setup to read user account data from your Twilio organization. Specifically, we access:
- 
Usernames (typically email addresses)
- 
Display names and full names
- 
Email addresses associated with each account
- 
Account active/inactive status
We use this data solely to populate access reviews, match users to Vanta personnel records, and run automated compliance tests. We do not access call records, messaging data, usage logs, or any other operational Twilio data.
 

### Write access
None. We do not modify, reassign, or delete any data in Twilio.
 
 

## Troubleshooting and FAQs

### The connection fails immediately after I click "Validate and store credentials"
- 
Likely cause: The Client ID or Client Secret was entered incorrectly, or the Client Secret was not copied before navigating away from Twilio.
- 
How to confirm: Double-check that both values match exactly what Twilio generated. If the Client Secret field is blank, it was not copied before navigating away.
- 
Fix: If the secret is lost, delete the existing OAuth app in Twilio Admin Center, create a new one following the same steps, and re-enter the new credentials in Vanta.
 

### I get a "permissions" or "access denied" error during the OAuth flow
- 
Likely cause: The managed-users scope with the List permission was not selected when creating the OAuth app, or the authorizing account does not have the required Organization Owner or Organization Admin role.
- 
How to confirm: In Twilio Admin Center, open the OAuth app and confirm the managed-users scope with List is selected. Also confirm the account used to authorize has the correct org-level role.
- 
Fix: Update the OAuth app's scope in Twilio Admin Center, or repeat the authorization step using an account with the correct role.
 

### I tried to authorize using SSO and it didn't work
- 
Likely cause: The Twilio OAuth authorization page does not support SSO login. This is a Twilio platform limitation.
- 
How to confirm: If you are redirected to an SSO login flow, it will fail or not recognize your credentials.
- 
Fix: Use your Twilio email address and password directly on the authorization page. If you do not have email credentials set up, work with your Twilio administrator to configure them for the service account used to authorize the connection.
 

### Twilio accounts are not appearing in Vanta after connecting
- 
Likely cause: The initial sync has not completed yet, or the accounts in Twilio are marked as inactive and are therefore excluded from the sync.
- 
How to confirm: Wait a few minutes after setup, then check the Access tab under Personnel in Vanta, filtered by Twilio. Also confirm the accounts you expect to see are marked as active in the Twilio Admin Center.
- 
Fix: If the integration shows as Connected but no accounts appear after 15–20 minutes, disconnect and reconnect the integration. If the expected accounts are inactive in Twilio, they will not be imported — only active accounts are synced.
 

### Personnel records in Vanta are not auto-matching to Twilio accounts
- 
Likely cause: The email address or display name in Twilio does not match what is on record in Vanta for that person.
- 
How to confirm: In Vanta, go to Personnel > Access, filter by Twilio, and look for accounts listed as unlinked. Compare the email or name on the Twilio account against the Vanta personnel record.
- 
Fix: You can manually link accounts in Vanta's access review interface. To prevent this going forward, ensure that Twilio accounts use the same email address as the personnel record in Vanta.

## Images

- [image 01] ../../images/integrations/twilio/connecting-vanta-twilio--01.png
- [image 02] ../../images/integrations/twilio/connecting-vanta-twilio--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-twilio--03.png

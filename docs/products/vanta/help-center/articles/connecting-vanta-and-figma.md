# Connecting Vanta and Figma

Source: https://help.vanta.com/en/articles/11345923-connecting-vanta-and-figma
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Overview
The Figma integration connects Vanta to your Figma organization via SCIM API. Once connected, Vanta syncs active user accounts and group membership from Figma on a recurring schedule. This data powers compliance tests, access reviews, access tests, and (when enabled and opted in) automated user deprovisioning directly from Vanta.
 
Estimated setup time: Less than 10 minutes
 
 

## Use cases and capabilities
Vanta connects to Figma using a SCIM API token and syncs user and group data on a recurring basis. This integration powers four workflows in Vanta:
- 
Automated compliance tests — Vanta checks that Figma accounts are linked to active employees and that access is removed when personnel leave. This reduces the manual effort of verifying offboarding and provides test results that can be used as compliance evidence.
- 
Access reviews — Synced users and group membership appear in Vanta's Access Reviews workflow. Reviewers can confirm whether access is still appropriate, validate least-privilege alignment, and generate audit-ready evidence without leaving Vanta.
- 
Access requests — Figma can be configured as an access system in Vanta, making it available as a destination in the Access Requests workflow. Employees can request Figma access, and approvers can review requests with user and group context visible. Note: access request fulfillment is manual. Vanta does not auto-provision new users into Figma when a request is approved.
- 
Automated deprovisioning — When automated deprovisioning is available for your Vanta account and you opt in for a Figma connection, Vanta can deactivate a user's Figma account during offboarding without requiring manual action in Figma.
⚠️ Note: Automated deprovisioning is not enabled by default. Availability depends on your Vanta plan and feature access. When available, you must opt in for each Figma connection. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. 
 
For a full walkthrough of the offboarding workflow, see Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.

### Capabilities summary
The Figma integration supports the following resources and workflows within Vanta:
- 
Users — Used for Access Reviews, Access Requests, and Automated Tests.
- 
Groups — Used for Access Reviews and Access Requests (membership context on user records; groups are not stored as standalone resources in Vanta).
- 
Roles — Basic role data (such as seat type or permission level) may appear on account records, depending on configuration; full entitlement mapping is not supported.
- 
Access Deprovisioning — Allows deactivation of users directly from Vanta (may require an add-on or upgrade to your Vanta account; provisioning is manual — Vanta does not auto-provision new users into Figma).
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>
 | 
Groups | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Roles/Entitlements | 
❌ | 
Not supported
 | 
Last Login | 
❌ | 
Not available via Figma SCIM API
 | 
Deprovisioning | 
✅ | 
Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>
 
Note: May require an upgrade or add-on <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta>, and you must opt in for each connection when available.
 

## Permissions

### What Vanta reads from Figma: 
- 
User accounts - Confirms that only active employees retain system access. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
Group memberships - Validates least-privilege access and confirms that group-based access controls meet compliance requirements. Synced group data is surfaced in Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews> so approvers can assess whether a user's group memberships reflect appropriate access.
 

### What Vanta writes to Figma: 
Vanta writes only when automated deprovisioning is enabled and an offboarding action is initiated in Vanta:
- 
Deactivates users — Vanta sends a SCIM request to set the user's account to inactive in Figma. No other user data is modified. Accounts are deactivated, not deleted.
Vanta does not provision new users into Figma and does not modify any user data outside of the deprovisioning action.
 
 

## Prerequisites 
 | 
⚠️ Note: SCIM provisioning is not available on Figma Starter or Professional plans. You must have a Figma Organization or Enterprise plan. 
Before connecting ensure you have the following before setup: 
- 
A Vanta administrator account
- 
A Figma SCIM API token 
⚠️ Note: Vanta uses your Figma SCIM API token only to read user and group data. It does not access Figma design content, create or modify users, or manage groups. When automated deprovisioning is enabled, and you opt in for the connection, Vanta also uses this token to deactivate user accounts during offboarding — no other write actions are performed.
- 
Your Figma Tenant ID
- 
SAML SSO configured in your Figma organization: Your Tenant ID is located in the SAML SSO section of Figma Admin Settings; SAML SSO must be set up before you can retrieve it
⚠️ Note: Figma’s SCIM provisioning is not available if your organization uses non-SAML authentication. See Set Up Automatic Provisioning via SCIM <https://help.figma.com/hc/en-us/articles/360048514653-Set-up-automatic-provisioning-via-SCIM> for Figma-side prerequisites.
 
 

## Setup Guide

### Step 1: Generate a Figma SCIM API token
- 
Open Figma and log in as an admin.
- 
Select Admin in the left sidebar.
- 
Navigate to the Settings tab.
- 
In the Login and provisioning section, click SCIM provisioning.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332880950/e38aca5687f0ff0aab145274c6ee/ba54a39e-5a6a-4685-8630-6c769de96690?expires=1794967200&signature=cfab0ee8cd3ad55addf45db6bdb1f8e676b6a62cb3c9238682129c508500fb80&req=diMkFMF2nYhaWfMW1HO4zUCMxkftHveKnZ8YeqMICd1uPMaWwdrvHxmYbcsv%0AFjAm0UWkEZEcijqOm%2FA%3D%0A>
- 
Click Generate API token.
- 
Copy the API token value — you will need this in Vanta.
⚠️ Note: Store this token securely. Figma will not display it again after you navigate away.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332883216/531688c0b1158929051cf6979595/e6897d97-f9b5-4379-84bc-dd8b3b331057?expires=1794967200&signature=c4ce6f9efe70975a2a0220a5a6dcd01d68ad0ebfb489b802165c1ca7e41d8a21&req=diMkFMF2noNeX%2FMW1HO4zd8pUmDA%2Bf1u0zpZ3DdHEOZqeUbryDHTRwYL6ZbU%0APJNo9cIJDE1VuIgpu6s%3D%0A>
 

### Step 2: Find your Figma Tenant ID
- 
In Admin settings, navigate back to Settings > Login and provisioning.
- 
Click SAML SSO.
- 
Copy the Tenant ID shown on this page.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332884372/cb7da5d30221aad239fd9dcf0f1b/0cd742a9-dd1f-4ee8-b7a4-d1e3e16bfa3b?expires=1794967200&signature=c8545b31d8910a0ec4f03ecd683cb67e1034f708a46adfea63055236907a04a5&req=diMkFMF2mYJYW%2FMW1HO4zYwof686WK5zvlKraXS6WbVxMEu%2F5k99nQQSBlGK%0A1hIxf%2BUYwp%2FEmAWcgxQ%3D%0A>
 

### Step 3: Connect in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Figma. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
- 
Enter the API token (SCIM token) you generated in Step 1.
- 
Enter the Tenant ID you copied in Step 2.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332893272/4bab45198194fc7679e5f08430d1/26747020-9a0d-43fd-bebb-438a694c7ea1?expires=1794967200&signature=566d081c52aa57e875bffeb86ec9d8f66d5f94b238aaf66eef39b881968131bc&req=diMkFMF3noNYW%2FMW1HO4zUObQP6%2FeKJHZ0pmWkiG89kXKZiB%2BRlFcBGAtdav%0AEm9yVyyoZlkCZi1ESDI%3D%0A>
- 
If your account has access to automated deprovisioning for Figma, you may also see an Enable Vanta to automatically deprovision checkbox. Select it if you want to opt in for this connection.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332894576/9a3be5898013aa6d7e50f5e9ee4a/3424a3ee-7725-4989-bc90-c4155babb8e2?expires=1794967200&signature=4aff7313dee3c94d4bdc7ea7954b2fe17a97ebdc3aeaa5fdc68a08f6ed45eb06&req=diMkFMF3mYRYX%2FMW1HO4zcVIhbLBGZd7Ft6ip8OAMn2rH2d3Fzs4aa1S0N66%0ATP6QJ3MUhdL3iNz7wDI%3D%0A>
- 
Click Validate and store credentials.
- 
You will see a Figma Connected! modal after that. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2332895942/705c8a6eaf4bd4215316b468384f/1b299ee3-013a-46da-b2ef-31fabad4c647?expires=1794967200&signature=c7d9cad845cc9ff747200efd6febe5143a302fa3b44dcad24210dbdd8bfe8df1&req=diMkFMF3mIhbW%2FMW1HO4zZPnYd8o5i%2FvlNKFOmUvh7o9RDfc%2F1EY4M%2FPMiHD%0A156EjNgMSX6IyXaLIHU%3D%0A>
 
 

## Verification and Validation
Where to confirm the integration is working:
- 
After setup, navigate to the Integrations section, search for Figma, and verify the status shows Connected. 
- 
To confirm the account data is syncing, go to Personnel > Access > select Figma from the dropdown menu. Once the initial sync completes, active Figma user accounts will populate on this page. 
- 
If automated deprovisioning is available for your account and you opt in for the connection, that connection can be used in Vanta's offboarding workflow to deactivate Figma users.
​
 

## Troubleshooting and FAQs 

### I can't generate a SCIM token in Figma
- 
Likely cause: Your Figma plan does not support SCIM, or your account does not have Organization Admin permissions.
- 
Fix: Confirm your organization is on a Figma Organization or Enterprise plan and that you are logged in as an Organization Admin. If your organization uses non-SAML authentication, SCIM provisioning cannot be enabled.
 

### My users aren't appearing in Vanta after connecting
- 
Likely cause: The initial sync has not yet completed, or the credentials entered were incorrect.
- 
Fix: Allow up to 30 minutes for the initial sync. If users still do not appear, verify that the API token and Tenant ID were entered correctly and reconnect the integration from the Integrations page in Vanta.
ℹ️ Note: Users who are inactive in Figma or who have no primary email address will not appear — this is expected behavior.
 

### Credential validation failed with No users found
- 
Likely cause: Figma's SCIM provisioning was recently enabled and has not yet synced your users.
- 
Fix: After enabling SCIM provisioning in Figma, wait a few minutes for Figma to complete its initial provisioning, then retry the connection in Vanta.
 

### I don't see the deprovisioning checkbox
- 
Likely cause: Automated deprovisioning for Figma is not enabled for your Vanta account.
- 
Fix: If you expect this feature to be available, contact Vanta Support or your account team to confirm plan eligibility and rollout status.
 

### Deprovisioning failed with Insufficient permissions
- 
Likely cause: The SCIM token stored in Vanta was not generated by a Figma Organization Admin, or the generating admin's permissions were changed after the token was created.
- 
Fix: Log in to Figma as an Organization Admin, generate a new SCIM API token, and update the integration credentials in Vanta.
 

### Deprovisioning failed with Reconnect the integration
- 
Likely cause: The SCIM token has been revoked or regenerated in Figma. The token stored in Vanta is no longer valid.
- 
Fix: In Figma, navigate to Admin Settings > Settings > SCIM provisioning, generate a new API token, and update the credentials in Vanta.
 

### Deprovisioning failed with Something went wrong
- 
Likely cause: Required information about the user is missing or in an unexpected state in Figma.
- 
Fix: Verify the user's account exists and is in a valid state in your Figma organization, then retry.
 

### I don't see groups available when configuring access requests or access reviews
- 
Likely cause: The initial sync has not completed, or no groups exist in your Figma organization.
- 
Fix: Confirm that groups exist in your Figma organization. If the integration was recently connected, allow up to 30 minutes for the initial sync to complete.

## Images

- [image 01] ../../images/integrations/figma/connecting-vanta-and-figma--01.png
- [image 02] ../../images/integrations/figma/connecting-vanta-and-figma--02.png
- [image 03] ../../images/integrations/figma/connecting-vanta-and-figma--03.png
- [image 04] ../../images/integrations/figma/connecting-vanta-and-figma--04.png
- [image 05] ../../images/integrations/figma/connecting-vanta-and-figma--05.png
- [image 06] ../../images/integrations/figma/connecting-vanta-and-figma--06.png

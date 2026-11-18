# Connecting Vanta & Salesforce (Access)

Source: https://help.vanta.com/en/articles/16920330-connecting-vanta-salesforce-access
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
Vanta integrates with Salesforce to sync user account data so you can monitor access, run automated compliance tests, conduct access reviews, and, when enabled, automatically deactivate Salesforce users during employee offboarding.
 
Estimated setup time: Less than 5 minutes
✅ Feature availability: This article discusses Access Management features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
ℹ️ Note: Looking for Trust Center features? The same Salesforce connection also powers Trust Center capabilities like auto-approving access requests and revenue tracking. For those features, see Connecting Trust Centers & Salesforce <https://help.vanta.com/en/articles/11345449-connecting-trust-centers-salesforce> and Salesforce Integration Permissions: Trust Center <https://help.vanta.com/en/articles/16862970-salesforce-integration-permissions-trust-center>.
 
 

## Use cases
Vanta connects to Salesforce using OAuth and syncs user account data on a recurring basis. This integration powers the following workflows in Vanta:
- 
Automated compliance tests - Vanta continuously checks that Salesforce accounts are linked to active personnel records and that accounts belonging to terminated personnel are deactivated. These tests reduce the manual effort of verifying offboarding and provide results that can be used as compliance evidence.
- 
Access Reviews - Synced Salesforce users appear in Vanta's Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews> workflow, so reviewers can confirm access is still appropriate and generate audit-ready evidence without leaving Vanta.
- 
Automated Deprovisioning - When an employee is offboarded in Vanta, their Salesforce user account can be deactivated directly from Vanta without requiring manual action in Salesforce. This is opt-in and must be enabled on the connection. For a full walkthrough of the offboarding workflow, see Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.
 

### Capabilities
The Salesforce integration supports the following resources and workflows within Vanta:
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>
 | 
Access Deprovisioning | 
✅ | 
Deactivate users directly from Vanta during offboarding (opt-in)
 | 
Roles and entitlements (profiles, permission sets, permission set groups)  | 
✅ | 
Entitlement context in Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews> 
 | 
Last login | 
✅ | 
Account activity context in Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews> 
ℹ️ Note: Role, entitlement, and last login data depends on your Salesforce configuration and the permissions of the connected Salesforce user. If these fields aren't populating, see Troubleshooting.
A note on what deprovisioning does: Vanta deactivates Salesforce users; it never deletes them. Salesforce does not support user deletion at all, so deactivation is the platform's only removal mechanism, and it is fully reversible. Deactivating a user preserves their identity, record ownership, history, profile, role, and permission sets. A Salesforce admin can reactivate the user at any time.
 
 

## Prerequisites
Before connecting the Salesforce integration, confirm you have the following:
- 
A Vanta administrator account
- 
Your Salesforce instance URL (the URL you use to access Salesforce, for example https://your-instance.salesforce.com)
- 
A Salesforce edition with API access (Enterprise, Unlimited, and Developer editions include it; Professional requires the API access add-on)
- 
A Salesforce account with the Approve Uninstalled Connected Apps permission, required to authorize the OAuth app
- 
To use automated deprovisioning: a connecting Salesforce account with the Manage Internal Users permission (typically held by System Administrators), which Salesforce requires to deactivate users
💡 Tip: The integration's access is determined by the Salesforce user who authorizes the connection. To limit access, connect with a dedicated service user. Note that a service user with restricted permissions can support the read-only workflows but cannot perform deprovisioning unless it holds Manage Internal Users.
 
 

## Setup guide
- 
In Vanta, go to the Integrations page, click Add integration, and search for Salesforce. For help navigating the Integrations page, see this guide <https://help.vanta.com/en/articles/11345761-integrations-page>. 
- 
Click on the integration tile, and then click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665341606/0ebcd138122e7252597a4f8bf02a/b3915de8-c86d-40ca-a32c-683511b384d0?expires=1794967200&signature=f7a8526c01dbe714c73f116ab8ea10158c1a80ee3b12930fc25b62186bc862d3&req=diYhE8p6nIdfX%2FMW1HO4zbiq9AQx7J0x7vW9A5ZVnhMvh6WyiSVYJods3z%2FP%0ALuB16hUkkp%2FPv%2BCMLoI%3D%0A>
- 
In the connection modal, enter Your instance URL (for example, https://your-instance.salesforce.com). This is the URL you use to access your Salesforce instance.
- 
Review the note about Salesforce permissions: to approve the OAuth app, Salesforce requires that the connected account have the Approve Uninstalled Connected Apps permission enabled.
- 
If you want Vanta to deactivate Salesforce users during employee offboarding, select Enable Vanta to automatically deprovision ("Vanta will deprovision accounts as personnel are offboarded"). This setting is optional and controls whether Vanta uses its deactivation capability; it does not change the permissions Salesforce asks you to approve in the next step.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665389005/6b2ff941d747e8eed6d4f4938533/image.png?expires=1794967200&signature=091db713831208d23a7afe335e40d2d90ea1798bc366f24212d2493f25e28950&req=diYhE8p2lIFfXPMW1HO4zZFMx6LEVCKRVgSNDx1D0xMws1zfQgmzPcLR6Zh5%0ArGZpCeKPFyA4NvNJhho%3D%0A>
- 
You will be redirected to Salesforce's authorization page. Log in with the Salesforce account you want to connect.
- 
Review the access Vanta is requesting and click Allow.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665345071/7bb17b5fea71258615568d5d4ae0/c393503f-3a60-4977-96e9-f36a1c5944b9?expires=1794967200&signature=1258c595e05a64f975d5f7c5d90319747cb25107c46c4c289d9a2cad3b18c327&req=diYhE8p6mIFYWPMW1HO4zS8B1MPoKPWJ%2BAQuHTKCwz6TBJ%2BSxk63ZtuSXNK3%0ALS27OisnarSO1a04tQg%3D%0A>
- 
After authorization, you are directed back to Vanta and the connection is active.
 

### What Vanta is asking to access
The consent screen lists the access Vanta requests. This list is the same whether or not you enabled the deprovisioning option:
- 
Access the identity URL service - Standard OAuth identity information used to establish the connection.
- 
Access Connect REST API resources - Supports Vanta's Salesforce API access.
- 
Manage user data via APIs - Lets Vanta read user account details (profile, role, active status) for compliance tests and access reviews. If you enabled automated deprovisioning, this same access is what allows Vanta to deactivate users during offboarding. Vanta makes no other changes to your Salesforce data.
- 
Perform requests at any time - Lets Vanta refresh its connection so syncs continue without you re-authorizing.
 
 

## About the security warning on Salesforce's authorization page
When you authorize the connection, Salesforce displays its standard consent screen ("Allow Access?"), which includes a Security Warning banner. This banner is expected, and it does not mean Salesforce has identified phishing or a security issue with Vanta's integration.
 
As described in Salesforce's release notes <https://help.salesforce.com/s/articleView?id=release-notes.rn_security_connected_app_oauth_approval_page.htm&release=256&type=5>, Salesforce adds this warning to the OAuth app approval page whenever a third-party app (a connected app or external client app) requests authorization. It is a standard anti-phishing safeguard, introduced to protect organizations from social engineering campaigns in which attackers persuade users, by phone or email, to authorize malicious apps. That is why the banner's guidance is to stop if someone contacted you and instructed you to connect an app.
 
Connecting Vanta yourself from the Integrations page in your Vanta account, as described in this guide, is a self-initiated connection, and you can proceed by clicking Allow. 
 
As always, if you have questions about authorizing third-party apps, we recommend checking with your IT or security team in line with your organization's app approval process.
 
 

## Verification and validation
Vanta begins syncing immediately after the connection completes, so Salesforce accounts should appear in Vanta shortly after connecting, and then sync on a recurring basis. Navigate to the Access page or the relevant Access Review in Vanta to confirm accounts are populating.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665362264/dea89c9fbac46ec62d2f9c43f3c6/image.png?expires=1794967200&signature=57fb2329257de7994a07c4ebf14455cb8201677e76133af65cf21dd6677b7c3f&req=diYhE8p4n4NZXfMW1HO4zQpmmS41Yvb1sUuYsLowUwoyF012LGc0kqzyRN6U%0AlKgtcLDNvvcBfeOJk7U%3D%0A>
 
 
 

## Permissions

### Read access
Vanta reads user account details, including profile, role, and active status, through the Salesforce REST API. This data powers automated compliance tests and access reviews. Unless automated deprovisioning is enabled, Vanta makes no changes in Salesforce.
 

### Write access
When automated deprovisioning is enabled, Vanta can deactivate Salesforce user accounts, only during employee offboarding. Vanta never deletes users or Salesforce data, and deactivation is reversible by a Salesforce admin.
 
Vanta will not deactivate the Salesforce user who authorized the integration connection, because deactivating that user would break the connection. To deprovision that person, first reconnect Salesforce with a different admin.
 
 

## Enabling deprovisioning on an existing connection
If Salesforce is already connected and you want to enable automated deprovisioning:
- 
In Vanta, go to the Integrations page, open the Salesforce connection, and click Edit.
- 
Edit the connection, select Enable Vanta to automatically deprovision, and complete the reconnection through Salesforce's authorization flow. The setting takes effect once reauthorization completes.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665366404/5d33e23725dc34f132110b4f0886/5e965e81-1d03-4ef7-a8a1-78248058f749?expires=1794967200&signature=4e884f78fe80b9dceefc421c509dac8694574e059c53164516b0a4c8adbe573e&req=diYhE8p4m4VfXfMW1HO4zdo6KkPKne78D46dnKJyhKv9eILfDG1bfcN9qjt5%0ADdKqFfhA8HzYvJ0s3gA%3D%0A>
ℹ️ Note: For long-standing connections that were created before Vanta's Salesforce integration requested full API access may not include the required api scope. If Vanta reports "Deprovisioning requires the Salesforce api scope. Reconnect the integration to grant the required scope," reconnect through the steps above; the standard flow grants the required access.
 
 

## Troubleshooting and FAQ
Deprovisioning results, including any errors below, appear in the offboarding task view where each account's deprovisioning attempt is shown.
 

### What Salesforce permissions does the Vanta integration need?
To connect, the Salesforce account you authorize with needs the Approve Uninstalled Connected Apps permission, and your Salesforce edition must include API access (see Prerequisites). Once connected, the integration inherits the access of the user who authorized it, so for the workflows in this article (compliance tests, access reviews, and deprovisioning), a user who can view users, plus Manage Internal Users if you're enabling deprovisioning, is sufficient.
 
If you're also using Trust Center features (auto-approval, tag-based access, revenue tracking, lead or task creation), those require additional object and field permissions, documented in Salesforce Integration Permissions: Trust Center <https://help.vanta.com/en/articles/16862970-salesforce-integration-permissions-trust-center>.
 

### What can Vanta see or change in Salesforce?
The integration can access what the connected Salesforce user can access, which is why we recommend connecting with a scoped service user. For the access management workflows in this article, Vanta reads user account details (profile, role, active status) and makes no changes in Salesforce, with one exception: if you enable automated deprovisioning, Vanta can deactivate user accounts during employee offboarding. Vanta never deletes users or Salesforce data. Trust Center features can additionally create leads and tasks if you've configured them; see Connecting Trust Centers & Salesforce <https://help.vanta.com/en/articles/11345449-connecting-trust-centers-salesforce>.
 

### Connection fails with an OAuth or instance URL error
Issue: The connection fails before completing, with an OAuth error or a problem at the instance URL step.
 
Work through these checks in order:
- 
Instance URL: Enter your base Salesforce URL (for example, https://your-instance.salesforce.com <https://your-instance.salesforce.com>), not a Setup page, Lightning page, or login URL.
- 
Logged-in account: Salesforce authorizes whichever account is currently logged in. If you intended to connect a service user, log out of Salesforce first or use a private browsing window, then reconnect.
- 
API access: Confirm your Salesforce edition includes API access (Professional requires the add-on; Essentials does not support it).
- 
App approval permission: Confirm the authorizing account has the Approve Uninstalled Connected Apps permission.
- 
Revoked or expired token: If the connection previously worked, a Salesforce admin may have revoked Vanta's access. Reconnect the integration to re-authorize.

### Vanta reports accounts need deprovisioning, but they're already deactivated in Salesforce
Issue: A compliance test or offboarding task flags Salesforce accounts for terminated personnel, but those accounts are already inactive in Salesforce.
- 
Vanta syncs Salesforce account data on a recurring basis, so accounts deactivated recently in Salesforce may not be reflected until the next sync completes.
- 
Confirm the account is fully deactivated in Salesforce (its status shows inactive), not only frozen or with its license removed.
- 
If the discrepancy persists after a sync cycle, contact Vanta Support.
 

### Role, entitlement, or last login data isn't appearing
Issue: Salesforce accounts sync into Vanta, but role/entitlement details or last login are missing.
- 
This data depends on the connected Salesforce user's access. Confirm the connected user can view user, profile, and permission set information in Salesforce, and that your org allows this data to be read through the API.
- 
If the connected user's permissions were recently expanded, reconnect the integration and allow a sync cycle to complete.
 

### The security warning banner on the authorization page
Issue: You or a teammate saw the Security Warning banner while connecting and are unsure whether to proceed.
- 
This is Salesforce's standard, platform-wide anti-phishing safeguard, shown for every third-party app during OAuth authorization. See About the security warning above.
- 
If you initiated the connection yourself from Vanta's Integrations page, it is safe to proceed.

### Deprovisioning is not enabled
Issue: "Deprovisioning is not enabled for this Salesforce integration. A System Admin must enable deprovisioning for the connection before users can be deprovisioned through Vanta."
- 
Enable the deprovisioning option by reconnecting the integration. See Enabling deprovisioning on an existing connection.

### Missing API scope
Issue: "Deprovisioning requires the Salesforce api scope. Reconnect the integration to grant the required scope."
- 
The connection predates Vanta's current Salesforce permissions. Reconnect the integration through the standard flow, which grants the required access.

### Cannot deprovision the connecting user
Issue: "This user connected the Salesforce integration; deactivating them would break the connection. Reconnect Salesforce with a different admin before deprovisioning this user."
- 
Reconnect the Salesforce integration using a different Salesforce admin account, then retry the deprovisioning task.

### Cannot deactivate the last Salesforce administrator
Issue: "Salesforce requires at least one active administrator. Assign the administrator profile to another active user in Salesforce, then try again."
- 
Assign the System Administrator profile to another active user in Salesforce, then retry the deprovisioning task.

### Cannot deactivate Salesforce system user
Issue: "Salesforce does not allow this user to be deactivated. Platform-managed users, such as the Integration User and the Automated Process user, are protected by Salesforce."
- 
This is a Salesforce platform restriction, not a Vanta error. Platform-managed users cannot be deactivated by any integration. Mark the account as a service account in Vanta if it shouldn't be part of offboarding.

### Insufficient Salesforce permissions
Issue: "The connected Salesforce user does not have permission to deactivate users. Reconnect the integration with a user that has the Manage Internal Users permission. If this account is a Salesforce platform user (such as the Platform Integration User), Salesforce does not allow it to be deactivated."
- 
Confirm the Salesforce account that authorized the connection holds the Manage Internal Users permission, then reconnect if its permissions have changed.

### Reconnect Salesforce
Issue: "Your Salesforce connection has expired or is no longer valid. Reconnect the integration and try again."
- 
Reconnect the Salesforce integration in Vanta using an account with the permissions listed in Prerequisites.

### Unable to deactivate Salesforce user
Issue: "Salesforce rejected the deactivation request. The user may be protected by your Salesforce org's configuration."
- 
Check the user in Salesforce Setup for org-specific protections (for example, platform-managed or specially configured users), and deactivate manually in Salesforce if needed.

### Rate limited
Issue: "We're temporarily unable to process this request because Salesforce is rate limiting our requests. Please try again in a few minutes."
- 
Salesforce's API request limits for your org were reached. Wait a few minutes and retry.

### Salesforce is temporarily unavailable
Issue: "We couldn't complete this action because Salesforce is currently unavailable. Please try again later."
- 
This is a temporary issue on Salesforce's side. Wait a few minutes and try again.

### User not found in Salesforce
Issue: "We couldn't find this user in Salesforce, so no changes were made."
- 
The user no longer exists or was already removed in Salesforce. This is informational; no action is needed.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-salesforce-access--01.png
- [image 02] ../../images/integrations/salesforce/connecting-vanta-salesforce-access--02.png
- [image 03] ../../images/integrations/salesforce/connecting-vanta-salesforce-access--03.png
- [image 04] ../../images/ux/access/connecting-vanta-salesforce-access--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-salesforce-access--05.png

# Before You Connect: Integration Prerequisites Checklist

Source: https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist
Collection: Integrations ; Integrations › Getting Started with Integrations
Fetched: 2026-11-17

## Article text

Who this article is for: Anyone about to connect a new integration in Vanta for the first time, or reconnecting an integration after an error.
 
This checklist covers the most common prerequisites across many Vanta integrations. Completing it before you start helps prevent common connection failures and reduces troubleshooting time.
⚠️ Note: This checklist is a general starting point. You should still follow the specific integration guide <https://help.vanta.com/en/collections/18953524-integrations-by-type> for the integration you’re connecting, since exact permissions, setup steps, and requirements vary by provider.
 

## ✅ Number 1: Confirm you’re the right person to connect
Most integrations require admin-level access in the third-party tool, not just in Vanta. In many cases, an admin is needed to authorize the connection, approve the requested permissions, or grant the scopes Vanta needs. Even when the integration is read-only, the person completing setup may still need elevated permissions in the third-party tool. That’s because the provider may require an admin to approve the connection or install the app before Vanta can read the data it needs. If the connecting user does not have the right permissions, the integration may fail during setup or connect with incomplete data.
- 
Confirm you have a Vanta role with integration management permissions (Settings > Access > User permissions). Admin and Editor roles have this by default. If your organization uses custom roles, check with your Vanta admin whether your role includes integration management permissions. 
- 
Confirm you hold the required admin role in the tool you're connecting (for example: Super Admin in Google Workspace, Org Owner in GitHub, Super Administrator in Okta).
- 
If you don't have the required access, ask an admin with those permissions to complete the connection.
 

## ✅ Number 2: Use your company’s organizational account, not a personal consumer account
Vanta connects to organizational tenants, workspaces, and accounts not personal accounts. Vanta reads organizational data like user directories, roles, repositories, and policies, which are only accessible at the organization or tenant level. 
- 
Confirm the account you're using is associated with your company's organizational instance of the tool.
- 
Personal accounts (such as a personal GitHub account, personal Gmail, or personal Atlassian account) will not work.
 

## ✅ Number 3: Confirm you’re connecting the correct organization, tenant, site, or instance 
Many integrations must be connected at the correct organizational level in the third-party tool. Connecting the wrong scope (such as an individual project, sub-account, workspace, or personal site) can cause setup failures or incomplete data in Vanta. This is different from using a personal account. Even if you are using a company account, you may still be in the wrong scope.
- 
Confirm you are connecting the correct organization, tenant, site, or org-level instance for your company.
- 
Check whether the integration must be connected at the organization or tenant level, rather than a project, repo, workspace, or sub-account.
- 
If your company has multiple environments or instances, confirm with your team which one should be connected to Vanta first.
 

## ✅ Number 4: Use a shared or service account when possible, not an individual’s account
Typically, the account that completes the connection becomes the authenticated identity for the integration. If that person later leaves the company, loses admin access, or their credentials change, the integration may need to be reconnected.
- 
If possible, use a shared admin or service account tied to a monitored identity rather than an individual employee's personal account.
- 
If your team uses temporary elevated access, confirm whether that could affect the connection later.
⚠️ Note for Enterprise teams: Discuss with your IT or Security team before connecting whether a dedicated service account should be created for Vanta integrations. This is especially important for integrations that sync high-frequency data (IdPs, cloud providers).
 

## ✅ Number 5: Check for network or firewall restrictions
If your organization uses IP allowlists, private networking, or VPN-based access controls, Vanta's IP address may need to be added to your allowlist before connecting. If Vanta’s IP is not on your allowlist, the connection may fail even if your credentials are correct. This is a common cause of “Bad credentials” errors when using on-premise or enterprise versions of tools. 
- 
Check with your IT or network team whether the tool you're connecting has IP-based access restrictions.
- 
For integrations that require IP allowlisting, Vanta's IP address or CIDR range is displayed during the relevant step in the connection flow. If the integration guide mentions an IP allowlist, look for the IP in the setup wizard. If you don't see it, check the specific integration guide or contact Vanta Support.
 

## ✅ Number 6: Verify your license includes the features that Vanta needs
Some features Vanta reads, such as vulnerability data, background check status, or advanced device management, require specific license tiers, products, or add-ons in the third-party tool. An integration may connect successfully even when those features are not enabled. When that happens, Vanta may sync only partial data or show no data for certain tests.
- 
Review what Vanta will read from this integration (see the specific integration guide <https://help.vanta.com/en/collections/18953524-integrations-by-type>).
- 
Confirm your plan with the third-party vendor includes those capabilities.
- 
Enable any required modules or features in the third-party tool before connecting (for example, Dependabot in GitHub if you want vulnerability tracking).
- 
If the integration offers multiple products or data types during setup, select only the ones your team actually uses and has enabled.
 

## ✅ Number 7: Clean up previous authorization before reconnecting 
If you're reconnecting an integration that was previously set up, for example after a credential issue, a team change, or a workspace migration, check whether a previous Vanta app install, OAuth grant, or API credential is still active in the third-party tool. Old authorizations can sometimes interfere with a clean reconnect. 
- 
Do not delete or uninstall and recreate the integration unless the specific guide or Vanta Support instructs you to do so.
- 
Check whether a previous version of the Vanta app, OAuth connection, or API key is still active in the third-party tool.
- 
Remove or revoke any old authorization in the third-party tool if the specific integration guide tells you to do so.
- 
From the integration's detail page, look for options to edit or update your credentials. The exact steps vary by integration. 
If reconnect fails unexpectedly, try again in an incognito or private window, or after clearing your browser cache and cookies. You may also need to wait 10-20 minutes after reconnecting, then check the Integrations page to confirm the error has cleared.
 
 

## ✅ Number 8: Decide on scoping before you connect
Many integrations give you the option to sync all users, or only a subset (for example, by group, department, or assignment). Changing scoping after connection can cause users to appear or disappear from your program unexpectedly. 
- 
Decide whether Vanta should track all users or only a specific group.
- 
If using group-based scoping, create and name the relevant group in the third-party tool before starting setup.
- 
Think through which items should be excluded from scope, such as service accounts, shared inboxes, sandbox workspaces, non-production projects, or development environments.
- 
Understand that scoping decisions affect which users appear in Vanta and which compliance tests are evaluated.
 

## ✅ Number 9: Have your credentials or authorization method ready 
Before you click Connect, understand what authentication Vanta uses for this integration:
 | 
Auth type | 
What you'll need
 | 
OAuth | 
Ability to log in as the admin account during setup
 | 
API key | 
Key generated in the third-party tool's admin settings
 | 
Service account | 
Service account credentials, scopes granted
Check the specific integration guide <https://help.vanta.com/en/collections/18953524-integrations-by-type> to confirm which method is used and have it ready before you begin.
 
 

## Notes for specific environments
🏛️ Note for Vanta Government customers: GCC High variants of integrations (such as Entra ID GCC High, Intune GCC High, or Defender for Endpoint for US Government) are only available in the Vanta Gov environment. Standard versions of these tools are available in the commercial environment. Additionally, not all commercial integrations are available in Vanta Gov. 
 
💼 Note for Enterprise customers: Before connecting any integration, we recommend aligning with your IT and Security teams on the right service account, any IP allowlist updates, and scoping decisions. Enterprise integrations often involve multiple stakeholders, and coordinating this before setup helps prevent delays.
 
Next steps: Find your specific integration in the Integrations Library <https://help.vanta.com/en/collections/12575285-integrations> and follow the guide for detailed, tool-specific instructions.

## Images

- none

# Enabling SCIM in Vanta

Source: https://help.vanta.com/en/articles/11345647-enabling-scim-in-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses SCIM, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. 
 
SCIM lets you manage Vanta login access directly from your identity provider (IdP). When SCIM is enabled, your IdP controls who has a Vanta account and what role they're assigned—provisioning, deprovisioning, and updating roles for user accounts automatically as your team changes.
 
⚙️ User permissions: Only Admins can manage user provisioning or SCIM. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Improvements to SCIM experience
SCIM works alongside your other integrations rather than replacing them. Your IdP and HRIS integrations continue to manage your People page roster and employment data independently of SCIM. This means you can use SCIM to control Vanta account provisioning while still using a separate IdP or HRIS to keep your People page in sync.
 
SCIM now manages Vanta user accounts only. Previously, enabling SCIM forced you to choose between SCIM or your IdP integrations as the source for your People page. Now both work together—SCIM handles access control, and your IdP integrations handle compliance monitoring.
 | 
Legacy experience | 
New experience
 | 
SCIM manages provisioning for both user accounts and personnel records | 
SCIM manages provisioning for user accounts only
 | 
SCIM populates the People page instead of your connected IdP integrations | 
Your connected IdP integrations populate the People page, independently from SCIM
 | 
Removing someone from SCIM deprovisions their personnel record and their user account | 
Removing someone from SCIM only deprovisions their user account, personnel records are unaffected
 | 
You must connect an IdP before completing SCIM setup | 
You set up SCIM independently of connecting IdPs
ℹ️ Note: We recently launched improvements to SCIM—this article has been updated to reflect the new experience. As of August 3, 2026 all customers have been migrated to the new experience.
 
 

## SCIM capabilities
- 
Push new users: Users assigned to the SCIM app in the identity provider are automatically created in Vanta.
- 
Push user updates: Supported identity provider updates are sent to Vanta for SCIM-managed users.
- 
Push user deactivation: Removing app assignment or deactivating an account in the identity provider deactivates the user in Vanta.
- 
Push user reactivation: Restoring identity provider assignment or status can reactivate the user in Vanta.
- 
Team management: IdP groups can be mapped to Vanta teams—SCIM automatically creates, updates, and removes teams and keeps team membership in sync as your IdP groups change.
- 
SCIM-synced values: First name, last name, primary email address, and RBAC role.
​
 

## Supported IdPs
Vanta's SCIM provisioning works through WorkOS, which acts as a middle layer. IdP integrations that support SCIM provisioning. See these guides for integration-specific information on SCIM:
- 
Azure <https://help.vanta.com/en/articles/11345646-azure-scim-attribute-instructions>
- 
Google Workspace <https://help.vanta.com/en/articles/13232005-connecting-vanta-google-workspace-scim>
- 
JumpCloud <https://help.vanta.com/en/articles/11345644-jumpcloud-scim-attribute-instructions>
- 
Okta <https://help.vanta.com/en/articles/11345645-okta-scim-attribute-instructions>
​
 

## Enabling SCIM
When SCIM is enabled as your user provisioning setting <https://help.vanta.com/en/articles/11345385-managing-user-roles#h_0794b77c5b>, it becomes the source of truth for automated user management in Vanta. SCIM-owned fields should be updated in the identity provider rather than in Vanta. The personnel records on your People page are managed by the IdP integrations enabled as sources in the Setup tab of your Personnel settings.
 
To enable SCIM:
- 
Go to Settings > Login and Security > Login methods.
- 
From the User provisioning section, enable provisioning via SCIM. 
- 
Complete the SCIM connection in the Admin Portal, which connects your IdP to Vanta through WorkOS.
- 
Once connected, you can monitor sync status and manage role mappings from the SCIM section.
​
⚠️ Note: If you already have user accounts in Vanta when you enable SCIM, unmatched users become manually managed. Users that match accounts in the SCIM app become SCIM-managed after setup. Any users not managed through SCIM must have their Vanta access updated manually.
 
 

## Configuring SCIM for users
Configuring SCIM for user management in Vanta <https://help.vanta.com/en/articles/11345385-managing-user-roles>:
- 
SCIM can control privileged RBAC roles from the identity provider instead of requiring manual role updates in Vanta.
- 
When SCIM is enabled, the User Provisioning section on the Login and Security page includes a Roles tab in addition to the Status tab.
- 
Use the Roles tab to find the role IDs that need to be passed through SCIM.
- 
Use the Status tab to confirm whether users are being provisioned successfully.
​
 

## Configuring SCIM for teams
For SCIM-provisioned team management in Vanta <https://help.vanta.com/en/articles/11345578-creating-teams-in-vanta>, go to Settings > Team. Synced teams appear with the IdP shown as the source.
- 
SCIM must be enabled for user provisioning before it can manage teams.
- 
Team members must have the Collaborator role or a higher privileged role.
- 
SCIM can manage team membership from synced identity-provider groups instead of manual updates in Vanta.
- 
SCIM-provisioned teams appear on the teams list with the identity provider shown as the source.
​
ℹ️ Note: SCIM must be enabled for user provisioning before team management can be used, and all synced team members must have the Collaborator role or higher. If synced teams do not appear in Vanta, confirm the SCIM configuration in your IdP and verify that the groups were pushed successfully.
 
 

## Troubleshooting

### Which SCIM app should I use?
 
Use the app or configuration path indicated by the WorkOS setup guide. For Okta, use a custom SCIM app until the Vanta OIN app supports SCIM. For Azure, SCIM can be added to an existing SAML app if one is already configured.
 

### What happens to existing users when I enable SCIM?
 
Existing users remain in Vanta. Users not matched through the SCIM app become manually managed. Matched users become SCIM-managed and follow SCIM-based deactivation and reactivation behavior.
 

### Which fields can I edit for SCIM-managed users?
 
SCIM-managed fields (including RBAC role, user name, and primary email address) must be changed in the identity provider. Other Vanta-managed fields remain editable in Vanta.
 

### What happens when I remove or deactivate a user in my IdP?
 
The SCIM-managed user is deprovisioned in Vanta. If you later reprovision them, Vanta reactivates the existing user. If Vanta cannot determine a unique match, it may create a new user instead.
 

### Which fields can I edit for SCIM-managed teams?
 
Team name and membership cannot be edited in Vanta, and the team cannot be deleted in Vanta. Notification settings, description, and team admins remain editable in Vanta.
 

### What happens if I disable SCIM and then re-enable it?
 
Users and teams that were SCIM-managed become manual in Vanta. When SCIM is re-enabled, Vanta can match manual users back to SCIM-managed users, but manual teams remain manual and newly synced teams are created separately.
 

### Why aren't IdP changes showing up in Vanta?
 
Go to Settings > Login and security > User provisioning and check for errors. If no errors appear, open the Admin Portal to confirm whether the user synced to WorkOS. If they did, resync users to Vanta. If not, check your IdP for errors.
 

### How do I validate that privileged users and roles are set up correctly?
 
Go to Settings > User permissions to review privileged users and their assigned roles.
 

### What should I do if Vanta reports duplicate email addresses?
 
If Vanta reports multiple users with the same email address, review the related duplicate-email guidance linked from the source article.

## Images

- none

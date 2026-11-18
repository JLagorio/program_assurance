# Google Workspace: Quickstart

Source: https://help.vanta.com/en/articles/14977549-google-workspace-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.
Connect Google Workspace to Vanta so that user accounts, MFA enrollment, and offboarding activity your team manages in Google Workspace automatically power your compliance tests — no manual evidence uploads required.
 
What you’ll do (~10 minutes) 
- 
Open the Google Workspace integration in Vanta and choose which features to enable (~2 min)
- 
Authorize Vanta using your Google Workspace super admin account (~4 min)
- 
Choose whether to sync your whole directory or only specific employees (~1 min)
- 
Confirm the connection and verify data is syncing (~3 min)
 
 

## Before you begin
Confirm all of the following before starting:
- 
You are using a Google Workspace organizational edition (Business, Enterprise, Education, or Nonprofits). Personal Gmail accounts and non-workspace Google accounts are not supported. 
- 
You are a Google Workspace super administrator in the domain you want to connect.
- 
You have Vanta admin access.
💡 Tip: Use a stable admin account (ideally a shared service account) that will retain super admin status long-term. If the connecting account is deactivated or loses super admin privileges, the integration will disconnect and must be reconnected. 
- 
Your domain does not have admin policies that block third-party OAuth access or Vanta's OAuth application has been allow-listed in your Google Workspace admin console.
- 
You've decided whether to enable vendor discovery ("Discover apps used with Google sign-in"), which surfaces the third-party apps your users have authorized as vendors in Vanta. Enabling it adds one permission to the connection; declining it keeps the connection fully read-only.
 
 

## Setup guide
Follow these steps to connect the integration. 
 
Step 1: Go to the Integrations page and search for Google Workspace. Click on the integration card. Then click Connect.
Step 2: On the Select features step, check Discover apps used with Google sign-in if you want Vanta to surface the third-party apps your users have authorized as vendors. Click Save.
Step 3: Click Connect. Vanta redirects you to Google's OAuth consent screen. Sign in with your Google Workspace super administrator account.
Step 4: Review the permissions Vanta is requesting and click Allow. You'll see three read-only directory permissions, plus a fourth if you enabled vendor discovery.
Step 5: On the Set sync filters step, leave Sync only specific employees unchecked to sync your entire directory, or check it to import only members of a Google Workspace group named exactly Vanta (create and populate that group first). Click Save.
⚠️ Note: If the sync filter is enabled and the designated group is missing or empty when Vanta syncs, the integration will disconnect. Make sure the group is populated before finishing setup.
Step 6: Google Workspace is now connected. Vanta opens the integration's management page, where you can watch the initial sync progress.
 
For screenshots and more in-depth setup guidance, including permission details and sync filter options, see the Google Workspace: Integration Guide <https://help.vanta.com/en/articles/14977969-google-workspace-integration-guide>.
 
 
 

## Verify your connection
- 
After setup, Vanta opens the integration's listing page, where you can see how many resources have synced and confirm the initial sync is progressing. 
- 
Allow up to one hour for the initial sync to complete before checking. 
- 
Google Workspace should be listed under the Connected tab on your Vanta Integrations page.
- 
Users from your Google Workspace domain will appear in the People section in Vanta after completing the initial sync.
- 
Compliance tests powered by Google Workspace data will appear under Tests in Vanta.
 
 

## Troubleshooting

### The connection failed after I approved the Google consent screen
- 
Likely cause: The Google account used to connect is not a super administrator, or your domain's OAuth access policies are blocking the connection.
- 
Fix: Confirm your account holds super admin status by logging in to admin.google.com. If domain policies are restricting third-party OAuth apps, you will need to trust Vanta's application in Google Admin before reconnecting. See the Integration Guide for full resolution steps, including Vanta's OAuth Client IDs.
 

### I see a 400: admin_policy_enforced error
- 
Likely cause: Your Google Workspace domain has a policy that restricts third-party OAuth access, and Vanta has not been marked as a trusted application.
- 
Fix: In Google Admin, go to Security > Access and data control > API Controls > Manage Third Party App Access, add Vanta's OAuth Client IDs, and mark them as Trusted. See the Integration Guide for the specific Client IDs and step-by-step instructions.
 

### Users are missing from Vanta after the initial sync
- 
Likely cause: The sync filter may be enabled, limiting which users Vanta tracks. Users outside the designated group will not appear.
- 
Fix: Check whether the sync filter is enabled in your Vanta integration settings. If it is, confirm the expected users are members of the designated Google Workspace group.
 

### A terminated employee is still showing in Vanta after I removed them in Google Workspace
- 
Likely cause: Removing a user in Google Workspace does not instantly remove them from Vanta — syncs run on a periodic cadence. Additionally, removing the account in Google Workspace alone is not sufficient to complete offboarding in Vanta.
⚠️ Note:  Do not delete the Google Workspace account before completing offboarding in Vanta. If you delete the account in GWS, the user disappears from the directory sync entirely. Vanta can no longer detect a status change, and the Offboard button may become inaccessible. Always suspend first, complete offboarding in Vanta, then delete if needed.
- 
Fix: Suspend (do not delete) the user in Google Workspace. Wait for the next sync — Vanta will detect the suspension and transition the user to terminated status. Then go to People → select the user → click the Offboarding tab → complete offboarding in Vanta. Both steps are required. Until offboarding is completed in Vanta, the user will remain in your compliance scope.
⚠️ Note: Common actions that do NOT satisfy offboarding requirements:
- 
Resetting the user's password — The account remains active in GWS. Neither the GWS deprovisioning test nor the Vanta offboarding test will pass.
- 
Signing out all sessions / revoking OAuth tokens — Same issue. The account is still active, not suspended or deleted.
- 
Suspending in GWS but skipping the Vanta offboarding step — This satisfies the GWS deprovisioning test ("Google Workspace accounts deprovisioned when personnel leave"), but the "Offboarding completed for terminated personnel within SLA" test will still fail until you complete offboarding in Vanta.
 

### Third-party apps are not appearing in vendor management
- 
Likely cause: Vendor discovery was not enabled when the integration was connected.
- 
Fix: Edit the integration's features to enable Discover apps used with Google sign-in, then complete the Google authorization again so the additional permission can be granted.
 

### Changes I made in Google Admin Console aren't reflected in Vanta
- 
Likely cause: Changes to your Google Workspace admin settings (such as modifying admin roles, updating OAuth trust policies, or restructuring org units) are not automatically picked up by an existing Vanta connection.
- 
Fix: Reconnect the integration in Vanta to re-establish the OAuth grant with your updated settings. 
 
 

## Additional resources
For detailed configuration, data collection reference, advanced setup options (including the sync filter, multi-org connections, and service account setup), and full troubleshooting guidance, see the Google Workspace: Integration Guide <https://help.vanta.com/en/articles/14977969-google-workspace-integration-guide>.
 
For SCIM-based user provisioning from Google Workspace into Vanta, see Connecting Vanta & Google Workspace (SCIM) <https://help.vanta.com/en/articles/13232005-connecting-vanta-google-workspace-scim>.

## Images

- none

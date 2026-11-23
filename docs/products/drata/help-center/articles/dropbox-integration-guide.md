# Dropbox Integration Guide

Source: https://help.drata.com/en/articles/10594382-dropbox-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The Dropbox integration enables security and compliance teams to automate user access reviews. It connects Drata to Dropbox so your team can sync user and group access data and verify that access permissions are appropriate.

## Key Capabilities

- User access review data: Sync Dropbox users and groups
- Access governance support: Identify and review who has access to Dropbox
- Automated evidence collection: Maintain access review records for compliance

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- Admin privileges in your **Dropbox account**
- Access to the **Dropbox Developers App Console**
- Ability to create a **Dropbox application**
- Access to the following credentials:
   - **App Key (App ID)**
   - **App Secret**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| account_info.read | Allows Drata to retrieve Dropbox account information |
| team_info.read | Allows Drata to access team-level metadata |
| team_data.member | Allows Drata to retrieve team member information |
| members.read | Allows Drata to retrieve the list of team members |
| groups.read | Allows Drata to retrieve Dropbox group membership data |

## Step-by-Step Setup

### Step 1: Create a Dropbox App

1. Log in to the **Dropbox Developers App Console**.
2. Select **Create app**.
3. Under **Create a new app on the DBX Platform**, configure the following:
   - **Choose an API:** Select **Scoped access**
   - **Choose the type of access:** Select **Full Dropbox – Access to all files and folders in a user’s Dropbox**
   - **Name your app:** Enter a name for the integration
4. Select **Create app**.

Expected outcome: A new Dropbox application is created.

### Step 2: Retrieve the App Key and App Secret

1. Open your newly created Dropbox app.
2. Go to the **Settings** tab.
3. Scroll to **App Key** and **App Secret**.
4. Copy and securely store both values.

Expected outcome: You have the **App Key** and **App Secret** needed for authentication.

### Step 3: Configure OAuth Redirect URI

1. In your Dropbox app settings, scroll to **OAuth 2 → Redirect URIs**.
2. Add the following redirect URI:
   - ```
https://api.stackone.com/connect/oauth2/dropbox_iam/callback
      ```
3. Save the changes.

Expected outcome: Dropbox can redirect authentication responses back to Drata.

### Step 4: Configure App Permissions

1. Open the **Permissions** tab in your Dropbox app.
2. Enable the following permissions:
   - `account_info.read`
   - `team_info.read`
   - `team_data.member`
   - `members.read`
   - `groups.read`
3. Save the changes.

Expected outcome: The Dropbox app has the required scopes for retrieving user access data.

### Step 5: Connect Dropbox in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Dropbox** connection process.
4. Enter the following when prompted:
   - **App Key**
   - **App Secret**
5. Complete the authentication flow to authorize Dropbox.

Expected outcome:
 Dropbox is successfully connected and user access data begins syncing to Drata.

## Important Notes

- Important note: This integration is used for User Access Review and focuses on reviewing users and groups with access to Dropbox.
- Ensure all required permissions are enabled in the Dropbox app before connecting.
- If your organization uses a **Web Application Firewall (WAF)**, allow outbound access for the integration to connect successfully.
- The provided information does not specify the exact IP addresses required for WAF allowlisting.

## Related articles

- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Mixpanel Integration Guide](mixpanel-integration-guide.md)
- [Databricks Integration Guide (UAR)](databricks-integration-guide-uar.md)
- [Box Integration Guide](box-integration-guide.md)
- [Dropbox Sign Integration Guide](dropbox-sign-integration-guide.md)

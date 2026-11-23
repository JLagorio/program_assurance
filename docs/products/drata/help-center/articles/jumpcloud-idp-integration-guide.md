# JumpCloud IdP Integration Guide

Source: https://help.drata.com/en/articles/6994385-jumpcloud-idp-integration-guide
Collection: Connection Support › Identity (IdP) Guidance
Updated: 2026-09-28
Fetched: 2026-11-22

## Article text

The JumpCloud integration enables your security and compliance teams to sync personnel identities into Drata and provision user accounts. This connection is typically established early in the onboarding process to help automate access-related compliance controls and build your source of truth for identity in Drata.

## Key Capabilities

This integration enables the following functionality for visibility and compliance:

- **Automated personnel sync**: Continuously imports users and groups into Drata, populating the Personnel page with identity source-of-truth data.
- **Enables access-based controls**: Supports identity-related compliance tests (e.g., MFA enforcement, unique accounts).
- **Foundation for SSO**: Required to enable Single Sign-On (SSO) through JumpCloud.

This integration supports compliance monitoring tests like:

- **Test 86**: MFA on Identity Provider
- **Test 96**: Employees Have Unique Email Accounts

## Prerequisites & Data Access

- **JumpCloud Admin access**: You must be able to generate an API key.
- **Drata Role Required**: Admin, Workspace Manager, or DevOps Engineer. Access Reviewers can only view the connection page
- **Domain Matching**: If your organization uses multiple email domains and hasn’t enabled multi-domain sync, [contact Drata Support]() to activate this capability.

### Permissions & Required Fields

| Permission / Field | Why It’s Needed |
|---|---|
| API Key (read-only) | Retrieves personnel and group data from JumpCloud |
| Group ID (optional) | Allows limiting the sync to a specific group |

## Step-by-Step Setup

### Step 1: Generate Your JumpCloud API Key

1. Log in to your JumpCloud Admin Console.
2. Click your profile icon → **My API Key**.
3. Click **Generate New API Key** if you don’t have one.
4. Copy the generated key.

**Expected outcome**: You have your API key ready to authorize Drata’s connection.

### Step 2: Connect JumpCloud in Drata

1. In Drata, go to the **Connections** page.
2. Search for **JumpCloud**.
3. Start the connection process.
4. Paste your API key when prompted.

**Expected outcome**: Drata authenticates your API key and begins syncing personnel from JumpCloud. Initial sync may take up to one hour depending on your organization size.

### Step 3: Limit Sync Scope by Group

You can restrict which users sync into Drata by specifying a JumpCloud group.

1. Go to your JumpCloud IdP connection in Drata.
2. Select the **edit** icon next to **Setup details**.
3. Enter the exact name of the JumpCloud group you want to sync. You can find available groups at [JumpCloud Groups](https://console.jumpcloud.com/#/groups/user).
   - **Important notes**:
      - Ensure the group includes your Drata administrator.
      - Any users not included in group(s) will not be synced to Drata
      - If personnel are already synced via this connection, removing a user from the group(s) can move them to Former Employee status.
4. Save your changes.

**Expected outcome**: Drata limits personnel sync to the specified role.

## Next Steps

You may enable [Single Sign-On (SSO)](single-sign-on-connection.md) to allow personnel to log in to Drata using JumpCloud credentials.

## Related articles

- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [OneLogin Integration Guide](onelogin-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
- [Enterprise SCIM Integration Guide](enterprise-scim-integration-guide.md)

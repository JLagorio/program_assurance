# PingOne Integration Guide

Source: https://help.drata.com/en/articles/10478681-pingone-integration-guide
Collection: Connection Support › Identity (IdP) Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Connecting PingOne to Drata allows personnel to be synchronized into Drata and to provision accounts for each.

## Article text

Connect PingOne to Drata to synchronize personnel identities and provision user accounts. This integration supports personnel-based compliance monitoring from the start of your Drata implementation.

## Key Capabilities

- **Authentication metadata retrieval**: Retrieves identity-related user and group data
- **Control support**: Supports authentication and access-related compliance controls
- **Read-only visibility**: Provides insight into identity configurations without modification

## Prerequisites & Data Access

**Drata Roles**

- Required: Admin, Workspace Manager, or DevOps Engineer
- Access Reviewers can only view the Connections page

**PingOne Requirements**

- Admin access to PingOne
- Required values:
   - PingOne Environment ID
   - Client ID
   - Client Secret

**Domain Matching**

- If your organization uses multiple email domains, contact Drata's Support to have multi-domain syncing enabled.

**Other Notes**

- If your Drata tenant previously connected to PingOne using Enterprise SSO, both connections can be maintained
- Drata can monitor MFA enablement through this integration (Test 86)

## Permissions & Required Fields

| Field | Why it’s needed |
|---|---|
| PingOne domain | Used to identify and authorize the integration |
| Client ID | Used to authenticate Drata with PingOne |
| Client Secret | Used to authenticate Drata with PingOne |

## Step-by-Step Setup

### Step 1: Get your PingOne Environment ID

1. Log in to the **PingOne Admin Console**
2. Navigate to **Applications**
3. Click the **+ icon** to create a new application
4. Enter a name in the **Application Name** field
5. Under *Choose Application Type*, select **Worker**
6. Click **Save**
7. In the app banner, toggle the application to **Enabled**
8. Go to the **Configuration** tab
9. Copy the **Environment ID** and save it for later use

**Expected outcome:** You have the Environment ID required to configure the connection in Drata

### Step 2: Get your Client ID and Client Secret

1. In the PingOne application’s **Configuration** tab
2. Scroll to the **General** section and expand it
3. Copy the **Client ID** and **Client Secret**

**Expected outcome:** You have the credentials needed to authorize the PingOne connection in Drata

### Step 3: Connect PingOne in Drata

1. In Drata, go to the **Connections** page
2. Search for and select **PingOne** within your available connections
3. Start the connection process
4. Enter your:
   - **PingOne Environment ID**
   - **Client ID**
   - **Client Secret**
5. When prompted, enable the "Read all users" permission scope

**Expected outcome:** Drata begins syncing personnel from PingOne. This may take up to 1 hour depending on user volume

### Step 4: (Optional) Limit Personnel Scope by Group

1. Go to your PingOne connection in Drata.
2. Select the **edit** icon next to **Setup details**.
3. Enter the exact name of the SCIM role you want to sync.
4. Make sure your Drata administrator is a member of this role.

**Important:**

- Role names must be entered **exactly**. If the name doesn't match, Drata will default to syncing **all** users.
- Once corrected, any users outside the designated role will be marked as **Former Employee** in Drata.
- **Nested roles are not supported**. Only direct members of the specified role are synced.

**Expected outcome**: Drata limits personnel sync to the specified role.

## Next Steps

Optional: You can enable Single Sign-On (SSO) if you'd like your personnel to log in to Drata using PingOne. This is not required for personnel sync or test automation. Learn more at [Single Sign-On Connection](single-sign-on-connection.md).

## Related articles

- [Xero Integration Guide (UAR)](xero-integration-guide-uar.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)

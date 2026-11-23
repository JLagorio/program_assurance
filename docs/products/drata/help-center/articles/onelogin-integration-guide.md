# OneLogin Integration Guide

Source: https://help.drata.com/en/articles/6848987-onelogin-integration-guide
Collection: Connection Support › Identity (IdP) Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

Connect OneLogin to Drata to synchronize personnel and automate identity-based compliance monitoring.

## Key Capabilities

- **Authentication metadata retrieval**: Retrieves identity-related user and group data
- **Control support**: Supports authentication and access-related compliance controls
- **Read-only visibility**: Provides insight into identity configurations without modification

## Prerequisites & Data Access

**Required Drata Roles**

- Admin, Workspace Manager, or DevOps Engineer.
- Access Reviewers can only view the connection page

**OneLogin Requirements**

- Admin access to OneLogin
- You’ll need the following values:
   - OneLogin domain
   - Client ID
   - Client Secret

**Domain Matching**

If your organization uses multiple email domains, contact Drata's Support to have multi-domain syncing enabled.

**WebAuthn Limitation**

- OneLogin supports WebAuthn, but this factor is not exposed via OneLogin's API
- Users with WebAuthn as their only MFA factor will fail **Test 86: MFA on Identity Provider**

To pass Test 86:

- Upload MFA evidence manually in Drata, or
- Configure another supported MFA method in OneLogin

## Permissions & Required Fields

| Field | Why it’s needed |
|---|---|
| OneLogin domain | Required to scope the identity connection |
| Client ID | Used to authorize Drata with OneLogin API |
| Client Secret | Used to authorize Drata with OneLogin API |

## Step-by-Step Setup

### Step 1: Get Your OneLogin Domain

Your domain is visible in your OneLogin URL. For example, if you log in at `https://acme.onelogin.com`, your domain is `acme`.

**Expected outcome**: You have identified your OneLogin domain for use in Drata.

### Step 2: Create API Credentials in OneLogin

- Sign in to OneLogin
- Navigate to **Developers** > **API Credentials**
- Click **New Credentials**
- Enter a name and assign appropriate read-only permissions
- Copy the **Client ID** and **Client Secret**

**Expected outcome**: You have the credentials required to authorize Drata’s identity sync.

### Step 3: Connect OneLogin in Drata

- In Drata, go to the **Connections** page
- Search for **OneLogin** within your available connections.
- Start the connections process.
- Enter your:
   - OneLogin domain
   - Client ID
   - Client Secret
- You may be prompted to approve read-only access permissions

**Expected outcome**: Drata will initiate a personnel sync. Initial sync may take up to 1 hour for large organizations.

### Step 4: Limit Personnel Scope Using a OneLogin Group (Optional)

1. Go to your OneLogin connection in Drata.
2. Select the **edit** icon next to **Setup details**.
3. Enter the exact name of the group you want to sync. You can find groups at: `https://{yourdomain}.onelogin.com/groups`
4. Make sure the group includes the Drata administrator
5. Save and confirm your changes

**Important:**

- Role names must be entered **exactly**. If the name doesn't match, Drata will default to syncing **all** users.
- Once corrected, any users outside the designated role will be marked as **Former Employee** in Drata.
- **Nested roles are not supported**. Only direct members of the specified role are synced.

**Expected outcome**: Only members of the designated group will be synced.

## Next Steps

Optional: You can enable **Single Sign-On (SSO)** if you'd like personnel to log in to Drata using OneLogin. This is not required for personnel sync or test automation. Learn more at [Single Sign-On Connection](single-sign-on-connection.md).

## Related articles

- [Okta Integration Guide (Identity Management Provider)](okta-integration-guide-identity-management-provider.md)
- [JumpCloud IdP Integration Guide](jumpcloud-idp-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
- [Enterprise SCIM Integration Guide](enterprise-scim-integration-guide.md)

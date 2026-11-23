# CyberArk Integration Guide

Source: https://help.drata.com/en/articles/9572918-cyberark-integration-guide
Collection: Connection Support › Identity (IdP) Guidance
Updated: 2026-02-05
Fetched: 2026-11-22

## Article text

The CyberArk integration enables your security and compliance teams to synchronize personnel into Drata and provision user accounts.

This connection helps automate identity-related compliance controls and lays the foundation for enabling SSO (Single Sign-On) through CyberArk.

## Key Capabilities

- **Personnel sync**: Continuously imports users and groups into Drata, populating the Personnel page with identity source-of-truth data.
- **Control support**: Enables authentication-related compliance controls (e.g., MFA enforcement, unique email)
- **Foundational for SSO**: Single Sign-On (SSO) cannot be configured until an IdP is connected

This integration powers identity-based compliance tests like **Test 86: MFA on Identity Provider** and **Test 96: Employees have Unique Email Accounts**.

## Prerequisites & Data Access

- **CyberArk Admin access**: Ability to configure SCIM roles and create OAuth2 clients
- **Drata role requirement**: Admin, Workspace Manager, or DevOps Engineer. Access Reviewers can only view the Connections page
- **Email domain match**: If your organization uses multiple domains and hasn't enabled multi-domain sync, contact our support team to activate this capability

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Tenant URL | Used to establish secure access to your CyberArk instance |
| OAuth App ID | Used to construct the authorization endpoint |
| Client ID / Secret | Authenticates Drata to retrieve user identity data |

## Step-by-Step Setup

### Step 1: Get Your CyberArk Tenant URL

1. Log in to your CyberArk portal
2. Copy the full URL used to access the portal. This is your **Tenant URL**

**Expected outcome**: You have the base URL required to connect your instance to Drata.

### Step 2: Create the SCIM Client Role

1. In the Admin Portal, go to **Core Services → Roles**
2. Click **Add Role**, name it `SCIM Client`, and save
3. Under **Administrative Rights**, add `User Management`.
   - Do not select Read Only User Management

**Expected outcome**: This role will be used in the next step to grant the OAuth client permission to sync users.

### Step 3: Register an OAuth2 Client

1. Navigate to Apps & Widgets → Web Apps.
2. Click Add Web Apps.
3. Under the Custom tab, select **OAuth2 Client**.
4. Click Yes to confirm.
5. On the Settings page, set the Application ID to a value you choose (example: `scim_oauth_client`).
6. On the Tokens page:
   1. Token Type: JwtRS256
   2. Auth Methods: Client Creds
   3. Access token lifetime: 5 hours
7. On the Scope page, add and create:
   1. Name: SCIMAPIScope
   2. Allowed REST APIs: scim
8. On the Permissions page, add the SCIM Client role from the previous section.
9. Ensure Run permission is checked.
10. Click Save.

**Expected outcome**: The Application ID you created (example: scim_oauth_client) must be entered into Drata during the connection process.

### Step 4: Create a Service User in CyberArk

1. Go to **Core Services → Users**
2. Create a new user
   - **Login name** becomes your **Client ID**
   - **Password** becomes your **Client Secret**
3. Enable the option: **Is OAuth Confidential Client**
4. Return to the `SCIM Client` role and add this new user under Members

**Expected outcome**: The Client ID and Secret you created (example: scim_oauth_client) must be entered into Drata during the connection process.

### Step 5: Connect CyberArk in Drata

1. Navigate to the available connections on your Connections page
2. Search for **CyberArk** and start the connection process
3. Enter the following when prompted:
   - **Tenant URL**
   - **OAuth Application ID**
   - **Client ID**
   - **Client Secret**

**Expected outcome**: Personnel begin syncing into Drata from CyberArk. Initial sync may take up to 1 hour.

### Step 6: Limit Sync to a Specific CyberArk Role (Optional)

You can scope the sync to a specific SCIM role in CyberArk:

1. Go to your CyberArk connection in Drata.
2. Select the **edit** icon next to **Setup details**.
3. Enter the exact name of the SCIM role you want to sync.
4. Make sure your Drata administrator is a member of this role.

**Important:**

- Role names must be entered **exactly**. If the name doesn't match, Drata will default to syncing **all** users.
- Once corrected, any users outside the designated role will be marked as **Former Employee** in Drata.
- **Nested roles are not supported**. Only direct members of the specified role are synced.

**Expected outcome**: Drata limits personnel sync to the specified role.

## Important Notes

### Test 86: MFA on Identity Provider Limitations

- The CyberArk API does not expose WebAuthn factors. Users using WebAuthn will **fail Test 86: MFA on Identity Provider** unless:
   - You upload MFA evidence manually in Drata, or
   - You assign an alternative supported MFA method

## Related articles

- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [OneLogin Integration Guide](onelogin-integration-guide.md)
- [JumpCloud IdP Integration Guide](jumpcloud-idp-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
- [Enterprise SCIM Integration Guide](enterprise-scim-integration-guide.md)

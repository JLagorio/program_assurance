# Webex Integration Guide

Source: https://help.drata.com/en/articles/9300823-webex-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Webex to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Webex integration** enables security and compliance teams to monitor user access and roles within Webex. By syncing user data from Webex, Drata helps organizations review who has access to the platform and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Webex user account data into Drata
- **Role Visibility:** Monitor user roles and access within your Webex organization
- **Compliance Monitoring:** Maintain visibility into system access for audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Webex Access Requirements

- You must have **Admin access** in your **Webex organization**.
- You must retrieve your **Webex Organization ID**.
- You must create a **Webex integration** to generate a **Client ID** and **Client Secret**.
- The integration must include the required **OAuth redirect URL** and **scope**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Scope | Why It’s Needed |
|---|---|
| identity:people_read | Allows Drata to retrieve user account information from Webex |
| Client ID | Identifies the Webex integration used for authentication |
| Client Secret | Authenticates the Webex integration |
| Organization ID | Identifies the Webex organization being connected |

---

## Step-by-Step Setup

### Step 1: Retrieve Your Webex Organization ID

1. Log in to your **Webex account**.
2. Navigate to your **Account page**.
3. Open the **Info** tab.
4. Locate and copy your **Organization ID**.

Expected outcome:
You have copied your **Webex Organization ID** required for the integration.

---

### Step 2: Create a Webex Integration

1. Log in to your **Webex developer portal**.
2. Create a new **integration** for your Webex organization.
3. Configure the integration with the following settings:
   - **Redirect URL**
   ```
https://api.stackone.com/connect/oauth2/webex_iam/callback
   ```
   - **Scopes**
   ```
identity:people_read
   ```
4. Ensure the integration **does not use the mobile SDK**.
5. Create the integration.

Expected outcome:
 A Webex integration is created with the required redirect URL and permissions.

---

### Step 3: Retrieve OAuth Credentials

1. After creating the integration, copy the following credentials:
   - **Client ID**
   - **Client Secret**
2. Store these values securely.

Expected outcome:
You have retrieved the **Client ID** and **Client Secret** required to connect Webex to Drata.

---

### Step 4: Connect Webex in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Webex connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**
- **Organization ID**
- **Application Scope:** `identity:people_read`

Expected outcome:
 Webex is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Webex integration uses **OAuth credentials**.
- **Required scope:** The integration requires the **identity:people_read** scope to retrieve user data.
- **Enterprise plan requirement:** The **Roles API resource** is only available with a **Webex Enterprise plan**.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

---

## External resources

[Using Webex Service Apps](https://developer.webex.com/docs/service-apps)

[Webex for developers](https://developer.webex.com/)

## Related articles

- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

# Box Integration Guide

Source: https://help.drata.com/en/articles/10594278-box-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Box to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Box integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user and group data directly from Box. This helps organizations review who has access to Box resources and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Box users and groups to support access review workflows
- **Access Governance:** Monitor which users and groups have access to Box resources
- **Compliance Monitoring:** Maintain visibility into system access to support security and audit requirements

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Box Access Requirements

- You must have **Admin privileges** in your **Box account**.
- **2-Step Verification** must be enabled in your **Box account settings**.
- You must create a **Box OAuth application** to generate a **Client ID** and **Client Secret**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Scope | Why It’s Needed |
|---|---|
| Read all files and folders stored in Box | Allows Drata to review accessible content and associated users |
| Manage users | Allows Drata to retrieve user account information |
| Manage groups | Allows Drata to retrieve group membership information |
| Client ID | Identifies the OAuth application used for authentication |
| Client Secret | Authenticates the Box OAuth application |

---

## Step-by-Step Setup

### Step 1: Create a Box OAuth Application

1. Log in to your **Box account**.
2. Navigate to the **Developer Console**.
3. Open the **My Platform Apps** page.
4. Select **Create Platform App**.
5. Choose **Custom App** as the application type.
6. Enter the required application details:
   - **App Name**
   - **Purpose:** Select **Automation**
7. Select **User Authentication (OAuth 2.0)** as the authentication method.
8. Select **Create App**.

Expected outcome:
A new Box application is created and ready for configuration.

---

### Step 2: Retrieve OAuth Credentials

1. Scroll to the **OAuth 2.0 Credentials** section.
2. Copy the **Client ID** and store it securely.
3. Select **Fetch Client Secret**.
4. Enter your **2-Step Verification code** if prompted.
5. Copy the **Client Secret** and store it securely.

Expected outcome:
You have retrieved the **Client ID** and **Client Secret** required for the integration.

---

### Step 3: Configure OAuth Settings

1. Scroll to the **OAuth 2.0 Redirect URIs** section.
2. Add the following redirect URI: `https://api.stackone.com/connect/oauth2/box_iam/callback`
3. Scroll to the **Application Scopes** section.
4. Select the following scopes:
   - **Read all files and folders stored in Box**
   - **Manage users**
   - **Manage groups**
5. Save your changes.

Expected outcome:
The OAuth application is configured with the required redirect URI and permissions.

---

### Step 4: Connect Box in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Box connection process**.
4. Enter the following information when prompted:
   - **Client ID**
   - **Client Secret**

Expected outcome:
Box is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Box integration uses **OAuth 2.0 application credentials**.
- **Security requirement:** Box requires **2-Step Verification** to retrieve OAuth credentials.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.
- **Security best practice:** Store OAuth credentials securely and rotate them according to your organization’s security policies.

---

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)

# RingCentral Integration Guide

Source: https://help.drata.com/en/articles/9774278-ringcentral-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect RingCentral to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **RingCentral integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account data directly from RingCentral. This integration helps reduce manual review work and ensures access review workflows use accurate and up-to-date user information.

---

## Key Capabilities

- **User Access Review Data Sync:** Import RingCentral user account data into Drata
- **Access Governance:** Support periodic access reviews to validate appropriate user permissions
- **Compliance Evidence Collection:** Maintain visibility into system access for audits and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

Before connecting RingCentral to Drata, ensure the following requirements are met:

- **RingCentral Developers account:** You must have a **RingCentral Developers account** with **Developer Admin privileges**.
   - If you do not have an account, you can register here:
      [https://developers.ringcentral.com/sign-up](https://developers.ringcentral.com/sign-up)
- **RingCentral application:** You must create a **RingCentral application** to generate the **Client ID** and **Client Secret** required for authentication.

**Required Drata Role with Write access**

- Admin
- Workspace Managers
- DevOps Engineer

**Drata Access Reviewers**

Access Reviewers can view the connection page but cannot modify connection settings.

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Read Accounts | Allows Drata to retrieve RingCentral user account data for access reviews |

---

## Step-by-Step Setup

### Step 1: Create a RingCentral Application

1. Log in to **RingCentral Developers**.
2. Select **Console**.
3. In the left navigation, open **Apps**.
4. Select **Register App**.
5. Choose **REST API App (most common)** as the application type.

Expected outcome:
You begin creating a new RingCentral application that will be used for the Drata integration.

---

### Step 2: Configure Application Settings

When creating the application, configure the following properties:

**App Properties**

- **App Name:** Enter a name for the application.
- **App Description:** Enter a description for the application.
- **Primary Contact:** Enter the email address of the primary support contact.
- **Promote this app in the RingCentral App Gallery:** Select **No**.

**Authentication Settings**

- **OAuth Flow:** Select **3-legged OAuth flow authorization code**.
- **App Type:** Select **Server-side web app (most common)**.
- **OAuth Redirect URI:**
   `https://api.stackone.com/connect/oauth2/ringcentral_iam/callback`
- **Issue Refresh Tokens:** Select **Yes**.

Expected outcome:
The application is configured with the required authentication settings.

---

### Step 3: Configure Security Settings

Within the application configuration:

1. Set **Application Scopes** to **Read Accounts**.
2. Under **Authorized Users**, select:
   **This app is private and will only be callable using credentials from the same RingCentral account.**

Expected outcome:
The application has the required permissions to allow Drata to retrieve user data.

---

### Step 4: Retrieve API Credentials

1. After creating the application, navigate to the **Production Credentials** section.
2. Copy the following values:
   - **Client ID**
   - **Client Secret**
3. Store these credentials securely.

Expected outcome:
You have the **Client ID** and **Client Secret** required to connect RingCentral to Drata.

---

### Step 5: Connect RingCentral in Drata

Log in to **Drata** → go to the **Connections** page.

Navigate to your **Available Connections**.

Search for and start the **RingCentral connection process**.

When prompted, enter the following credentials:

- **Client ID**
- **Client Secret**

Expected outcome:
RingCentral is successfully connected and user account data begins syncing to Drata.

---

## Important Notes

- **Application credentials:** The RingCentral connection uses the **Client ID and Client Secret** generated from the RingCentral Developers application.
- **Security best practice:** Store your credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

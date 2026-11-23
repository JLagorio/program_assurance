# Smartsheet Integration Guide

Source: https://help.drata.com/en/articles/9972027-smartsheet-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Smartsheet to Drata. This connection supports the following types: Access Reviews (UAR).

## Article text

The **Smartsheet integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Smartsheet. This helps organizations review who has access to Smartsheet and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Smartsheet user access data into Drata
- **Access Governance:** Monitor which users have access to your Smartsheet environment
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Smartsheet Access Requirements

- You must have **Administrator privileges** in your **Smartsheet account**.
- Your organization must have a **Smartsheet Business plan or higher**.
- You must create a **Smartsheet OAuth application** using Smartsheet Developer Tools.

Note: Creating an OAuth application requires a **Smartsheet Developer account**. If you do not have one, you can register at: [https://developers.smartsheet.com/register/](https://developers.smartsheet.com/register/)

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| Client ID | Identifies the Smartsheet OAuth application used for authentication |
| Client Secret | Authenticates the Smartsheet OAuth application |

---

## Step-by-Step Setup

### Step 1: Create a Smartsheet OAuth Application

1. Log in to your **Smartsheet account**.
2. Select your **profile icon** in the bottom-left corner.
3. Select **Developer Tools**.
4. In the Developer Tools page, select **Create New App**.
5. Enter the following application details:
   - **App name**
   - **Description**
   - **URL** – You can use your organization’s homepage URL
   - **App contact/support** – Enter your email address
   - **App redirect URL**
   ```
https://api.stackone.com/connect/oauth2/smartsheet_iam/callback
   ```
6. Leave **Publish App** blank.
7. Select **Save**.

Expected outcome:
 A Smartsheet OAuth application is created.

---

### Step 2: Retrieve Application Credentials

After saving the application, Smartsheet will display the application credentials.

Copy and securely store the following values:

- **Client ID (App client id)**
- **Client Secret (App secret)**

Expected outcome:
You have the **Client ID and Client Secret** required to authenticate the integration.

---

### Step 3: Connect Smartsheet in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Smartsheet connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**

Expected outcome:
 Smartsheet is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Smartsheet integration uses **OAuth application credentials**.
- **Developer account requirement:** Creating an OAuth application requires access to **Smartsheet Developer Tools**.
- **Security best practice:** Store OAuth credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)

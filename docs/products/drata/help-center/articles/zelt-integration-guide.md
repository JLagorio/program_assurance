# Zelt Integration Guide

Source: https://help.drata.com/en/articles/9300865-zelt-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect Zelt to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Zelt integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access and role information from Zelt. This helps organizations review which users have access to Zelt and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Zelt user accounts for access review workflows
- **Role Visibility:** Monitor user roles and access levels within Zelt
- **Compliance Monitoring:** Maintain auditable records of system access for security and compliance requirements

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Zelt Access Requirements

- You must have access to **Zelt Settings** with permission to create API credentials.
- You must generate the following credentials:
   - **Client ID**
   - **Client Secret**

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

**Access Reviewers** can view the connection page but cannot create or modify connections.

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Client ID | Identifies the integration application |
| Client Secret | Secures the authentication process |

---

## Step-by-Step Setup

### Step 1: Create Zelt API Credentials

1. Log in to your **Zelt account**.
2. Navigate to **Settings**.
3. Select **Security**.
4. Locate the **Developer Hub** section.
5. Select **Generate**.

Enter the following information when creating the API client:

- **Name:** Enter a name for the integration
- **Description:** Enter a description for the integration
- **Redirection URI:**
   `https://api.stackone.com/connect/oauth2/zelt_iam/callback`

After creating the client:

- Copy the **Client ID**
- Copy the **Client Secret**

Store these credentials securely.

Expected outcome:
 You have generated the **Client ID and Client Secret** required for the integration.

---

### Step 2: Connect Zelt in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Zelt connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**

Expected outcome:
 Zelt is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Zelt integration uses **OAuth client credentials**.
- **Credential security:** Store the **Client ID and Client Secret** securely according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

Drata has a [Zelt](https://zelt.app/). This integration monitors individual's access and roles within your platform for compliance purposes.

## Prerequisites

- Create a Client ID and Client secret. To create a client ID and secret, follow these steps.
   1. Within Zelt, go to **Settings**.
   2. On the Settings page, select **Security**.
   3. Next to the Developer **hub**, select the **Generate** button.
   4. Enter the following fields for the API Client.
      - **Name**: <Enter a name>
      - **Description**: <Enter a description>
      - **Redirection URI**: [https://api.stackone.com/connect/oauth2/zelt_iam/callback](https://api.stackone.com/connect/oauth2/zelt_iam/callback)
   5. Copy the client ID and client secret.
- If your organization uses a web application firewall (WAF), make sure you [allow the following IP addresses](https://help.drata.com/en/articles/10929029-waf-access-ip-allowlist-for-uar-connections) to ensure successful connection.

## Enable Zelt

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for **Zelt** and select **Connect**.
3. On the drawer, you can connect to Zelt.
4. In the next steps, enter Client ID and Client secret.

A check mark with a success message indicates a successful connection.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

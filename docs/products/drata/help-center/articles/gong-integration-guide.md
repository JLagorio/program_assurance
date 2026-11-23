# Gong Integration Guide

Source: https://help.drata.com/en/articles/9788444-gong-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Gong to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Gong integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account data directly from Gong. This helps organizations review who has access to Gong and monitor assigned roles to support compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Gong user accounts for access review workflows
- **Workspace Visibility:** Monitor users associated with your Gong workspace
- **Compliance Monitoring:** Maintain visibility into system access for audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Gong Access Requirements

- You must have **Business Admin privileges** in your **Gong account**.
- You must obtain the following API credentials from Gong:
   - **Access Key**
   - **Access Key Secret**
   - **API Base URL**
   - **Workspace ID**

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission | Why It’s Needed |
|---|---|
| Access Key | Authenticates the Gong API integration |
| Access Key Secret | Secures the API authentication process |
| API Base URL | Identifies the Gong API endpoint for your environment |
| Workspace ID | Identifies the Gong workspace being connected |

---

## Step-by-Step Setup

### Step 1: Retrieve Your Gong API Credentials

1. Log in to your **Gong account**.
2. Navigate to **Company Settings**.
3. Under the **Ecosystem** section, select **API**.
4. Scroll to the **API Keys** section.

From this page, copy the following values:

- **API Base URL**
- **Access Key**
- **Access Key Secret**

If an API key does not exist, select **Get API Key** to generate one.

Expected outcome:
You have copied the **Access Key**, **Access Key Secret**, and **API Base URL** required for the integration.

---

### Step 2: Retrieve Your Workspace ID

Your **Workspace ID** can be found in the URL of the Gong API settings page.

Example:

```
https://my-domain.app.gong.io/company/api-authentication?workspace-id=123
```

From this example:

- **Workspace ID **→ 123

Expected outcome:
 You have identified the **Workspace ID** required for the connection.

---

### Step 3: Connect Gong in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Gong connection process**.
4. Enter the following information when prompted:
   - **Access Key**
   - **Access Key Secret**
   - **Workspace ID**
   - **API Base URL**

Expected outcome:
 Gong is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Gong integration uses **API keys** and workspace identification.
- **Credential security:** Store API credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)

# Dialpad Integration Guide

Source: https://help.drata.com/en/articles/9774311-dialpad-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Dialpad to Drata. This connection supports the following types: User Access Reviews (UAR)

## Article text

The **Dialpad integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Dialpad. This helps organizations review who has access to Dialpad and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Dialpad user access data into Drata
- **Access Governance:** Monitor which users have access to your Dialpad organization
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Dialpad Access Requirements

- You must have **Company Admin privileges** in your **Dialpad account**.
- You must generate a **Dialpad API key**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| API Key | Allows Drata to authenticate and retrieve user access data from Dialpad |

---

## Step-by-Step Setup

### Step 1: Generate a Dialpad API Key

1. Log in to your **Dialpad account**.
2. Select the **Settings** icon in the left-side navigation panel.
3. Ensure the dropdown menu in the navigation panel has **My Company** selected.
4. Under **Authentication**, select **API Keys**.
5. Select **Add Key**.
6. Enter a name for the API key.
7. Set an **expiration date** and save the key.
8. Copy the generated **API key** and store it securely.

Expected outcome:
You have generated a **Dialpad API key** required to authenticate the integration.

---

### Step 2: Connect Dialpad in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Dialpad connection process**.
4. Enter the **Dialpad API key** when prompted.

Expected outcome:
Dialpad is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Dialpad integration uses an **API key**.
- **Token expiration:** API keys may have an expiration date. Ensure the key is renewed before expiration to prevent connection interruptions.
- **Security best practice:** Store API keys securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)

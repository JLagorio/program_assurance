# Fivetran Integration Guide

Source: https://help.drata.com/en/articles/9773743-fivetran-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how to connect Fivetran to Drata. This connection supports the following types: Access Reviews (UAR).

## Article text

The **Fivetran integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Fivetran. This helps organizations review who has access to Fivetran and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Fivetran user access data into Drata
- **Access Governance:** Monitor which users have access to your Fivetran environment
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Fivetran Access Requirements

- You must have **Admin privileges** in your **Fivetran account**.
- You must generate **Fivetran API credentials**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| API Key | Identifies the Fivetran API credentials used for authentication |
| API Secret | Authenticates the Fivetran API credentials and allows Drata to retrieve user access data |

---

## Step-by-Step Setup

### Step 1: Generate Fivetran API Credentials

1. Log in to your **Fivetran account**.
2. In the left navigation menu, expand your **account settings**.
3. Select **API Key**.
4. Generate a new **API key**.
5. Copy the following credentials and store them securely:
   - **API Key**
   - **API Secret**

Expected outcome:
You have generated the **API Key** and **API Secret** required to authenticate the integration.

---

### Step 2: Connect Fivetran in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Fivetran connection process**.
4. Enter the following information when prompted:

- **API Key**
- **API Secret**

Expected outcome:
Fivetran is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Fivetran integration uses **API credentials (API Key and API Secret)**.
- **Security best practice:** Store API credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so that the connection can be established.

## Related articles

- [Zelt Integration Guide](zelt-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

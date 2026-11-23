# Kameleoon Integration Guide

Source: https://help.drata.com/en/articles/10706532-kameleoon-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Kameleoon to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Kameleoon integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Kameleoon. This helps organizations review who has access to Kameleoon and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Kameleoon user account data into Drata
- **Access Governance:** Monitor which users have access to your Kameleoon environment
- **Compliance Monitoring:** Maintain visibility into system access for audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Kameleoon Access Requirements

- You must have **Admin or Super Admin privileges** in your **Kameleoon account**.
- You must retrieve or generate **API credentials** from your Kameleoon profile.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| Client ID | Identifies the API credentials used to authenticate the integration |
| Client Secret | Authenticates the Kameleoon API credentials |

---

## Step-by-Step Setup

### Step 1: Retrieve or Generate Kameleoon API Credentials

1. Log in to your **Kameleoon account**.
2. Select your **profile icon** in the top-right corner.
3. Open **My Profile**.
4. Under your profile name, choose one of the following options:
   - **Generate new API credentials**, or
   - **See my API credentials** if they already exist.
5. Copy the **Client ID** and **Client Secret** and store them securely.

Expected outcome:
You have retrieved the **Client ID** and **Client Secret** required to connect Kameleoon to Drata.

---

### Step 2: Connect Kameleoon in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Kameleoon connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**

Expected outcome:
Kameleoon is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Kameleoon integration uses **API credentials (Client ID and Client Secret)**.
- **Security best practice:** Store API credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)

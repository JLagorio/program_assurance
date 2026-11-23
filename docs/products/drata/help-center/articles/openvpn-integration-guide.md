# OpenVPN Integration Guide

Source: https://help.drata.com/en/articles/9972197-openvpn-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect OpenVPN to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **OpenVPN integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from OpenVPN. This helps organizations review which users have access to OpenVPN and monitor account access for compliance and security governance.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve OpenVPN user accounts for access review workflows
- **VPN Access Visibility:** Monitor which users have access to your OpenVPN environment
- **Compliance Monitoring:** Maintain visibility into remote access systems for audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

Before connecting OpenVPN to Drata, ensure the following requirements are met.

### OpenVPN Access Requirements

- You must have **Administrator privileges** in your **OpenVPN account**.
- You must enable the **OpenVPN API**.
- You must generate **API credentials** and retrieve the following values:
   - **Client ID**
   - **Client Secret**
   - **Cloud ID (subdomain)**

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
| OpenVPN API access | Allows Drata to retrieve user account data |
| Client ID | Authenticates the OpenVPN API connection |
| Client Secret | Secures the authentication process |
| Cloud ID (subdomain) | Identifies the OpenVPN environment being connected |

---

## Step-by-Step Setup

### Step 1: Enable the OpenVPN API

1. Log in to your **OpenVPN account**.
2. In the left navigation menu, select **API & Logs**.
3. Select **API**.
4. Ensure **Enable API for the Cloud ID** is enabled.

Expected outcome:
The OpenVPN API is enabled for your environment.

---

### Step 2: Create OpenVPN API Credentials

1. On the **API** page, select **Create Credentials**.
2. Enter a **name** for the credentials.
3. Select the desired **lifetime (expiration period)**.
4. Create the credentials.

After creation:

- Copy the **Client ID**
- Copy the **Client Secret**

Important:
The **Client ID and Client Secret are only shown once**, so store them securely.

Expected outcome:
You have generated the **Client ID and Client Secret** required for the integration.

---

### Step 3: Retrieve Your Cloud ID

1. Locate your **Cloud ID** (also known as your **OpenVPN subdomain**).
2. Copy this value, as it will be required during the connection process.

Expected outcome:
You have copied the **OpenVPN Cloud ID** required for the integration.

---

### Step 4: Connect OpenVPN in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **OpenVPN connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**
- **Cloud ID**

Expected outcome:
OpenVPN is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The OpenVPN integration uses **API credentials**.
- **Credential expiration:** When the credential **lifetime expires**, new credentials must be created and updated in the Drata connection settings.
- **Credential visibility:** The **Client ID and Client Secret are displayed only once** when created.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

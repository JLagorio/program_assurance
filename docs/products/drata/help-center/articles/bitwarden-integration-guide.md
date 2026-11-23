# Bitwarden Integration Guide

Source: https://help.drata.com/en/articles/9300550-bitwarden-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Learn how to connect Bitwarden to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Bitwarden integration** enables security and compliance teams to monitor user access and roles within Bitwarden. By syncing user data from Bitwarden, Drata helps organizations review who has access to the platform and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Bitwarden user access data into Drata
- **Role Visibility:** Monitor user roles and permissions within your Bitwarden organization
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Bitwarden Access Requirements

- You must have an **Admin role** in your **Bitwarden organization**.
- You must generate a **Bitwarden Organization API key**.
- The API key must include the required scope.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Scope | Why It’s Needed |
|---|---|
| api.organization | Allows Drata to retrieve organization user access and role data from Bitwarden |
| Client ID | Identifies the Bitwarden API credentials used for authentication |
| Client Secret | Authenticates the Bitwarden API credentials |

---

## Step-by-Step Setup

### Step 1: Generate a Bitwarden Organization API Key

1. Log in to your **Bitwarden Admin Console**.
2. Navigate to the **API key management** section.
3. Generate a new **Organization API key**.
4. Ensure the API key includes the required scope: `api.organization`
5. Copy and securely store the following credentials:

- **Client ID**
- **Client Secret**

Expected outcome:
You have generated the **Client ID** and **Client Secret** required to authenticate the integration.

---

### Step 2: Connect Bitwarden in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Bitwarden connection process**.
4. Enter the following information when prompted:

- **Client ID**
- **Client Secret**

Expected outcome:
Bitwarden is successfully connected and user access data begins syncing to Drata.

---

## Troubleshooting

If an error occurs when connecting the integration:

- Verify that the **Client ID and Client Secret correspond to the correct API key**.
- Confirm the API key includes the **`api.organization` scope**.

---

## Important Notes

- **Authentication method:** The Bitwarden integration uses **API credentials generated from the Bitwarden Admin Console**.
- **Required scope:** The API key must include the **`api.organization`** permission.
- **Security best practice:** Store API credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Troubleshoot

If an error message is displayed after connecting, ensure that the client id and client secret correlate to the correct API key and that the API key has the scope `api.organization`.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)

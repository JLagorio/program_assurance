# Canva Integration Guide

Source: https://help.drata.com/en/articles/9300560-canva-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Canva to Drata. This connection supports the following types: Access Reviews (UAR)

## Article text

The **Canva integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Canva. This helps organizations monitor which users have access to Canva and verify roles and permissions for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Canva user account data into Drata
- **Access Governance:** Monitor which users have access to your Canva workspace
- **Role Visibility:** Review roles assigned to users within Canva

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Canva Access Requirements

- You must have the **Canva Teams plan**.
- You must have an **Administrator role** in your Canva organization.
- You must enable **SCIM user provisioning** and retrieve the **SCIM access token**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Scope | Why It’s Needed |
|---|---|
| SCIM User Provisioning | Allows Drata to retrieve user account and role information from Canva |
| SCIM Access Token | Authenticates the integration |

---

## Step-by-Step Setup

### Step 1: Configure SSO Settings in Canva

1. Log in to your **Canva account**.
2. Navigate to **Settings**.
3. From the side menu, select **SSO & provisioning**.

Under **Get info from your Identity Provider**, enter the following information if you do not already have an identity provider configured:

**SAML 2.0 Endpoint (HTTP)**

```
https://drata.com/idp/endpoint/HttpPost
```

**Identity Provider Issuer**

```
Drata
```

**x.509 Public Certificate**

```
MIICVjCCAb8CAg37MA0GCSqGSIb3DQEBBQUAMIGbMQswCQYDVQQGEwJKUDEOMAwGA1UECBMFVG9reW8xEDAOBgNVBAcTB0NodW8ta3UxETAPBgNVBAoTCEZyYW5rNEREMRgwFgYDVQQLEw9XZWJDZXJ0IFN1cHBvcnQxGDAWBgNVBAMTD0ZyYW5rNEREIFdlYiBDQTEjMCEGCSqGSIb3DQEJARYUc3VwcG9ydEBmcmFuazRkZC5jb20wHhcNMTIwODIyMDUyNzIzWhcNMTcwODIxMDUyNzIzWjBKMQswCQYDVQQGEwJKUDEOMAwGA1UECAwFVG9reW8xETAPBgNVBAoMCEZyYW5rNEREMRgwFgYDVQQDDA93d3cuZXhhbXBsZS5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAMYBBrx5PlP0WNI/ZdzD+6Pktmurn+F2kQYbtc7XQh8/LTBvCo+P6iZoLEmUA9e7EXLRxgU1CVqeAi7QcAn9MwBlc8ksFJHB0rtf9pmf8Oza9E0Bynlq/4/Kb1x+d+AyhL7oK9tQwB24uHOueHi1C/iVv8CSWKiYe6hzN1txYe8rAgMBAAEwDQYJKoZIhvcNAQEFBQADgYEAASPdjigJkXCqKWpnZ/Oc75EUcMi6HztaW8abUMlYXPIgkV2F7YanHOB7K4f7OOLjiz8DTPFfjC9UeuErhaA/zzWi8ewMTFZW/WshOrm3fNvcMrMLKtH534JKvcdMg6qIdjTFINIrevnAhf0cwULaebn+lMs8Pdl7y37+sfluVok=
```

Expected outcome:
 The SSO configuration is saved in Canva.

---

### Step 2: Enable SCIM User Provisioning

1. Scroll to **Enable external user provisioning (optional)**.
2. Enable **SCIM user provisioning**.
3. Copy the generated **SCIM access token**.

Expected outcome:
 You have generated the **SCIM access token** required for the integration.

---

### Step 3: Connect Canva in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Canva connection process**.
4. Enter the **SCIM access token** when prompted.

Expected outcome:
 Canva is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Canva integration uses **SCIM provisioning and an access token**.
- **Token security:** Store the SCIM access token securely and rotate it according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

---

## Troubleshooting

**Connection error during setup**

If an error occurs when connecting Canva to Drata:

- Verify the **SCIM access token** was copied correctly.
- Confirm that **SCIM user provisioning is enabled** in Canva.

---

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Klaviyo Integration Guide](klaviyo-integration-guide.md)
- [Tableau Integration Guide](tableau-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)

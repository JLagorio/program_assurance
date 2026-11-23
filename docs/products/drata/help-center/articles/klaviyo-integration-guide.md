# Klaviyo Integration Guide

Source: https://help.drata.com/en/articles/9300607-klaviyo-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Klaviyo to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Klaviyo integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account and role data directly from Klaviyo. This helps organizations monitor which users have access to Klaviyo and review assigned permissions for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Klaviyo user accounts for access review workflows
- **Role Visibility:** Monitor roles assigned to users within Klaviyo
- **Compliance Monitoring:** Maintain visibility into system access to support audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Klaviyo Access Requirements

- You must be an **Admin or Owner** in your **Klaviyo account**.
- Your organization must have a **paid Klaviyo plan**.
- You must enable **SCIM user provisioning** in Klaviyo.
- You must generate and copy the **SCIM API key**.

Important:
The SCIM key must include the **`Klaviyo-API-Key` prefix** when entered during the connection process.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Scope | Why It’s Needed |
|---|---|
| SCIM User Provisioning | Allows Drata to retrieve user account and role information |
| SCIM API Key | Authenticates the integration with Klaviyo |

---

## Step-by-Step Setup

### Step 1: Enable SCIM User Provisioning in Klaviyo

1. Log in to your **Klaviyo account**.
2. Navigate to the **SCIM user provisioning settings**.
3. Enable **SCIM user provisioning** for your organization.
4. Generate a **SCIM API key**.
5. Copy the key and store it securely.

Important:
When entering the key during the connection process, ensure the key includes the required prefix:

```
Klaviyo-API-Key
```

Expected outcome:
 You have generated the **SCIM API key** required for the integration.

---

### Step 2: Connect Klaviyo in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Klaviyo connection process**.
4. Enter the **SCIM API key** when prompted.

Expected outcome:
 Klaviyo is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Klaviyo integration uses **SCIM provisioning with an API key**.
- **Required prefix:** The SCIM key must include the **`Klaviyo-API-Key` prefix** when entered in Drata.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

---

## Troubleshooting

**Connection error during setup**

If you see the following error: *Could not connect account. Please check your credentials and try again.*

Verify that:

- The **SCIM API key** is correct.
- The key includes the **`Klaviyo-API-Key` prefix**.

## Related articles

- [Canva Integration Guide](canva-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)

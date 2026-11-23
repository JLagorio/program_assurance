# Attio Integration Guide

Source: https://help.drata.com/en/articles/9300539-attio-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-30
Fetched: 2026-11-22

## Article text

The **Attio** integration enables **security and compliance teams** to monitor individuals’ access and roles within your Attio platform for compliance purposes.

It connects Drata to **Attio** using an API key so your team can automatically track user management data and streamline access review processes.

## Key Capabilities

- **User Access Monitoring:** Syncs user and role data from Attio into Drata for continuous monitoring.
- **Access Review Automation:** Helps automate personnel access reviews across your Attio environment.

## Prerequisites & Data Access

- Ensure you have an [Admin role](https://attio.com/help/reference/workspace-settings-billing/manage-members-and-admins) in Attio.
- Must be able to **generate an API key** with the required scopes.
   - **Scope required:** For **User Management**, enable **read access**.
   - Refer to [Attio’s documentation]() to learn how to generate an API key and enable the necessary scopes.
- **Note:** Web Application Firewall (WAF) allowlisting is **not typically required** for this integration, as Drata connects securely over HTTPS.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| **User Management — read** | Allows Drata to retrieve user and role information for access review automation. | Usernames, roles, and access permissions |

## Step-by-Step Setup

### Step 1: Generate an API Key in Attio

1. Log in to your **Attio** account as an **Admin**.
2. Navigate to your **API Settings** page.
3. Generate a new **API key** with the following scope:
   - **User Management:** Read access
4. Copy the **access token** associated with the API key.
5. Store both credentials securely. You’ll need them to connect to Drata.

**Expected outcome:** You now have a valid Attio API key and access token with the required permissions.

### Step 2: Connect Inside Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Attio** and select **Connect**.
3. In the connection drawer, enter your **access token**.
4. Click **Connect** to complete the setup.
5. A checkmark and success message confirm that the connection was successful.

| **Drata Field** | **Attio Value** |
|---|---|
| Access Token | The access token associated with your Attio API key |

**Expected outcome:** Drata connects to Attio and begins syncing user and role data for compliance monitoring.

## External resources

[Attio - Setting up your first integration](https://developers.attio.com/docs/getting-started)

## Related articles

- [Ashby Integration Guide](ashby-integration-guide.md)
- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Freshsales Integration Guide (UAR)](freshsales-integration-guide-uar.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)

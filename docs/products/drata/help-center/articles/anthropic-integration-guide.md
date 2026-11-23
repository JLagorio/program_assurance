# Anthropic Integration Guide

Source: https://help.drata.com/en/articles/10595356-anthropic-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-30
Fetched: 2026-11-22

## Article text

The **Anthropic** integration enables **security and compliance teams** to automate user access reviews by syncing user data directly from Anthropic.

It connects Drata to your Anthropic organization through an **Admin API Key**, allowing you to maintain accurate and up-to-date employee access information while reducing manual review efforts.

## Key Capabilities

- **User Data Sync:** Automatically imports user and role data from Anthropic into Drata.
- **Access Review Automation:** Keeps access information current for compliance reporting.
- **Secure API Key Authentication:** Uses Anthropic’s Admin Key for controlled and secure access.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Admin privileges** within your **Anthropic organization**.
- Must be able to **create an Admin API Key** in Anthropic.
- If your organization uses a **Web Application Firewall (WAF)**, you must **allowlist Drata’s IP addresses** to ensure a successful connection.

## Step-by-Step Setup

### Step 1: Create an Anthropic Admin API Key

1. Log in to your **Anthropic account** at [https://console.anthropic.com/](https://console.anthropic.com/).
2. In the left navigation menu, select **Admin Keys**.
3. Click **Create Admin Key** to generate a new key.
4. Copy the displayed **Admin Key** and store it securely.
   - Anthropic Admin Keys have a prefix of `sk-ant-admin`.
5. Retain this key for the next step when connecting Anthropic to Drata.

**Expected outcome:** You now have a valid Anthropic Admin API Key ready for integration.

### Step 2: Complete the Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Anthropic** and select **Connect**.
3. Enter the following information:

| **Drata Field** | **Anthropic Value** |
|---|---|
| Admin API Key | Your Anthropic Admin API Key (prefix `sk-ant-admin`) |

**Expected outcome:** Drata connects successfully to Anthropic and begins syncing user data for access reviews.

For additional information, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)

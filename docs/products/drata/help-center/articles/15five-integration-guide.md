# 15Five Integration Guide

Source: https://help.drata.com/en/articles/9773995-15five-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-29
Fetched: 2026-11-22
Description: Connect 15Five to Drata with an API key to automate user access reviews.

## Article text

The **15Five** integration enables **security and compliance teams** to **automate user access reviews** by syncing user data directly from 15Five.
It connects Drata to 15Five via an API key, allowing your team to maintain accurate employee access records for compliance and identity management.

## Key Capabilities

- **User Data Sync:** Imports user account details from 15Five into Drata.
- **Access Review Automation:** Automatically keeps your access review data up to date.
- **API-Based Integration:** Uses a secure API key for lightweight configuration and maintenance.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Admin privileges** within your 15Five organization.
- Must have access to **create and manage API keys** in 15Five.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| user:read | Sync user data for access reviews | User names, emails, active/inactive status |
| organization:read | Validate organization and employee mapping | Basic org structure info |

## Step-by-Step Setup

### Step 1: Generate a 15Five API Key

1. Log in to your **[15five account](https://app.15five.com/account/login/)** with Admin credentials.
2. Navigate to the **Integrations** page.
3. Scroll down and enable the **Public API** if it is not already enabled.
4. Select **Create new key** to generate a new API key.
5. Enter a **name** for your API key and select **Save**.
6. Copy your **Access Token** and make note of the **expiration date**.
   - You will need this token to connect 15Five to Drata.
   - If your organization uses a **Web Application Firewall (WAF)**, you must **allowlist Drata’s IP addresses** to ensure successful connection.

**Expected outcome:** You should now have a valid API key (Access Token) ready to use for the Drata integration.

## Complete the Connection: 15Five

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **15Five Value** |
|---|---|
| API Key | Access Token generated in 15Five |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [HubSpot Integration Guide (UAR)](hubspot-integration-guide-uar.md)
- [Intercom Integration Guide](intercom-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)

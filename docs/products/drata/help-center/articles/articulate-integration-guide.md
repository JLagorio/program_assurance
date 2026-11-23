# Articulate Integration Guide

Source: https://help.drata.com/en/articles/9971410-articulate-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-30
Fetched: 2026-11-22

## Article text

The **Articulate** integration enables **security and compliance teams** to automate user access reviews by syncing user data. It connects Drata to your Articulate account through an **API key**, allowing your team to reduce manual work and ensure accurate access reporting for compliance.

## Key Capabilities

- **User Data Sync:** Imports user and access information from Articulate into Drata.
- **Access Review Automation:** Helps automate personnel and access control reviews.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Administrator privileges** within your **Articulate – Reach 360** account.
- Must be able to **create a new Articulate API Key** to connect to Drata.
- **Note:** Web Application Firewall (WAF) allowlisting is **not typically required** for this integration. Only add Drata IPs to an allowlist if your organization restricts outbound network connections.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed** |
|---|---|---|
| **API Key Access** | Authenticates Drata to sync user access data from Articulate. | User and role data (Read) |

## Step-by-Step Setup

### Step 1: Create an Articulate API Key

1. Log in to your **Articulate – Reach 360** account with an administrator user.
2. Navigate to your **API settings** (or equivalent section for API management).
3. Create a new **API Key**.
4. Copy and securely store the API key. You’ll need it to connect to Drata.

**Expected outcome:** You now have a valid Articulate API Key to use for integration with Drata.

### Step 2: Complete the Connection in Drata

1. In Drata, go to **Connections → Available Connections**.
2. Search for **Articulate** and select **Connect**.
3. In the connection drawer or popup modal, enter the following information:

| **Drata Field** | **Articulate Value** |
|---|---|
| API Key | The API Key you generated in Articulate |

## Related articles

- [Ashby Integration Guide](ashby-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)
- [Anthropic Integration Guide](anthropic-integration-guide.md)

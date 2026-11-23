# Ashby Integration Guide

Source: https://help.drata.com/en/articles/9300531-ashby-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-30
Fetched: 2026-11-22

## Article text

The **Ashby** integration enables **security and compliance teams** to monitor individual user access and roles within your Ashby platform for compliance purposes.

It connects Drata to Ashby through an **API key**, allowing Drata to automate access verification and evidence collection for compliance testing.

## Key Capabilities

- **User Access Monitoring:** Tracks individuals’ access and roles in Ashby for compliance.
- **Automated Evidence Collection:** Syncs user access information into Drata to streamline reviews.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Organization Administrator** privileges within your **Ashby account**.
- Must be able to **generate an API key** in Ashby.
   - API key must include **read permission** for the **Organization module**.
   - Refer to Ashby’s official documentation for details on setting up permissions and generating API keys.
- **Note:** Web Application Firewall (WAF) allowlisting is **not typically required** for this integration since Drata connects securely over HTTPS. Only allowlist Drata IPs if your organization enforces strict outbound network restrictions.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| **Organization module — read** | Allows Drata to retrieve user access and role information for compliance monitoring. | User roles and organizational access data |

## Step-by-Step Setup

### Step 1: Generate an API Key in Ashby

1. Log in to your **Ashby** account with an **Organization Administrator** role.
2. Navigate to **API Key Management** (refer to Ashby’s documentation for exact navigation).
3. Create a new **API key**.
4. Under **Endpoint Permissions**, select **read** permission for the **Organization module**.
5. Copy the generated **API key** and store it securely. You will need it when connecting to Drata.

**Expected outcome:** You now have a valid API key with the correct endpoint permissions to connect to Drata.

### Step 2: Complete the Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Ashby** and select **Connect**.
3. Enter the following information:

| **Drata Field** | **Ashby Value** |
|---|---|
| API Key | API key with read permission for the Organization module |

## Troubleshoot

If an error message is displayed after connecting, ensure that your API key has the correct endpoint permissions.

## External resources

[Ashby - Authentication](https://developers.ashbyhq.com/reference/authentication)

## Related articles

- [Teamtailor Integration Guide](teamtailor-integration-guide.md)
- [Attio Integration Guide](attio-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Salesloft Integration Guide](salesloft-integration-guide.md)
- [SendGrid Integration Guide](sendgrid-integration-guide.md)

# Aircall Integration Guide

Source: https://help.drata.com/en/articles/9967703-aircall-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-29
Fetched: 2026-11-22
Description: Connect Aircall to Drata with API credentials to automate user access reviews and reduce manual work.

## Article text

The **Aircall** integration enables **security and compliance teams** to **automate user access reviews** by syncing user data directly from Aircall.
It connects Drata to Aircall through API credentials, helping your team maintain accurate employee access information while reducing manual review effort.

## Key Capabilities

- **User Data Sync:** Automatically imports user account details from Aircall into Drata.
- **Access Review Automation:** Keeps your Drata user access data in sync with Aircall to simplify compliance.
- **API-Based Integration:** Connects using API credentials (API ID and Token) for secure, read-only access.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Admin or Owner privileges** in your Aircall account.
- Must have access to **generate new API credentials** in the Aircall Dashboard.
- If your organization uses a **Web Application Firewall (WAF)**, **allowlist Drata’s IP addresses** to ensure a successful connection.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| users:read | Sync Aircall user data to Drata | User names, emails, active/inactive status |
| teams:read | Map Aircall teams for role-based access review | Team names, members, and roles |

## Step-by-Step Setup

### Step 1: Create Aircall API Credentials

1. Log in to your **Aircall Dashboard** with **Admin or Owner** privileges.
2. In the left navigation menu, go to **Integrations & API**, then select the **API Keys** tab.
3. Select **Generate an API Key**.
4. In the window that appears, enter a **Key name** for your new API credentials.
5. Copy both the **API ID** and **API Token**. You will need these values to connect Aircall to Drata.
6. Select **Confirm** to finalize the credentials.

**Expected outcome:** You should now have a valid **API ID** and **API Token** ready to use for your Drata connection.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **Aircall Value** |
|---|---|
| API ID | Aircall API ID |
| API Token | Aircall API Token |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Intercom Integration Guide](intercom-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Sophos Integration Guide](sophos-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)

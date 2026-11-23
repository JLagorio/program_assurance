# Domo Integration Guide

Source: https://help.drata.com/en/articles/9769700-domo-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-14
Fetched: 2026-11-22

## Article text

Integrating Domo with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Domo.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin privileges in your **Domo** organization
- Access to the **Domo Developer Portal**
- Ability to create an OAuth client with **User** scope
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Client ID & Client Secret | Authenticate the connection via OAuth | User identity and access metadata |
| Application scope: User | Retrieve user access information | User names, emails, account status |

## Step-by-Step Setup

### Step 1: Create a Domo OAuth client

1. Log in to your **[Domo Developer Portal](https://developer.domo.com/)** as an Admin.
2. Go to the **[Manage Clients](https://developer.domo.com/manage-clients)** page.
3. Select **Create a client**.
4. Enter the client details:
   - **Application Scope:** Select **User**
5. Save the client.
6. Copy the **Client ID** and **Client Secret**.
7. Store both values securely.

**Expected outcome:**
You have created a Domo OAuth client.

### Step 2: Connect Domo inside Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Domo** and select **Connect**.
4. Enter:
   - **Client ID**
   - **Client Secret**
5. Save the connection.

**Expected outcome:**
Drata successfully connects to Domo.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [Xero Integration Guide (UAR)](xero-integration-guide-uar.md)
- [Webex Integration Guide](webex-integration-guide.md)
- [Databricks Integration Guide (UAR)](databricks-integration-guide-uar.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)

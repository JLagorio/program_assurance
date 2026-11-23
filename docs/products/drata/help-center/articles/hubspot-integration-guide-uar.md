# HubSpot Integration Guide (UAR)

Source: https://help.drata.com/en/articles/8987926-hubspot-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2026-07-23
Fetched: 2026-11-22
Description: User Access Review connection: Connect Hubspot to Drata to review the list of users with access to Hubspot in your organization.

## Article text

Connect HubSpot to Drata in order to review the list of users with access to HubSpot in your organization. Get ahead of any permissions issues and stay on top of your user access reviews.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin access to your HubSpot account
- Ability to generate or access a HubSpot Access token
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| **Permission / Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| HubSpot API key | Authenticates the connection | User identifiers and access metadata |

## Step-by-Step Setup

### Step 1: Create a HubSpot Private App

1. In HubSpot, go to **Settings → Integrations → Private Apps**.
2. Select **Create private app**.
3. Name the app (for example, *Drata User Access Review*).
4. Grant **read-only user access scopes** as required.
5. Create the app and copy the **access token**.

### Step 2: Connect HubSpot inside Drata

1. In Drata, go to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **HubSpot** or filter by **User Access Review**.
4. Select **Connect**.
5. Sign into your HubSpot
6. Save the connection.

**Expected outcome:** HubSpot is successfully connected and begins syncing user access data.

## Important Notes

- **Deactivated HubSpot users: **If a user is deactivated in HubSpot, their status may not automatically update in Drata. This is due to a limitation in HubSpot’s API.
- To ensure Drata detects removal of access, the user must be **deactivated and deleted** in HubSpot.

## Related articles

- [Snowflake Integration Guide](snowflake-integration-guide.md)
- [Miro Integration](miro-integration.md)
- [Segment Integration Guide](segment-integration-guide.md)
- [Sentry Integration Guide](sentry-integration-guide.md)
- [Xero Integration Guide (UAR)](xero-integration-guide-uar.md)

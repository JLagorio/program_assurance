# Harvest Integration Guide

Source: https://help.drata.com/en/articles/10595243-harvest-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-14
Fetched: 2026-11-22

## Article text

Integrating Harvest with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Harvest.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin privileges in your **Harvest** account
- Ability to generate a **Harvest personal access token**
- Access to your **Harvest Account ID**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Personal access token & Account ID | Authenticate the connection to Harvest | User identity and account metadata |

## Step-by-Step Setup

### Step 1: Create a Harvest personal access token

1. Log in to **[Harvest](https://id.getharvest.com/)** and select the Developers tab.
2. Under **Personal access tokens**, select **Create new personal access token**.
3. Enter a name for the token and select **Create personal access token**.
4. Under **Choose account**, ensure the correct account is selected.
5. Copy the **personal access token** and **Account ID**.

**Expected outcome:**
You have generated and copied a Harvest personal access token and Account ID.

### Step 2: Connect Harvest inside Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Harvest** and select **Connect**.
4. Enter:
   - **Personal access token**
   - **Account ID**
5. Save the connection.

**Expected outcome:**
Drata successfully connects to Harvest.

## Related articles

- [Greenhouse Integration Guide](greenhouse-integration-guide.md)
- [Recruitee Integration Guide](recruitee-integration-guide.md)
- [MeisterTask Integration Guide (UAR)](meistertask-integration-guide-uar.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [EasyLlama Integration Guide](easyllama-integration-guide.md)

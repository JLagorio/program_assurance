# Freshsales Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9300570-freshsales-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2025-12-10
Fetched: 2026-11-22

## Article text

Drata has a [Freshsales](https://www.freshworks.com/crm/sales/) integration. This integration monitors individual's access and roles within your platform for compliance purposes.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- You must have the **Organization Admin** role in Freshsales to generate API keys and access user/role information.
- **Correct API Key type required**
   - Freshsales provides multiple types of API keys used for different products.
   - **For Drata, you must use the API Key found under: CRM API Details**
   - Using a different key type (e.g., from Marketplace or Developer settings) will result in connection errors.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Freshsales API Token (from CRM API Details) | Authenticates Drata to Freshsales CRM APIs | User list, roles, and associated metadata |
| Freshsales Company Domain | Identifies your Freshsales instance for API communication | Tenant-level user and role data |

## Step-by-Step Setup

### Step 1: Locate Your API Token in Freshsales

1. Log in to your Freshsales account as a user with **Organization Admin** permissions.
2. Navigate to: **Personal Settings → API Settings → CRM API Details**
3. Generate or copy your **CRM API Token**.
4. Store this token securely. You will enter it into Drata during the connection setup.

**Expected outcome:** You have a usable Freshsales CRM API Token.

### Step 2: Identify Your Company Domain

Your domain is part of your Freshsales login URL. For example, if your login URL is:

```
https://mycompany.myfreshworks.com/
```

Your **company domain** is:

```
mycompany
```

**Expected outcome:** You have your Company Domain ready for the connection.

### Step 3: Enter Required Credentials in Drata

1. In Drata, go to **Connections** from the side navigation menu.
2. Open the **Available Connections** tab.
3. Search for **Freshsales**.
4. Select **Connect**.
5. Enter the **API Token** and your **Company Domain**.

## Related articles

- [Pipedrive Integration Guide](pipedrive-integration-guide.md)
- [Recruitee Integration Guide](recruitee-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [Oneflow Integration Guide (UAR)](oneflow-integration-guide-uar.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)

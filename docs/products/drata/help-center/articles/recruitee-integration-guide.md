# Recruitee Integration Guide

Source: https://help.drata.com/en/articles/9300816-recruitee-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-29
Fetched: 2026-11-22
Description: In this article, you learn how to integrate Recruitee with Drata to automate user access reviews and monitor access for compliance purposes.

## Article text

Drata has a Recruitee integration. This integration monitors individuals' access and roles within your platform for compliance purposes.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin privileges in your **Recruitee** account
- Ability to generate a **Recruitee API token**
- Access to your **Company ID**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| **Permission / Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| API Token | Authenticates the connection | User identity and access metadata |
| Company ID | Identifies your Recruitee tenant | Tenant-specific user access data |

## Step-by-Step Setup

### Step 1: Generate a Recruitee API token

1. Log in to your **Recruitee** account as an Admin.
2. Navigate to your **API settings** in Recruitee.
3. Generate a new **API token**.
4. Copy the token and store it securely.

**Expected outcome:**
You have generated and copied a Recruitee API token.

---

### Step 2: Copy your Company ID

1. In Recruitee, locate your **Company ID**.
   - This is typically available in your account settings or API configuration.
2. Copy the Company ID.

**Expected outcome:**
You have copied your Recruitee Company ID.

---

### Step 3: Connect Recruitee inside Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Recruitee** and select **Connect**.
4. Enter:
   - **API Token**
   - **Company ID**
5. Save the connection.

**Expected outcome:**
Drata successfully connects to Recruitee.

## External resources

[Getting Started with Recruitee](https://docs.recruitee.com/reference/getting-started)

## Related articles

- [Workable Integration Guide](workable-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)
- [Sophos Integration Guide](sophos-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)

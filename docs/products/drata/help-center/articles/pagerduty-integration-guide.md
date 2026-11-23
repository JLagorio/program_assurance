# PagerDuty Integration Guide

Source: https://help.drata.com/en/articles/13171491-pagerduty-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-16
Fetched: 2026-11-22

## Article text

Integrating PagerDuty with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from PagerDuty.

## Prerequisites & Data Access

- PagerDuty **Administrator** access
- PagerDuty account with API access enabled
- PagerDuty **OAuth access token** (read-only)
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| `users.read` | Retrieve PagerDuty users for access reviews | User name, email, role, team membership, status |

## Step-by-Step Setup

### Step 1: Create an Access Token

1. Sign in to PagerDuty using an **Administrator** account.
2. In PagerDuty, navigate to **Configuration → Apps & Integrations → API Access** to create a new access token.
3. Ensure the token includes the **`users.read`** scope.
4. Copy the token securely. It will be used in Drata.

**Expected outcome:**
You now have a PagerDuty access token with read-only permissions.

---

### Step 2: Connect PagerDuty in Drata

1. Log in to Drata.
2. Navigate to **Connections**.
3. Search for **PagerDuty** and select **Connect**.
4. Paste the **PagerDuty Access Token**.
5. Select **Save & Test Connection**.

**Expected outcome:**
Drata successfully validates the connection to PagerDuty.

## Related articles

- [Attio Integration Guide](attio-integration-guide.md)
- [Pipedrive Integration Guide](pipedrive-integration-guide.md)
- [Recruitee Integration Guide](recruitee-integration-guide.md)
- [Oneflow Integration Guide (UAR)](oneflow-integration-guide-uar.md)
- [Orca Security Integration Guide](orca-security-integration-guide.md)

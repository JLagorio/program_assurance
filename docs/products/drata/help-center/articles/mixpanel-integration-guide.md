# Mixpanel Integration Guide

Source: https://help.drata.com/en/articles/9869007-mixpanel-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-18
Fetched: 2026-11-22

## Article text

Integrating Mixpanel with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Mixpanel.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Owner or Admin access to your **Mixpanel** organization
- A **Mixpanel service account**
- Copy your Mixpanel Domain and Organization ID. You will need this to connect Mixpanel to Drata.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Organization Admin (service account) | Required to generate credentials and allow API access | User account data |

## Step-by-Step Setup

### Step 1: Create a Mixpanel service account

1. Log in to **Mixpanel**.
2. Navigate to **Settings > Organization Settings > Service Accounts**.
3. Click **Add Service Account**.
4. Enter a service account name.
5. Select **Admin** from the **Organization Role** dropdown.
6. Create the service account.
7. Copy the generated **username** and **secret**.

**Expected outcome:**
A service account is created and credentials are generated.

**Important:** Save the secret securely. It may not be visible again after closing the window.

---

### Step 2: Obtain your Mixpanel domain and Organization ID

1. While logged in to Mixpanel, review the URL in your browser.

Given the URL:
`https://my-domain.com/project/1111111/view/organization-id/app/home`

- **Domain:** `my-domain`
- **Organization ID:** `organization-id`

**Expected outcome:**
You have the domain and Organization ID required for the connection.

---

### Step 3: Connect Mixpanel in Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available connections** tab.
3. Search for **Mixpanel** and click **Connect**.
4. Enter the following values:
   - Service account username
   - Service account secret
   - Mixpanel domain
   - Organization ID
5. Click **Submit**.

**Expected outcome:**
The Mixpanel connection is successfully established.

---

### Step 4: Validate the connection

- Navigate to the **Connections** page in Drata.
- Confirm the Mixpanel connection status shows **Active**.
- Verify that user data is syncing for access reviews.

**Expected outcome:**
User data from Mixpanel appears in Drata and access reviews can be initiated.

## Related articles

- [Snowflake Integration Guide](snowflake-integration-guide.md)
- [Webex Integration Guide](webex-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [Sophos Integration Guide](sophos-integration-guide.md)
- [Wiz (Vulnerability Scanning) Integration Guide](wiz-vulnerability-scanning-integration-guide.md)

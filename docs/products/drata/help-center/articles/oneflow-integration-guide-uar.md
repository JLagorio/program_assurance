# Oneflow Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9774273-oneflow-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Integrating Oneflow with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Oneflow.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Ensure you have Admin privileges within your Oneflow account.
- Create your Oneflow API token. You will need this to connect Oneflow to Drata.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| API Token | Authenticates the connection | User identity and access metadata |

## Step-by-Step Setup

### Step 1: Generate a Oneflow API token

1. Log in to your [Oneflow account](https://app.oneflow.com/login).
2. Select **Marketplace** in the left side navigation. Then, scroll down to select **API tokens** under the **Automation** section.
3. Select the **Generate a new token** button.
4. Enter the token details.
5. Copy your token and store it safely.

**Expected outcome:**
You have generated and copied a Oneflow API token.

### Step 2: Connect Oneflow inside Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Oneflow** and select **Connect**.
4. Paste the **API token**.
5. Save the connection.

**Expected outcome:**
Drata successfully connects to Oneflow and begins syncing user access data.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [Freshsales Integration Guide (UAR)](freshsales-integration-guide-uar.md)
- [Recruitee Integration Guide](recruitee-integration-guide.md)
- [MeisterTask Integration Guide (UAR)](meistertask-integration-guide-uar.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)
- [PagerDuty Integration Guide](pagerduty-integration-guide.md)

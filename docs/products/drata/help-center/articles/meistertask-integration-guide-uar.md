# MeisterTask Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9774138-meistertask-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2025-12-12
Fetched: 2026-11-22

## Article text

Integrating MeisterTask with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from MeisterTask.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin privileges in your MeisterTask account
- Ability to create a **MeisterTask Personal Access Token.** You will need this to connect MeisterTask to Drata.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| userinfo.email | Identify user email addresses | User email |
| userinfo.profile | Identify user profile details | Name, profile metadata |
| mindmeister.readonly | Support user identity retrieval | User identifiers |
| meistertask.readonly | Retrieve MeisterTask user list | User access data |
| license | Determine account licensing status | License metadata |

## Step-by-Step Setup

### Step 1: Create a MeisterTask Personal Access Token

1. Log in to your **[MeisterTask account](https://accounts.meister.co/)**.
2. Go to the Meister **[API Page](https://www.mindmeister.com/api)**, then select the **Add** button under the **Personal Access Token** section.
3. Select the following scopes for this new token:
   - `userinfo.email`
   - `userinfo.profile`
   - `mindmeister.readonly`
   - `meistertask.readonly`
   - `license`
4. Submit your token.
5. Copy your token.

**Expected outcome:**
You have generated and copied a MeisterTask Personal Access Token.

### Step 2: Connect MeisterTask inside Drata

1. In Drata, go to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **MeisterTask** and select **Connect**.
4. Paste the Personal Access Token into the connection drawer.
5. Save the connection.

**Expected outcome:**
Drata successfully connects to MeisterTask and begins syncing user access data.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [Slack Integration Guide (Communication and UAR)](slack-integration-guide-communication-and-uar.md)
- [JetBrains Integration Guide](jetbrains-integration-guide.md)
- [Oneflow Integration Guide (UAR)](oneflow-integration-guide-uar.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)
- [Harvest Integration Guide](harvest-integration-guide.md)

# Socket Integration Guide

Source: https://help.drata.com/en/articles/16547778-socket-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-09-14
Fetched: 2026-11-22

## Article text

The Socket integration enables Drata to import security alerts and repository data from Socket. This integration provides visibility into dependency, code, configuration, license, and supply chain risks across your repositories.

### Key capabilities

- Import open security alerts from Socket across all repositories in your organization.
- Import Socket repositories as repository resources in Drata.
- Map Socket alert severity, state, and category values to Drata’s unified security data model.
- Support both AppSec issues and Vulnerability Findings data models.

## Prerequisites and data access

Before you begin, make sure you have the following:

- Access to the correct Socket organization.
- Permission to create API tokens in Socket.
- Access to the Connections page in Drata.
- Your Socket organization slug.

The integration uses read-only API access to retrieve alert and repository data. Create an API token with only the permissions required for the integration:

| Permission | Why it’s needed | Data accessed |
|---|---|---|
| `repo:list` | Lists repositories in the Socket organization. | Repository data |
| `alerts:list` | Retrieves security alerts. | Security alert data |

## Set up the Socket integration

### Step 1: Generate a Socket API token

1. Log in to your [Socket dashboard](https://socket.dev/).
2. If you belong to multiple organizations, select the organization you want to connect from the organization switcher.
3. Go to **Settings > API Keys**.
4. Select **Create API Token**.
5. Enter a name for the token, such as `Drata integration`.
6. Under **Scopes**, select:
   - `repo:list`
   - `alerts:list`
7. Select **Create**.
8. Copy the API token and store it securely.

The API token is shown only when it is created. If you close the dialog before saving it, create a new token.

### Step 2: Find your Socket organization slug

1. In Socket, navigate to your organization’s page.
2. Find the organization slug in the page URL:
   `https://socket.dev/dashboard/org/{org-slug}/`
3. Copy the value represented by `{org-slug}`.

### Step 3: Enter the Socket credentials in Drata

1. In Drata, go to **Connections**.
2. Select the **Available** tab.
3. Search for Socket and select **Connect**.
4. Enter the following configuration values:

| **Field** | **Value** |
|---|---|
| **API Token** | The API token you generated in Step 1. |
| **Org Slug** | The organization slug you copied in Step 2. |

Create and test the connection.

### Step 4: Validate the connection

1. Confirm that the Socket connection shows as active in Drata.
2. Verify that Socket security alerts are available in Drata.
3. Verify that repositories from the connected Socket organization appear as repository resources.

## Related articles

- [Azure Repos (DevOps) Integration Guide](azure-repos-devops-integration-guide.md)
- [Segment Integration Guide](segment-integration-guide.md)
- [Sentry Integration Guide](sentry-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Orca Security Integration Guide](orca-security-integration-guide.md)

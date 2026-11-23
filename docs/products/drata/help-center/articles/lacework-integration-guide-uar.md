# Lacework Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9868921-lacework-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2025-10-22
Fetched: 2026-11-22

## Article text

The Lacework integration allows security and compliance teams to automate user access reviews by syncing user and role data directly from Lacework into Drata. This connection streamlines access verification, reduces manual review work, and helps your team maintain accurate, audit-ready compliance records.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.

## Step-by-Step Setup

### Step 1:  Create Secret Access Key and ID in Lacework

1. Log in to your **Lacework** instance as an **Account Admin** or a user with **write access for API keys**.
2. Navigate to **Settings → API Keys**.
3. Click **+ Create New** (or select an existing key, if applicable).
4. Set the **API key scope** to **admin with read access**.
   This ensures Drata can retrieve user and role data but cannot modify your Lacework environment.
5. After creating the key, download the **JSON file** that includes your credentials.
6. Copy and securely record:
   - **Access Key ID**
   - **Secret Access Key**

### Step 2:  Copy Lacework Domain

When logged in to Lacework, locate your domain in the browser address bar.

Example:

```
https://my-domain.lacework.net/ui/investigation/Dashboard
```

In this case, your **Domain** value is:

```
my-domain
```

## Complete the Connection

1. In Drata, go to **Connections → Lacework**.
2. Enter the following information:

| **Drata Field** | **Lacework Value** |
|---|---|
| **Access Key ID** | Your Lacework Access Key ID |
| **Secret Access Key** | Your Lacework Secret Access Key |
| **Domain** | Your Lacework domain (e.g., `my-domain`) |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [OneLogin Integration Guide](onelogin-integration-guide.md)
- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [Mixpanel Integration Guide](mixpanel-integration-guide.md)

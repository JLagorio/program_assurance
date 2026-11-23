# Google Workspace Integration Guide (User Access Reviews)

Source: https://help.drata.com/en/articles/9912594-google-workspace-integration-guide-user-access-reviews
Collection: Connection Support › Other Guidance
Updated: 2026-05-28
Fetched: 2026-11-22

## Article text

The Google Workspace integration enables security and compliance teams to automate user access reviews. It connects Drata to Google Workspace so your team can review user accounts, admin privileges, and group memberships to support access governance and compliance requirements.

## Key Capabilities

- User access review data: Review users with access to Google Workspace
- Admin privilege visibility: Identify users with Admin Console privileges
- Automated evidence collection: Sync user and group data into Drata for compliance reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

Unlike SCIM-based integrations that sync application access from identity providers, this integration retrieves user and role data directly from the **Google Workspace Admin Directory API**.

## Prerequisites & Data Access

- **Admin privileges** in Google Workspace
- Access to the **Google Admin Console**
- Ability to configure **Domain-Wide Delegation**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Google Workspace admin privileges may be assigned through:

**By Role**

- System Roles
- Custom Roles

**By Group**

- Admin privileges can also be granted through membership in a **security group assigned to an admin role**.

Important limitation:

- The **Google API does not support SCIM for connected apps**, so this integration cannot import connected application access data like Microsoft or Okta integrations can.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| admin.directory.user.readonly | Allows Drata to retrieve user account information |
| admin.directory.group.readonly | Allows Drata to retrieve group membership data |
| admin.directory.rolemanagement.readonly | Allows Drata to retrieve admin role assignments |
| admin.directory.orgunit.readonly | Allows Drata to retrieve organizational unit data |

## Step-by-Step Setup

### Step 1: Start the Google Workspace Connection in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Google Workspace** connection process.

Expected outcome: The Google Workspace setup flow opens.

### Step 2: Configure Domain-Wide Delegation in Google Admin

1. Sign in to the **Google Admin Console** at: [https://admin.google.com](https://admin.google.com)
2. Use an account with **Super Admin privileges**.
3. Navigate to **Security → API Controls**.
4. In **Domain-wide delegation**, select **Manage Domain Wide Delegation**.
5. Select **Add New**.
6. Enter the following values:

- **Client ID**

```
118095967747130880411
```

- **OAuth Scopes**

```
https://www.googleapis.com/auth/admin.directory.user.readonly
https://www.googleapis.com/auth/admin.directory.group.readonly
https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly
https://www.googleapis.com/auth/admin.directory.orgunit.readonly
```

Select **Authorize** to save the configuration.

Expected outcome: Domain-wide delegation is granted to Drata.

### Step 3: Complete the Connection in Drata

1. Return to the **Google Workspace connection setup** in Drata.
2. Enter the **email address of the Google Workspace Super Admin**.

Expected outcome: Google Workspace is successfully connected and user data begins syncing to Drata. Alternatively, you can choose the **OAuth** connection method during setup. Ensure the admin account used for authentication has the required permissions and scopes.

## Managing Google Workspace Accounts in Drata

After the connection is established, you can review synced accounts.

1. Navigate to the **Connections** page in Drata.
2. Ensure you are on the **Active Connections** tab.
3. Locate the **Google Workspace (User Access Review)** connection.
4. Select **Manage Accounts**.

You will be redirected to a page showing a **table of users retrieved from Google Workspace**.

You can review and verify the list of accounts included in the access review.

Important behavior:

- Users with access to the **Google Admin Console** will appear with their **Admin roles** in Drata.
- Users who are administrators of specific Google applications but **do not have Admin Console access** will **not appear as admins in Drata**.

## Disconnecting Google Workspace

1. Navigate to the **Connections** page.
2. Ensure you are on the **Active Connections** tab.
3. Locate the **Google Workspace (User Access Review)** connection.
4. Open the connection and select the **trash icon**.
5. Confirm the removal when prompted.

Expected outcome: The Google Workspace connection is removed.

Important note:

- When a connection is removed, **all associated data is also deleted**, including user access review records.

## Important Notes

- Google Workspace does **not support SCIM for connected applications**, so app-level access cannot be imported.
- Only users with **Admin Console privileges** appear as administrators in Drata.
- User data and roles are retrieved from the **Google Admin Directory API**.
- Access review data is removed if the connection is deleted.

## Related articles

- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Okta Integration Guide (User Access Review)](okta-integration-guide-user-access-review.md)
- [Salesforce Integration Guide (User Access Review)](salesforce-integration-guide-user-access-review.md)

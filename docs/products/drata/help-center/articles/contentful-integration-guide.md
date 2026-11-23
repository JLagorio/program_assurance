# Contentful Integration Guide

Source: https://help.drata.com/en/articles/9300564-contentful-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Drata has a [Contentful](https://www.contentful.com/) integration. This integration monitors individual's access and roles within your platform for compliance purposes.

## Prerequisites

- **A connection is required per [space](https://www.contentful.com/help/spaces-and-organizations/#what-are-spaces-and-organizations).**
   - Each Contentful connection in Drata corresponds to **one Contentful space**.
   - If your organization uses multiple spaces, create a **separate connection for each one**.
- You must have an Admin role in Contentful to retrieve user access and role details.
   - Refer to Contentful’s documentation to learn more about [how they manage roles](https://www.contentful.com/help/managing-space-roles-and-permissions/).
- You will need the following to connect Contentful to Drata:
   - **Personal Access Token**
   - **Organization ID**
   - **Space ID**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Personal Access Token | Authenticates Drata to Contentful’s API | User list, roles, and permissions for the specified space |
| Organization ID | Identifies the Contentful organization | Organizational membership and access metadata |
| Space ID | Identifies the target Contentful space | Space-specific user access and roles |

- Create and copy your personal access token. You will enter the personal access token in Drata’s connection drawer.
- Copy your **Organization ID **and **Space ID**. You will enter these IDs in Drata’s connection drawer.
   - Refer to Contentful’s documentation to learn how to find your [organization ID](https://www.contentful.com/help/find-organization-id/) and [Space ID](https://www.contentful.com/help/find-space-id/).

## Step-by-Step Setup

### Step 1: Create and copy your personal access token

1. **Log in** to the Contentful web app.
2. **Open the space** you want Drata to access by selecting it from the space selector in the top-left corner.
3. Go to **Settings** and choose **CMA tokens** from the dropdown.
4. Select **Create personal access token**.
   The *Create personal access token* window will appear.
5. Enter a **custom name** for the token, then click **Generate**.
6. **Copy your personal access token** immediately.
7. Ensure to take note of the Expiration date.

**Important:**
You will **not be able to view this token again** after closing the creation window. Store it securely and ensure you have copied it before proceeding.

Refer to Contentful’s documentation to learn [how to create a personal access token](https://www.contentful.com/developers/docs/references/authentication/#:~:text=Log%20in%20to%20the%20Contentful,Click%20Create%20personal%20access%20token.).

### Step 2: Copy your Organization ID

You can also find the organization ID in your web browser address line next to `/organizations/.`

Refer to Contentful’s documentation to learn how to find your [organization ID](https://www.contentful.com/help/find-organization-id/).

### Step 3: Copy your Space ID

Follow these steps to locate the Space ID for the Contentful space you want to connect to Drata:

1. **Log in** to the Contentful web app.
2. Navigate to the **space** for which you want to retrieve the Space ID.
3. Click **Settings**, then select **General settings** under the *Space settings* section.
4. The **Space settings** page will open.
   Under the **General** section, you will find your **Space ID**.

Refer to Contentful’s documentation to learn how to find your [Space ID](https://www.contentful.com/help/find-space-id/).

### Step 4: Enter Required Fields within Drata

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for** Contentful**, and select **Connect**.
3. On the drawer, you can connect to Contentful.
4. In the next steps, enter the **API Token**, **Organization ID**, and **Space ID.**

A check mark with a success message indicates a successful connection.

## Troubleshoot

If an error message appears after connecting, ensure that the API Token's expiration date has not passed. If the expiration date is valid, then ensure that the organization ID and space ID are correct.

## External resources

[Contentful: Content Management API](https://www.contentful.com/developers/docs/references/content-management-api/)

## Related articles

- [Attio Integration Guide](attio-integration-guide.md)
- [JetBrains Integration Guide](jetbrains-integration-guide.md)
- [MeisterTask Integration Guide (UAR)](meistertask-integration-guide-uar.md)
- [Make Integration Guide](make-integration-guide.md)
- [Harvest Integration Guide](harvest-integration-guide.md)

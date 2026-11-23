# Notion Integration Guide

Source: https://help.drata.com/en/articles/9294590-notion-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-06
Fetched: 2026-11-22

## Article text

Connect Notion to Drata to sync and manage policies seamlessly. Now, you can expand your policies while using Drata for the approval and acknowledgement of those policies.

## Prerequisites

- Ensure you are on the Enterprise plan with Notion.
- Ensure the personnel connecting Notion to Drata also has administrative access to the workspace(s) within that Enterprise plan that contain the policy pages.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

**Configure the pages so that it is ready to sync into Drata**

- Ensure that the pages are not personal pages or pages in private spaces.
- Ensure that the pages do not contain database blocks.
- Pages with attachments are synced but the attachments are not synced.

**Limitations**
This connection is currently utilizing the latest version of Notion's new Discovery API. However, this API does not yet support the File Picker feature, which allows you to select specific pages visible to Drata. As a result, Drata can access all Notion pages in the connected account.

## Enable Notion

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for Notion, and select **Connect**.
   - You are redirected to Notion when you select **Connect. **On Notion, **Allow access** to grant Drata access to your Notion workspace.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Confluence Integration Guide](confluence-integration-guide.md)
- [Lattice Integration Guide](lattice-integration-guide.md)
- [Google Workspace Integration Guide (User Access Reviews)](google-workspace-integration-guide-user-access-reviews.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)

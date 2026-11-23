# View and Manage Workflows

Source: https://help.drata.com/en/articles/11752727-view-and-manage-workflows
Collection: Enhancing your workflow › Custom Workflows
Updated: 2026-02-10
Fetched: 2026-11-22
Description: Learn how to view, filter, and manage workflows in Drata, including published versions, run logs, and workflow actions.

## Article text

To learn how to create a workflow, go to [Automate Actions with Drata’s Workflows](automate-actions-with-drata-s-workflows.md).

## Workflow Table Overview

All workflows are listed under **Settings > Workflows** on the **Active** tab. This page provides a quick overview of each workflow’s current configuration, including status, type, version, creator, and last updated time.

Each row in the table shows the following information:

| **Column** | **Description** |
|---|---|
| Name | The name of the workflow |
| Type | [Control](create-workflow-for-control.md), [Risk](create-workflow-for-risk.md), [Evidence](create-workflow-for-evidence.md), or [Personnel](create-workflow-for-personnel.md) |
| Version | The version of the workflow, such as V1 or Draft |
| Status | Published or Unpublished |
| Run errors | Errors encountered during workflow execution |
| Created by | User who created or most recently updated workflow |
| Workspace | The workspace the workflow belongs to |
| Last updated | The date and time the workflow was last changed |

You can also:

- Filter by status for active workflows (Published or Unpublished)
- Search by workflow name
- Select any workflow to open the details page and view run history and execution logs
- Toggle between **Active **and **Archived** using the tabs

## Manage a Workflow

On the **Settings > Workflows** page, each workflow is listed in a table. To manage one, select the desired workflow.

On the specific workflow page, select **Actions** for more options.

For published workflows

| **Action** | **Description** |
|---|---|
| Edit draft | Make changes to a draft version without affecting the published version |
| View published version | Open the live version currently in use |
| Publish changes | Push saved edits to the live workflow |
| Unpublish | Take the workflow offline (moves it to Unpublished status) |
| Duplicate | Create a copy of the workflow (useful for templates or similar setups) |

For unpublished workflows:

| **Action** | **Description** |
|---|---|
| Edit draft | Open the workflow builder to continue editing |
| Publish | Make the draft active and begin automated execution |
| Duplicate | Create a copy of the workflow for reuse or modification |
| Archive | Remove the workflow from the active list without deleting it |
| Delete | Permanently remove the workflow (only available for drafts) |

After a workflow is triggered, the table displays its run history, including the run time, the associated ID (depending on the object type), the workflow version used, and the run status.

## Additional Resources

- [Automate Actions with Drata's Workflows](automate-actions-with-drata-s-workflows.md)
- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Personnel](create-workflow-for-personnel.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
- [Drata Developer page](https://developers.drata.com/)

## Related articles

- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Delete a Policy Draft](delete-a-policy-draft.md)
- [Policy Management in Drata Training Video (New Experience)](policy-management-in-drata-training-video-new-experience.md)

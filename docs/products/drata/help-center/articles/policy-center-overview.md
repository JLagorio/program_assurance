# Policy Center Overview

Source: https://help.drata.com/en/articles/13541243-policy-center-overview
Collection: Understand the Drata Platform › Policies
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Use the Policy Center to manage the policies required for audit readiness and ongoing compliance. From a single place, you can create, edit, review, approve, publish, and track policies throughout their lifecycle.

## Article text

The Policy Center streamlines policy management by making policy status, approvals, and version history easier to view and manage.

## What you can do in the Policy Center

You can use the Policy Center to:

- **Create or upload policies**: Start from a Drata template, upload your own policy files, or import an existing document from connected cloud storage (Google Drive, SharePoint, OneDrive, Box, or Dropbox). See [Create a policy](create-a-policy.md) for details.
- **Edit policy content: **Update policy language, attachments, and version details.
- **Assign approvers and publish policies: **Configure multi-tier approval workflows. You can define approvers at each stage and control which actions are available per tier. Once all required approvals are complete, the policy is ready to publish.
- **Track versions and status: **Monitor draft, approval, and published versions of each policy in one place.
- **Export or archive policies: **Download policies as PDFs or archive outdated versions while preserving audit history.
- **Update policies: **Follow a step-by-step process to edit policy content, classify changes as material or non-material, and manage acknowledgments effectively.

## Policy lifecycle at a glance

Policies move through the following stages:

- **Draft**: The policy is being created or edited.
- **Needs approval**: The policy is waiting for required approvals.
- **Ready to publish**: All approvals are complete, and the policy can be published.
- **Published**: The policy is active and enforceable.
- **Archived**: The policy is no longer active but retained for audit purposes.

Understanding policy status helps you quickly identify blockers and keep policies current.

## Understand material vs. non-material changes

When you update an **already published policy**, you must classify the type of change you're making. This helps Drata determine whether the update requires re-approval and personnel acknowledgment.

Material changes substantially affect the policy's intent or scope. When you mark an update as a material change: Version increments occur only upon publishing. For example, a policy in draft or approval stages retains its current version number until it is published, at which point the version number increments to the next major version (e.g., v1.0 → v2.0).

- Drata starts a new approval workflow, meaning the policy must be reviewed and approved again before it can be published
- A new major version is created (for example, v1.0 → v2.0)
- Personnel must acknowledge the updated policy after it is published
- Drata immediately updates the compliance dashboard and policy status upon publication
- Assigned employees will see the new version as pending acknowledgment in their **My Drata** portal
- Employees will receive re-acknowledgment prompts and notifications right away

Non-material changes include minor wording, formatting, or clarification updates that don't change the policy's intent. When you mark an update as non-material: Drata automatically creates a new version of the policy whenever an update is made, ensuring a clear history of changes. For non-material updates, this results in a minor version increment (e.g., v1.0 → v1.1).

- A new minor version is created (for example, v1.0 → v1.1)
- The update can be published immediately by a Policy Owner. For non-material changes, the policy is updated without triggering acknowledgment or notifications unless explicitly configured.
- Examples of non-material changes include grammatical corrections, formatting adjustments, or minor clarifications.

## Steps to Update a Policy

Follow these steps to update a policy in Drata:

1. Navigate to the **Policy Center** in your Drata dashboard.
2. Locate the policy you wish to update.
3. Click the **Edit** icon next to the policy or open the policy directly for editing.
4. Make the necessary changes to the policy content.
5. Click **Finalize draft** to save your changes.
6. When prompted, specify the type of change:

- **Material Change**: This updates the policy to a new major version (e.g., v1.0 → v2.0) and requires employee acknowledgment.
- **Non-Material Change**: This updates the policy to a new minor version (e.g., v1.0 → v1.1) and does not require acknowledgment unless specified.

1. Publish the updated policy. Material changes will automatically update assignments and trigger acknowledgment requests for assigned personnel.

## Reverting or Avoiding Acknowledgment for Updated Policies

If a material change triggers re-acknowledgment but you wish to undo or avoid it, consider the following options:

- **Policy in Needs Approval Status**:
   - Navigate to the policy as the Policy Owner.
   - Click **⋯** → **Cancel Approval** to revert the policy to Draft.
   - Delete the draft to restore the previously published version.
- **Change Not Actually Material**:
   - Re-finalize the policy as a **Non-material** change.
   - Select that personnel acknowledgment is not required (ensure the change does not affect the policy’s intent or scope).
- **Published Policy with No Further Changes Needed**:
   - Use the **Renew without updates** option.
   - Choose **No** for personnel acknowledgment (applicable only if the policy is published, has no draft, and is owned by the Policy Owner).

## Roles and permissions

Actions available in the Policy Center depend on your role.

- Policy Owners can create, edit, and publish policies.
- Approvers can review and approve assigned policies.

## Manage archived or replaced policies

In the **Archived or replaced** tab, you can:

- Restore archived policies
- View versions replaced by custom policies
- Download previous versions for reference

## Related articles

- [View and edit a policy](view-and-edit-a-policy.md)
- [Create a policy](create-a-policy.md)
- [Manage policy renewals](manage-policy-renewals.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
- [Policy Management in Drata Training Video (New Experience)](policy-management-in-drata-training-video-new-experience.md)

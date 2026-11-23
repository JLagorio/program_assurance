# Identify What Can Be Shared Workspace Resources

Source: https://help.drata.com/en/articles/17232922-identify-what-can-be-shared-workspace-resources
Collection: Getting Started › Workspaces
Updated: 2026-09-30
Fetched: 2026-11-22
Description: Use this article to understand what stays within a Workspace, what can be linked across Workspaces, and what remains Account-wide.

## Article text

Workspaces create separation for compliance operations, but not every Drata resource follows the same sharing model. Some resources are specific to one Workspace. Some can be deliberately linked across selected Workspaces. Some are managed at the Account level.

The table below describes the intended operating model. Product behavior may vary by resource, so use the linked task articles for exact procedures and permissions.

| **Resource or activity** | **Typical scope** | **Cross-Workspace behavior** |
|---|---|---|
| Frameworks | Workspace-level configuration | Enable or manage frameworks for the Workspaces where they apply. |
| Controls | Workspace-level rows with optional linking | Link selected controls across Workspaces when they represent the same enterprise control. |
| Control information | Linked-control scope | Can be managed across linked controls rather than inherited globally by every Workspace. |
| Policies | Workspace/control scope | Can be mapped across relevant linked controls. |
| Evidence Library evidence | Evidence/control scope | Can be mapped across relevant controls and linked control groups. |
| Miscellaneous or externally collected evidence | Depends on evidence type | Do not assume that all evidence automatically propagates across Workspaces. |
| Control test instances | Workspace-level | Test instances remain associated with the individual Workspace where they run. |
| Monitoring behavior and results | Workspace-level | Treat monitoring configuration and results as Workspace-specific unless the product explicitly indicates otherwise. |
| Connections | Workspace or Account configuration, depending on connection type | Assign or manage connections according to the connection’s supported scope. |
| Personnel | Scope depends on the personnel configuration | Use Workspace personnel scoping when the people population must be separated operationally or for access. |
| Vendors, assets, and other operational data | Depends on the resource | Verify the resource’s supported scope before assuming it is shared or isolated. |
| Events | Workspace-aware where supported | Use the events article for how Workspace context is displayed and filtered. |
| Tickets | Depends on the originating workflow | Control- and test-related tickets can carry Workspace context; some risk workflows and automations remain Account-level. |

## The important rule

Do not assume that linking two controls makes every related object identical across Workspaces.

Linked controls allow selected control information, policies, and Evidence Library evidence to be managed across an intentional set of Workspaces. Test instances, monitoring behavior, permissions, and operational workflows may still remain Workspace-specific.

## What customers should expect

- A linked control represents the same control concept across the selected Workspaces.
- A control can be linked only to the Workspaces that the customer intentionally selects.
- Evidence sharing is bounded by the linked control relationship; it is not a global Account-wide inheritance rule.
- A test or monitoring result in one Workspace should not be assumed to change the test or monitoring state in another Workspace.
- Bulk actions should be performed only within the Workspaces and resources that the user is authorized to manage.

## Before creating multiple Workspaces

Ask these questions:

1. Do the groups require different audit scope or framework coverage?
2. Should different administrators have different access?
3. Will the groups use different systems, personnel populations, or evidence sources?
4. Do they have different control owners or operating cadences?
5. Is the separation worth the additional administration and potential duplication?
6. If the same controls apply, should they be linked across the selected Workspaces?

If the answer to most of these questions is no, start with one Workspace.

## Related articles

- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Create and Manage Workspaces](create-and-manage-workspaces.md)
- [Map Controls, Policies, and Evidence Across Workspaces](map-controls-policies-and-evidence-across-workspaces.md)
- [Understand Accounts, Workspaces, and MIM](understand-accounts-workspaces-and-mim.md)

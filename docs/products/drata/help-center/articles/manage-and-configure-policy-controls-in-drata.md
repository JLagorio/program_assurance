# Manage and Configure Policy Controls in Drata

Source: https://help.drata.com/en/articles/12111663-manage-and-configure-policy-controls-in-drata
Collection: Understand the Drata Platform › Policies
Updated: 2025-11-14
Fetched: 2026-11-22

## Article text

This guide helps you configure and manage policies in Drata for control mapping, test readiness, approval, and submission. It includes steps for publishing policies, linking them to controls, editing locked policies, and ensuring you have the proper role permissions to take action.

## Prerequisites

Before configuring or submitting a policy:

- You must have access to the **Policy Center page**.
- You must be the **Policy Owner** or work with the current owner.
- The policy must be in **Draft** or **New** status to allow editing.
- Only **published** policies are evaluated in control tests.
- Only the policy owner has the authority to cancel an approval workflow. If you lack this permission, coordinate with the current policy owner or have them transfer ownership.

## Resolve the Message: "Your Acceptable Use Policy is either not in Drata or is past the renewal date"

If this message appears in a test or control:

1. Open your **Acceptable Use Policy** in the **Policy Center page**.
2. Confirm the policy has a valid renewal date.
3. Select **Publish** to activate the current version.
4. Re-run the test to update the status.

This message appears when a policy has not been published or has an outdated renewal date.

## Resolve the Message: Policy is marked as 'Not Ready' after test passes

If the policy test passes but the policy status remains **Not Ready**:

1. Open the policy.
2. Scroll to the **Linked Controls** section.
3. Confirm that the policy is assigned to the appropriate control.
4. If not, assign it using the control assignment menu.

Policies must be linked to at least one control to be considered ready.

## Managing Policy Approval Workflows in Drata

Policy approval workflows in Drata are a key feature for ensuring compliance and proper approval processes. To make changes to policies in **Needs Approval** status or manage workflows, you need the proper permissions.

1. **Cancel the Approval (Policy Owner Permission Required):** Open the policy, access the options menu, and select 'Cancel Approval.' This action ends the current approval process, removes all existing approvals, and reverts the policy to Draft.
2. **Finalize the Draft:** Once the policy is in Draft status, click 'Finalize Draft' to move the policy status to 'Needs Approval.'
3. **Restart the Approval Process:** Initiate the approval workflow again by selecting 'Approve.' This restarts the process with a clean slate. *Note:* If you do not see the 'Cancel Approval' option, confirm you are the policy owner. If not, request assistance from the current owner or have them transfer ownership to you.

## Common Issues and Resolutions

- **"Override" vs "Cancel" Options:** If you can only see an 'Override Policy Approval' option and not 'Cancel Approval,' it indicates that you do not possess policy owner permissions. Collaborate with the current owner to either make the required changes or transfer permissions.
- **Transferring Ownership:** In cases where the policy owner is unavailable, work with your organization’s admin or support team to transfer ownership to the right user, enabling workflow management.

## Publish a Policy for Test Recognition

If you're unable to submit a policy after editing:

1. Confirm that you are the **Policy Owner**.
2. If you are not the owner, contact the listed owner for submission.
3. If needed, an admin can reassign ownership to you so you can proceed. If the policy owner is unavailable, collaborate with your organization's admin or support team to transfer ownership. This ensures workflow continuity.

Only the Policy Owner or an admin can submit a policy for approval.

## Related articles

- [Test 13: System Access Control Policy](test-13-system-access-control-policy.md)
- [Common Policy Management Issues in Drata (and How to Resolve Them)](common-policy-management-issues-in-drata-and-how-to-resolve-them.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
- [Section 5: Control Owners](section-5-control-owners.md)
- [Section 5: Policy Owners](section-5-policy-owners.md)

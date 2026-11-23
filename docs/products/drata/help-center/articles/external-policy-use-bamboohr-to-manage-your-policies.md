# External Policy: Use BambooHR to manage your policies

Source: https://help.drata.com/en/articles/13553241-external-policy-use-bamboohr-to-manage-your-policies
Collection: Understand the Drata Platform › Policies
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Use this workflow if your organization manages policies and acknowledgments in BambooHR and uses Drata for audit evidence and control mapping.

## Article text

Some organizations already manage policies, distribution, and employee acknowledgment in BambooHR. This workflow lets you:

- Keep **policy creation and acknowledgment** in BambooHR
- Avoid collecting acknowledgments in Drata
- Use Drata to **map policies to controls** and **sync signed evidence** for audits

If BambooHR is the **source of truth** for policy content and acknowledgments, Drata can import the policy file, maps it to controls, and syncs acknowledgment evidence daily.

### How policy management works with BambooHR

When you use BambooHR as your policy manager:

1. **Policies are created and updated in BambooHR**
2. **Acknowledgment happens only in BambooHR**
3. **Drata does not send acknowledgment prompts in My Drata**
4. **Approval workflows in Drata are bypassed**
5. Imported policies are **published immediately** in Drata
6. Drata runs a **daily sync** to collect signed acknowledgment evidence

## Prerequisites

- [BambooHR](bamboohr-integration-guide.md) is connected to Drata.
- You have **Admin** permissions in both Drata and BambooHR.
- Policies **must be created in BambooHR first**; you cannot create policies in Drata and sync them *back* to BambooHR.
- The files uploaded to BambooHR must have **one file extension. **Files with multiple extensions will fail to import.
- Employees acknowledge policies **in BambooHR**, not in Drata. Employees do not receive acknowledgment tasks in My Drata, even if the policy is assigned to them.
- BambooHR does not support draft or approval states. Every policy imported from BambooHR is **published immediately** in Drata.

## Import a policy from BambooHR

Only the **policy owner** can import or sync files from BambooHR.

1. Open **Governance → Policies**.
2. Select **Import policy**.
3. Enter the policy details:
   - Policy name
   - Policy owner
   - Personnel groups
4. Confirm your selection.

The policy is **published immediately** in Drata as **Version 1** (new policy) or the **next version** (existing policy update). Drata **skips drafts, approvals, and tiered workflows. **The policy is available for **control mapping immediately**

### How acknowledgment data syncs

Drata runs a **daily sync** with BambooHR to collect acknowledgment evidence. When an employee signs a BambooHR policy:

- The signed file is saved to the employee’s **Signed Documents** folder in BambooHR
- Drata pulls acknowledgment evidence **only from this folder**

## Replace Drata templates with a BambooHR policy

Some BambooHR documents (such as a Company Handbook) may satisfy multiple policy requirements. In these cases, replace **all applicable Drata policy templates** with the single imported BambooHR policy to avoid duplicate coverage.

1. Open **Governance → Policies**.
2. Select the **BambooHR policy** that will replace Drata templates.
3. Select **Edit **in the details section.
4. For **Should this policy replace any Drata default policies?**, select **Yes**.
5. Select **all applicable policy templates** the BambooHR policy replaces. Examples include:
   - Acceptable Use Policy
   - Code of Conduct
   - Information Security Policy
6. Save your changes.

Replacing templates ensures accurate control coverage and prevents duplicate policies in your audit scope.

## What happens if a BambooHR policy file is removed

If a policy file is removed from BambooHR:

- The policy remains visible in Drata.
- The policy stays mapped to its controls.
- Mapped control readiness is not impacted.

You cannot update the policy status until a new valid file is uploaded.

Drata displays **clear warning banners** when an external policy file is missing.

## Key distinction to remember

**BambooHR-managed policies**

- Source of truth: **BambooHR**
- Acknowledgment: **BambooHR**
- Drata role: evidence sync and control mapping
- No drafts or approvals in Drata

If you want policy creation, approvals, renewals, and acknowledgment in Drata, **do not use BambooHR or other external policy connections**.

## Related articles

- [Test 45: Employees Acknowledge the Acceptable Use Policy](test-45-employees-acknowledge-the-acceptable-use-policy.md)
- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)
- [Create a policy](create-a-policy.md)
- [External Policy: Use Confluence or Notion to manage your policies](external-policy-use-confluence-or-notion-to-manage-your-policies.md)

# Manage Scope and Exclusions in Drata

Source: https://help.drata.com/en/articles/13252456-manage-scope-and-exclusions-in-drata
Collection: Understand the Drata Platform › Controls
Updated: 2025-12-29
Fetched: 2026-11-22

## Article text

Drata provides flexible tools to help you define and manage the scope of your compliance program. When certain controls or individuals do not apply to your organization or a specific audit period, you can mark them as **Out of Scope** to ensure your compliance posture accurately reflects your operating environment.

This guide explains how to exclude **controls** and **personnel** from scope in Drata and outlines best practices for maintaining consistency and audit readiness.

## Marking Controls as Out of Scope

You can exclude one or more controls directly from the Controls page.

**To mark controls as Out of Scope:**

1. Navigate to **Controls** page in the Drata.
2. Use the checkbox next to each control you want to exclude.
   - You can select multiple controls or use **Select All** to include all controls visible on the page.
3. Select **Out of Scope**.

**Important:**
If the excluded controls are linked to specific requirements, ensure the corresponding requirements are also marked as Out of Scope. This helps maintain consistency across your compliance framework.

## Excluding Personnel from Scope

You can bulk-mark personnel as Out of Scope from the Personnel section.

**To exclude personnel from scope:**

1. Navigate to **Personnel**.
2. Select the users you would like to exclude.
   - To include more users at once, increase the page size (for example, from 20 to 50).
3. Select **Actions** > **Change employment status**.
4. Then select **Out of Scope**, and choose either **Ignore** or **Service Account Out of Scope**, depending on how the account should be treated.

This approach allows you to efficiently exclude multiple individuals without editing each record individually.

## Related articles

- [Map accounts to personnel in Drata (New Experience)](map-accounts-to-personnel-in-drata-new-experience.md)
- [Mark Controls In or Out of Scope](mark-controls-in-or-out-of-scope.md)
- [Personnel exclusions](personnel-exclusions.md)
- [Mark personnel as Out of Scope (New Experience)](mark-personnel-as-out-of-scope-new-experience.md)
- [Scope personnel to a Workspace](scope-personnel-to-a-workspace.md)

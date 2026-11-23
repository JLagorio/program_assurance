# Mark personnel as Out of Scope (New Experience)

Source: https://help.drata.com/en/articles/13764544-mark-personnel-as-out-of-scope-new-experience
Collection: Understand the Drata Platform › Personnel
Updated: 2026-11-09
Fetched: 2026-11-22

## Article text

Marking a user as Out of Scope excludes that person from audit testing and automated compliance checks while preserving an audit trail. This helps ensure audit scope accurately reflects who accesses customer data and in-scope systems.

## When to mark personnel as Out of Scope

Mark a user as Out of Scope when that person:

- Does not access customer data
- Does not access systems that handle customer data
- Should not be included in compliance testing for the current audit scope

Auditors expect Out of Scope users to be rare and clearly justified.

## Mark personnel as Out of Scope

1. Open **Personnel **page.
2. Locate the user you want to update.
3. In the **Personnel status** column, select **Out of Scope** from the dropdown.
4. Enter a business rationale when prompted.
5. Save your changes.

**When you mark a user as Out of Scope:**

- The user cannot sign in to Drata unless the user holds an admin role
- Drata excludes the user from automated compliance checks
- The user does not complete employee onboarding
- Drata retains the personnel record for audit purposes

## Related articles

- [Map accounts to personnel in Drata (New Experience)](map-accounts-to-personnel-in-drata-new-experience.md)
- [Mark Controls In or Out of Scope](mark-controls-in-or-out-of-scope.md)
- [Personnel exclusions](personnel-exclusions.md)
- [Marking Requirements In and Out of Scope](marking-requirements-in-and-out-of-scope.md)
- [Scope personnel to a Workspace](scope-personnel-to-a-workspace.md)

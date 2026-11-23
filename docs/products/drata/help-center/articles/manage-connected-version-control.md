# Manage connected version control

Source: https://help.drata.com/en/articles/13296062-manage-connected-version-control
Collection: Understand the Drata Platform › Connections
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Learn how Drata displays and evaluates version control access, including write access, merge permissions, and MFA status

## Article text

The **Version Control** page shows accounts discovered through your connected version control systems.

This page helps you:

- View which version control accounts Drata is monitoring
- Understand which accounts represent individual users versus service accounts
- Map accounts to personnel
- Review access indicators such as write access, merge permissions, and MFA status

## Prerequisites

Before managing version control accounts in Drata:

- A version control system (such as GitHub, GitLab, or Bitbucket) must be connected
- An **identity provider** must be connected to sync personnel into Drata

Drata uses **read-only access** to collect version control account data and does not modify permissions or access levels in your version control system.

## How version control accounts appear in Drata

After a version control system is connected, Drata automatically syncs detected user accounts.

In many cases, Drata attempts to **automatically map accounts to personnel** based on matching attributes such as name or email. If a match cannot be determined, the account remains unmapped.

Some version control providers may not share enough information for automatic matching. In these cases, accounts must be mapped manually.

## Map version control accounts to personnel

For a complete explanation of how account mapping works across Drata, including how service accounts are handled, refer to **[Mapping accounts to personnel in Drata](map-accounts-to-personnel-in-drata-new-experience.md)**.

## Access changes and audit trail

When access to a version control account is removed in the provider, Drata detects and records the change.

Deleting an account in your version control system does **not** remove it from Drata. Instead, Drata **records a timestamp indicating when access was revoked under the Access revoked column**. This preserves an audit trail used to demonstrate timely access removal and track access control SLAs.

Changes made in the provider may take time to appear in Drata due to sync timing.

## Access indicators: Write Access, Merge to default branch, and MFA

Drata looks at your version control system and **reads certain access signals** about each account. These signals help Drata understand **how powerful an account is**, but Drata **cannot change them**.

- **Write access** → Can this account push code?
- **Merge to default branch** → Can this account push directly to production?
- **MFA status** → Is extra authentication required to log in?

### Write Access and Merge to default branch

The **Write access** and **Merge to default branch** column has checkboxes which are used to confirm the level of access an account is expected to have.

Checking these boxes:

- Does **not** change permissions in your version control system
- Helps Drata understand which access is intentional
- Is used to evaluate access-related compliance checks

You should select these options only when the account is meant to have that level of access in the source system. If the access shown in your version control tool doesn’t match what’s selected here, related tests may fail. To actually change permissions, update the account directly in your version control system.

### MFA status

MFA status is detected automatically from the version control provider.

- MFA is read-only in Drata
- MFA configuration must be managed in the provider
- MFA indicators are used to evaluate relevant compliance tests

If an MFA-related test fails, refer to **Test 86: MFA on Identity Provider** for remediation guidance.

## Important considerations

- Changes made in the version control system may take time to appear in Drata
- Some fields are informational and do not directly affect monitoring outcomes
- Account visibility does not mean Drata can enforce access

Drata reflects what it observes from the provider and preserves that information for compliance and audit purposes.

## Related articles

- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 9: Production Code Changes Restricted](test-9-production-code-changes-restricted.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)

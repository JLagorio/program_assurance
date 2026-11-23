# Test 9: Production Code Changes Restricted

Source: https://help.drata.com/en/articles/4777024-test-9-production-code-changes-restricted
Collection: Monitoring Test Guidance
Updated: 2026-09-29
Fetched: 2026-11-22
Description: Drata pulls a list of all of the authorized users with access to merge code to the default branch of a code repository in version control.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Production Code Changes Restricted** control. It ensures that only authorized company personnel can push or make changes to production code, maintaining the integrity of your codebase

## WHAT TO DO IF A TEST FAILS

If Drata finds users, with merge access to the default branch of your version control system repositories, that are not authorized by the company in Drata the test will fail. With a failed test you will receive a list of unauthorized users that have merge access rights.

To remediate a failed test, you will need to review the users within your version control system and ensure that these are authorized within Drata to write to default branches. This can be done by either enabling the respective flag for the user within Drata, confirming that the user should have merge access to the default branch, or revoking the user's access in the version control system.

## STEPS TO REMEDIATE

To verify these permissions, Drata evaluates **each repository for every user**.

- You can also query the **Drata Public API** (specifically the `/v1/managed-accounts/version-control` endpoint) to confirm which repositories a user has administrative or merge access to.
- If a user is identified as having merge access and this is authorized for their role, you must navigate to the **'Version Control'** page (under Connections) and switch the **'Merge to Default'** toggle to **ON**. This tells Drata that the access is expected and prevents the test from failing."

1. Log in to Drata as an Admin
2. Ensure that the appropriate IDP, Infrastructure, and Version Control providers are connected.
3. For Version Control accounts that have access to merge into the default branch:
   - Navigate to the Controls page
   - Select the Version Control page
   - Scroll to the Merge to default branch column and toggle on.

## Common Configuration Scenarios

Use the table below to understand how your GitHub branch protections and Drata user settings work together to determine a Pass or Fail result.

### Scenario 1: GitHub ruleset with update restrictions

This scenario describes the configuration required for a passing result when using modern GitHub rulesets. For Drata to validate this protection, the ruleset must be actively enforced and specifically restrict updates to the primary branch.

**Configuration requirements**

To satisfy the requirements for this scenario, configure your GitHub repository with the following settings:

- **Enforcement status**: Set the ruleset to **Active**. Rulesets in "Evaluate" or "Disabled" mode will not satisfy the test.
- **Target branch**: Define the target as the **Default Branch** (typically `main` or `master`).
- **Update restrictions**: Select the **Restrict updates** check box. This setting ensures that only authorized changes can be made to the branch, which is the specific telemetry Drata's sync process identifies.
- **Legacy protections**: Turn off any classic branch protection rules for this repository. This ensures that Drata’s evaluation is based solely on the modern ruleset configuration.

**Technical validation**

Before running the test in Drata, you can verify the configuration in GitHub:

1. Open a pull request targeting the default branch.
2. Confirm that the **Merge** button is unavailable for users who do not have explicit bypass permissions. If the button is active for standard "Write" access users, the ruleset is not correctly restricting updates.

**Test result**

- **Expected status**: **Pass** ✅
- **Technical logic**: Drata identifies the active ruleset and detects the **Restrict updates** attribute. Because the default branch is protected against unauthorized modifications, the repository meets the "Production code changes restricted" compliance criteria.
- **Visibility Note**: If your GitHub environment meets these technical requirements but the test continues to fail, contact Drata Support. An internal configuration may be required to enable visibility for modern GitHub rulesets on your account.

### Scenario 2: Legacy Branch Protection and bypass access users with merge to default branch enabled on drata

This scenario demonstrates how a passing result is achieved using classic branch protection rules when specific users require bypass permissions. In this case, the test passes because the access is explicitly authorized within the Drata platform.

**Configuration requirements**

To satisfy the requirements for this scenario, the following settings are applied in GitHub:

- **Protection type**: Use **Classic branch protection** rules (not rulesets).
- **Target branch**: Apply the rule to the **Default branch**.
- **Push restrictions**: In the GitHub repository settings, navigate to the **Restrict pushes** section (labeled as "Restrict who can push to protected branches"). Ensure this is enabled for specific people, teams, or apps.
- **Bypass access**: By default, GitHub administrators and specifically added users can bypass these restrictions. Confirm that the **Merge** button is enabled for these authorized users.

**Drata configuration**

To ensure the test passes for users with bypass access:

1. Sign in to **Drata** as an administrator.
2. Navigate to **Connections** > **Version Control**
3. Locate the administrators or users with write access who have bypass permissions in GitHub.
4. Set the **Merge to default branch** toggle to **On**.

**Technical validation**

You can verify the configuration in GitHub before running the sync:

- Create a pull request to the default branch using a standard user account. Confirm that the **Merge** button is disabled.
- Create a pull request using an administrator account. Confirm that the **Merge** button is enabled.

### Scenario 3: No Protection and users with write access have merge to default branch enabled on drata

This scenario demonstrates a configuration that achieves a passing result through manual authorization within the Drata platform. This approach is used when an organization does not have technical branch protections configured in GitHub but chooses to formally approve the users who have merge access.

**Configuration requirements**

To replicate this scenario, the following settings are applied in GitHub:

- **Remove rulesets**: Ensure no active branch rulesets are applied to the repository.
- **Remove classic protections**: Delete or disable all classic branch protection rules for the **Default branch**.
- **Access levels**: Maintain existing **Admin** or **Write** permissions for the relevant users.

**Drata configuration**

To ensure the test passes when GitHub protections are absent:

1. Sign in to **Drata** as an administrator.
2. Navigate to **Connections** > **Version Control** > **Manage accounts**.
3. Locate the users identified with **Admin** or **Write** access to the repository.
4. Set the **Merge to default branch** toggle to **On**. This action serves as your formal documentation that these users are authorized to merge code to the production branch.

**Technical validation**

You can verify the state of the repository in GitHub before running the test:

- Open a pull request targeting the default branch.
- Confirm that the **Merge** button is enabled for all users with write access. This indicates that GitHub is not technically restricting code changes.

**Test result**

- **Expected status**: **Pass** ✅
- **Technical logic**: When Drata detects that a repository has no branch protections, it identifies all users with merge capabilities. Usually, this would result in a failure. However, because you have manually enabled the **Merge to default branch** toggle, Drata recognizes these users as "Authorized." The test passes because the access is explicitly documented as expected within the Drata platform.

### Scenario 4: Concurrent ruleset and classic branch protection

This scenario illustrates how Drata evaluates repositories that utilize both modern GitHub rulesets and classic branch protection rules simultaneously. A passing result is achieved because the default branch is secured by multiple layers of enforcement.

**Configuration requirements**

To replicate this scenario, apply the following settings in GitHub:

- **Ruleset configuration**: Create a branch ruleset with the enforcement status set to **Active**. Ensure the ruleset targets the **Default branch** and that the **Restrict updates** check box is selected.
- **Classic protection configuration**: Configure a classic branch protection rule for the same **Default branch**.
- **Access levels**: Identify users or teams with merge permissions. Users with bypass permissions in GitHub will maintain the ability to merge even with these rules active.

**Technical validation**

You can verify the state of the repository in GitHub before running the test:

1. Open a pull request targeting the default branch.
2. Confirm that the **Merge** button is disabled for users without bypass permissions.

**Test result**

- **Expected status**: **Pass** ✅
- **Technical logic**: Drata detects that the default branch is protected by both a modern ruleset and classic branch protection. The test passes because the presence of the **Restrict updates** attribute in the ruleset satisfies the security requirement. Drata recognizes the branch is effectively secured by redundant layers of protection.

## Causes of test failures

The following list identifies the common reasons why Test 9 might fail.

**GitHub configuration:**

- **Missing update restrictions**: You have a GitHub ruleset active, but the **Restrict updates** check box is unselected. Drata requires this specific setting to verify that code changes are restricted.
- **Ruleset enforcement status**: The ruleset is set to **Evaluate** or **Disabled** mode. Only rulesets with an **Active** status provide the enforcement telemetry needed to pass the test.
- **Incorrect branch targeting**: The ruleset or classic branch protection rule targets a non-production branch (such as `develop` or `feature/*`) instead of the **Default branch**.
- **Missing classic protections**: No classic branch protection rules are active, and no modern rulesets have been configured to take their place.

**Drata configuration:**

- **Unauthorized bypass access**: Users or administrators have "Bypass" or "Push" access in GitHub’s classic branch protection settings, but their **Merge to default branch** toggle is set to **Off** in Drata.
- **Unprotected "Write" access**: A repository has no branch protections, and users with **Write** access, who are elevated to **Admin** status by Drata for security purposes, have not been toggled to **On** in the Drata platform.
- **Stale permissions**: A user who was previously authorized in Drata still has merge access in GitHub, but their role has changed and they should no longer have these permissions.

**Technical sync and visibility:**

- **Ruleset visibility settings**: Your GitHub Rulesets are configured correctly, but the advanced visibility feature has not been enabled for your Drata account. In this case, Drata cannot "see" the ruleset metadata, resulting in a false failure.
- **Delayed synchronization**: Changes made in GitHub (such as enabling a ruleset or removing a user) have not yet synced with Drata. You may need to wait for the next automated sync or trigger a manual refresh to update the test results.

**How to address a failure: **

If your test fails, review the **Unauthorized Users** list provided in the test results. For each user listed, you must either:

1. **Restrict access in GitHub**: Apply a ruleset with **Restrict updates** enabled or remove the user's write permissions.
2. **Authorize access in Drata**: Navigate to **Connections > Version Control** and set the **Merge to default branch** toggle to **On** for that user.

> **Note: **Drata may encounter blockers reading certain repos and their collaborators. In these cases, in addition to the `pass` and `fail` arrays in the raw results JSON of the test, a third `unreachable` array will be included listing which repos could not be read and why.

## Related articles

- [GitHub Integration Guide](github-integration-guide.md)
- [Test 8: Formal Code Review Process](test-8-formal-code-review-process.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)
- [GitHub Rulesets](github-rulesets.md)
- [Manage connected version control](manage-connected-version-control.md)

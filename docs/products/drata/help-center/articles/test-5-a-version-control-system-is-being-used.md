# Test 5: A Version Control System is being Used

Source: https://help.drata.com/en/articles/4776883-test-5-a-version-control-system-is-being-used
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company version control system to determine if it is in fact being used.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Version Control System **control that ensures your company uses a version control system to manage source code, documentation, release labeling, and other change management tasks. Access to the version control system must also be approved by a system admin.

**WHAT TO DO IF A TEST FAILS**

If your company is not using a version control tool or does not have it connected to Drata, the test will fail when we try to reach it via API.

To remediate a failed test, you will need to make sure that your version control tool has been successfully linked to Drata.

**STEPS TO REMEDIATE**

1. Log in to Drata as an admin
2. Navigate to the Connections Panel (account-settings/connections)
3. Connect a version control provider

**HELPFUL RESOURCES**

- [What is version control?](https://www.atlassian.com/git/tutorials/what-is-version-control)
- [Using Git for version control](https://git-scm.com/)
- [Using CVS for version control](https://www.nongnu.org/cvs/)

## Related articles

- [Test 13: System Access Control Policy](test-13-system-access-control-policy.md)
- [Test 94: Version Control Accounts Removed Properly](test-94-version-control-accounts-removed-properly.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)
- [Test: Termination Process and Checklist](test-termination-process-and-checklist.md)

# Test 7: Only Authorized Employees Change Code

Source: https://help.drata.com/en/articles/4778497-test-7-only-authorized-employees-change-code
Collection: Monitoring Test Guidance
Updated: 2026-09-29
Fetched: 2026-11-22
Description: Drata uses OAuth to access your company's Identity Provider (IdP) and version control system to ensure only authorized users change code.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Only Authorized Employees Change Code **control that ensures your company version control system only allows approved employees to make changes to code on a branch in which they have approval rights.

The test works by cross-referencing write-access permissions in your VCS with your organization’s Identity Provider (IdP). It ensures that only approved individuals with push permissions or roles such as Developer, Maintainer, or Owner have write access to your repositories.

**WHAT TO DO IF A TEST FAILS**

If Drata finds users with write access to your version control system that are not current employees/contractors the test will fail. With a failed test you will receive a list of users within your version control system that have write access but do not appear to have matching company accounts.

The system cross-references the list of users with write access to their corresponding records in the organization's Identity Provider (IdP). This ensures that only authorized personnel are validated.

To remediate a failed test, you will need to either create IdP accounts for these version control system users or revoke their write access to the version control system repositories. For example, in Bitbucket, log in as an admin, navigate to the user management for the project, and adjust or revoke write access permissions as necessary.

**STEPS TO REMEDIATE**

On Version Control Provider

If you encounter intermittent test failures such as 503 Service Unavailable errors, consider troubleshooting as follows: retry after a short interval, check your VCS service's status page, and schedule test retriggers outside access review sync windows.

1. Log in as an admin
2. Navigate to your project(s)
3. Navigate to your user(s)
4. Verify user privileges for all accounts.

On Drata

1. Navigate to the 'Manage Account' page for your Version Control provider
2. Ensure that the 'write' access flag is enabled

**Note: **

- By default, any user in the 'Developer/Maintainer/Owner' category will be reflected on the list in Drata. Users in the 'Guest/Reporter' category will not be reflected.
- If using Bitbucket, ensure to navigate to the "Manage Accounts" section and enable the "write access" flag to evaluate user permissions accurately.
- Additionally, the test evaluates only write/merge permissions and not PR approval workflows, which are handled under the Formal Code Review Process test.
- Drata may encounter blockers reading certain repos and their collaborators. In these cases, in addition to the `pass` and `fail` arrays in the raw results JSON of the test, a third `unreachable` array will be included listing which repos could not be read and why.

## Related articles

- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 9: Production Code Changes Restricted](test-9-production-code-changes-restricted.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)

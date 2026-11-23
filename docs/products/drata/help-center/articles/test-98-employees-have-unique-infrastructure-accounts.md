# Test 98: Employees have Unique Infrastructure Accounts

Source: https://help.drata.com/en/articles/4777045-test-98-employees-have-unique-infrastructure-accounts
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata accesses your company infrastructure provider to determine if each account matches to an identity from the company's IdP.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Unique Accounts Used **control that ensures a unique ID is required to access the corporate network, production machines, network devices, and support tools.

**WHAT TO DO IF A TEST FAILS**

If Drata finds accounts with access to your infrastructure that are not matched to individuals within your organization the test will fail. With a failed test you will receive a list of infrastructure identities that are not unique and/or have not been successfully mapped to individuals in your organization.

To remediate a failed test you will need to navigate to the "Manage Accounts Page" and link these accounts to the correct personnel.

**STEPS TO REMEDIATE**

1. Log in to Drata as an admin
2. Ensure that your IDP, Infrastructure, and Version Control providers are connected
3. Navigate to the Connections page, and click the Manage Accounts button for your Infrastructure system
   1. You can also navigate directly to /manage-accounts/infrastructure
4. Link all users to employee accounts, or use the gear icon at the far right to mark them as out of scope (i.e. service accounts)

## Related articles

- [Test 96: Employees have Unique Email Accounts](test-96-employees-have-unique-email-accounts.md)
- [Test 95: Infrastructure Accounts Properly Removed](test-95-infrastructure-accounts-properly-removed.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 124: Root Infrastructure Account Unused](test-124-root-infrastructure-account-unused.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)

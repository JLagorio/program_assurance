# Test 97: Employees have Unique Version Control Accounts

Source: https://help.drata.com/en/articles/4777042-test-97-employees-have-unique-version-control-accounts
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata accesses your company version control system to determine if each account matches to an identity from the company's IdP.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Unique Accounts Used **control that ensures a unique ID is required to access the corporate network, production machines, network devices, and support tools.

**WHAT TO DO IF A TEST FAILS**

If Drata finds accounts with access to your version control system that are not matched to individuals within your organization the test will fail. With a failed test you will receive a list of version control identities that are not unique and/or have not been successfully mapped to individuals in your organization.

To remediate a failed test you will need to navigate to the "[Managed Accounts Page](https://help.drata.com/en/articles/4673981-manage-and-link-connected-version-control-accounts)" and link these accounts to the correct personnel.

**STEPS TO REMEDIATE**

1. Log in to Drata as an admin
2. Ensure that your IDP, Infrastructure, and Version Control providers are connected
3. Navigate to the Connections page, and click the Manage Accounts button for your Version Control system
   1. You can also navigate directly to /manage-accounts/version-control
4. Link all users to employee accounts, or use the gear icon at the far right to mark them as out of scope (i.e. service accounts)

## Related articles

- [Test 96: Employees have Unique Email Accounts](test-96-employees-have-unique-email-accounts.md)
- [Test 5: A Version Control System is being Used](test-5-a-version-control-system-is-being-used.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)

# Test 6: Only Authorized Employees Access Version Control

Source: https://help.drata.com/en/articles/4778488-test-6-only-authorized-employees-access-version-control
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata uses OAuth to access your company's Identity Provider and version control system ensuring access is permitted correctly.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the Version Control Can Only Be Accessed By Authorized Employees control that ensures all users of your company version control system are authenticated with their company accounts.

**WHAT TO DO IF A TEST FAILS**

If Drata finds users within your version control system that are not reflected via their company accounts the test will fail. With a failed test you will receive a list of users within your version control system that do not have a matching company account.

To remediate a failed test, you will need to either create IdP accounts for these version control system users or revoke access for these users. In the event that users do not have their company email attached to their version control account you will need to notify them to properly associate their company account.

**STEPS TO REMEDIATE**

1. Log in to Drata as an admin
2. Ensure that your IDP, Infrastructure, and Version Control providers are connected
3. Navigate to the Personnel page
4. Link Version Control accounts to your users or mark them as service accounts.

## Related articles

- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 5: A Version Control System is being Used](test-5-a-version-control-system-is-being-used.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)

# Test 96: Employees have Unique Email Accounts

Source: https://help.drata.com/en/articles/4776863-test-96-employees-have-unique-email-accounts
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata uses its synchronized account delegation with your Identity Provider to verify ownership and authenticity of listed accounts.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Unique Accounts Used **control that ensures a unique ID is required to access the corporate network, production machines, network devices, and support tools.

**WHAT TO DO IF A TEST FAILS**

If Drata finds an email account provisioned for a bot or alias Drata will mark the account status as "unknown" and the test will fail. With a failed test you will receive a list of email identities that are not unique and/or have been flagged as "unknown".

To remediate a failed test you will either need to navigate to the "Personnel Page" and update the status of all users that have been flagged as "unknown".

## Related articles

- [Test 86: MFA on Identity Provider](test-86-mfa-on-identity-provider.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)

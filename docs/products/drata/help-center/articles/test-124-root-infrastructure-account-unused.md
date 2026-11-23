# Test 124: Root Infrastructure Account Unused

Source: https://help.drata.com/en/articles/4777051-test-124-root-infrastructure-account-unused
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company infrastructure provider configurations to determine if the Root account is unused.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Root Infrastructure Account Unused **control that ensures your company does not use Root Account on its Infrastructure provider.

**WHAT TO DO IF A TEST FAILS**

If Drata detects that the Root Account is being used at least twice in the most recent seven days (as a rolling lookback) for a login attempt the test will fail. The login attempt does not have to be successful.

To remediate a failed test, you need to wait for a seven-day lookback period to only find a maximum of one login attempt. In general, [AWS recommends](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html) that you avoid using the root login for day-to-day activities. You will need to configure specific user accounts for any humans that need access and grant restrictive access via roles to only the resources they need.

## Related articles

- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](test-4-ssl-tls-on-admin-page-of-infrastructure-console.md)
- [Test 88: MFA on Infrastructure Console](test-88-mfa-on-infrastructure-console.md)
- [Test 95: Infrastructure Accounts Properly Removed](test-95-infrastructure-accounts-properly-removed.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 123: Cloud Infrastructure Linked to Drata](test-123-cloud-infrastructure-linked-to-drata.md)

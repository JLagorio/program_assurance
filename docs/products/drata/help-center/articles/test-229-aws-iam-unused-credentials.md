# Test 229: AWS IAM Unused Credentials

Source: https://help.drata.com/en/articles/9828680-test-229-aws-iam-unused-credentials
Collection: Monitoring Test Guidance
Updated: 2024-11-19
Fetched: 2026-11-22
Description: Drata validated that all credentials (e.g., passwords, access keys) for IAM users have been used within the last 45 days.

## Article text

Drata validates whether there are credentials (e.g., passwords, access keys) for IAM users that have not been used in over 45 days.

AWS IAM users can access AWS resources using different types of credentials, such as passwords or access keys. It is recommended that all credentials that have been unused in 45 or greater days be deactivated or removed.

Disabling or removing unnecessary credentials will reduce the window of opportunity for credentials associated with a compromised or abandoned account to be used.

## ASSOCIATED DRATA CONTROL

This test is part of the** Inactive User Accounts Removed **control (DCF-335). Drata validates whether there are credentials (e.g., passwords, access keys) for IAM users that have not been used in over 45 days.

## WHAT TO DO IF A TEST FAILS

If Drata detects that it appears that there are active credentials (e.g., passwords, access keys) for IAM users that have not been used within the last 45 days, your test will fail. To remediate a failed test:

Perform the following to manage unused passwords (IAM user console access):

1. Login to the AWS Management Console.
2. Click Services > IAM > Users > Security Credentials.
3. Select the user whose 'Console last sign-in' is greater than 45 days.
4. Click 'Security credentials'.
5. In section 'Sign-in credentials, Console password' click 'Manage'.
6. Under 'Console Access' select 'Disable' and apply these changes.

Perform the following to deactivate unused access keys:

1. Login to the AWS Management Console.
2. Click Services > IAM > Users > Security Credentials.
3. Select any access keys that are over 45 days old and that have been used and make them inactive.
4. Select any access keys that are over 45 days old and that have not been used and delete them.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 214: MFA for AWS Root Account](test-214-mfa-for-aws-root-account.md)
- [Test 215: AWS IAM Password Minimum Length](test-215-aws-iam-password-minimum-length.md)
- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)

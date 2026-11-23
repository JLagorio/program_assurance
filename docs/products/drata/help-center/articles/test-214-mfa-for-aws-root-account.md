# Test 214: MFA for AWS Root Account

Source: https://help.drata.com/en/articles/9828711-test-214-mfa-for-aws-root-account
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that multi-factor authentication (MFA) is enabled for the root user account in AWS.

## Article text

Drata validates that multi-factor authentication (MFA) is enabled for the root user account in AWS.

The 'root' user account is the most privileged user in an AWS account. Multi-factor authentication (MFA) adds an extra layer of protection on top of a username and password. With MFA enabled, when a user signs in to an AWS website, they will be prompted for their username and password as well as for an authentication code from their AWS MFA device.

Enabling MFA provides increased security for console access as it requires the authenticating principal to possess a device that emits a time-sensitive key and have knowledge of a credential.

## ASSOCIATED DRATA CONTROL

This test is part of the **Root Infrastructure Account Monitored** control (DCF-90).

## WHAT TO DO IF A TEST FAILS

If Drata finds that MFA is not enabled for the root user account in AWS, the test will fail.

**STEPS TO REMEDIATE**

1. Sign into AWS with the root account credentials and activate a virtual MFA from your dashboard, under 'Security Status'.
2. IAM will generate and display a QR code that represents the secret configuration key.
3. Open your virtual MFA application and use the app to scan the QR code or manually input the secret configuration key into your MFA application (you can find the secret key configuration from the 'Manage MFA Device' wizard and selecting 'Show secret key for manual configuration').

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 86: MFA on Identity Provider](test-86-mfa-on-identity-provider.md)
- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 225: Hardware MFA for AWS Root Account](test-225-hardware-mfa-for-aws-root-account.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)

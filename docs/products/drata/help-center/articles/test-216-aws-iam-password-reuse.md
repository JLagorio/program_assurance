# Test 216: AWS IAM Password Reuse

Source: https://help.drata.com/en/articles/9828717-test-216-aws-iam-password-reuse
Collection: Monitoring Test Guidance
Updated: 2024-10-29
Fetched: 2026-11-22
Description: Drata validates that AWS IAM password policy is configured to prevent reuse of any of the last 24 passwords.

## Article text

Drata validates that AWS IAM password policy is configured to prevent reuse of any of the last 24 passwords. IAM password policies can prevent the reuse of a given password by the same user. It is recommended that the password policy prevent the reuse of passwords.

Preventing password reuse increases account resiliency against brute force login
attempts.

## ASSOCIATED DRATA CONTROL

This test is part of the **Password History Enforcement **control (DCF-350) that ensures system configuration settings are in place to prevent password reuse in accordance with company policy and compliance requirements.

## WHAT TO DO IF A TEST FAILS

If Drata finds that the current AWS IAM password policy configurations are not set to prevent the use of any of the last 24 passwords, the test will fail.

**STEPS TO REMEDIATE**

1. Login to AWS Console (with appropriate permissions to View Identity Access Management Account Settings).
2. Go to IAM Service on the AWS Console.
3. Click on Account Settings on the left pane.
4. Check 'Prevent password reuse'.
5. Set 'Number of passwords to remember' to 24.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 229: AWS IAM Unused Credentials](test-229-aws-iam-unused-credentials.md)
- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 217: AWS IAM Group-Based Access Control](test-217-aws-iam-group-based-access-control.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 215: AWS IAM Password Minimum Length](test-215-aws-iam-password-minimum-length.md)

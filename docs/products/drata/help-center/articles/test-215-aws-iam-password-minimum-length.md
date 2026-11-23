# Test 215: AWS IAM Password Minimum Length

Source: https://help.drata.com/en/articles/9828716-test-215-aws-iam-password-minimum-length
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that the AWS IAM password policy requires a minimum length of 14 characters or greater.

## Article text

Drata validates that the AWS IAM password policy requires a minimum length of 14 characters or greater.

Password policies are, in part, used to enforce password complexity requirements. IAM password policies can be used to ensure passwords are at least a given length. It is recommended that the password policy require a minimum password length 14.

Setting a password complexity policy increases account resiliency against brute force login attempts.

## ASSOCIATED DRATA CONTROL

This test is part of the **Minimum Strong Password Requirements** control (DCF-346) and** Password Policy and Configuration** (DCF-68). Minimum password requirements are enforced on system components including a minimum length of 12 characters (or if the system does not support 12 characters, a minimum length of eight characters) and complexity requirements to include both numbers and letters. Password Policy and Configuration control ensures that your company has a documented policy outlining the minimum requirements for passwords used for authentication to organizational systems. Password requirements are enforced for all systems in accordance with company policy.

## WHAT TO DO IF A TEST FAILS

If Drata finds that the current AWS IAM password policy configurations are set for fewer than 14 characters, the test will fail.

**STEPS TO REMEDIATE**

1. Login to AWS Console (with appropriate permissions to View Identity Access Management Account Settings).
2. Go to IAM Service on the AWS Console.
3. Click on Account Settings on the left pane.
4. Set 'Minimum password length' to 14 or greater.
5. Click 'Apply password policy'.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 229: AWS IAM Unused Credentials](test-229-aws-iam-unused-credentials.md)
- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 217: AWS IAM Group-Based Access Control](test-217-aws-iam-group-based-access-control.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)

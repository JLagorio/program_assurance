# Test 217: AWS IAM Group-Based Access Control

Source: https://help.drata.com/en/articles/9828704-test-217-aws-iam-group-based-access-control
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that IAM users are granted permissions only through groups and no users with inline policy or direct policy attachments.

## Article text

Drata validates that IAM users are granted permissions only through groups and that there are no users with in line policy or direct policy attachments.

IAM users are granted access to services, functions, and data through IAM policies.

Assigning IAM policy only through groups unifies permissions management to a single, flexible layer consistent with organizational functional roles. By unifying permissions management, the likelihood of excessive permissions is reduced.

## ASSOCIATED DRATA CONTROL

This test is part of the **Principle of Least Privilege** control (DCF-776) that ensures your company assigns permissions through groups or roles based on the principle of least privilege and limits the use of wild-card permissions or broad-access patterns.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there are AWS IAM users with an inline policy or direct policy attachment, the test will fail. Assigning IAM policy only through groups unifies permissions management to a single, flexible layer consistent with organizational functional roles. By unifying permissions management, the likelihood of excessive permissions is reduced.

**STEPS TO REMEDIATE**

1. Create an IAM group and assign policies to it based on the principle of least privilege.
2. Add failing users to the IAM group.
3. Remove the direct association between the AWS IAM users and the access policies for the failing users who had inline policy or direct policy attachments.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 229: AWS IAM Unused Credentials](test-229-aws-iam-unused-credentials.md)
- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 215: AWS IAM Password Minimum Length](test-215-aws-iam-password-minimum-length.md)
- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)

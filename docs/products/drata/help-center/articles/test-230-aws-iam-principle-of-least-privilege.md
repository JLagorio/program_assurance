# Test 230: AWS IAM Principle of Least Privilege

Source: https://help.drata.com/en/articles/9828707-test-230-aws-iam-principle-of-least-privilege
Collection: Monitoring Test Guidance
Updated: 2026-07-20
Fetched: 2026-11-22
Description: In this article, you learn how Drata validates that AWS IAM policies follow the principle of least privilege and how to remediate policies that allow broad access.

## Article text

Drata validates that AWS IAM policies that allow broad access patterns or wild-card permissions (e.g., '*') are not used.

IAM policies are the means by which privileges are granted to users, groups, or roles. It is recommended and considered standard security advice to grant least privilege—that is, granting only the permissions required to perform a task. Determine what users need to do and then craft policies for them that let the users perform only those tasks, instead of allowing full administrative privileges.

It's more secure to start with minimum permissions and add more as needed, rather than starting with broad permissions and restricting them later.

## ASSOCIATED DRATA CONTROL

This test is part of the **Principle of Least Privilege** control (DCF-776) that ensures your company assigns permissions through groups or roles based on the principle of least privilege and limits the use of wild-card permissions or broad-access patterns.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there are AWS IAM policies that allow broad access patterns or wild-card permissions, the test will fail. Providing full administrative privileges instead of restricting to the minimum set of permissions that the user is required to do exposes the resources to potentially unwanted actions.

### STEPS TO REMEDIATE

1. Sign in to the AWS Management Console and open the IAM Console.
2. In the navigation pane, click **Policies** and then search for the names of failing policies.
3. Before deleting the failing policies, detach all users, groups, and roles from each failing policy.
4. Delete each newly detached policy.

If the flagged policy is the AWS-managed `AdministratorAccess` policy (example: `arn:aws:iam::aws:policy/AdministratorAccess`), keep the test enabled and exclude only the finding tied to that policy in Drata. To do this, go to Monitoring, select the failed test, open the Findings tab, and exclude the resources tied to the `AdministratorAccess` policy.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 229: AWS IAM Unused Credentials](test-229-aws-iam-unused-credentials.md)
- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 217: AWS IAM Group-Based Access Control](test-217-aws-iam-group-based-access-control.md)
- [Test 215: AWS IAM Password Minimum Length](test-215-aws-iam-password-minimum-length.md)
- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)

# Test 232: AWS IAM Access Key Rotation

Source: https://help.drata.com/en/articles/9828694-test-232-aws-iam-access-key-rotation
Collection: Monitoring Test Guidance
Updated: 2026-07-22
Fetched: 2026-11-22
Description: Drata validated that all AWS IAM access keys have a key age of less than 90 days.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the Credentials Rotation control (DCF-783) that ensures your company has implemented processes to change credentials (secrets, access keys, API keys, etc.) periodically based on a defined schedule.

Access keys consist of an access key ID and secret access key, which are used to sign programmatic requests that you make to AWS. AWS users need their own access keys to make programmatic calls to AWS from the AWS Command Line Interface (AWS CLI), Tools for Windows PowerShell, the AWS SDKs, or direct HTTP calls using the APIs for individual AWS services. It is recommended that all access keys be regularly rotated.

Rotating access keys will reduce the window of opportunity for an access key that is associated with a compromised or terminated account to be used. Access keys should be rotated to ensure that data cannot be accessed with an old key which might have been lost, cracked, or stolen.

## WHAT TO DO IF A TEST FAILS

Drata validates that AWS IAM access keys have a 'key age' of less than 90 days. If it appears that there are AWS IAM access keys older than 90 days, then your test will fail.

**STEPS TO REMEDIATE**

1. Go to the AWS Management Console.
2. Click on Users > Security Credentials.
3. Delete, or make inactive, the keys that have not been rotated in 90 days.
4. Click on 'Create Access Key'.
5. Update programmatic call with the new Access Key credentials.

> **Note: **Drata uses [AWS' IAM Credential Report](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html) to power this test, and that report is only refreshed every four hours on AWS’s side:
>
> *`"You can generate a credential report as often as once every four hours. When you request a report, IAM first checks whether a report for the AWS account has been generated within the past four hours. If so, the most recent report is downloaded. If the most recent report for the account is older than four hours, or if there are no previous reports for the account, IAM generates and downloads a new report."`*
>
> If you delete an old access key in AWS, you may need to wait up to four hours before AWS will publish a new report for Drata's test to read.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 229: AWS IAM Unused Credentials](test-229-aws-iam-unused-credentials.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 215: AWS IAM Password Minimum Length](test-215-aws-iam-password-minimum-length.md)
- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)
- [Test 223: AWS CMK Rotation](test-223-aws-cmk-rotation.md)

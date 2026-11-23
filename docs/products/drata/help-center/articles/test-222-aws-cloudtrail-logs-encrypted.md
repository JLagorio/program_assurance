# Test 222: AWS CloudTrail Logs Encrypted

Source: https://help.drata.com/en/articles/9828725-test-222-aws-cloudtrail-logs-encrypted
Collection: Monitoring Test Guidance
Updated: 2025-02-12
Fetched: 2026-11-22
Description: Drata validates that AWS CloudTrail logs are encrypted at rest using AWS KMS customer created master keys (CMKs).

## Article text

Drata validates that AWS CloudTrail logs are encrypted at rest using AWS KMS customer created master keys (CMKs). AWS CloudTrail is a web service that records AWS API calls for an account and makes those logs available to users and resources in accordance with IAM policies. AWS Key Management Service (KMS) is a managed service that helps create and control the encryption keys used to encrypt account data, and uses Hardware Security Modules (HSMs) to protect the security of encryption keys. CloudTrail logs can be configured to leverage server side encryption (SSE) and KMS customer created master keys (CMK) to further protect CloudTrail logs. It is recommended that CloudTrail be configured to use SSE-KMS.

Configuring CloudTrail to use SSE-KMS provides additional confidentiality controls on log data as a given user must have S3 read permission on the corresponding log bucket and must be granted decrypt permission by the CMK policy.

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption at Rest** control (DCF-54) that ensures data at rest is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that CloudTrail is not configured to be encrypted at rest using KMS CMKs, the test will fail. CloudTrail logs can be configured to leverage server side encryption (SSE) and KMS customer created master keys (CMK) to further protect CloudTrail logs. It is recommended that CloudTrail be configured to use SSE-KMS. Configuring CloudTrail to use SSE-KMS provides additional confidentiality controls on log data as a given user must have S3 read permission on the corresponding log bucket and must be granted decrypt permission by the CMK policy.

**STEPS TO REMEDIATE**

Note: Repeat for all Trails failing this test.

1. Sign in to the AWS Management Console and open the [CloudTrail console](https://us-west-2.console.aws.amazon.com/cloudtrailv2/home).
2. In the left navigation pane, choose 'Trails' and select a Trail that's failing this test.
3. Under the 'General Details' section, click the 'Edit' button.
4. Select the Enabled option for Log file SSE-KMS encryption.
5. Select an existing CMK from the 'KMS key Id' drop-down menu and click 'Save'.
   - Note: Ensure the CMK is located in the same region as the S3 bucket. You will need to apply a KMS Key policy on the selected CMK in order for CloudTrail as a service to encrypt and decrypt log files using the CMK provided.
6. You will see a notification message stating that you need to have decrypt permissions on the specified KMS key to decrypt log files.
7. Click 'Yes'.

For more information, go to AWS's [Update a trail to use a KMS key](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/create-kms-key-policy-for-cloudtrail-update-trail.html) documentation.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 223: AWS CMK Rotation](test-223-aws-cmk-rotation.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
- [Test 205: CloudTrail log file integrity validation enabled](test-205-cloudtrail-log-file-integrity-validation-enabled.md)

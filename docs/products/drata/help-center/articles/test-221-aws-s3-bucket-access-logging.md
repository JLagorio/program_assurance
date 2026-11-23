# Test 221: AWS S3 Bucket Access Logging

Source: https://help.drata.com/en/articles/9828721-test-221-aws-s3-bucket-access-logging
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that AWS S3 bucket access logging is enabled on the AWS CloudTrail S3 bucket.

## Article text

Drata validates that AWS S3 bucket access logging is enabled on the AWS CloudTrail S3 bucket. S3 Bucket Access Logging generates a log that contains access records for each request made to your S3 bucket. An access log record contains details about the request, such as the request type, the resources specified in the request worked on, and the time and date the request was processed. It is recommended that bucket access logging be enabled on the CloudTrail S3 bucket.

By enabling S3 bucket logging on target S3 buckets, it is possible to capture all events which may affect objects within any target buckets. Configuring logs to be placed in a separate bucket allows access to log information which can be useful in security and incident response workflows.

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies.

## WHAT TO DO IF A TEST FAILS

If Drata finds that AWS S3 bucket access logging is disabled on the AWS CloudTrail S3 bucket, the test will fail.

**STEPS TO REMEDIATE**

1. Sign in to the AWS Management Console and open the S3 console.

2. Under **All Buckets**, select the S3 bucket that is failing this test.

3. Select the **Properties **in the top right of the console.

4. Under '`Bucket: <s3_bucket_for_cloudtrail>`' select **Logging**.

5. Configure bucket logging by selecting the **Enabled** checkbox, selecting the bucket from the list, entering a prefix.

6. Select Save.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Test 234: AWS S3 HTTP Requests Denied](test-234-aws-s3-http-requests-denied.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
- [Test 205: CloudTrail log file integrity validation enabled](test-205-cloudtrail-log-file-integrity-validation-enabled.md)

# Test 226: AWS S3 Object-Level Logging for Read & Write Events

Source: https://help.drata.com/en/articles/9828791-test-226-aws-s3-object-level-logging-for-read-write-events
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that object-level logging for read and write events is enabled for AWS S3 buckets.

## Article text

Drata validates that object-level logging for read and write events is enabled for AWS S3 buckets. S3 object-level API operations such as GetObject, DeleteObject, and PutObject are called data events. By default, CloudTrail trails don't log data events and so it is recommended to enable Object-level logging for S3 buckets.

Enabling object-level logging will help you meet data compliance requirements within your organization, perform comprehensive security analysis, monitor specific patterns of user behavior in your AWS account or take immediate actions on any object-level API activity within your S3 Buckets using Amazon CloudWatch Events.

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies.

## WHAT TO DO IF A TEST FAILS

If Drata finds that object-level logging for read and write events is not enabled for AWS S3 buckets, the test will fail.

### STEPS TO REMEDIATE

**Note**: Your AWS account must have **at least one CloudTrail trail** with **multi-region logging enabled** and **S3 object-level data events** configured to log **both read and write activity**.

1. From the AWS S3 dashboard, select an S3 bucket and click on 'Properties'.
2. In the AWS Cloud Trail data events' section, select the CloudTrail name for the recording activity.
3. You can choose an existing Cloudtrail or create a new one.
4. Once the CloudTrail is selected, select the 'Data Events' checkbox.
5. Select S3 from the 'Data Event Type' drop down and select 'Log All Events' from the log selector template drop down.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Test 234: AWS S3 HTTP Requests Denied](test-234-aws-s3-http-requests-denied.md)
- [Test 205: CloudTrail log file integrity validation enabled](test-205-cloudtrail-log-file-integrity-validation-enabled.md)

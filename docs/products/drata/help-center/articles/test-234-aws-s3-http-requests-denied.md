# Test 234: AWS S3 HTTP Requests Denied

Source: https://help.drata.com/en/articles/9828783-test-234-aws-s3-http-requests-denied
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that access policies for AWS S3 buckets are set to deny unencrypted, HTTP requests.

## Article text

Drata validates that access policies for AWS S3 buckets are set to deny unencrypted, HTTP requests. At the Amazon S3 bucket level, you can configure permissions through a bucket policy making the objects accessible only through HTTPS.

By default, Amazon S3 allows both HTTP and HTTPS requests. To achieve only allowing access to Amazon S3 objects through HTTPS you also have to explicitly deny access to HTTP requests. Bucket policies that allow HTTPS requests without explicitly denying HTTP requests will not comply with this recommendation.

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption in Transit **control (DCF-55) that ensures data in transit is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that AWS S3 bucket policies do not explicitly deny access to objects through unencrypted, HTTP requests, the test will fail. By default, Amazon S3 allows both HTTP and HTTPS requests. To achieve only allowing access to Amazon S3 objects through HTTPS, you also have to explicitly deny access to HTTP requests.

## STEPS TO REMEDIATE

1. From the AWS S3 console, select the checkbox next to the failing bucket(s).
2. Click on 'Permissions', then click on 'Bucket Policy'.
3. Add the following to the existing policy, also filling in the required information:
   ```
{
'Sid': '','Effect': 'Deny','Principal': '*','Action': 's3:*','Resource': 'arn:aws:s3:::/*','Condition': { 'Bool': { 'aws:SecureTransport': 'false' } } }
   ```
4. Save changes and repeat for all failing buckets

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 216: AWS IAM Password Reuse](test-216-aws-iam-password-reuse.md)
- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
- [Test 299: AWS Application Load Balancer Redirects HTTP to HTTPS](test-299-aws-application-load-balancer-redirects-http-to-https.md)

# CIS Foundation Benchmarks Available in Vanta

Source: https://help.vanta.com/en/articles/11345518-cis-foundation-benchmarks-available-in-vanta
Collection: Evidence Collection ; Evidence Collection › Tests
Fetched: 2026-11-17

## Article text

Feature availability: This article discusses CIS Benchmarks, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
CIS Benchmarks are a globally recognized best practice for securing IT systems and data. CIS features specific benchmarks for cloud platforms like AWS. Within Vanta, you can automate tests specific to the CIS AWS Foundation Benchmark. 
 
These tests work like all of Vanta’s other automated tests, continuously checking against your integrated tool (AWS in this instance) and the CIS Benchmark, alerting you when items need attention along the way. Vanta also supports CIS Benchmarks for Kubernetes <https://help.vanta.com/en/articles/11345523>.
 
CIS Foundation Benchmark tests are only available on Vanta’s Professional and Enterprise plans. You will see the tests automatically added if you have the SOC 2, ISO 27001, or CIS v8 frameworks
 

## CIS AWS Foundation Benchmark Tests
- 
Ensure no 'root' user account access key exists
- 
Ensure MFA is enabled for the 'root' user account
- 
Ensure IAM password policy requires minimum length of 14 or greater
- 
Ensure IAM password policy prevents password reuse
- 
Ensure multi-factor authentication (MFA) is enabled for all IAM users that have a console password
- 
Ensure credentials unused for 45 days or greater are disabled
- 
Ensure there is only one active access key available for any single IAM user
- 
Ensure access keys are rotated every 90 days or less
- 
Ensure IAM Users Receive Permissions Only Through Groups
- 
Ensure IAM policies that allow full "*:*" administrative privileges are not attached
- 
Ensure a support role has been created to manage incidents with AWS Support
- 
Ensure IAM instance roles are used for AWS resource access from instances
- 
Ensure that all the expired SSL/TLS certificates stored in AWS IAM are removed
- 
Ensure that IAM Access analyzer is enabled for all regions
- 
Ensure S3 Bucket Policy is set to deny HTTP requests
- 
Ensure that S3 Buckets are configured with 'Block public access (bucket settings)'
- 
Ensure EBS Volume Encryption is Enabled in all Regions
- 
Ensure that encryption-at-rest is enabled for RDS Instances
- 
Ensure Auto Minor Version Upgrade feature is Enabled for RDS Instances
- 
Ensure that public access is not given to RDS Instance
- 
Ensure that encryption is enabled for EFS file systems
- 
Ensure CloudTrail is enabled in all regions
- 
Ensure CloudTrail log file validation is enabled
- 
Ensure AWS Config is enabled in all regions
- 
Ensure S3 bucket access logging is enabled on the CloudTrail S3 bucket
- 
Ensure CloudTrail logs are encrypted at rest using KMS CMKs
- 
Ensure rotation for customer-created symmetric CMKs is enabled
- 
Ensure VPC flow logging is enabled in all VPCs
- 
Ensure that Object-level logging for write events is enabled for S3 bucket
- 
Ensure that Object-level logging for read events is enabled for S3 bucket
- 
Ensure AWS Security Hub is enabled
- 
Ensure no Network ACLs allow ingress from 0.0.0.0/0 to remote server administration ports
- 
Ensure no security groups allow ingress from 0.0.0.0/0 to remote server administration ports
- 
Ensure no security groups allow ingress from ::/0 to remote server administration ports
- 
Ensure the default security group of every VPC restricts all traffic
- 
Ensure that EC2 Metadata Service only allows IMDSv2

## Images

- none

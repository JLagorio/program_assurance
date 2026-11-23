# Common use cases for custom test

Source: https://help.drata.com/en/articles/9415618-common-use-cases-for-custom-test
Collection: Understand the Drata Platform › Monitoring › Custom Tests
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn the most common use cases for creating custom tests

## Article text

You can create customizable tests so that you can automate gathering evidence and monitoring your systems for your unique compliance program. Custom tests provides service coverage for [AWS](aws-resource-permissions.md), GCP, and Azure. All tests are thoroughly documented to ensure your auditors have a clear understanding of your tests. 

Here are some common and popular use cases for custom tests:

- Create custom tests and map our pre-built Drata controls to monitor your organization’s unique compliance needs.
- Create custom tests to automate the monitoring of controls that were manually monitored.
- Create custom tests to automate the monitoring of your custom security and compliance controls.

To get started, view the [Create Custom Test](part-3-create-run-and-map-a-custom-test.md) article for step-by-step instructions.

## Create and map custom test to DCF

Build custom tests that are tailored to your compliance needs and map those tests to our pre-built Drata controls for full customization and control automation. The following sections showcase examples of custom tests that fulfilled compliance needs and utilized DCF.

### Monitor the status of daily backups

You can create a custom test to verify if the backup jobs configured in [AWS Backup](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html#:~:text=AWS%20Backup%20efficiently%20stores%20your,AWS%20resources%20are%20backed%20up.) were executed daily.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter BackupJobs
      - AWS BackupJobs is a resource that allows you to configure backup policies and monitor backup activity for AWS resources in one place.
   - **Attribute**: Enter State
   - **Operator**: Select Equals
   - **Value**: Enter COMPLETED
4. After you publish the custom test, make sure to map DCF-98 (Daily Backup Statuses Monitored) to your test.

### Review user access privileges

You can create a custom test to verify user access reviews and to monitor service-level roles if applicable.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider:** Select AWS
      - For this example, the provider is “AWS”, but GCP is also a common provider for reviewing user access privileges.
   - **Resource: **Enter Lambda
      - You can also enter any AWS or GCP resource exposing roles such as AWS Lambda, EC2 and S3.
   - **Attribute**: Enter Role
   - **Operator**: Select Equals
   - **Value**: Enter an associated “ARN”
4. After you publish the custom test, make sure to map DCF-11 (Periodic Access Reviews) to your test.

### Verify deployment for anti-malware solution

Create a test to verify for deployment of an anti-malware solution to maintain security compliance.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter GuardDuty
      - AWS GuardDuty is a service that continuously monitors for malicious activity and unauthorized behavior to protect AWS accounts, workloads, and data.
      - In this example, AWS GuardDuty fulfills this role for AWS services, providing essential security functions.
   - **Attribute**: Enter `detector.DataSources.MalwareProtection.ScanEc2InstanceWithFindings.EbsVolumes.Status`
   - **Operator**: Select Equals
   - **Value**: Enter ENABLED
4. After you publish the custom test, make sure to map DCF-291 (Anti-Malware on All System Components) to your test.

### Verify for alerting system regarding critical failures

Create a test to verify if there is an alerting system in place to let your personnel know of critical failures.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter CloudTrail
      - [AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-concepts.html) is a service that provides logging, monitoring, and retain account activity across AWS infrastructure. CloudTrail SnsTopic has the notification categories for alerts.
   - **Attribute**: Enter `SnsTopicName`
   - **Operator**: Select Equals
   - **Value**: Enter `EnvironmentTrailNotification` Name
4. After you publish the custom test, make sure to map DCF-444 (Critical Security Control System Failure Alert) to your test.

### Verify configuration of security parameters

Create a test to verify if security parameters are configured and in place to prevent misuse, and to ensure the configuration of resources are monitored.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter ConfigRules
      - AWS ConfigRules evaluates the configuration settings of AWS resources.
   - **Attribute**: Enter `ConfigRuleState`
   - **Operator**: Select Equals
   - **Value**: Enter ACTIVE
4. After you publish the custom test, make sure to map DCF-244 (System Security Parameters in Configuration Standards) to your test.

## Create custom tests for automate monitoring controls

Create custom tests to automate the monitoring of controls that were manually monitored. Refer to the following sections for examples.

### Validate if threat detection system is enabled

Create a test to verify that logging and monitoring are enabled in your AWS GuardDuty instance.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter GuardDuty
      - AWS GuardDuty is a service that continuously monitors for malicious activity and unauthorized behavior to protect AWS accounts, workloads, and data.
   - **Attribute**: Enter `detector.datasources.S3logstatus`
   - **Operator**: Select Equals
   - **Value**: Enter ENABLED
4. After you publish the custom test, make sure to map DCF-87 (Threat Detection System) to your test.

### Ensure data is encrypted

Create a test to verify that the data stored by AWS Redshift are encrypted.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter RedshiftClusters
      - AWS Redshift is a fully managed cloud data warehouse.
   - **Attribute**: Enter `cluster.Encrypted`
   - **Operator**: Select Equals
   - **Value**: Enter TRUE
4. After you publish the custom test, make sure to map DCF-54 (Encryption at Rest) to your test.

### Verify authentication for version control system

Create a test to verify that basic authentication is enabled for all the repos in AWS CodeBuild.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter SourceCredentials
      - AWS CodeBuild is a fully managed, continuous integration service that compiles source code, runs tests, and produces ready-to-deploy software packages.
   - **Attribute**: Enter `authType`
   - **Operator**: Select Equals
   - **Value**: Enter OAuth
4. After you publish the custom test, make sure to map DCF-4 (Version Control System) to your test.

### Verify load balancers across availability zones

Create a test to verify that load balancers are used across availability zones in your AWS account.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter ElasticLoadBalancingV2
      1. AWS ELBv2 is a load balancing service that includes ALB and NLB.
   - **Attribute**: Enter `AvailabilityZones.length`
   - **Operator**: Select Greater Than
   - **Value**: Enter 1
4. After you publish the custom test, make sure to map DCF-96 (Load Balancer) to your test.

## Create custom test for automate monitoring security and compliance controls

Create custom tests to automate the monitoring of controls that were manually monitored. Refer to the following sections for examples.

### Verify AutoScaling policies are enabled

Create a test to verify that the appropriate AutoScaling policies are in place in your account.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter ApplicationAutoScalingPolicies
      - AWS AutoScaling is a service that monitors applications and automatically adjusts capacity according to demand.
   - **Attribute**: Enter `StepScalingPolicyConfiguration`
   - **Operator**: Select Exists
   - **Value**: Enter TRUE
4. After you publish the custom test, make sure to map a custom control to your test.

### Verify infrastructure logs are encrypted

Create a test to verify that your infrastructure logs are encrypted.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter CloudTrail
      - AWS CloudTrail is a service that provides logging, monitoring, and retains account activity across AWS infrastructure.
   - **Attribute**: Enter `KmsKeyId`
   - **Operator**: Select Exists
   - **Value**: Enter TRUE
4. After you publish the custom test, make sure to map a custom control to your test.

### Verify Termination Protection is enabled for Customer's EMR Clusters

Create a test to verify that termination protection is enabled for the customer’s EMR clusters.

1. Go to the Monitoring page and select **Create test**.
2. Add a descriptive **Test name **and **Description**.
3. Select the following configurations when building the test.
   - **Provider**: Select AWS
   - **Resource**: Enter EMRClusters
      - AWS EMR is a platform for running large-scale distributed data processing jobs, interactive SQL queries, and machine learning applications.
   - **Attribute**: Enter `AutoTerminate`
   - **Operator**: Select Equals
   - **Value**: Enter TRUE
4. After you publish the custom test, make sure to map a custom control to your test.

## Related articles

- [Test 105: Threat Detection in Place](test-105-threat-detection-in-place.md)
- [Test 223: AWS CMK Rotation](test-223-aws-cmk-rotation.md)
- [October 2024 Release: AWS Drata test](october-2024-release-aws-drata-test.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)
- [Create and Publish Custom Tests](create-and-publish-custom-tests.md)

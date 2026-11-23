# AWS Resource Permissions

Source: https://help.drata.com/en/articles/8852274-aws-resource-permissions
Collection: Understand the Drata Platform › Monitoring › Custom Tests
Updated: 2026-07-01
Fetched: 2026-11-22
Description: The available supported AWS resources.

## Article text

The AWS permissions for the following resources are included in the **SecurityAudit policy**.

| **AWS Service** | **Resource Name** |
|---|---|
| ApiGateway | ApiGatewayRestApis |
| AppSync | AppSyncGraphqlApis |
| CloudFront | CloudFrontDistributions |
| CloudTrail | LookupRootEvent |
| CloudWatch | MetricAlarms |
| DynamoDB | DynamoDBTables |
| EC2 | SecurityGroups |
| EC2 | ElasticComputeCloudInstances |
| ECS | ElasticContainerCluster |
| ECS | ECSService |
| ElastiCache | ElastiCacheClusters |
| ElastiCache | ElastiCacheReplicationGroups |
| ElasticLoadBalancing | ElasticLoadBalancing |
| ElasticLoadBalancingV2 | ElasticLoadBalancingV2 |
| Elasticsearch | ElasticsearchDomains |
| GuardDuty | GuardDuty |
| IAM | IAMUsers |
| RDS | DBClusters |
| RDS | DBInstances |
| S3 | Buckets |
| SQS | SQSQueues |

The following resources are only available to use if you have Custom Connections and test for your account. When creating a new test, you can choose any supported AWS resources.

In the following table, the column:

- **Additional Permissions**:These permissions are **not included in SecurityAudit policy**, but you must add them for Drata to access the resource from your AWS account. The permissions are not contained within the default AWS policy.
- **Covered in ReadOnlyAccess**: Add the blanket **ReadOnlyAccess** policy instead of the specific permissions of the resources below.

| **AWS Service** | **Resource Name** | **Required Permissions** | **Additional Permissions** | **Covered in ReadOnlyAccess** |
|---|---|---|---|---|
| **MemoryDB** | MemoryDBCluster | `memorydb:DescribeClusters` <br><br>`memorydb:ListAllowedNodeTypeUpdates` <br><br>`memorydb:ListTags` | `memorydb:ListAllowedNodeTypeUpdates`<br><br>`memorydb:ListTags` | Yes |
| **MemoryDB** | MemoryDBACL | `memorydb:DescribeAcls` | `memorydb:DescribeAcls` | No |
| **Lambda** | Lambda | `lambda:ListFunctions `<br><br>`lambda:GetPolicy` | None | Yes |
| **EMR** | SecurityConfiguration | `elasticmapreduce:DescribeSecurityConfiguration `<br><br>`elasticmapreduce: ListSecurityConfigurations` | `elasticmapreduce:DescribeSecurityConfiguration` | Yes |
| **EMR** | EMRClusters | `elasticmapreduce:DescribeCluster` <br><br>`elasticmapreduce:ListClusters` | `elasticmapreduce:DescribeCluster` | Yes |
| **Backup** | BackupJobs | `backup:ListBackupJobs` | `backup:ListBackupJobs` | Yes |
| **Backup** | BackupPlans | `backup:ListBackupPlans` | `backup:ListBackupPlans` | Yes |
| **Backup** | BackupGlobalSettings | `backup:DescribeGlobalSettings` | `backup:DescribeGlobalSettings` | Yes |
| **Backup** | BackupVaults | `backup:ListBackupVaults` | None | Yes |
| **Cloudtrail** | CloudTrail | `cloudtrail:ListTrails` <br><br>`cloudtrail:DescribeTrails` | `cloudtrail:ListTrails` | Yes |
| **Cognito** | IdentityPool | `cognito-identity:ListIdentityPools` <br><br>`cognito-identity:DescribeIdentityPool` | `cognito-identity:DescribeIdentityPool` | Yes |
| **Auto Scaling** | AutoScalingInstances | `autoscaling:DescribeAutoScalingInstances` | `autoscaling:DescribeAutoScalingInstances` | Yes |
| **Auto Scaling** | AutoScalingGroups | `autoscaling:DescribeAutoScalingGroups` | `autoscaling:DescribeAutoScalingGroups` | Yes |
| **Auto Scaling** | ApplicationAutoScalingScalingPolicies | `autoscaling:DescribePolicies` | `autoscaling:DescribePolicies` | Yes |
| **OpenSearch Serverless** | OpenSearchServerlessSecurityConfigs | `aoss:ListSecurityConfigs` <br><br>`aoss:GetSecurityConfig` | `aoss:ListSecurityConfigs` <br><br>`aoss:GetSecurityConfig` | Yes |
| **OpenSearch Serverless** | OpenSearchServerlessAccountSettings | `aoss:GetAccountSettings` | `aoss:GetAccountSettings` | Yes |
| **OpenSearch Serverless** | OpenSearchServerlessPoliciesStats | `aoss:GetPoliciesStats` | `aoss:GetPoliciesStats` | Yes |
| **CodeBuild** | SourceCredentials | `codebuild:ListSourceCredentials` | `codebuild:ListSourceCredentials` | Yes |
| **CodeBuild** | Projects | `codebuild:ListProjects` | None | Yes |
| **CodeBuild** | SharedProjects | `codebuild:ListSharedProjects` | `codebuild:ListSharedProjects` | Yes |
| **Auto Scaling** | AutoScalingPlans | `autoscaling-plans:DescribeScalingPlans` | None | Yes |
| **Application Auto Scaling** | ApplicationAutoScalingScalingPolicies | `application-autoscaling:DescribeScalingPolicies` | None | Yes |
| **Kinesis** | KinesisStreams | `kinesis:ListStreams`<br><br>`kinesis:DescribeStreamSummary` | None | Yes |
| **Kinesis** | KinesisLimits | `kinesis:DescribeLimits` | None | Yes |
| **CloudFront** | CloudFrontOriginAccessControls | `cloudfront:ListOriginAccessControls` | None | Yes |
| **CloudFront** | CloudFrontRealtimeLogConfigs | `cloudfront:ListRealtimeLogConfigs` | None | Yes |
| **IAM** | IAMUsers | `iam:ListAccessKeys iam:ListUserTags `<br><br>`iam:ListUsers iam:ListMFADevices` | None | Yes |
| **ElasticLoadBalancingV2** | ElasticLoadBalancingV2 | `elasticloadbalancing:DescribeAccountLimits elasticloadbalancing:DescribeTags `<br><br>`elasticloadbalancing:DescribeLoadBalancerAttributes` <br><br>`elasticloadbalancing:DescribeLoadBalancers` | None | Yes |
| **Config Service** | ConfigRules | `config:DescribeConfigRules` | None | Yes |
| **Config Service** | ConformancePacks | `config:DescribeConformancePacks` <br><br>`config:DescribeConformancePackCompliance` | None | Yes |
| **Config Service** | ConfigurationAggregators | `config:DescribeConfigurationAggregators` <br><br>`config:DescribeAggregateComplianceByConformancePacks` | None | Yes |
| **CodePipeline** | Pipelines | `codepipeline:ListPipelines` | None | Yes |
| **KMS** | KMSKeys | `kms:ListKeys` <br><br>`kms:ListResourceTags` <br><br>`kms:GetKeyRotationStatus` | None | Yes |
| **SageMaker** | SageMakerNoteBookInstances | `sagemaker:ListNotebookInstances` <br><br>`sagemaker:DescribeNotebookInstance` | None | Yes |
| **SageMaker** | SageMakerTrainingJobs | `sagemaker:ListTrainingJobs` <br><br>`sagemaker:DescribeTrainingJob` | None | Yes |
| **RDS** | DBClusters | `rds:DescribeDBClusterSnapshots` <br><br>`rds:DescribeDBClusters` | None | Yes |
| **RDS** | DBSnapshots | `rds:DescribeDBSnapshots` | None | Yes |
| **DynamoDBAccelerator (DAX)** | DAXClusters | `dax:DescribeClusters` | None | Yes |
| **Secrets Manager** | Secrets | `secretsmanager:DescribeSecret` <br><br>`secretsmanager:ListSecrets` | None | Yes |
| **VPCLattice** | VPCLatticeServices | `vpc-lattice:ListServices` <br><br>`vpc-lattice:GetResourcePolicy` <br><br>`vpc-lattice:GetAuthPolicy` | `vpc-lattice:ListServices `<br><br>`vpc-lattice:GetResourcePolicy <br>`<br>`vpc-lattice:GetAuthPolicy` | Yes |
| **FSx** | FsxBackups | `fsx:DescribeBackups `<br><br>`fsx:ListTagsForResource` | None | Yes |
| **Lightsail** | LightsailBuckets | `lightsail:GetBuckets` | `lightsail:GetBuckets` | Yes |
| **Lightsail** | LightsailAlarms | `lightsail:GetAlarms` | `lightsail:GetAlarms` | Yes |
| **Trusted Advisor** | TrustedAdvisorChecks | `trustedadvisor:ListChecks` | `trustedadvisor:ListChecks` | No |
| **Trusted Advisor** | TrustedAdvisorRecommendations | `trustedadvisor:ListRecommendations` | `trustedadvisor:ListRecommendations` | No |
| **CodeCommit** | Repositories | `codecommit:BatchGetRepositories <br><br>codecommit:GetBranch <br><br>codecommit:ListPullRequests codecommit:ListBranches <br><br>codecommit:ListRepositories <br><br>codecommit:GetPullRequest*` | `codecommit:GetPullRequest*` | Yes |
| **OpenSearch** | OpenSearchDomains | `es:DescribeDomainConfig <br><br>es:DescribeDomainHealth <br><br>es:DescribeDomains <br><br>es:ListDomainNames <br><br>es:ListTags` | None | Yes |
| **OpenSearch** | OpenSearchVpcEndpoints | `es:ListVpcEndpoints <br><br>es:DescribeVpcEndpoints` | `es:ListVpcEndpoints` | Yes |
| **Route53** | Route53Domains | `route53domains:ListDomains` | None | Yes |
| **Route53** | Route53Operations | `route53domains:ListOperations` | None | Yes |
| **DocumentDB** | DocDBCluster | `docdb-elastic:ListClusters <br><br>docdb-elastic:ListClusterSnapshots` | `docdb-elastic:ListClusterSnapshots` | No |
| **Kakfa** | MSKClusters | `kafka:ListClusters` | None | Yes |
| **Redshift** | RedshiftAccountAttributes | `redshift:DescribeAccountAttributes` | None | Yes |
| **Redshift** | RedshiftClusters | `redshift:DescribeClusterDbRevisions <br><br>redshift:DescribeClusterSnapshots <br><br>redshift:DescribeClusters` | None | Yes |
| **EC2** | Regions | `ec2:DescribeRegions` | None | Yes |
| **HTTPS** | SslCertificate | None | None | Yes |

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Exclusion tags within AWS](exclusion-tags-within-aws.md)
- [Virtual Asset Population: AWS](virtual-asset-population-aws.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)

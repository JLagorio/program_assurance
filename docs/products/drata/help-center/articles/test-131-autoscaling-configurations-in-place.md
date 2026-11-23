# Test 131: Autoscaling Configurations in Place

Source: https://help.drata.com/en/articles/10029045-test-131-autoscaling-configurations-in-place
Collection: Monitoring Test Guidance
Updated: 2026-11-12
Fetched: 2026-11-22
Description: Determine if autoscaling was in place to provision new compute resources when predefined capacity thresholds are met.

## Article text

Drata checks whether autoscaling is set up to add compute capacity when demand reaches your thresholds.

### SUPPORTED CONNECTIONS

This test runs only for AWS and AWS Organizational Units connections. It isn’t available for GCP connections.

## ASSOCIATED DRATA CONTROL

This test is part of Autoscaling (DCF-97). The control confirms that your company has enabled autoscaling to provision new cloud resources when predefined capacity thresholds are met.

#### HOW DRATA CHECKS EACH REGION

Drata checks your AWS regions one at a time, once a day. It checks a region only if the region has at least one of these resources:

- EC2 instances
- ECS clusters
- DynamoDB tables

Drata skips regions that have none of those resources.

A checked region passes if it has at least one of the following:

- **An AWS Auto Scaling plan** that is active and has at least one scaling instruction. Every scaling instruction must have dynamic scaling turned on and a minimum and maximum capacity above 0.
- **An Application Auto Scaling scaling policy** for an ECS service, a DynamoDB table, or an EC2 Spot Fleet.

Having both also passes.

#### What this test doesn’t check

This test doesn’t read EC2 Auto Scaling groups or the scaling policies attached directly to them. A scaling policy on an EC2 Auto Scaling group doesn’t count toward passing. In Application Auto Scaling, the `ec2` namespace refers to Spot Fleet requests only.

## WHAT TO DO IF A TEST FAILS

The test fails for a region that has EC2 instances, ECS clusters or DynamoDB tables, but no qualifying scaling plan and no qualifying scaling policy.

## STEPS TO REMEDIATE

1. Open the test in Drata and note which regions failed.
2. In AWS, in each failed region, create one of the following:
   - An AWS Auto Scaling plan that includes your resources. The plan must be active, with dynamic scaling turned on and a minimum and maximum capacity above 0 in every scaling instruction. For an EC2 Auto Scaling group, a group with a minimum size of 0 doesn’t meet the minimum capacity requirement.
   - An Application Auto Scaling scaling policy for an ECS service, a DynamoDB table, or an EC2 Spot Fleet.
3. Run the test again in Drata.

### REQUIRED AWS PERMISSIONS

The AWS role for your connection needs these permissions. Copy the names exactly, including the hyphens:

- `application-autoscaling:DescribeScalingPolicies`
- `autoscaling-plans:DescribeScalingPlans`
- `dynamodb:DescribeTable`
- `dynamodb:ListTagsOfResource`
- `dynamodb:ListTables`
- `ec2:DescribeInstances`
- `ecs:DescribeClusters`
- `ecs:ListClusters`
- `ecs:ListTagsForResource`

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)
- [Test 105: Threat Detection in Place](test-105-threat-detection-in-place.md)
- [Exclusion tags within AWS](exclusion-tags-within-aws.md)
- [AWS Resource Permissions](aws-resource-permissions.md)

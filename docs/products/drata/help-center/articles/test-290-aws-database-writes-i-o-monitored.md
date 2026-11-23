# Test 290: AWS Database Writes I/O Monitored

Source: https://help.drata.com/en/articles/9828793-test-290-aws-database-writes-i-o-monitored
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that AWS database clusters and database instances have a CloudWatch metric alarm for writes I/O for each cluster or instance

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the System Monitoring control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS database clusters or instances do not have a CloudWatch metric alarm for writes I/O configured with a subscription to an SNS topic, the test will fail.

## STEPS TO REMEDIATE

1. Sign in to [CloudWatch console](https://signin.aws.amazon.com/signin?redirect_uri=https%3A%2F%2Fus-east-2.console.aws.amazon.com%2Fcloudwatch%2F%3Fregion%3Dus-east-2%26state%3DhashArgs%2523%26isauthcode%3Dtrue&client_id=arn%3Aaws%3Aiam%3A%3A015428540659%3Auser%2Fcloudwatch&forceMobileApp=0&code_challenge=DKz-H_rF8ZTt4nbXSJUSLKmV17mdC84KGxHkzGvOrxo&code_challenge_method=SHA-256).
2. Create an alarm by selecting 'Alarm' then 'Create alarm' from the navigation panel.
3. Click 'select metric' > 'RDS' > 'Per-Cluster Metrics' and select your DB cluster or instance identifier then select 'WriteIOPS' metric.
4. Specify conditions by setting threshold type, defining threshold value, setting the period, and setting the evaluation periods.
5. Choose an existing SNS topic or create a new one to subscribe to.
6. Give your alarm a name, review your settings, and finish creating the alarm.
7. Repeat for each failing DB instance or cluster

## Related articles

- [Test 293: AWS Classic Load Balancer Latency Monitored](test-293-aws-classic-load-balancer-latency-monitored.md)
- [Test 294: AWS Application Load Balancer Target Response Time Monitored](test-294-aws-application-load-balancer-target-response-time-monitored.md)
- [Test 296: AWS Application Load Balancer Server Errors Monitored](test-296-aws-application-load-balancer-server-errors-monitored.md)
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md)
- [Test 300: AWS Lambda Error Rate Monitored](test-300-aws-lambda-error-rate-monitored.md)

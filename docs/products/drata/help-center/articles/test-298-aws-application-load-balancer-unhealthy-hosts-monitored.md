# Test 298: AWS Application Load Balancer Unhealthy Hosts Monitored

Source: https://help.drata.com/en/articles/9828822-test-298-aws-application-load-balancer-unhealthy-hosts-monitored
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Validates that all AWS Application Load Balancers have a CloudWatch metric alarm (subscribed to an SNS topic) for unhealthy hosts count.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS Application Load Balancers do not have a CloudWatch metric alarm for unhealthy hosts count configured with a subscription to an SNS topic, the test will fail.

## STEPS TO REMEDIATE

1. Sign in to CloudWatch console.
2. Create an alarm by selecting 'Alarm' then 'Create alarm' from the navigation panel.
3. Select **Metrics → All metrics → ApplicationELB → Per AppELB, per TG Metrics**.
4. Search for and select the affected load balancer and target group, then choose **UnHealthyHostCount**.
5. Specify metrics and conditions for the alarm such as threshold value and period.
6. Choose an existing SNS topic or create a new one to subscribe to.
7. Give your alarm a name, review your settings, and finish creating the alarm.
8. Repeat for each failing AWS Application Load Balancer.

## Related articles

- [Test 293: AWS Classic Load Balancer Latency Monitored](test-293-aws-classic-load-balancer-latency-monitored.md)
- [Test 294: AWS Application Load Balancer Target Response Time Monitored](test-294-aws-application-load-balancer-target-response-time-monitored.md)
- [Test 295: AWS Classic Load Balancer Server Errors Monitored](test-295-aws-classic-load-balancer-server-errors-monitored.md)
- [Test 296: AWS Application Load Balancer Server Errors Monitored](test-296-aws-application-load-balancer-server-errors-monitored.md)
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md)

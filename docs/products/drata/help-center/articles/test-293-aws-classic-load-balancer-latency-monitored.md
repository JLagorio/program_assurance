# Test 293: AWS Classic Load Balancer Latency Monitored

Source: https://help.drata.com/en/articles/9828801-test-293-aws-classic-load-balancer-latency-monitored
Collection: Monitoring Test Guidance
Updated: 2025-08-19
Fetched: 2026-11-22
Description: Validates that all AWS Classic Load Balancers have a CloudWatch metric alarm for latency and that the alarm is subscribed to an SNS topic.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent out to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS Classic Load Balancers do not have a CloudWatch metric alarm for latency configured with a subscription to an SNS topic, the test will fail.

## STEPS TO REMEDIATE

For Classic Elastic Load Balancers that are failing:

1. Sign in to CloudWatch console.
2. Create an alarm by selecting 'Alarm' then 'Create alarm' from the navigation panel.
3. Click 'Select metric' > 'ELB' (Elastic Load Balancing) > 'Per-ELB Metrics' > select the load balancer failing this test > select the 'Latency' metric.
4. Specify the threshold value, period, and other conditions for the alarm.
5. Choose an existing SNS topic or create a new one to subscribe to.
6. Give your alarm a name, review your settings, and finish creating the alarm.
7. Repeat these steps for each failing Classic Elastic Load Balancer.

### Why the Latency Metric Might Not Appear

The **Latency** metric may not appear under **CloudWatch > Metrics > ELB > Per-ELB Metrics**, which can prevent creating the required alarm. This occurs because AWS does not emit latency metrics for Classic Load Balancers until they process at least one request. If the load balancer hasn’t handled any traffic, the Latency metric won’t show up in the CloudWatch console.

To make the Latency metric available, choose **one of the following options**. Do not perform both options:

**Option 1: Generate Traffic**

1. Send a test request through the Classic Load Balancer.
2. Wait a few moments, then refresh the CloudWatch metrics page.
3. Once CloudWatch verifies that the load balancer has handled at least one request, the Latency metric begins emitting data.

**Option 2: Manually Specify the Metric**

1. If you can’t generate test traffic, you can *manually* create the alarm instead.
2. This involves opening the CloudWatch alarm creation wizard, switching to the query editor, and entering the metric manually:
   - `Namespace: AWS/ELB`
   - `Metric name: Latency`
   - `Dimension: LoadBalancerName` with your load balancer’s name.
3. This way, you set up the alarm even though the metric has not yet appeared in the metrics list because no requests have been processed.

Learn more in the [CloudWatch metrics for your Classic Load Balancer documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-cloudwatch-metrics.html#:~:text=Elastic%20Load%20Balancing%20reports,metric%20is%20not%20reported.).

## Related articles

- [Test 294: AWS Application Load Balancer Target Response Time Monitored](test-294-aws-application-load-balancer-target-response-time-monitored.md)
- [Test 295: AWS Classic Load Balancer Server Errors Monitored](test-295-aws-classic-load-balancer-server-errors-monitored.md)
- [Test 296: AWS Application Load Balancer Server Errors Monitored](test-296-aws-application-load-balancer-server-errors-monitored.md)
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md)
- [Test 298: AWS Application Load Balancer Unhealthy Hosts Monitored](test-298-aws-application-load-balancer-unhealthy-hosts-monitored.md)

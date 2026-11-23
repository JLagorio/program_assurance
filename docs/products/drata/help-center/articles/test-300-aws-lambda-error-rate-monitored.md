# Test 300: AWS Lambda Error Rate Monitored

Source: https://help.drata.com/en/articles/9828825-test-300-aws-lambda-error-rate-monitored
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that all AWS Lambda functions have a CloudWatch metric alarm for error rate.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent out to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that an error rate CloudWatch metric alarm with subscription to an SNS topic has not been configured for one or more AWS Lambda functions, the test will fail.

## STEPS TO REMEDIATE

1. Sign into the AWS Management Console and navigate to CloudWatch.

2. Go to 'Alarms' from the CloudWatch console and click on 'Create alarm'.

3. Click on 'Select metric' and select 'Lambda' from the list of available namespaces.

4. Click on 'By Function Name' > select the function you want to create the alarm for > choose 'Errors' metric.

5. Specify metric conditions and configure action details. Make sure to select or create an SNS topic to send notifications to.

6. Give the alarm a name and description and create the alarm.

7. Repeat for each failing Lambda function.

## Related articles

- [Test 290: AWS Database Writes I/O Monitored](test-290-aws-database-writes-i-o-monitored.md)
- [Test 293: AWS Classic Load Balancer Latency Monitored](test-293-aws-classic-load-balancer-latency-monitored.md)
- [Test 295: AWS Classic Load Balancer Server Errors Monitored](test-295-aws-classic-load-balancer-server-errors-monitored.md)
- [Test 296: AWS Application Load Balancer Server Errors Monitored](test-296-aws-application-load-balancer-server-errors-monitored.md)
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md)

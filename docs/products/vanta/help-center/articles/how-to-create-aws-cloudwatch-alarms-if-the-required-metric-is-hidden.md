# How to create AWS Cloudwatch Alarms if the required Metric is hidden

Source: https://help.vanta.com/en/articles/11345912-how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When attempting to create alarms in AWS console Cloudwatch, you may find that the Metric required for a test is not showing. Below, we'll discuss ways to create Alarms despite not being able to find it in during the Alarm creation workflow.
 

## Prerequisites
- 
AWS Cloudwatch
- 
You need to have the necessary IAM permissions to create metrics and alarms in CloudWatch.
 

## Alarm Creation and Hidden Metrics
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760273/898aa738d2d463cc287d3d4ab8ca/17546217691284?expires=1794967200&signature=c926b8049338df3cae2e56e658640377e597e132c64fe9d57d1e45f2d299ce05&req=dSUmEM54nYNYWvMW1HO4zfQCFA7T%2BqH0w2xp6QhUK7Z9j3HND21nzunjzG%2FW%0AAckkBp%2FVMq5q6dG6Pag%3D%0A>
 
Due to how metrics work on AWS Cloudwatch, if no new data points are collected in the past two weeks, the metric is hidden from the console. For example:
In the test - Load balancer server errors monitored (AWS) <https://app.vanta.com/tests#load-balancers-monitored-and-alarmed-config-servererrors>
 
We require that you set up an alarm for each load balancer, and the alarm must monitor one of these 5 metrics:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760272/fdf1aaf95dea5a7850fbc6dc1360/27542991927828?expires=1794967200&signature=c4e3e25c20f64fe5ccd0c2e2e104cb635a6a4ef1d3ffb37d040730e4dc2bb1e5&req=dSUmEM54nYNYW%2FMW1HO4ze0dTJd8ptN9rCt1mfMc6Wkod50tOv9mXCQuukJT%0A16z0qLN0lqVuVwmcwt4%3D%0A>
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760271/80500051c87252481a10966a97eb/27543007941652?expires=1794967200&signature=ded53dd5bc0f686ffbb98c2adb886c50b6af3c4dd9d4ffdb9c7c8fe87f35ead9&req=dSUmEM54nYNYWPMW1HO4zYWyokGd2Mq%2FIMqh%2Fqqk3gZtuFYmAQmPvZGF3n4L%0AWXADiMghTaENUIos3aE%3D%0A>
- 
HTTPCode_ELB_5XX
- 
HTTPCode_ELB_5XX_Count
- 
HTTPCode_Backend_5XX
- 
HTTPCode_Target_5XX_Count
- 
ApplicationRequests5xx
However, When we search for this metric during alarm creation, we find no results:
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760275/899cf6b61862911669f15b600239/17571173492372?expires=1794967200&signature=c74930d6445537cafb6c3bdd7d2a5fa9115a27d2358d37c8d1ffdd6c0a27cc4d&req=dSUmEM54nYNYXPMW1HO4zakbpP6jJRD1cSMOlI4fKYOdoVxbJxDfnDz1OtIV%0AqVJwj1qhhg%2BSddlaKFI%3D%0A>
 
This is because the Load Balancer in this example has not logged an 5xx HTTP Code in the last 2 weeks. You can read more on AWS Cloudwatch metrics in the article below:
- 
AWS Cloudwatch - View Available Metrics <https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/viewing_metrics_with_cloudwatch.html>
 

## How to Create an Alarm on Hidden Metrics
There are two ways you can do this. Either through the AWS CLI, or through the Alarm builder, under the query tab. However, if they aren't appearing there either, you can create them directly through the CLI.
 

## Query Builder Example:
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760288/b3fc2260f382a6448bad7b6631c4/17573634826004?expires=1794967200&signature=64e201bbaffe82d0d86c8001aace45f78167d8fe10d7a360c34151b390c3f417&req=dSUmEM54nYNXUfMW1HO4zS8%2BsBMBN7dBLWbeyiHK3hrQqKo0%2BCk%2B9t4TtVZL%0AgHPWWCzm%2B%2BxXSbWx1Tk%3D%0A>

## Example CLI:
Creating an alarm on a metric with no data points is possible however, The alarm will start in an INSUFFICIENT_DATA state but will transition to an `ALARM` or `OK` state when the metric data points are available.
 
Here's an example:
aws cloudwatch put-metric-alarm --alarm-name [AlarmName] --metric-name [MetricName] --namespace [Namespace] --statistic Average --period 300 --threshold 100 --comparison-operator GreaterThanThreshold --evaluation-periods 2 --alarm-description "Alarm when metric exceeds threshold" --actions-enabled --alarm-actions [SNS Topic ARN] --unit Seconds

 
In this command, replace [AlarmName] with the name you want for your alarm, [MetricName] and [Namespace] with your metric name and namespace, and [ SNS Topic ARN] with the ARN of an Amazon SNS topic where the alarm will send a notification.
 

## Example Terraform:resource "aws_cloudwatch_metric_alarm" "cpu_alarm" {
alarm_name = "cpu-utilization-alarm"
comparison_operator = "GreaterThanOrEqualToThreshold"
evaluation_periods = 2
metric_name = "CPUUtilization"
namespace = "AWS/EC2"
period = 300 # 5 minutes
statistic = "Average"
threshold = 80
alarm_description = "Alarm when CPU utilization exceeds 80% for 2 consecutive periods"

dimensions = {
InstanceId = "your-instance-id" # Replace with your EC2 instance ID
}

alarm_actions = ["arn:aws:sns:us-east-1:123456789012:my-sns-topic"] # Replace with your SNS topic ARN
}
 

## Note:
- 
 The `--unit` parameter is optional and may not be necessary depending on your metric.
- 
Make sure to change `--threshold`, `--statistic`, `--period`, and `--evaluation-periods` as needed to suit your use case.
- 
The AWS CLI must be installed and properly configured with your credentials to run this command.
 

## Additional Resources
- 
https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/get-metric-data.html <https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/get-metric-data.html>
- 
https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/get-metric-statistics.html <https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/get-metric-statistics.html>
- 
https://stackoverflow.com/questions/68674013/why-do-some-metrics-missing-in-cloudwatch-metrics-view <https://stackoverflow.com/questions/68674013/why-do-some-metrics-missing-in-cloudwatch-metrics-view>
- 
https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/viewing_metrics_with_cloudwatch.html <https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/viewing_metrics_with_cloudwatch.html>

## Images

- [image 01] ../../images/documentation/how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden--01.png
- [image 02] ../../images/ux/tests/how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden--02.png
- [image 03] ../../images/ux/tests/how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden--03.png
- [image 04] ../../images/integrations/aws/how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden--04.png
- [image 05] ../../images/integrations/aws/how-to-create-aws-cloudwatch-alarms-if-the-required-metric-is-hidden--05.png

# Test 115: Messaging Queue Message Age Monitored

Source: https://help.drata.com/en/articles/4776986-test-115-messaging-queue-message-age-monitored
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects your company messaging queue monitoring configuration to determine if message age is monitored, with appropriate alerts.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Messaging Queues Monitored and Alarmed **control that ensures your company has implemented tools to monitor messaging queues and notify appropriate personnel of any events or incidents based on predetermined criteria.

**WHAT TO DO IF A TEST FAILS**

If Drata detects that messaging queue message age monitoring is not enabled or that alerts have not been properly set up, the test will fail. With a failed test you will receive a list of queues that lack message age monitoring or administrative alerts.

To remediate a failed test, you will need to set up and configure message age monitoring for the reported queues to ensure they are monitored with alerts being sent to infrastructure admins in an event or incident.

**STEPS FOR PASSING**

To ensure a validated state when testing for monitoring the age of messages in the messaging queue, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

***NOTE: If you are using the Datadog integration for this test, please see [this help article](datadog-integration-guide.md) for the metrics to be used.***

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - SQS** | 1. Within AWS, go to Amazon Cloudwatch<br>2. Click the Create Alarm button<br>3. Select metrics: SQS<br>4. Click the next button<br>5. Click Queue metrics<br>6. Select the Metric name (ApproximateAgeOfOldestMessage)<br>7. Click the select metric button<br>8. Specify metric condition: - Conditions: threshold: Static Greater than 10000<br>   1. 10000 is an illustrative example; choose a value that makes sense for your setup<br>9. Click the next button.<br>10. Configure Action: send notification<br>11. Click the next button<br>12. Add name and description of the alarm<br>13. Click Next button<br>14. Click the Create Alarm button<br>**Subscription Confirmation**<br>The subscription to the SNS topic used (or newly created) above must be confirmed for the test to pass.<br>1. Go to SNS and select Subscriptions<br>2. Click "Create subscription" and reference the newly created topic for the Topic ARN<br>3. For Protocol select Email<br>4. For Endpoint enter an email address, generally a monitored team inbox<br>5. Click "Create subscription" and verify the email that was sent to your provided inbox<br>Alternatively:<br>1. Go to SNS and select Topics<br>2. Click the topic name created with the alarm<br>3. Under the Subscriptions banner, click the radio button for the topic's subscription<br>4. Click "Confirm subscription" and verify the email that was sent to your provided inbox |
| **GCP - PubSub** | 1. Within GCP, establish a topic in PubSub<br>2. In monitoring, establish an alert policy<br>   1. Resource is Cloud Pub/Sub topic<br>      1. By default the GCP Alert UI may only show "Active" metrics, and you may need to turn that toggle off to see the required option<br>   2. Metric is Oldest Retained Acked Message by Region<br>   3. Select an active notification channel (any except mobile cloud console) |

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 114: Database Read I/O Monitored](test-114-database-read-i-o-monitored.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)

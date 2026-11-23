# Test 117: NoSQL Cluster Storage Utilization Monitored

Source: https://help.drata.com/en/articles/4776995-test-117-nosql-cluster-storage-utilization-monitored
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company NoSQL cluster configuration to determine if storage utilization is monitored, with appropriate alerts.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **NoSQL Database Monitored and Alarmed **control that ensures your company has implemented tools to monitor NoSQL databases and notify appropriate personnel of any events or incidents based on predetermined criteria.

**WHAT TO DO IF A TEST FAILS**

If Drata detects that NoSQL cluster storage utilization monitoring is not enabled or that alerts have not been properly set up the test will fail. With a failed test you will receive a list of databases that lack NoSQL cluster storage utilization monitoring or administrative alerts.

To remediate a failed test, you will need to set up and configure NoSQL cluster storage utilization monitoring for the reported databases to ensure they are monitored with alerts being sent to DB admins in an event or incident.

**STEPS FOR PASSING**

To ensure a validated state when testing for monitoring of NoSQL cluster storage utilization, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

***NOTE: The Datadog integration does not support this test. There is no need to set up an alarm in Datadog or AWS for DynamoDB NoSQL resources. Drata will automatically pass all AWS DynamoDB instances, since they employ autoscaling.***

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - DynamoDB**<br>***NOTE: This monitoring test will automatically pass all AWS DynamoDB instances, since they employ autoscaling. We've retained the previous CloudWatch alarm instructions for convenience.*** | **Database Creation**<br>1. Within AWS, go to the DynamoDB service<br>2. Create a table<br>**Alarm Creation**<br>1. Go to CloudWatch<br>2. Create Alarm<br>3. Click on DynamoDB<br>4. Click on Table Metrics<br>5. ConsumedWriteCapacityUnits > 10 for 1 datapoints within 1 minutes<br>   1. 10 is an illustrative example; choose a value that makes sense for your setup<br>**Subscription Confirmation**<br>The subscription to the SNS topic used (or newly created) above must be confirmed for the test to pass.<br>1. Go to SNS and select Subscriptions<br>2. Click "Create subscription" and reference the newly created topic for the Topic ARN<br>3. For Protocol select Email<br>4. For Endpoint enter an email address, generally a monitored team inbox<br>5. Click "Create subscription" and verify the email that was sent to your provided inbox<br>Alternatively:<br>1. Go to SNS and select Topics<br>2. Click the topic name created with the alarm<br>3. Under the Subscriptions banner, click the radio button for the topic's subscription<br>4. Click "Confirm subscription" and verify the email that was sent to your provided inbox |
| **Azure - CosmosDB** | 1. Create an Azure Cosmos DB account<br>2. Create an alert rule on that database for "Data Usage"<br>3. Add an action to the alert rule & save changes |
| **GCP - Monitoring** | 1. Within GCP, go to the Datastore<br>2. Create an entity<br>3. In monitoring, create an Alert Policy<br>   1. Resource type is Datastore Request<br>   2. Metric is Sizes of written entities<br>      1. For steps 3a-3b, by default the GCP Alert UI may only show "Active" metrics, and you may need to turn that toggle off to see the required option<br>   3. Select an active notification channel (any except mobile cloud console) |

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 114: Database Read I/O Monitored](test-114-database-read-i-o-monitored.md)
- [Test 115: Messaging Queue Message Age Monitored](test-115-messaging-queue-message-age-monitored.md)
- [Test 116: NoSQL Cluster CPU Load Monitored](test-116-nosql-cluster-cpu-load-monitored.md)

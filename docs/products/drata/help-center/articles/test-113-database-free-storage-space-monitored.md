# Test 113: Database Free Storage Space Monitored

Source: https://help.drata.com/en/articles/4776980-test-113-database-free-storage-space-monitored
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects your company database monitoring configuration to determine if free storage space is monitored, with appropriate alerts.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Databases Monitored and Alarmed **control that ensures your company has implemented tools to monitor databases and notify appropriate personnel of any events or incidents, based on predetermined criteria.

## WHAT TO DO IF A TEST FAILS

If Drata detects that database storage monitoring is not enabled or that alerts have not been properly set up, the test will fail. With a failed test you will receive a list of databases that lack storage monitoring or administrative alerts.

To remediate a failed test, you will need to set up and configure monitoring for database storage to ensure they are monitored with alerts being sent to DB admins in an event or incident.

## STEPS FOR PASSING

To ensure a validated state when testing for monitoring of the database free storage, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

**Note for Datadog**

If you are using the Datadog integration for this test, please refer to [this help article](datadog-integration-guide.md) for the metrics to be used.

**Note for AWS DocDB Alarm Creation (Instance Metrics) and RDS Alarm Creation (Database Instance)**

For clustered databases, the same alarm must be configured on **each database instance** for the test to pass. Although this article refers to alarms at the database level, the test validates alarms at the instance level.

## AWS – Amazon DocumentDB (DocDB)

### Database Creation

This section walks you through creating a DocumentDB cluster in AWS. The cluster is the resource Drata evaluates to confirm that database storage monitoring is enabled.

1. In AWS, navigate to the **DocumentDB** service.
2. Create a **DocDB cluster**.

### Alarm Creation (Instance Metrics)

This section explains how to create a CloudWatch alarm that monitors available storage on each DocumentDB instance. The alarm triggers when storage drops below a defined threshold and is required for the test to pass.

1. Navigate to the **CloudWatch** service.
2. Select **Create alarm**.
3. Choose **Select Metric**.
4. Select **DocDB**.
5. Select **Instance Metrics**.
6. Search for `FreeLocalStorage`.
7. Select the checkbox for the database instance.
8. Set the condition to **Static→ Lower → than 10000 **(10000 is an illustrative example; choose a value appropriate for your environment)
9. Select **Next**.
10. Choose or create an **SNS topic**.
11. Select **Next**.
12. Enter an alarm name.
13. Select **Next**, then **Create alarm**.

### Subscription Confirmation

This section ensures the alarm can send notifications to the appropriate recipients. The test requires at least one confirmed SNS subscription so alerts are delivered when the alarm is triggered.

**Option 1: Create a new subscription**

1. Navigate to **SNS** and select **Subscriptions**.
2. Select **Create subscription**.
3. Use the SNS topic ARN created with the alarm.
4. Set **Protocol** to **Email**.
5. Enter an email address (typically a monitored team inbox).
6. Select **Create subscription**.
7. Confirm the subscription using the verification email sent to the inbox.

**Option 2: Confirm an existing subscription**

1. Navigate to **SNS** and select **Topics**.
2. Select the topic created with the alarm.
3. Under **Subscriptions**, select the subscription.
4. Choose **Confirm subscription**.
5. Verify the confirmation email.

**Note (Cluster Metrics):** You may also need to configure this alarm under **Cluster Metrics** for DocDB. Ensure the condition is set to **Static → Lower than → 10000** (example value).

---

## AWS – Amazon RDS

### Supported Metrics by Engine

This section identifies which CloudWatch storage metric to use based on your RDS engine type. Selecting the correct metric ensures the alarm evaluates the appropriate storage behavior for your database.

- For RDS Aurora PostgreSQL and Aurora MySQL (including Serverless v1), use `FreeLocalStorage`.
- For Aurora Serverless v2, use `TempStorageThroughput`.
- For RDS MySQL and RDS PostgreSQL, use `FreeStorageSpace`.

### Database Creation

This section covers creating an RDS database instance in AWS. The database instance is the resource Drata checks for storage monitoring and alert configuration.

1. In AWS, navigate to the **RDS** service.
2. Select **Create database**.
3. Choose **Standard create**.
4. Configure the database:
   - Engine options: Any
   - Template: Select as appropriate
   - Set a DB instance identifier
   - Credentials: Select **Auto-generate password**
   - Set a DB instance size
   - Availability & durability: **Multi-AZ deployment – Do not create a standby instance**
5. Select **Create database**.

### Alarm Creation - Database Instance

This section describes how to create a CloudWatch alarm that monitors storage usage on an individual RDS database instance. This alarm is required for each instance being evaluated.

1. Navigate to **CloudWatch**.
2. Select **Create CloudWatch Alarm**.
3. Choose **Select Metric**.
4. Select **RDS**.
5. Select **Per-Database Metrics**.
6. Search for the appropriate metric based on your engine.
   - Search for "`FreeLocalStorage`" on Aurora PostgreSQL and/or Aurora MySQL (including Serverless v1)
   - Search for "`TempStorageThroughput`" on Aurora Serverless v2
   - Search for "`FreeStorageSpace`" on RDS PostgreSQL
7. Select the checkbox for the database.
8. Set the condition to **Static→ Lower → than [Choose a value that makes sense for your setup such as 10000]**(10000 is an illustrative example)
9. Select **Next**.
10. Choose an **SNS topic**.
11. Select **Next**.
12. Enter an alarm name.
13. Select **Next**, then **Create alarm**.

### Alarm Creation - Database Cluster

This section explains how to configure an additional CloudWatch alarm at the cluster level for clustered RDS engines, such as Aurora. This ensures storage monitoring is in place for cluster-level metrics.

1. Navigate to **CloudWatch**.
2. Select **Create alarm**.
3. Choose **Select Metric**.
4. Select **RDS**.
5. Select **DBClusterIdentifier Metrics**.
6. Search for your appropriate metric:
   - Search for "`FreeLocalStorage`" on Aurora PostgreSQL and/or Aurora MySQL (including Serverless v1)
   - Search for "`TempStorageThroughput`" on Aurora Serverless v2
   - Search for "`FreeStorageSpace`" on RDS PostgreSQL
7. Select the checkbox for the database cluster.
8. Set the condition to **Static→ Lower → than [Choose a value that makes sense for your setup such as 10000]**(10000 is an illustrative example)
9. Select **Next**.
10. Choose an **SNS topic**.
11. Select **Next**.
12. Enter an alarm name.
13. Select **Next**, then **Create alarm**.

### Subscription Confirmation

This section confirms that the SNS topic associated with the alarm has an active, confirmed subscription. Without a confirmed subscription, alerts cannot be delivered and the test will fail.

1. Go to SNS and select Subscriptions
2. Click "Create subscription" and reference the newly created topic for the Topic ARN
3. For Protocol select Email
4. For Endpoint enter an email address, generally a monitored team inbox
5. Click "Create subscription" and verify the email that was sent to your provided inbox

Alternatively:

1. Go to SNS and select Topics
2. Click the topic name created with the alarm
3. Under the Subscriptions banner, click the radio button for the topic's subscription
4. Click "Confirm subscription" and verify the email that was sent to your provided inbox

---

## Azure – MariaDB, MySQL, PostgreSQL

1. Create a **MariaDB**, **MySQL**, or **PostgreSQL** server.
2. Create an alert rule for **Storage percent**.
3. Add an action to the alert rule.
4. Ensure **Target resource type** is set.
5. Ensure **Target resource region** is set.
6. Save the alert rule.

---

## Azure – SQL Database

1. Create an **Azure SQL Server**.
2. Create an **SQL Database** on the server.
3. Create an alert rule on the database for:
   - **Data Space Used**, or
   - **Data Space Used Percent**
4. Add an action to the alert rule.
5. Ensure **Target resource type** is set.
6. Ensure **Target resource region** is set.
7. Save the alert rule.

---

## Azure – SQL Managed Instance

1. Create a **SQL Managed Instance**.
2. Create at least one managed database under the instance.
3. Create an alert rule on the **SQL Managed Instance** (not the individual or lower level database) for **Storage space used**.
4. Add an action to the alert rule.
5. Ensure **Target resource type** is set.
6. Ensure **Target resource region** is set.
7. Save the alert rule.

---

## GCP – Cloud SQL

### Database Creation

1. In GCP, navigate to the **Cloud SQL** service.
2. Create an instance.
3. Select a database engine.
4. Enter an **Instance ID**.
5. Set a root user password.
6. Select a **Region** and **Zone**.
7. Under **Customize your instance**, select **Show Configuration Options**.
8. Open "Machine type"
   - Select a machine size
   - Open "Backups"
   - Make sure "Automate backups" is checked
9. Set other settings as desired
10. Click on Create button

### Alert Creation

1. Navigate to **GCP Monitoring**.
2. Select **Alerting** from the left menu.
3. Select **Create policy**.
4. On the "**Create alerting policy**" form click on **Add Condition.**
5. In **Find resource type and metric**, search for **SQL**.
6. Select **Disk utilization**.
7. Set:
   - Resource type: **Cloud SQL Database**
   - Metric: **Disk utilization**
8. By default the GCP Alert UI may only show "Active" metrics, and you may need to turn that toggle off to see the required option
9. In the configuration add a value for Threshold: Choose a value that makes sense for your setup such as 70. 70 is an illustrative example
10. Select **Add**.
11. Under **Alert details**, assign a notification channel (any except mobile cloud console).
12. Select **Next**.
13. Enter an alert name.
14. Select **Save**.

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 114: Database Read I/O Monitored](test-114-database-read-i-o-monitored.md)
- [Test 115: Messaging Queue Message Age Monitored](test-115-messaging-queue-message-age-monitored.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)

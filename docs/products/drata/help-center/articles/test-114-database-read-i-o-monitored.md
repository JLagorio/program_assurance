# Test 114: Database Read I/O Monitored

Source: https://help.drata.com/en/articles/4776984-test-114-database-read-i-o-monitored
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company database monitoring configuration to determine if I/O is monitored, with appropriate alerts.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Databases Monitored and Alarmed **control that ensures your company has implemented tools to monitor databases and notify appropriate personnel of any events or incidents, based on predetermined criteria.

## WHAT TO DO IF A TEST FAILS

If Drata detects that database I/O utilization monitoring is not enabled or that alerts have not been properly set up the test will fail. With a failed test you will receive a list of databases that lack I/O monitoring or administrative alerts.

To remediate a failed test, you will need to set up and configure monitoring for database I/O utilization to ensure they are monitored with alerts being sent to DB admins in an event or incident.

## STEPS FOR PASSING

To ensure a validated state when testing for monitoring of the database read I/O, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

***NOTE: If you are using the Datadog integration for this test, please see [this help article](datadog-integration-guide.md) for the metrics to be used.***

### AWS - DocDB

**Database Creation**

1. Within AWS, go to the DocDB service.
2. Create a DocDB cluster.

**Alarm Creation**

1. Go to CloudWatch service.
2. Click on Create CloudWatch.
3. Click on Select Metric.
4. Click on DocDB.
5. Click on Instance Metrics.
6. Search for "ReadIOPS".
7. Click on the checkbox for DB.
8. Conditions - Static -> Greater -> than 10000. *(10000 is an illustrative example; choose a value that makes sense for your setup.)*
9. Click on the Next button.
10. Select an SNS topic.
11. Click on the Next button.
12. Enter a name.
13. Click on the Next button.
14. Click on the Create alarm button.

**Subscription Confirmation**

The subscription to the SNS topic used (or newly created) above must be confirmed for the test to pass.

1. Go to SNS and select Subscriptions.
2. Click "Create subscription" and reference the newly created topic for the Topic ARN.
3. For Protocol select Email.
4. For Endpoint enter an email address, generally a monitored team inbox.
5. Click "Create subscription" and verify the email that was sent to your provided inbox.

Alternatively:

1. Go to SNS and select Topics.
2. Click the topic name created with the alarm.
3. Under the Subscriptions banner, click the radio button for the topic's subscription.
4. Click "Confirm subscription" and verify the email that was sent to your provided inbox.

**Note:** You may also need to perform this check within Cluster Metrics on DocDB. Ensure that the conditions for DocDB cluster are Static -> Greater -> than 10000 (as an example).

---

### AWS - RDS

For RDS Aurora MySQL (including Serverless v1 and v2), use `SelectThroughput`. For RDS Aurora PostgreSQL, and for RDS MySQL, use `ReadIOPS`.

**Database Creation**

1. Within AWS, go to the RDS service.
2. Click on Create database button.
3. Click on Standard create.
   - Engine options - any
   - Set a templates
   - Set a DB instance identifier
   - Credentials Settings - click on "Auto generate a password"
   - Set a DB instance size
   - Availability & durability - Multi-AZ deployment - Do not create a standby instance
4. Click on Create database button.

**Alarm Creation - Database Instance**

1. Go to CloudWatch service.
2. Click on Create CloudWatch Alarm.
3. Click on Select Metric.
4. Click on RDS.
5. Click on Per-Database Metrics.
6. Search for "ReadIOPS" on Aurora PostgreSQL, or "SelectThroughput" on Aurora MySQL.
7. Click on the checkbox for DB.
8. Conditions - Static -> Greater -> than 10000. *(10000 is an illustrative example; choose a value that makes sense for your setup.)*
9. Click on the Next button.
10. Select an SNS topic.
11. Click on the Next button. Enter a name.
12. Click on the Next button.
13. Click on the Create alarm button.

**Alarm Creation - Database Cluster**

1. Go to CloudWatch service.
2. Click on Create CloudWatch Alarm.
3. Click on Select Metric.
4. Click on RDS.
5. Click on DBClusterIdentifier Metrics.
6. Search for "ReadIOPS" on Aurora PostgreSQL, or "SelectThroughput" on Aurora MySQL.
7. Click on the checkbox for DB cluster name.
8. Conditions - Static -> Greater -> than 10 (units are in percentages). *(10 is an illustrative example; choose a value that makes sense for your setup.)*
9. Click on the Next button.
10. Select an SNS topic.
11. Click on the Next button. Enter a name.
12. Click on the Next button.
13. Click on the Create alarm button.

**Subscription Confirmation**

The subscription to the SNS topic used (or newly created) above must be confirmed for the test to pass.

1. Go to SNS and select Subscriptions.
2. Click "Create subscription" and reference the newly created topic for the Topic ARN.
3. For Protocol select Email.
4. For Endpoint enter an email address, generally a monitored team inbox.
5. Click "Create subscription" and verify the email that was sent to your provided inbox.

Alternatively:

1. Go to SNS and select Topics.
2. Click the topic name created with the alarm.
3. Under the Subscriptions banner, click the radio button for the topic's subscription.
4. Click "Confirm subscription" and verify the email that was sent to your provided inbox.

---

### Azure - MariaDB and MySQL

When creating your alert rule, use whichever metric your environment exposes:

- `io_consumption_percent`
- `physical_data_read_percent`
- `iops`
- `read_iops`
- `io_bytes_read`

1. Create a MariaDB or MySQL server.
2. Create an alert rule for "IO Percent".
3. Add an action to the alert rule.
4. Ensure target resource type is set.
5. Ensure target resource region is set.
6. Save changes.

---

### Azure - PostgreSQL (Single Server and Flexible Server)

Test 114 supports both Azure PostgreSQL Single Servers (`servers`) and Flexible Servers (`flexibleServers`). The same accepted metric names apply to both resource types.

When creating your alert rule, use whichever metric your environment exposes:

- `io_consumption_percent`
- `physical_data_read_percent`
- `iops`
- `read_iops`
- `io_bytes_read`

1. Create an Azure Database for PostgreSQL server (Single Server or Flexible Server).
2. Create an alert rule using any of the accepted metric names listed above.
3. Add an action to the alert rule.
4. Set the target resource type if applicable.
5. Set the target resource region if applicable.
6. Save changes.

---

### Azure - SQL

1. Create an Azure SQL Server.
2. Create an SQL Database on that server.
3. Create an alert rule on that database for "Data IO Percentage".
4. Add an action to the alert rule.
5. Ensure target resource type is set.
6. Ensure target resource region is set.
7. Save changes.

---

### Azure - SQL Managed Instance

1. Create a SQL Managed Instance.
2. Create at least one managed DB under it.
3. Create an alert rule on the SQL Managed Instance (not the lower level DB) for "IO bytes read".
4. Add an action to the alert rule.
5. Ensure target resource type is set.
6. Ensure target resource region is set.
7. Save changes.

---

### Azure MySQL Flexible Servers

1. Create a flexible server.
2. Create an alert rule for either "IOPS" or "Read IOPS".
3. Add an action to the alert rule.
4. Ensure target resource type is set.
5. Ensure target resource region is set.
6. Save changes.

---

### GCP - SQL

**Database Creation**

1. Within GCP, go to the SQL service.
2. Create an instance.
3. Click on a database engine.
4. Enter an Instance ID.
5. Set a password for the root user.
6. Select a Region.
7. Select any Zone.
8. Database version.
9. Click on Show configuration options.
10. Open the "Backups, recovery, and high availability". Make sure to click on Automate backups.
11. Open the "Machine type and storage". Select a machine size.
12. Disable the "Enable automatic storage increases".
13. Click on Create button.

**Alert Creation**

1. Navigate to the GCP Monitoring service.
2. On the left menu click on "Alerting".
3. Click on "Create policy" button.
4. On the "Create alerting policy" form click on Add Condition.
5. In the "Find resource type and metric", search for SQL.
6. Click on Disk read IO.
7. Set a resource type: Cloud SQL Database.
8. Metric: Disk read IO. *(For steps 5-8, by default the GCP Alert UI may only show "Active" metrics, and you may need to turn that toggle off to see the required option.)*
9. In the configuration add a value for Threshold: 10000. *(10000 is an illustrative example; choose a value that makes sense for your setup.)*
10. Click the ADD button.
11. Under Alert Details, assign an active Notification Channel (any except mobile cloud console will work).
12. Click on Next button.
13. Enter an Alert name.
14. Click on Save button.

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 115: Messaging Queue Message Age Monitored](test-115-messaging-queue-message-age-monitored.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)

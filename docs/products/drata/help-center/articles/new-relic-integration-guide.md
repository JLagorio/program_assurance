# New Relic Integration Guide

Source: https://help.drata.com/en/articles/7830080-new-relic-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: This article describes how to set up a New Relic Connection for the first time within Drata.

## Article text

The New Relic integration enables security and compliance teams to verify that infrastructure monitoring and alerting controls are properly configured. It connects Drata to New Relic so your team can validate monitoring alerts for infrastructure metrics and provide evidence that systems are actively monitored.

## Key Capabilities

- Infrastructure monitoring verification: Validate alerts for key infrastructure metrics
- Alert configuration monitoring: Confirm alert conditions exist in New Relic
- Automated evidence collection: Provide proof that infrastructure monitoring controls are configured

This integration is used to automate tests such as infrastructure monitoring verification and database monitoring validation, helping prove compliance with infrastructure monitoring and operational security policies.

## Prerequisites & Data Access

- **Administrator access** to your New Relic account
- Ability to generate a **New Relic API Key (User key type)**
- Your **New Relic Account ID**
- AWS integrated with New Relic for infrastructure monitoring tests
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Important requirement:

- Drata currently supports **New Relic’s US data center region only**.
- EU region accounts typically use URLs beginning with:
   `rpm.eu.newrelic.com`

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| New Relic API Key (User type) | Allows Drata to authenticate and retrieve alert and monitoring data |
| Alerts view permission | Allows Drata to verify monitoring alerts and policies |
| AWS integration in New Relic | Enables infrastructure monitoring tests to validate AWS metrics |

## Step-by-Step Setup

### Step 1: Verify AWS Integration in New Relic

All New Relic monitoring tests require an **AWS ↔ New Relic integration**.

1. Log in to your **New Relic account**.
2. Verify that **Amazon Web Services** is installed under your New Relic integrations.
3. If the integration is not configured, follow New Relic’s guide to connect AWS.

Expected outcome: New Relic can retrieve AWS infrastructure metrics required for Drata monitoring tests.

---

### Step 2: (Optional) Create a Custom Role

Drata only requires the ability to **view Alerts**. Creating a service account with limited permissions is recommended.

1. Navigate to **[https://one.newrelic.com](https://one.newrelic.com)**.
2. Hover over your **username** and select **Administration**.
3. Create a **custom role** following New Relic’s role management guide.
4. Configure the role with **View permissions for Alerts**.
5. Assign the role to the user that will generate the API key.

Expected outcome: A user account exists with limited permissions to access alert data.

---

### Step 3: Create a New Relic API Key

1. Navigate to **[https://one.newrelic.com](https://one.newrelic.com)**.
2. Hover over your **username** and select **API Keys**.
3. Click **Create a key**.
4. Configure the following:
   - **Account:** Select the account used for the connection
   - **Key type:** `User`
   - **Key name:** Drata recommends `Drata API Key`
5. Click **Create a key**.
6. After the key is created:
   - Click the **“…” menu**
   - Select **Copy Key**

Important:
Copy the **API Key**, not the **Key ID**.

Expected outcome: You have a New Relic API key for the integration.

---

### Step 4: Find Your Account ID

1. Log in to **New Relic**.
2. Navigate to your **account settings**.
3. Locate and copy your **Account ID**.

Expected outcome: You have the Account ID required for the connection.

---

### Step 5: Connect New Relic in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **New Relic** connection process.
4. Enter the following when prompted:
   - **Account ID**
   - **API Key**
   - **Region:** US

Expected outcome:
New Relic is successfully connected and monitoring configuration data begins syncing to Drata.

## Important Notes

- Drata currently supports **New Relic’s US data center region only**.
- If your New Relic URL begins with `rpm.eu.newrelic.com`, your account is in the **EU region**, which is not currently supported.
- For infrastructure monitoring tests to pass:
   - Monitoring alerts must exist in New Relic
   - Alerts must contain the expected infrastructure metrics
   - Active notifications must be configured for the alert policies
- AWS infrastructure must be connected to New Relic for monitoring tests to validate AWS metrics.
- **Important Note: **At this time, Drata only supports New Relic's US data center region. If you are uncertain of your region, an EU region URL will begin with "rpm.eu.newrelic.com/."
- It is recommended to create a service account user to limit the access that Drata has to your New Relic instance. The steps below detail how to do that. Full permission capabilities can be found here: [https://docs.newrelic.com/docs/accounts/accounts-billing/new-relic-one-user-management/user-capabilities/#alerts](https://docs.newrelic.com/docs/accounts/accounts-billing/new-relic-one-user-management/user-capabilities/#alerts)

| Monitoring Test | New Relic Metric Name |
|---|---|
| Database CPU Monitored | **RDS:**<br>- provider.cpuUtilization<br>- provider.cpuUtilization.*<br>- aws.rds.CPUUtilization<br>- aws.rds.CPUUtilization.*<br>**DocDB:**<br>- provider.cpuUtilization<br>- provider.cpuUtilization.*<br>- aws.docdb.CPUUtilization<br>- aws.docdb.CPUUtilization.* |
| Database Free Storage Space Monitored | **RDS Free Storage Space:**<br>- provider.freeStorageSpace<br>- provider.freeStorageSpace.*<br>- provider.freeStorageSpaceBytes<br>- provider.freeStorageSpaceBytes.*<br>- aws.rds.FreeStorageSpace<br>- aws.rds.FreeStorageSpace.*<br>**RDS Free Local Storage:**<br>- provider.freeLocalStorageBytes<br>- provider.freeLocalStorageBytes.*<br>- aws.rds.FreeLocalStorage<br>- aws.rds.FreeLocalStorage.*<br>**DocDB Free Local Storage:**<br>- provider.freeLocalStorageBytes<br>- provider.freeLocalStorageBytes.*<br>- aws.docdb.FreeLocalStorage<br>- aws.docdb.FreeLocalStorage.* |
| Database Read I/O Monitored | **RDS Read IOPS and SelectThroughput:**<br>- provider.readIops<br>- provider.readIops.*<br>- aws.rds.ReadIOPS<br>- aws.rds.ReadIOPS.*<br>- aws.rds.select_throughput<br>- aws.rds.select_throughput.*<br>**DocDB ReadIOPS and SelectThroughput:**<br>- provider.readIops<br>- provider.readIops.*<br>- aws.docdb.ReadIOPS<br>- aws.docdb.ReadIOPS.*<br>- aws.docdb.select_throughput<br>- aws.docdb.select_throughput.* |
| Messaging Queue Message Age Monitored | provider.approximateAgeOfOldestMessage<br>aws.sqs.ApproximateAgeOfOldestMessage |
| Infrastructure Instance CPU Monitored | **Instance CPUUtilization:**<br>- provider.cpuUtilization<br>- provider.cpuUtilization.*<br>- aws.ec2.CPUUtilization<br>- aws.ec2.CPUUtilization.*<br>- cpuPercent<br>- cpuPercent.*<br>**Cluster CPUUtilization:**<br>- provider.cpuUtilization<br>- provider.cpuUtilization.*<br>- aws.ecs.CPUUtilization<br>- aws.ecs.CPUUtilization.*<br>- cpuPercent<br>- cpuPercent.* |

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)
- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [AWS CodeCommit Integration Guide](aws-codecommit-integration-guide.md)
- [Datadog Integration Guide](datadog-integration-guide.md)

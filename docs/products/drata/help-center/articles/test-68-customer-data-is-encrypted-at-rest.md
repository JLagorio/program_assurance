# Test 68: Customer Data is Encrypted at Rest

Source: https://help.drata.com/en/articles/4776970-test-68-customer-data-is-encrypted-at-rest
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company configuration of the database(s) storing customer data to determine if the data is encrypted at rest.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Customer Data is Encrypted at Rest **control that ensures your company stores customer data in databases that are encrypted at rest.

**WHAT TO DO IF A TEST FAILS**

If Drata finds production databases that are not encrypted at rest the test will fail. With a failed test you will receive a list of production databases that do not have encryption enabled.

To remediate a failed test, you will need to properly configure these databases to enable encryption.

**STEPS FOR PASSING**

To ensure a validated state when testing for encryption at rest, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **Atlas** | 1. Within Atlas, create an organization project if there is none<br>2. Click New Project and give it a unique name!<br>3. On a project, click Create a New Cluster<br>4. Any pricing tier / configuration will pass this test<br>5. Click Create |
| **AWS - DynamoDB** | By default, DynamoDB is fully encrypted at rest. |
| **AWS - OpenSearch (formerly Elasticsearch)** | **Step 1 - Choose Deployment Type**<br>1. Within AWS, go to OpenSearch service (formerly Elasticsearch)<br>2. Click on 'Create a new domain'<br>3. Choose deployment type (Development and Testing) [One availability zone ]<br>   1. Choose latest Version under 'OpenSearch Version'<br>   2. Choose a name for 'OpenSearch domain name'<br>   3. Unless needed, custom endpoint can be left blank<br>**Step 2 - Configure Domain**<br>1. Data Nodes: Instance Type - t3.small.elasticsearch (smallest instance type)<br>2. Number of Nodes: 1<br>3. Data nodes storage: leave everything as is<br>4. Dedicated master nodes: leave everything as is<br>**Step 3 - Configure Access and Security**<br>1. Select VPC Access<br>2. Set VPC<br>3. Set Subnet<br>4. Set Security Groups<br>5. Uncheck Enable fine-grained access control<br>6. Set Access Policy: Domain access policy - "Allow open access to the domain"<br>7. Set Encryption: Click on "Enable encryption of data at rest"<br>8. Click on Next button<br>9. Click on Confirm button |
| **AWS - Elasticache for Redis** | 1. Within AWS, go to ElastiCache service<br>2. Click on Redis Clusters<br>3. Click on Create Redis cluster - *note that any settings not explicitly mentioned are optional/configurable for your business needs*<br>   1. Configure and create a new cluster<br>   2. Enter a name<br>   3. Location - Amazon Cloud<br>   4. Enable Multi-AZ<br>   5. Number of replicas: at least 1<br>   6. Click Next<br>   7. Click on Enable checkbox for Encryption at rest<br>4. Click Next<br>5. Click Create |
| **GCP - SQL** | 1. Within GCP, go to SQL service<br>2. Create an instance<br>3. Click on a database engine<br>   1. Enter an Instance ID<br>   2. Set a password for the root user<br>   3. Select a region<br>   4. Select any zone<br>   5. Set a database version<br>   6. Click on Show configuration options<br>   7. Open the ""Backups, recovery, and high availability""<br>   8. DO NOT click on Automate backups<br>   9. Open the ""Machine type and storage""<br>   10. Select a machine size<br>   11. Disable the ""Enable automatic storage increases""<br>   12. Click on Create button |
| **GCP - Datastore** | 1. Within GCP, go to the Datastore service<br>2. Create an Entity<br>3. Click on Create button |
| **GCP - Memorystore** | 1. Within GCP, go to Google Cloud Memorystore for Redis API service<br>2. Click on Enable<br>3. Click on Create |

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 107: Daily Database Backups](test-107-daily-database-backups.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)

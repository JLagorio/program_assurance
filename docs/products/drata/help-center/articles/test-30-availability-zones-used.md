# Test 30: Availability Zones Used

Source: https://help.drata.com/en/articles/4776928-test-30-availability-zones-used
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company infrastructure configurations to determine if multiple availability zones (AZs) are utilized.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Multiple Availability Zones **control that ensures your company utilizes multiple availability zones (AZs) to replicate production data across different zones.

**WHAT TO DO IF A TEST FAILS**

If Drata finds database systems that are not configured to utilize multiple AZs the test will fail. With a failed test you will receive a list of database systems lacking AZ configuration.

To remediate a failed test, you will need to ensure that all production databases have multiple AZ replication enabled.

**STEPS FOR PASSING**

To ensure a validated state when testing for Availability Zones, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **Atlas** | 1. Create an organization project, if none currently exist<br>2. Click New Project and make sure to give it a unique name<br>3. On a project, click Create a New Cluster<br>   1. Any pricing tier / configuration will pass this test<br>4. Click Create |
| **AWS - DocDB** | 1. Go to DocDB service<br>2. Create a DocDB cluster |
| **AWS - DynamoDB** | By default, DynamoDB is replicated. There should be no additional configuration needed. |
| **AWS - Elasticache** | 1. Navigate to the ElastiCache service<br>2. Click on Redis<br>3. Click on the Create button<br>   1. Cluster Engine - Redis<br>   2. Location - Amazon Cloud<br>   3. Enter a name<br>   4. Set a Node type<br>   5. Click on Multi-AZ<br>4. Click on Create button |
| **AWS - Elasticsearch** | 1. Choose deployment type<br>   1. Go to Elasticsearch service<br>   2. Click on 'Create a new domain'<br>   3. Choose deployment type<br>      1. (Development and Testing) [One availability zone ]<br>   4. Choose latest Version under 'Elasticsearch Version'<br>   5. Choose a name for 'Elasticsearch domain name'<br>   6. Custom endpoint - leave blank<br>2. Configure domain<br>   1. Set Data Nodes<br>   2. Set Number of Nodes: 2<br>   3. Data nodes storage: leave everything as is<br>   4. Dedicated master nodes: leave everything as is<br>3. Configure access and security<br>   1. Select VPC Access:<br>   2. Uncheck Enable fine-grained access control<br>   3. Access Policy: Domain access policy - Allow open access to the domain<br>4. Click submit |
| **AWS - RDS** | 1. Go to RDS service<br>2. Click on Create database button<br>3. Click on Standard create<br>   1. Engine options - any<br>   2. Templates - Dev/test<br>   3. DB instance identifier - enter a name<br>   4. Credentials Settings - click on "Auto generate a password"<br>   5. DB instance size - smallest one<br>   6. Availability & durability - Multi-AZ deployment - Create a standby instance (recommended for production usage)<br>4. Click on Create database button |
| **AWS - S3** | We do not check - S3 since AWS does not replicate to different AZ, |
| **GCP - Memcache** | 1. GCP Menu -> Databases -> Memorystore -> Memcached<br>2. Create Instance<br>   1. Set Instance ID<br>   2. Set Region<br>   3. Set Zone<br>   4. Set Nodes: 1<br>   5. Set Memory per node<br>   6. Set Cores per Node |
| **GCP - Redis** | 1. GCP Menu -> Databases -> Memorystore -> Redis<br>2. Create Instance<br>   1. Set Instance ID<br>   2. Set Tier<br>   3. Set Location<br>   4. Set Capacity<br>3. Click Save |
| **GCP - MySQL** | 1. GCP Menu -> Databases -> SQL<br>2. Create Instance<br>3. Select MySQL<br>   1. Set Instance ID<br>   2. Set Region<br>   3. Set Zone<br>   4. Set Database Version<br>4. Open 'Show Configuration Options'<br>5. Open 'Backups, recovery, and high availability'<br>   1. Under Availability: Select 'High Availability (regional)' |

**HELPFUL RESOURCES**

- [AZs within AWS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [AZs within Azure](https://docs.microsoft.com/en-us/azure/availability-zones/az-overview)

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 114: Database Read I/O Monitored](test-114-database-read-i-o-monitored.md)
- [Test 130: Load Balancer Used](test-130-load-balancer-used.md)
- [Test 107: Daily Database Backups](test-107-daily-database-backups.md)

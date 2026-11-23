# Test 108: Storage Data Versioned or Retained

Source: https://help.drata.com/en/articles/4778759-test-108-storage-data-versioned-or-retained
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects all data stores to determine if the data versioning configuration is enabled.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Storage Buckets are Versioned **control that ensures storage buckets containing customer data are versioned appropriately.

**Note:** Azure Storage Accounts of type **StorageV2** are not included in this test. This is due to limitations in how this storage type handles required configuration options.

## WHAT TO DO IF A TEST FAILS

If Drata detects data stores that are not configured for versioning the test will fail. With a failed test you will receive a list of data stores that require versioning.

To remediate a failed test, you will need to enable data versioning on the reported data stores.

## STEPS FOR PASSING

To ensure a validated state when testing for versioning within storage data, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - S3** | 1. Within AWS, go to the S3 service<br>2. Create a new Bucket<br>3. Enable: Bucket Versioning<br>4. Save Bucket |
| **Azure - Storage Accounts** | 1. Within Azure, go to storage accounts<br>2. Create a storage account<br>3. Enable blob versioning for this account<br>**Note:** Azure Storage Accounts of type **StorageV2** are not included in this test. This is due to limitations in how this storage type handles required configuration options. |
| **GCP - Storage** | 1. Within GCP, go to the Storage service<br>2. Create a Bucket<br>3. Choose a Location type (any)<br>4. Choose a default storage class for your data (any)<br>5. Choose how to control access to objects<br>   1. Access control - Fine-grained<br>6. Choose how to protect object data<br>   1. Choose either [Object versioning](https://cloud.google.com/storage/docs/object-versioning) or a [Retention policy](https://cloud.google.com/storage/docs/bucket-lock)<br>7. Click on Create button |

## HELPFUL RESOURCES

- [Using versioning in AWS S3 buckets](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [Using versioning in Google Cloud buckets](https://cloud.google.com/storage/docs/object-versioning)
- [Using retention policies in Google Cloud buckets](https://cloud.google.com/storage/docs/bucket-lock)
- [Using versioning in Azure buckets](https://docs.microsoft.com/en-us/azure/storage/blobs/versioning-overview)

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 104: Cloud Storage Public Access Disabled](test-104-cloud-storage-public-access-disabled.md)

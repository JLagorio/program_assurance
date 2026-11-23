# Test 69: Customer Data in Cloud Storage is Encrypted at Rest

Source: https://help.drata.com/en/articles/4776971-test-69-customer-data-in-cloud-storage-is-encrypted-at-rest
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company cloud storage configuration to ensure customer data is encrypted at rest when stored.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Customer Data is Encrypted at Rest **control that ensures your company stores customer data in databases that are encrypted at rest.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that stored cloud data is not encrypted at rest the test will fail. With a failed test you will receive a list of cloud data stores that do not have encryption enabled.

To remediate a failed test, you will need to properly configure these cloud data stores to enable encryption.

**STEPS FOR PASSING**

To ensure a validated state when testing for encryption at rest, please follow the below steps. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - S3** | 1. Within AWS, go to the Amazon S3 service<br>2. Create bucket.<br>**Note**: Starting January 5, 2023, objects in Amazon S3 are encrypted by default. Pre-existing unencrypted buckets, created before this update, will also be encrypted**, **but existing objects within those buckets will not be automatically encrypted. For more information, go to [Amazon S3 now automatically encrypts all new objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-encryption-faq.html). |
| **Azure** | 1. Within Azure, on Storage Accounts, click "Create"<br>   1. Set a subscription<br>   2. Set a resource group and give it a unique name<br>   3. Set a location (can be any)<br>   4. Set performance (standard)<br>   5. Set account kind<br>   6. Replication - default<br>   7. Networking - default<br>   8. Data protection - default<br>   9. Advanced - default<br>   10. Tags - default |
| **GCP - Storage Browser** | 1. Within GCP, go to Storage > Browser<br>2. Create a bucket<br>**Note:** All buckets in GCP are encrypted by default so any bucket will pass |

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 104: Cloud Storage Public Access Disabled](test-104-cloud-storage-public-access-disabled.md)
- [Test 108: Storage Data Versioned or Retained](test-108-storage-data-versioned-or-retained.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)

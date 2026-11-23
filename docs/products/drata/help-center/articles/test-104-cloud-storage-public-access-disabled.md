# Test 104: Cloud Storage Public Access Disabled

Source: https://help.drata.com/en/articles/4777046-test-104-cloud-storage-public-access-disabled
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects the cloud data storage access configuration(s) to determine if read/write access is configured to restrict public access.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Threat Detection System** control. A threat detection system is in place to monitor web traffic and suspicious activity. When anomalous traffic activity is identified, alerts are automatically sent to personnel, investigated, and escalated through the incident management process, if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that you have one or more publicly exposed cloud data stores, the test will fail. With a failed test you will receive a list of cloud data store names that are publicly exposed.

To remediate a failed test, you will need to update your access configuration(s) to block public access to the exposed cloud data stores

### STEPS FOR PASSING

To ensure a validated state when testing that restricted access has been applied to cloud data storage, follow the steps that are related to your provider listed below.

Once the provider steps have been completed, navigate back to Drata and execute the test.

---

### AWS - S3

**New bucket creation:**

1. Within AWS, go to the S3 service.
2. Click the "Create bucket" button.
3. Check the "Block all public access" box under the "Block Public Access settings for this bucket" section.
4. Save the bucket.

**Edit existing bucket:**

1. Within AWS, go to the S3 service.
2. Click on the bucket name.
3. Click on the "Permissions" tab.
4. Under the "Block public access (bucket settings)" section, ensure that "Block all public access" is set to "On".
5. If not, click "Edit," and check the box for "Block all public access".
6. Click "Save changes".

**NOTE**: Currently the account-level setting for "block public access" is not supported.

---

### Azure - Storage Accounts

> **Note**: For Azure storage accounts, the test will verify the following:
>
> 1. Whether `allowBlobPublicAccess` is set to `false` for each storage account.
>    - If the `allowBlobPublicAccess` flag is missing, it will be assumed as `true`.
> 2. Whether `networkRuleSet.defaultAction` is not set to `ALLOW` for each storage account.
> 3. If a storage account does not pass either point 1 or point 2, the test will check if `publicAccess` is set to `NONE` for each storage container.
>
> If a storage account does not pass point 1 and 2, each storage container is verified if `publicAccess` is set to NONE.

1. Within Azure, go to Storage accounts service.
2. Click on the Create icon.
   1. Set subscription.
   2. Set resource group - Create or select an existing.
   3. Add instance details - Add any name and any location.
3. Click on Review + create button.
4. Click on Create button.
5. Click on the storage account name.
6. Click on the Containers CTA (under Data storage).
7. Click on the Containers plus icon.
   - Add a name.
   - Set public access level:
      - Blob is (Public).
      - Container is (Public).
8. Click on the create button.

**To verify the container's public access level:**

1. Click on the Containers tab.
2. Click the three-dot icon to the far right of the given container.
3. Click Change access level.
4. Change the access to Private.
5. Click on the OK button.

To verify the Network Access level go to the storage account and click on **Security + networking** from the left menus:

1. Navigate to Networking.
2. Allow access from **Enabled from selected virtual networks and IP addresses.**
3. In the Firewall section - Click on Add your client IP address.
4. Enter the client IP address.
5. Click on the Save icon.

The following container and storage account levels will pass the test successfully:

- Public Account + Private Container (for that container only)
- Private Account + Public Container (for the whole account)
- Private Account + Private Container (for the whole account)

---

### Digital Ocean - Spaces

1. Within Digital Ocean, create a new space.
2. Restrict File Listing.

When connecting Digital Ocean within Drata, please follow the "connect with spaces" flow.

---

### GCP - Storage

1. Within GCP, go to Storage service.
2. Create a Bucket.
3. Choose a Location type (any).
4. Choose a default storage class for your data (any).
5. Choose how to control access to objects.
   - Access control
      - Fine-grained is recommended.
      - If you want to use "Uniform," you must also check the box for "Enforce public access prevention on this bucket".
6. Click on Create button.
7. Click on the Permissions tab.
8. Ensure that `allUsers` and `allAuthenticatedUsers` are not on the list.
9. Click on Add button.
10. Add users as needed, but ensure that `allUsers` and `allAuthenticatedUsers` are not added.

---

## HELPFUL RESOURCES

- [What is cloud storage?](https://aws.amazon.com/what-is-cloud-storage/)
- [Cloud storage on AWS](https://aws.amazon.com/products/storage/)
- [Cloud storage on Azure](https://azure.microsoft.com/en-us/services/storage/)
- [Cloud storage on Google](https://cloud.google.com/storage)

## Related articles

- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 105: Threat Detection in Place](test-105-threat-detection-in-place.md)
- [Test 108: Storage Data Versioned or Retained](test-108-storage-data-versioned-or-retained.md)

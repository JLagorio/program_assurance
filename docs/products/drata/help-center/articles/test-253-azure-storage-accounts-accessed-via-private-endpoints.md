# Test 253: Azure Storage Accounts Accessed Via Private Endpoints

Source: https://help.drata.com/en/articles/9828851-test-253-azure-storage-accounts-accessed-via-private-endpoints
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that private endpoints are used to access Azure Storage Accounts.

## Article text

Securing traffic between services through encryption protects the data from easy
interception and reading.

**Note**: Only available for Azure.

## ASSOCIATED DRATA CONTROL

This test is part of DCF-55 and DCF-748. The **Encryption in Transit **control (DCF-55) that ensures data in transit is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more Azure Storage Accounts does not require the use of private endpoints for access, the test will fail.

## STEPS TO REMEDIATE

1. Open the 'Storage Accounts' blade.
2. For each listed Storage Account, perform the following.
3. Under the 'Security + networking' heading, click on 'Networking'.
4. Click on the 'Private Endpoint Connections' tab at the top of the networking window.
5. Click the '+ Private endpoint' button.
6. In the '1 - Basics' tab/step:
   - 'Enter a name' that will be easily recognizable as associated with the
      Storage Account .
      - Note: The 'Network Interface Name' will be
         automatically completed, but you can customize it if needed.
   - Ensure that the 'Region' matches the region of the Storage Account.
   - Click Next.
7. In the '2 - Resource' tab/step:
   - Select the 'target sub-resource' based on what type of storage resource
      is being made available.
   - Click Next.
8. In the '3 - Virtual Network' tab/step:
   - Select the 'Virtual network' that your Storage Account will be connecting
      to.
   - Select the 'Subnet' that your Storage Account will be connecting to.
   - (Optional) Select other network settings as appropriate for your
      environment.
   - Click Next.
9. In the '4 - DNS' tab/step:
   - (Optional) Select other DNS settings as appropriate for your environment.
   - Click Next.
10. In the '5 - Tags' tab/step:
   - (Optional) Set any tags that are relevant to your organization
   - Click Next.
11. In the '6 - Review + create' tab/step:
   - A validation attempt will be made and after a few moments it should
      indicate 'Validation Passed' - if it does not pass, double-check your
      settings before beginning more in depth troubleshooting.
   - If validation has passed, click 'Create' then wait for a few minutes for the
      scripted deployment to complete.

Do this for each private endpoint of each failing storage account

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 104: Cloud Storage Public Access Disabled](test-104-cloud-storage-public-access-disabled.md)
- [Test 247: Azure Log Alert for Delete Network Security Group](test-247-azure-log-alert-for-delete-network-security-group.md)
- [Test 263: Azure Storage Accounts Secure TLS Configuration](test-263-azure-storage-accounts-secure-tls-configuration.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)
- [Test 256: Azure SQL Servers Auditing](test-256-azure-sql-servers-auditing.md)

# Test 263: Azure Storage Accounts Secure TLS Configuration

Source: https://help.drata.com/en/articles/9828854-test-263-azure-storage-accounts-secure-tls-configuration
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that the 'Minimum TLS version' for Azure storage accounts is set to TLS version 1.2.

## Article text

TLS 1.0 has known vulnerabilities and has been replaced by later versions of the TLS protocol. Continued use of this legacy protocol affects the security of data in transit.

Note: Only available for Azure.

## ASSOCIATED DRATA CONTROL

This test is part of DCF-55 and DCF-285.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more Azure storage accounts have a minimum TLS version set to an earlier, insecure version, the test will fail.

In some cases, Azure Storage sets the minimum TLS version to be version 1.0 by default. TLS 1.0 is a legacy version and has known vulnerabilities. Continued use of this legacy protocol affects the security of data in transit. This minimum TLS version should be configured to be later protocols such as TLS 1.2.

## STEPS TO REMEDIATE

Go to 'Storage Accounts' and, for each failing storage account, under the 'Setting' section, click on 'Configuration' and set the 'minimum TLS version' to be version 1.2.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 249: Azure Log Alert for Delete Security Solution](test-249-azure-log-alert-for-delete-security-solution.md)
- [Test 253: Azure Storage Accounts Accessed Via Private Endpoints](test-253-azure-storage-accounts-accessed-via-private-endpoints.md)
- [Test 269: Azure App Service Web App Redirects HTTP Traffic to HTTPS](test-269-azure-app-service-web-app-redirects-http-traffic-to-https.md)
- [Test 256: Azure SQL Servers Auditing](test-256-azure-sql-servers-auditing.md)
- [Test 254: Azure Key Vaults Key Expiration](test-254-azure-key-vaults-key-expiration.md)

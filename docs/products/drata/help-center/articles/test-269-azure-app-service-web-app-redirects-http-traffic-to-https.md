# Test 269: Azure App Service Web App Redirects HTTP Traffic to HTTPS

Source: https://help.drata.com/en/articles/9828857-test-269-azure-app-service-web-app-redirects-http-traffic-to-https
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that Web Apps in Azure App Service redirect non-secure HTTP traffic to HTTPS.

## Article text

Enabling HTTPS-only traffic will redirect all non-secure HTTP requests to HTTPS ports. HTTPS uses the TLS/SSL protocol to provide a secure connection which is both encrypted and authenticated. It is therefore important to support HTTPS for the security benefits.

**Note**: Only available for Azure.

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption in Transit **control (DCF-55) that ensures data in transit is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more Web Apps do not redirect all HTTP traffic to HTTPS in Azure App Service, the test will fail. Enabling HTTPS-only traffic will redirect all non-secure HTTP requests to HTTPS ports. HTTPS uses the TLS/SSL protocol to provide a secure connection which is both encrypted and authenticated. It is therefore important to support HTTPS for the security benefits.

## STEPS TO REMEDIATE

1. Go to 'App Services'.
2. Click on a failing Web App.
3. Click on configuration.
4. Under the 'HTTPS Only' heading select 'On' to enable https only.
5. Click 'Save' at the top.
6. Repeat for each failing Web App.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 70: SSL/TLS Enforced on Company Website](test-70-ssl-tls-enforced-on-company-website.md)
- [Test 299: AWS Application Load Balancer Redirects HTTP to HTTPS](test-299-aws-application-load-balancer-redirects-http-to-https.md)
- [Test 253: Azure Storage Accounts Accessed Via Private Endpoints](test-253-azure-storage-accounts-accessed-via-private-endpoints.md)
- [Test 263: Azure Storage Accounts Secure TLS Configuration](test-263-azure-storage-accounts-secure-tls-configuration.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)

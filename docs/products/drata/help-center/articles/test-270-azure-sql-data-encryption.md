# Test 270: Azure SQL Data Encryption

Source: https://help.drata.com/en/articles/9828859-test-270-azure-sql-data-encryption
Collection: Monitoring Test Guidance
Updated: 2025-09-22
Fetched: 2026-11-22
Description: Drata validates that data encryption is enabled on all Azure SQL server databases.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption at Rest** control (DCF-54) that ensures data at rest is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more Azure SQL Server databases does not have encryption enabled in Azure, the test will fail.

**STEPS TO REMEDIATE**

1. Navigate to the 'SQL Databases’.
2. For each failing DB instance, click on ‘Transparent data encryption’
3. For each failing DB instance, set ‘Data encryption’, to ‘On’.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
- [Test 256: Azure SQL Servers Auditing](test-256-azure-sql-servers-auditing.md)
- [Test 257: Azure PostgreSQL Database Server Log Checkpoints](test-257-azure-postgresql-database-server-log-checkpoints.md)

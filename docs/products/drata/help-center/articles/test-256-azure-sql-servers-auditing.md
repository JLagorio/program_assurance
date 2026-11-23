# Test 256: Azure SQL Servers Auditing

Source: https://help.drata.com/en/articles/9999539-test-256-azure-sql-servers-auditing
Collection: Monitoring Test Guidance
Updated: 2025-01-14
Fetched: 2026-11-22
Description: Drata validates that Azure SQL servers auditing is enabled for SQL servers.

## Article text

Enabling auditing at the server level ensures that all existing and newly created databases on the SQL server instance are audited. Auditing tracks database events and writes them to an audit log in the Azure storage account. It also helps to maintain regulatory compliance, understand database activity, and gain insight into discrepancies and anomalies that could indicate business concerns or suspected security violations.

## ASSOCIATED DRATA CONTROL

This test is part of DCF-406 and DCF-407.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more Azure SQL servers has auditing disabled, the test will fail.

Enabling auditing at the server level ensures that all existing and newly created databases on the SQL server instance are audited. Auditing tracks database events and writes them to an audit log in the Azure storage account. It also helps to maintain regulatory compliance, understand database activity, and gain insight into discrepancies and anomalies that could indicate business concerns or suspected security violations.

**Note**: Only available for Azure.

## STEPS TO REMEDIATE

1. Go to SQL servers.
2. Select a SQL server instance that's failing this test.
3. Under Security, click Auditing.
4. Click the toggle next to Enable Azure SQL Auditing.
5. Select an Audit log destination of either Log Analytics, Event Hub, and/or Blob Storage.
6. Click Save.
7. Repeat for each failing SQL server instance.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)
- [Test 257: Azure PostgreSQL Database Server Log Checkpoints](test-257-azure-postgresql-database-server-log-checkpoints.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)

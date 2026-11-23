# Test 257: Azure PostgreSQL Database Server Log Checkpoints

Source: https://help.drata.com/en/articles/10375748-test-257-azure-postgresql-database-server-log-checkpoints
Collection: Monitoring Test Guidance
Updated: 2025-06-30
Fetched: 2026-11-22
Description: Drata validates that 'log_checkpoints' is enabled for all Azure PostgreSQL database servers.

## Article text

Enabling `log_checkpoints` helps the PostgreSQL Database to Log each checkpoint in turn generates query and error logs. Query and error logs can be used to identify, troubleshoot, and repair configuration errors and sub-optimal performance.

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies.

## WHAT TO DO IF A TEST FAILS

If Drata finds that '`log_checkpoints`' is not enabled for one or more PostgreSQL databases, the test will fail. Enabling '`log_checkpoints`' helps the PostgreSQL Database to log each checkpoint, which in turn generates query and error logs. Query and error logs can be used to identify, troubleshoot, and repair configuration errors and sub-optimal performance.

## STEPS TO REMEDIATE

1. Go to 'Azure Database for PostgreSQL server'.
2. For a failing database, click on 'Server parameters'.
3. Search for 'log_checkpoints'.
4. Set to 'On' and save.
5. Repeat for each failing database.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)
- [Test 256: Azure SQL Servers Auditing](test-256-azure-sql-servers-auditing.md)
- [Test 254: Azure Key Vaults Key Expiration](test-254-azure-key-vaults-key-expiration.md)

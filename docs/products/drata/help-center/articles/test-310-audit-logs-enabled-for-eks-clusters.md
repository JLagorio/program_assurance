# Test 310: Audit Logs Enabled for EKS Clusters

Source: https://help.drata.com/en/articles/10375560-test-310-audit-logs-enabled-for-eks-clusters
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

Drata validates that audit logs are enabled for each EKS cluster in each region. Control plane logs provide visibility into operation of the EKS Control plane component
systems. The API server audit logs record all accepted and rejected requests in the
cluster. When enabled via EKS configuration the control plane logs for a cluster are
exported to a CloudWatch Log Group for persistence.

## ASSOCIATED DRATA CONTROL

This test is part of the DCF-406.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more EKS clusters does not have audit logs enabled, the test will fail.

### STEPS TO REMEDIATE

For each failing EKS cluster in each region:

1. Go to 'Amazon EKS' > 'Clusters' > [Select the EKS Cluster failing this test] > 'Observability' > 'Control plane'.
2. Select 'Manage logging'.
3. Ensure that all options are toggled to 'Enabled'.
4. Save your changes.

**Note**: Drata verifies if the list of EKS clusters has the property '`logging.enabled`' is '`true`'.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 245: Azure Log Alert for Delete Policy Assignment](test-245-azure-log-alert-for-delete-policy-assignment.md)
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
- [Test 256: Azure SQL Servers Auditing](test-256-azure-sql-servers-auditing.md)
- [Test 257: Azure PostgreSQL Database Server Log Checkpoints](test-257-azure-postgresql-database-server-log-checkpoints.md)

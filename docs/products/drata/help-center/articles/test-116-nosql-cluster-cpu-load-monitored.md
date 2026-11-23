# Test 116: NoSQL Cluster CPU Load Monitored

Source: https://help.drata.com/en/articles/10029043-test-116-nosql-cluster-cpu-load-monitored
Collection: Monitoring Test Guidance
Updated: 2025-01-13
Fetched: 2026-11-22
Description: Inspects NoSQL cluster monitor and alert configurations to determine if CPU load is monitored and alerts when defined thresholds are crossed

## Article text

Drata inspects NoSQL cluster monitoring and alerting configurations to determine if CPU load is monitored and alerts to personnel are sent when defined thresholds are crossed.

## ASSOCIATED DRATA CONTROL

This test is part of the **NoSQL Database Monitored and Alarmed **(DCF-83)control that ensures your company has implemented tools to monitor NoSQL databases and notify appropriate personnel of any events or incidents based on predetermined criteria. Incidents must also be escalated per policy requirements.

## WHAT TO DO IF A TEST FAILS

If it appears you do not have NoSQL cluster CPU load monitoring enabled or alerts are not configured for the following NoSQL Clusters, your test will fail.

### STEPS TO REMEDIATE

Configure NoSQL cluster CPU load monitoring and configure alerts to be sent to personnel when defined thresholds are crossed.

Note: Drata requests verification that CPU load is monitored and alerts are sent to personnel when thresholds are crossed on NoSQL clusters.

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)
- [Test 206: SQL Freeable Memory Monitored](test-206-sql-freeable-memory-monitored.md)

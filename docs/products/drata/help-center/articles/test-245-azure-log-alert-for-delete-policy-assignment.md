# Test 245: Azure Log Alert for Delete Policy Assignment

Source: https://help.drata.com/en/articles/9828840-test-245-azure-log-alert-for-delete-policy-assignment
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that an activity log alert for the 'Delete Policy Assignment' event exists in Azure.

## Article text

Monitoring for "Delete Policy Assignment" events gives insight into changes done in "azure policy - assignments" and can reduce the time it takes to detect unsolicited changes.

**Note**: Available for Azure Management Groups as well.

## ASSOCIATED DRATA CONTROL

This test is part of DCF-406, DCF-407, and DCF-86. The **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies. The **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there is no activity log alert for the 'Delete Policy Assignment' event in Azure, the test will fail. Monitoring for delete policy assignment events gives insight into changes done in 'Azure policy - assignments' and can reduce the time it takes to detect unsolicited changes.

## STEPS TO REMEDIATE

1. Navigate to the 'Monitor' blade.

2. Select 'Alerts' > 'Create' > 'Alert rule'.

3. Choose a subscription and select 'Apply'.

4. Select the 'Condition' tab and click 'See all signals'.

5. Select 'Delete policy assignment (Policy assignment)' and click 'Apply'.

6. Select the 'Actions' tab and click 'Select action groups' to select an existing action group, or 'Create action group' to create a new action group. Then follow the prompts to choose or create an action group.

7. Select the 'Details' tab.

8. Select a 'Resource group,' provide an 'Alert rule name' and an optional 'Alert rule description'.

9. Click 'Review + create' and then click 'Create'.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 243: Azure Log Alert for Create Policy Assignment](test-243-azure-log-alert-for-create-policy-assignment.md)
- [Test 244: Azure Log Alert for Delete Public IP Address](test-244-azure-log-alert-for-delete-public-ip-address.md)
- [Test 247: Azure Log Alert for Delete Network Security Group](test-247-azure-log-alert-for-delete-network-security-group.md)
- [Test 249: Azure Log Alert for Delete Security Solution](test-249-azure-log-alert-for-delete-security-solution.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)

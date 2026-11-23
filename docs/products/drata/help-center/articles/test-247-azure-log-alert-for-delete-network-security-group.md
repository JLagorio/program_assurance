# Test 247: Azure Log Alert for Delete Network Security Group

Source: https://help.drata.com/en/articles/9828842-test-247-azure-log-alert-for-delete-network-security-group
Collection: Monitoring Test Guidance
Updated: 2025-01-13
Fetched: 2026-11-22
Description: Drata validates that an activity log alert for the 'Delete Network Security Group' event exists in Azure.

## Article text

Monitoring for "Delete Network Security Group" events gives insight into network access changes and may reduce the time it takes to detect suspicious activity.

**Note**: Available for Azure Management Groups as well.

## ASSOCIATED DRATA CONTROL

This test is part of DCF-406, DCF-407, and DCF-86. The **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies. The **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent out personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there is no activity log alert for the 'Delete Network Security Group' event in Azure, the test will fail.

Monitoring for 'Delete Network Security Group' events gives insight into network access changes and may reduce the time it takes to detect suspicious activity.

### STEPS TO REMEDIATE

1. Navigate to the 'Monitor' blade.

2. Select 'Alerts' > 'Create' > 'Alert rule'.

3. Choose a subscription and select 'Apply'.

4. Select the 'Condition' tab and click 'See all signals'.

5. Select 'Delete Network Security Group (Network Security Group)' and click 'Apply'.

6. Select the 'Actions' tab and click 'Select action groups' to select an existing action group, or 'Create action group' to create a new action group. Then follow the prompts to choose or create an action group.

7. Select the 'Details' tab.

8. Select a 'Resource group,' provide an 'Alert rule name' and an optional 'Alert rule description'.

9. Click 'Review + create' and then click 'Create'.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 244: Azure Log Alert for Delete Public IP Address](test-244-azure-log-alert-for-delete-public-ip-address.md)
- [Test 245: Azure Log Alert for Delete Policy Assignment](test-245-azure-log-alert-for-delete-policy-assignment.md)
- [Test 246: Azure Log Alert for Create or Update Network Security Group](test-246-azure-log-alert-for-create-or-update-network-security-group.md)
- [Test 248: Azure Log Alert for Create or Update Security Solution](test-248-azure-log-alert-for-create-or-update-security-solution.md)
- [Test 249: Azure Log Alert for Delete Security Solution](test-249-azure-log-alert-for-delete-security-solution.md)

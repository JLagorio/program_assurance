# Test 243: Azure Log Alert for Create Policy Assignment

Source: https://help.drata.com/en/articles/9828827-test-243-azure-log-alert-for-create-policy-assignment
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that an activity log alert for the 'Create Policy Assignment' event exists in Azure.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies. This test is also part of **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there is no activity log alert for the 'Create Policy Assignment' event in Azure, the test will fail. Monitoring for create policy assignment events gives insight into changes done in 'Azure policy - assignments' and can reduce the time it takes to detect unsolicited changes.

**STEPS TO REMEDIATE**

1. Navigate to the 'Monitor' blade.

2. Select 'Alerts' > 'Create' > 'Alert rule'.

3. Choose a subscription and select 'Apply'.

4. Select the 'Condition' tab and click 'See all signals'.

5. Select 'Create policy assignment (Policy assignment)' and click 'Apply'.

6. Select the 'Actions' tab and click 'Select action groups' to select an existing action group, or 'Create action group' to create a new action group. Then follow the prompts to choose or create an action group.

7. Select the 'Details' tab.

8. Select a 'Resource group,' provide an 'Alert rule name' and an optional 'Alert rule description'.

9. Click 'Review + create' and then click 'Create'.

## Related articles

- [Test 245: Azure Log Alert for Delete Policy Assignment](test-245-azure-log-alert-for-delete-policy-assignment.md)
- [Test 246: Azure Log Alert for Create or Update Network Security Group](test-246-azure-log-alert-for-create-or-update-network-security-group.md)
- [Test 248: Azure Log Alert for Create or Update Security Solution](test-248-azure-log-alert-for-create-or-update-security-solution.md)
- [Test 249: Azure Log Alert for Delete Security Solution](test-249-azure-log-alert-for-delete-security-solution.md)
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)

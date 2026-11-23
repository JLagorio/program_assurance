# Test 252: Azure Log Alert for Create or Update Public IP Address rule

Source: https://help.drata.com/en/articles/9828850-test-252-azure-log-alert-for-create-or-update-public-ip-address-rule
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that an activity log alert for the 'Create or Update Public IP Address rule' event exists in Azure.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies. This test is also part of **System Monitoring **control (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent out to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there is no activity log alert for the 'Create or Update Public IP Address rule' event in Azure, the test will fail.

Monitoring for 'Create or Update Public IP Address' events gives insight into network access changes and may reduce the time it takes to detect suspicious activity.

**STEPS TO REMEDIATE**

1. Navigate to the 'Monitor' blade.

2. Select 'Alerts' > 'Create' > 'Alert rule'.

3. Choose a subscription and select 'Apply'.

4. Select the 'Condition' tab and click 'See all signals'.

5. Select 'Create or Update Public Ip Address (Public Ip Address)' and click 'Apply'.

6. Select the 'Actions' tab and click 'Select action groups' to select an existing action group, or 'Create action group' to create a new action group. Then follow the prompts to choose or create an action group.

7. Select the 'Details' tab.

8. Select a 'Resource group,' provide an 'Alert rule name' and an optional 'Alert rule description'.

9. Click 'Review + create' and then click 'Create'.

## Related articles

- [Test 243: Azure Log Alert for Create Policy Assignment](test-243-azure-log-alert-for-create-policy-assignment.md)
- [Test 244: Azure Log Alert for Delete Public IP Address](test-244-azure-log-alert-for-delete-public-ip-address.md)
- [Test 248: Azure Log Alert for Create or Update Security Solution](test-248-azure-log-alert-for-create-or-update-security-solution.md)
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
